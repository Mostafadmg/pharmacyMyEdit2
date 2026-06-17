import { Router, type IRouter } from "express";
import { db, consultationsTable, dmdGtinTable } from "@workspace/db";
import {
  PatchPmrWorkflowBody as PmrWorkflowPatchInput,
  PostPmrClinicalCheckBody as PmrClinicalCheckInput,
  PostPmrVerifyItemBody as PmrVerifyItemInput,
} from "@workspace/api-zod";
import { and, desc, eq } from "drizzle-orm";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";
import { jsonConsultation } from "../utils/apiResponse";
import { buildPickingLabelHtml } from "../utils/pickingLabelHtml";
import {
  catalogMatchesPrescriptionItem,
  expectedProductLabel,
  lookupDemoByBarcode,
  productLabel,
  type ScannedProduct,
} from "../utils/pmrMedicationCatalog";

const router: IRouter = Router();

const PMR_STATUSES = new Set([
  "inbox",
  "pick",
  "parked",
  "labelling",
  "pack",
  "dispatched",
]);

type PickVerifiedItem = {
  itemIndex: number;
  barcode: string;
  productName: string;
  batch?: string | null;
  expiry?: string | null;
  verifiedAt: string;
};

type PrescriptionItem = {
  name: string;
  strength?: string | null;
  form?: string | null;
};

function normalizeGtin(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 14) return digits.replace(/^0+/, "") || digits;
  if (digits.length === 12) return `0${digits}`;
  return digits;
}

async function lookupScannedProduct(
  barcode: string,
): Promise<ScannedProduct | null> {
  const demo = lookupDemoByBarcode(barcode);
  if (demo) {
    return {
      name: demo.name,
      strength: demo.strength,
      form: demo.form,
      source: "demo",
    };
  }

  const gtin = normalizeGtin(barcode);
  if (gtin.length >= 8) {
    const [row] = await db
      .select()
      .from(dmdGtinTable)
      .where(eq(dmdGtinTable.gtin, gtin))
      .limit(1);
    if (row) {
      return {
        name: row.productName,
        strength: row.strength ?? "",
        form: row.form ?? "",
        source: "dmd",
      };
    }
  }

  return null;
}

function parseVerifiedItems(raw: unknown): PickVerifiedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is PickVerifiedItem =>
      !!item &&
      typeof item === "object" &&
      typeof (item as PickVerifiedItem).itemIndex === "number" &&
      typeof (item as PickVerifiedItem).barcode === "string",
  );
}

function pickingCodeFor(row: typeof consultationsTable.$inferSelect): string {
  if (row.pickingLabelCode) return row.pickingLabelCode;
  const ref = row.consultationNumber?.replace(/\s+/g, "") ?? row.id.slice(0, 8);
  return `PICK-${ref}`;
}

async function loadApprovedConsultation(id: string) {
  const [row] = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.id, id));
  if (!row || row.status !== "approved") return null;
  return row;
}

router.get(
  "/pmr/consultations",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const statusFilter = String(req.query.pmrWorkflowStatus ?? "").trim();
    const limit = Math.min(
      Math.max(Number(req.query.limit ?? 200) || 200, 1),
      500,
    );

    const conditions = [eq(consultationsTable.status, "approved")];
    if (statusFilter && PMR_STATUSES.has(statusFilter)) {
      conditions.push(eq(consultationsTable.pmrWorkflowStatus, statusFilter));
    }

    const rows = await db
      .select()
      .from(consultationsTable)
      .where(and(...conditions))
      .orderBy(desc(consultationsTable.pmrWorkflowUpdatedAt))
      .limit(limit);

    res.json({ consultations: rows.map(jsonConsultation) });
  },
);

router.get(
  "/pmr/consultations/by-pick-code/:code",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const code = Array.isArray(req.params.code)
      ? req.params.code[0]
      : req.params.code;
    if (!code) {
      res.status(400).json({ error: "Pick code required" });
      return;
    }

    const [row] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.pickingLabelCode, code));

    if (!row) {
      res.status(404).json({ error: "No prescription found for this pick label" });
      return;
    }

    res.json(jsonConsultation(row));
  },
);

router.patch(
  "/pmr/consultations/:id/workflow",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = PmrWorkflowPatchInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const row = await loadApprovedConsultation(id);
    if (!row) {
      res.status(404).json({ error: "Approved consultation not found" });
      return;
    }

    const now = new Date();
    const [updated] = await db
      .update(consultationsTable)
      .set({
        pmrWorkflowStatus: parsed.data.status,
        pmrWorkflowUpdatedAt: now,
      })
      .where(eq(consultationsTable.id, id))
      .returning();

    res.json(jsonConsultation(updated!));
  },
);

router.post(
  "/pmr/consultations/:id/clinical-check",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = PmrClinicalCheckInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const row = await loadApprovedConsultation(id);
    if (!row) {
      res.status(404).json({ error: "Approved consultation not found" });
      return;
    }

    if (row.rxClinicalCheckComplete) {
      res.status(409).json({
        error: "Rx already clinically checked — ready to pick without PMR check.",
      });
      return;
    }

    const now = new Date();
    const pharmacist = req.authActor?.name ?? "Pharmacist";
    const nextStatus =
      parsed.data.action === "do_not_dispense" ? "parked" : "pick";

    const [updated] = await db
      .update(consultationsTable)
      .set({
        pmrWorkflowStatus: nextStatus,
        pmrClinicalCheckAt: now,
        pmrClinicalCheckBy: pharmacist,
        pmrWorkflowUpdatedAt: now,
        pharmacistNote:
          parsed.data.note?.trim() || row.pharmacistNote || null,
      })
      .where(eq(consultationsTable.id, id))
      .returning();

    res.json(jsonConsultation(updated!));
  },
);

router.post(
  "/pmr/consultations/:id/picking-label",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const row = await loadApprovedConsultation(id);
    if (!row) {
      res.status(404).json({ error: "Approved consultation not found" });
      return;
    }

    const code = pickingCodeFor(row);
    const now = new Date();

    const nextStatus =
      row.pmrWorkflowStatus === "dispatched"
        ? "dispatched"
        : row.pmrWorkflowStatus === "pack"
          ? "pack"
          : "labelling";

    const [updated] = await db
      .update(consultationsTable)
      .set({
        pickingLabelCode: code,
        pmrWorkflowUpdatedAt: now,
        pmrWorkflowStatus: nextStatus,
      })
      .where(eq(consultationsTable.id, id))
      .returning();

    const html = buildPickingLabelHtml(updated!, code);
    res.json({
      pickingLabelCode: code,
      html,
      consultation: jsonConsultation(updated!),
    });
  },
);

router.post(
  "/pmr/consultations/:id/verify-item",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = PmrVerifyItemInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const row = await loadApprovedConsultation(id);
    if (!row) {
      res.status(404).json({ error: "Approved consultation not found" });
      return;
    }

    const items = (row.prescriptionItems ?? []) as PrescriptionItem[];
    if (items.length === 0) {
      res.status(400).json({ error: "No prescription items to verify" });
      return;
    }

    const scanned = await lookupScannedProduct(parsed.data.barcode);
    const verified = parseVerifiedItems(row.pickVerifiedItems);
    const verifiedIndexes = new Set(verified.map((v) => v.itemIndex));

    if (!scanned) {
      res.json({
        match: false,
        itemIndex: null,
        expectedProduct: null,
        scannedProduct: parsed.data.barcode,
        pickVerifiedItems: verified,
        allVerified: false,
      });
      return;
    }

    const demoEntry = lookupDemoByBarcode(parsed.data.barcode);
    let matchIndex = -1;

    if (parsed.data.itemIndex != null) {
      const idx = parsed.data.itemIndex;
      const item = items[idx];
      if (
        item &&
        !verifiedIndexes.has(idx) &&
        demoEntry &&
        catalogMatchesPrescriptionItem(demoEntry, item)
      ) {
        matchIndex = idx;
      } else if (item && !verifiedIndexes.has(idx)) {
        const haystack =
          `${item.name} ${item.strength ?? ""} ${item.form ?? ""}`.toLowerCase();
        const needle = productLabel(scanned).toLowerCase();
        if (haystack.includes(scanned.name.toLowerCase())) {
          matchIndex = idx;
        } else if (needle && haystack.includes(scanned.name.toLowerCase())) {
          matchIndex = idx;
        }
      }
    } else {
      matchIndex = items.findIndex((item, idx) => {
        if (verifiedIndexes.has(idx)) return false;
        if (demoEntry && catalogMatchesPrescriptionItem(demoEntry, item)) {
          return true;
        }
        const haystack =
          `${item.name} ${item.strength ?? ""} ${item.form ?? ""}`.toLowerCase();
        return haystack.includes(scanned.name.toLowerCase());
      });
    }

    if (matchIndex < 0) {
      const expected = items.find((_, idx) => !verifiedIndexes.has(idx));
      res.json({
        match: false,
        itemIndex: null,
        expectedProduct: expected ? expectedProductLabel(expected) : null,
        scannedProduct: productLabel(scanned),
        pickVerifiedItems: verified,
        allVerified: false,
      });
      return;
    }

    const entry: PickVerifiedItem = {
      itemIndex: matchIndex,
      barcode: parsed.data.barcode.trim(),
      productName: productLabel(scanned),
      verifiedAt: new Date().toISOString(),
    };
    const nextVerified = [
      ...verified.filter((v) => v.itemIndex !== matchIndex),
      entry,
    ];
    const allVerified = items.every((_, idx) =>
      nextVerified.some((v) => v.itemIndex === idx),
    );

    const [updated] = await db
      .update(consultationsTable)
      .set({
        pickVerifiedItems: nextVerified,
        pmrWorkflowStatus: "labelling",
        pmrWorkflowUpdatedAt: new Date(),
      })
      .where(eq(consultationsTable.id, id))
      .returning();

    res.json({
      match: true,
      itemIndex: matchIndex,
      expectedProduct: expectedProductLabel(items[matchIndex]!),
      scannedProduct: productLabel(scanned),
      pickVerifiedItems: parseVerifiedItems(updated!.pickVerifiedItems),
      allVerified,
    });
  },
);

router.post(
  "/pmr/consultations/:id/dispatch",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const row = await loadApprovedConsultation(id);
    if (!row) {
      res.status(404).json({ error: "Approved consultation not found" });
      return;
    }

    const now = new Date();
    const [updated] = await db
      .update(consultationsTable)
      .set({
        pmrWorkflowStatus: "dispatched",
        pmrWorkflowUpdatedAt: now,
        dispatchedAt: row.dispatchedAt ?? now,
      })
      .where(eq(consultationsTable.id, id))
      .returning();

    res.json(jsonConsultation(updated!));
  },
);

export default router;

import { Router, type IRouter, type Response } from "express";
import { db, consultationsTable, complaintsTable, auditLogsTable, patientAccountsTable } from "@workspace/db";
import { eq, desc, and, gte, sql, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendConsultationOutcomeEmail } from "../utils/email";
import { requirePharmacist, requirePatient, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// ─── Audit ──────────────────────────────────────────────────────────────────
async function logAudit(opts: {
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  actorRole: string;
  details?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      entityType: opts.entityType,
      entityId: opts.entityId,
      action: opts.action,
      actor: opts.actor,
      actorRole: opts.actorRole,
      details: opts.details ?? {},
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

// ─── Risk classification (GPhC 4.2j) ────────────────────────────────────────
const HIGH_RISK_CONDITION_IDS = new Set<string>([
  "weight-loss", "weight_loss", "weight-management",
  "erectile-dysfunction", "premature-ejaculation",
  "pain-relief", "migraines", "migraine",
  "asthma", "hayfever-asthma",
  "anxiety", "insomnia", "sleep",
  "smoking-cessation",
  "uti", "urinary-tract-infection",
  "thrush", "bacterial-vaginosis",
]);

const ANTIMICROBIAL_CONDITION_IDS = new Set<string>([
  "uti", "urinary-tract-infection", "thrush", "bacterial-vaginosis",
  "chlamydia", "acne", "rosacea",
]);

const WEIGHT_MGMT_CONDITION_IDS = new Set<string>(["weight-loss", "weight_loss", "weight-management"]);

function classifyRisk(conditionId: string): { category: "low" | "medium" | "high"; flags: string[] } {
  const flags: string[] = [];
  let category: "low" | "medium" | "high" = "low";
  if (HIGH_RISK_CONDITION_IDS.has(conditionId)) category = "medium";
  if (ANTIMICROBIAL_CONDITION_IDS.has(conditionId)) {
    category = "high";
    flags.push("antimicrobial_stewardship");
  }
  if (WEIGHT_MGMT_CONDITION_IDS.has(conditionId)) {
    category = "high";
    flags.push("weight_management_independent_verification_needed");
  }
  return { category, flags };
}

// Flags that warrant escalating risk to "high" regardless of condition
const HIGH_RISK_FLAGS = new Set<string>([
  "frequent_orders_same_patient",
  "repeated_request_same_condition",
  "repeated_antimicrobial_request",
  "multiple_accounts_same_address",
  "no_regular_gp",
  "declined_share_with_gp",
]);

function escalateRisk(
  base: "low" | "medium" | "high",
  allFlags: string[],
  hasRedFlag: boolean,
): "low" | "medium" | "high" {
  if (hasRedFlag) return "high";
  if (allFlags.some((f) => HIGH_RISK_FLAGS.has(f))) return "high";
  if (base === "low" && allFlags.length > 0) return "medium";
  return base;
}

// Auto-detect inappropriate request patterns (GPhC 4.2h)
async function computeSafeguardFlags(opts: {
  patientEmail: string;
  conditionId: string;
  deliveryAddress?: string | null;
}): Promise<string[]> {
  const flags: string[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const sameEmailRecent = await db
    .select({ id: consultationsTable.id, conditionId: consultationsTable.conditionId, createdAt: consultationsTable.createdAt })
    .from(consultationsTable)
    .where(
      and(
        eq(consultationsTable.patientEmail, opts.patientEmail),
        gte(consultationsTable.createdAt, thirtyDaysAgo),
      ),
    );
  if (sameEmailRecent.length >= 3) flags.push("frequent_orders_same_patient");

  const sameCondition = sameEmailRecent.filter((c) => c.conditionId === opts.conditionId);
  if (sameCondition.length >= 2) flags.push("repeated_request_same_condition");
  if (sameCondition.length >= 1 && ANTIMICROBIAL_CONDITION_IDS.has(opts.conditionId)) {
    flags.push("repeated_antimicrobial_request");
  }

  if (opts.deliveryAddress && opts.deliveryAddress.trim().length > 5) {
    const sameAddress = await db
      .select({ id: consultationsTable.id, email: consultationsTable.patientEmail })
      .from(consultationsTable)
      .where(
        and(
          eq(consultationsTable.deliveryAddress, opts.deliveryAddress),
          ne(consultationsTable.patientEmail, opts.patientEmail),
          gte(consultationsTable.createdAt, thirtyDaysAgo),
        ),
      );
    const distinctOthers = new Set(sameAddress.map((s) => s.email.toLowerCase()));
    if (distinctOthers.size >= 1) flags.push("multiple_accounts_same_address");
  }

  return flags;
}

// ─── POST /api/compliance/consultations ────────────────────────────────────
// Public endpoint (patient may not be logged in for first visit). Identity is
// captured server-side via the supplied identityVerificationRef + IP/email.
router.post("/compliance/consultations", async (req, res): Promise<void> => {
  try {
    const b = req.body ?? {};
    const required = ["conditionId", "patientName", "patientEmail", "patientAge", "patientSex"];
    for (const k of required) {
      if (!b[k]) {
        res.status(400).json({ error: `Missing field: ${k}` });
        return;
      }
    }

    const { conditionsTable } = await import("@workspace/db");
    const [condition] = await db
      .select({ name: conditionsTable.name })
      .from(conditionsTable)
      .where(eq(conditionsTable.id, b.conditionId));
    if (!condition) {
      res.status(400).json({ error: "Condition not found" });
      return;
    }

    const id = randomUUID();
    const { category: baseCategory, flags: baseFlags } = classifyRisk(b.conditionId);
    const safeguardFlags = await computeSafeguardFlags({
      patientEmail: b.patientEmail,
      conditionId: b.conditionId,
      deliveryAddress: b.deliveryAddress ?? null,
    });
    const allFlags = Array.from(new Set([...baseFlags, ...safeguardFlags]));
    if (b.hasRegularGp === false) allFlags.push("no_regular_gp");
    if (b.consentShareWithGp === false && b.hasRegularGp !== false) allFlags.push("declined_share_with_gp");

    const RED_FLAG_KEYWORDS = [
      "chest pain", "difficulty breathing", "severe headache", "vision loss",
      "loss of consciousness", "paralysis", "severe allergic", "anaphylaxis",
      "suicidal", "self-harm", "blood in stool", "coughing blood",
    ];
    const answersStr = JSON.stringify(b.answers ?? {}).toLowerCase();
    const hasRedFlag = RED_FLAG_KEYWORDS.some((f) => answersStr.includes(f));

    const riskCategory = escalateRisk(baseCategory, allFlags, hasRedFlag);

    let bmi: number | null = null;
    if (b.verifiedHeightCm && b.verifiedWeightKg) {
      const m = (b.verifiedHeightCm as number) / 100;
      bmi = Math.round((b.verifiedWeightKg as number) / (m * m));
    }

    const [consultation] = await db
      .insert(consultationsTable)
      .values({
        id,
        patientName: b.patientName,
        patientEmail: b.patientEmail,
        patientAge: b.patientAge,
        patientSex: b.patientSex,
        conditionId: b.conditionId,
        conditionName: condition.name,
        status: hasRedFlag ? "red_flag" : "pending",
        answers: b.answers ?? {},
        hasRedFlag,
        hasPhoto: !!b.hasPhoto,
        isPregnant: b.isPregnant ?? null,
        allergies: b.allergies ?? null,
        currentMedications: b.currentMedications ?? null,
        medicalHistory: b.medicalHistory ?? null,
        identityVerificationMethod: b.identityVerificationMethod ?? null,
        identityVerificationRef: b.identityVerificationRef ?? null,
        identityVerifiedAt: b.identityVerificationMethod ? new Date() : null,
        gpName: b.gpName ?? null,
        gpSurgery: b.gpSurgery ?? null,
        gpAddress: b.gpAddress ?? null,
        gpPhone: b.gpPhone ?? null,
        hasRegularGp: b.hasRegularGp ?? true,
        consentShareWithGp: !!b.consentShareWithGp,
        consentToTreatment: !!b.consentToTreatment,
        consentToDelivery: !!b.consentToDelivery,
        consentDataProcessing: !!b.consentDataProcessing,
        preferredDeliveryMethod: b.preferredDeliveryMethod ?? null,
        deliveryAddress: b.deliveryAddress ?? null,
        riskFlags: allFlags,
        riskCategory,
        verifiedHeightCm: b.verifiedHeightCm ?? null,
        verifiedWeightKg: b.verifiedWeightKg ?? null,
        bmi,
      })
      .returning();

    await logAudit({
      entityType: "consultation",
      entityId: id,
      action: "created",
      actor: b.patientEmail,
      actorRole: "patient",
      details: {
        conditionId: b.conditionId,
        riskCategory,
        riskFlags: allFlags,
        hasRedFlag,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.status(201).json(consultation);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Compliance consultation create failed:", err);
    res.status(500).json({ error: msg });
  }
});

// ─── PUT /api/compliance/consultations/:id/delivery ─ pharmacist only ─────
router.put("/compliance/consultations/:id/delivery", requirePharmacist, async (req: AuthedRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const b = req.body ?? {};
  const set: Record<string, unknown> = {};

  // Accept either status shorthand or explicit fields
  const status = (b.status as string | undefined)?.toLowerCase();
  if (status === "dispatched") set.dispatchedAt = new Date();
  if (status === "delivered") {
    set.deliveredAt = new Date();
    if (!set.dispatchedAt) set.dispatchedAt = new Date();
  }

  if (b.deliveryCarrier !== undefined) set.deliveryCarrier = b.deliveryCarrier;
  if (b.deliveryTrackingNumber !== undefined) set.deliveryTrackingNumber = b.deliveryTrackingNumber;
  if (b.dispatched === true || b.dispatchedAt) {
    set.dispatchedAt = b.dispatchedAt ? new Date(b.dispatchedAt) : new Date();
  }
  if (b.delivered === true || b.deliveredAt) {
    set.deliveredAt = b.deliveredAt ? new Date(b.deliveredAt) : new Date();
  }
  if (b.deliveryConfirmation !== undefined) set.deliveryConfirmation = b.deliveryConfirmation;

  if (Object.keys(set).length === 0) {
    res.status(400).json({ error: "No delivery fields to update" });
    return;
  }

  const [updated] = await db
    .update(consultationsTable)
    .set(set)
    .where(eq(consultationsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }

  await logAudit({
    entityType: "consultation",
    entityId: id,
    action: set.deliveredAt ? "delivered" : (set.dispatchedAt ? "dispatched" : "delivery_updated"),
    actor: req.authActor!.id,
    actorRole: "pharmacist",
    details: { ...set, actorName: req.authActor!.name } as Record<string, unknown>,
  });
  res.json(updated);
});

// ─── PUT /api/compliance/consultations/:id/share-with-gp ─ pharmacist only ─
router.put("/compliance/consultations/:id/share-with-gp", requirePharmacist, async (req: AuthedRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const [updated] = await db
    .update(consultationsTable)
    .set({ sharedWithGpAt: new Date() })
    .where(eq(consultationsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  await logAudit({
    entityType: "consultation",
    entityId: id,
    action: "shared_with_gp",
    actor: req.authActor!.id,
    actorRole: "pharmacist",
    details: { gpName: updated.gpName, gpSurgery: updated.gpSurgery, actorName: req.authActor!.name },
  });
  res.json(updated);
});

// ─── GET /api/compliance/consultations/:id/audit ─ pharmacist only ────────
router.get("/compliance/consultations/:id/audit", requirePharmacist, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(and(eq(auditLogsTable.entityType, "consultation"), eq(auditLogsTable.entityId, id)))
    .orderBy(desc(auditLogsTable.createdAt));
  res.json({ logs });
});

// ═══ COMPLAINTS (mounted under /api/compliance/complaints) ══════════════════
// Patient-facing creation is open; staff-facing read/update requires pharmacist auth.

router.post("/compliance/complaints", async (req, res): Promise<void> => {
  const b = req.body ?? {};
  if (!b.patientName || !b.patientEmail || !b.subject || !b.message) {
    res.status(400).json({ error: "Name, email, subject and message are required" });
    return;
  }
  const id = randomUUID();
  const [complaint] = await db
    .insert(complaintsTable)
    .values({
      id,
      type: (b.type as string) || "complaint",
      patientName: b.patientName,
      patientEmail: b.patientEmail,
      patientPhone: b.patientPhone ?? null,
      consultationRef: b.consultationRef ?? null,
      subject: b.subject,
      message: b.message,
    })
    .returning();
  await logAudit({
    entityType: "complaint",
    entityId: id,
    action: "created",
    actor: b.patientEmail,
    actorRole: "patient",
    details: { type: complaint.type, subject: complaint.subject, ip: req.ip },
  });
  res.status(201).json(complaint);
});

router.get("/compliance/complaints", requirePharmacist, async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const where = status ? eq(complaintsTable.status, status) : undefined;
  const complaints = await db
    .select()
    .from(complaintsTable)
    .where(where)
    .orderBy(desc(complaintsTable.createdAt));
  res.json({ complaints, total: complaints.length });
});

router.get("/compliance/complaints/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id));
  if (!complaint) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }
  res.json(complaint);
});

router.put("/compliance/complaints/:id", requirePharmacist, async (req: AuthedRequest, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "ID required" });
    return;
  }
  const b = req.body ?? {};
  const set: Record<string, unknown> = {};
  if (b.status) set.status = b.status;
  if (b.responseNote !== undefined) set.responseNote = b.responseNote;
  // Always derive responder from auth context (not from body — prevents spoofing)
  set.respondedBy = req.authActor!.id;
  if (b.responseNote || b.status === "resolved" || b.status === "closed") {
    set.respondedAt = new Date();
  }

  if (Object.keys(set).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db
    .update(complaintsTable)
    .set(set)
    .where(eq(complaintsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }
  await logAudit({
    entityType: "complaint",
    entityId: id,
    action: "updated",
    actor: req.authActor!.id,
    actorRole: "pharmacist",
    details: { ...set, actorName: req.authActor!.name } as Record<string, unknown>,
  });
  res.json(updated);
});

// ═══ PATIENT GP DETAILS (patient self-service) ══════════════════════════════

router.put("/compliance/patient/gp-details", requirePatient, async (req: AuthedRequest, res): Promise<void> => {
  const patientId = req.authActor!.id;
  const b = req.body ?? {};
  const [updated] = await db
    .update(patientAccountsTable)
    .set({
      gpName: b.gpName ?? null,
      gpSurgery: b.gpSurgery ?? null,
      gpAddress: b.gpAddress ?? null,
      gpPhone: b.gpPhone ?? null,
    })
    .where(eq(patientAccountsTable.id, patientId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  await logAudit({
    entityType: "patient",
    entityId: patientId,
    action: "gp_details_updated",
    actor: patientId,
    actorRole: "patient",
    details: { gpName: updated.gpName, gpSurgery: updated.gpSurgery },
  });
  res.json({
    gpName: updated.gpName,
    gpSurgery: updated.gpSurgery,
    gpAddress: updated.gpAddress,
    gpPhone: updated.gpPhone,
  });
});

router.get("/compliance/patient/gp-details", requirePatient, async (req: AuthedRequest, res): Promise<void> => {
  const patientId = req.authActor!.id;
  const [patient] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, patientId));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json({
    gpName: patient.gpName,
    gpSurgery: patient.gpSurgery,
    gpAddress: patient.gpAddress,
    gpPhone: patient.gpPhone,
  });
});

export default router;

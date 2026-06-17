import { Router, type IRouter, type Response } from "express";
import { db, dmdGtinTable } from "@workspace/db";
import { PmrScanLookupResponse } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function normalizeGtinQuery(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 14) return digits.replace(/^0+/, "") || digits;
  if (digits.length === 13) return digits;
  if (digits.length === 12) return `0${digits}`;
  return digits;
}

router.get(
  "/pmr/scan-lookup",
  requirePharmacist,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const raw = String(req.query.gtin ?? "").trim();
    if (!raw) {
      res.status(400).json({ error: "gtin query parameter is required" });
      return;
    }

    const gtin = normalizeGtinQuery(raw);
    const [row] = await db
      .select()
      .from(dmdGtinTable)
      .where(eq(dmdGtinTable.gtin, gtin))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: `GTIN ${gtin} not found in dm+d index` });
      return;
    }

    res.json(
      PmrScanLookupResponse.parse({
        gtin: row.gtin,
        amppId: row.amppId,
        vmpId: row.vmpId,
        name: row.productName,
        strength: row.strength,
        form: row.form,
        supplier: row.supplier,
        discontinued: row.discontinued,
        source: "dmd",
      }),
    );
  },
);

export default router;

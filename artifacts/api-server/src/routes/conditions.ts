import { Router, type IRouter } from "express";
import { db, conditionsTable } from "@workspace/db";
import {
  GetConditionParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { requirePharmacist } from "../middlewares/auth";
import { jsonCondition } from "../utils/apiResponse";

const router: IRouter = Router();

router.get("/conditions", async (_req, res): Promise<void> => {
  const conditions = await db.select().from(conditionsTable).orderBy(conditionsTable.name);
  res.json(conditions.map(jsonCondition));
});

router.get("/conditions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetConditionParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [condition] = await db
    .select()
    .from(conditionsTable)
    .where(eq(conditionsTable.id, params.data.id));

  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }

  res.json(jsonCondition(condition));
});

// Admin: rich list including questions builder fields (raw, no zod parsing)
router.get("/admin/conditions", requirePharmacist, async (_req, res): Promise<void> => {
  const conditions = await db.select().from(conditionsTable).orderBy(conditionsTable.name);
  res.json({ conditions });
});

router.get("/admin/conditions/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [condition] = await db.select().from(conditionsTable).where(eq(conditionsTable.id, id));
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  res.json({ condition });
});

router.patch("/admin/conditions/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const b = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  const allowed = ["name", "category", "description", "onlineEligible", "requiresPhoto", "requiresInPerson", "ageRestrictions", "redFlags", "questionsJson", "priceGbp", "active"];
  for (const k of allowed) {
    if (k in b) update[k] = b[k];
  }
  if ("questionsJson" in update) {
    if (!Array.isArray(update.questionsJson)) {
      res.status(400).json({ error: "questionsJson must be an array" });
      return;
    }
    update.questionsCount = (update.questionsJson as unknown[]).length;
  }
  if (typeof update.priceGbp === "number") update.priceGbp = Math.round(update.priceGbp);

  const [condition] = await db.update(conditionsTable).set(update).where(eq(conditionsTable.id, id)).returning();
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  res.json({ condition });
});

router.post("/admin/conditions", requirePharmacist, async (req, res): Promise<void> => {
  const b = req.body as Record<string, unknown>;
  const id = String(b.id ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  const name = String(b.name ?? "").trim();
  const category = String(b.category ?? "").trim();
  if (!id || !name || !category) {
    res.status(400).json({ error: "id, name, category required" });
    return;
  }
  const questions = Array.isArray(b.questionsJson) ? (b.questionsJson as unknown[]) : [];
  try {
    const [condition] = await db.insert(conditionsTable).values({
      id,
      name,
      category,
      description: String(b.description ?? ""),
      onlineEligible: b.onlineEligible !== false,
      requiresPhoto: b.requiresPhoto === true,
      requiresInPerson: b.requiresInPerson === true,
      ageRestrictions: (b.ageRestrictions as string) || null,
      redFlags: Array.isArray(b.redFlags) ? (b.redFlags as string[]) : [],
      questionsCount: questions.length,
      questionsJson: questions,
      priceGbp: typeof b.priceGbp === "number" ? Math.round(b.priceGbp) : 2500,
      active: b.active !== false,
    }).returning();
    res.status(201).json({ condition });
  } catch {
    res.status(409).json({ error: "Condition id must be unique" });
  }
});

export default router;

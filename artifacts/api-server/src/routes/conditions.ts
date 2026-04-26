import { Router, type IRouter } from "express";
import { db, conditionsTable } from "@workspace/db";
import {
  ListConditionsResponse,
  GetConditionParams,
  GetConditionResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/conditions", async (_req, res): Promise<void> => {
  const conditions = await db.select().from(conditionsTable).orderBy(conditionsTable.name);
  res.json(ListConditionsResponse.parse(conditions));
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

  res.json(GetConditionResponse.parse(condition));
});

export default router;

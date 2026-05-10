import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import {
  db,
  drugInteractionsTable,
  clinicalRepliesTable,
  consultationsTable,
  ordersTable,
  patientAccountsTable,
  productsTable,
  consultationActionsTable,
} from "@workspace/db";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Drug interaction check
// ─────────────────────────────────────────────────────────────────────────────
const InteractionCheckBody = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
    }),
  ),
  patientMedications: z.array(z.string()).optional(),
});

export type InteractionWarning = {
  id: string;
  drugA: string;
  drugB: string;
  severity: "contraindicated" | "major" | "moderate" | "minor";
  mechanism: string;
  advice: string;
  source: string;
};

const SEVERITY_RANK: Record<string, number> = {
  contraindicated: 4,
  major: 3,
  moderate: 2,
  minor: 1,
};

/** Pure function — exported for reuse by the approve handler. */
export async function checkDrugInteractions(
  prescribedNames: string[],
  patientMedications: string[] = [],
): Promise<InteractionWarning[]> {
  // Only flag interactions where AT LEAST ONE side is a newly-prescribed drug.
  // Pre-existing patient-vs-patient interactions are out of scope for this approval.
  const norm = (s: string) => s.trim().toLowerCase();
  const prescribedSet = new Set(prescribedNames.map(norm).filter(Boolean));
  const all = Array.from(
    new Set([...prescribedNames, ...patientMedications].map(norm).filter(Boolean)),
  );
  if (all.length < 2 && patientMedications.length === 0) return [];

  const rules = await db.select().from(drugInteractionsTable);
  const warnings: InteractionWarning[] = [];

  for (const rule of rules) {
    const a = norm(rule.drugA);
    const b = norm(rule.drugB);
    const aIn = all.includes(a);
    const bIn = all.includes(b);
    if (aIn && bIn) {
      const aN = norm(rule.drugA);
      const bN = norm(rule.drugB);
      if (!prescribedSet.has(aN) && !prescribedSet.has(bN)) continue;
      warnings.push({
        id: rule.id,
        drugA: rule.drugA,
        drugB: rule.drugB,
        severity: rule.severity as InteractionWarning["severity"],
        mechanism: rule.mechanism,
        advice: rule.advice,
        source: rule.source,
      });
    }
  }

  warnings.sort(
    (x, y) => (SEVERITY_RANK[y.severity] ?? 0) - (SEVERITY_RANK[x.severity] ?? 0),
  );
  return warnings;
}

router.post("/pharmacist/drug-interactions/check", requirePharmacist, async (req, res): Promise<void> => {
  const parsed = InteractionCheckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const names = parsed.data.items.map((i) => i.name);
  const warnings = await checkDrugInteractions(names, parsed.data.patientMedications ?? []);
  const blocking = warnings.some((w) => w.severity === "contraindicated");
  res.json({ warnings, blocking, count: warnings.length });
});

// ─────────────────────────────────────────────────────────────────────────────
// Clinical reply templates (CRUD)
// ─────────────────────────────────────────────────────────────────────────────
const ClinicalReplyBody = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1),
  conditionId: z.string().nullish(),
  statusContext: z.string().nullish(),
  category: z.enum(["general", "safety", "admin", "follow_up"]).default("general"),
});

router.get("/pharmacist/clinical-replies", requirePharmacist, async (req, res): Promise<void> => {
  const conditionId = typeof req.query.conditionId === "string" ? req.query.conditionId : undefined;
  const statusContext = typeof req.query.statusContext === "string" ? req.query.statusContext : undefined;
  const rows = await db
    .select()
    .from(clinicalRepliesTable)
    .where(
      and(
        conditionId ? or(eq(clinicalRepliesTable.conditionId, conditionId), isNull(clinicalRepliesTable.conditionId)) : sql`true`,
        statusContext ? or(eq(clinicalRepliesTable.statusContext, statusContext), isNull(clinicalRepliesTable.statusContext)) : sql`true`,
      ),
    )
    .orderBy(desc(clinicalRepliesTable.useCount), desc(clinicalRepliesTable.createdAt));
  res.json({ replies: rows });
});

router.post("/pharmacist/clinical-replies", requirePharmacist, async (req: AuthedRequest, res): Promise<void> => {
  const parsed = ClinicalReplyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(clinicalRepliesTable)
    .values({
      id: randomUUID(),
      title: parsed.data.title,
      body: parsed.data.body,
      conditionId: parsed.data.conditionId ?? null,
      statusContext: parsed.data.statusContext ?? null,
      category: parsed.data.category,
      createdBy: req.authActor?.name ?? "Pharmacist",
    })
    .returning();
  res.status(201).json(row);
});

router.put("/pharmacist/clinical-replies/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id required" });
    return;
  }
  const parsed = ClinicalReplyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(clinicalRepliesTable)
    .set({
      title: parsed.data.title,
      body: parsed.data.body,
      conditionId: parsed.data.conditionId ?? null,
      statusContext: parsed.data.statusContext ?? null,
      category: parsed.data.category,
    })
    .where(eq(clinicalRepliesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(row);
});

router.delete("/pharmacist/clinical-replies/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id required" });
    return;
  }
  await db.delete(clinicalRepliesTable).where(eq(clinicalRepliesTable.id, id));
  res.status(204).send();
});

router.post("/pharmacist/clinical-replies/:id/use", requirePharmacist, async (req, res): Promise<void> => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ error: "id required" });
    return;
  }
  await db
    .update(clinicalRepliesTable)
    .set({ useCount: sql`${clinicalRepliesTable.useCount} + 1` })
    .where(eq(clinicalRepliesTable.id, id));
  res.status(204).send();
});

// ─────────────────────────────────────────────────────────────────────────────
// Cmd-K global search
// ─────────────────────────────────────────────────────────────────────────────
router.get("/pharmacist/search", requirePharmacist, async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.json({ consultations: [], patients: [], orders: [] });
    return;
  }
  const like = `%${q.toLowerCase()}%`;

  const [consults, patients, orders] = await Promise.all([
    db
      .select({
        id: consultationsTable.id,
        patientName: consultationsTable.patientName,
        patientEmail: consultationsTable.patientEmail,
        conditionName: consultationsTable.conditionName,
        status: consultationsTable.status,
        createdAt: consultationsTable.createdAt,
      })
      .from(consultationsTable)
      .where(
        or(
          sql`lower(${consultationsTable.patientName}) like ${like}`,
          sql`lower(${consultationsTable.patientEmail}) like ${like}`,
          sql`lower(${consultationsTable.conditionName}) like ${like}`,
          sql`lower(${consultationsTable.id}) like ${like}`,
        ),
      )
      .orderBy(desc(consultationsTable.createdAt))
      .limit(8),
    db
      .select({
        id: patientAccountsTable.id,
        name: patientAccountsTable.name,
        email: patientAccountsTable.email,
      })
      .from(patientAccountsTable)
      .where(
        or(
          sql`lower(${patientAccountsTable.name}) like ${like}`,
          sql`lower(${patientAccountsTable.email}) like ${like}`,
        ),
      )
      .limit(8),
    db
      .select({
        id: ordersTable.id,
        patientName: ordersTable.customerName,
        patientEmail: ordersTable.customerEmail,
        status: ordersTable.status,
        totalGbp: ordersTable.totalGbp,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .where(
        or(
          sql`lower(${ordersTable.id}) like ${like}`,
          sql`lower(${ordersTable.customerName}) like ${like}`,
          sql`lower(${ordersTable.customerEmail}) like ${like}`,
        ),
      )
      .orderBy(desc(ordersTable.createdAt))
      .limit(8),
  ]);

  res.json({ consultations: consults, patients, orders });
});

// ─────────────────────────────────────────────────────────────────────────────
// Analytics KPI dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get("/pharmacist/analytics", requirePharmacist, async (_req, res): Promise<void> => {
  const now = new Date();
  const dayMs = 86_400_000;
  const last7 = new Date(now.getTime() - 7 * dayMs);
  const last30 = new Date(now.getTime() - 30 * dayMs);
  const prev7 = new Date(now.getTime() - 14 * dayMs);

  const [
    consults7d,
    consultsPrev7d,
    approvalSplit,
    pendingNow,
    avgApprovalSecs,
    revenue30d,
    revenueByDay,
    consultsByCondition,
    actionsByPharmacist,
  ] = await Promise.all([
    db.execute<{ count: string }>(sql`select count(*)::text as count from consultations where created_at >= ${last7}`),
    db.execute<{ count: string }>(sql`select count(*)::text as count from consultations where created_at >= ${prev7} and created_at < ${last7}`),
    db.execute<{ status: string; count: string }>(
      sql`select status, count(*)::text as count from consultations where created_at >= ${last30} group by status`,
    ),
    db.execute<{ count: string }>(sql`select count(*)::text as count from consultations where status in ('pending','patient_responded')`),
    db.execute<{ avg_secs: string | null }>(
      sql`select avg(extract(epoch from (reviewed_at - created_at)))::text as avg_secs from consultations where reviewed_at is not null and created_at >= ${last30}`,
    ),
    db.execute<{ total: string | null }>(
      sql`select coalesce(sum(total_gbp_pence), 0)::text as total from orders where created_at >= ${last30} and status not in ('cancelled', 'refunded')`,
    ),
    db.execute<{ day: string; total: string }>(
      sql`select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
                 coalesce(sum(total_gbp_pence), 0)::text as total
          from orders
          where created_at >= ${last30} and status not in ('cancelled', 'refunded')
          group by 1 order by 1`,
    ),
    db.execute<{ condition_name: string; count: string }>(
      sql`select condition_name, count(*)::text as count from consultations where created_at >= ${last30} group by condition_name order by 2 desc limit 8`,
    ),
    db.execute<{ actor_name: string; action: string; count: string }>(
      sql`select actor_name, action, count(*)::text as count
          from consultation_actions
          where created_at >= ${last30} and actor_role = 'pharmacist'
          group by 1, 2 order by 1`,
    ),
  ]);

  const splitMap: Record<string, number> = {};
  for (const r of approvalSplit.rows) splitMap[r.status] = Number(r.count);

  const perPharm: Record<string, { actor: string; approve: number; reject: number; refer: number; more_info: number; total: number }> = {};
  for (const r of actionsByPharmacist.rows) {
    if (!perPharm[r.actor_name]) {
      perPharm[r.actor_name] = { actor: r.actor_name, approve: 0, reject: 0, refer: 0, more_info: 0, total: 0 };
    }
    const bucket = perPharm[r.actor_name]!;
    const action = r.action as "approve" | "reject" | "refer" | "more_info";
    if (action in bucket) (bucket as Record<string, unknown>)[action] = Number(r.count);
    bucket.total += Number(r.count);
  }

  res.json({
    consultations7d: Number(consults7d.rows[0]?.count ?? 0),
    consultations7dPrev: Number(consultsPrev7d.rows[0]?.count ?? 0),
    pendingNow: Number(pendingNow.rows[0]?.count ?? 0),
    avgApprovalSecs: avgApprovalSecs.rows[0]?.avg_secs ? Number(avgApprovalSecs.rows[0].avg_secs) : null,
    approvalSplit: splitMap,
    revenue30dPence: Number(revenue30d.rows[0]?.total ?? 0),
    revenueByDay: revenueByDay.rows.map((r) => ({ day: r.day, totalPence: Number(r.total) })),
    topConditions: consultsByCondition.rows.map((r) => ({ name: r.condition_name, count: Number(r.count) })),
    perPharmacist: Object.values(perPharm),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Inventory low-stock
// ─────────────────────────────────────────────────────────────────────────────
router.get("/pharmacist/inventory/low-stock", requirePharmacist, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.stock} <= ${productsTable.lowStockThreshold}`)
    .orderBy(productsTable.stock);
  res.json({
    products: rows,
    counts: {
      total: rows.length,
      outOfStock: rows.filter((r) => r.stock <= 0).length,
      low: rows.filter((r) => r.stock > 0).length,
    },
  });
});

export default router;

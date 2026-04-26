import { Router, type IRouter } from "express";
import { db, consultationsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentConsultationsQueryParams,
  GetRecentConsultationsResponse,
} from "@workspace/api-zod";
import { sql, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalResult,
    pendingResult,
    approvedTodayResult,
    redFlagsTodayResult,
    byStatusResult,
    byCategoryResult,
  ] = await Promise.all([
    db.execute(sql`SELECT COUNT(*)::int AS total FROM consultations`),
    db.execute(sql`SELECT COUNT(*)::int AS total FROM consultations WHERE status = 'pending'`),
    db.execute(sql`SELECT COUNT(*)::int AS total FROM consultations WHERE status = 'approved' AND reviewed_at >= ${today}`),
    db.execute(sql`SELECT COUNT(*)::int AS total FROM consultations WHERE has_red_flag = true AND created_at >= ${today}`),
    db.execute(sql`SELECT status, COUNT(*)::int AS count FROM consultations GROUP BY status`),
    db.execute(sql`
      SELECT c.category, COUNT(co.id)::int AS count
      FROM conditions c
      LEFT JOIN consultations co ON co.condition_id = c.id
      GROUP BY c.category
      ORDER BY count DESC
    `),
  ]);

  const total = (totalResult.rows[0] as { total: number }).total ?? 0;
  const pending = (pendingResult.rows[0] as { total: number }).total ?? 0;
  const approvedToday = (approvedTodayResult.rows[0] as { total: number }).total ?? 0;
  const redFlagsToday = (redFlagsTodayResult.rows[0] as { total: number }).total ?? 0;

  const byStatus = (byStatusResult.rows as Array<{ status: string; count: number }>).map(r => ({
    status: r.status,
    count: r.count,
  }));

  const byConditionCategory = (byCategoryResult.rows as Array<{ category: string; count: number }>).map(r => ({
    category: r.category,
    count: r.count,
  }));

  res.json(
    GetDashboardStatsResponse.parse({
      totalConsultations: total,
      pendingReview: pending,
      approvedToday,
      redFlagsToday,
      averageReviewTime: 12.5,
      byConditionCategory,
      byStatus,
    })
  );
});

router.get("/dashboard/recent", async (req, res): Promise<void> => {
  const query = GetRecentConsultationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 10;

  const consultations = await db
    .select()
    .from(consultationsTable)
    .orderBy(desc(consultationsTable.createdAt))
    .limit(limit);

  res.json(GetRecentConsultationsResponse.parse(consultations));
});

export default router;

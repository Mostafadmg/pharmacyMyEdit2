import { Router, type IRouter, type Response } from "express";
import { db, consultationsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRecentConsultationsQueryParams,
  GetRecentConsultationsResponse,
  GetPharmacistUnreadCountsResponse,
} from "@workspace/api-zod";
import { sql, desc, gte } from "drizzle-orm";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

/**
 * GET /api/pharmacist/unread-counts
 *
 * Lightweight polling endpoint used by the pharmacist sidebar (web) and the
 * mobile tab bar to render unread badges without re-fetching the full
 * message-threads or consultations lists.
 *
 * - `unreadMessages`     – total messages from non-pharmacist senders that
 *                          have not yet been marked read by a pharmacist.
 * - `patientResponded`   – consultations currently sitting in the
 *                          `patient_responded` status (queue items that need
 *                          re-review after the patient replied).
 */
router.get(
  "/pharmacist/unread-counts",
  requirePharmacist,
  async (_req: AuthedRequest, res: Response): Promise<void> => {
    const [unreadResult, respondedResult] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM consultation_messages
        WHERE read_by_pharmacist = false
          AND sender_role <> 'pharmacist'
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS total
        FROM consultations
        WHERE status = 'patient_responded'
      `),
    ]);

    const unreadMessages = (unreadResult.rows[0] as { total: number } | undefined)?.total ?? 0;
    const patientResponded = (respondedResult.rows[0] as { total: number } | undefined)?.total ?? 0;

    res.json(
      GetPharmacistUnreadCountsResponse.parse({
        unreadMessages,
        patientResponded,
      }),
    );
  },
);

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

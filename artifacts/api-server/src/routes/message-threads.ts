import { Router, type Response } from "express";
import { db, consultationsTable, consultationMessagesTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";

const router = Router();

/**
 * GET /api/pharmacist/message-threads
 *
 * Returns every consultation that has at least one message, enriched with:
 * - lastMsgBody  – truncated preview of the most recent message
 * - lastMsgAt    – ISO timestamp of that message
 * - lastMsgRole  – sender_role of that message ("patient" | "pharmacist" | "system")
 * - unreadCount  – messages sent by the patient that have not yet been read by a pharmacist
 * - totalMessages
 *
 * Sorted by lastMsgAt descending (most recent reply first).
 */
router.get(
  "/pharmacist/message-threads",
  requirePharmacist,
  async (_req: AuthedRequest, res: Response): Promise<void> => {
    const rows = await db
      .select({
        id: consultationsTable.id,
        patientName: consultationsTable.patientName,
        patientEmail: consultationsTable.patientEmail,
        conditionName: consultationsTable.conditionName,
        consultationStatus: consultationsTable.status,
        createdAt: consultationsTable.createdAt,

        lastMsgBody: sql<string>`(
          SELECT body FROM consultation_messages
          WHERE consultation_id = ${consultationsTable.id}
          ORDER BY created_at DESC
          LIMIT 1
        )`,
        lastMsgAt: sql<string>`(
          SELECT created_at FROM consultation_messages
          WHERE consultation_id = ${consultationsTable.id}
          ORDER BY created_at DESC
          LIMIT 1
        )`,
        lastMsgRole: sql<string>`(
          SELECT sender_role FROM consultation_messages
          WHERE consultation_id = ${consultationsTable.id}
          ORDER BY created_at DESC
          LIMIT 1
        )`,
        lastMsgSender: sql<string>`(
          SELECT sender_name FROM consultation_messages
          WHERE consultation_id = ${consultationsTable.id}
          ORDER BY created_at DESC
          LIMIT 1
        )`,
        unreadCount: sql<number>`(
          SELECT COUNT(*) FROM consultation_messages
          WHERE consultation_id = ${consultationsTable.id}
            AND read_by_pharmacist = false
            AND sender_role != 'pharmacist'
        )`,
        totalMessages: sql<number>`(
          SELECT COUNT(*) FROM consultation_messages
          WHERE consultation_id = ${consultationsTable.id}
        )`,
      })
      .from(consultationsTable)
      .where(
        sql`EXISTS (
          SELECT 1 FROM consultation_messages
          WHERE consultation_id = ${consultationsTable.id}
        )`,
      )
      .orderBy(
        desc(
          sql`(
            SELECT created_at FROM consultation_messages
            WHERE consultation_id = ${consultationsTable.id}
            ORDER BY created_at DESC
            LIMIT 1
          )`,
        ),
      );

    res.json({ threads: rows });
  },
);

export default router;

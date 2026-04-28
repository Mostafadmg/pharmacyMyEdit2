import { Router, type IRouter, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { resolveAuthActor, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

interface ResolvedActor {
  recipientType: "patient" | "pharmacist";
  recipientKey: string;
}

async function resolveActor(req: AuthedRequest): Promise<ResolvedActor | null> {
  const actor = await resolveAuthActor(req.headers.authorization);
  if (!actor) return null;
  if (actor.role === "pharmacist") {
    return { recipientType: "pharmacist", recipientKey: actor.id };
  }
  // Patients are addressed by email throughout the system
  if (!actor.email) return null;
  return { recipientType: "patient", recipientKey: actor.email };
}

router.get("/notifications", async (req: AuthedRequest, res: Response): Promise<void> => {
  const actor = await resolveActor(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const unreadOnly = req.query["unreadOnly"] === "true";
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "30"), 10) || 30, 100);

  const baseConditions = actor.recipientType === "pharmacist"
    // Pharmacists see notifications addressed to themselves OR to "*"
    ? sql`${notificationsTable.recipientType} = 'pharmacist'
        AND (${notificationsTable.recipientKey} = ${actor.recipientKey}
             OR ${notificationsTable.recipientKey} = '*')`
    : sql`${notificationsTable.recipientType} = 'patient'
        AND lower(${notificationsTable.recipientKey}) = lower(${actor.recipientKey})`;

  const where = unreadOnly
    ? sql`(${baseConditions}) AND ${notificationsTable.read} = false`
    : baseConditions;

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(where)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);

  const [unreadRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(sql`(${baseConditions}) AND ${notificationsTable.read} = false`);

  res.json({ notifications, unreadCount: unreadRow?.c ?? 0 });
});

router.post("/notifications/:id/read", async (req: AuthedRequest, res: Response): Promise<void> => {
  const actor = await resolveActor(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const id = String(req.params["id"] ?? "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const [existing] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  // Authorization: must match recipient
  const ownerOk =
    existing.recipientType === actor.recipientType &&
    (existing.recipientKey === actor.recipientKey
      || (actor.recipientType === "pharmacist" && existing.recipientKey === "*")
      || (actor.recipientType === "patient" && existing.recipientKey.toLowerCase() === actor.recipientKey.toLowerCase()));
  if (!ownerOk) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  res.json(updated);
});

router.post("/notifications/read-all", async (req: AuthedRequest, res: Response): Promise<void> => {
  const actor = await resolveActor(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const where = actor.recipientType === "pharmacist"
    ? and(
        eq(notificationsTable.recipientType, "pharmacist"),
        sql`(${notificationsTable.recipientKey} = ${actor.recipientKey} OR ${notificationsTable.recipientKey} = '*')`,
        eq(notificationsTable.read, false),
      )
    : and(
        eq(notificationsTable.recipientType, "patient"),
        sql`lower(${notificationsTable.recipientKey}) = lower(${actor.recipientKey})`,
        eq(notificationsTable.read, false),
      );
  const result = await db.update(notificationsTable).set({ read: true }).where(where).returning({ id: notificationsTable.id });
  res.json({ updated: result.length });
});

export default router;

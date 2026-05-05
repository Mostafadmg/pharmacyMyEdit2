import { Router, type IRouter, type Response } from "express";
import {
  db,
  consultationMessagesTable,
  consultationActionsTable,
  consultationsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, asc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { resolveAuthActor, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

type Actor = NonNullable<AuthedRequest["authActor"]>;

async function resolveActor(req: AuthedRequest): Promise<Actor | null> {
  return resolveAuthActor(req.headers.authorization);
}

function patientOwnsConsultation(actor: Actor, patientEmail: string): boolean {
  if (actor.role !== "patient") return true;
  if (!actor.email) return false;
  return actor.email.toLowerCase() === patientEmail.toLowerCase();
}

// GET /consultations/:id/messages — list messages + actions
router.get("/consultations/:id/messages", async (req: AuthedRequest, res: Response): Promise<void> => {
  const actor = await resolveActor(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const consultationId = String(req.params["id"] ?? "");
  if (!consultationId) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const [consultation] = await db
    .select({ id: consultationsTable.id, patientEmail: consultationsTable.patientEmail })
    .from(consultationsTable)
    .where(eq(consultationsTable.id, consultationId));
  if (!consultation) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  if (!patientOwnsConsultation(actor, consultation.patientEmail)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [messages, actions] = await Promise.all([
    db.select().from(consultationMessagesTable)
      .where(eq(consultationMessagesTable.consultationId, consultationId))
      .orderBy(asc(consultationMessagesTable.createdAt)),
    db.select().from(consultationActionsTable)
      .where(eq(consultationActionsTable.consultationId, consultationId))
      .orderBy(asc(consultationActionsTable.createdAt)),
  ]);

  // Mark messages from the other side as read
  if (messages.length > 0) {
    if (actor.role === "patient") {
      await db.update(consultationMessagesTable)
        .set({ readByPatient: true })
        .where(eq(consultationMessagesTable.consultationId, consultationId));
    } else {
      await db.update(consultationMessagesTable)
        .set({ readByPharmacist: true })
        .where(eq(consultationMessagesTable.consultationId, consultationId));
    }
  }

  res.json({ messages, actions });
});

// POST /consultations/:id/messages — send a message
router.post("/consultations/:id/messages", async (req: AuthedRequest, res: Response): Promise<void> => {
  const actor = await resolveActor(req);
  if (!actor) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const consultationId = String(req.params["id"] ?? "");
  const { body, kind } = (req.body ?? {}) as { body?: string; kind?: string };
  if (!consultationId || !body?.trim()) {
    res.status(400).json({ error: "id and body are required" });
    return;
  }
  if (body.length > 4000) {
    res.status(400).json({ error: "Message too long (max 4000 chars)" });
    return;
  }
  const [consultation] = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.id, consultationId));
  if (!consultation) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  if (!patientOwnsConsultation(actor, consultation.patientEmail)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const messageKind = kind ?? "message";

  const [created] = await db.insert(consultationMessagesTable).values({
    id: randomUUID(),
    consultationId,
    patientEmail: consultation.patientEmail,
    senderRole: actor.role,
    senderName: actor.name,
    body: body.trim(),
    kind: messageKind,
    readByPatient: actor.role === "patient",
    readByPharmacist: actor.role === "pharmacist",
  }).returning();

  // If patient replies to a more_info_needed consultation, move it to patient_responded
  if (actor.role === "patient" && consultation.status === "more_info_needed") {
    await db
      .update(consultationsTable)
      .set({ status: "patient_responded" })
      .where(and(eq(consultationsTable.id, consultationId), eq(consultationsTable.status, "more_info_needed")));
  }

  // Audit action for patient replies
  if (actor.role === "patient") {
    await db.insert(consultationActionsTable).values({
      id: randomUUID(),
      consultationId,
      action: "patient_reply",
      actorRole: "patient",
      actorName: consultation.patientName,
      details: {},
      note: body.trim().slice(0, 500),
    });
  }

  // Notify the other party
  if (actor.role === "patient") {
    await db.insert(notificationsTable).values({
      id: randomUUID(),
      recipientType: "pharmacist",
      recipientKey: "*",
      category: "message",
      title: `Reply from ${consultation.patientName}`,
      body: body.trim().slice(0, 200),
      link: `/dashboard/consultations/${consultationId}`,
      consultationId,
      orderId: null,
      read: false,
    });
  } else {
    await db.insert(notificationsTable).values({
      id: randomUUID(),
      recipientType: "patient",
      recipientKey: consultation.patientEmail,
      category: "message",
      title: `New message from ${actor.name}`,
      body: body.trim().slice(0, 200),
      link: `/my-consultations`,
      consultationId,
      orderId: null,
      read: false,
    });
  }

  res.status(201).json(created);
});

export default router;

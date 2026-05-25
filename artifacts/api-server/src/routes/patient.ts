import { Router, type IRouter } from "express";
import {
  db,
  consultationsTable,
  consultationMessagesTable,
  consultationActionsTable,
  notificationsTable,
  patientAccountsTable,
} from "@workspace/db";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  applyPatientDocumentUpload,
  documentActionsRequired,
  getPatientDocumentDataUrl,
  isEvidenceSlotId,
  patientDocumentSlotStatuses,
} from "../utils/patientDocuments";
import { pushToAllPharmacists } from "../lib/expo-push";

const router: IRouter = Router();

function decodePatientToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [patientId] = decoded.split(":");
    return patientId || null;
  } catch {
    return null;
  }
}

router.post("/patient/consultations/:id/cancel", async (req, res): Promise<void> => {
  const patientId = decodePatientToken(req.headers.authorization);
  if (!patientId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [patient] = await db.select().from(patientAccountsTable).where(eq(patientAccountsTable.id, patientId));
  if (!patient) { res.status(401).json({ error: "Patient account not found" }); return; }

  const consultationId = req.params.id;
  const [consultation] = await db.select().from(consultationsTable).where(eq(consultationsTable.id, consultationId));

  if (!consultation) { res.status(404).json({ error: "Consultation not found" }); return; }
  if (consultation.patientEmail.toLowerCase() !== patient.email.toLowerCase()) {
    res.status(403).json({ error: "You do not have permission to cancel this consultation" });
    return;
  }
  if (consultation.status !== "pending" && consultation.status !== "red_flag") {
    res.status(400).json({ error: "Only pending consultations can be cancelled" });
    return;
  }

  const [updated] = await db.update(consultationsTable).set({ status: "cancelled" }).where(eq(consultationsTable.id, consultationId)).returning();
  res.json({ success: true, consultation: updated });
});

router.get("/patient/consultations", async (req, res): Promise<void> => {
  const patientId = decodePatientToken(req.headers.authorization);

  if (!patientId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, patientId));

  if (!patient) {
    res.status(401).json({ error: "Patient account not found" });
    return;
  }

  const rows = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.patientEmail, patient.email))
    .orderBy(desc(consultationsTable.createdAt));

  const consultationIds = rows.map((row) => row.id);
  const unreadPharmacistMessages =
    consultationIds.length > 0
      ? await db
          .select({ consultationId: consultationMessagesTable.consultationId })
          .from(consultationMessagesTable)
          .where(
            and(
              inArray(consultationMessagesTable.consultationId, consultationIds),
              eq(consultationMessagesTable.senderRole, "pharmacist"),
              eq(consultationMessagesTable.readByPatient, false),
            ),
          )
      : [];

  const unreadPharmacistByConsultation = new Set(
    unreadPharmacistMessages.map((m) => m.consultationId),
  );

  const consultations = rows.map((row) => {
    const answers = (row.answers ?? {}) as Record<string, unknown>;
    const requiresPatientReply =
      row.status === "more_info_needed" ||
      unreadPharmacistByConsultation.has(row.id);
    const documentSlots = patientDocumentSlotStatuses(row.id, answers);
    return {
      ...row,
      documentSlots,
      documentActions: documentActionsRequired(row.id, answers),
      requiresPatientReply,
      documentsNeedAttention: documentSlots.some(
        (s) => s.status === "required" || s.status === "rejected",
      ),
    };
  });

  res.json({ consultations });
});

router.get(
  "/patient/consultations/:id/documents/:docId",
  async (req, res): Promise<void> => {
    const patient = await requirePatient(req.headers.authorization);
    if (!patient) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const consultationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const docId = Array.isArray(req.params.docId)
      ? req.params.docId[0]
      : req.params.docId;

    if (!isEvidenceSlotId(docId)) {
      res.status(400).json({ error: "Invalid document slot" });
      return;
    }

    const [row] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, consultationId));

    if (!row) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }
    if (row.patientEmail.toLowerCase() !== patient.email.toLowerCase()) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const answers = (row.answers ?? {}) as Record<string, unknown>;
    const file = getPatientDocumentDataUrl(answers, docId);
    if (!file) {
      res.status(404).json({ error: "No upload found for this document" });
      return;
    }

    res.json({
      docId,
      dataUrl: file.dataUrl,
      uploadedAt: file.uploadedAt,
      reviewStatus: file.status ?? "pending",
    });
  },
);

type PatientRow = typeof patientAccountsTable.$inferSelect;
type ConsultationRow = typeof consultationsTable.$inferSelect;

async function requirePatient(authHeader: string | undefined): Promise<PatientRow | null> {
  const patientId = decodePatientToken(authHeader);
  if (!patientId) return null;
  const [patient] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, patientId));
  return patient ?? null;
}

function pickTargetConsultation(rows: ConsultationRow[]): ConsultationRow | null {
  const active = rows.filter((r) => r.status !== "cancelled");
  const pool = active.length > 0 ? active : rows;
  if (pool.length === 0) return null;

  const priority = [
    "more_info_needed",
    "red_flag",
    "patient_responded",
    "pending",
    "approved",
  ] as const;
  for (const status of priority) {
    const found = pool.find((r) => r.status === status);
    if (found) return found;
  }
  return pool[0];
}

function resolvePatientConsultation(
  rows: ConsultationRow[],
  consultationId?: string | null,
): ConsultationRow | null {
  if (consultationId) {
    const match = rows.find((r) => r.id === consultationId);
    if (match) return match;
  }
  return pickTargetConsultation(rows);
}

router.get("/patient/messages", async (req, res): Promise<void> => {
  const patient = await requirePatient(req.headers.authorization);
  if (!patient) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const requestedId =
    typeof req.query.consultationId === "string"
      ? req.query.consultationId.trim()
      : null;

  const consultations = await db
    .select({
      id: consultationsTable.id,
      conditionName: consultationsTable.conditionName,
      status: consultationsTable.status,
      createdAt: consultationsTable.createdAt,
      prescriptionItems: consultationsTable.prescriptionItems,
    })
    .from(consultationsTable)
    .where(eq(consultationsTable.patientEmail, patient.email))
    .orderBy(desc(consultationsTable.createdAt));

  const consultationIds = consultations.map((c) => c.id);
  if (consultationIds.length === 0) {
    res.json({ messages: [], actions: [], consultations: [], targetConsultationId: null });
    return;
  }

  const [messages, actions] = await Promise.all([
    db
      .select()
      .from(consultationMessagesTable)
      .where(inArray(consultationMessagesTable.consultationId, consultationIds))
      .orderBy(asc(consultationMessagesTable.createdAt)),
    db
      .select()
      .from(consultationActionsTable)
      .where(inArray(consultationActionsTable.consultationId, consultationIds))
      .orderBy(asc(consultationActionsTable.createdAt)),
  ]);

  await db
    .update(consultationMessagesTable)
    .set({ readByPatient: true })
    .where(
      and(
        inArray(consultationMessagesTable.consultationId, consultationIds),
        eq(consultationMessagesTable.readByPatient, false),
      ),
    );

  const allRows = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.patientEmail, patient.email))
    .orderBy(desc(consultationsTable.createdAt));

  const target = resolvePatientConsultation(allRows, requestedId);

  res.json({
    messages,
    actions,
    consultations,
    targetConsultationId: target?.id ?? null,
  });
});

router.post("/patient/messages", async (req, res): Promise<void> => {
  const patient = await requirePatient(req.headers.authorization);
  if (!patient) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { body, attachment, consultationId: bodyConsultationId } = (req.body ?? {}) as {
    body?: string;
    attachment?: { dataUrl?: string; docId?: string; filename?: string };
    consultationId?: string;
  };

  const text = body?.trim() ?? "";
  const hasAttachment = Boolean(attachment?.dataUrl?.trim());

  if (!text && !hasAttachment) {
    res.status(400).json({ error: "Message or attachment is required" });
    return;
  }
  if (text.length > 4000) {
    res.status(400).json({ error: "Message too long (max 4000 chars)" });
    return;
  }

  const consultationRows = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.patientEmail, patient.email))
    .orderBy(desc(consultationsTable.createdAt));

  const consultation = resolvePatientConsultation(
    consultationRows,
    bodyConsultationId?.trim() || null,
  );
  if (!consultation) {
    res.status(400).json({ error: "No consultations found — start a consultation first" });
    return;
  }

  const patientName = patient.name?.trim() || patient.email;

  if (hasAttachment) {
    const docId = attachment?.docId?.trim() || "supporting-evidence";
    if (!isEvidenceSlotId(docId)) {
      res.status(400).json({ error: "Invalid document type" });
      return;
    }

    const answers = applyPatientDocumentUpload(
      { ...((consultation.answers ?? {}) as Record<string, unknown>) },
      docId,
      attachment!.dataUrl!,
    );
    const docTitle = EVIDENCE_SLOT_TITLES[docId];
    const messageText =
      text ||
      `Uploaded ${attachment?.filename?.trim() || docTitle} via messages.`;

    await db
      .update(consultationsTable)
      .set({
        answers,
        status:
          consultation.status === "more_info_needed"
            ? "patient_responded"
            : consultation.status,
      })
      .where(eq(consultationsTable.id, consultation.id));

    const [created] = await db
      .insert(consultationMessagesTable)
      .values({
        id: randomUUID(),
        consultationId: consultation.id,
        patientEmail: consultation.patientEmail,
        senderRole: "patient",
        senderName: patientName,
        body: messageText,
        kind: "document_upload",
        meta: JSON.stringify({ docId, docTitle }),
        readByPatient: true,
        readByPharmacist: false,
      })
      .returning();

    await db.insert(consultationActionsTable).values({
      id: randomUUID(),
      consultationId: consultation.id,
      action: "document_uploaded",
      actorRole: "patient",
      actorName: patientName,
      details: { docId, docTitle },
      note: messageText.slice(0, 500),
    });

    await db.insert(notificationsTable).values({
      id: randomUUID(),
      recipientType: "pharmacist",
      recipientKey: "*",
      category: "message",
      title: `Document from ${patientName}`,
      body: messageText.slice(0, 200),
      link: `/dashboard/consultations/${consultation.id}`,
      consultationId: consultation.id,
      orderId: null,
      read: false,
    });

    pushToAllPharmacists({
      title: `${patientName} · ${consultation.conditionName}`,
      body: messageText.slice(0, 140),
      data: {
        type: "patient_message",
        consultationId: consultation.id,
        patientName,
        conditionName: consultation.conditionName,
      },
    }).catch(() => {});

    res.status(201).json(created);
    return;
  }

  const [created] = await db
    .insert(consultationMessagesTable)
    .values({
      id: randomUUID(),
      consultationId: consultation.id,
      patientEmail: consultation.patientEmail,
      senderRole: "patient",
      senderName: patientName,
      body: text,
      kind: "message",
      readByPatient: true,
      readByPharmacist: false,
    })
    .returning();

  if (consultation.status === "more_info_needed") {
    await db
      .update(consultationsTable)
      .set({ status: "patient_responded" })
      .where(
        and(
          eq(consultationsTable.id, consultation.id),
          eq(consultationsTable.status, "more_info_needed"),
        ),
      );
  }

  await db.insert(consultationActionsTable).values({
    id: randomUUID(),
    consultationId: consultation.id,
    action: "patient_reply",
    actorRole: "patient",
    actorName: patientName,
    details: {},
    note: text.slice(0, 500),
  });

  await db.insert(notificationsTable).values({
    id: randomUUID(),
    recipientType: "pharmacist",
    recipientKey: "*",
    category: "message",
    title: `Reply from ${patientName}`,
    body: text.slice(0, 200),
    link: `/dashboard/consultations/${consultation.id}`,
    consultationId: consultation.id,
    orderId: null,
    read: false,
  });

  pushToAllPharmacists({
    title: `${patientName} · ${consultation.conditionName}`,
    body: text.slice(0, 140),
    data: {
      type: "patient_message",
      consultationId: consultation.id,
      patientName,
      conditionName: consultation.conditionName,
    },
  }).catch(() => {});

  res.status(201).json(created);
});

export default router;

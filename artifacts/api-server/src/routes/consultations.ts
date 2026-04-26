import { Router, type IRouter } from "express";
import { db, consultationsTable, conditionsTable } from "@workspace/db";
import { requirePharmacist } from "../middlewares/auth";
import {
  ListConsultationsQueryParams,
  ListConsultationsResponse,
  CreateConsultationBody,
  GetConsultationParams,
  GetConsultationResponse,
  ReviewConsultationParams,
  ReviewConsultationBody,
  ReviewConsultationResponse,
} from "@workspace/api-zod";
import { eq, desc, count, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendConsultationOutcomeEmail } from "../utils/email";

const router: IRouter = Router();

const RED_FLAG_KEYWORDS = [
  "chest pain", "difficulty breathing", "severe headache", "vision loss",
  "loss of consciousness", "paralysis", "severe allergic", "anaphylaxis",
  "suicidal", "self-harm", "blood in stool", "coughing blood"
];

function detectRedFlags(answers: Record<string, unknown>): boolean {
  const answersStr = JSON.stringify(answers).toLowerCase();
  return RED_FLAG_KEYWORDS.some(flag => answersStr.includes(flag));
}

router.get("/consultations", async (req, res): Promise<void> => {
  const query = ListConsultationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, limit = 20, offset = 0 } = query.data;

  const whereClause = status
    ? eq(consultationsTable.status, status)
    : undefined;

  const [consultations, totalResult] = await Promise.all([
    db
      .select()
      .from(consultationsTable)
      .where(whereClause)
      .orderBy(desc(consultationsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(consultationsTable)
      .where(whereClause),
  ]);

  res.json(
    ListConsultationsResponse.parse({
      consultations,
      total: totalResult[0]?.count ?? 0,
    })
  );
});

router.post("/consultations", async (req, res): Promise<void> => {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const [condition] = await db
    .select({ name: conditionsTable.name })
    .from(conditionsTable)
    .where(eq(conditionsTable.id, data.conditionId));

  if (!condition) {
    res.status(400).json({ error: "Condition not found" });
    return;
  }

  const hasRedFlag = detectRedFlags(data.answers as Record<string, unknown>);
  const id = randomUUID();

  const [consultation] = await db
    .insert(consultationsTable)
    .values({
      id,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientAge: data.patientAge,
      patientSex: data.patientSex,
      conditionId: data.conditionId,
      conditionName: condition.name,
      status: hasRedFlag ? "red_flag" : "pending",
      answers: data.answers,
      hasRedFlag,
      hasPhoto: data.hasPhoto,
      photoUrls: Array.isArray(data.photoUrls) ? data.photoUrls : [],
      isPregnant: data.isPregnant ?? null,
      allergies: data.allergies ?? null,
      currentMedications: data.currentMedications ?? null,
      medicalHistory: data.medicalHistory ?? null,
    })
    .returning();

  res.status(201).json(GetConsultationResponse.parse(consultation));
});

router.get("/consultations/patient/:email", requirePharmacist, async (req, res): Promise<void> => {
  const rawEmail = req.params.email;
  const emailParam = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const email = decodeURIComponent(emailParam ?? "");
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const consultations = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.patientEmail, email))
    .orderBy(desc(consultationsTable.createdAt));
  res.json({ consultations, total: consultations.length });
});

router.get("/consultations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetConsultationParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [consultation] = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.id, params.data.id));

  if (!consultation) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }

  res.json(GetConsultationResponse.parse(consultation));
});

router.post("/consultations/:id/review", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReviewConsultationParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ReviewConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { action, pharmacistNote, prescription, referralInfo } = parsed.data;

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    more_info: "more_info_needed",
    refer: "referred",
  };

  const [updated] = await db
    .update(consultationsTable)
    .set({
      status: statusMap[action] ?? "pending",
      pharmacistNote: pharmacistNote ?? null,
      prescription: prescription ?? null,
      referralInfo: referralInfo ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(consultationsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }

  sendConsultationOutcomeEmail({
    patientName: updated.patientName,
    patientEmail: updated.patientEmail,
    conditionName: updated.conditionName,
    status: updated.status,
    pharmacistNote: updated.pharmacistNote,
    prescription: updated.prescription,
    referralInfo: updated.referralInfo,
    consultationId: updated.id,
  }).catch((err) => console.error("Email send failed:", err));

  res.json(ReviewConsultationResponse.parse(updated));
});

export default router;

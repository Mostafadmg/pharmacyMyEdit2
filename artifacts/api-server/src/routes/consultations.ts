import { Router, type IRouter } from "express";
import {
  db,
  consultationsTable,
  conditionsTable,
  consultationActionsTable,
  consultationMessagesTable,
  notificationsTable,
  ordersTable,
  deliveriesTable,
  patientAccountsTable,
} from "@workspace/db";
import {
  requirePharmacist,
  resolveAuthActor,
  type AuthedRequest,
} from "../middlewares/auth";
import {
  ListConsultationsQueryParams,
  CreateConsultationBody,
  GetConsultationParams,
  ReviewConsultationParams,
  ReviewConsultationBody,
  ReviewConsultationResponse,
} from "@workspace/api-zod";
import { eq, desc, count, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  sendConsultationOutcomeEmail,
  sendDocumentReuploadEmail,
} from "../utils/email";
import {
  buildCriteriaEmailNote,
  getDocumentRequirements,
  hasWlType2DiabetesListedMedRejectionFromAnswers,
  PATIENT_DOCUMENT_DATA_URL_MAX,
  validatePatientDocumentDataUrl,
  patientDocumentsHasAnyUpload,
  slotHasUploads,
  type DocumentRequirement,
  type DocumentRequirementChange,
  type PatientDocumentsMap,
} from "@workspace/evidence-slots";
import {
  applyPatientDocumentUpload,
  buildDocumentUploadPath,
  buildDocumentUploadUrl,
  DocumentRequirementSchema,
  EVIDENCE_SLOT_TITLES,
  EvidenceSlotIdSchema,
  isEvidenceSlotId,
  applyPatientDocumentUploadRequest,
  trackOrderDocumentSlot,
  type DocumentReviewEntry,
} from "../utils/patientDocuments";
import { checkDrugInteractions } from "./pharmacist-tools";
import { pushToAllPharmacists } from "../lib/expo-push";
import { jsonConsultation } from "../utils/apiResponse";
import {
  applyOrderTagChange,
  applyOrderTagsBatchAdd,
  applyOrderTagsBatchRemove,
  applyUploadLinkRequestedOrderTags,
  reconcileAutoOrderTags,
} from "../utils/orderTags";
import {
  extractDateOfBirthFromAnswers,
  findDuplicatePatientMatches,
  isWeightManagementCondition,
  nextConsultationNumber,
  isUniqueViolation,
} from "../utils/patientIdentity";
import { detectAutoComplexPatient } from "../utils/autoComplexPatient";

const REJECT_REASON_LABELS: Record<string, string> = {
  medically_unsuitable: "Medically unsuitable for this treatment",
  outside_our_scope: "Outside the scope of our online service",
  insufficient_information: "Insufficient information provided",
  already_prescribed: "Already prescribed elsewhere",
  other: "Other reason",
};

const REFER_RECIPIENT_LABELS: Record<string, string> = {
  gp: "Your GP / regular prescriber",
  hospital_specialist: "Hospital specialist",
  ae: "A&E (Accident & Emergency)",
  nhs_111: "NHS 111",
  sexual_health_clinic: "Sexual health clinic",
  mental_health: "Mental health services",
  other: "Specialist service",
};

const router: IRouter = Router();

const RED_FLAG_KEYWORDS = [
  "chest pain",
  "difficulty breathing",
  "severe headache",
  "vision loss",
  "loss of consciousness",
  "paralysis",
  "severe allergic",
  "anaphylaxis",
  "suicidal",
  "self-harm",
  "blood in stool",
  "coughing blood",
];

function hasCancerPrescriberReviewFlag(
  answers: Record<string, unknown>,
): boolean {
  if (answers.cancer_history === "yes") return true;
  const diagnosed = answers.diagnosed_conditions_details;
  if (!Array.isArray(diagnosed)) return false;
  return diagnosed.some((row) => {
    if (!row || typeof row !== "object") return false;
    const catalogueId = (row as Record<string, unknown>).catalogue_id;
    return catalogueId === "cancer";
  });
}

function detectRedFlags(answers: Record<string, unknown>): boolean {
  if (hasCancerPrescriberReviewFlag(answers)) return true;
  if (hasWlType2DiabetesListedMedRejectionFromAnswers(answers)) return true;
  const answersStr = JSON.stringify(answers).toLowerCase();
  return RED_FLAG_KEYWORDS.some((flag) => answersStr.includes(flag));
}

function hasPatientDocumentsInAnswers(answers: Record<string, unknown>): boolean {
  const docs = answers.patient_documents;
  if (!docs || typeof docs !== "object" || Array.isArray(docs)) return false;
  return patientDocumentsHasAnyUpload(docs as PatientDocumentsMap);
}

function createConsultationErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    msg.includes("does not exist") ||
    msg.includes("prescription_items") ||
    msg.includes("consultation_number") ||
    msg.includes("duplicate_patient_matches") ||
    msg.includes("unique constraint") ||
    msg.includes("duplicate key")
  ) {
    return "The server database needs to finish updating. Restart the API server, wait a few seconds, then submit again.";
  }
  if (msg.includes("Failed query")) {
    return "Could not save your consultation. Restart the API server if this keeps happening, then try again.";
  }
  return "Could not save your consultation. Please try again.";
}

router.get(
  "/consultations",
  requirePharmacist,
  async (req, res): Promise<void> => {
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
      db.select({ count: count() }).from(consultationsTable).where(whereClause),
    ]);

    res.json({
      consultations: consultations.map(jsonConsultation),
      total: totalResult[0]?.count ?? 0,
    });
  },
);

const PrescriptionItemInput = z.object({
  name: z.string(),
  strength: z.string(),
  form: z.string(),
  quantity: z.string(),
  sig: z.string(),
  duration: z.string(),
  notes: z.string().optional(),
});

/** Fields accepted by the injectable weight-loss questionnaire beyond OpenAPI body. */
const CreateConsultationExtras = z
  .object({
    verifiedHeightCm: z.number().optional(),
    verifiedWeightKg: z.number().optional(),
    bmi: z.number().optional(),
    gpName: z.string().optional(),
    gpSurgery: z.string().optional(),
    gpAddress: z.string().optional(),
    gpPhone: z.string().optional(),
    hasRegularGp: z.boolean().optional(),
    consentShareWithGp: z.boolean().optional(),
    consentToTreatment: z.boolean().optional(),
    consentToDelivery: z.boolean().optional(),
    consentDataProcessing: z.boolean().optional(),
    prescriptionItems: z.array(PrescriptionItemInput).optional(),
  })
  .partial();

router.post("/consultations", async (req, res): Promise<void> => {
  try {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const extras = CreateConsultationExtras.safeParse(req.body);
  const extra = extras.success ? extras.data : {};

  const data = parsed.data;

  const actor = await resolveAuthActor(req.headers.authorization);
  let patientEmail = data.patientEmail.trim();
  let patientName = data.patientName.trim();
  if (actor?.role === "patient" && actor.email) {
    patientEmail = actor.email.toLowerCase();
    patientName = actor.name || patientName;
  }

  const [condition] = await db
    .select({ name: conditionsTable.name })
    .from(conditionsTable)
    .where(eq(conditionsTable.id, data.conditionId));

  if (!condition) {
    res.status(400).json({ error: "Condition not found" });
    return;
  }

  const answersObj = (data.answers ?? {}) as Record<string, unknown>;
  const hasRedFlag = detectRedFlags(answersObj);
  const id = randomUUID();
  const hasUploadedDocs =
    data.hasPhoto || hasPatientDocumentsInAnswers(answersObj);
  const patientDateOfBirth = extractDateOfBirthFromAnswers(answersObj);

  const duplicateMatches = await findDuplicatePatientMatches({
    patientName,
    dateOfBirth: patientDateOfBirth,
    patientEmail,
  });

  const shouldFlagDuplicate =
    duplicateMatches.length > 0 &&
    (isWeightManagementCondition(data.conditionId) || !!patientDateOfBirth);

  const riskFlags: string[] = [];
  if (shouldFlagDuplicate) {
    riskFlags.push("possible_duplicate_patient");
  }

  const verifiedWeightForComplex =
    extra.verifiedWeightKg != null
      ? Math.round(extra.verifiedWeightKg)
      : null;

  // ── Validate previousConsultationId ownership ──
  // Same protection as the compliance route: never trust the client's claim
  // that a previous consultation belongs to them.
  let safePreviousConsultationId: string | null = null;
  if (data.previousConsultationId) {
    const [prior] = await db
      .select({
        id: consultationsTable.id,
        patientEmail: consultationsTable.patientEmail,
      })
      .from(consultationsTable)
      .where(eq(consultationsTable.id, data.previousConsultationId));
    if (
      !prior ||
      prior.patientEmail.toLowerCase() !== patientEmail.toLowerCase()
    ) {
      res.status(403).json({
        error: "previousConsultationId does not belong to this patient.",
      });
      return;
    }
    safePreviousConsultationId = prior.id;
  }

  const autoComplex = await detectAutoComplexPatient({
    patientEmail,
    conditionId: data.conditionId,
    answers: answersObj,
    verifiedWeightKg: verifiedWeightForComplex,
    prescriptionItems: extra.prescriptionItems,
    conditionName: condition.name,
    previousConsultationId: safePreviousConsultationId,
    excludeConsultationId: id,
  });
  for (const flag of autoComplex.riskFlags) {
    if (!riskFlags.includes(flag)) riskFlags.push(flag);
  }

  const answersWithAutoComplex = {
    ...answersObj,
    ...autoComplex.answersPatch,
  };

  const answersWithTags = reconcileAutoOrderTags(answersWithAutoComplex, {
    actor: "System",
  });

  const insertPayload = {
    id,
    patientName,
    patientEmail,
    patientDateOfBirth,
    patientAge: data.patientAge,
    patientSex: data.patientSex,
    conditionId: data.conditionId,
    conditionName: condition.name,
    status: hasRedFlag ? "red_flag" : "pending",
    answers: answersWithTags,
    hasRedFlag,
    hasPhoto: hasUploadedDocs,
    photoUrls: [] as string[],
    isPregnant: data.isPregnant ?? null,
    allergies: data.allergies ?? null,
    currentMedications: data.currentMedications ?? null,
    medicalHistory: data.medicalHistory ?? null,
    previousConsultationId: safePreviousConsultationId,
    riskFlags,
    duplicatePatientMatches: duplicateMatches,
    verifiedHeightCm: extra.verifiedHeightCm ?? null,
    verifiedWeightKg: verifiedWeightForComplex,
    bmi: extra.bmi != null ? Math.round(extra.bmi) : null,
    gpName: extra.gpName ?? null,
    gpSurgery: extra.gpSurgery ?? null,
    gpAddress: extra.gpAddress ?? null,
    gpPhone: extra.gpPhone ?? null,
    hasRegularGp: extra.hasRegularGp ?? true,
    consentShareWithGp: extra.consentShareWithGp ?? false,
    consentToTreatment: extra.consentToTreatment ?? true,
    consentToDelivery: extra.consentToDelivery ?? true,
    consentDataProcessing: extra.consentDataProcessing ?? true,
    prescriptionItems: extra.prescriptionItems ?? [],
  };

  let consultation: (typeof consultationsTable.$inferSelect) | undefined;
  for (let attempt = 0; attempt < 20; attempt++) {
    const consultationNumber = await nextConsultationNumber(attempt);
    try {
      [consultation] = await db
        .insert(consultationsTable)
        .values({ ...insertPayload, consultationNumber })
        .returning();
      break;
    } catch (err) {
      if (!isUniqueViolation(err) || attempt === 19) throw err;
    }
  }

  if (!consultation) {
    res.status(500).json({ error: "Could not allocate a consultation reference. Please try again." });
    return;
  }

  await db.insert(notificationsTable).values({
    id: randomUUID(),
    recipientType: "pharmacist",
    recipientKey: "*",
    category: "consultation",
    title: `New consultation — ${patientName}`,
    body: `${condition.name} submitted and awaiting review.`,
    link: `/orders/${id}`,
    consultationId: id,
    orderId: null,
    read: false,
  });

  pushToAllPharmacists({
    title: `New order · ${patientName}`,
    body: condition.name,
    data: {
      type: "new_consultation",
      consultationId: id,
      patientName,
      conditionName: condition.name,
    },
  }).catch((err) => console.error("Pharmacist push failed:", err));

  res.status(201).json({
    ...jsonConsultation(consultation),
    duplicatePatientMatches: duplicateMatches,
    duplicateWarning: shouldFlagDuplicate,
  });
  } catch (err) {
    console.error("Create consultation failed:", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: createConsultationErrorMessage(err),
      });
    }
  }
});

router.get(
  "/consultations/patient/:email",
  requirePharmacist,
  async (req, res): Promise<void> => {
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
  },
);

router.get(
  "/consultations/:id",
  async (req: AuthedRequest, res): Promise<void> => {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetConsultationParams.safeParse({ id: raw });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    // Authz: pharmacist (any consultation) OR the patient who owns this consultation.
    const actor = await resolveAuthActor(req.headers.authorization);
    if (!actor) {
      res.status(401).json({ error: "Authentication required" });
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

    if (
      actor.role === "patient" &&
      actor.email?.toLowerCase() !== consultation.patientEmail.toLowerCase()
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    req.authActor = actor;
    res.json(jsonConsultation(consultation));
  },
);

router.post(
  "/consultations/:id/review",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
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

    const {
      action,
      pharmacistNote,
      prescription,
      prescriptionItems,
      referralInfo,
      rejectReason,
      referRecipientType,
      referRecipientName,
      referUrgency,
      rxClinicalCheckComplete,
    } = parsed.data;

    // Build a human-readable prescription string from structured items if provided.
    const items = Array.isArray(prescriptionItems) ? prescriptionItems : [];
    const formattedItemsText =
      items.length > 0
        ? items
            .map((it, i) => {
              const head = `${it.name}${it.strength ? ` ${it.strength}` : ""}${it.form ? ` ${it.form}` : ""}`;
              const parts: string[] = [head];
              if (it.quantity) parts.push(`Quantity: ${it.quantity}`);
              if (it.sig) parts.push(`Sig: ${it.sig}`);
              if (it.duration) parts.push(`Duration: ${it.duration}`);
              if (it.notes) parts.push(`Note: ${it.notes}`);
              return `${i + 1}. ${parts.join(" · ")}`;
            })
            .join("\n")
        : "";
    const finalPrescription =
      action === "approve" ? formattedItemsText || prescription || null : null;
    const itemsToStore = action === "approve" ? items : [];

    // Structured validation
    if (action === "reject") {
      if (!rejectReason || !pharmacistNote?.trim()) {
        res
          .status(400)
          .json({
            error: "A reject reason and explanation note are required.",
          });
        return;
      }
    }
    if (action === "refer") {
      if (!referRecipientType || !referRecipientName?.trim()) {
        res
          .status(400)
          .json({ error: "Referral recipient type and name are required." });
        return;
      }
    }
    if (action === "more_info" && !pharmacistNote?.trim()) {
      res
        .status(400)
        .json({
          error: "Please describe what additional information is needed.",
        });
      return;
    }
    if (action === "approve") {
      if (items.length === 0) {
        res
          .status(400)
          .json({
            error:
              "At least one prescription item is required to approve a consultation.",
          });
        return;
      }
      const incomplete = items.find(
        (it) => !it?.name?.trim() || !it?.strength?.trim() || !it?.sig?.trim(),
      );
      if (incomplete) {
        res
          .status(400)
          .json({
            error:
              "Each prescription item needs a medication name, strength, and dosing instructions (sig).",
          });
        return;
      }

      // ── Server-side drug-interaction safety guard ──
      // Hard-block contraindicated combinations even if a pharmacist tries to bypass the UI.
      // Major / moderate warnings still allow approval but require explicit clinical override
      // via interactionsAck=true on the request body.
      const [existingConsult] = await db
        .select({ medications: consultationsTable.currentMedications })
        .from(consultationsTable)
        .where(eq(consultationsTable.id, params.data.id));
      const patientMeds = (existingConsult?.medications ?? "")
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter(
          (s) => s && s.toLowerCase() !== "none" && s.toLowerCase() !== "n/a",
        );
      const warnings = await checkDrugInteractions(
        items.map((i) => i.name),
        patientMeds,
      );
      const blocking = warnings.filter((w) => w.severity === "contraindicated");
      const major = warnings.filter((w) => w.severity === "major");
      if (blocking.length > 0) {
        res.status(409).json({
          error: "Contraindicated drug interaction detected — cannot approve.",
          warnings,
        });
        return;
      }
      const ack =
        (req.body as { interactionsAck?: boolean }).interactionsAck === true;
      if (major.length > 0 && !ack) {
        res.status(409).json({
          error:
            "Major drug interaction detected. Add interactionsAck=true to override after clinical review.",
          warnings,
          requiresAck: true,
        });
        return;
      }
    }

    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      more_info: "more_info_needed",
      refer: "referred",
    };

    const reasonLabel = rejectReason
      ? (REJECT_REASON_LABELS[rejectReason] ?? rejectReason)
      : null;
    const recipientLabel = referRecipientType
      ? (REFER_RECIPIENT_LABELS[referRecipientType] ?? referRecipientType)
      : null;

    // Compose enriched referralInfo for refer
    const composedReferralInfo =
      action === "refer"
        ? `Referred to: ${recipientLabel}${referRecipientName ? ` — ${referRecipientName}` : ""}${referUrgency ? ` (Urgency: ${referUrgency})` : ""}${pharmacistNote ? `\n\n${pharmacistNote}` : ""}${referralInfo ? `\n\n${referralInfo}` : ""}`
        : (referralInfo ?? null);

    const composedRejectionNote =
      action === "reject"
        ? `Reason: ${reasonLabel}\n\n${pharmacistNote ?? ""}`
        : (pharmacistNote ?? null);

    // Patient-facing message in chat thread (computed before tx so we can reuse condition name)
    const buildPatientMessage = (
      conditionName: string,
      orderCreated: boolean,
    ): string => {
      switch (action) {
        case "approve":
          return `Good news — your consultation for ${conditionName} has been approved.${finalPrescription ? `\n\nPrescription:\n${finalPrescription}` : ""}${orderCreated ? `\n\nWe're preparing your medicine for tracked delivery — you can follow it from "My orders" in your account.` : ""}${pharmacistNote ? `\n\n${pharmacistNote}` : ""}`;
        case "reject":
          return `We're unable to approve your consultation for ${conditionName}.\n\nReason: ${reasonLabel}\n\n${pharmacistNote ?? ""}`;
        case "more_info":
          return `We need a little more information to review your consultation for ${conditionName}.\n\n${pharmacistNote ?? ""}\n\nPlease reply with the details above and we'll review again.`;
        case "refer":
          return `We've referred you for further care. Recipient: ${recipientLabel}${referRecipientName ? ` (${referRecipientName})` : ""}${referUrgency ? `, urgency: ${referUrgency}` : ""}.${pharmacistNote ? `\n\n${pharmacistNote}` : ""}`;
        default:
          return pharmacistNote ?? "";
      }
    };

    const titles: Record<string, string> = {
      approve: "Your consultation was approved",
      reject: "Your consultation was reviewed",
      more_info: "Pharmacist needs more info",
      refer: "You've been referred for further care",
    };

    // Atomic write: status + audit + chat message + notification all succeed together,
    // or none of them apply.
    let updated: typeof consultationsTable.$inferSelect | undefined;
    const rxChecked =
      action === "approve" && rxClinicalCheckComplete === true;
    const initialPmrStatus =
      action === "approve" ? (rxChecked ? "pick" : "inbox") : undefined;
    const pmrNow = action === "approve" ? new Date() : undefined;
    try {
      updated = await db.transaction(async (tx) => {
        const [row] = await tx
          .update(consultationsTable)
          .set({
            status: statusMap[action] ?? "pending",
            pharmacistNote: composedRejectionNote,
            prescription: finalPrescription,
            prescriptionItems: itemsToStore,
            referralInfo: composedReferralInfo,
            reviewedAt: new Date(),
            reviewedBy: req.authActor?.name ?? null,
            ...(action === "approve"
              ? {
                  rxClinicalCheckComplete: rxChecked,
                  rxClinicalCheckAt: rxChecked ? pmrNow : null,
                  rxClinicalCheckBy: rxChecked
                    ? (req.authActor?.name ?? null)
                    : null,
                  pmrWorkflowStatus: initialPmrStatus,
                  pmrWorkflowUpdatedAt: pmrNow,
                }
              : {}),
          })
          .where(eq(consultationsTable.id, params.data.id))
          .returning();

        if (!row) {
          // Bail out of transaction so caller can return 404
          throw new Error("CONSULTATION_NOT_FOUND");
        }

        if (
          action === "more_info" &&
          pharmacistNote?.trim().toUpperCase().startsWith("[CS_HOLD]")
        ) {
          const reviewer = req.authActor?.name ?? "Pharmacist";
          let taggedAnswers = {
            ...((row.answers ?? {}) as Record<string, unknown>),
          };
          const pending = applyOrderTagChange(taggedAnswers, {
            action: "add",
            tagId: "pending_customer_response",
            pharmacistName: reviewer,
            source: "cs_hold",
          });
          taggedAnswers = pending.answers;
          await tx
            .update(consultationsTable)
            .set({ answers: taggedAnswers })
            .where(eq(consultationsTable.id, row.id));
        }

        await tx.insert(consultationActionsTable).values({
          id: randomUUID(),
          consultationId: row.id,
          action,
          actorRole: "pharmacist",
          actorName: req.authActor?.name ?? "Pharmacist",
          details: {
            rejectReason: rejectReason ?? null,
            rejectReasonLabel: reasonLabel,
            referRecipientType: referRecipientType ?? null,
            referRecipientLabel: recipientLabel,
            referRecipientName: referRecipientName ?? null,
            referUrgency: referUrgency ?? null,
            prescription: finalPrescription,
            prescriptionItems: itemsToStore,
          },
          note: pharmacistNote ?? null,
        });

        // ── Auto-create order + delivery on approve with prescription items ──
        // Idempotent: if an RX order already exists for this consultation we reuse it.
        let createdOrderId: string | null = null;
        if (action === "approve" && itemsToStore.length > 0) {
          const [existingOrder] = await tx
            .select({ id: ordersTable.id })
            .from(ordersTable)
            .where(eq(ordersTable.consultationId, row.id))
            .limit(1);

          if (existingOrder) {
            createdOrderId = existingOrder.id;
          } else {
            // Resolve patient account (for shipping address, phone) if registered.
            const [patient] = await tx
              .select()
              .from(patientAccountsTable)
              .where(eq(patientAccountsTable.email, row.patientEmail))
              .limit(1);

            // Build shipping address with fallback chain:
            // 1) registered patient account address
            // 2) consultation deliveryAddress (free-text captured at consult time)
            // 3) skip auto-order if neither is available
            let shippingAddress: {
              line1: string;
              line2: string;
              city: string;
              postcode: string;
              country: string;
            } | null = null;

            if (patient?.addressLine1) {
              shippingAddress = {
                line1: patient.addressLine1,
                line2: patient.addressLine2 ?? "",
                city: patient.city ?? "",
                postcode: patient.postcode ?? "",
                country: "United Kingdom",
              };
            } else if (row.deliveryAddress?.trim()) {
              shippingAddress = {
                line1: row.deliveryAddress.trim(),
                line2: "",
                city: "",
                postcode: "",
                country: "United Kingdom",
              };
            }

            // Always attempt to create an RX order for approved consultations with
            // prescription items. Previously we only did this when a shipping
            // address could be resolved; in local/dev environments many demo
            // consultations lack an address and never produced an order. Create
            // a minimal order record (shippingAddress defaults to {}) so the
            // prescription appears in the Rx Orders queue and can be managed by
            // pharmacists. The partial unique index on consultation_id still
            // prevents duplicate orders under concurrent approvals.
            const orderId = randomUUID();
            const orderNumber = `RX-${Date.now().toString(36).toUpperCase()}-${Math.floor(
              Math.random() * 1000,
            )
              .toString()
              .padStart(3, "0")}`;
            const trackingNumber = `PCX${Math.floor(Math.random() * 1e10)
              .toString()
              .padStart(10, "0")}`;
            const eta = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

            const inserted = await tx
              .insert(ordersTable)
              .values({
                id: orderId,
                orderNumber,
                customerEmail: row.patientEmail,
                customerName: row.patientName,
                customerPhone: patient?.phone ?? null,
                // shippingAddress may be an object or null; the DB column has a
                // JSONB default of {} so provide the resolved object or an empty
                // object to satisfy the not-null constraint.
                shippingAddress: shippingAddress ?? {},
                itemsTotalGbp: 0,
                shippingGbp: 0,
                totalGbp: 0,
                status: "preparing",
                paymentStatus: "rx_internal",
                consultationId: row.id,
                prescriptionItems: itemsToStore,
                notes: `Prescription order for consultation ${row.id} (${row.conditionName})`,
              })
              .onConflictDoNothing({ target: ordersTable.consultationId })
              .returning({ id: ordersTable.id });

            if (inserted.length > 0) {
              await tx.insert(deliveriesTable).values({
                id: randomUUID(),
                orderId,
                carrier: "EveryDayMeds Express",
                trackingNumber,
                status: "preparing",
                estimatedDelivery: eta,
                events: [
                  {
                    ts: new Date().toISOString(),
                    status: "preparing",
                    message:
                      "Prescription approved by pharmacist — preparing for tracked delivery.",
                  },
                ],
              });
              createdOrderId = orderId;
            } else {
              const [winner] = await tx
                .select({ id: ordersTable.id })
                .from(ordersTable)
                .where(eq(ordersTable.consultationId, row.id))
                .limit(1);
              createdOrderId = winner?.id ?? null;
            }
          }
        }

        await tx.insert(consultationMessagesTable).values({
          id: randomUUID(),
          consultationId: row.id,
          patientEmail: row.patientEmail,
          senderRole: "pharmacist",
          senderName: req.authActor?.name ?? "Pharmacist",
          body: buildPatientMessage(row.conditionName, !!createdOrderId),
          kind: action,
          readByPatient: false,
          readByPharmacist: true,
        });

        await tx.insert(notificationsTable).values({
          id: randomUUID(),
          recipientType: "patient",
          recipientKey: row.patientEmail,
          category: "consultation",
          title: titles[action] ?? "Consultation update",
          body:
            action === "approve" && createdOrderId
              ? `${row.conditionName} approved — we're preparing your medicine for tracked delivery.`
              : `${row.conditionName} — open to read full details and reply.`,
          link:
            action === "approve" && createdOrderId
              ? `/order-confirmation/${createdOrderId}`
              : "/my-messages",
          consultationId: row.id,
          orderId: createdOrderId,
          read: false,
        });

        return row;
      });
    } catch (err) {
      if (err instanceof Error && err.message === "CONSULTATION_NOT_FOUND") {
        res.status(404).json({ error: "Consultation not found" });
        return;
      }
      req.log?.error?.({ err }, "Consultation review transaction failed");
      res.status(500).json({ error: "Failed to record review" });
      return;
    }

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
  },
);

const PatchDocumentReviewBody = z.object({
  docId: z.string().min(1),
  status: z.enum(["verified", "pending", "rejected"]),
  sendUploadEmail: z.boolean().optional(),
  rejectionNote: z.string().max(2000).optional(),
  rejectionTemplateId: z.string().max(80).optional(),
  rejectionTemplateTitle: z.string().max(120).optional(),
  emailSubject: z.string().max(200).optional(),
});

const PatientDocumentUploadBody = z.object({
  docId: z.string().min(1),
  dataUrl: z.string().min(32).max(PATIENT_DOCUMENT_DATA_URL_MAX),
  messageBody: z.string().max(4000).optional(),
});

const PatchDocumentRequirementsBody = z.object({
  slotId: EvidenceSlotIdSchema,
  requirement: DocumentRequirementSchema,
  sendUploadEmail: z.boolean().optional(),
});

const ResendUploadEmailBody = z.object({
  docId: z.string().min(1),
  note: z.string().max(2000).optional(),
});

const PatchPrescriptionItemsBody = z.object({
  prescriptionItems: z.array(PrescriptionItemInput).min(1).max(20),
});

type ConsultationRow = typeof consultationsTable.$inferSelect;

async function recordDocumentUploadRequestComms(opts: {
  consultation: ConsultationRow;
  docId: string;
  docTitle: string;
  pharmacistName: string;
  emailSent?: boolean;
  note?: string;
}): Promise<void> {
  const { consultation, docId, docTitle, pharmacistName, emailSent, note } =
    opts;
  const shortDoc = docTitle.replace(/ video$/i, "").trim();
  const baseBody = emailSent
    ? `Please upload ${shortDoc}. We've also sent you a secure upload link by email.`
    : `Please upload ${shortDoc} using the button below or from My consultations.`;
  const body = note?.trim() ? `${baseBody}\n\n${note.trim()}` : baseBody;
  const uploadPath = isEvidenceSlotId(docId)
    ? buildDocumentUploadPath(consultation.id, docId)
    : null;

  await db.insert(consultationMessagesTable).values({
    id: randomUUID(),
    consultationId: consultation.id,
    patientEmail: consultation.patientEmail,
    senderRole: "pharmacist",
    senderName: pharmacistName,
    body,
    kind: "document_upload_requested",
    meta: JSON.stringify({
      docId,
      docTitle,
      emailSent: Boolean(emailSent),
      uploadPath,
    }),
    readByPatient: false,
    readByPharmacist: true,
  });

  await db.insert(consultationActionsTable).values({
    id: randomUUID(),
    consultationId: consultation.id,
    action: "document_upload_requested",
    actorRole: "pharmacist",
    actorName: pharmacistName,
    details: { docId, docTitle, emailSent: Boolean(emailSent) },
    note: note?.trim()?.slice(0, 500) ?? body.slice(0, 500),
  });

  if (isEvidenceSlotId(docId) && uploadPath) {
    await db.insert(notificationsTable).values({
      id: randomUUID(),
      recipientType: "patient",
      recipientKey: consultation.patientEmail,
      category: "document",
      title: `Upload needed: ${shortDoc}`,
      body: (note?.trim() || `Please upload ${shortDoc}.`).slice(0, 200),
      link: uploadPath,
      consultationId: consultation.id,
      orderId: null,
      read: false,
    });
  }
}

async function recordDocumentReviewComms(opts: {
  consultation: ConsultationRow;
  docId: string;
  docTitle: string;
  pharmacistName: string;
  status: "verified" | "rejected";
  emailSent?: boolean;
  templateTitle?: string;
  note?: string;
}): Promise<void> {
  const {
    consultation,
    docId,
    docTitle,
    pharmacistName,
    status,
    emailSent,
    templateTitle,
    note,
  } = opts;

  const shortDoc = docTitle.replace(/ video$/i, "").trim();
  const title =
    status === "verified"
      ? `Verified ${shortDoc}`
      : `Rejected ${shortDoc}${templateTitle ? ` — ${templateTitle}` : ""}`;

  const body =
    status === "verified"
      ? `Your ${shortDoc} has been verified by the pharmacist.`
      : emailSent
        ? `Your ${shortDoc} was rejected. Please upload a new file — we've also sent you a secure upload link by email${templateTitle ? ` (${templateTitle})` : ""}.`
        : `Your ${shortDoc} was rejected. Please upload a new file using the button below${templateTitle ? ` (${templateTitle})` : ""}.`;

  const expandable =
    note?.trim() ||
    (status === "rejected" && templateTitle
      ? `Reason: ${templateTitle}`
      : undefined);

  await db.insert(consultationMessagesTable).values({
    id: randomUUID(),
    consultationId: consultation.id,
    patientEmail: consultation.patientEmail,
    senderRole: "pharmacist",
    senderName: pharmacistName,
    body: expandable ? `${body}\n\n${expandable}` : body,
    kind: status === "verified" ? "document_verified" : "document_rejected",
    meta: JSON.stringify({
      docId,
      docTitle,
      status,
      emailSent: Boolean(emailSent),
      templateTitle: templateTitle ?? null,
      uploadPath: isEvidenceSlotId(docId)
        ? buildDocumentUploadPath(consultation.id, docId)
        : null,
    }),
    readByPatient: false,
    readByPharmacist: true,
  });

  await db.insert(consultationActionsTable).values({
    id: randomUUID(),
    consultationId: consultation.id,
    action: status === "verified" ? "document_verified" : "document_rejected",
    actorRole: "pharmacist",
    actorName: pharmacistName,
    details: { docId, docTitle, emailSent: Boolean(emailSent), templateTitle },
    note: body.slice(0, 500),
  });

  if (status === "rejected" && isEvidenceSlotId(docId)) {
    const uploadPath = buildDocumentUploadPath(consultation.id, docId);
    const notifyBody = [
      `${docTitle} was rejected.`,
      note?.trim() || templateTitle || "Please upload a clearer replacement.",
      emailSent
        ? "We've also sent you a secure upload link by email."
        : "Upload from Messages or My Consultations below.",
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 200);

    await db.insert(notificationsTable).values({
      id: randomUUID(),
      recipientType: "patient",
      recipientKey: consultation.patientEmail,
      category: "document",
      title: `Action needed: ${shortDoc}`,
      body: notifyBody,
      link: uploadPath,
      consultationId: consultation.id,
      orderId: null,
      read: false,
    });
  }
}

async function sendUploadEmailForSlot(opts: {
  consultation: ConsultationRow;
  docId: string;
  pharmacistName: string;
  note?: string;
  emailSubject?: string;
  templateId?: string;
  templateTitle?: string;
  reviews: Record<string, DocumentReviewEntry>;
}): Promise<{ sentAt: string; count: number }> {
  const {
    consultation,
    docId,
    pharmacistName,
    note,
    emailSubject,
    templateId,
    templateTitle,
    reviews,
  } = opts;
  if (!isEvidenceSlotId(docId)) {
    throw new Error("Invalid document slot");
  }
  const docTitle = EVIDENCE_SLOT_TITLES[docId];
  const uploadUrl = buildDocumentUploadUrl(consultation.id, docId);
  const sent = await sendDocumentReuploadEmail({
    patientName: consultation.patientName,
    patientEmail: consultation.patientEmail,
    consultationId: consultation.id,
    conditionName: consultation.conditionName,
    docTitle,
    uploadUrl,
    pharmacistNote: note ?? null,
    emailSubject: emailSubject ?? null,
  });
  const sentAt = new Date().toISOString();
  const prev = reviews[docId];
  const count = (prev?.uploadEmailCount ?? 0) + 1;
  reviews[docId] = {
    ...prev,
    status: prev?.status ?? "pending",
    reviewedBy: pharmacistName,
    reviewedAt: prev?.reviewedAt ?? sentAt,
    uploadEmailSentAt: sentAt,
    uploadEmailCount: count,
    rejectionNote: note ?? prev?.rejectionNote,
    rejectionTemplateId: templateId ?? prev?.rejectionTemplateId,
    rejectionTemplateTitle: templateTitle ?? prev?.rejectionTemplateTitle,
    emailSubject: emailSubject ?? prev?.emailSubject,
  };
  return { sentAt, count };
}

router.patch(
  "/consultations/:id/document-reviews",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    try {
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const params = GetConsultationParams.safeParse({ id: rawId });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = PatchDocumentReviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }

    let answers = {
      ...((existing.answers ?? {}) as Record<string, unknown>),
    };
    if (isEvidenceSlotId(parsed.data.docId)) {
      answers = applyPatientDocumentUploadRequest(answers, parsed.data.docId);
    }
    const reviews = {
      ...((answers.document_reviews ?? {}) as Record<string, unknown>),
    };
    const pharmacistName =
      req.authActor?.name ??
      (typeof req.headers["x-pharmacist-name"] === "string"
        ? req.headers["x-pharmacist-name"]
        : "Pharmacist");

    const reviewedAt = new Date().toISOString();
    const docTitle = isEvidenceSlotId(parsed.data.docId)
      ? EVIDENCE_SLOT_TITLES[parsed.data.docId]
      : parsed.data.docId;

    const entry: DocumentReviewEntry = {
      status: parsed.data.status,
      reviewedBy: pharmacistName,
      reviewedAt,
      rejectionNote: parsed.data.rejectionNote,
      rejectionTemplateId: parsed.data.rejectionTemplateId,
      rejectionTemplateTitle: parsed.data.rejectionTemplateTitle,
      emailSubject: parsed.data.emailSubject,
    };
    reviews[parsed.data.docId] = entry;
    answers.document_reviews = reviews;

    let emailSent = false;
    const shouldSendUploadEmail =
      isEvidenceSlotId(parsed.data.docId) &&
      (parsed.data.sendUploadEmail === true ||
        (parsed.data.status === "rejected" &&
          parsed.data.sendUploadEmail !== false));

    if (shouldSendUploadEmail) {
      try {
        await sendUploadEmailForSlot({
          consultation: existing,
          docId: parsed.data.docId,
          pharmacistName,
          note: parsed.data.rejectionNote,
          emailSubject: parsed.data.emailSubject,
          templateId: parsed.data.rejectionTemplateId,
          templateTitle: parsed.data.rejectionTemplateTitle,
          reviews: reviews as Record<string, DocumentReviewEntry>,
        });
        emailSent = true;
      } catch (err) {
        console.error("Document upload email failed:", err);
      }
      answers.document_reviews = reviews;
      if (
        parsed.data.status === "rejected" &&
        (existing.status === "pending" || existing.status === "patient_responded")
      ) {
        await db
          .update(consultationsTable)
          .set({ status: "more_info_needed" })
          .where(eq(consultationsTable.id, params.data.id));
      } else if (
        parsed.data.sendUploadEmail === true &&
        (existing.status === "pending" || existing.status === "approved")
      ) {
        await db
          .update(consultationsTable)
          .set({ status: "more_info_needed" })
          .where(eq(consultationsTable.id, params.data.id));
      }
    }

    if (shouldSendUploadEmail && isEvidenceSlotId(parsed.data.docId)) {
      answers = applyUploadLinkRequestedOrderTags(answers, {
        slotId: parsed.data.docId,
        pharmacistName,
        note: parsed.data.rejectionNote,
      });
    }

    if (isEvidenceSlotId(parsed.data.docId)) {
      answers = reconcileAutoOrderTags(answers, {
        actor: pharmacistName,
        photoUrls: (existing.photoUrls ?? []) as string[],
      });
    }

    if (parsed.data.status === "verified" || parsed.data.status === "rejected") {
      await recordDocumentReviewComms({
        consultation: existing,
        docId: parsed.data.docId,
        docTitle,
        pharmacistName,
        status: parsed.data.status,
        emailSent,
        templateTitle: parsed.data.rejectionTemplateTitle,
        note: parsed.data.rejectionNote,
      });
    } else if (shouldSendUploadEmail && parsed.data.sendUploadEmail === true) {
      await recordDocumentUploadRequestComms({
        consultation: existing,
        docId: parsed.data.docId,
        docTitle,
        pharmacistName,
        emailSent,
        note: parsed.data.rejectionNote,
      });
    }

    const [updated] = await db
      .update(consultationsTable)
      .set({ answers })
      .where(eq(consultationsTable.id, params.data.id))
      .returning();

    res.json({
      ...jsonConsultation(updated),
      emailSent,
      uploadUrl: isEvidenceSlotId(parsed.data.docId)
        ? buildDocumentUploadUrl(existing.id, parsed.data.docId)
        : undefined,
    });
    } catch (err) {
      console.error("document-reviews failed:", err);
      res.status(500).json({
        error:
          err instanceof Error ? err.message : "Could not save document review",
      });
    }
  },
);

const PatchOrderTagsBody = z.object({
  action: z.enum([
    "add",
    "add_batch",
    "remove",
    "remove_batch",
    "sync_weight",
    "sync_documents",
    "save_hold_draft",
  ]),
  tagId: z.string().min(1).max(80).optional(),
  tagIds: z.array(z.string().min(1).max(80)).min(1).max(30).optional(),
  label: z.string().min(1).max(48).optional(),
  labels: z.record(z.string().min(1).max(48)).optional(),
  pharmacistName: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
  source: z
    .enum([
      "manual",
      "document_reject",
      "weight_monitoring",
      "cs_hold",
      "prescriber_hold",
      "document_requirement",
      "system",
    ])
    .optional(),
});

router.patch(
  "/consultations/:id/order-tags",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    try {
      const rawId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const params = GetConsultationParams.safeParse({ id: rawId });
      if (!params.success) {
        res.status(400).json({ error: params.error.message });
        return;
      }

      const parsed = PatchOrderTagsBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const [existing] = await db
        .select()
        .from(consultationsTable)
        .where(eq(consultationsTable.id, params.data.id));

      if (!existing) {
        res.status(404).json({ error: "Consultation not found" });
        return;
      }

      const pharmacistName =
        parsed.data.pharmacistName ||
        req.authActor?.name ||
        "Pharmacist";

      let answers = {
        ...((existing.answers ?? {}) as Record<string, unknown>),
      };

      if (parsed.data.action === "sync_documents") {
        answers = reconcileAutoOrderTags(answers, {
          actor: pharmacistName,
          photoUrls: (existing.photoUrls ?? []) as string[],
        });
      } else if (parsed.data.action === "sync_weight") {
        const { tagId } = parsed.data;
        if (tagId === "gained_7_percent" || tagId === "lost_10_percent") {
          const result = applyOrderTagChange(answers, {
            action: "add",
            tagId,
            pharmacistName,
            source: "weight_monitoring",
          });
          answers = result.answers;
        }
      } else if (parsed.data.action === "save_hold_draft") {
        const note = parsed.data.note?.trim();
        if (!note) {
          res.status(400).json({ error: "note is required" });
          return;
        }
        const draftKey =
          parsed.data.source === "cs_hold"
            ? "cs_hold_draft"
            : parsed.data.source === "prescriber_hold"
              ? "prescriber_hold_draft"
              : "hold_draft";
        answers = {
          ...answers,
          [draftKey]: {
            note,
            updatedAt: new Date().toISOString(),
            updatedBy: pharmacistName,
          },
        };
      } else if (parsed.data.action === "add_batch") {
        const tagIds = parsed.data.tagIds;
        if (!tagIds?.length) {
          res.status(400).json({ error: "tagIds is required" });
          return;
        }
        const result = applyOrderTagsBatchAdd(answers, {
          tagIds,
          pharmacistName,
          note: parsed.data.note,
          labels: parsed.data.labels,
        });
        answers = result.answers;
      } else if (parsed.data.action === "remove_batch") {
        const tagIds = parsed.data.tagIds;
        if (!tagIds?.length) {
          res.status(400).json({ error: "tagIds is required" });
          return;
        }
        const result = applyOrderTagsBatchRemove(answers, {
          tagIds,
          pharmacistName,
          note: parsed.data.note,
        });
        answers = result.answers;
      } else {
        if (!parsed.data.tagId) {
          res.status(400).json({ error: "tagId is required" });
          return;
        }
        const result = applyOrderTagChange(answers, {
          action: parsed.data.action,
          tagId: parsed.data.tagId,
          pharmacistName,
          source: parsed.data.source ?? "manual",
          note: parsed.data.note,
          label: parsed.data.label,
        });
        answers = result.answers;
      }

      // Adding "Pending customer response" parks the order with the patient so
      // their next reply auto-advances it to the "Replied – Needs Review" queue.
      const addsPendingResponse =
        (parsed.data.action === "add" &&
          parsed.data.tagId === "pending_customer_response") ||
        (parsed.data.action === "add_batch" &&
          (parsed.data.tagIds ?? []).includes("pending_customer_response"));
      const statusUpdate =
        addsPendingResponse &&
        (existing.status === "pending" ||
          existing.status === "approved" ||
          existing.status === "red_flag")
          ? "more_info_needed"
          : undefined;

      const [updated] = await db
        .update(consultationsTable)
        .set({ answers, ...(statusUpdate ? { status: statusUpdate } : {}) })
        .where(eq(consultationsTable.id, params.data.id))
        .returning();

      res.json(jsonConsultation(updated));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update tags";
      res.status(400).json({ error: msg });
    }
  },
);

router.patch(
  "/consultations/:id/document-requirements",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetConsultationParams.safeParse({ id: rawId });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = PatchDocumentRequirementsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }

    let answers = { ...((existing.answers ?? {}) as Record<string, unknown>) };
    const before = getDocumentRequirements(answers);
    const from = before[parsed.data.slotId];
    const to = parsed.data.requirement as DocumentRequirement;
    if (from === to) {
      res.json(jsonConsultation(existing));
      return;
    }

    const pharmacistName =
      req.authActor?.name ??
      (typeof req.headers["x-pharmacist-name"] === "string"
        ? req.headers["x-pharmacist-name"]
        : "Pharmacist");

    const docReqs = {
      ...((answers.document_requirements ?? {}) as Record<string, DocumentRequirement>),
      [parsed.data.slotId]: to,
    };
    answers.document_requirements = docReqs;

    if (to === "required") {
      Object.assign(answers, trackOrderDocumentSlot(answers, parsed.data.slotId));
    }

    const history = [
      ...((answers.document_requirement_history ?? []) as DocumentRequirementChange[]),
      {
        at: new Date().toISOString(),
        by: pharmacistName,
        slotId: parsed.data.slotId,
        from,
        to,
      },
    ];
    answers.document_requirement_history = history;

    const docs = (answers.patient_documents ?? {}) as PatientDocumentsMap;
    const pending = {
      ...((answers.documents_pending ?? {}) as Record<string, boolean>),
    };
    if (parsed.data.slotId === "previous-prescription") {
      pending.previous_prescription =
        to === "required" && !slotHasUploads(docs["previous-prescription"]);
    }
    if (parsed.data.slotId === "previous-bmi-verification") {
      pending.previous_bmi_verification =
        to === "required" && !slotHasUploads(docs["previous-bmi-verification"]);
    }
    answers.documents_pending = pending;

    const docTitle = EVIDENCE_SLOT_TITLES[parsed.data.slotId];
    const noteLabel =
      to === "required"
        ? `${docTitle} requirement changed to required.`
        : `${docTitle} requirement changed to not required.`;

    let emailSent = false;
    const shouldEmail =
      to === "required" &&
      parsed.data.sendUploadEmail !== false &&
      !slotHasUploads(docs[parsed.data.slotId]);

    if (shouldEmail) {
      const reviews = {
        ...((answers.document_reviews ?? {}) as Record<string, DocumentReviewEntry>),
      };
      try {
        await sendUploadEmailForSlot({
          consultation: existing,
          docId: parsed.data.slotId,
          pharmacistName,
          note: buildCriteriaEmailNote(parsed.data.slotId),
          reviews,
        });
        answers.document_reviews = reviews;
        emailSent = true;
      } catch (err) {
        console.error("Document requirement upload email failed:", err);
      }
    }

    await db.insert(consultationActionsTable).values({
      id: randomUUID(),
      consultationId: existing.id,
      action: "document_requirement_changed",
      actorRole: "pharmacist",
      actorName: pharmacistName,
      details: {
        slotId: parsed.data.slotId,
        docTitle,
        from,
        to,
        emailSent,
      },
      note: noteLabel,
    });

    if (to === "required") {
      answers = applyUploadLinkRequestedOrderTags(answers, {
        slotId: parsed.data.slotId,
        pharmacistName,
        note: noteLabel,
      });
    }

    answers = reconcileAutoOrderTags(answers, {
      actor: pharmacistName,
      photoUrls: (existing.photoUrls ?? []) as string[],
    });

    const statusUpdate =
      emailSent &&
      (existing.status === "pending" || existing.status === "approved")
        ? "more_info_needed"
        : undefined;

    const [updated] = await db
      .update(consultationsTable)
      .set({
        answers,
        ...(statusUpdate ? { status: statusUpdate } : {}),
      })
      .where(eq(consultationsTable.id, params.data.id))
      .returning();

    res.json({
      ...jsonConsultation(updated),
      emailSent,
      requirementChange: { from, to, note: noteLabel },
    });
  },
);

router.post(
  "/consultations/:id/document-upload-requests",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetConsultationParams.safeParse({ id: rawId });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = ResendUploadEmailBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (!isEvidenceSlotId(parsed.data.docId)) {
      res.status(400).json({ error: "Invalid document slot" });
      return;
    }

    const [existing] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }

    let answers = { ...((existing.answers ?? {}) as Record<string, unknown>) };
    answers = applyPatientDocumentUploadRequest(answers, parsed.data.docId);
    const reviews = {
      ...((answers.document_reviews ?? {}) as Record<string, DocumentReviewEntry>),
    };
    const pharmacistName =
      req.authActor?.name ??
      (typeof req.headers["x-pharmacist-name"] === "string"
        ? req.headers["x-pharmacist-name"]
        : "Pharmacist");

    const docTitle = EVIDENCE_SLOT_TITLES[parsed.data.docId];
    const { sentAt } = await sendUploadEmailForSlot({
      consultation: existing,
      docId: parsed.data.docId,
      pharmacistName,
      note: parsed.data.note,
      reviews,
    });
    answers.document_reviews = reviews;

    await recordDocumentUploadRequestComms({
      consultation: existing,
      docId: parsed.data.docId,
      docTitle,
      pharmacistName,
      emailSent: true,
      note: parsed.data.note,
    });

    let taggedAnswers = applyUploadLinkRequestedOrderTags(answers, {
      slotId: parsed.data.docId,
      pharmacistName,
      note: parsed.data.note,
    });
    taggedAnswers = reconcileAutoOrderTags(taggedAnswers, {
      actor: pharmacistName,
      photoUrls: (existing.photoUrls ?? []) as string[],
    });

    const [updated] = await db
      .update(consultationsTable)
      .set({ answers: taggedAnswers, status: "more_info_needed" })
      .where(eq(consultationsTable.id, params.data.id))
      .returning();

    res.json({
      consultation: jsonConsultation(updated),
      emailSent: true,
      uploadEmailSentAt: sentAt,
      uploadUrl: buildDocumentUploadUrl(existing.id, parsed.data.docId),
    });
  },
);

router.post(
  "/consultations/:id/patient-documents",
  async (req: AuthedRequest, res): Promise<void> => {
    const actor = await resolveAuthActor(req.headers.authorization);
    if (!actor) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetConsultationParams.safeParse({ id: rawId });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = PatientDocumentUploadBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (!isEvidenceSlotId(parsed.data.docId)) {
      res.status(400).json({ error: "Invalid document slot" });
      return;
    }

    const mimeCheck = validatePatientDocumentDataUrl(
      parsed.data.dataUrl,
      parsed.data.docId,
    );
    if (!mimeCheck.ok) {
      res.status(400).json({ error: mimeCheck.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }

    if (
      actor.role === "patient" &&
      actor.email?.toLowerCase() !== existing.patientEmail.toLowerCase()
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (actor.role !== "patient" && actor.role !== "pharmacist") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    let answers = applyPatientDocumentUpload(
      { ...((existing.answers ?? {}) as Record<string, unknown>) },
      parsed.data.docId,
      parsed.data.dataUrl,
    );
    answers = reconcileAutoOrderTags(answers, {
      actor: actor.name,
      photoUrls: (existing.photoUrls ?? []) as string[],
    });

    const docTitle = EVIDENCE_SLOT_TITLES[parsed.data.docId];
    const messageText =
      parsed.data.messageBody?.trim() ||
      (actor.role === "patient"
        ? `Uploaded a new ${docTitle} via the patient portal.`
        : `${actor.name} uploaded ${docTitle} on your behalf.`);

    await db.insert(consultationMessagesTable).values({
      id: randomUUID(),
      consultationId: existing.id,
      patientEmail: existing.patientEmail,
      senderRole: actor.role,
      senderName: actor.name,
      body: messageText,
      kind: "document_upload",
      meta: JSON.stringify({
        docId: parsed.data.docId,
        docTitle,
      }),
      readByPatient: actor.role === "patient",
      readByPharmacist: actor.role === "pharmacist",
    });

    await db.insert(consultationActionsTable).values({
      id: randomUUID(),
      consultationId: existing.id,
      action: "document_uploaded",
      actorRole: actor.role,
      actorName: actor.name,
      details: { docId: parsed.data.docId, docTitle },
      note: messageText.slice(0, 500),
    });

    const nextStatus =
      actor.role === "patient" &&
      (existing.status === "more_info_needed" ||
        existing.status === "pending")
        ? "patient_responded"
        : existing.status;

    if (actor.role === "patient") {
      await db.insert(notificationsTable).values({
        id: randomUUID(),
        recipientType: "pharmacist",
        recipientKey: "*",
        category: "document",
        title: `${existing.patientName} uploaded ${docTitle}`,
        body: messageText.slice(0, 200),
        link: `/orders/${existing.id}`,
        consultationId: existing.id,
        orderId: null,
        read: false,
      });
      pushToAllPharmacists({
        title: `${existing.patientName} · document upload`,
        body: docTitle,
        data: {
          type: "patient_document_upload",
          consultationId: existing.id,
          patientName: existing.patientName,
        },
      }).catch((err) => console.error("Pharmacist push failed:", err));
    }

    const [updated] = await db
      .update(consultationsTable)
      .set({
        answers,
        status: nextStatus,
        hasPhoto: true,
      })
      .where(eq(consultationsTable.id, params.data.id))
      .returning();

    res.json(jsonConsultation(updated));
  },
);

const PatchPatientDetailsBody = z.object({
  patientName: z.string().min(1).max(200).optional(),
  patientEmail: z.string().email().max(200).optional(),
  deliveryAddress: z.string().max(500).optional(),
  gpName: z.string().max(200).optional(),
  gpSurgery: z.string().max(200).optional(),
  gpAddress: z.string().max(500).optional(),
});

const PatchMeasurementsBody = z.object({
  verifiedHeightCm: z.number().min(100).max(250),
  verifiedWeightKg: z.number().min(30).max(350),
  bmi: z.number().min(10).max(80),
});

router.patch(
  "/consultations/:id/measurements",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetConsultationParams.safeParse({ id: rawId });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = PatchMeasurementsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }

    const heightCm = Math.round(parsed.data.verifiedHeightCm);
    const weightKg = Math.round(parsed.data.verifiedWeightKg);
    const bmiRounded = Math.round(parsed.data.bmi * 10) / 10;
    const answers = {
      ...(typeof existing.answers === "object" && existing.answers !== null
        ? (existing.answers as Record<string, unknown>)
        : {}),
      height_cm: heightCm,
      weight_kg: weightKg,
      bmi: bmiRounded,
    };

    const [updated] = await db
      .update(consultationsTable)
      .set({
        verifiedHeightCm: heightCm,
        verifiedWeightKg: weightKg,
        bmi: Math.round(bmiRounded),
        answers,
      })
      .where(eq(consultationsTable.id, params.data.id))
      .returning();

    res.json(jsonConsultation(updated));
  },
);

router.patch(
  "/consultations/:id/patient-details",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetConsultationParams.safeParse({ id: rawId });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = PatchPatientDetailsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const [existing] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }

    const patch: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      patch[key] = typeof value === "string" ? value.trim() || null : value;
    }

    const [updated] = await db
      .update(consultationsTable)
      .set(patch)
      .where(eq(consultationsTable.id, params.data.id))
      .returning();

    res.json(jsonConsultation(updated));
  },
);

router.patch(
  "/consultations/:id/prescription-items",
  requirePharmacist,
  async (req: AuthedRequest, res): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = GetConsultationParams.safeParse({ id: rawId });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = PatchPrescriptionItemsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(consultationsTable)
      .where(eq(consultationsTable.id, params.data.id));
    if (!existing) {
      res.status(404).json({ error: "Consultation not found" });
      return;
    }

    const [updated] = await db
      .update(consultationsTable)
      .set({ prescriptionItems: parsed.data.prescriptionItems })
      .where(eq(consultationsTable.id, params.data.id))
      .returning();

    res.json(jsonConsultation(updated));
  },
);

export default router;

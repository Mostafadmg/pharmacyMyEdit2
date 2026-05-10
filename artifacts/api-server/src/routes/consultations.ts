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
import { requirePharmacist, resolveAuthActor, type AuthedRequest } from "../middlewares/auth";
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
  "chest pain", "difficulty breathing", "severe headache", "vision loss",
  "loss of consciousness", "paralysis", "severe allergic", "anaphylaxis",
  "suicidal", "self-harm", "blood in stool", "coughing blood"
];

function detectRedFlags(answers: Record<string, unknown>): boolean {
  const answersStr = JSON.stringify(answers).toLowerCase();
  return RED_FLAG_KEYWORDS.some(flag => answersStr.includes(flag));
}

router.get("/consultations", requirePharmacist, async (req, res): Promise<void> => {
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
    if (!prior || prior.patientEmail.toLowerCase() !== data.patientEmail.toLowerCase()) {
      res.status(403).json({
        error: "previousConsultationId does not belong to this patient.",
      });
      return;
    }
    safePreviousConsultationId = prior.id;
  }

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
      previousConsultationId: safePreviousConsultationId,
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

router.get("/consultations/:id", async (req: AuthedRequest, res): Promise<void> => {
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

  if (actor.role === "patient" && actor.email?.toLowerCase() !== consultation.patientEmail.toLowerCase()) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  req.authActor = actor;
  res.json(GetConsultationResponse.parse(consultation));
});

router.post("/consultations/:id/review", requirePharmacist, async (req: AuthedRequest, res): Promise<void> => {
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
  } = parsed.data;

  // Build a human-readable prescription string from structured items if provided.
  const items = Array.isArray(prescriptionItems) ? prescriptionItems : [];
  const formattedItemsText = items.length > 0
    ? items.map((it, i) => {
        const head = `${it.name}${it.strength ? ` ${it.strength}` : ""}${it.form ? ` ${it.form}` : ""}`;
        const parts: string[] = [head];
        if (it.quantity) parts.push(`Quantity: ${it.quantity}`);
        if (it.sig) parts.push(`Sig: ${it.sig}`);
        if (it.duration) parts.push(`Duration: ${it.duration}`);
        if (it.notes) parts.push(`Note: ${it.notes}`);
        return `${i + 1}. ${parts.join(" · ")}`;
      }).join("\n")
    : "";
  const finalPrescription = action === "approve"
    ? (formattedItemsText || prescription || null)
    : null;
  const itemsToStore = action === "approve" ? items : [];

  // Structured validation
  if (action === "reject") {
    if (!rejectReason || !pharmacistNote?.trim()) {
      res.status(400).json({ error: "A reject reason and explanation note are required." });
      return;
    }
  }
  if (action === "refer") {
    if (!referRecipientType || !referRecipientName?.trim()) {
      res.status(400).json({ error: "Referral recipient type and name are required." });
      return;
    }
  }
  if (action === "more_info" && !pharmacistNote?.trim()) {
    res.status(400).json({ error: "Please describe what additional information is needed." });
    return;
  }
  if (action === "approve") {
    if (items.length === 0) {
      res.status(400).json({ error: "At least one prescription item is required to approve a consultation." });
      return;
    }
    const incomplete = items.find(
      (it) => !it?.name?.trim() || !it?.strength?.trim() || !it?.sig?.trim(),
    );
    if (incomplete) {
      res.status(400).json({ error: "Each prescription item needs a medication name, strength, and dosing instructions (sig)." });
      return;
    }
  }

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    more_info: "more_info_needed",
    refer: "referred",
  };

  const reasonLabel = rejectReason ? (REJECT_REASON_LABELS[rejectReason] ?? rejectReason) : null;
  const recipientLabel = referRecipientType ? (REFER_RECIPIENT_LABELS[referRecipientType] ?? referRecipientType) : null;

  // Compose enriched referralInfo for refer
  const composedReferralInfo = action === "refer"
    ? `Referred to: ${recipientLabel}${referRecipientName ? ` — ${referRecipientName}` : ""}${referUrgency ? ` (Urgency: ${referUrgency})` : ""}${pharmacistNote ? `\n\n${pharmacistNote}` : ""}${referralInfo ? `\n\n${referralInfo}` : ""}`
    : referralInfo ?? null;

  const composedRejectionNote = action === "reject"
    ? `Reason: ${reasonLabel}\n\n${pharmacistNote ?? ""}`
    : pharmacistNote ?? null;

  // Patient-facing message in chat thread (computed before tx so we can reuse condition name)
  const buildPatientMessage = (conditionName: string, orderCreated: boolean): string => {
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
        })
        .where(eq(consultationsTable.id, params.data.id))
        .returning();

      if (!row) {
        // Bail out of transaction so caller can return 404
        throw new Error("CONSULTATION_NOT_FOUND");
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
            line1: string; line2: string; city: string; postcode: string; country: string;
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

          if (shippingAddress) {
            const orderId = randomUUID();
            const orderNumber = `RX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
            const trackingNumber = `PCX${Math.floor(Math.random() * 1e10).toString().padStart(10, "0")}`;
            const eta = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

            // Race-safe insert: the partial unique index on orders.consultation_id
            // guarantees only one RX order per consultation. If a concurrent approve
            // wins the race, our insert returns no rows; we then re-select the
            // winner's order and skip the delivery insert (winner created its own).
            const inserted = await tx.insert(ordersTable).values({
              id: orderId,
              orderNumber,
              customerEmail: row.patientEmail,
              customerName: row.patientName,
              customerPhone: patient?.phone ?? null,
              shippingAddress,
              itemsTotalGbp: 0,
              shippingGbp: 0,
              totalGbp: 0,
              status: "preparing",
              paymentStatus: "rx_internal",
              consultationId: row.id,
              prescriptionItems: itemsToStore,
              notes: `Prescription order for consultation ${row.id} (${row.conditionName})`,
            }).onConflictDoNothing({ target: ordersTable.consultationId }).returning({ id: ordersTable.id });

            if (inserted.length > 0) {
              await tx.insert(deliveriesTable).values({
                id: randomUUID(),
                orderId,
                carrier: "PharmaCare Express",
                trackingNumber,
                status: "preparing",
                estimatedDelivery: eta,
                events: [
                  {
                    ts: new Date().toISOString(),
                    status: "preparing",
                    message: "Prescription approved by pharmacist — preparing for tracked delivery.",
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
        body: action === "approve" && createdOrderId
          ? `${row.conditionName} approved — we're preparing your medicine for tracked delivery.`
          : `${row.conditionName} — open to read full details and reply.`,
        link: action === "approve" && createdOrderId ? `/track-order/${createdOrderId}` : "/my-consultations",
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
});

export default router;

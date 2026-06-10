import { Router, type IRouter } from "express";
import PDFDocument from "pdfkit";
import {
  db,
  consultationsTable,
  patientAccountsTable,
  consultationActionsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { decodeBearerId } from "../middlewares/auth";
import {
  PHARMACY_DETAILS,
  RX_BRAND,
  renderPrescriptionPdf,
  type ConsultationPrescriptionSource,
} from "../utils/prescriptionPdfDocument";

const router: IRouter = Router();

const PHARMACIST_IDS = new Set(["pharm-001", "pharm-002"]);

function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function consultationToPrescriptionSource(
  row: typeof consultationsTable.$inferSelect,
): ConsultationPrescriptionSource {
  return {
    id: row.id,
    consultationNumber: row.consultationNumber,
    patientName: row.patientName,
    patientEmail: row.patientEmail,
    patientAge: row.patientAge,
    patientSex: row.patientSex,
    patientDateOfBirth: row.patientDateOfBirth,
    conditionName: row.conditionName,
    prescription: row.prescription,
    prescriptionItems: row.prescriptionItems,
    pharmacistNote: row.pharmacistNote,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt) : null,
    deliveryAddress: row.deliveryAddress,
    answers: (row.answers ?? {}) as Record<string, unknown>,
  };
}

router.get("/consultations/:id/prescription.pdf", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "Consultation id required" });
    return;
  }

  const [row] = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }

  const tokenHeader = req.headers.authorization;
  const tokenQuery =
    typeof req.query.token === "string" ? `Bearer ${req.query.token}` : undefined;
  const actorId = decodeBearerId(tokenHeader ?? tokenQuery);
  if (!actorId) {
    res.status(401).json({ error: "Authentication required to view this prescription" });
    return;
  }
  const isPharmacist = PHARMACIST_IDS.has(actorId);
  if (!isPharmacist) {
    const [patient] = await db
      .select()
      .from(patientAccountsTable)
      .where(eq(patientAccountsTable.id, actorId))
      .limit(1);
    const isOwner =
      !!patient && patient.email.toLowerCase() === row.patientEmail.toLowerCase();
    if (!isOwner) {
      res.status(403).json({ error: "You do not have access to this prescription" });
      return;
    }
  }

  if (row.status !== "approved" || !row.prescription) {
    res.status(409).json({ error: "Prescription is not available for this consultation" });
    return;
  }

  const ref =
    row.consultationNumber?.trim() ||
    row.id.replace(/-/g, "").toUpperCase().slice(0, 8);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 0, left: 0, right: 0, bottom: 0 },
    info: {
      Title: `Prescription ${ref}`,
      Author: PHARMACY_DETAILS.name,
      Subject: `Private prescription for ${row.patientName}`,
      Creator: PHARMACY_DETAILS.name,
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="EveryDayMeds-Prescription-${ref.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`,
  );
  doc.pipe(res);

  renderPrescriptionPdf(doc, consultationToPrescriptionSource(row));
  doc.end();
});

router.get("/consultations/:id/referral.pdf", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    res.status(400).json({ error: "Consultation id required" });
    return;
  }

  const [row] = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }

  const tokenHeader = req.headers.authorization;
  const tokenQuery =
    typeof req.query.token === "string" ? `Bearer ${req.query.token}` : undefined;
  const actorId = decodeBearerId(tokenHeader ?? tokenQuery);
  if (!actorId || !PHARMACIST_IDS.has(actorId)) {
    res.status(401).json({ error: "Pharmacist authentication required" });
    return;
  }

  if (row.status !== "referred") {
    res.status(409).json({
      error: "Referral letter only available for referred consultations.",
    });
    return;
  }

  const issuedAt = row.reviewedAt ? new Date(row.reviewedAt) : new Date();
  const refNumber = `R${row.id.toUpperCase().slice(0, 8)}`;

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, left: 48, right: 48, bottom: 56 },
    info: {
      Title: `Referral ${refNumber}`,
      Author: PHARMACY_DETAILS.name,
      Subject: `Clinical referral for ${row.patientName}`,
      Creator: PHARMACY_DETAILS.name,
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="EveryDayMeds-Referral-${refNumber}.pdf"`,
  );
  doc.pipe(res);

  const GREY_DARK = RX_BRAND.secondary;
  const GREY = RX_BRAND.muted;
  const GREY_LIGHT = RX_BRAND.creamDark;
  const PALE_BG = RX_BRAND.cream;
  const AMBER = "#B45309";

  doc.rect(0, 0, doc.page.width, 110).fill(RX_BRAND.primary);
  doc.circle(72, 55, 18).fillAndStroke(RX_BRAND.white, RX_BRAND.white);
  doc.fillColor(RX_BRAND.primary).font("Helvetica-Bold").fontSize(20).text("+", 65, 45);
  doc.fillColor(RX_BRAND.white).font("Helvetica-Bold").fontSize(22).text(
    PHARMACY_DETAILS.name,
    102,
    36,
  );
  doc.font("Helvetica").fontSize(9.5).fillColor(RX_BRAND.accent).text(
    `${PHARMACY_DETAILS.address}  ·  ${PHARMACY_DETAILS.phone}`,
    102,
    63,
  );
  doc.text(`${PHARMACY_DETAILS.email}`, 102, 77);

  doc.fillColor(RX_BRAND.white).font("Helvetica-Bold").fontSize(14).text(
    "CLINICAL REFERRAL",
    doc.page.width - 240,
    44,
    { width: 192, align: "right" },
  );
  doc.font("Helvetica").fontSize(9).fillColor(RX_BRAND.accent).text(
    `Ref: ${refNumber}`,
    doc.page.width - 240,
    65,
    { width: 192, align: "right" },
  );
  doc.text(`Issued: ${formatDateLong(issuedAt)}`, doc.page.width - 240, 78, {
    width: 192,
    align: "right",
  });

  doc.y = 138;
  doc.x = 48;

  const [referAction] = await db
    .select({ details: consultationActionsTable.details })
    .from(consultationActionsTable)
    .where(
      and(
        eq(consultationActionsTable.consultationId, row.id),
        eq(consultationActionsTable.action, "refer"),
      ),
    )
    .orderBy(desc(consultationActionsTable.createdAt))
    .limit(1);
  const referDetails = (referAction?.details ?? {}) as {
    referRecipientType?: string | null;
    referRecipientName?: string | null;
    referUrgency?: string | null;
  };
  const recipientType = referDetails.referRecipientType ?? "GP";
  const recipientName = referDetails.referRecipientName ?? "";
  const urgency = referDetails.referUrgency ?? "routine";

  const panelTop = doc.y;
  doc
    .roundedRect(48, panelTop, doc.page.width - 96, 70, 8)
    .fillAndStroke(PALE_BG, GREY_LIGHT);
  doc.fillColor(RX_BRAND.primary).font("Helvetica-Bold").fontSize(11).text(
    "REFERRED TO",
    62,
    panelTop + 12,
  );
  doc.fillColor(GREY_DARK).font("Helvetica-Bold").fontSize(13).text(
    recipientName || recipientType.toUpperCase(),
    62,
    panelTop + 28,
  );
  doc.fillColor(GREY).font("Helvetica").fontSize(10).text(
    `Recipient type: ${recipientType.toUpperCase()}`,
    62,
    panelTop + 46,
  );

  const urgColor =
    urgency === "urgent" ? "#DC2626" : urgency === "soon" ? AMBER : RX_BRAND.primaryLight;
  const urgLabel =
    urgency === "urgent"
      ? "URGENT"
      : urgency === "soon"
        ? "SOON (≤2 WEEKS)"
        : "ROUTINE";
  doc
    .roundedRect(doc.page.width - 200, panelTop + 14, 138, 42, 6)
    .lineWidth(1.4)
    .strokeColor(urgColor)
    .stroke();
  doc.fillColor(urgColor).font("Helvetica-Bold").fontSize(11).text(
    urgLabel,
    doc.page.width - 200,
    panelTop + 22,
    { width: 138, align: "center" },
  );

  doc.y = panelTop + 86;
  doc.x = 48;

  const patientPanelTop = doc.y;
  doc
    .roundedRect(48, patientPanelTop, doc.page.width - 96, 90, 8)
    .fillAndStroke(PALE_BG, GREY_LIGHT);
  doc.fillColor(RX_BRAND.primary).font("Helvetica-Bold").fontSize(11).text(
    "PATIENT",
    62,
    patientPanelTop + 12,
  );
  doc.fillColor(GREY_DARK).font("Helvetica-Bold").fontSize(13).text(
    row.patientName,
    62,
    patientPanelTop + 28,
  );
  doc.fillColor(GREY).font("Helvetica").fontSize(10).text(
    `${row.patientAge ?? "—"} yrs · ${row.patientSex ?? "—"} · ${row.patientEmail}`,
    62,
    patientPanelTop + 46,
  );
  doc.text(`Presenting condition: ${row.conditionName}`, 62, patientPanelTop + 62);

  doc.y = patientPanelTop + 106;
  doc.x = 48;

  const lines: string[] = [];
  lines.push("Dear Colleague,");
  lines.push("");
  lines.push(
    `Thank you for accepting the care of this patient. I have assessed ${row.patientName.split(" ")[0]} via our online consultation service for ${row.conditionName}.`,
  );
  lines.push("");
  lines.push(
    "Following clinical review, I do not feel it is appropriate to manage this presentation through a remote pharmacy consultation, and I am therefore referring for your further assessment.",
  );
  lines.push("");
  const answersObj = (row.answers && typeof row.answers === "object"
    ? row.answers
    : {}) as Record<string, unknown>;
  const symptomsRaw =
    answersObj.symptoms ??
    answersObj.symptom_description ??
    answersObj.presenting_symptoms;
  const symptoms = typeof symptomsRaw === "string" ? symptomsRaw.trim() : "";
  if (symptoms) {
    lines.push("Presenting symptoms:");
    lines.push(symptoms);
    lines.push("");
  }
  if (row.medicalHistory?.trim()) {
    lines.push("Relevant medical history:");
    lines.push(row.medicalHistory.trim());
    lines.push("");
  }
  if (row.currentMedications?.trim()) {
    lines.push("Current medication:");
    lines.push(row.currentMedications.trim());
    lines.push("");
  }
  if (row.allergies?.trim()) {
    lines.push("Allergies:");
    lines.push(row.allergies.trim());
    lines.push("");
  }
  if (row.referralInfo?.trim()) {
    lines.push("Reason for referral & specific concerns:");
    lines.push(row.referralInfo.trim());
    lines.push("");
  } else if (row.pharmacistNote?.trim()) {
    lines.push("Reason for referral & specific concerns:");
    lines.push(row.pharmacistNote.trim());
    lines.push("");
  }
  lines.push(
    "Please do not hesitate to contact me directly should you need any further information from our records. The patient has been informed of this referral.",
  );
  lines.push("");
  lines.push("Yours sincerely,");

  const bodyTop = doc.y;
  doc.fillColor(GREY_DARK).font("Helvetica").fontSize(10.5).text(
    lines.join("\n"),
    48,
    bodyTop,
    { width: doc.page.width - 96, lineGap: 3 },
  );

  const sigTop = Math.max(doc.y + 18, doc.page.height - 170);
  doc.font("Helvetica-Oblique").fontSize(20).fillColor(RX_BRAND.primary).text(
    row.reviewedBy ?? PHARMACY_DETAILS.defaultPrescriber,
    48,
    sigTop,
    { width: 280 },
  );
  doc
    .moveTo(48, sigTop + 30)
    .lineTo(328, sigTop + 30)
    .strokeColor(GREY_LIGHT)
    .lineWidth(0.8)
    .stroke();
  doc.font("Helvetica").fontSize(9).fillColor(GREY).text(
    `${PHARMACY_DETAILS.defaultPrescriberRole} · GPhC ${PHARMACY_DETAILS.defaultPrescriberGphc}`,
    48,
    sigTop + 36,
    { width: 280 },
  );
  doc.text(`Signed digitally on ${formatDateLong(issuedAt)}`, 48, sigTop + 50, {
    width: 280,
  });

  const footerY = doc.page.height - 48;
  doc
    .moveTo(48, footerY - 14)
    .lineTo(doc.page.width - 48, footerY - 14)
    .strokeColor(GREY_LIGHT)
    .lineWidth(0.6)
    .stroke();
  doc.fillColor(GREY).font("Helvetica").fontSize(8).text(
    `${PHARMACY_DETAILS.name} · Regulated by the General Pharmaceutical Council (GPhC) · Digitally generated clinical referral.`,
    48,
    footerY - 8,
    { width: doc.page.width - 96, align: "center" },
  );

  doc.end();
});

export default router;

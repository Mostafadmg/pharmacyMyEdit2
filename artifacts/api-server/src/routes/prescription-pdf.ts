import { Router, type IRouter } from "express";
import PDFDocument from "pdfkit";
import { db, consultationsTable, patientAccountsTable, consultationActionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { decodeBearerId } from "../middlewares/auth";

const router: IRouter = Router();

const PHARMACIST_IDS = new Set(["pharm-001", "pharm-002"]);

const PHARMACY_DETAILS = {
  name: "PharmaCare Digital Pharmacy",
  address: "12 Harley Street, London, W1G 9PG",
  phone: "+44 20 7946 0123",
  email: "prescriptions@pharmacare.co.uk",
  gphc: "GPhC Premises Reg. 1234567",
  superintendent: "Dr. Sarah Mitchell, MPharm (GPhC 2087654)",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function calculateExpiry(issued: Date): Date {
  const expiry = new Date(issued);
  expiry.setMonth(expiry.getMonth() + 6);
  return expiry;
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

  // Authorisation: only the patient who owns this consultation, or a pharmacist, may view the PDF.
  // Bearer token may come via Authorization header or ?token=… (for inline browser tab opens).
  const tokenHeader = req.headers.authorization;
  const tokenQuery = typeof req.query.token === "string" ? `Bearer ${req.query.token}` : undefined;
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
    const isOwner = !!patient && patient.email.toLowerCase() === row.patientEmail.toLowerCase();
    if (!isOwner) {
      res.status(403).json({ error: "You do not have access to this prescription" });
      return;
    }
  }

  if (row.status !== "approved" || !row.prescription) {
    res.status(409).json({ error: "Prescription is not available for this consultation" });
    return;
  }

  const issuedAt = row.reviewedAt ? new Date(row.reviewedAt) : new Date();
  const expiresAt = calculateExpiry(issuedAt);
  const refNumber = row.id.toUpperCase().slice(0, 8);

  // Brand palette
  const NAVY = "#0E2354";
  const TEAL = "#0A7EA4";
  const GREEN = "#10B981";
  const GREY_DARK = "#374151";
  const GREY = "#6B7280";
  const GREY_LIGHT = "#E5E7EB";
  const PALE_BG = "#F9FAFB";

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, left: 48, right: 48, bottom: 56 },
    info: {
      Title: `Prescription ${refNumber}`,
      Author: PHARMACY_DETAILS.name,
      Subject: `Private prescription for ${row.patientName}`,
      Creator: PHARMACY_DETAILS.name,
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="PharmaCare-Prescription-${refNumber}.pdf"`,
  );
  doc.pipe(res);

  // ---------------- Header banner ----------------
  doc.rect(0, 0, doc.page.width, 110).fill(NAVY);

  // Logo mark
  doc.circle(72, 55, 18).fillAndStroke("#FFFFFF", "#FFFFFF");
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20).text("P", 65, 45);

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text(
    PHARMACY_DETAILS.name,
    102,
    36,
  );
  doc.font("Helvetica").fontSize(9.5).fillColor("#CFE3FF").text(
    `${PHARMACY_DETAILS.address}  ·  ${PHARMACY_DETAILS.phone}`,
    102,
    63,
  );
  doc.text(`${PHARMACY_DETAILS.email}  ·  ${PHARMACY_DETAILS.gphc}`, 102, 77);

  // Right-side title block
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(14).text(
    "PRIVATE PRESCRIPTION",
    doc.page.width - 240,
    44,
    { width: 192, align: "right" },
  );
  doc.font("Helvetica").fontSize(9).fillColor("#CFE3FF").text(
    `Ref: ${refNumber}`,
    doc.page.width - 240,
    65,
    { width: 192, align: "right" },
  );
  doc.text(`Issued: ${formatDate(issuedAt)}`, doc.page.width - 240, 78, {
    width: 192,
    align: "right",
  });
  doc.text(`Expires: ${formatDate(expiresAt)}`, doc.page.width - 240, 91, {
    width: 192,
    align: "right",
  });

  // Reset cursor below banner
  doc.y = 138;
  doc.x = 48;

  // ---------------- Patient details panel ----------------
  const panelTop = doc.y;
  const panelHeight = 122;
  doc
    .roundedRect(48, panelTop, doc.page.width - 96, panelHeight, 8)
    .fillAndStroke(PALE_BG, GREY_LIGHT);

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(
    "PATIENT DETAILS",
    62,
    panelTop + 12,
  );

  // Two-column grid
  const colLeftX = 62;
  const colRightX = doc.page.width / 2 + 8;
  let lineY = panelTop + 32;
  const lineHeight = 16;

  const patientAddress =
    (row.answers as Record<string, unknown>)?.["_deliveryAddress"];
  const addressText = typeof patientAddress === "string" && patientAddress.trim()
    ? patientAddress
    : "On file";

  function field(label: string, value: string, x: number, y: number, width: number) {
    doc
      .fillColor(GREY)
      .font("Helvetica")
      .fontSize(8)
      .text(label.toUpperCase(), x, y, { width });
    doc
      .fillColor(GREY_DARK)
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .text(value, x, y + 10, { width, ellipsis: true });
  }

  const colWidth = (doc.page.width - 96) / 2 - 16;
  field("Name", row.patientName, colLeftX, lineY, colWidth);
  field(
    "Age / Sex",
    `${row.patientAge ?? "—"} yrs · ${row.patientSex ?? "—"}`,
    colRightX,
    lineY,
    colWidth,
  );

  lineY += lineHeight + 14;
  field("Email", row.patientEmail, colLeftX, lineY, colWidth);
  field("Delivery address", addressText, colRightX, lineY, colWidth);

  doc.y = panelTop + panelHeight + 18;
  doc.x = 48;

  // ---------------- "Rx" prescription section ----------------
  const rxTop = doc.y;
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(34).text("℞", 48, rxTop - 6);
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("PRESCRIPTION", 90, rxTop + 4);
  doc
    .fillColor(GREY)
    .font("Helvetica")
    .fontSize(9.5)
    .text(`For: ${row.conditionName}`, 90, rxTop + 22);

  doc.y = rxTop + 48;
  doc.x = 48;

  // Prescription body box
  const rxBoxTop = doc.y;
  const rxBoxWidth = doc.page.width - 96;
  doc
    .roundedRect(48, rxBoxTop, rxBoxWidth, 1, 4) // placeholder; will redraw after measuring
    .fillColor("#FFFFFF");

  // Render the prescription text and measure it
  doc.fillColor(GREY_DARK).font("Helvetica").fontSize(11);
  const prescriptionText = row.prescription.trim();
  const textY = rxBoxTop + 16;
  doc.text(prescriptionText, 64, textY, {
    width: rxBoxWidth - 32,
    lineGap: 4,
  });

  const textHeight = doc.y - textY;
  const rxBoxHeight = textHeight + 32;

  // Redraw box border now that we know the height
  doc
    .roundedRect(48, rxBoxTop, rxBoxWidth, rxBoxHeight, 8)
    .lineWidth(1)
    .stroke(GREY_LIGHT);
  // Left accent stripe
  doc.rect(48, rxBoxTop, 4, rxBoxHeight).fill(TEAL);

  doc.y = rxBoxTop + rxBoxHeight + 22;
  doc.x = 48;

  // ---------------- Pharmacist note (optional) ----------------
  if (row.pharmacistNote && row.pharmacistNote.trim()) {
    const noteTop = doc.y;
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10).text(
      "PHARMACIST NOTES",
      48,
      noteTop,
    );
    doc.y = noteTop + 14;
    doc
      .fillColor(GREY_DARK)
      .font("Helvetica")
      .fontSize(10)
      .text(row.pharmacistNote.trim(), 48, doc.y, {
        width: doc.page.width - 96,
        lineGap: 3,
      });
    doc.moveDown(1.2);
  }

  // ---------------- Prescriber signature block ----------------
  // Push signature toward the bottom but not over the footer
  const sigTop = Math.max(doc.y + 12, doc.page.height - 200);
  const sigBoxWidth = (doc.page.width - 96 - 24) / 2;

  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(10).text(
    "PRESCRIBED BY",
    48,
    sigTop,
  );

  // Signature handwriting-style line
  const cursiveY = sigTop + 18;
  doc.font("Helvetica-Oblique").fontSize(20).fillColor(NAVY).text(
    row.reviewedBy ?? "Dr. Sarah Mitchell",
    48,
    cursiveY,
    { width: sigBoxWidth },
  );

  doc
    .moveTo(48, cursiveY + 32)
    .lineTo(48 + sigBoxWidth, cursiveY + 32)
    .strokeColor(GREY_LIGHT)
    .lineWidth(0.8)
    .stroke();

  doc.font("Helvetica").fontSize(9).fillColor(GREY).text(
    PHARMACY_DETAILS.superintendent,
    48,
    cursiveY + 38,
    { width: sigBoxWidth },
  );
  doc.text(`Signed digitally on ${formatDate(issuedAt)}`, 48, cursiveY + 52, {
    width: sigBoxWidth,
  });

  // Right-side: official stamp
  const stampX = doc.page.width - 48 - 150;
  const stampY = sigTop + 8;
  doc
    .roundedRect(stampX, stampY, 150, 70, 6)
    .lineWidth(1.4)
    .strokeColor(GREEN)
    .stroke();
  doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(11).text(
    "APPROVED",
    stampX,
    stampY + 12,
    { width: 150, align: "center" },
  );
  doc.fillColor(GREEN).font("Helvetica").fontSize(8).text(
    `PharmaCare · ${formatDate(issuedAt)}`,
    stampX,
    stampY + 28,
    { width: 150, align: "center" },
  );
  doc.fillColor(GREEN).font("Helvetica").fontSize(8).text(
    `Ref ${refNumber}`,
    stampX,
    stampY + 42,
    { width: 150, align: "center" },
  );
  doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(8).text(
    "GPhC VERIFIED",
    stampX,
    stampY + 56,
    { width: 150, align: "center" },
  );

  // ---------------- Footer ----------------
  const footerY = doc.page.height - 48;
  doc
    .moveTo(48, footerY - 14)
    .lineTo(doc.page.width - 48, footerY - 14)
    .strokeColor(GREY_LIGHT)
    .lineWidth(0.6)
    .stroke();
  doc.fillColor(GREY).font("Helvetica").fontSize(8).text(
    `${PHARMACY_DETAILS.name} · Regulated by the General Pharmaceutical Council (GPhC) · This is a digitally generated private prescription.`,
    48,
    footerY - 8,
    { width: doc.page.width - 96, align: "center" },
  );

  doc.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// Referral letter PDF (pharmacist → GP / specialist / A&E)
// ─────────────────────────────────────────────────────────────────────────────
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

  // Only pharmacists may generate a referral letter (it is addressed to a clinician).
  const tokenHeader = req.headers.authorization;
  const tokenQuery = typeof req.query.token === "string" ? `Bearer ${req.query.token}` : undefined;
  const actorId = decodeBearerId(tokenHeader ?? tokenQuery);
  if (!actorId || !PHARMACIST_IDS.has(actorId)) {
    res.status(401).json({ error: "Pharmacist authentication required" });
    return;
  }

  if (row.status !== "referred") {
    res.status(409).json({ error: "Referral letter only available for referred consultations." });
    return;
  }

  const issuedAt = row.reviewedAt ? new Date(row.reviewedAt) : new Date();
  const refNumber = `R${row.id.toUpperCase().slice(0, 8)}`;

  const NAVY = "#0E2354";
  const TEAL = "#0A7EA4";
  const GREY_DARK = "#374151";
  const GREY = "#6B7280";
  const GREY_LIGHT = "#E5E7EB";
  const PALE_BG = "#F9FAFB";
  const AMBER = "#B45309";

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
    `inline; filename="PharmaCare-Referral-${refNumber}.pdf"`,
  );
  doc.pipe(res);

  // Header
  doc.rect(0, 0, doc.page.width, 110).fill(NAVY);
  doc.circle(72, 55, 18).fillAndStroke("#FFFFFF", "#FFFFFF");
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(20).text("P", 65, 45);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text(
    PHARMACY_DETAILS.name, 102, 36,
  );
  doc.font("Helvetica").fontSize(9.5).fillColor("#CFE3FF").text(
    `${PHARMACY_DETAILS.address}  ·  ${PHARMACY_DETAILS.phone}`, 102, 63,
  );
  doc.text(`${PHARMACY_DETAILS.email}  ·  ${PHARMACY_DETAILS.gphc}`, 102, 77);

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(14).text(
    "CLINICAL REFERRAL",
    doc.page.width - 240, 44,
    { width: 192, align: "right" },
  );
  doc.font("Helvetica").fontSize(9).fillColor("#CFE3FF").text(
    `Ref: ${refNumber}`,
    doc.page.width - 240, 65,
    { width: 192, align: "right" },
  );
  doc.text(`Issued: ${formatDate(issuedAt)}`, doc.page.width - 240, 78, {
    width: 192, align: "right",
  });

  doc.y = 138;
  doc.x = 48;

  // Recipient block — fetch latest "refer" action's structured details
  const [referAction] = await db
    .select({ details: consultationActionsTable.details })
    .from(consultationActionsTable)
    .where(and(
      eq(consultationActionsTable.consultationId, row.id),
      eq(consultationActionsTable.action, "refer"),
    ))
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
  doc.roundedRect(48, panelTop, doc.page.width - 96, 70, 8).fillAndStroke(PALE_BG, GREY_LIGHT);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("REFERRED TO", 62, panelTop + 12);
  doc.fillColor(GREY_DARK).font("Helvetica-Bold").fontSize(13).text(
    recipientName || recipientType.toUpperCase(),
    62, panelTop + 28,
  );
  doc.fillColor(GREY).font("Helvetica").fontSize(10).text(
    `Recipient type: ${recipientType.toUpperCase()}`,
    62, panelTop + 46,
  );

  // Urgency stamp
  const urgColor = urgency === "urgent" ? "#DC2626" : urgency === "soon" ? AMBER : TEAL;
  const urgLabel = urgency === "urgent" ? "URGENT" : urgency === "soon" ? "SOON (≤2 WEEKS)" : "ROUTINE";
  doc.roundedRect(doc.page.width - 200, panelTop + 14, 138, 42, 6)
    .lineWidth(1.4).strokeColor(urgColor).stroke();
  doc.fillColor(urgColor).font("Helvetica-Bold").fontSize(11).text(
    urgLabel, doc.page.width - 200, panelTop + 22, { width: 138, align: "center" },
  );
  doc.fillColor(urgColor).font("Helvetica").fontSize(8).text(
    "Clinical urgency", doc.page.width - 200, panelTop + 40, { width: 138, align: "center" },
  );

  doc.y = panelTop + 86;
  doc.x = 48;

  // Patient details
  const patientPanelTop = doc.y;
  doc.roundedRect(48, patientPanelTop, doc.page.width - 96, 90, 8).fillAndStroke(PALE_BG, GREY_LIGHT);
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text("PATIENT", 62, patientPanelTop + 12);
  doc.fillColor(GREY_DARK).font("Helvetica-Bold").fontSize(13).text(row.patientName, 62, patientPanelTop + 28);
  doc.fillColor(GREY).font("Helvetica").fontSize(10).text(
    `${row.patientAge ?? "—"} yrs · ${row.patientSex ?? "—"} · ${row.patientEmail}`,
    62, patientPanelTop + 46,
  );
  doc.text(`Presenting condition: ${row.conditionName}`, 62, patientPanelTop + 62);

  doc.y = patientPanelTop + 106;
  doc.x = 48;

  // Letter body
  const lines: string[] = [];
  lines.push("Dear Colleague,");
  lines.push("");
  lines.push(`Thank you for accepting the care of this patient. I have assessed ${row.patientName.split(" ")[0]} via our online consultation service for ${row.conditionName}.`);
  lines.push("");
  lines.push("Following clinical review, I do not feel it is appropriate to manage this presentation through a remote pharmacy consultation, and I am therefore referring for your further assessment.");
  lines.push("");
  // Presenting symptoms come from the answers JSON if present
  const answersObj = (row.answers && typeof row.answers === "object" ? row.answers : {}) as Record<string, unknown>;
  const symptomsRaw = (answersObj.symptoms ?? answersObj.symptom_description ?? answersObj.presenting_symptoms);
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
  lines.push("Please do not hesitate to contact me directly should you need any further information from our records. The patient has been informed of this referral.");
  lines.push("");
  lines.push("Yours sincerely,");

  const bodyTop = doc.y;
  doc.fillColor(GREY_DARK).font("Helvetica").fontSize(10.5).text(
    lines.join("\n"),
    48, bodyTop,
    { width: doc.page.width - 96, lineGap: 3 },
  );

  // Signature
  const sigTop = Math.max(doc.y + 18, doc.page.height - 170);
  doc.font("Helvetica-Oblique").fontSize(20).fillColor(NAVY).text(
    row.reviewedBy ?? PHARMACY_DETAILS.superintendent.split(",")[0],
    48, sigTop,
    { width: 280 },
  );
  doc.moveTo(48, sigTop + 30).lineTo(328, sigTop + 30)
    .strokeColor(GREY_LIGHT).lineWidth(0.8).stroke();
  doc.font("Helvetica").fontSize(9).fillColor(GREY).text(
    PHARMACY_DETAILS.superintendent, 48, sigTop + 36, { width: 280 },
  );
  doc.text(`Signed digitally on ${formatDate(issuedAt)}`, 48, sigTop + 50, { width: 280 });

  // Footer
  const footerY = doc.page.height - 48;
  doc.moveTo(48, footerY - 14).lineTo(doc.page.width - 48, footerY - 14)
    .strokeColor(GREY_LIGHT).lineWidth(0.6).stroke();
  doc.fillColor(GREY).font("Helvetica").fontSize(8).text(
    `${PHARMACY_DETAILS.name} · Regulated by the General Pharmaceutical Council (GPhC) · This is a digitally generated clinical referral letter.`,
    48, footerY - 8,
    { width: doc.page.width - 96, align: "center" },
  );

  doc.end();
});

export default router;

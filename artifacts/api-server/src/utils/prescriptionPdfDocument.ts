import type PDFDocument from "pdfkit";

/** Matches site theme: hsl(158 36% 18%), hsl(220 14% 16%), hsl(36 30% 96%) */
export const RX_BRAND = {
  primary: "#1E4D3B",
  primaryLight: "#2A6B52",
  secondary: "#252830",
  cream: "#F5F1EA",
  creamDark: "#E8E2D8",
  muted: "#6B7280",
  white: "#FFFFFF",
  accent: "#C8E6D4",
} as const;

export const PHARMACY_DETAILS = {
  name: "EveryDayMeds Pharmacy Ltd",
  tagline: "UK-registered pharmacy · GPhC independent prescribing",
  address: "14 Harley Street, London W1G 9PB, United Kingdom",
  phone: "0800 020 9090",
  email: "care@everydaymeds.example.uk",
  gphcPremises: "9012345",
  registeredOffice:
    "EveryDayMeds Pharmacy Ltd, 14 Harley Street, London, United Kingdom, W1G 9PB",
  defaultPrescriber: "Dr Aisha Patel MPharm IP",
  defaultPrescriberRole: "Pharmacist Independent Prescriber",
  defaultPrescriberGphc: "2098765",
} as const;

export type PrescriptionLineItem = {
  name: string;
  strength: string;
  form: string;
  quantity: string;
  sig: string;
  duration: string;
  notes?: string;
};

export type ConsultationPrescriptionSource = {
  id: string;
  consultationNumber: string | null;
  patientName: string;
  patientEmail: string;
  patientAge: number;
  patientSex: string;
  patientDateOfBirth: string | null;
  conditionName: string;
  prescription: string | null;
  prescriptionItems: unknown;
  pharmacistNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  deliveryAddress: string | null;
  answers: Record<string, unknown>;
};

function formatDateGb(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDob(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return iso.trim();
  }
  return formatDateGb(d);
}

function parsePrescriptionItems(raw: unknown): PrescriptionLineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: PrescriptionLineItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? "").trim();
    if (!name) continue;
    out.push({
      name,
      strength: String(o.strength ?? "").trim(),
      form: String(o.form ?? "").trim(),
      quantity: String(o.quantity ?? "").trim(),
      sig: String(o.sig ?? "").trim(),
      duration: String(o.duration ?? "").trim(),
      notes: o.notes != null ? String(o.notes).trim() : undefined,
    });
  }
  return out;
}

function medicationLabel(item: PrescriptionLineItem): string {
  const parts = [item.name];
  if (item.strength) parts.push(item.strength);
  if (item.form) parts.push(`(${item.form})`);
  if (item.quantity) parts.push(`— ${item.quantity}`);
  return parts.join(" ");
}

function dosageLabel(item: PrescriptionLineItem): string {
  const parts = [item.sig, item.duration].filter(Boolean);
  if (item.notes) parts.push(item.notes);
  return parts.join(" · ") || "As directed";
}

function resolvePatientAddress(row: ConsultationPrescriptionSource): string {
  if (row.deliveryAddress?.trim()) return row.deliveryAddress.trim();
  const answers = row.answers ?? {};
  const delivery = answers.delivery_address ?? answers.deliveryAddress;
  if (typeof delivery === "string" && delivery.trim()) return delivery.trim();
  const parts = [
    answers.address_line1,
    answers.addressLine1,
    answers.city,
    answers.postcode,
  ]
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => (p as string).trim());
  return parts.length > 0 ? parts.join(", ") : "On file";
}

function prescriptionRef(row: ConsultationPrescriptionSource): string {
  if (row.consultationNumber?.trim()) return row.consultationNumber.trim();
  return `#${row.id.replace(/-/g, "").toUpperCase().slice(-5)}`;
}

function drawSectionTitle(
  doc: PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number,
): number {
  doc
    .fillColor(RX_BRAND.primary)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title.toUpperCase(), x, y, { width, align: "center" });
  return y + 16;
}

function drawTwoColumnTable(
  doc: PDFDocument,
  rows: [string, string][],
  x: number,
  y: number,
  width: number,
  rowHeight = 26,
): number {
  const labelW = width * 0.34;
  const valueW = width - labelW;
  let cy = y;

  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    const fill = i % 2 === 0 ? RX_BRAND.cream : RX_BRAND.white;
    doc.rect(x, cy, width, rowHeight).fill(fill);
    doc
      .rect(x, cy, width, rowHeight)
      .lineWidth(0.5)
      .strokeColor(RX_BRAND.creamDark)
      .stroke();
    doc
      .fillColor(RX_BRAND.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(label, x + 10, cy + 8, { width: labelW - 14 });
    doc
      .fillColor(RX_BRAND.secondary)
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(value, x + labelW + 8, cy + 7, { width: valueW - 14, ellipsis: true });
    cy += rowHeight;
  }

  return cy;
}

function drawMedicationTable(
  doc: PDFDocument,
  items: PrescriptionLineItem[],
  fallbackText: string,
  x: number,
  y: number,
  width: number,
): number {
  const headerH = 24;
  const rowH = 32;
  doc.rect(x, y, width, headerH).fill(RX_BRAND.primary);
  doc
    .fillColor(RX_BRAND.white)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("MEDICINE", x + 10, y + 8, { width: width * 0.55 - 10 });
  doc.text("DOSAGE / DIRECTIONS", x + width * 0.55 + 8, y + 8, {
    width: width * 0.45 - 16,
  });

  let cy = y + headerH;
  const medRows =
    items.length > 0
      ? items.map((it) => [medicationLabel(it), dosageLabel(it)] as [string, string])
      : [[fallbackText || "See prescriber notes", "As directed by prescriber"]];

  for (let i = 0; i < medRows.length; i++) {
    const [med, dose] = medRows[i];
    const fill = i % 2 === 0 ? RX_BRAND.white : RX_BRAND.cream;
    doc.rect(x, cy, width, rowH).fill(fill);
    doc
      .rect(x, cy, width, rowH)
      .lineWidth(0.5)
      .strokeColor(RX_BRAND.creamDark)
      .stroke();
    doc
      .fillColor(RX_BRAND.secondary)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(med, x + 10, cy + 8, { width: width * 0.55 - 14 });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(RX_BRAND.secondary)
      .text(dose, x + width * 0.55 + 8, cy + 8, { width: width * 0.45 - 14 });
    cy += rowH;
  }

  return cy + 4;
}

/** Render a single-page private prescription PDF (EveryDayMeds brand). */
export function renderPrescriptionPdf(
  doc: PDFDocument,
  row: ConsultationPrescriptionSource,
): void {
  const issuedAt = row.reviewedAt ? new Date(row.reviewedAt) : new Date();
  const ref = prescriptionRef(row);
  const items = parsePrescriptionItems(row.prescriptionItems);
  const prescriberName = row.reviewedBy?.trim() || PHARMACY_DETAILS.defaultPrescriber;
  const prescriberGphc =
    process.env.PHARMACIST_GPHC_REG?.trim() || PHARMACY_DETAILS.defaultPrescriberGphc;

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const margin = 44;
  const contentW = pageW - margin * 2;

  // Page background
  doc.rect(0, 0, pageW, pageH).fill(RX_BRAND.cream);

  // Brand header band
  const bandH = 72;
  doc.rect(0, 0, pageW, bandH).fill(RX_BRAND.primary);
  doc.circle(margin + 22, bandH / 2, 20).fill(RX_BRAND.white);
  doc
    .fillColor(RX_BRAND.primary)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("+", margin + 14, bandH / 2 - 12, { width: 20, align: "center" });
  doc
    .fillColor(RX_BRAND.white)
    .font("Helvetica-Bold")
    .fontSize(20)
    .text("EveryDayMeds", margin + 52, bandH / 2 - 18);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(RX_BRAND.accent)
    .text(PHARMACY_DETAILS.tagline, margin + 52, bandH / 2 + 2);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(RX_BRAND.white)
    .text("PRIVATE PRESCRIPTION", pageW - margin - 200, bandH / 2 - 14, {
      width: 200,
      align: "right",
    });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(RX_BRAND.accent)
    .text(`GPhC premises ${PHARMACY_DETAILS.gphcPremises}`, pageW - margin - 200, bandH / 2 + 2, {
      width: 200,
      align: "right",
    });

  // Main document card
  const cardX = margin;
  const cardY = bandH + 20;
  const cardH = pageH - cardY - margin - 8;
  doc
    .roundedRect(cardX, cardY, contentW, cardH, 10)
    .fill(RX_BRAND.white);
  doc
    .roundedRect(cardX, cardY, contentW, cardH, 10)
    .lineWidth(1.2)
    .strokeColor(RX_BRAND.primaryLight);

  const innerX = cardX + 24;
  const innerW = contentW - 48;
  let y = cardY + 22;

  // Meta row
  doc
    .fillColor(RX_BRAND.muted)
    .font("Helvetica")
    .fontSize(8.5)
    .text(`Date: ${formatDateGb(issuedAt)}`, innerX, y, { width: innerW / 3 });
  doc
    .fillColor(RX_BRAND.primary)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("Prescription", innerX, y - 2, { width: innerW, align: "center" });
  const contactBlock = [
    PHARMACY_DETAILS.address,
    PHARMACY_DETAILS.email,
    `Tel: ${PHARMACY_DETAILS.phone}`,
  ].join("\n");
  doc
    .fillColor(RX_BRAND.muted)
    .font("Helvetica")
    .fontSize(7.5)
    .text(contactBlock, innerX + (innerW * 2) / 3, y, {
      width: innerW / 3,
      align: "right",
      lineGap: 2,
    });

  y += 28;
  doc
    .fillColor(RX_BRAND.secondary)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(`Prescription code: ${ref}`, innerX, y);
  y += 22;

  // Patient section
  y = drawSectionTitle(doc, "Patient information", innerX, y, innerW);
  y = drawTwoColumnTable(
    doc,
    [
      ["ID number", ref],
      ["Name", row.patientName],
      ["Address", resolvePatientAddress(row)],
      [
        "Date of birth",
        formatDob(row.patientDateOfBirth),
      ],
      ["Age / sex", `${row.patientAge} yrs · ${row.patientSex}`],
      ["Condition", row.conditionName],
    ],
    innerX,
    y,
    innerW,
    24,
  );
  y += 14;

  // Medication section
  y = drawSectionTitle(doc, "Medication", innerX, y, innerW);
  y = drawMedicationTable(
    doc,
    items,
    row.prescription?.trim() ?? "",
    innerX,
    y,
    innerW,
  );
  y += 12;

  if (row.pharmacistNote?.trim()) {
    doc
      .fillColor(RX_BRAND.muted)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("PRESCRIBER NOTES", innerX, y);
    y += 12;
    doc
      .fillColor(RX_BRAND.secondary)
      .font("Helvetica")
      .fontSize(9)
      .text(row.pharmacistNote.trim(), innerX, y, { width: innerW, lineGap: 3 });
    y = doc.y + 14;
  }

  // Clinician + signature (pin near bottom of card)
  const sigBlockTop = Math.min(y + 8, cardY + cardH - 118);
  const sigColW = innerW / 2 - 12;

  doc
    .fillColor(RX_BRAND.muted)
    .font("Helvetica")
    .fontSize(8)
    .text("Clinician", innerX, sigBlockTop);
  doc
    .fillColor(RX_BRAND.secondary)
    .font("Helvetica-Bold")
    .fontSize(10.5)
    .text(prescriberName, innerX, sigBlockTop + 12, { width: sigColW });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(RX_BRAND.muted)
    .text(PHARMACY_DETAILS.defaultPrescriberRole, innerX, sigBlockTop + 28, {
      width: sigColW,
    });
  doc.text(`GPhC registration: ${prescriberGphc}`, innerX, sigBlockTop + 42, {
    width: sigColW,
  });

  const sigX = innerX + innerW / 2 + 8;
  doc
    .fillColor(RX_BRAND.muted)
    .font("Helvetica")
    .fontSize(8)
    .text("Signature", sigX, sigBlockTop);
  const sigLineY = sigBlockTop + 36;
  doc
    .font("Helvetica-Oblique")
    .fontSize(18)
    .fillColor(RX_BRAND.primary)
    .text(prescriberName, sigX, sigBlockTop + 14, { width: sigColW });
  doc
    .moveTo(sigX, sigLineY)
    .lineTo(sigX + sigColW, sigLineY)
    .strokeColor(RX_BRAND.creamDark)
    .lineWidth(0.8)
    .stroke();

  // Approval stamp
  const stampW = 120;
  const stampH = 52;
  const stampX = innerX + innerW - stampW;
  const stampY = sigBlockTop - 4;
  doc
    .roundedRect(stampX, stampY, stampW, stampH, 6)
    .lineWidth(1.5)
    .strokeColor(RX_BRAND.primary);
  doc
    .fillColor(RX_BRAND.primary)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("APPROVED", stampX, stampY + 10, { width: stampW, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .text(formatDateLong(issuedAt), stampX, stampY + 26, {
      width: stampW,
      align: "center",
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("DIGITALLY SIGNED", stampX, stampY + 38, {
      width: stampW,
      align: "center",
    });

  const footY = cardY + cardH - 36;
  doc
    .fillColor(RX_BRAND.muted)
    .font("Helvetica-Oblique")
    .fontSize(8.5)
    .text(
      "Prescription electronically signed by a GPhC-registered pharmacist independent prescriber.",
      innerX,
      footY,
      { width: innerW, align: "center" },
    );
  doc
    .font("Helvetica")
    .fontSize(7)
    .text(`Registered office: ${PHARMACY_DETAILS.registeredOffice}`, innerX, footY + 14, {
      width: innerW,
      align: "center",
    });
}

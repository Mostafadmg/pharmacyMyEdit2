import type { Consultation, PrescriptionItem } from "@workspace/api-client-react";
import { getDesktopBridge } from "@/lib/electronBridge";
import { formatExpiryDisplay } from "@/lib/gs1Barcode";
import type { ScanResult } from "@/components/BarcodeScanPanel";

const PHARMACY_HEADER = "EveryDayMeds Pharmacy · GPhC 9011223";
const CAUTION =
  "Keep out of sight and reach of children. Read the leaflet provided with this medicine.";

export type LabelPackDetails = {
  batch?: string;
  expiry?: string;
};

export function buildLabelHtml(
  consult: Consultation,
  items: PrescriptionItem[] = consult.prescriptionItems ?? [],
  packDetailsByIndex?: Map<number, LabelPackDetails>,
): string {
  const labels = items
    .map((it, index) => {
      const pack = packDetailsByIndex?.get(index);
      const packLine = [
        pack?.batch ? `Batch: ${escapeHtml(pack.batch)}` : null,
        pack?.expiry ? `Exp: ${escapeHtml(formatExpiryDisplay(pack.expiry))}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return `
    <div class="label">
      <div class="pharmacy">${PHARMACY_HEADER}</div>
      <div class="drug">${escapeHtml(it.name)} ${escapeHtml(it.strength)} ${escapeHtml(it.form)}</div>
      <div class="qty">Qty: ${escapeHtml(String(it.quantity))}</div>
      <div class="sig">${escapeHtml(it.sig)}</div>
      <div class="patient">For: ${escapeHtml(consult.patientName)} · Duration ${escapeHtml(it.duration ?? "—")}</div>
      ${packLine ? `<div class="pack">${packLine}</div>` : ""}
      ${it.notes ? `<div class="note">Note: ${escapeHtml(it.notes)}</div>` : ""}
      <div class="caution">${CAUTION}</div>
    </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 89mm 36mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #111; }
    .label {
      width: 89mm;
      min-height: 36mm;
      padding: 3mm 4mm;
      page-break-after: always;
      border: 0.2mm dashed #ccc;
    }
    .pharmacy { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
    .drug { font-weight: 700; font-size: 10pt; margin-top: 1mm; }
    .qty, .sig { font-size: 8.5pt; margin-top: 0.8mm; }
    .sig { font-style: italic; }
    .patient, .note, .pack { font-size: 7.5pt; color: #444; margin-top: 1mm; }
    .caution { font-size: 6.5pt; color: #555; margin-top: 2mm; padding-top: 1mm; border-top: 0.2mm solid #ddd; }
  </style>
</head>
<body>${labels}</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function packDetailsFromScans(
  scans: Map<number, ScanResult>,
): Map<number, LabelPackDetails> {
  const out = new Map<number, LabelPackDetails>();
  for (const [index, scan] of scans) {
    if (!scan.batch && !scan.expiry) continue;
    out.set(index, { batch: scan.batch, expiry: scan.expiry });
  }
  return out;
}

export async function printConsultationLabels(
  consult: Consultation,
  options?: {
    deviceName?: string;
    silent?: boolean;
    packDetailsByIndex?: Map<number, LabelPackDetails>;
  },
): Promise<"electron" | "browser"> {
  const html = buildLabelHtml(
    consult,
    consult.prescriptionItems ?? [],
    options?.packDetailsByIndex,
  );
  const bridge = getDesktopBridge();

  if (bridge) {
    await bridge.printLabels(html, {
      silent: options?.silent ?? true,
      deviceName: options?.deviceName,
    });
    return "electron";
  }

  const printFrame = document.createElement("iframe");
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  document.body.appendChild(printFrame);

  const doc = printFrame.contentDocument;
  if (!doc) throw new Error("Could not create print frame");
  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    printFrame.onload = () => resolve();
    setTimeout(resolve, 300);
  });

  printFrame.contentWindow?.print();
  setTimeout(() => printFrame.remove(), 1000);
  return "browser";
}

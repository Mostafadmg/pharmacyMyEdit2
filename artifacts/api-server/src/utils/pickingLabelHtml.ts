import type { consultationsTable } from "@workspace/db";

type ConsultationRow = typeof consultationsTable.$inferSelect;

type PrescriptionItem = {
  name: string;
  strength?: string | null;
  form?: string | null;
  quantity?: string | null;
  sig?: string | null;
};

const BRAND_GREEN = "#1B4332";
const BRAND_CREAM = "#F5F2E9";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stageLabel(
  status: string | null | undefined,
): string {
  switch (status) {
    case "inbox":
      return "Clinical check";
    case "pick":
      return "Pick";
    case "labelling":
      return "Label";
    case "pack":
      return "Pack";
    case "parked":
      return "Parked";
    case "dispatched":
      return "Complete";
    default:
      return "Pick";
  }
}

/** Minimal Code 128-B bars as SVG (sufficient for PICK-* codes in dev). */
function code128Svg(text: string): string {
  const CODE128_B_START = 104;
  const bars: number[] = [];
  let checksum = CODE128_B_START;
  bars.push(CODE128_B_START);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    bars.push(code);
    checksum += code * (i + 1);
  }
  checksum %= 103;
  bars.push(checksum);
  bars.push(106);

  const patterns: Record<number, string> = {
    0: "11011001100",
    1: "11001101100",
    2: "11001100110",
    3: "10010011000",
    4: "10010001100",
    5: "10001001100",
    6: "10011001000",
    7: "10011000100",
    8: "10001100100",
    9: "11001001000",
    10: "11001000100",
    11: "11000100100",
    12: "10110011100",
    13: "10011011100",
    14: "10011001110",
    15: "10111001100",
    16: "10011101100",
    17: "10011100110",
    18: "11001110010",
    19: "11001011100",
    20: "11001001110",
    21: "11011100100",
    22: "11001110100",
    23: "11101101110",
    24: "11101001100",
    25: "11100101100",
    26: "11100100110",
    27: "11101100100",
    28: "11100110100",
    29: "11100110010",
    30: "11011011000",
    31: "11011000110",
    32: "11000110110",
    33: "10100011000",
    34: "10001011000",
    35: "10001000110",
    36: "10110001000",
    37: "10001101000",
    38: "10001100010",
    39: "11010001000",
    40: "11000101000",
    41: "11000100010",
    42: "10110111000",
    43: "10110001110",
    44: "10001101110",
    45: "10111011000",
    46: "10111000110",
    47: "10001110110",
    48: "11101110110",
    49: "11010001110",
    50: "11000101110",
    51: "11011101000",
    52: "11011100010",
    53: "11011101110",
    54: "11101011000",
    55: "11101000110",
    56: "11100010110",
    57: "11101101000",
    58: "11101100010",
    59: "11100011010",
    60: "11101111010",
    61: "11001000010",
    62: "11110001010",
    63: "10100110000",
    64: "10100001100",
    65: "10010110000",
    66: "10010000110",
    67: "10000101100",
    68: "10000100110",
    69: "10110010000",
    70: "10110000100",
    71: "10011010000",
    72: "10011000010",
    73: "10000110100",
    74: "10000110010",
    75: "11000010010",
    76: "11001010000",
    77: "11110111010",
    78: "11000010100",
    79: "10001111010",
    80: "10100111100",
    81: "10010111100",
    82: "10010011110",
    83: "10111100100",
    84: "10011110100",
    85: "10011110010",
    86: "11110100100",
    87: "11110010100",
    88: "11110010010",
    89: "11011011110",
    90: "11011110110",
    91: "11110110110",
    92: "10101111000",
    93: "10100011110",
    94: "10001011110",
    95: "10111101000",
    96: "10111100010",
    97: "11110101000",
    98: "11110100010",
    99: "10111011110",
    100: "10111101110",
    101: "11101011110",
    102: "11110101110",
    103: "11010000100",
    104: "11010010000",
    105: "11010011100",
    106: "1100011101011",
  };

  let x = 0;
  const module = 2;
  const rects: string[] = [];
  for (const code of bars) {
    const pattern = patterns[code];
    if (!pattern) continue;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "1") {
        rects.push(
          `<rect x="${x}" y="0" width="${module}" height="44" fill="#000"/>`,
        );
      }
      x += module;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="52" viewBox="0 0 ${x} 52"><g transform="translate(0,4)">${rects.join("")}</g><text x="${x / 2}" y="50" text-anchor="middle" font-family="monospace" font-size="9" fill="#111">${escapeHtml(text)}</text></svg>`;
}

export function buildPickingLabelHtml(
  row: ConsultationRow,
  pickingLabelCode: string,
): string {
  const items = (row.prescriptionItems ?? []) as PrescriptionItem[];
  const ref = row.consultationNumber ?? row.id.slice(0, 8).toUpperCase();
  const stage = stageLabel(row.pmrWorkflowStatus);

  const medRows = items
    .map((it) => {
      const parts = [it.name, it.strength, it.form]
        .filter((p) => p?.trim())
        .map((p) => escapeHtml(p!.trim()));
      const qty = it.quantity?.trim()
        ? `Qty ${escapeHtml(String(it.quantity))}`
        : "";
      return `<tr>
        <td class="med-name">${parts.join(" · ")}</td>
        <td class="med-qty">${qty}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: 80mm 50mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 8pt; color: #1a1a1a; background: ${BRAND_CREAM}; }
    .label { width: 80mm; min-height: 50mm; page-break-after: always; overflow: hidden; }
    .hdr { background: ${BRAND_GREEN}; color: #fff; padding: 2.5mm 3mm; display: flex; justify-content: space-between; align-items: center; }
    .hdr-brand { font-size: 7pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .hdr-stage { font-size: 6.5pt; font-weight: 600; background: rgba(255,255,255,0.15); padding: 1mm 2mm; border-radius: 2mm; }
    .body { padding: 2.5mm 3mm; }
    .patient { font-weight: 800; font-size: 11pt; color: ${BRAND_GREEN}; margin-bottom: 1mm; line-height: 1.2; }
    .ref { font-size: 7pt; color: #555; margin-bottom: 2mm; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
    th { background: ${BRAND_GREEN}; color: #fff; font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.05em; padding: 1.2mm 1.5mm; text-align: left; }
    th:last-child { text-align: right; width: 18mm; }
    td { font-size: 7pt; padding: 1.2mm 1.5mm; border-bottom: 0.3mm solid #e0dcd4; vertical-align: top; }
    td.med-name { font-weight: 600; }
    td.med-qty { text-align: right; font-weight: 700; white-space: nowrap; }
    tr:nth-child(even) td { background: rgba(27,67,50,0.04); }
    .barcode { text-align: center; padding-top: 1.5mm; border-top: 0.3mm solid #d8d4cc; }
    .pick-title { font-size: 6.5pt; text-transform: uppercase; color: #666; letter-spacing: 0.08em; margin-bottom: 1mm; }
  </style>
</head>
<body>
  <div class="label">
    <div class="hdr">
      <span class="hdr-brand">EveryDayMeds · Pick ticket</span>
      <span class="hdr-stage">${escapeHtml(stage)}</span>
    </div>
    <div class="body">
      <div class="patient">${escapeHtml(row.patientName)}</div>
      <div class="ref">Ref ${escapeHtml(ref)}</div>
      <table>
        <thead>
          <tr>
            <th>Medicine</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          ${medRows || '<tr><td colspan="2">No items</td></tr>'}
        </tbody>
      </table>
      <div class="barcode">
        <div class="pick-title">Scan to open prescription</div>
        ${code128Svg(pickingLabelCode)}
      </div>
    </div>
  </div>
</body>
</html>`;
}

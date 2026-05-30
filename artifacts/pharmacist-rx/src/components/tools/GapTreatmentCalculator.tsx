import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================================
   Gap in Treatment Calculator (React port)
   Date-based gap calculation with BMI-aware restart-dose recommendation.
   ============================================================================ */

type MedKey = "mounjaro" | "wegovy" | "nevolat";
type PatientType = "normal" | "switch";

type MedDef = {
  label: string;
  doses: number[];
  caps: {
    eightTwelve: number;
    twelveTwentyFour: number;
    overTwentyFour: number;
    starter: number;
  };
};

const GAP_MEDICATIONS: Record<MedKey, MedDef> = {
  mounjaro: {
    label: "Mounjaro",
    doses: [2.5, 5, 7.5, 10, 12.5, 15],
    caps: { eightTwelve: 10, twelveTwentyFour: 5, overTwentyFour: 2.5, starter: 2.5 },
  },
  wegovy: {
    label: "Wegovy",
    doses: [0.25, 0.5, 1, 1.7, 2.4, 7.2],
    caps: { eightTwelve: 1, twelveTwentyFour: 1, overTwentyFour: 0.25, starter: 0.25 },
  },
  nevolat: {
    label: "Nevolat",
    doses: [0.6, 1.2, 1.8],
    caps: { eightTwelve: 1.8, twelveTwentyFour: 1.2, overTwentyFour: 0.6, starter: 0.6 },
  },
};

const MED_ORDER: MedKey[] = ["mounjaro", "wegovy", "nevolat"];

type GapBand = { key: string; label: string; action: string; maxRestart: string };

const GAP_BANDS: GapBand[] = [
  { key: "0-4", label: "0-4 weeks", action: "Titrate up", maxRestart: "Normal" },
  { key: "4-8", label: ">4-8 weeks", action: "Partial loss", maxRestart: "Normal" },
  { key: "8-12", label: ">8-12 weeks", action: "Continue last", maxRestart: "Cap applies" },
  { key: "12-24", label: ">12-24 weeks", action: "One dose lower", maxRestart: "Cap applies" },
  { key: "24+", label: ">24 weeks", action: "Lowest (BMI≥25)", maxRestart: "Starter/lowest" },
  { key: "12m+", label: "12+ months", action: "New patient", maxRestart: "Starter only" },
];

const GAP_REFERENCE: [string, string, string][] = [
  ["≤8 wks", "Titrate up", "Normal"],
  [">8-12 wks", "Continue last", "W:1mg M:10mg N:1.8mg"],
  [">12-24 wks", "One dose lower", "W:1mg M:5mg N:1.2mg"],
  [">24 wks", "Lowest (BMI≥25)", "W:0.25mg M:2.5mg N:0.6mg"],
  ["12+ months", "New patient", "Starter only"],
];

/* ───────────────────────────── logic ───────────────────────────── */

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value: string): Date | null {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return startOfLocalDay(new Date(parts[0]!, parts[1]! - 1, parts[2]!));
}

function addWeeks(date: Date, weeks: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + weeks * 7);
  return startOfLocalDay(copy);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatGap(days: number, weeks: number): string {
  const roundedWeeks = weeks.toFixed(1);
  return `${days} day${days === 1 ? "" : "s"} (${roundedWeeks} week${roundedWeeks === "1.0" ? "" : "s"})`;
}

function formatDose(value: number): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return Number.isInteger(num)
    ? String(num)
    : String(num).replace(/0+$/, "").replace(/\.$/, "");
}

function getGapBand(gapWeeks: number): GapBand {
  if (gapWeeks <= 4) return GAP_BANDS[0]!;
  if (gapWeeks <= 8) return GAP_BANDS[1]!;
  if (gapWeeks <= 12) return GAP_BANDS[2]!;
  if (gapWeeks <= 24) return GAP_BANDS[3]!;
  if (gapWeeks > 52) return GAP_BANDS[5]!;
  return GAP_BANDS[4]!;
}

function getRecommendation(args: {
  med: MedDef;
  gapWeeks: number;
  bmi: number | null;
  lastDose: number;
}): { recommendedDose: number | null; note: string; maxRestart: string } {
  const { med, gapWeeks, bmi, lastDose } = args;

  if (gapWeeks <= 4) {
    return {
      recommendedDose: lastDose,
      note: "Standard continuation; no meaningful step-down required.",
      maxRestart: "Normal",
    };
  }
  if (gapWeeks <= 8) {
    return {
      recommendedDose: lastDose,
      note: "Partial loss: consider step-down depending on tolerance and clinical context.",
      maxRestart: "Normal",
    };
  }
  if (gapWeeks <= 12) {
    return {
      recommendedDose: Math.min(lastDose, med.caps.eightTwelve),
      note: `Continue last tolerated dose, but do not exceed ${formatDose(med.caps.eightTwelve)}mg for ${med.label}.`,
      maxRestart: `${formatDose(med.caps.eightTwelve)}mg`,
    };
  }
  if (gapWeeks <= 24) {
    return {
      recommendedDose: Math.min(lastDose, med.caps.twelveTwentyFour),
      note: `One-dose-lower restart where appropriate. Maximum restart for ${med.label} is ${formatDose(med.caps.twelveTwentyFour)}mg.`,
      maxRestart: `${formatDose(med.caps.twelveTwentyFour)}mg`,
    };
  }
  if (gapWeeks <= 52) {
    if (bmi != null && bmi < 25) {
      return {
        recommendedDose: null,
        note: "Current BMI is below 25, so this requires clinician review before prescribing.",
        maxRestart: `${formatDose(med.caps.overTwentyFour)}mg`,
      };
    }
    return {
      recommendedDose: Math.min(lastDose, med.caps.overTwentyFour),
      note: `Lowest restart dose for ${med.label} if BMI is ≥25: ${formatDose(med.caps.overTwentyFour)}mg.`,
      maxRestart: `${formatDose(med.caps.overTwentyFour)}mg`,
    };
  }
  return {
    recommendedDose: med.caps.starter,
    note: `Treat as a new patient after 12+ months. Restart at starter dose: ${formatDose(med.caps.starter)}mg.`,
    maxRestart: "Starter only",
  };
}

/* ───────────────────────────── component ───────────────────────────── */

type ResultData = {
  medLabel: string;
  patientLabel: string;
  referenceDate: string;
  treatmentEnd: string;
  supplyWeeks: number;
  gap: string;
  gapBand: GapBand;
  maxRestart: string;
  suggestedDose: string;
  lastDoseLabel: string;
  bmiLabel: string;
  note: string;
};

const FIELD_LABEL = "mb-1 block text-[11px] font-semibold text-amber-700";
const AMBER_INPUT =
  "w-full rounded-md border border-amber-300 bg-white px-2 py-2 text-xs text-foreground outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

export function GapTreatmentCalculator() {
  const [open, setOpen] = useState(false);
  const [patientType, setPatientType] = useState<PatientType>("normal");
  const [date, setDate] = useState("");
  const [supplyWeeks, setSupplyWeeks] = useState("4");
  const [medKey, setMedKey] = useState<"" | MedKey>("");
  const [lastDose, setLastDose] = useState("");
  const [bmi, setBmi] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doseOptions = useMemo(
    () => (medKey ? GAP_MEDICATIONS[medKey].doses : []),
    [medKey],
  );

  const dateLabel = patientType === "switch" ? "Last Injection Date" : "Last Order Date";
  const typeHint =
    patientType === "switch"
      ? "Gap from last injection date (switch)"
      : "Gap from last order date (standard transfer/repeat)";

  const calculate = () => {
    setResult(null);
    if (!medKey) return setError("Please select a medication.");
    const lastDoseNum = lastDose ? Number(lastDose) : null;
    if (!lastDoseNum) return setError("Please select the last tolerated dose.");
    const orderDate = parseLocalDate(date);
    if (!orderDate)
      return setError(
        `Please enter the ${patientType === "switch" ? "last injection" : "last order"} date.`,
      );

    setError(null);
    const med = GAP_MEDICATIONS[medKey];
    const bmiNum = bmi ? Number(bmi) : null;
    const supply = Number(supplyWeeks || 4);
    const today = startOfLocalDay(new Date());
    const referenceEndDate =
      patientType === "normal" ? addWeeks(orderDate, supply) : addWeeks(orderDate, 4);
    const gapDays = Math.max(0, diffDays(today, referenceEndDate));
    const gapWeeks = gapDays / 7;
    const gapBand = getGapBand(gapWeeks);
    const rec = getRecommendation({ med, gapWeeks, bmi: bmiNum, lastDose: lastDoseNum });

    setResult({
      medLabel: med.label,
      patientLabel:
        patientType === "normal" ? "Normal (Order Date)" : "Switch (Last Injection)",
      referenceDate: formatDisplayDate(orderDate),
      treatmentEnd: formatDisplayDate(referenceEndDate),
      supplyWeeks: supply,
      gap: formatGap(gapDays, gapWeeks),
      gapBand,
      maxRestart: rec.maxRestart,
      suggestedDose:
        rec.recommendedDose == null
          ? "Clinician review"
          : `${formatDose(rec.recommendedDose)}mg`,
      lastDoseLabel: `${formatDose(lastDoseNum)}mg`,
      bmiLabel: bmiNum == null ? "Not entered" : bmiNum.toFixed(1),
      note: rec.note,
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-amber-500 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-linear-to-br from-amber-500 to-amber-600 px-3.5 py-2.5 text-[13px] font-semibold text-white"
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Gap in Treatment Calculator
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="space-y-3 bg-amber-50/70 p-3.5">
          {/* Guidance */}
          <div className="rounded-lg border border-amber-300 border-l-[3px] border-l-amber-500 bg-amber-100/70 p-2.5 text-[10px] leading-relaxed text-amber-900">
            <div className="mb-1.5 text-[10px] font-bold text-amber-800">
              📋 How to Calculate Gap in Treatment (GIT)
            </div>
            <div className="mb-1">
              <strong>📦 Normal (Non-Switch):</strong> Use <strong>Order Date</strong>
            </div>
            <div className="mb-1.5 ml-3 text-[9px]">
              • Same medication (e.g., Mounjaro → Mounjaro)
              <br />• Transfer patients staying on same med
              <br />• Standard repeats
            </div>
            <div className="mb-1">
              <strong>🔄 Switch:</strong> Use <strong>Last Injection Date</strong>
            </div>
            <div className="ml-3 text-[9px]">
              • Different medication (e.g., Mounjaro → Wegovy)
              <br />• Injection date = Order date + 4 weeks (unless patient confirms
              otherwise)
              <br />• Refer to Switching SOP for dosing
            </div>
          </div>

          {/* Patient type */}
          <div>
            <label className={FIELD_LABEL}>Patient Type</label>
            <div className="flex gap-2">
              {(
                [
                  ["normal", "📦 Normal (Order Date)"],
                  ["switch", "🔄 Switch (Last Injection)"],
                ] as [PatientType, string][]
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPatientType(type)}
                  className={cn(
                    "flex-1 rounded-md border-2 border-amber-500 px-3 py-2 text-[11px] font-semibold transition-colors",
                    patientType === type
                      ? "bg-amber-500 text-white"
                      : "bg-white text-amber-700 hover:bg-amber-100",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-1 text-[9px] italic text-amber-800">{typeHint}</div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={FIELD_LABEL}>{dateLabel}</label>
              <input
                type="date"
                className={AMBER_INPUT}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className={FIELD_LABEL}>Supply Duration</label>
              <select
                className={AMBER_INPUT}
                value={supplyWeeks}
                onChange={(e) => setSupplyWeeks(e.target.value)}
                disabled={patientType === "switch"}
              >
                <option value="4">1 pen (4 weeks)</option>
                <option value="8">2 pens (8 weeks)</option>
                <option value="12">3 pens / Bundle (12 weeks)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={FIELD_LABEL}>Medication</label>
              <select
                className={AMBER_INPUT}
                value={medKey}
                onChange={(e) => {
                  setMedKey(e.target.value as MedKey | "");
                  setLastDose("");
                }}
              >
                <option value="">Select...</option>
                {MED_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {GAP_MEDICATIONS[m].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={FIELD_LABEL}>Last Tolerated Dose</label>
              <select
                className={AMBER_INPUT}
                value={lastDose}
                onChange={(e) => setLastDose(e.target.value)}
                disabled={!medKey}
              >
                <option value="">Select dose...</option>
                {doseOptions.map((d) => (
                  <option key={d} value={String(d)}>
                    {formatDose(d)}mg
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL}>Current BMI</label>
            <input
              type="number"
              step="0.1"
              min="18"
              max="60"
              placeholder="e.g. 28.5"
              className={AMBER_INPUT}
              value={bmi}
              onChange={(e) => setBmi(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={calculate}
            className="w-full rounded-lg bg-linear-to-br from-amber-500 to-amber-600 px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Calculate Gap &amp; Recommended Dose
          </button>

          {error ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-800">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="rounded-xl border border-amber-300 bg-white p-3 text-[11px] leading-relaxed text-amber-900 shadow-sm">
              <div className="mb-2 font-bold text-amber-800">Calculation Result</div>
              <div className="grid gap-1.5">
                <Row label="Medication" value={result.medLabel} />
                <Row label="Patient type" value={result.patientLabel} />
                <Row label="Reference date" value={result.referenceDate} />
                <Row label="Estimated treatment end" value={result.treatmentEnd} />
                <Row label="Supply duration" value={`${result.supplyWeeks} weeks`} />
                <Row label="Gap" value={result.gap} />
                <Row label="Gap band" value={result.gapBand.label} />
                <Row label="Recommended action" value={result.gapBand.action} />
                <Row label="Max restart" value={result.maxRestart} />
                <Row label="Suggested dose" value={result.suggestedDose} />
                <Row label="Last tolerated dose" value={result.lastDoseLabel} />
                <Row label="BMI" value={result.bmiLabel} />
              </div>
              <div className="mt-2.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-amber-800">
                {result.note}
              </div>
            </div>
          ) : null}

          {/* Reference table */}
          <div className="border-t border-amber-300 pt-3">
            <div className="mb-2 text-[11px] font-bold text-amber-800">
              📋 Gap Treatment Reference
            </div>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-amber-100 text-left text-amber-800">
                  <th className="border-b border-amber-300 px-1 py-1.5">Gap</th>
                  <th className="border-b border-amber-300 px-1 py-1.5">Action</th>
                  <th className="border-b border-amber-300 px-1 py-1.5">Max Restart</th>
                </tr>
              </thead>
              <tbody>
                {GAP_REFERENCE.map((r, i) => (
                  <tr key={r[0]} className={i % 2 ? "bg-amber-50/70" : undefined}>
                    <td className="border-b border-amber-100 px-1 py-1">{r[0]}</td>
                    <td className="border-b border-amber-100 px-1 py-1">{r[1]}</td>
                    <td className="border-b border-amber-100 px-1 py-1">{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{label}:</strong> {value}
    </div>
  );
}

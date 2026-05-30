import { useMemo, useState } from "react";
import { Calculator, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================================
   GLP-1 Switching Calculator (React port)
   Step-equivalence + gap-adjustment logic for switching between GLP-1 agonists.
   ============================================================================ */

type MedKey = "mounjaro" | "wegovy" | "nevolat" | "rybelsus";
type Step = "1A" | "1B" | "2" | "3" | "4" | "5" | "6" | "7";
type GapKey = "0-4" | "4-8" | "8-12" | "12+";

const STEP_ORDER: Step[] = ["1A", "1B", "2", "3", "4", "5", "6", "7"];

type MedOption = { step: Step; dose: number };

const MEDICATIONS: Record<MedKey, { label: string; options: MedOption[] }> = {
  mounjaro: {
    label: "Mounjaro",
    options: [
      { step: "2", dose: 2.5 },
      { step: "3", dose: 5 },
      { step: "4", dose: 7.5 },
      { step: "5", dose: 10 },
      { step: "6", dose: 12.5 },
      { step: "7", dose: 15 },
    ],
  },
  wegovy: {
    label: "Wegovy",
    options: [
      { step: "1B", dose: 0.25 },
      { step: "2", dose: 0.5 },
      { step: "3", dose: 1 },
      { step: "4", dose: 1.7 },
      { step: "5", dose: 2.4 },
      { step: "6", dose: 7.2 },
    ],
  },
  nevolat: {
    label: "Nevolat",
    options: [
      { step: "1A", dose: 0.6 },
      { step: "1B", dose: 1.2 },
      { step: "2", dose: 1.8 },
      { step: "3", dose: 2.4 },
      { step: "4", dose: 3 },
    ],
  },
  rybelsus: {
    label: "Rybelsus",
    options: [
      { step: "1A", dose: 3 },
      { step: "1B", dose: 7 },
      { step: "2", dose: 14 },
    ],
  },
};

type GapRule = { key: GapKey; label: string };

const GAP_CATEGORY_RULES: GapRule[] = [
  { key: "0-4", label: "0-4 weeks (≤4 wks)" },
  { key: "4-8", label: ">4-8 weeks (Partial loss)" },
  { key: "8-12", label: ">8-12 weeks (Significant loss)" },
  { key: "12+", label: ">12 weeks (Near restart)" },
];

const MED_ORDER: MedKey[] = ["mounjaro", "wegovy", "nevolat", "rybelsus"];

/* ───────────────────────────── logic ───────────────────────────── */

function getStepFromDose(medKey: MedKey, dose: number): Step | null {
  const match = MEDICATIONS[medKey].options.find(
    (x) => Number(x.dose) === Number(dose),
  );
  return match ? match.step : null;
}

function getDoseFromStep(medKey: MedKey, step: Step): number | null {
  const match = MEDICATIONS[medKey].options.find((x) => x.step === step);
  return match ? match.dose : null;
}

function getAdjustedStep(currentStep: Step, gapKey: GapKey): Step {
  if (gapKey === "0-4") return currentStep;

  if (gapKey === "4-8") {
    if (currentStep === "1A") return "1A";
    if (currentStep === "1B") return "1A";
    if (currentStep === "2") return "1B";
    if (["3", "4", "5", "6", "7"].includes(currentStep)) return "3";
  }
  if (gapKey === "8-12") {
    if (["1A", "1B", "2"].includes(currentStep)) return "1A";
    if (currentStep === "3") return "1B";
    if (["4", "5", "6", "7"].includes(currentStep)) return "2";
  }
  if (gapKey === "12+") {
    if (["1A", "1B", "2", "3"].includes(currentStep)) return "1A";
    if (["4", "5", "6", "7"].includes(currentStep)) return "1B";
  }
  return currentStep;
}

function getTargetStepForMedication(
  medKey: MedKey,
  desiredStep: Step,
): { step: Step | null; dose: number | null; fallbackUsed: boolean } {
  const availableSteps = MEDICATIONS[medKey].options.map((x) => x.step);

  if (availableSteps.includes(desiredStep)) {
    return {
      step: desiredStep,
      dose: getDoseFromStep(medKey, desiredStep),
      fallbackUsed: false,
    };
  }

  const desiredIdx = STEP_ORDER.indexOf(desiredStep);
  for (let i = desiredIdx; i >= 0; i--) {
    const candidate = STEP_ORDER[i]!;
    if (availableSteps.includes(candidate)) {
      return {
        step: candidate,
        dose: getDoseFromStep(medKey, candidate),
        fallbackUsed: true,
      };
    }
  }

  const fallback = MEDICATIONS[medKey].options[0];
  return {
    step: fallback ? fallback.step : null,
    dose: fallback ? fallback.dose : null,
    fallbackUsed: true,
  };
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return startOfLocalDay(new Date(parts[0]!, parts[1]! - 1, parts[2]!));
}

function getWeeksBetween(a: Date, b: Date): number {
  const ms = startOfLocalDay(b).getTime() - startOfLocalDay(a).getTime();
  const days = Math.max(0, Math.round(ms / 86_400_000));
  return days / 7;
}

function getGapCategoryFromWeeks(weeks: number): GapRule {
  if (weeks <= 4) return GAP_CATEGORY_RULES[0]!;
  if (weeks <= 8) return GAP_CATEGORY_RULES[1]!;
  if (weeks <= 12) return GAP_CATEGORY_RULES[2]!;
  return GAP_CATEGORY_RULES[3]!;
}

function resolveGapCategory(selectValue: GapKey, dateValue: string): GapRule {
  const parsed = parseDateInput(dateValue);
  if (parsed) return getGapCategoryFromWeeks(getWeeksBetween(parsed, new Date()));
  return GAP_CATEGORY_RULES.find((x) => x.key === selectValue) ?? GAP_CATEGORY_RULES[0]!;
}

function formatDose(value: number): string {
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return Number.isInteger(num)
    ? String(num)
    : String(num).replace(/0+$/, "").replace(/\.$/, "");
}

function formatDisplayDate(date: Date | null): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "Not entered";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildRecommendationNote(args: {
  fromLabel: string;
  toLabel: string;
  gap: GapRule;
  adjustedStep: Step;
  targetStep: Step | null;
  fallbackUsed: boolean;
}): string {
  const { fromLabel, toLabel, gap, adjustedStep, targetStep, fallbackUsed } = args;
  const gapText =
    gap.key === "0-4"
      ? "No meaningful step-down required."
      : gap.key === "4-8"
        ? "Partial loss: one-step step-down applied."
        : gap.key === "8-12"
          ? "Significant loss: stronger step-down applied."
          : "Near restart: conservative restart step applied.";

  const crossSwitchText =
    fromLabel === toLabel
      ? `Same-medicine review: ${gapText}`
      : `Cross-switch from ${fromLabel} to ${toLabel}. ${gapText}`;

  if (targetStep == null) {
    return `${crossSwitchText} No supported equivalent step was available for the target medication, so manual review is required.`;
  }
  if (fallbackUsed) {
    return `${crossSwitchText} The exact step was not available for the target medication, so the nearest supported lower step was used.`;
  }
  return `${crossSwitchText} Suggested step: ${adjustedStep} → ${targetStep}.`;
}

/* ───────────────────── reference table data ───────────────────── */

const STEP_REFERENCE: { step: string; mounjaro: string; wegovy: string; nevolat: string; rybelsus: string }[] = [
  { step: "1A", mounjaro: "-", wegovy: "-", nevolat: "0.6mg", rybelsus: "3mg" },
  { step: "1B", mounjaro: "-", wegovy: "0.25mg", nevolat: "1.2mg", rybelsus: "7mg" },
  { step: "2", mounjaro: "2.5mg", wegovy: "0.5mg", nevolat: "1.8mg", rybelsus: "14mg" },
  { step: "3", mounjaro: "5mg", wegovy: "1mg", nevolat: "2.4mg", rybelsus: "-" },
  { step: "4", mounjaro: "7.5mg", wegovy: "1.7mg", nevolat: "3mg", rybelsus: "-" },
  { step: "5", mounjaro: "10mg", wegovy: "2.4mg", nevolat: "-", rybelsus: "-" },
  { step: "6", mounjaro: "12.5mg", wegovy: "7.2mg", nevolat: "-", rybelsus: "-" },
  { step: "7", mounjaro: "15mg", wegovy: "-", nevolat: "-", rybelsus: "-" },
];

type GapCellTone = "none" | "moderate" | "significant";
const GAP_ADJUSTMENTS: { step: string; cells: { v: string; tone: GapCellTone }[] }[] = [
  { step: "1A", cells: [{ v: "1A", tone: "none" }, { v: "1A", tone: "none" }, { v: "1A", tone: "none" }, { v: "1A", tone: "none" }] },
  { step: "1B", cells: [{ v: "1B", tone: "none" }, { v: "1A", tone: "moderate" }, { v: "1A", tone: "significant" }, { v: "1A", tone: "significant" }] },
  { step: "2", cells: [{ v: "2", tone: "none" }, { v: "1B", tone: "moderate" }, { v: "1A", tone: "significant" }, { v: "1A", tone: "significant" }] },
  { step: "3", cells: [{ v: "3", tone: "none" }, { v: "2", tone: "moderate" }, { v: "1B", tone: "significant" }, { v: "1A", tone: "significant" }] },
  { step: "4", cells: [{ v: "4", tone: "none" }, { v: "3", tone: "moderate" }, { v: "2", tone: "significant" }, { v: "1B", tone: "significant" }] },
  { step: "5", cells: [{ v: "5", tone: "none" }, { v: "3", tone: "moderate" }, { v: "2", tone: "significant" }, { v: "1B", tone: "significant" }] },
  { step: "6", cells: [{ v: "6", tone: "none" }, { v: "3", tone: "moderate" }, { v: "2", tone: "significant" }, { v: "1B", tone: "significant" }] },
  { step: "7", cells: [{ v: "7", tone: "none" }, { v: "3", tone: "moderate" }, { v: "2", tone: "significant" }, { v: "1B", tone: "significant" }] },
];

const TONE_CLS: Record<GapCellTone, string> = {
  none: "bg-emerald-50 text-emerald-800",
  moderate: "bg-amber-50 text-amber-800",
  significant: "bg-rose-100 text-rose-800",
};

/* ───────────────────────────── component ───────────────────────────── */

type ResultData = {
  fromLabel: string;
  toLabel: string;
  currentDoseLabel: string;
  currentStep: Step;
  gap: GapRule;
  adjustedStep: Step;
  targetStep: Step | null;
  targetDoseLabel: string;
  dateLabel: string;
  note: string;
};

const SELECT_CLS =
  "w-full rounded-md border border-violet-300 bg-white px-2.5 py-2 text-xs text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200";
const FIELD_LABEL_CLS = "mb-1 block text-[10px] font-semibold";

export function GlpSwitchCalculator() {
  const [open, setOpen] = useState(false);
  const [fromDrug, setFromDrug] = useState<"" | MedKey>("");
  const [fromDose, setFromDose] = useState("");
  const [gapLength, setGapLength] = useState<GapKey>("0-4");
  const [lastDate, setLastDate] = useState("");
  const [toDrug, setToDrug] = useState<"" | MedKey>("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refOpen, setRefOpen] = useState(false);

  const fromDoseOptions = useMemo(
    () => (fromDrug ? MEDICATIONS[fromDrug].options : []),
    [fromDrug],
  );

  const onDateChange = (value: string) => {
    setLastDate(value);
    const parsed = parseDateInput(value);
    if (parsed) {
      setGapLength(getGapCategoryFromWeeks(getWeeksBetween(parsed, new Date())).key);
    }
  };

  const calculate = () => {
    setResult(null);
    if (!fromDrug) return setError("Please select the current medication.");
    if (!fromDose) return setError("Please select the current dose.");
    if (!toDrug) return setError("Please select the new medication.");

    const currentStep = getStepFromDose(fromDrug, Number(fromDose));
    if (!currentStep)
      return setError("The selected current dose does not match a known step.");

    setError(null);
    const gap = resolveGapCategory(gapLength, lastDate);
    const adjustedStep = getAdjustedStep(currentStep, gap.key);
    const target = getTargetStepForMedication(toDrug, adjustedStep);

    setResult({
      fromLabel: MEDICATIONS[fromDrug].label,
      toLabel: MEDICATIONS[toDrug].label,
      currentDoseLabel: `${formatDose(Number(fromDose))}mg`,
      currentStep,
      gap,
      adjustedStep,
      targetStep: target.step,
      targetDoseLabel: target.dose == null ? "Manual review" : `${formatDose(target.dose)}mg`,
      dateLabel: lastDate ? formatDisplayDate(parseDateInput(lastDate)) : "Not entered",
      note: buildRecommendationNote({
        fromLabel: MEDICATIONS[fromDrug].label,
        toLabel: MEDICATIONS[toDrug].label,
        gap,
        adjustedStep,
        targetStep: target.step,
        fallbackUsed: target.fallbackUsed,
      }),
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-violet-500 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-linear-to-br from-violet-500 to-violet-700 px-3.5 py-2.5 text-[13px] font-semibold text-white"
      >
        <span className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          GLP-1 Switching Calculator
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
      <div className="space-y-3 bg-violet-50/60 p-3.5">
        {/* Current medication */}
        <section className="rounded-lg border border-violet-300 bg-violet-100/60 p-2.5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-violet-700">
            Current Medication
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={cn(FIELD_LABEL_CLS, "text-violet-800")}>Medication</label>
              <select
                className={SELECT_CLS}
                value={fromDrug}
                onChange={(e) => {
                  setFromDrug(e.target.value as MedKey | "");
                  setFromDose("");
                }}
              >
                <option value="">Select...</option>
                {MED_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {MEDICATIONS[m].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn(FIELD_LABEL_CLS, "text-violet-800")}>Current Dose</label>
              <select
                className={SELECT_CLS}
                value={fromDose}
                onChange={(e) => setFromDose(e.target.value)}
                disabled={!fromDrug}
              >
                <option value="">Select...</option>
                {fromDoseOptions.map((o) => (
                  <option key={o.step} value={String(o.dose)}>
                    {formatDose(o.dose)}mg
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Gap since last dose */}
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-2.5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-800">
            Gap Since Last Dose
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={cn(FIELD_LABEL_CLS, "text-amber-900")}>Gap Length</label>
              <select
                className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-2 text-xs text-foreground outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                value={gapLength}
                onChange={(e) => setGapLength(e.target.value as GapKey)}
              >
                {GAP_CATEGORY_RULES.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={cn(FIELD_LABEL_CLS, "text-amber-900")}>
                Or Enter Last Dose Date
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-[7px] text-xs text-foreground outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                value={lastDate}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-1.5 text-[9px] italic text-amber-800">
            💡 Date entry auto-calculates gap category
          </div>
        </section>

        {/* Switch to */}
        <section className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
            Switch To
          </div>
          <label className={cn(FIELD_LABEL_CLS, "text-emerald-900")}>New Medication</label>
          <select
            className="w-full rounded-md border border-emerald-300 bg-white px-2.5 py-2 text-xs text-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            value={toDrug}
            onChange={(e) => setToDrug(e.target.value as MedKey | "")}
          >
            <option value="">Select...</option>
            {MED_ORDER.map((m) => (
              <option key={m} value={m}>
                {MEDICATIONS[m].label}
              </option>
            ))}
          </select>
        </section>

        <button
          type="button"
          onClick={calculate}
          className="w-full rounded-lg bg-linear-to-br from-violet-500 to-violet-700 px-3 py-3 text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Calculator className="mr-1.5 inline h-4 w-4" /> Calculate Switch Dose
        </button>

        {error ? (
          <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-800">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-violet-300 bg-white p-3 text-[11px] leading-relaxed text-violet-900 shadow-sm">
            <div className="mb-2 font-bold text-violet-700">Calculation Result</div>
            <div className="grid gap-1.5">
              <Row label="Current medication" value={result.fromLabel} />
              <Row label="Current dose" value={result.currentDoseLabel} />
              <Row label="Current step" value={result.currentStep} />
              <Row label="Switch to" value={result.toLabel} />
              <Row label="Gap category" value={result.gap.label} />
              <Row label="Adjusted step after gap" value={result.adjustedStep} />
              <Row label="Recommended target step" value={result.targetStep ?? "Manual review"} />
              <Row label="Recommended target dose" value={result.targetDoseLabel} />
              <Row label="Date entered" value={result.dateLabel} />
            </div>
            <div className="mt-2.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-2 text-violet-800">
              {result.note}
            </div>
          </div>
        ) : null}

        {/* Reference tables */}
        <div className="border-t border-violet-300 pt-3">
          <button
            type="button"
            onClick={() => setRefOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg bg-linear-to-br from-violet-100 to-violet-200/70 px-3 py-2"
          >
            <span className="flex items-center gap-2 text-[11px] font-bold text-violet-700">
              📊 Reference Tables (Step Equivalence &amp; Gap Adjustments)
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-violet-700 transition-transform",
                refOpen && "rotate-180",
              )}
            />
          </button>

          {refOpen ? (
            <div className="mt-3 space-y-4">
              <div>
                <div className="mb-2 text-[11px] font-bold text-violet-700">
                  📋 Step Equivalence Reference
                </div>
                <table className="w-full border-collapse text-[9px]">
                  <thead>
                    <tr className="bg-violet-100 text-left text-violet-800">
                      <th className="border-b border-violet-300 px-1 py-1.5">Step</th>
                      <th className="border-b border-violet-300 px-1 py-1.5">Mounjaro</th>
                      <th className="border-b border-violet-300 px-1 py-1.5">Wegovy</th>
                      <th className="border-b border-violet-300 px-1 py-1.5">Nevolat</th>
                      <th className="border-b border-violet-300 px-1 py-1.5">Rybelsus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STEP_REFERENCE.map((r, i) => (
                      <tr key={r.step} className={i % 2 ? "bg-violet-50/70" : undefined}>
                        <td className="border-b border-violet-100 px-1 py-1">{r.step}</td>
                        <td className="border-b border-violet-100 px-1 py-1">{r.mounjaro}</td>
                        <td className="border-b border-violet-100 px-1 py-1">{r.wegovy}</td>
                        <td className="border-b border-violet-100 px-1 py-1">{r.nevolat}</td>
                        <td className="border-b border-violet-100 px-1 py-1">{r.rybelsus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-rose-300 pt-3">
                <div className="mb-2 text-[11px] font-bold text-rose-600">
                  ⏰ Dose Adjustments Where There Are Gaps in Treatment
                </div>
                <table className="w-full border-collapse overflow-hidden rounded-md border border-rose-200 text-[8px]">
                  <thead>
                    <tr className="bg-rose-50 text-rose-800">
                      <th className="border-b-2 border-rose-200 px-1 py-1.5 text-left">LAST STEP</th>
                      <th className="border-b-2 border-rose-200 px-1 py-1.5 text-center">≤4 WKS</th>
                      <th className="border-b-2 border-rose-200 px-1 py-1.5 text-center">&gt;4-8 WKS</th>
                      <th className="border-b-2 border-rose-200 px-1 py-1.5 text-center">&gt;8-12 WKS</th>
                      <th className="border-b-2 border-rose-200 px-1 py-1.5 text-center">&gt;12 WKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GAP_ADJUSTMENTS.map((row) => (
                      <tr key={row.step}>
                        <td className="border-b border-rose-100 px-1 py-1 font-semibold text-violet-700">
                          Step {row.step}
                        </td>
                        {row.cells.map((cell, ci) => (
                          <td
                            key={ci}
                            className={cn(
                              "border-b border-rose-100 px-1 py-1 text-center",
                              TONE_CLS[cell.tone],
                            )}
                          >
                            {cell.v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-1.5 flex flex-wrap gap-2 text-[8px]">
                  <LegendSwatch className="bg-emerald-50 border-emerald-300" label="No change" />
                  <LegendSwatch className="bg-amber-50 border-amber-300" label="Moderate step-down" />
                  <LegendSwatch className="bg-rose-100 border-rose-400" label="Significant step-down" />
                </div>
                <div className="mt-1.5 rounded bg-amber-50 px-1.5 py-1.5 text-[8px] text-amber-800">
                  <strong>Note:</strong> <em>Periods shown are gaps since last dose.</em>
                </div>
              </div>
            </div>
          ) : null}
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

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn("inline-block h-2.5 w-2.5 rounded-sm border", className)} />
      {label}
    </div>
  );
}

/**
 * Weight-loss eligibility & dosing rules (patient-facing onboarding).
 *
 * Pure, unit-testable logic — NO React / DOM here. UI wiring lives in
 * `InjectableWeightLossConsultation.tsx` and the `PlanSelector` component.
 *
 * Two responsibilities:
 *  A. NEW STARTER eligibility — BMI bands with "lowest threshold wins".
 *  B. RESTART / GAP dosing — Mounjaro & Wegovy restart rules based on the gap
 *     since the last injection (see docs/restart-gap-dosing-reference.png —
 *     the "Nevolat" column from the reference image is intentionally ignored).
 *
 * The BMI thresholds and ethnicity helpers are shared with the prescriber app
 * via `@workspace/evidence-slots` so patient and pharmacist stay in lock-step.
 */

import {
  BMI_THRESHOLD_BAME,
  BMI_THRESHOLD_COMORBIDITY,
  BMI_THRESHOLD_WHITE,
  MOUNJARO_STARTER_DOSE_MG,
  WEGOVY_STARTER_DOSE_MG,
  isBameEthnicity,
  isWhiteEthnicity,
} from "@workspace/evidence-slots";

export type WlProduct = "mounjaro" | "wegovy";

/* ───────────────────────── Dose ladders ───────────────────────── */

/**
 * Approved titration ladders (mg). These match the pen catalogue in
 * `TRANSFER_WL_PEN_OPTIONS` (WeightLossClinicalForms.tsx). The Wegovy 7.2 mg
 * "high-dose" pen is intentionally excluded from the restart ladder — restart
 * titration follows the standard 0.25 → 2.4 progression.
 */
export const MOUNJARO_DOSE_LADDER_MG = [2.5, 5, 7.5, 10, 12.5, 15] as const;
export const WEGOVY_DOSE_LADDER_MG = [0.25, 0.5, 1, 1.7, 2.4] as const;

export function doseLadderFor(product: WlProduct): number[] {
  return product === "mounjaro"
    ? [...MOUNJARO_DOSE_LADDER_MG]
    : [...WEGOVY_DOSE_LADDER_MG];
}

export function starterDoseFor(product: WlProduct): number {
  return product === "mounjaro"
    ? MOUNJARO_STARTER_DOSE_MG
    : WEGOVY_STARTER_DOSE_MG;
}

const PRODUCT_LABEL: Record<WlProduct, string> = {
  mounjaro: "Mounjaro",
  wegovy: "Wegovy",
};

/** Tidy mg formatting — drops trailing zeros (2.50 → 2.5). */
export function formatDoseMg(mg: number): string {
  return `${Number(mg.toFixed(3))} mg`;
}

export function formatProductDose(product: WlProduct, mg: number): string {
  return `${PRODUCT_LABEL[product]} ${formatDoseMg(mg)}`;
}

/** Parse the mg value out of a pen id such as `mounjaro-2_5` or `wegovy-0_25`. */
export function penIdDoseMg(penId: string): number | null {
  const m = /(?:mounjaro|wegovy)-(\d+(?:_\d+)?)/i.exec(penId);
  if (!m) return null;
  const n = Number(m[1]!.replace("_", "."));
  return Number.isFinite(n) ? n : null;
}

export function penIdProduct(penId: string): WlProduct | null {
  if (penId.startsWith("mounjaro")) return "mounjaro";
  if (penId.startsWith("wegovy")) return "wegovy";
  return null;
}

/* ─────────────────────── A. New-starter bands ─────────────────────── */

/** BMI must be at least this to even prompt for previous use. */
export const NEW_STARTER_MIN_BMI = 25;

/**
 * Fallback threshold when no ethnicity/comorbidity band applies (e.g. the
 * patient chose "prefer not to say" and reported no comorbidity). Conservative:
 * standard obesity threshold of 30.
 */
export const NEW_STARTER_DEFAULT_THRESHOLD = BMI_THRESHOLD_WHITE;

/** Starter pens — the only strengths a brand-new starter may be offered. */
export const NEW_STARTER_ALLOWED_PEN_IDS = [
  "mounjaro-2_5",
  "wegovy-0_25",
] as const;

export const NEW_STARTER_PREVIOUS_USE_PROMPT =
  "Not eligible as a new starter. Have you taken Mounjaro or Wegovy before? " +
  "(We will ask you to provide proof of previous prescription and previous BMI " +
  "verification to proceed)";

export const NEW_STARTER_REJECT_LOW_BMI =
  "Based on the information you have given, you are not eligible for weight-loss " +
  "treatment. A BMI of at least 25 is required, with higher thresholds depending " +
  "on your ethnicity and any health conditions.";

/** Shown when a patient who is not a new starter says they have NOT taken before. */
export const NOT_SUITABLE_MESSAGE = "Not suitable.";

export type NewStarterStatus =
  | "incomplete"
  | "eligible"
  | "prompt_previous_use"
  | "reject_low_bmi";

export type NewStarterEligibility = {
  status: NewStarterStatus;
  bmi: number | null;
  /** Lowest applicable threshold ("lowest threshold wins"). */
  threshold: number;
  /** Raw thresholds contributed by ethnicity / comorbidity (excludes default). */
  applicableThresholds: number[];
  isWhite: boolean;
  isBame: boolean;
  hasComorbidity: boolean;
  /** User-facing message for prompt / rejection statuses (null otherwise). */
  message: string | null;
};

export type NewStarterInput = {
  bmi: number | null;
  ethnicity: unknown;
  hasComorbidity: boolean;
};

/** Thresholds contributed by the patient's ethnicity + comorbidity answers. */
export function applicableNewStarterThresholds(input: {
  ethnicity: unknown;
  hasComorbidity: boolean;
}): number[] {
  const thresholds: number[] = [];
  if (isWhiteEthnicity(input.ethnicity)) thresholds.push(BMI_THRESHOLD_WHITE);
  if (isBameEthnicity(input.ethnicity)) thresholds.push(BMI_THRESHOLD_BAME);
  if (input.hasComorbidity) thresholds.push(BMI_THRESHOLD_COMORBIDITY);
  return thresholds;
}

/**
 * Classify a brand-new starter (no previous Mounjaro/Wegovy history).
 *
 * Eligibility is "lowest threshold wins":
 *  • White (not BAME):                BMI ≥ 30
 *  • ≥1 comorbidity:                  BMI ≥ 27.5
 *  • BAME:                            BMI ≥ 27
 * A BAME or comorbid patient with a high BMI passes via their lower band.
 *
 * If not eligible as a new starter:
 *  • BMI ≥ 25 → prompt "have you taken Mounjaro/Wegovy before?" (→ restart flow)
 *  • BMI < 25 → reject outright.
 */
export function classifyNewStarterEligibility(
  input: NewStarterInput,
): NewStarterEligibility {
  const isWhite = isWhiteEthnicity(input.ethnicity);
  const isBame = isBameEthnicity(input.ethnicity);
  const applicableThresholds = applicableNewStarterThresholds(input);
  const threshold =
    applicableThresholds.length > 0
      ? Math.min(...applicableThresholds)
      : NEW_STARTER_DEFAULT_THRESHOLD;

  const base = {
    bmi: input.bmi,
    threshold,
    applicableThresholds,
    isWhite,
    isBame,
    hasComorbidity: input.hasComorbidity,
  } as const;

  if (input.bmi == null) {
    return { ...base, status: "incomplete", message: null };
  }
  if (input.bmi >= threshold) {
    return { ...base, status: "eligible", message: null };
  }
  if (input.bmi >= NEW_STARTER_MIN_BMI) {
    return {
      ...base,
      status: "prompt_previous_use",
      message: NEW_STARTER_PREVIOUS_USE_PROMPT,
    };
  }
  return {
    ...base,
    status: "reject_low_bmi",
    message: NEW_STARTER_REJECT_LOW_BMI,
  };
}

/* ─────────────────────── B. Restart / gap dosing ─────────────────────── */

/** Hard maximum restart doses (mg) per gap band — see reference image. */
export const RESTART_CAP_8_TO_12_WEEKS: Record<WlProduct, number> = {
  mounjaro: 10,
  wegovy: 1,
};
export const RESTART_CAP_12_TO_24_WEEKS: Record<WlProduct, number> = {
  mounjaro: 5,
  wegovy: 1,
};

/** ~12 months expressed in whole weeks. */
const WEEKS_IN_12_MONTHS = 52;

export type RestartGapCategory =
  | "no_data"
  | "le_8_weeks"
  | "gap_8_to_12_weeks"
  | "gap_12_to_24_weeks"
  | "gap_24_weeks_to_12_months"
  | "gap_over_12_months";

export type RestartDosingResult = {
  category: RestartGapCategory;
  gapWeeks: number | null;
  product: WlProduct;
  lastToleratedDoseMg: number | null;
  /** Doses the patient may select (ascending, clamped to the ladder + caps). */
  allowedDosesMg: number[];
  /** Highlighted "recommended" dose (null when blocked / unknown). */
  recommendedDoseMg: number | null;
  /** Hard maximum applied for this band (null when no explicit cap). */
  maxDoseMg: number | null;
  restartAtLowest: boolean;
  /** Gap > 12 months — patient must re-satisfy full new-patient criteria. */
  mustMeetNewPatientCriteria: boolean;
  /** Gap > 24 weeks — restart only allowed if BMI ≥ 25. */
  requiresMinBmi25: boolean;
  blocked: { reason: string } | null;
  /** Plain-language explanation for the UI. */
  note: string;
};

/** Whole weeks between an injection date (ISO yyyy-mm-dd) and `today`. */
export function gapWeeksFromDate(
  lastInjectionISO: string,
  today: Date = new Date(),
): number | null {
  if (!lastInjectionISO || !lastInjectionISO.trim()) return null;
  const d = new Date(lastInjectionISO);
  if (Number.isNaN(d.getTime())) return null;
  const ms = today.getTime() - d.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

export function categoriseRestartGap(
  gapWeeks: number | null,
): RestartGapCategory {
  if (gapWeeks == null) return "no_data";
  if (gapWeeks <= 8) return "le_8_weeks";
  if (gapWeeks <= 12) return "gap_8_to_12_weeks";
  if (gapWeeks <= 24) return "gap_12_to_24_weeks";
  if (gapWeeks <= WEEKS_IN_12_MONTHS) return "gap_24_weeks_to_12_months";
  return "gap_over_12_months";
}

/** Index of `mg` on the ladder; falls back to the nearest dose at or below it. */
function ladderIndexFor(ladder: number[], mg: number | null): number {
  if (mg == null) return -1;
  const exact = ladder.indexOf(mg);
  if (exact >= 0) return exact;
  let best = -1;
  ladder.forEach((d, i) => {
    if (d <= mg) best = i;
  });
  return best;
}

export type RestartDosingInput = {
  product: WlProduct;
  /** Last tolerated dose in mg (from the patient's chosen strength). */
  lastToleratedDoseMg: number | null;
  gapWeeks: number | null;
  /** Current BMI — required to enforce the > 24 week "BMI ≥ 25" rule. */
  bmi: number | null;
};

/**
 * Apply the Mounjaro/Wegovy restart gap-dosing rules. Returns the doses the
 * patient may select, the recommended dose, the cap, and any blocking reason.
 */
export function computeRestartDosing(
  input: RestartDosingInput,
): RestartDosingResult {
  const { product, lastToleratedDoseMg, gapWeeks, bmi } = input;
  const ladder = doseLadderFor(product);
  const lowest = ladder[0]!;
  const category = categoriseRestartGap(gapWeeks);
  const idx = ladderIndexFor(ladder, lastToleratedDoseMg);

  const result: RestartDosingResult = {
    category,
    gapWeeks,
    product,
    lastToleratedDoseMg,
    allowedDosesMg: [],
    recommendedDoseMg: null,
    maxDoseMg: null,
    restartAtLowest: false,
    mustMeetNewPatientCriteria: false,
    requiresMinBmi25: false,
    blocked: null,
    note: "",
  };

  const dosesAtOrBelow = (max: number) => ladder.filter((d) => d <= max);

  switch (category) {
    case "no_data": {
      result.note =
        "Tell us your last injection date so we can confirm a safe restart dose.";
      return result;
    }

    case "le_8_weeks": {
      const next =
        idx >= 0 && idx + 1 < ladder.length
          ? ladder[idx + 1]!
          : idx >= 0
            ? ladder[idx]!
            : lowest;
      result.allowedDosesMg = dosesAtOrBelow(next);
      result.recommendedDoseMg = next;
      result.maxDoseMg = next;
      result.note =
        `Gap of 8 weeks or less — you may continue your dose or titrate up to ` +
        `the next level. ${formatProductDose(product, next)} is the recommended ` +
        `next step; lower doses remain available.`;
      return result;
    }

    case "gap_8_to_12_weeks": {
      const cap = RESTART_CAP_8_TO_12_WEEKS[product];
      const base = lastToleratedDoseMg ?? lowest;
      const target = Math.min(base, cap);
      result.allowedDosesMg = dosesAtOrBelow(target);
      result.recommendedDoseMg = target;
      result.maxDoseMg = cap;
      result.note =
        `Gap of 8–12 weeks — continue your last tolerated dose, capped at a ` +
        `maximum of ${formatProductDose(product, cap)}.`;
      return result;
    }

    case "gap_12_to_24_weeks": {
      const cap = RESTART_CAP_12_TO_24_WEEKS[product];
      const oneLower = idx > 0 ? ladder[idx - 1]! : lowest;
      const target = Math.min(oneLower, cap);
      result.allowedDosesMg = dosesAtOrBelow(target);
      result.recommendedDoseMg = target;
      result.maxDoseMg = cap;
      result.note =
        `Gap of 12–24 weeks — restart one dose lower than your last tolerated ` +
        `dose, capped at a maximum of ${formatProductDose(product, cap)}.`;
      return result;
    }

    case "gap_24_weeks_to_12_months": {
      result.restartAtLowest = true;
      result.requiresMinBmi25 = true;
      result.recommendedDoseMg = lowest;
      result.maxDoseMg = lowest;
      if (bmi != null && bmi < NEW_STARTER_MIN_BMI) {
        result.blocked = {
          reason:
            "After a gap of more than 24 weeks, a restart is only possible if " +
            "your BMI is at least 25.",
        };
        result.allowedDosesMg = [];
        result.note = result.blocked.reason;
        return result;
      }
      result.allowedDosesMg = [lowest];
      result.note =
        `Gap of more than 24 weeks — restart at the lowest dose ` +
        `(${formatProductDose(product, lowest)}). Allowed only if BMI ≥ 25.`;
      return result;
    }

    case "gap_over_12_months": {
      result.restartAtLowest = true;
      result.mustMeetNewPatientCriteria = true;
      result.allowedDosesMg = [lowest];
      result.recommendedDoseMg = lowest;
      result.maxDoseMg = lowest;
      result.note =
        `Gap of more than 12 months — restart at the lowest dose ` +
        `(${formatProductDose(product, lowest)}) and you must meet the full ` +
        `new-patient criteria again (starter doses only).`;
      return result;
    }
  }

  return result;
}

/* ───────────────── New-starter titration bundles ───────────────── */

/**
 * Max pens a new starter may buy in a single order. Each pen is a 4-week
 * supply, so 3 pens ≈ 3 months.
 */
export const NEW_STARTER_MAX_BUNDLE_PENS = 3;

/**
 * How many strengths *above* the eligible dose to offer (the patient is shown
 * their eligible dose plus up to this many higher strengths). Capped by the
 * purchasable catalogue.
 */
export const NEW_STARTER_HIGHER_OFFER_COUNT = 3;

const DOSE_EPSILON = 1e-9;

/**
 * Strengths offered to a new starter, ascending: the eligible (lowest) dose
 * plus the next higher purchasable strengths, capped at `maxHigher`.
 *
 * `catalogDosesMg` is the list of purchasable strengths for the product (any
 * order). Titration always begins at the eligible dose, so anything below it
 * is dropped.
 */
export function offeredStarterDosesMg(
  catalogDosesMg: number[],
  eligibleDoseMg: number,
  maxHigher: number = NEW_STARTER_HIGHER_OFFER_COUNT,
): number[] {
  return [...catalogDosesMg]
    .sort((a, b) => a - b)
    .filter((d) => d >= eligibleDoseMg - DOSE_EPSILON)
    .slice(0, maxHigher + 1);
}

export type BundleValidation = { ok: boolean; reason: string | null };

/**
 * Validate a new-starter titration bundle.
 *
 * Rules (the patient builds a 1–`maxPens` pen order):
 *  • Must include at least one pen of the eligible (lowest) dose.
 *  • Strengths titrate up ONE step at a time — the distinct strengths chosen
 *    must form a contiguous run starting at the eligible dose, with no skipped
 *    strength (e.g. you can't take 7.5 mg without also taking 5 mg).
 *  • Any chosen strength may repeat, as long as the total stays within
 *    `maxPens`.
 *
 * `offeredDosesMg` must be ascending with the eligible dose first (see
 * `offeredStarterDosesMg`).
 */
export function validateStarterBundle(args: {
  offeredDosesMg: number[];
  selectedDosesMg: number[];
  maxPens?: number;
}): BundleValidation {
  const { offeredDosesMg, selectedDosesMg } = args;
  const maxPens = args.maxPens ?? NEW_STARTER_MAX_BUNDLE_PENS;

  if (selectedDosesMg.length === 0) {
    return { ok: false, reason: "Select at least one pen to continue." };
  }
  if (selectedDosesMg.length > maxPens) {
    return {
      ok: false,
      reason: `You can buy up to ${maxPens} months (${maxPens} pens) per order.`,
    };
  }

  const indexOfDose = (mg: number) =>
    offeredDosesMg.findIndex((d) => Math.abs(d - mg) < DOSE_EPSILON);
  const indices = selectedDosesMg.map(indexOfDose);
  if (indices.some((i) => i < 0)) {
    return { ok: false, reason: "That strength isn't available for you." };
  }

  const distinct = Array.from(new Set(indices)).sort((a, b) => a - b);
  if (distinct[0] !== 0) {
    return {
      ok: false,
      reason: "Your bundle must include your eligible starter dose.",
    };
  }
  for (let k = 0; k < distinct.length; k++) {
    if (distinct[k] !== k) {
      return {
        ok: false,
        reason:
          "Doses must step up one strength at a time — you can't skip a strength.",
      };
    }
  }
  return { ok: true, reason: null };
}

/**
 * Map computed allowed doses to the purchasable pen ids in a catalogue.
 * `catalog` is the page's PEN_OPTIONS (id + dose mg parsed from the id).
 */
export function allowedPenIdsForDoses(
  product: WlProduct,
  allowedDosesMg: number[],
  catalogPenIds: string[],
): string[] {
  const allowed = new Set(allowedDosesMg);
  return catalogPenIds.filter((id) => {
    if (penIdProduct(id) !== product) return false;
    const mg = penIdDoseMg(id);
    return mg != null && allowed.has(mg);
  });
}

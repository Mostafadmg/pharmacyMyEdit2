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

/** Maximum recommended dose when gap is 4–8 weeks (one step down rule). */
export const RESTART_CAP_4_TO_8_WEEKS: Record<WlProduct, number> = {
  mounjaro: 10,
  wegovy: 1,
};

/** @deprecated Use {@link RESTART_CAP_4_TO_8_WEEKS}. */
export const RESTART_CAP_8_TO_12_WEEKS = RESTART_CAP_4_TO_8_WEEKS;

export type RestartGapCategory =
  | "no_data"
  | "le_4_weeks"
  | "gap_4_to_8_weeks"
  | "gap_over_8_weeks";

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
  if (gapWeeks <= 4) return "le_4_weeks";
  if (gapWeeks <= 8) return "gap_4_to_8_weeks";
  return "gap_over_8_weeks";
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
  const { product, lastToleratedDoseMg, gapWeeks } = input;
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

  switch (category) {
    case "no_data": {
      result.note =
        "Tell us your last injection date so we can confirm a safe restart dose.";
      return result;
    }

    case "le_4_weeks": {
      const current = idx >= 0 ? ladder[idx]! : lowest;
      const nextHigher =
        idx >= 0 && idx + 1 < ladder.length ? ladder[idx + 1]! : current;
      result.allowedDosesMg = [...ladder];
      result.recommendedDoseMg = current;
      result.maxDoseMg = nextHigher;
      result.note =
        "Based on the information you have provided, your last injection was " +
        "within 4 weeks.";
      return result;
    }

    case "gap_4_to_8_weeks": {
      const cap = RESTART_CAP_4_TO_8_WEEKS[product];
      const oneLower = idx > 0 ? ladder[idx - 1]! : lowest;
      const target = Math.min(oneLower, cap);
      result.allowedDosesMg = [...ladder];
      result.recommendedDoseMg = target;
      result.maxDoseMg = ladder[ladder.length - 1]!;
      result.note =
        "Based on the information you have provided, you have had a gap of " +
        "4–8 weeks since your last injection. After a gap like this, we usually " +
        "restart one step below your last tolerated dose.";
      return result;
    }

    case "gap_over_8_weeks": {
      result.restartAtLowest = true;
      result.allowedDosesMg = [...ladder];
      result.recommendedDoseMg = lowest;
      result.maxDoseMg = lowest;
      result.note =
        "Based on the information you have provided, you have had a gap of " +
        "more than 8 weeks since your last injection.";
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
 * How many strengths *above* the eligible dose to offer for **new starters**
 * (Mounjaro: 2.5 → 5 → 7.5 mg — no 10 mg in the titration picker).
 */
export const NEW_STARTER_HIGHER_OFFER_COUNT = 2;

export const NEW_STARTER_BUNDLE_INTRO =
  "New starters begin at the lowest starter dose (Mounjaro 2.5 mg / Wegovy 0.25 mg). " +
  "You can order up to 3 months (3 pens) in one go, but each strength must follow " +
  "the titration ladder in order — you cannot skip a step (for example, 7.5 mg " +
  "requires 5 mg, and 5 mg requires 2.5 mg).";

export const TRANSFER_BUNDLE_INTRO =
  "Choose 1, 2, or 3 pens (one month each). A 1-month bundle can be your recommended " +
  "dose or any lower strength. Multi-month bundles let you step up the ladder — each " +
  "strength must follow the next with no gaps, and you can repeat the same dose.";

export const BUNDLE_LADDER_SKIP_MESSAGE =
  "Your pens must follow the dose ladder in order with no skipped steps — for example, " +
  "you can't combine 2.5 mg and 10 mg without the strengths in between. You can repeat " +
  "the same dose (e.g. two 10 mg pens).";

export const BUNDLE_ONE_MONTH_HIGH_DOSE_MESSAGE =
  "With a 1-month bundle you can choose your recommended dose or any lower strength. " +
  "Higher doses are available with a 2- or 3-month bundle.";

export const NEW_STARTER_BUNDLE_RECOMMENDED_NOTE =
  "As a new starter, treatment begins at the lowest dose. You can order that dose " +
  "alone or build a 1–3 pen bundle stepping up from there.";

export function transferRecommendedDoseNote(
  product: WlProduct,
  recommendedDoseMg: number,
): string {
  return (
    `Based on the information you have provided, the dose we recommend for you is ` +
    `${formatProductDose(product, recommendedDoseMg)}. You can still order a lower ` +
    `strength if you need to — as a single pen or as part of a bundle.`
  );
}

export const BUNDLE_TITRATION_ACK_LABEL =
  "I understand that side effects are more likely when titrating to a higher dose. " +
  "If I struggle with side effects on a multi-month bundle, I may need to reduce my " +
  "dose and pens I have already ordered may not suit a revised plan. I can order " +
  "one pen at a time if I prefer a dose tailored month by month.";

export function titrationBundleSideEffectsWarning(product: WlProduct): string {
  if (product === "mounjaro") {
    return (
      "Side effects are more likely when you titrate to a higher dose, especially " +
      "from 5 mg onwards. If you order a multi-month bundle and struggle with side " +
      "effects, you may need to reduce your dose — pens you have already ordered " +
      "may not match a revised plan. Ordering one pen at a time lets our clinical " +
      "team tailor your dose month by month."
    );
  }
  return (
    "Side effects are more likely when you titrate to a higher dose, especially " +
    "from 1 mg onwards. If you order a multi-month bundle and struggle with side " +
    "effects, you may need to reduce your dose — pens you have already ordered " +
    "may not match a revised plan. Ordering one pen at a time lets our clinical " +
    "team tailor your dose month by month."
  );
}

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

/**
 * Strengths shown in the transfer bundle picker for a given bundle size.
 *
 * • 1-month: lowest dose → recommended (no strengths above recommended).
 * • 2-month: lowest dose → one ladder step above recommended.
 * • 3-month: lowest dose → top of catalogue (e.g. 15 mg Mounjaro).
 * • Gap > 8 weeks: restart at starter; multi-month bundles titrate from starter.
 */
export function offeredTransferDosesMg(
  catalogDosesMg: number[],
  recommendedDoseMg: number | null,
  bundleSize: 1 | 2 | 3,
  restartCategory?: RestartGapCategory,
): number[] {
  const ladder = [...catalogDosesMg].sort((a, b) => a - b);
  if (ladder.length === 0 || recommendedDoseMg == null) return [];

  const recIdx = ladder.findIndex(
    (d) => Math.abs(d - recommendedDoseMg) < DOSE_EPSILON,
  );
  if (recIdx < 0) {
    return ladder.filter((d) => d <= recommendedDoseMg + DOSE_EPSILON);
  }

  if (restartCategory === "gap_over_8_weeks") {
    if (bundleSize === 1) return [ladder[0]!];
    const maxIdx = Math.min(bundleSize - 1, ladder.length - 1);
    return ladder.slice(0, maxIdx + 1);
  }

  let maxIdx: number;
  if (bundleSize === 1) {
    maxIdx = recIdx;
  } else if (bundleSize === 2) {
    maxIdx = Math.min(recIdx + 1, ladder.length - 1);
  } else {
    maxIdx = ladder.length - 1;
  }
  return ladder.slice(0, maxIdx + 1);
}

export function transferBundleMaxOfferedDoseMg(
  catalogDosesMg: number[],
  recommendedDoseMg: number | null,
  bundleSize: 1 | 2 | 3,
  restartCategory?: RestartGapCategory,
): number | null {
  const offered = offeredTransferDosesMg(
    catalogDosesMg,
    recommendedDoseMg,
    bundleSize,
    restartCategory,
  );
  return offered[offered.length - 1] ?? null;
}

/** Full titration ladder for validation (allowed strengths on the product ladder). */
export function transferBundleLadderMg(
  catalogDosesMg: number[],
  allowedDosesMg: number[],
): number[] {
  const allowed = new Set(allowedDosesMg);
  return [...catalogDosesMg]
    .sort((a, b) => a - b)
    .filter((d) => allowed.has(d));
}

export function selectionHasDoseAbove(
  selectedDosesMg: number[],
  thresholdMg: number,
): boolean {
  return selectedDosesMg.some((d) => d > thresholdMg + DOSE_EPSILON);
}

export function selectionIncludesDose(
  selectedDosesMg: number[],
  doseMg: number,
): boolean {
  return selectedDosesMg.some((d) => Math.abs(d - doseMg) < DOSE_EPSILON);
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
export function validateTitrationBundle(args: {
  offeredDosesMg: number[];
  selectedDosesMg: number[];
  maxPens?: number;
  /** Label for the required first strength in error copy. */
  requiredDoseLabel?: string;
}): BundleValidation {
  const { offeredDosesMg, selectedDosesMg } = args;
  const maxPens = args.maxPens ?? NEW_STARTER_MAX_BUNDLE_PENS;
  const requiredLabel = args.requiredDoseLabel ?? "your eligible starter dose";

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
      reason: `Your bundle must include ${requiredLabel}.`,
    };
  }
  for (let k = 0; k < distinct.length; k++) {
    if (distinct[k] !== k) {
      return {
        ok: false,
        reason: BUNDLE_LADDER_SKIP_MESSAGE,
      };
    }
  }
  return { ok: true, reason: null };
}

/**
 * Validate a transfer titration bundle.
 *
 * Rules:
 *  • 1–`maxPens` pens; each strength must be on the allowed ladder.
 *  • Distinct strengths must form a contiguous run on the ladder (no skipped steps).
 *  • Ordering **only at or below** the recommended dose: recommended dose not required.
 *  • Any pen **above** the recommended dose: must include the recommended dose at least once.
 */
export function validateTransferTitrationBundle(args: {
  ladderDosesMg: number[];
  recommendedDoseMg: number;
  selectedDosesMg: number[];
  maxPens?: number;
  maxOfferedDoseMg?: number | null;
}): BundleValidation {
  const { ladderDosesMg, recommendedDoseMg, selectedDosesMg } = args;
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

  if (args.maxOfferedDoseMg != null) {
    const tooHigh = selectedDosesMg.some(
      (d) => d > args.maxOfferedDoseMg! + DOSE_EPSILON,
    );
    if (tooHigh) {
      return {
        ok: false,
        reason: BUNDLE_ONE_MONTH_HIGH_DOSE_MESSAGE,
      };
    }
  }

  const indexOfDose = (mg: number) =>
    ladderDosesMg.findIndex((d) => Math.abs(d - mg) < DOSE_EPSILON);
  const indices = selectedDosesMg.map(indexOfDose);
  if (indices.some((i) => i < 0)) {
    return { ok: false, reason: "That strength isn't available for you." };
  }

  const hasAbove = selectionHasDoseAbove(selectedDosesMg, recommendedDoseMg);
  if (
    hasAbove &&
    !selectionIncludesDose(selectedDosesMg, recommendedDoseMg)
  ) {
    return {
      ok: false,
      reason:
        "If you include a dose above your recommended strength, you must include at least one pen at the recommended dose.",
    };
  }

  const distinct = Array.from(new Set(indices)).sort((a, b) => a - b);
  for (let k = 0; k < distinct.length; k++) {
    if (distinct[k] !== distinct[0]! + k) {
      return {
        ok: false,
        reason: BUNDLE_LADDER_SKIP_MESSAGE,
      };
    }
  }

  return { ok: true, reason: null };
}

/** @deprecated Use {@link validateTitrationBundle}. */
export const validateStarterBundle = validateTitrationBundle;

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

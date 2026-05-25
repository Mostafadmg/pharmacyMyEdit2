/** Weight-loss BMI eligibility thresholds and prior-provider BMI verification rules. */

export const BMI_THRESHOLD_WHITE = 30;
export const BMI_THRESHOLD_BAME = 27;
export const BMI_THRESHOLD_COMORBIDITY = 27.5;
export const MOUNJARO_STARTER_DOSE_MG = 2.5;
export const WEGOVY_STARTER_DOSE_MG = 0.25;

const BAME_ETHNICITIES = new Set([
  "asian",
  "black",
  "middle-eastern",
  "mixed",
  "other",
]);

const MOUNJARO_PEN_DOSE_MG: Record<string, number> = {
  "mounjaro-2_5": 2.5,
  "mounjaro-5": 5,
  "mounjaro-7_5": 7.5,
  "mounjaro-10": 10,
  "mounjaro-12_5": 12.5,
  "mounjaro-15": 15,
};

const WEGOVY_PEN_DOSE_MG: Record<string, number> = {
  "wegovy-0_25": 0.25,
  "wegovy-0_5": 0.5,
  "wegovy-1_0": 1.0,
};

export type WlBmiEligibilityOutcome = {
  bmi: number | null;
  bmi_eligibility_threshold: number | null;
  bmi_eligible_at_submission: boolean;
  requires_previous_bmi_verification: boolean;
  requires_previous_prescription: boolean;
  applicable_thresholds: number[];
};

export function isWhiteEthnicity(ethnicity: unknown): boolean {
  return ethnicity === "white";
}

export function isBameEthnicity(ethnicity: unknown): boolean {
  return typeof ethnicity === "string" && BAME_ETHNICITIES.has(ethnicity);
}

/** Comorbidity pathway — excluding conditions or diagnosed comorbidities on questionnaire. */
export function hasWlComorbidity(answers: Record<string, unknown>): boolean {
  if (answers.excluding_conditions === "yes") return true;
  if (answers.has_comorbidity === "yes") return true;
  const diagnosed = answers.diagnosed_conditions_details;
  if (Array.isArray(diagnosed) && diagnosed.length > 0) return true;
  const legacy = answers.diagnosed_conditions;
  if (Array.isArray(legacy) && legacy.length > 0) return true;
  return false;
}

export function getApplicableBmiThresholds(
  answers: Record<string, unknown>,
): number[] {
  const thresholds: number[] = [];
  const ethnicity = answers.ethnicity;
  if (isWhiteEthnicity(ethnicity)) thresholds.push(BMI_THRESHOLD_WHITE);
  if (isBameEthnicity(ethnicity)) thresholds.push(BMI_THRESHOLD_BAME);
  if (hasWlComorbidity(answers)) thresholds.push(BMI_THRESHOLD_COMORBIDITY);
  return thresholds;
}

/** Lowest BMI threshold that applies for this patient (null if no category selected). */
export function getBmiEligibilityThreshold(
  answers: Record<string, unknown>,
): number | null {
  const thresholds = getApplicableBmiThresholds(answers);
  if (thresholds.length === 0) return null;
  return Math.min(...thresholds);
}

export function computeBmiFromMetrics(
  weightKg: number,
  heightCm: number,
): number | null {
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightCm) ||
    weightKg <= 0 ||
    heightCm <= 0
  ) {
    return null;
  }
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return Number.isFinite(bmi) ? Number(bmi.toFixed(1)) : null;
}

export function resolveConsultationBmi(
  answers: Record<string, unknown>,
): number | null {
  const fromAnswers = answers.bmi;
  if (typeof fromAnswers === "number" && Number.isFinite(fromAnswers)) {
    return fromAnswers;
  }
  const weight = answers.weight_kg;
  const height = answers.height_cm;
  if (
    typeof weight === "number" &&
    typeof height === "number" &&
    Number.isFinite(weight) &&
    Number.isFinite(height)
  ) {
    return computeBmiFromMetrics(weight, height);
  }
  return null;
}

export function patientMeetsBmiEligibility(
  answers: Record<string, unknown>,
): boolean {
  const threshold = getBmiEligibilityThreshold(answers);
  const bmi = resolveConsultationBmi(answers);
  if (threshold == null || bmi == null) return false;
  return bmi >= threshold;
}

/** Transfer or new starter continuing from another provider. */
export function isWlPriorProviderPatient(
  answers: Record<string, unknown>,
): boolean {
  return (
    answers.journey_stage === "transferring" ||
    answers.consultation_type === "transfer" ||
    answers.changing_from_provider === "yes" ||
    answers.new_to_injectables === "no"
  );
}

function parseDoseMgFromText(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const m = /(\d+(?:\.\d+)?)\s*mg/i.exec(value);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function doseMgFromMounjaroPenId(penId: string): number | null {
  if (penId in MOUNJARO_PEN_DOSE_MG) return MOUNJARO_PEN_DOSE_MG[penId]!;
  const m = /mounjaro-(\d+(?:_\d+)?)/i.exec(penId);
  if (!m) return null;
  const raw = m[1]!.replace("_", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function doseMgFromWegovyPenId(penId: string): number | null {
  if (penId in WEGOVY_PEN_DOSE_MG) return WEGOVY_PEN_DOSE_MG[penId]!;
  const m = /wegovy-(\d+(?:_\d+)?)/i.exec(penId);
  if (!m) return null;
  const raw = m[1]!.replace("_", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function doseMgFromPenId(penId: string): number | null {
  if (penId.startsWith("mounjaro")) return doseMgFromMounjaroPenId(penId);
  if (penId.startsWith("wegovy")) return doseMgFromWegovyPenId(penId);
  return null;
}

/** Highest Mounjaro strength requested in this consultation (mg). */
export function maxRequestedMounjaroDoseMg(
  answers: Record<string, unknown>,
): number | null {
  let max: number | null = null;

  const plan = answers.selected_plan as
    | { penIds?: string[]; medicine?: string }
    | undefined;
  if (plan?.penIds?.length) {
    for (const penId of plan.penIds) {
      if (!penId.startsWith("mounjaro")) continue;
      const mg = doseMgFromPenId(penId);
      if (mg != null) max = max == null ? mg : Math.max(max, mg);
    }
  }

  for (const key of [
    "current_dose",
    "requested_medication",
    "requested_dose",
    "continuation_dose",
  ]) {
    const mg = parseDoseMgFromText(answers[key]);
    if (mg != null) max = max == null ? mg : Math.max(max, mg);
  }

  return max;
}

/** Highest Wegovy strength requested in this consultation (mg). */
export function maxRequestedWegovyDoseMg(
  answers: Record<string, unknown>,
): number | null {
  let max: number | null = null;

  const penId = answers.transfer_wl_strength_pen_id;
  if (typeof penId === "string" && penId.startsWith("wegovy")) {
    const mg = doseMgFromWegovyPenId(penId);
    if (mg != null) max = mg;
  }

  const plan = answers.selected_plan as
    | { penIds?: string[]; medicine?: string }
    | undefined;
  if (plan?.penIds?.length) {
    for (const id of plan.penIds) {
      if (!id.startsWith("wegovy")) continue;
      const mg = doseMgFromPenId(id);
      if (mg != null) max = max == null ? mg : Math.max(max, mg);
    }
  }

  for (const key of [
    "transfer_wl_strength",
    "current_dose",
    "requested_medication",
    "requested_dose",
    "continuation_dose",
  ]) {
    const raw = answers[key];
    if (typeof raw !== "string" || !/wegovy/i.test(raw)) continue;
    const mg = parseDoseMgFromText(raw);
    if (mg != null) max = max == null ? mg : Math.max(max, mg);
  }

  if (answers.transfer_wl_product === "wegovy") {
    const mg = parseDoseMgFromText(answers.transfer_wl_strength);
    if (mg != null) max = max == null ? mg : Math.max(max, mg);
  }

  return max;
}

export function isMounjaroAboveStarterDose(
  answers: Record<string, unknown>,
): boolean {
  const max = maxRequestedMounjaroDoseMg(answers);
  return max != null && max > MOUNJARO_STARTER_DOSE_MG;
}

export function isWegovyAboveStarterDose(
  answers: Record<string, unknown>,
): boolean {
  const max = maxRequestedWegovyDoseMg(answers);
  return max != null && max > WEGOVY_STARTER_DOSE_MG;
}

/**
 * Starter continuation dose: Mounjaro 2.5 mg or Wegovy 0.25 mg (from transfer
 * strength, plan pens, or dose text fields).
 */
export function isWlStarterDoseRequested(
  answers: Record<string, unknown>,
): boolean {
  const penId = answers.transfer_wl_strength_pen_id;
  if (typeof penId === "string") {
    if (penId.startsWith("mounjaro")) {
      const mg = doseMgFromMounjaroPenId(penId);
      return mg != null && mg <= MOUNJARO_STARTER_DOSE_MG;
    }
    if (penId.startsWith("wegovy")) {
      const mg = doseMgFromWegovyPenId(penId);
      return mg != null && mg <= WEGOVY_STARTER_DOSE_MG;
    }
  }

  const product = answers.transfer_wl_product;
  const transferMg = parseDoseMgFromText(answers.transfer_wl_strength);
  if (product === "mounjaro" && transferMg != null) {
    return transferMg <= MOUNJARO_STARTER_DOSE_MG;
  }
  if (product === "wegovy" && transferMg != null) {
    return transferMg <= WEGOVY_STARTER_DOSE_MG;
  }

  const mounMax = maxRequestedMounjaroDoseMg(answers);
  const wegMax = maxRequestedWegovyDoseMg(answers);
  if (mounMax != null && wegMax == null) {
    return mounMax <= MOUNJARO_STARTER_DOSE_MG;
  }
  if (wegMax != null && mounMax == null) {
    return wegMax <= WEGOVY_STARTER_DOSE_MG;
  }
  if (mounMax != null && wegMax != null) {
    return (
      mounMax <= MOUNJARO_STARTER_DOSE_MG && wegMax <= WEGOVY_STARTER_DOSE_MG
    );
  }

  const plan = answers.selected_plan as { medicine?: string } | undefined;
  if (plan?.medicine === "mounjaro" && mounMax != null) {
    return mounMax <= MOUNJARO_STARTER_DOSE_MG;
  }
  if (plan?.medicine === "wegovy" && wegMax != null) {
    return wegMax <= WEGOVY_STARTER_DOSE_MG;
  }

  return false;
}

/**
 * Prior-provider patients need previous prescription proof unless BMI-eligible
 * at submission and requesting starter dose only.
 */
export function requiresPreviousPrescription(
  answers: Record<string, unknown>,
): boolean {
  if (!isWlPriorProviderPatient(answers)) return false;
  if (!patientMeetsBmiEligibility(answers)) return true;
  if (!isWlStarterDoseRequested(answers)) return true;
  return false;
}

/**
 * Prior-provider patients requesting Mounjaro &gt; 2.5 mg with current BMI below
 * their eligibility threshold need photo proof of BMI at start with previous provider.
 */
export function requiresPreviousBmiVerification(
  answers: Record<string, unknown>,
): boolean {
  if (!isWlPriorProviderPatient(answers)) return false;
  if (!isMounjaroAboveStarterDose(answers)) return false;
  if (patientMeetsBmiEligibility(answers)) return false;
  return true;
}

export function evaluateWlBmiEligibility(
  answers: Record<string, unknown>,
): WlBmiEligibilityOutcome {
  const applicable_thresholds = getApplicableBmiThresholds(answers);
  const bmi_eligibility_threshold = getBmiEligibilityThreshold(answers);
  const bmi = resolveConsultationBmi(answers);
  const bmi_eligible_at_submission = patientMeetsBmiEligibility(answers);
  const requires_previous_bmi_verification =
    requiresPreviousBmiVerification(answers);
  const requires_previous_prescription =
    requiresPreviousPrescription(answers);

  return {
    bmi,
    bmi_eligibility_threshold,
    bmi_eligible_at_submission,
    requires_previous_bmi_verification,
    requires_previous_prescription,
    applicable_thresholds,
  };
}

/** Answer fields to persist alongside consultation document requirements. */
export function wlBmiEligibilityAnswerFields(
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const outcome = evaluateWlBmiEligibility(answers);
  return {
    bmi: outcome.bmi ?? answers.bmi,
    bmi_eligibility_threshold: outcome.bmi_eligibility_threshold,
    bmi_eligible_at_submission: outcome.bmi_eligible_at_submission,
    requires_previous_bmi_verification:
      outcome.requires_previous_bmi_verification,
    requires_previous_prescription: outcome.requires_previous_prescription,
    bmi_eligibility_thresholds_applied: outcome.applicable_thresholds,
  };
}

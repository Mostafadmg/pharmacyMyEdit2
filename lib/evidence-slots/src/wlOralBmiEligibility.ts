/**
 * BMI eligibility for new-patient oral weight-loss consultations (Orlistat / Mysimba).
 * Evaluated internally at submission — never shown as eligible/ineligible mid-flow.
 */

/** BMI at or below this value is ineligible (new patients). */
export const ORAL_NEW_PATIENT_BMI_INELIGIBLE_AT_OR_BELOW = 27.5;

/** Minimum BMI without comorbidity (29.5 rounds up to 30 for patients). */
export const ORAL_NEW_PATIENT_BMI_STANDARD_THRESHOLD = 30;

/** Documented comorbidity-pathway threshold (step 7 conditions). */
export const ORAL_NEW_PATIENT_BMI_COMORBIDITY_THRESHOLD = 28;

export type OralNewPatientBmiInput = {
  journeyStage: "new" | "existing" | "transferring" | null;
  bmi: number | null;
  hasStep7Comorbidity: boolean;
};

export function oralNewPatientMeetsBmiEligibility(
  input: OralNewPatientBmiInput,
): boolean {
  if (input.journeyStage !== "new") return true;
  const { bmi, hasStep7Comorbidity } = input;
  if (bmi == null || !Number.isFinite(bmi)) return false;

  if (bmi <= ORAL_NEW_PATIENT_BMI_INELIGIBLE_AT_OR_BELOW) return false;
  if (bmi >= ORAL_NEW_PATIENT_BMI_STANDARD_THRESHOLD) return true;

  // Above 27.5 and below 30 — comorbidity pathway only.
  return hasStep7Comorbidity;
}

export function oralNewPatientBmiIneligibleReason(
  input: OralNewPatientBmiInput,
): string | null {
  if (oralNewPatientMeetsBmiEligibility(input)) return null;
  if (input.journeyStage !== "new") return null;
  const { bmi, hasStep7Comorbidity } = input;
  if (bmi == null) return "BMI not recorded";

  if (bmi <= ORAL_NEW_PATIENT_BMI_INELIGIBLE_AT_OR_BELOW) {
    return `BMI ${bmi.toFixed(1)} — at or below ${ORAL_NEW_PATIENT_BMI_INELIGIBLE_AT_OR_BELOW}`;
  }
  if (bmi < ORAL_NEW_PATIENT_BMI_STANDARD_THRESHOLD && !hasStep7Comorbidity) {
    return `BMI ${bmi.toFixed(1)} — below ${ORAL_NEW_PATIENT_BMI_STANDARD_THRESHOLD} without qualifying comorbidity`;
  }
  return `BMI ${bmi.toFixed(1)} — does not meet new-patient BMI criteria`;
}

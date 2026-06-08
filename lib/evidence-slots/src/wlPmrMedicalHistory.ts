/**
 * PMR medical-history checklist for injectable weight-loss consultations.
 * Shared by new_start, transfer, and simple_repeat — all journeys use step 6
 * (`MedicalHistorySection`) with this single catalogue.
 */

export const PMR_MEDICAL_HISTORY_INTRO =
  "Weight loss injections can significantly improve weight-related comorbidity.";

export const PMR_MEDICAL_HISTORY_GATE_QUESTION =
  "Have you ever been diagnosed with any of the following?";

export const WL_MEDICAL_HISTORY_CONDITIONS = [
  { id: "prediabetes", label: "Prediabetes" },
  { id: "type2_diabetes", label: "Type 2 diabetes" },
  { id: "high_blood_pressure", label: "High blood pressure" },
  { id: "high_cholesterol", label: "High cholesterol" },
  {
    id: "heart_blood_vessel_disease",
    label: "Heart or blood vessel disease (including previous heart attack)",
  },
  { id: "previous_stroke", label: "Previous stroke" },
  { id: "obstructive_sleep_apnoea", label: "Obstructive sleep apnoea" },
  {
    id: "acid_reflux_gord",
    label:
      "Acid reflux or gastro-oesophageal reflux disease (GORD) (and taking regular medication)",
  },
  {
    id: "masld",
    label:
      "Metabolic dysfunction-associated steatotic liver disease (MASLD). Previously known as non-alcoholic fatty liver disease.",
  },
  { id: "osteoarthritis", label: "Osteoarthritis" },
  {
    id: "depression",
    label: "Depression (and taking regular medication)",
  },
  { id: "erectile_dysfunction", label: "Erectile dysfunction" },
  { id: "pcos", label: "Polycystic ovary syndrome (PCOS)" },
] as const;

export type WlMedicalHistoryConditionId =
  (typeof WL_MEDICAL_HISTORY_CONDITIONS)[number]["id"];

export function wlMedicalHistoryLabelById(): Record<string, string> {
  return Object.fromEntries(
    WL_MEDICAL_HISTORY_CONDITIONS.map((c) => [c.id, c.label]),
  );
}

/** Legacy condition IDs from older consultations — display only. */
export const LEGACY_WL_MEDICAL_HISTORY_LABELS: Record<string, string> = {
  asthma: "Asthma",
  copd: "COPD",
  diabetes: "Diabetes",
  heart_disease: "Heart disease",
  hypertension: "Hypertension",
  stroke_tia: "Stroke / TIA",
  epilepsy: "Epilepsy",
  cancer: "Cancer",
  mental_health: "Mental health condition",
};

export function wlMedicalHistoryLabelsIncludingLegacy(): Record<string, string> {
  return {
    ...wlMedicalHistoryLabelById(),
    ...LEGACY_WL_MEDICAL_HISTORY_LABELS,
  };
}

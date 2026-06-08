/**
 * PMR-style comorbidity checklist for oral weight-loss consultations.
 * Same gate / checklist / medication follow-up rules as injectable PMR history.
 */

export const ORAL_MEDICAL_HISTORY_INTRO =
  "Weight loss treatment can significantly improve weight-related comorbidity.";

export const ORAL_MEDICAL_HISTORY_GATE_QUESTION =
  "Have you ever been diagnosed with any of the following?";

export const WL_ORAL_MEDICAL_HISTORY_CONDITIONS = [
  { id: "prediabetes", label: "Prediabetes" },
  {
    id: "type2_diabetes",
    label: "Type 2 diabetes mellitus (diet controlled)",
  },
  { id: "hypertension", label: "Hypertension (high blood pressure)" },
  {
    id: "dyslipidaemia",
    label:
      "Dyslipidaemia (high cholesterol / raised triglycerides / low HDL)",
  },
  {
    id: "cardiovascular_disease",
    label:
      "Cardiovascular disease — including previous heart attack, previous stroke, TIA, ischaemic heart disease, peripheral arterial disease, heart failure",
  },
  { id: "obstructive_sleep_apnoea", label: "Obstructive sleep apnoea" },
  {
    id: "masld",
    label:
      "MASLD / NAFLD (metabolic dysfunction-associated steatotic liver disease)",
  },
  {
    id: "pcos_metabolic",
    label: "Polycystic ovary syndrome (PCOS) with metabolic features",
  },
] as const;

export type WlOralMedicalHistoryConditionId =
  (typeof WL_ORAL_MEDICAL_HISTORY_CONDITIONS)[number]["id"];

export function wlOralMedicalHistoryLabelById(): Record<string, string> {
  return Object.fromEntries(
    WL_ORAL_MEDICAL_HISTORY_CONDITIONS.map((c) => [c.id, c.label]),
  );
}

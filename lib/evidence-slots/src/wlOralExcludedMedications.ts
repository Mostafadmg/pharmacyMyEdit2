/**
 * Excluded medicines for oral weight-loss consultations (Orlistat / Mysimba).
 * Checkbox-only when currently taking — same gate rules as injectable high-risk step 7.
 */

export const WL_ORAL_EXCLUDED_MEDS_GATE_QUESTION =
  "Are you currently taking any of the following medicines?";

export const WL_ORAL_EXCLUDED_MEDS_STOPPED_PAST_THREE_MONTHS_QUESTION =
  "Have you been on any of these medications and stopped them in the past three months?";

export const WL_ORAL_EXCLUDED_MEDICATIONS = [
  {
    id: "sulfonylureas",
    label:
      "Sulfonylureas for diabetes (e.g. gliclazide, glibenclamide, glipizide)",
  },
  {
    id: "oral_anticoagulants",
    label: "Oral anticoagulants (e.g. warfarin, acenocoumarol)",
  },
  { id: "ciclosporin", label: "Ciclosporin (immunosuppressant)" },
  { id: "tacrolimus", label: "Tacrolimus (immunosuppressant)" },
  { id: "levothyroxine", label: "Levothyroxine (thyroid medication)" },
  { id: "amiodarone", label: "Amiodarone (heart rhythm medication)" },
  { id: "acarbose", label: "Acarbose (diabetes medication)" },
  { id: "hiv_medication", label: "HIV medication (antiretrovirals)" },
  {
    id: "iodine_salts",
    label: "Iodine salts or iodine-containing medications",
  },
  {
    id: "anticonvulsants",
    label:
      "Anti-convulsant / anti-epileptic drugs (e.g. phenytoin, lamotrigine, levetiracetam)",
  },
  {
    id: "antidepressants_weight_gain",
    label:
      "Antidepressants associated with weight gain (e.g. mirtazapine, amitriptyline, duloxetine)",
  },
  {
    id: "antipsychotics",
    label:
      "Antipsychotic medication (e.g. olanzapine, quetiapine, clozapine, risperidone)",
  },
  { id: "lithium", label: "Lithium" },
  {
    id: "other_anti_obesity_drugs",
    label:
      "Other anti-obesity or weight-loss drugs or injections (e.g. Mounjaro, Wegovy)",
  },
] as const;

export type WlOralExcludedMedId =
  (typeof WL_ORAL_EXCLUDED_MEDICATIONS)[number]["id"];

/** Legacy med IDs from older consultations — display only. */
export const LEGACY_WL_ORAL_EXCLUDED_MED_LABELS: Record<string, string> = {
  insulin: "Insulin (for diabetes)",
  oral_contraceptive: "Oral contraceptive pill (combined or progesterone-only)",
  statins:
    "Statins (cholesterol-lowering medication, e.g. atorvastatin, simvastatin)",
  weight_loss_injections: "Weight-loss injections (e.g. Mounjaro, Wegovy)",
};

export function wlOralExcludedMedLabelById(): Record<string, string> {
  return {
    ...Object.fromEntries(
      WL_ORAL_EXCLUDED_MEDICATIONS.map((m) => [m.id, m.label]),
    ),
    ...LEGACY_WL_ORAL_EXCLUDED_MED_LABELS,
  };
}


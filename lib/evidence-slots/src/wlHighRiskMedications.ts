/**
 * High-risk medicine catalogue for injectable weight-loss consultations.
 * Shared by new_start, transfer, and simple_repeat (step 6 + repeat monitoring).
 */

export const WL_HIGH_RISK_GATE_QUESTION =
  "Are you currently taking any of the following medications?";

export const WL_REPEAT_HIGH_RISK_QUESTION =
  "Do you take any of the following medications? If yes, we need your latest monitoring and symptom check.";

export type WlHighRiskMedicationEntry = {
  readonly id: string;
  readonly label: string;
  /** Shown once before the first item in a grouped block (e.g. "DPP-4 inhibitors"). */
  readonly section?: string;
};

export const WL_HIGH_RISK_MEDICATIONS = [
  { id: "amiodarone", label: "Amiodarone" },
  { id: "carbamazepine", label: "Carbamazepine" },
  { id: "ciclosporin", label: "Ciclosporin" },
  { id: "clozapine", label: "Clozapine" },
  { id: "digoxin", label: "Digoxin" },
  { id: "fenfluramine", label: "Fenfluramine" },
  { id: "lithium", label: "Lithium" },
  { id: "mycophenolate_mofetil", label: "Mycophenolate mofetil" },
  { id: "oral_methotrexate", label: "Oral methotrexate" },
  { id: "phenobarbital", label: "Phenobarbital" },
  { id: "phenytoin", label: "Phenytoin" },
  { id: "somatrogon", label: "Somatrogon" },
  { id: "tacrolimus", label: "Tacrolimus" },
  { id: "theophylline", label: "Theophylline" },
  { id: "warfarin", label: "Warfarin" },
  { id: "sitagliptin", label: "sitagliptin", section: "DPP-4 inhibitors" },
  { id: "vildagliptin", label: "vildagliptin" },
  { id: "linagliptin", label: "linagliptin" },
  { id: "gliclazide", label: "gliclazide", section: "Sulfonylureas" },
  { id: "glibenclamide", label: "glibenclamide" },
  { id: "tolbutamide", label: "tolbutamide" },
  { id: "insulin", label: "Insulin" },
  { id: "pioglitazone", label: "pioglitazone" },
] as const satisfies readonly WlHighRiskMedicationEntry[];

export type WlHighRiskMedicationId =
  (typeof WL_HIGH_RISK_MEDICATIONS)[number]["id"];

export type WlTransferHighRiskMedId = WlHighRiskMedicationId;

export const WL_TRANSFER_HIGH_RISK_MED_IDS: readonly WlHighRiskMedicationId[] =
  WL_HIGH_RISK_MEDICATIONS.map((m) => m.id);

const DEFAULT_REPEAT_SYMPTOMS_PROMPT =
  "Since your last supply, have you had any new or worsening symptoms you think may relate to this medicine?";

export const WL_HIGH_RISK_REPEAT_SYMPTOMS_PROMPTS: Partial<
  Record<WlHighRiskMedicationId, string>
> = {
  lithium:
    "Since your last supply, have you had increased thirst, tremor, confusion, diarrhoea or vomiting?",
  oral_methotrexate:
    "Since your last supply, have you had sore throat, unusual bruising, mouth ulcers or breathlessness?",
  warfarin:
    "Since your last supply, have you had unusual bleeding, bruising, or blood in urine or stool?",
  digoxin:
    "Since your last supply, have you had blurred vision, nausea, vomiting, diarrhoea or stomach pain?",
  amiodarone:
    "Since your last supply, have you had breathlessness, cough, thyroid symptoms or eyesight changes?",
  theophylline:
    "Since your last supply, have you had nausea, vomiting, palpitations or tremor?",
  phenytoin:
    "Since your last supply, have you had dizziness, unsteadiness, rash or double vision?",
  carbamazepine:
    "Since your last supply, have you had dizziness, unsteadiness, rash or double vision?",
  phenobarbital:
    "Since your last supply, have you had excessive drowsiness, confusion or unsteadiness?",
  ciclosporin:
    "Since your last supply, have you had fever, sore throat, unusual bruising or signs of infection?",
  tacrolimus:
    "Since your last supply, have you had fever, sore throat, unusual bruising or signs of infection?",
  mycophenolate_mofetil:
    "Since your last supply, have you had fever, sore throat, unusual bruising or signs of infection?",
  clozapine:
    "Since your last supply, have you had fever, sore throat, flu-like symptoms or severe tiredness?",
  sitagliptin:
    "Since your last supply, have you had symptoms of low blood sugar (shaking, sweating, confusion)?",
  vildagliptin:
    "Since your last supply, have you had symptoms of low blood sugar (shaking, sweating, confusion)?",
  linagliptin:
    "Since your last supply, have you had symptoms of low blood sugar (shaking, sweating, confusion)?",
  gliclazide:
    "Since your last supply, have you had symptoms of low blood sugar (shaking, sweating, confusion)?",
  glibenclamide:
    "Since your last supply, have you had symptoms of low blood sugar (shaking, sweating, confusion)?",
  tolbutamide:
    "Since your last supply, have you had symptoms of low blood sugar (shaking, sweating, confusion)?",
  insulin:
    "Since your last supply, have you had symptoms of low blood sugar (shaking, sweating, confusion)?",
  pioglitazone:
    "Since your last supply, have you had ankle swelling, breathlessness or unexplained weight gain?",
};

export function wlHighRiskRepeatSymptomsPrompt(id: string): string {
  return (
    WL_HIGH_RISK_REPEAT_SYMPTOMS_PROMPTS[id as WlHighRiskMedicationId] ??
    DEFAULT_REPEAT_SYMPTOMS_PROMPT
  );
}

export const WL_SIMPLE_REPEAT_HIGH_RISK_MEDS = WL_HIGH_RISK_MEDICATIONS.map(
  (m) => ({
    id: m.id,
    label: m.label,
    section: m.section,
    symptomsPrompt: wlHighRiskRepeatSymptomsPrompt(m.id),
  }),
);

/** Legacy IDs from older consultations — display only. */
export const LEGACY_WL_HIGH_RISK_MED_LABELS: Record<string, string> = {
  methotrexate: "Methotrexate",
  sirolimus: "Sirolimus",
  other: "Other medication",
};

export function wlHighRiskMedLabelById(): Record<string, string> {
  return Object.fromEntries(
    WL_HIGH_RISK_MEDICATIONS.map((m) => [m.id, m.label]),
  );
}

export function wlHighRiskMedLabelsIncludingLegacy(): Record<string, string> {
  return {
    ...wlHighRiskMedLabelById(),
    ...LEGACY_WL_HIGH_RISK_MED_LABELS,
  };
}

export function formatWlHighRiskCatalogueList(): string {
  return WL_HIGH_RISK_MEDICATIONS.map((m) => m.label).join(", ");
}

export function labelForWlHighRiskMed(
  medId: string | undefined,
  medicationName: string | undefined,
): string {
  const labels = wlHighRiskMedLabelsIncludingLegacy();
  if (medId && medId in labels) return labels[medId]!;
  return medicationName?.trim() || medId || "—";
}

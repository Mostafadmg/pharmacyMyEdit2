/** PMR-style health & lifestyle questions (MedExpress reference parity). */

import {
  PMR_MEDICAL_HISTORY_GATE_QUESTION,
  PMR_MEDICAL_HISTORY_INTRO,
  WL_MEDICAL_HISTORY_CONDITIONS,
  WL_HIGH_RISK_MEDICATIONS,
  wlType2DiabetesListedMedLabel,
  type WlType2DiabetesListedMedId,
} from "@workspace/evidence-slots";

export type PmrYesNo = "yes" | "no";

export const MEDICAL_HISTORY_CONDITIONS = WL_MEDICAL_HISTORY_CONDITIONS;
export { PMR_MEDICAL_HISTORY_GATE_QUESTION, PMR_MEDICAL_HISTORY_INTRO };

export type MedicalHistoryId = (typeof MEDICAL_HISTORY_CONDITIONS)[number]["id"];

export const HIGH_RISK_MEDICATIONS = WL_HIGH_RISK_MEDICATIONS;

export type HighRiskMedId = (typeof HIGH_RISK_MEDICATIONS)[number]["id"];

export const ALCOHOL_FREQUENCY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "monthly_or_less", label: "Monthly or less" },
  { value: "2_4_per_month", label: "2–4 times a month" },
  { value: "2_3_per_week", label: "2–3 times a week" },
  { value: "4_plus_per_week", label: "4 or more times a week" },
] as const;

export const ALCOHOL_UNITS_OPTIONS = [
  { value: "0_2", label: "0–2 units" },
  { value: "3_4", label: "3–4 units" },
  { value: "5_6", label: "5–6 units" },
  { value: "7_9", label: "7–9 units" },
  { value: "10_plus", label: "10 or more units" },
] as const;

export const ALCOHOL_BINGE_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "less_than_monthly", label: "Less than monthly" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily_or_almost", label: "Daily or almost daily" },
] as const;

export const EXERCISE_SESSIONS_OPTIONS = [
  { value: "0", label: "None" },
  { value: "1", label: "1 time" },
  { value: "2", label: "2 times" },
  { value: "3", label: "3 times" },
  { value: "4", label: "4 times" },
  { value: "5_plus", label: "5 or more times" },
] as const;

export const EXERCISE_INTENSITY_OPTIONS = [
  { value: "light", label: "Light (e.g. gentle walking)" },
  { value: "moderate", label: "Moderate (raised heart rate, can still talk)" },
  { value: "vigorous", label: "Vigorous (breathing hard, difficult to talk)" },
] as const;

export type HighRiskMedDetail = {
  takes: PmrYesNo | null;
  medicationName: string;
  condition: string;
  duration: string;
};

export type MedicalHistoryConditionDetail = {
  onMedication: PmrYesNo | null;
  medications: string[];
  /** Type 2 diabetes — sulfonylureas, DPP-4, SGLT2, TZDs. */
  takesListedMeds: PmrYesNo | null;
  listedMeds: WlType2DiabetesListedMedId[];
};

export type PmrHealthFormSlice = {
  /** Explicit gate answer — do not infer from per-condition rows alone. */
  medicalHistoryAny: PmrYesNo | null;
  /** When gate is "yes", only selected conditions are `"yes"`; others stay `null`. */
  medicalHistory: Record<MedicalHistoryId, PmrYesNo | null>;
  medicalHistoryDetails: Record<MedicalHistoryId, MedicalHistoryConditionDetail>;
  smokes: PmrYesNo | null;
  everSmoked: PmrYesNo | null;
  smokingCigsPerDay: string;
  smokingYearStarted: string;
  smokingYearStopped: string;
  highRiskMeds: Record<HighRiskMedId, HighRiskMedDetail>;
  /** Gate before AUDIT-C — when "no", AUDIT-C questions are skipped. */
  drinksAlcohol: PmrYesNo | null;
  alcoholFrequency: string | null;
  alcoholUnitsTypicalDay: string | null;
  alcoholBingeFrequency: string | null;
  exerciseSessionsPerWeek: string | null;
  exerciseIntensity: string | null;
};

export function medHistoryAnswerKey(id: MedicalHistoryId): string {
  return `med_history_${id}`;
}

export function takesMedKey(id: HighRiskMedId): string {
  return `takes_${id}`;
}

export function medDetailKey(id: HighRiskMedId, field: "name" | "condition" | "duration"): string {
  return `${id}_${field}`;
}

export function emptyHighRiskMedDetail(): HighRiskMedDetail {
  return {
    takes: null,
    medicationName: "",
    condition: "",
    duration: "",
  };
}

export function emptyMedicalHistoryDetail(): MedicalHistoryConditionDetail {
  return {
    onMedication: null,
    medications: [],
    takesListedMeds: null,
    listedMeds: [],
  };
}

export function emptyMedicalHistoryDetails(): Record<
  MedicalHistoryId,
  MedicalHistoryConditionDetail
> {
  return emptyMedicalHistoryDetailsFor(MEDICAL_HISTORY_CONDITIONS);
}

export function emptyMedicalHistoryDetailsFor(
  conditions: readonly { id: string }[],
): Record<string, MedicalHistoryConditionDetail> {
  return Object.fromEntries(
    conditions.map((c) => [c.id, emptyMedicalHistoryDetail()]),
  );
}

export function isMedicalHistoryConditionDetailComplete(
  id: string,
  detail: MedicalHistoryConditionDetail,
): boolean {
  if (id === "type2_diabetes") {
    if (detail.takesListedMeds === null) return false;
    if (detail.takesListedMeds === "yes" && detail.listedMeds.length === 0) {
      return false;
    }
    if (detail.onMedication === null) return false;
    if (detail.onMedication === "no") return true;
    return detail.medications.some((m) => m.trim().length > 0);
  }
  if (detail.onMedication === null) return false;
  if (detail.onMedication === "no") return true;
  return detail.medications.some((m) => m.trim().length > 0);
}

export function emptyPmrHealthFormSlice(): PmrHealthFormSlice {
  const medicalHistory = Object.fromEntries(
    MEDICAL_HISTORY_CONDITIONS.map((c) => [c.id, null]),
  ) as Record<MedicalHistoryId, PmrYesNo | null>;

  const highRiskMeds = Object.fromEntries(
    HIGH_RISK_MEDICATIONS.map((m) => [m.id, emptyHighRiskMedDetail()]),
  ) as Record<HighRiskMedId, HighRiskMedDetail>;

  return {
    medicalHistoryAny: null,
    medicalHistory,
    medicalHistoryDetails: emptyMedicalHistoryDetails(),
    smokes: null,
    everSmoked: null,
    smokingCigsPerDay: "",
    smokingYearStarted: "",
    smokingYearStopped: "",
    highRiskMeds,
    drinksAlcohol: null,
    alcoholFrequency: null,
    alcoholUnitsTypicalDay: null,
    alcoholBingeFrequency: null,
    exerciseSessionsPerWeek: null,
    exerciseIntensity: null,
  };
}

export function isHighRiskMedDetailComplete(d: HighRiskMedDetail): boolean {
  if (d.takes === null) return false;
  if (d.takes === "no") return true;
  return (
    d.medicationName.trim().length > 0 &&
    d.condition.trim().length > 0 &&
    d.duration.trim().length > 0
  );
}

export function isSmokingComplete(slice: PmrHealthFormSlice): boolean {
  if (slice.smokes === null) return false;
  if (slice.smokes === "yes") {
    return (
      slice.smokingCigsPerDay.trim().length > 0 &&
      slice.smokingYearStarted.trim().length > 0
    );
  }
  if (slice.everSmoked === null) return false;
  if (slice.everSmoked === "no") return true;
  return (
    slice.smokingCigsPerDay.trim().length > 0 &&
    slice.smokingYearStarted.trim().length > 0 &&
    slice.smokingYearStopped.trim().length > 0
  );
}

export function medicalHistoryGate(slice: PmrHealthFormSlice): PmrYesNo | null {
  if (slice.medicalHistoryAny != null) return slice.medicalHistoryAny;
  const values = MEDICAL_HISTORY_CONDITIONS.map((c) => slice.medicalHistory[c.id]);
  if (values.every((v) => v === "no")) return "no";
  if (values.some((v) => v === "yes")) return "yes";
  return null;
}

export function selectedMedicalHistoryConditions(
  slice: PmrHealthFormSlice,
): (typeof MEDICAL_HISTORY_CONDITIONS)[number][] {
  return MEDICAL_HISTORY_CONDITIONS.filter((c) => slice.medicalHistory[c.id] === "yes");
}

export function isMedicalHistoryComplete(slice: PmrHealthFormSlice): boolean {
  const gate = medicalHistoryGate(slice);
  if (gate === null) return false;
  if (gate === "no") return true;
  const selected = selectedMedicalHistoryConditions(slice);
  if (selected.length === 0) return false;
  return selected.every((c) =>
    isMedicalHistoryConditionDetailComplete(c.id, slice.medicalHistoryDetails[c.id]),
  );
}

export function isAlcoholComplete(slice: PmrHealthFormSlice): boolean {
  if (slice.drinksAlcohol === null) return false;
  if (slice.drinksAlcohol === "no") return true;
  return Boolean(
    slice.alcoholFrequency &&
      slice.alcoholUnitsTypicalDay &&
      slice.alcoholBingeFrequency,
  );
}

/** Lifestyle step — no longer collected in the consultation UI. */
export function isPmrLifestyleStepComplete(_slice: PmrHealthFormSlice): boolean {
  return true;
}

export function isPmrHealthStepComplete(slice: PmrHealthFormSlice): boolean {
  return isMedicalHistoryComplete(slice);
}

/** Flat consultation `answers` keys for pharmacist review. */
export function pmrHealthToAnswers(slice: PmrHealthFormSlice): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const gate = medicalHistoryGate(slice);

  out.medical_history_any = gate;

  if (gate === "no") {
    for (const c of MEDICAL_HISTORY_CONDITIONS) {
      out[medHistoryAnswerKey(c.id)] = "no";
    }
    out.medical_history_details = [];
  } else if (gate === "yes") {
    const selected = selectedMedicalHistoryConditions(slice);
    for (const c of MEDICAL_HISTORY_CONDITIONS) {
      out[medHistoryAnswerKey(c.id)] = slice.medicalHistory[c.id];
    }
    out.medical_history_details = selected.map((c) => {
      const detail = slice.medicalHistoryDetails[c.id];
      if (c.id === "type2_diabetes") {
        const listedMedicationNames = detail.listedMeds.map((id) =>
          wlType2DiabetesListedMedLabel(id),
        );
        const otherMedications = detail.medications
          .map((m) => m.trim())
          .filter((m) => m.length > 0);
        return {
          id: c.id,
          label: c.label,
          takes_listed_meds: detail.takesListedMeds,
          listed_meds: detail.listedMeds,
          listed_medication_names: listedMedicationNames,
          on_other_medication: detail.onMedication,
          other_medications: otherMedications,
          on_medication: detail.onMedication,
          medications: [...listedMedicationNames, ...otherMedications],
        };
      }
      return {
        id: c.id,
        label: c.label,
        on_medication: detail.onMedication,
        medications: detail.medications
          .map((m) => m.trim())
          .filter((m) => m.length > 0),
      };
    });
  } else {
    for (const c of MEDICAL_HISTORY_CONDITIONS) {
      out[medHistoryAnswerKey(c.id)] = slice.medicalHistory[c.id];
    }
  }

  out.smokes = null;
  out.ever_smoked = null;
  out.smoking_cigs_per_day = null;
  out.smoking_year_started = null;
  out.smoking_year_stopped = null;

  out.drinks_alcohol = null;
  out.alcohol_frequency = null;
  out.alcohol_units_typical_day = null;
  out.alcohol_binge_frequency = null;
  out.exercise_sessions_per_week = null;
  out.exercise_intensity = null;

  return out;
}

/** Keys rendered in bundled pharmacist view — omit from flat Q&A list. */
export const PMR_HEALTH_ANSWER_KEYS = new Set<string>([
  "medical_history_any",
  "medical_history_details",
  ...MEDICAL_HISTORY_CONDITIONS.map((c) => medHistoryAnswerKey(c.id)),
  "smokes",
  "ever_smoked",
  "smoking_cigs_per_day",
  "smoking_year_started",
  "smoking_year_stopped",
  ...HIGH_RISK_MEDICATIONS.flatMap((m) => [
    takesMedKey(m.id),
    medDetailKey(m.id, "name"),
    medDetailKey(m.id, "condition"),
    medDetailKey(m.id, "duration"),
  ]),
  "high_risk_medications_details",
  "drinks_alcohol",
  "alcohol_frequency",
  "alcohol_units_typical_day",
  "alcohol_binge_frequency",
  "exercise_sessions_per_week",
  "exercise_intensity",
  "is_carer",
  "has_carer",
]);

export function labelForOption(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

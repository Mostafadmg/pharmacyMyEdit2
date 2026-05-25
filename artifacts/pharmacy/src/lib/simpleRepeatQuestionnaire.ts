/** Simple repeat (repeat customer) questionnaire — screening, monitoring, declaration. */

export type RepeatYesNo = "yes" | "no";

export const SIMPLE_REPEAT_HIGH_RISK_MEDS = [
  {
    id: "lithium",
    label: "Lithium",
    symptomsPrompt:
      "Since your last supply, have you had increased thirst, tremor, confusion, diarrhoea or vomiting?",
  },
  {
    id: "methotrexate",
    label: "Methotrexate",
    symptomsPrompt:
      "Since your last supply, have you had sore throat, unusual bruising, mouth ulcers or breathlessness?",
  },
  {
    id: "warfarin",
    label: "Warfarin",
    symptomsPrompt:
      "Since your last supply, have you had unusual bleeding, bruising, or blood in urine or stool?",
  },
  {
    id: "digoxin",
    label: "Digoxin",
    symptomsPrompt:
      "Since your last supply, have you had blurred vision, nausea, vomiting, diarrhoea or stomach pain?",
  },
  {
    id: "amiodarone",
    label: "Amiodarone",
    symptomsPrompt:
      "Since your last supply, have you had breathlessness, cough, thyroid symptoms or eyesight changes?",
  },
  {
    id: "theophylline",
    label: "Theophylline",
    symptomsPrompt:
      "Since your last supply, have you had nausea, vomiting, palpitations or tremor?",
  },
  {
    id: "phenytoin",
    label: "Phenytoin",
    symptomsPrompt:
      "Since your last supply, have you had dizziness, unsteadiness, rash or double vision?",
  },
] as const;

export type SimpleRepeatHighRiskMedId =
  (typeof SIMPLE_REPEAT_HIGH_RISK_MEDS)[number]["id"];

export type SimpleRepeatHighRiskMedEntry = {
  takes: RepeatYesNo | null;
  lastBloodTestDate: string;
  lastBloodTestResult: string;
  symptoms: RepeatYesNo | null;
  symptomsDetails: string;
};

export type SimpleRepeatSmokingStatus = "never" | "ex_smoker" | "current";

export type SimpleRepeatFormState = {
  newMedicinesSinceLast: RepeatYesNo | null;
  newMedicinesSinceLastDetails: string;
  stoppedMedicinesSinceLast: RepeatYesNo | null;
  stoppedMedicinesSinceLastDetails: string;
  healthChangesSinceLast: RepeatYesNo | null;
  healthChangesSinceLastDetails: string;
  newSideEffectsSinceLast: RepeatYesNo | null;
  newSideEffectsSinceLastDetails: string;
  adherenceProblemsSinceLast: RepeatYesNo | null;
  adherenceProblemsSinceLastDetails: string;
  pharmacistQuestionsSinceLast: RepeatYesNo | null;
  pharmacistQuestionsSinceLastDetails: string;

  smokingStatus: SimpleRepeatSmokingStatus | null;
  smokingCigsPerDay: string;
  alcoholUnitsPerWeek: string;
  recentBloodPressure: string;
  recentWeightKg: string;

  highRiskMeds: Record<SimpleRepeatHighRiskMedId, SimpleRepeatHighRiskMedEntry>;

  asthmaInhalerUse: RepeatYesNo | null;
  asthmaSymptomsWorse: RepeatYesNo | null;
  diabetesFootCheckRecent: RepeatYesNo | null;
  diabetesEyeCheckRecent: RepeatYesNo | null;
  diabetesHbA1cKnown: RepeatYesNo | null;
  diabetesHbA1cValue: string;
  cardiovascularSymptoms: RepeatYesNo | null;
  cardiovascularSymptomsDetails: string;

  patientDeclaration: boolean;
};

export const SIMPLE_REPEAT_SCREENING_QUESTIONS = [
  {
    yesNoKey: "newMedicinesSinceLast" as const,
    detailsKey: "newMedicinesSinceLastDetails" as const,
    text: "Since your last supply, have you started any new medicines (including OTC or herbal remedies)?",
    answerKey: "new_medicines_since_last",
    detailsAnswerKey: "new_medicines_since_last_details",
  },
  {
    yesNoKey: "stoppedMedicinesSinceLast" as const,
    detailsKey: "stoppedMedicinesSinceLastDetails" as const,
    text: "Since your last supply, have you stopped any medicines?",
    answerKey: "stopped_medicines_since_last",
    detailsAnswerKey: "stopped_medicines_since_last_details",
  },
  {
    yesNoKey: "healthChangesSinceLast" as const,
    detailsKey: "healthChangesSinceLastDetails" as const,
    text: "Since your last supply, have there been any changes to your health or have you seen a doctor or hospital specialist?",
    answerKey: "health_changes_since_last",
    detailsAnswerKey: "health_changes_since_last_details",
  },
  {
    yesNoKey: "newSideEffectsSinceLast" as const,
    detailsKey: "newSideEffectsSinceLastDetails" as const,
    text: "Since your last supply, have you had any new side effects from your current medication?",
    answerKey: "new_side_effects_since_last",
    detailsAnswerKey: "new_side_effects_since_last_details",
  },
  {
    yesNoKey: "adherenceProblemsSinceLast" as const,
    detailsKey: "adherenceProblemsSinceLastDetails" as const,
    text: "Since your last supply, have you had any problems taking your medicine as prescribed?",
    answerKey: "adherence_problems_since_last",
    detailsAnswerKey: "adherence_problems_since_last_details",
  },
  {
    yesNoKey: "pharmacistQuestionsSinceLast" as const,
    detailsKey: "pharmacistQuestionsSinceLastDetails" as const,
    text: "Do you have any other questions or concerns you would like the pharmacist to know about?",
    answerKey: "pharmacist_questions_since_last",
    detailsAnswerKey: "pharmacist_questions_since_last_details",
  },
] as const;

export function emptyHighRiskMedEntry(): SimpleRepeatHighRiskMedEntry {
  return {
    takes: null,
    lastBloodTestDate: "",
    lastBloodTestResult: "",
    symptoms: null,
    symptomsDetails: "",
  };
}

export function emptySimpleRepeatFormState(): SimpleRepeatFormState {
  const highRiskMeds = Object.fromEntries(
    SIMPLE_REPEAT_HIGH_RISK_MEDS.map((m) => [m.id, emptyHighRiskMedEntry()]),
  ) as Record<SimpleRepeatHighRiskMedId, SimpleRepeatHighRiskMedEntry>;

  return {
    newMedicinesSinceLast: null,
    newMedicinesSinceLastDetails: "",
    stoppedMedicinesSinceLast: null,
    stoppedMedicinesSinceLastDetails: "",
    healthChangesSinceLast: null,
    healthChangesSinceLastDetails: "",
    newSideEffectsSinceLast: null,
    newSideEffectsSinceLastDetails: "",
    adherenceProblemsSinceLast: null,
    adherenceProblemsSinceLastDetails: "",
    pharmacistQuestionsSinceLast: null,
    pharmacistQuestionsSinceLastDetails: "",
    smokingStatus: null,
    smokingCigsPerDay: "",
    alcoholUnitsPerWeek: "",
    recentBloodPressure: "",
    recentWeightKg: "",
    highRiskMeds,
    asthmaInhalerUse: null,
    asthmaSymptomsWorse: null,
    diabetesFootCheckRecent: null,
    diabetesEyeCheckRecent: null,
    diabetesHbA1cKnown: null,
    diabetesHbA1cValue: "",
    cardiovascularSymptoms: null,
    cardiovascularSymptomsDetails: "",
    patientDeclaration: false,
  };
}

function detailsRequired(yesNo: RepeatYesNo | null, details: string): boolean {
  if (yesNo === null) return false;
  if (yesNo === "no") return true;
  return details.trim().length >= 2;
}

export function isSimpleRepeatScreeningComplete(state: SimpleRepeatFormState): boolean {
  for (const q of SIMPLE_REPEAT_SCREENING_QUESTIONS) {
    const yn = state[q.yesNoKey];
    if (yn === null) return false;
    if (!detailsRequired(yn, state[q.detailsKey])) return false;
  }
  return true;
}

export function repeatHighRiskGate(
  state: SimpleRepeatFormState,
): RepeatYesNo | null {
  const values = SIMPLE_REPEAT_HIGH_RISK_MEDS.map(
    (m) => state.highRiskMeds[m.id].takes,
  );
  if (values.every((v) => v === "no")) return "no";
  if (values.some((v) => v === "yes")) return "yes";
  return null;
}

export function isRepeatHighRiskSectionComplete(
  state: SimpleRepeatFormState,
): boolean {
  const gate = repeatHighRiskGate(state);
  if (gate === null) return false;
  if (gate === "no") return true;
  const selected = SIMPLE_REPEAT_HIGH_RISK_MEDS.filter(
    (m) => state.highRiskMeds[m.id].takes === "yes",
  );
  if (selected.length === 0) return false;
  return selected.every((m) =>
    isHighRiskMedEntryComplete(state.highRiskMeds[m.id]),
  );
}

export function isHighRiskMedEntryComplete(
  entry: SimpleRepeatHighRiskMedEntry,
): boolean {
  if (entry.takes === null) return false;
  if (entry.takes === "no") return true;
  if (!entry.lastBloodTestDate.trim()) return false;
  if (entry.symptoms === null) return false;
  if (entry.symptoms === "yes" && entry.symptomsDetails.trim().length < 2) {
    return false;
  }
  return true;
}

export function isSimpleRepeatMonitoringComplete(
  state: SimpleRepeatFormState,
): boolean {
  if (state.smokingStatus === null) return false;
  if (
    state.smokingStatus === "current" &&
    !state.smokingCigsPerDay.trim()
  ) {
    return false;
  }
  if (!state.alcoholUnitsPerWeek.trim()) return false;
  if (!isRepeatHighRiskSectionComplete(state)) return false;
  return true;
}

export function isSimpleRepeatDeclarationComplete(
  state: SimpleRepeatFormState,
): boolean {
  return state.patientDeclaration;
}

export function repeatTakesMedKey(id: SimpleRepeatHighRiskMedId): string {
  return `repeat_takes_${id}`;
}

export function simpleRepeatToAnswers(
  state: SimpleRepeatFormState,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    consultation_type: "simple_repeat",
  };

  for (const q of SIMPLE_REPEAT_SCREENING_QUESTIONS) {
    out[q.answerKey] = state[q.yesNoKey];
    const details = state[q.detailsKey].trim();
    if (state[q.yesNoKey] === "yes" && details) {
      out[q.detailsAnswerKey] = details;
    }
  }

  out.smoking_status = state.smokingStatus;
  if (state.smokingStatus === "current") {
    out.smoking_cigs_per_day = state.smokingCigsPerDay.trim() || null;
  }
  out.alcohol_units_per_week = state.alcoholUnitsPerWeek.trim() || null;
  const bp = state.recentBloodPressure.trim();
  if (bp) out.recent_blood_pressure = bp;
  const wt = state.recentWeightKg.trim();
  if (wt) out.recent_weight_kg = wt;

  const highRiskDetails: Array<Record<string, unknown>> = [];
  for (const m of SIMPLE_REPEAT_HIGH_RISK_MEDS) {
    const e = state.highRiskMeds[m.id];
    out[repeatTakesMedKey(m.id)] = e.takes;
    if (e.takes === "yes") {
      out[`repeat_${m.id}_last_blood_test_date`] =
        e.lastBloodTestDate.trim() || null;
      const result = e.lastBloodTestResult.trim();
      if (result) out[`repeat_${m.id}_last_blood_test_result`] = result;
      out[`repeat_${m.id}_symptoms`] = e.symptoms;
      if (e.symptoms === "yes" && e.symptomsDetails.trim()) {
        out[`repeat_${m.id}_symptoms_details`] = e.symptomsDetails.trim();
      }
      highRiskDetails.push({
        drug: m.id,
        label: m.label,
        takes: "yes",
        last_blood_test_date: e.lastBloodTestDate.trim() || null,
        last_blood_test_result: result || null,
        symptoms: e.symptoms,
        symptoms_details:
          e.symptoms === "yes" ? e.symptomsDetails.trim() || null : null,
      });
    } else if (e.takes === "no") {
      highRiskDetails.push({ drug: m.id, label: m.label, takes: "no" });
    }
  }
  out.repeat_high_risk_medications = highRiskDetails;

  if (state.asthmaInhalerUse !== null) {
    out.asthma_inhaler_use = state.asthmaInhalerUse;
    if (state.asthmaSymptomsWorse !== null) {
      out.asthma_symptoms_worse = state.asthmaSymptomsWorse;
    }
  }
  if (state.diabetesFootCheckRecent !== null) {
    out.diabetes_foot_check_recent = state.diabetesFootCheckRecent;
  }
  if (state.diabetesEyeCheckRecent !== null) {
    out.diabetes_eye_check_recent = state.diabetesEyeCheckRecent;
  }
  if (state.diabetesHbA1cKnown !== null) {
    out.diabetes_hba1c_known = state.diabetesHbA1cKnown;
    if (state.diabetesHbA1cKnown === "yes" && state.diabetesHbA1cValue.trim()) {
      out.diabetes_hba1c_value = state.diabetesHbA1cValue.trim();
    }
  }
  if (state.cardiovascularSymptoms !== null) {
    out.cardiovascular_symptoms = state.cardiovascularSymptoms;
    if (
      state.cardiovascularSymptoms === "yes" &&
      state.cardiovascularSymptomsDetails.trim()
    ) {
      out.cardiovascular_symptoms_details =
        state.cardiovascularSymptomsDetails.trim();
    }
  }

  out.patient_declaration_confirmed = state.patientDeclaration ? "yes" : "no";

  return out;
}

/** Keys owned by simple repeat — omit duplicate flat keys when array is present. */
export const SIMPLE_REPEAT_ANSWER_KEYS = new Set<string>([
  "consultation_type",
  ...SIMPLE_REPEAT_SCREENING_QUESTIONS.flatMap((q) => [
    q.answerKey,
    q.detailsAnswerKey,
  ]),
  "smoking_status",
  "smoking_cigs_per_day",
  "alcohol_units_per_week",
  "recent_blood_pressure",
  "recent_weight_kg",
  "repeat_high_risk_medications",
  "patient_declaration_confirmed",
  "asthma_inhaler_use",
  "asthma_symptoms_worse",
  "diabetes_foot_check_recent",
  "diabetes_eye_check_recent",
  "diabetes_hba1c_known",
  "diabetes_hba1c_value",
  "cardiovascular_symptoms",
  "cardiovascular_symptoms_details",
  ...SIMPLE_REPEAT_HIGH_RISK_MEDS.flatMap((m) => [
    repeatTakesMedKey(m.id),
    `repeat_${m.id}_last_blood_test_date`,
    `repeat_${m.id}_last_blood_test_result`,
    `repeat_${m.id}_symptoms`,
    `repeat_${m.id}_symptoms_details`,
  ]),
]);

export const SMOKING_STATUS_OPTIONS: {
  value: SimpleRepeatSmokingStatus;
  label: string;
}[] = [
  { value: "never", label: "Never smoked" },
  { value: "ex_smoker", label: "Ex-smoker" },
  { value: "current", label: "Current smoker" },
];

export function labelForSmokingStatus(
  value: string | null | undefined,
): string {
  return (
    SMOKING_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "—"
  );
}

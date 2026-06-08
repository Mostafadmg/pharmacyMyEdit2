import { parseRepeatSideEffectSymptomsFromAnswers } from "@workspace/evidence-slots";

export type ChangesSinceLastOrder =
  | "new_diagnosis"
  | "new_medication_allergy"
  | "no_changes";

const CHANGES_LABELS: Record<ChangesSinceLastOrder, string> = {
  new_diagnosis: "New diagnosis or change in health condition",
  new_medication_allergy:
    "Started new medication / changed medication / developed allergy",
  no_changes: "No changes since last order",
};

export function formatChangesSinceLast(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return CHANGES_LABELS[raw as ChangesSinceLastOrder] ?? raw.replace(/_/g, " ");
}

export function formatYesNo(raw: unknown): string | null {
  if (raw === "yes") return "Yes";
  if (raw === "no") return "No";
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  return null;
}

export type RepeatSafetySummary = {
  isRepeat: boolean;
  changesSinceLast: string | null;
  screening: {
    newMedicines: string | null;
    stoppedMedicines: string | null;
    healthChanges: string | null;
    newSideEffects: string | null;
    adherenceProblems: string | null;
    pharmacistQuestions: string | null;
  };
  sideEffects: {
    any: string | null;
    hospitalisation: string | null;
    vomitingDiarrhoea: string | null;
    injectionSite: string | null;
    symptomsReported: string[];
    details: string | null;
  };
  monitoring: {
    smokingStatus: string | null;
    alcoholUnitsPerWeek: string | null;
    highRiskMedsYes: string[];
  };
};

const SMOKING_LABELS: Record<string, string> = {
  never: "Never smoked",
  ex_smoker: "Ex-smoker",
  current: "Current smoker",
};

export function repeatSafetyFromAnswers(
  answers: Record<string, unknown>,
  previousConsultationId?: string | null,
): RepeatSafetySummary {
  const journey = answers.journey_stage;
  const isRepeat =
    Boolean(previousConsultationId) ||
    journey === "existing" ||
    answers.consultation_type === "simple_repeat";

  const highRiskMedsYes: string[] = [];
  const bundled = answers.repeat_high_risk_medications;
  if (Array.isArray(bundled)) {
    for (const row of bundled) {
      if (
        row &&
        typeof row === "object" &&
        (row as { takes?: string }).takes === "yes" &&
        typeof (row as { label?: string }).label === "string"
      ) {
        highRiskMedsYes.push((row as { label: string }).label);
      }
    }
  }

  const parsedSymptoms = parseRepeatSideEffectSymptomsFromAnswers(answers);

  return {
    isRepeat,
    changesSinceLast: formatChangesSinceLast(answers.changes_since_last_order),
    screening: {
      newMedicines: formatYesNo(answers.new_medicines_since_last),
      stoppedMedicines: formatYesNo(answers.stopped_medicines_since_last),
      healthChanges: formatYesNo(answers.health_changes_since_last),
      newSideEffects: formatYesNo(
        answers.new_side_effects_since_last ?? answers.side_effects_since_last,
      ),
      adherenceProblems: formatYesNo(answers.adherence_problems_since_last),
      pharmacistQuestions: formatYesNo(answers.pharmacist_questions_since_last),
    },
    sideEffects: {
      any: formatYesNo(
        answers.side_effects_since_last ?? answers.side_effects_any,
      ),
      hospitalisation: formatYesNo(answers.side_effects_hospitalisation),
      vomitingDiarrhoea: formatYesNo(answers.side_effects_vomiting_diarrhoea),
      injectionSite: formatYesNo(answers.side_effects_injection_site),
      symptomsReported: parsedSymptoms.symptomsReported,
      details: parsedSymptoms.details,
    },
    monitoring: {
      smokingStatus:
        typeof answers.smoking_status === "string"
          ? (SMOKING_LABELS[answers.smoking_status] ?? answers.smoking_status)
          : null,
      alcoholUnitsPerWeek:
        typeof answers.alcohol_units_per_week === "string" &&
        answers.alcohol_units_per_week.trim()
          ? `${answers.alcohol_units_per_week} units/week`
          : null,
      highRiskMedsYes,
    },
  };
}

export function hasRepeatSafetyResponses(summary: RepeatSafetySummary): boolean {
  if (!summary.isRepeat) return false;
  const s = summary.screening;
  return (
    summary.changesSinceLast != null ||
    s.newMedicines != null ||
    s.stoppedMedicines != null ||
    s.healthChanges != null ||
    s.newSideEffects != null ||
    s.adherenceProblems != null ||
    s.pharmacistQuestions != null ||
    summary.sideEffects.any != null ||
    summary.sideEffects.symptomsReported.length > 0 ||
    summary.sideEffects.details != null ||
    summary.sideEffects.hospitalisation != null ||
    summary.monitoring.smokingStatus != null ||
    summary.monitoring.alcoholUnitsPerWeek != null ||
    summary.monitoring.highRiskMedsYes.length > 0
  );
}

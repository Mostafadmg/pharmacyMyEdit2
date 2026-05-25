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
  sideEffects: {
    any: string | null;
    hospitalisation: string | null;
    vomitingDiarrhoea: string | null;
    injectionSite: string | null;
  };
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

  return {
    isRepeat,
    changesSinceLast: formatChangesSinceLast(answers.changes_since_last_order),
    sideEffects: {
      any: formatYesNo(
        answers.side_effects_since_last ?? answers.side_effects_any,
      ),
      hospitalisation: formatYesNo(answers.side_effects_hospitalisation),
      vomitingDiarrhoea: formatYesNo(answers.side_effects_vomiting_diarrhoea),
      injectionSite: formatYesNo(answers.side_effects_injection_site),
    },
  };
}

export function hasRepeatSafetyResponses(summary: RepeatSafetySummary): boolean {
  if (!summary.isRepeat) return false;
  return (
    summary.changesSinceLast != null ||
    summary.sideEffects.any != null ||
    summary.sideEffects.hospitalisation != null
  );
}

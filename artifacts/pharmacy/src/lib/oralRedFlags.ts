import {
  ORAL_EXCLUDED_MED_LABELS,
  type OralExcludedMedsSlice,
} from "@/lib/oralExcludedMedications";
import { ORAL_ORLISTAT_ALLERGY_QUESTION } from "@/lib/oralHealthQuestionnaire";
import {
  wlOralExcludingConditionLabel,
  type OralExcludingConditionsSlice,
} from "@/lib/oralExcludingConditions";

export type OralRedFlag = {
  id: string;
  source: string;
  label: string;
};

export type OralYesNo = "yes" | "no";

export const ORAL_RED_FLAG_INLINE_HEADING =
  "This treatment may not be suitable for you";

export const ORAL_RED_FLAG_INLINE_BODY =
  "Based on this answer, oral weight-loss treatment is unlikely to be suitable. You can continue the consultation for now — we will review everything at the end.";

export const ORAL_DEFERRED_REJECTION_HEADING =
  "We are unable to offer treatment online";

export const ORAL_DEFERRED_REJECTION_BODY =
  "Based on your answers, oral weight-loss treatment is not suitable for you at this time. A prescriber would not be able to approve this consultation.";

export function oralYourHealthRedFlags(input: {
  assignedSex: "male" | "female" | "prefer-not-to-say" | null;
  pregnant: OralYesNo | null;
  orlistatAllergy: OralYesNo | null;
  asksFemaleHealthQuestions: (
    sex: "male" | "female" | "prefer-not-to-say" | null,
  ) => boolean;
}): OralRedFlag[] {
  const flags: OralRedFlag[] = [];

  if (
    input.asksFemaleHealthQuestions(input.assignedSex) &&
    input.pregnant === "yes"
  ) {
    flags.push({
      id: "your_health:pregnant",
      source: "your_health",
      label:
        "Pregnant, breastfeeding, or planning pregnancy or breastfeeding while using this medication",
    });
  }

  if (input.orlistatAllergy === "yes") {
    flags.push({
      id: "your_health:orlistat_allergy",
      source: "your_health",
      label: ORAL_ORLISTAT_ALLERGY_QUESTION,
    });
  }

  return flags;
}

export function oralExcludedMedRedFlags(
  slice: OralExcludedMedsSlice,
): OralRedFlag[] {
  if (slice.excludedMedsTaken !== "yes") return [];
  return slice.excludedMedsSelected.map((medId) => ({
    id: `excluded_med:${medId}`,
    source: "excluded_medications",
    label: ORAL_EXCLUDED_MED_LABELS[medId] ?? medId,
  }));
}

export function oralExcludingConditionsRedFlags(
  slice: OralExcludingConditionsSlice,
): OralRedFlag[] {
  if (slice.excludingConditions !== "yes") return [];
  return slice.diagnosedConditions
    .filter((entry) => entry.catalogueId)
    .map((entry) => {
      const catalogueId = entry.catalogueId!;
      return {
        id: `excluding_condition:${catalogueId}`,
        source: "excluding_conditions",
        label:
          wlOralExcludingConditionLabel(catalogueId) ??
          (entry.condition.trim() || catalogueId),
      };
    });
}

export function collectOralDeferredRedFlags(input: {
  assignedSex: "male" | "female" | "prefer-not-to-say" | null;
  pregnant: OralYesNo | null;
  orlistatAllergy: OralYesNo | null;
  asksFemaleHealthQuestions: (
    sex: "male" | "female" | "prefer-not-to-say" | null,
  ) => boolean;
  excludedMeds: OralExcludedMedsSlice;
  oralExcludingConditions: OralExcludingConditionsSlice;
}): OralRedFlag[] {
  return [
    ...oralYourHealthRedFlags(input),
    ...oralExcludedMedRedFlags(input.excludedMeds),
    ...oralExcludingConditionsRedFlags(input.oralExcludingConditions),
  ];
}

export function oralDeferredRedFlagsToAnswers(
  flags: OralRedFlag[],
): Record<string, unknown> {
  return {
    oral_deferred_red_flags: flags.length > 0,
    oral_deferred_red_flag_details: flags.map((f) => ({
      id: f.id,
      source: f.source,
      label: f.label,
    })),
  };
}

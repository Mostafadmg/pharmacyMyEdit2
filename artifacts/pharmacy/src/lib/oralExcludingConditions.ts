import {
  WL_ORAL_EXCLUDING_CONDITIONS,
  WL_ORAL_EXCLUDING_CONDITIONS_GATE_QUESTION,
  wlOralExcludingConditionLabel,
  wlCholecystectomyTimingLabel,
  type WlOralExcludingConditionId,
} from "@workspace/evidence-slots";
import type { YesNo } from "@/components/consultation/YesNoChoice";
import type { DiagnosedConditionEntry } from "@/components/consultation/WeightLossClinicalForms";
import { isDiagnosedEntryComplete } from "@/components/consultation/WeightLossClinicalForms";

export {
  WL_ORAL_EXCLUDING_CONDITIONS,
  WL_ORAL_EXCLUDING_CONDITIONS_GATE_QUESTION,
  type WlOralExcludingConditionId,
};

export type OralExcludingConditionsSlice = {
  excludingConditions: YesNo | null;
  diagnosedConditions: DiagnosedConditionEntry[];
};

export function emptyOralExcludingConditionsSlice(): OralExcludingConditionsSlice {
  return {
    excludingConditions: null,
    diagnosedConditions: [],
  };
}

export function isOralExcludingConditionsStepComplete(
  slice: OralExcludingConditionsSlice,
): boolean {
  if (slice.excludingConditions === null) return false;
  if (slice.excludingConditions === "no") return true;
  if (slice.diagnosedConditions.length === 0) return false;
  return slice.diagnosedConditions.every(isDiagnosedEntryComplete);
}

export function oralExcludingConditionsToAnswers(
  slice: OralExcludingConditionsSlice,
): Record<string, unknown> {
  const gate = slice.excludingConditions;
  const ids =
    gate === "yes"
      ? slice.diagnosedConditions.map((e) => e.catalogueId).filter(Boolean)
      : [];

  const conditionAnswer = (catalogueId: string): YesNo | null => {
    if (gate === null) return null;
    if (gate === "no") return "no";
    return ids.includes(catalogueId) ? "yes" : "no";
  };

  return {
    excluding_conditions: gate,
    diagnosed_conditions_details:
      gate === "yes"
        ? slice.diagnosedConditions.map((e) => ({
            catalogue_id: e.catalogueId ?? null,
            condition: e.condition.trim(),
            ...(e.catalogueId === "gallstones_gallbladder" ||
            e.catalogueId === "cholecystectomy"
              ? {
                  had_cholecystectomy: e.hadCholecystectomy ?? null,
                  ...(e.hadCholecystectomy === "yes"
                    ? {
                        cholecystectomy_timing: e.howLongHad,
                        cholecystectomy_timing_label:
                          wlCholecystectomyTimingLabel(e.howLongHad) ??
                          e.howLongHad,
                        ...(e.procedureDate?.trim()
                          ? { procedure_date: e.procedureDate.trim() }
                          : {}),
                      }
                    : {}),
                }
              : {}),
          }))
        : [],
    oral_excluding_condition_ids: ids,
    weight_gain_hormonal_or_medical: conditionAnswer(
      "weight_gain_hormonal_or_medical",
    ),
    gallstones_gallbladder: conditionAnswer("gallstones_gallbladder"),
    cholecystectomy: conditionAnswer("cholecystectomy"),
  };
}

export { wlOralExcludingConditionLabel };

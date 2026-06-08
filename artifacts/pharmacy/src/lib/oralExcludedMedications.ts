import {
  WL_ORAL_EXCLUDED_MEDICATIONS,
  WL_ORAL_EXCLUDED_MEDS_GATE_QUESTION,
  WL_ORAL_EXCLUDED_MEDS_STOPPED_PAST_THREE_MONTHS_QUESTION,
  wlOralExcludedMedLabelById,
  type WlOralExcludedMedId,
} from "@workspace/evidence-slots";
import type { YesNo } from "@/components/consultation/YesNoChoice";

export {
  WL_ORAL_EXCLUDED_MEDICATIONS,
  WL_ORAL_EXCLUDED_MEDS_GATE_QUESTION,
  WL_ORAL_EXCLUDED_MEDS_STOPPED_PAST_THREE_MONTHS_QUESTION,
  type WlOralExcludedMedId,
};

export const ORAL_EXCLUDED_MED_LABELS =
  wlOralExcludedMedLabelById() as Record<WlOralExcludedMedId, string>;

export type OralExcludedMedsSlice = {
  excludedMedsTaken: YesNo | null;
  excludedMedsSelected: WlOralExcludedMedId[];
  excludedMedsStoppedPastThreeMonths: YesNo | null;
  otherMedsNotListed: YesNo | null;
  otherMedsNotListedDetails: string;
};

export const ORAL_OTHER_MEDS_NOT_LISTED_QUESTION =
  "Are you currently taking any other prescription medication, over-the-counter medicine, supplement, or herbal remedy not listed above?";

export function emptyOralExcludedMedsSlice(): OralExcludedMedsSlice {
  return {
    excludedMedsTaken: null,
    excludedMedsSelected: [],
    excludedMedsStoppedPastThreeMonths: null,
    otherMedsNotListed: null,
    otherMedsNotListedDetails: "",
  };
}

export function isOralExcludedMedSelectionComplete(
  selected: WlOralExcludedMedId[],
): boolean {
  return selected.length > 0;
}

export function isOralOtherMedsNotListedComplete(
  otherMedsNotListed: YesNo | null,
  otherMedsNotListedDetails: string,
): boolean {
  if (otherMedsNotListed === null) return false;
  if (otherMedsNotListed === "no") return true;
  return otherMedsNotListedDetails.trim().length > 0;
}

export function isOralExcludedMedsStepComplete(
  slice: OralExcludedMedsSlice,
): boolean {
  if (slice.excludedMedsTaken === null) return false;
  if (slice.excludedMedsTaken === "yes") {
    if (!isOralExcludedMedSelectionComplete(slice.excludedMedsSelected)) {
      return false;
    }
  } else if (slice.excludedMedsStoppedPastThreeMonths === null) {
    return false;
  }
  return isOralOtherMedsNotListedComplete(
    slice.otherMedsNotListed,
    slice.otherMedsNotListedDetails,
  );
}

export function oralExcludedMedsToAnswers(
  slice: OralExcludedMedsSlice,
): Record<string, unknown> {
  const labels = ORAL_EXCLUDED_MED_LABELS;
  return {
    oral_excluded_medications_taken: slice.excludedMedsTaken,
    oral_excluded_medications_stopped_past_three_months:
      slice.excludedMedsTaken === "no"
        ? slice.excludedMedsStoppedPastThreeMonths
        : null,
    oral_excluded_medications_details:
      slice.excludedMedsTaken === "yes"
        ? slice.excludedMedsSelected.map((medId) => ({
            med_id: medId,
            medication: labels[medId] ?? medId,
          }))
        : [],
    oral_other_meds_not_listed: slice.otherMedsNotListed,
    oral_other_meds_not_listed_details:
      slice.otherMedsNotListed === "yes"
        ? slice.otherMedsNotListedDetails.trim()
        : null,
  };
}

import {
  oralNewPatientBmiIneligibleReason,
  oralNewPatientMeetsBmiEligibility,
} from "@workspace/evidence-slots";
import {
  ORAL_EXCLUDED_MED_LABELS,
  type OralExcludedMedsSlice,
} from "@/lib/oralExcludedMedications";
import {
  ORAL_ORLISTAT_ALLERGY_QUESTION,
  selectedOralMedicalHistoryConditions,
  type OralHealthFormSlice,
} from "@/lib/oralHealthQuestionnaire";
import {
  wlOralExcludingConditionLabel,
  type OralExcludingConditionsSlice,
} from "@/lib/oralExcludingConditions";
import type { JourneyStage } from "@/lib/wlConsultationRouting";

export type OralRedFlag = {
  id: string;
  source: string;
  label: string;
};

export type OralYesNo = "yes" | "no";

export const ORAL_DEFERRED_REJECTION_HEADING =
  "Thank you for completing your consultation";

export const ORAL_DEFERRED_REJECTION_BODY =
  "Our clinical team will review your answers and let you know whether oral weight-loss treatment is suitable for you. You do not need to do anything else for now.";

export function oralBmiRedFlags(input: {
  journeyStage: JourneyStage | null;
  bmi: number | null;
  oralHealth: OralHealthFormSlice;
}): OralRedFlag[] {
  const hasStep7Comorbidity =
    selectedOralMedicalHistoryConditions(input.oralHealth).length > 0;
  const bmiInput = {
    journeyStage: input.journeyStage,
    bmi: input.bmi,
    hasStep7Comorbidity,
  };

  if (oralNewPatientMeetsBmiEligibility(bmiInput)) return [];

  const reason = oralNewPatientBmiIneligibleReason(bmiInput);
  if (!reason) return [];

  return [
    {
      id: "bmi:new_patient_threshold",
      source: "bmi",
      label: reason,
    },
  ];
}

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

function isOralGallbladderDeferredRejection(
  entry: OralExcludingConditionsSlice["diagnosedConditions"][number],
): boolean {
  const id = entry.catalogueId;
  if (id !== "gallstones_gallbladder" && id !== "cholecystectomy") {
    return false;
  }
  return entry.hadCholecystectomy === "no";
}

export function oralExcludingConditionsRedFlags(
  slice: OralExcludingConditionsSlice,
): OralRedFlag[] {
  if (slice.excludingConditions !== "yes") return [];
  return slice.diagnosedConditions
    .filter((entry) => {
      if (!entry.catalogueId) return false;
      if (
        entry.catalogueId === "gallstones_gallbladder" ||
        entry.catalogueId === "cholecystectomy"
      ) {
        return isOralGallbladderDeferredRejection(entry);
      }
      return true;
    })
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
  journeyStage: JourneyStage | null;
  bmi: number | null;
  oralHealth: OralHealthFormSlice;
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
    ...oralBmiRedFlags(input),
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

/**
 * Injectable weight-loss consultation routing.
 *
 * Step order (all journeys): eligibility → contact → journey → ethnicity → BMI →
 * PMR medical history (step 6) → high-risk medications (7) → GLP-1 safety (8) →
 * comorbidity / allergies (9) → journey-specific medication/continuation (10) →
 * agreement → GP → uploads → plan → submit.
 * `journey_stage` (patient-facing step 3): new | existing | transferring
 * `consultation_type` (stored on answers): new_start | transfer | simple_repeat
 */

import type { TransferWeightLossMedicationValue } from "@/components/consultation/WeightLossClinicalForms";
import {
  TRANSFER_WL_PEN_OPTIONS,
  emptyTransferWeightLossMedication,
  isTransferWlMedicationCoreComplete,
} from "@/components/consultation/WeightLossClinicalForms";
import {
  isRepeatSideEffectSymptomsComplete,
  type RepeatSideEffectSymptomsMap,
} from "@workspace/evidence-slots";

export type JourneyStage = "new" | "existing" | "transferring";

/** Stored as answers.consultation_type — pharmacist queue / clinical review. */
export type ConsultationKind = "new_start" | "transfer" | "simple_repeat";

export type YesNo = "yes" | "no";

export type PlanType = "single" | "two-pen" | "three-pen";
export type MedicineId = "mounjaro" | "wegovy";

export type SelectedPlan = {
  type: PlanType;
  medicine: MedicineId;
  penIds: string[];
};

/** Inputs used to derive effective journey / consultation kind. */
export type JourneyRoutingInput = {
  journey: JourneyStage | null;
  newToInjectables: YesNo | null;
  changingProvider: YesNo | null;
};

export function resolveEffectiveJourney(input: JourneyRoutingInput): JourneyStage {
  if (input.journey === "transferring") return "transferring";
  if (input.journey === "existing") return "existing";
  if (input.journey === "new" && input.newToInjectables === "no") {
    return "transferring";
  }
  return input.journey ?? "new";
}

export function resolveConsultationKind(
  effectiveJourney: JourneyStage,
): ConsultationKind {
  if (effectiveJourney === "transferring") return "transfer";
  if (effectiveJourney === "existing") return "simple_repeat";
  return "new_start";
}

/**
 * Which questionnaire blocks each consultation kind receives (after shared basics).
 *
 * | Block                    | new_start | transfer | simple_repeat |
 * |--------------------------|-----------|----------|---------------|
 * | PMR + high-risk + lifestyle (6) | ✓   | ✓        | ✓             |
 * | GLP-1 safety (7)         | ✓         | ✓        | ✓             |
 * | Comorbidity + allergies (8) | ✓    | ✓        | ✓             |
 * | Continuation safety (9)  | —         | ✓        | ✓             |
 * | Previous-provider WL med (9) | —     | ✓        | — (from record) |
 * | New-patient medication (9) | ✓       | —        | —             |
 * | Treatment plan picker (13)| ✓        | ✓        | — (prior plan) |
 */
export const WL_CONSULTATION_ROUTING_TABLE = {
  basics_all_journeys: [
    "ethnicity",
    "bmi",
    "pmr_medical_history",
    "high_risk_medications",
    "glp1_safety",
    "excluding_conditions_comorbidity",
    "allergies_otc",
  ],
  continuation_safety: [
    "side_effects",
    "hospitalisation",
    "changes_since_last_review",
  ],
  transfer_only: ["previous_provider_wl_medication_picker"],
  new_start_only: [
    "new_to_injectables",
  ],
  simple_repeat_only: ["repeat_side_effects_follow_up"],
} as const;

export function showsContinuationBlock(kind: ConsultationKind): boolean {
  return kind === "transfer" || kind === "simple_repeat";
}

export function showsTransferMedicationPicker(kind: ConsultationKind): boolean {
  return kind === "transfer";
}

export function showsNewPatientMedicationBlock(kind: ConsultationKind): boolean {
  return kind === "new_start";
}

/** Repeat orders continue the prior plan — do not re-pick pens on step 13. */
export function skipsTreatmentPlanPicker(kind: ConsultationKind): boolean {
  return kind === "simple_repeat";
}

export function isContinuationHospitalisationComplete(
  hospitalised: YesNo | null,
  details: string,
): boolean {
  return (
    hospitalised !== null &&
    (hospitalised === "no" || details.trim().length > 0)
  );
}

export function isContinuationSideEffectsComplete(
  sideEffects: YesNo | null,
  symptoms: RepeatSideEffectSymptomsMap,
): boolean {
  if (sideEffects === null) return false;
  if (sideEffects === "no") return true;
  return isRepeatSideEffectSymptomsComplete(symptoms);
}

export function isContinuationChangesComplete(
  changes: YesNo | null,
  details: string,
): boolean {
  return (
    changes !== null && (changes === "no" || details.trim().length > 0)
  );
}

export function isWlContinuationSafetyComplete(args: {
  sideEffects: YesNo | null;
  sideEffectSymptoms: RepeatSideEffectSymptomsMap;
  hospitalised: YesNo | null;
  hospitalisationDetails: string;
  changesSinceReview: YesNo | null;
  changesSinceReviewDetails: string;
  requireSideEffects?: boolean;
  requireChanges?: boolean;
}): boolean {
  const hospitalOk = isContinuationHospitalisationComplete(
    args.hospitalised,
    args.hospitalisationDetails,
  );
  const changesOk = args.requireChanges === false
    ? true
    : isContinuationChangesComplete(
        args.changesSinceReview,
        args.changesSinceReviewDetails,
      );
  const sideOk =
    args.requireSideEffects === false
      ? true
      : isContinuationSideEffectsComplete(
          args.sideEffects,
          args.sideEffectSymptoms,
        );
  return hospitalOk && changesOk && sideOk;
}

export function parsePriorSelectedPlan(
  answers: Record<string, unknown>,
): SelectedPlan | null {
  const raw = answers.selected_plan;
  if (!raw || typeof raw !== "object") return null;
  const plan = raw as Record<string, unknown>;
  const type = plan.type;
  const medicine = plan.medicine;
  const penIds = plan.penIds;
  if (
    (type !== "single" && type !== "two-pen" && type !== "three-pen") ||
    (medicine !== "mounjaro" && medicine !== "wegovy") ||
    !Array.isArray(penIds)
  ) {
    return null;
  }
  const ids = penIds.filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return null;
  return { type, medicine, penIds: ids };
}

/** Rebuild WL medication from a prior consultation (repeat — no re-pick). */
export function parsePriorWlMedication(
  answers: Record<string, unknown>,
): TransferWeightLossMedicationValue {
  const product =
    answers.transfer_wl_product === "mounjaro" ||
    answers.transfer_wl_product === "wegovy"
      ? answers.transfer_wl_product
      : null;

  let strengthPenId =
    typeof answers.transfer_wl_strength_pen_id === "string"
      ? answers.transfer_wl_strength_pen_id
      : "";

  if (!strengthPenId && product && typeof answers.transfer_wl_strength === "string") {
    const dose = answers.transfer_wl_strength.trim();
    const match = TRANSFER_WL_PEN_OPTIONS.find(
      (p) => p.medicine === product && p.dose === dose,
    );
    if (match) strengthPenId = match.id;
  }

  if (!strengthPenId && product) {
    const plan = parsePriorSelectedPlan(answers);
    const firstPenId = plan?.penIds[0];
    if (
      firstPenId &&
      TRANSFER_WL_PEN_OPTIONS.some((p) => p.id === firstPenId)
    ) {
      strengthPenId = firstPenId;
    }
  }

  const lastInjectionDate =
    typeof answers.transfer_wl_last_injection === "string"
      ? answers.transfer_wl_last_injection
      : typeof answers.last_injection_date === "string"
        ? answers.last_injection_date
        : "";

  const firstTreatmentWeightUnit =
    answers.transfer_wl_first_treatment_weight_unit === "stlbs"
      ? "stlbs"
      : "kg";
  const firstTreatmentWeightKg =
    typeof answers.transfer_wl_first_treatment_weight_kg_input === "string"
      ? answers.transfer_wl_first_treatment_weight_kg_input
      : "";
  const firstTreatmentWeightSt =
    typeof answers.transfer_wl_first_treatment_weight_st === "string"
      ? answers.transfer_wl_first_treatment_weight_st
      : "";
  const firstTreatmentWeightLbs =
    typeof answers.transfer_wl_first_treatment_weight_lbs === "string"
      ? answers.transfer_wl_first_treatment_weight_lbs
      : "";
  const firstTreatmentStartDate =
    typeof answers.transfer_wl_first_treatment_start_date === "string"
      ? answers.transfer_wl_first_treatment_start_date
      : "";

  const resolved: TransferWeightLossMedicationValue = {
    product,
    strengthPenId,
    lastInjectionDate,
    firstTreatmentWeightUnit,
    firstTreatmentWeightKg,
    firstTreatmentWeightSt,
    firstTreatmentWeightLbs,
    firstTreatmentStartDate,
  };

  return isTransferWlMedicationCoreComplete(resolved)
    ? resolved
    : emptyTransferWeightLossMedication();
}

export function wlMedicationLabel(
  v: TransferWeightLossMedicationValue,
): string | null {
  if (!isTransferWlMedicationCoreComplete(v)) return null;
  const pen = TRANSFER_WL_PEN_OPTIONS.find((p) => p.id === v.strengthPenId);
  if (!pen || !v.product) return null;
  const brand = v.product === "mounjaro" ? "Mounjaro" : "Wegovy";
  return `${brand} ${pen.dose}`;
}

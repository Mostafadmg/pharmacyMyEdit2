import type { Consultation } from "@workspace/api-client-react";

const WEIGHT_LOSS_CONDITION_IDS = new Set([
  "weight-loss",
  "injectable-weight-loss",
  "weight_loss",
]);

const WEIGHT_LOSS_PATTERN =
  /weight\s*loss|injectable|mounjaro|wegovy|ozempic|saxenda|glp-?1|semaglutide|tirzepatide/i;

/** True for Wegovy, Mounjaro, and other injectable weight-loss orders. */
export function isInjectableWeightLossOrder(c: Consultation): boolean {
  const conditionId = (c.conditionId ?? "").toLowerCase();
  const conditionName = (c.conditionName ?? "").toLowerCase();

  if (WEIGHT_LOSS_CONDITION_IDS.has(conditionId)) return true;
  if (WEIGHT_LOSS_PATTERN.test(conditionId)) return true;
  if (WEIGHT_LOSS_PATTERN.test(conditionName)) return true;

  const items = (c.prescriptionItems ?? []) as Array<{
    name?: string;
    form?: string;
  }>;
  if (
    items.some((item) =>
      WEIGHT_LOSS_PATTERN.test(`${item.name ?? ""} ${item.form ?? ""}`),
    )
  ) {
    return true;
  }

  const answers = (c.answers ?? {}) as Record<string, unknown>;
  if (
    answers.new_to_injectables != null ||
    answers.changing_from_provider != null ||
    answers.last_injection_timing != null
  ) {
    return true;
  }

  const plan = answers.selected_plan;
  if (typeof plan === "string" && WEIGHT_LOSS_PATTERN.test(plan)) return true;

  return false;
}

/** Answer keys omitted from generic clinical review highlights. */
export const GENERIC_CLINICAL_SKIP_KEYS = new Set([
  "full_name",
  "dob",
  "dob_day",
  "dob_month",
  "dob_year",
  "phone",
  "email",
  "delivery_address",
  "assigned_sex",
  "ethnicity",
  "height_cm",
  "height_ft",
  "height_in",
  "weight_kg",
  "weight_st",
  "weight_lbs",
  "highest_adult_weight",
  "target_weight",
  "bmi",
  "new_to_injectables",
  "changing_from_provider",
  "last_injection_timing",
  "last_injection_date",
  "current_dose",
  "selected_plan",
  "requested_medication",
  "diagnosed_conditions_details",
  "current_medications_details",
  "other_health_conditions_details",
]);

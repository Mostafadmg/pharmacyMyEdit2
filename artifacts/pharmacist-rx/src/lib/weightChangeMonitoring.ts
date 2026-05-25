import type { Consultation } from "@workspace/api-client-react";
import {
  evaluateAllAutoComplexAlerts,
  primaryAutoComplexAlert,
  WEIGHT_CHANGE_KG_THRESHOLD,
  WEIGHT_CHANGE_PCT_THRESHOLD,
  type AutoComplexAlert,
} from "@/lib/autoComplexPatient";

export { WEIGHT_CHANGE_KG_THRESHOLD, WEIGHT_CHANGE_PCT_THRESHOLD };

/** Auto tag `lost_10_percent` — ≥ this % loss vs previous order. */
export const WEIGHT_LOSS_ALERT_PCT = 10;

/** Auto tag `gained_7_percent` — same % threshold as complex-patient monitoring. */
export const WEIGHT_GAIN_ALERT_PCT = WEIGHT_CHANGE_PCT_THRESHOLD;

/** @deprecated Use AutoComplexAlert — kept for call sites. */
export type WeightChangeAlertKind = "gain_7" | "loss_10" | "weight_change" | "medication_switch";

/** @deprecated Alias — complex alerts now use unified thresholds (10 kg OR 7%). */
export type WeightChangeAlert = AutoComplexAlert & {
  kind: WeightChangeAlertKind;
};

/**
 * Compares current order to prior approved / linked consultation.
 * Complex when |Δweight| ≥ 10 kg OR ≥ 7%, or Mounjaro ↔ Wegovy switch.
 */
export function evaluateWeightChangeMonitoring(
  current: Consultation,
  related: Consultation[] = [],
): WeightChangeAlert | null {
  const primary = primaryAutoComplexAlert(current, related);
  if (!primary) return null;

  if (primary.kind === "medication_switch") {
    return { ...primary, kind: "medication_switch" };
  }

  return {
    ...primary,
    kind:
      primary.pctChange != null && primary.pctChange < 0
        ? "loss_10"
        : primary.pctChange != null && primary.pctChange > 0
          ? "gain_7"
          : "weight_change",
  };
}

export { evaluateAllAutoComplexAlerts };

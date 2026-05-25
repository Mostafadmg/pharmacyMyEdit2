import type { Consultation } from "@workspace/api-client-react";
import { resolveConsultationWeightKg } from "@/lib/orderPatientUi";

/** SOP §13 — weight change vs immediately previous order. */
export const WEIGHT_GAIN_ALERT_PCT = 7;
export const WEIGHT_LOSS_ALERT_PCT = 10;

export type WeightChangeAlertKind = "gain_7" | "loss_10";

export type WeightChangeAlert = {
  kind: WeightChangeAlertKind;
  isComplexPatient: true;
  pctChange: number;
  currentWeightKg: number;
  previousWeightKg: number;
  previousOrderDate: string;
  headline: string;
  detail: string;
};

function priorConsultationForOrder(
  current: Consultation,
  related: Consultation[],
): Consultation | null {
  if (current.previousConsultationId) {
    const linked = related.find((c) => c.id === current.previousConsultationId);
    if (linked && linked.id !== current.id) return linked;
  }

  const samePatient = related
    .filter(
      (c) =>
        c.patientEmail.toLowerCase() === current.patientEmail.toLowerCase() &&
        !c.id.endsWith("-prior") &&
        c.id !== current.id,
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const older = samePatient.filter(
    (c) => new Date(c.createdAt).getTime() < new Date(current.createdAt).getTime(),
  );
  return older.length > 0 ? older[older.length - 1]! : null;
}

/**
 * Compares current order weight to the immediately previous order for this patient.
 * Returns a complex-patient alert when gain ≥7% or loss ≥10% (SOP weight monitoring).
 */
export function evaluateWeightChangeMonitoring(
  current: Consultation,
  related: Consultation[] = [],
): WeightChangeAlert | null {
  const currentWeight = resolveConsultationWeightKg(current);
  if (currentWeight == null || currentWeight <= 0) return null;

  const prior = priorConsultationForOrder(current, related);
  if (!prior) return null;

  const previousWeight = resolveConsultationWeightKg(prior);
  if (previousWeight == null || previousWeight <= 0) return null;

  const pctChange =
    Math.round(
      ((currentWeight - previousWeight) / previousWeight) * 1000,
    ) / 10;

  const previousOrderDate = new Date(prior.createdAt).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );

  if (pctChange >= WEIGHT_GAIN_ALERT_PCT) {
    return {
      kind: "gain_7",
      isComplexPatient: true,
      pctChange,
      currentWeightKg: currentWeight,
      previousWeightKg: previousWeight,
      previousOrderDate,
      headline: "Complex patient — weight gain since last order",
      detail: `↑ ${pctChange}% since previous order (${previousWeight.toFixed(1)} kg → ${currentWeight.toFixed(1)} kg). SOP: ≥${WEIGHT_GAIN_ALERT_PCT}% gain requires review.`,
    };
  }

  if (pctChange <= -WEIGHT_LOSS_ALERT_PCT) {
    const lossPct = Math.abs(pctChange);
    return {
      kind: "loss_10",
      isComplexPatient: true,
      pctChange,
      currentWeightKg: currentWeight,
      previousWeightKg: previousWeight,
      previousOrderDate,
      headline: "Complex patient — rapid weight loss since last order",
      detail: `↓ ${lossPct}% since previous order (${previousWeight.toFixed(1)} kg → ${currentWeight.toFixed(1)} kg). SOP: ≥${WEIGHT_LOSS_ALERT_PCT}% loss requires review.`,
    };
  }

  return null;
}

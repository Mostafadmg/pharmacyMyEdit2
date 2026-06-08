/** High-risk medicines — re-exports shared WL catalogue (all consultation pathways). */
import {
  WL_HIGH_RISK_GATE_QUESTION,
  WL_HIGH_RISK_MEDICATIONS,
  WL_REPEAT_HIGH_RISK_QUESTION,
  WL_TRANSFER_HIGH_RISK_MED_IDS,
  wlHighRiskMedLabelsIncludingLegacy,
  type WlTransferHighRiskMedId,
} from "@workspace/evidence-slots";

export {
  WL_HIGH_RISK_GATE_QUESTION,
  WL_HIGH_RISK_MEDICATIONS,
  WL_REPEAT_HIGH_RISK_QUESTION,
  WL_TRANSFER_HIGH_RISK_MED_IDS,
  wlHighRiskMedLabelsIncludingLegacy,
  type WlTransferHighRiskMedId,
};

export type TransferHighRiskMedId = WlTransferHighRiskMedId;

export const TRANSFER_HIGH_RISK_MED_IDS = WL_TRANSFER_HIGH_RISK_MED_IDS;

export const TRANSFER_HIGH_RISK_MED_LABELS =
  wlHighRiskMedLabelsIncludingLegacy() as Record<TransferHighRiskMedId, string>;

export type HighRiskMedDetail = {
  medId: TransferHighRiskMedId;
  name: string;
  condition: string;
  duration: string;
};

export function formatHighRiskMedDetailsForAnswers(
  selected: TransferHighRiskMedId[],
  details: HighRiskMedDetail[],
): HighRiskMedDetail[] {
  const detailById = new Map(details.map((d) => [d.medId, d]));
  return selected.map((medId) => {
    const row = detailById.get(medId);
    return {
      medId,
      name: row?.name.trim() ?? "",
      condition: row?.condition.trim() ?? "",
      duration: row?.duration.trim() ?? "",
    };
  });
}

export function isHighRiskMedDetailComplete(d: HighRiskMedDetail): boolean {
  return Boolean(d.condition.trim() && d.duration.trim());
}

export const TRANSFER_HIGH_RISK_QUESTION = WL_HIGH_RISK_GATE_QUESTION;
export const REPEAT_HIGH_RISK_QUESTION = WL_REPEAT_HIGH_RISK_QUESTION;

/** @deprecated Use WL_HIGH_RISK_MEDICATIONS — kept for imports that expected PMR naming. */
export const PMR_HIGH_RISK_MEDICATIONS = WL_HIGH_RISK_MEDICATIONS;

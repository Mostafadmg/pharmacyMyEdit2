/** High-risk medicine catalogues — re-exports shared WL catalogue (Rx review parity). */
import {
  WL_HIGH_RISK_GATE_QUESTION,
  WL_HIGH_RISK_MEDICATIONS,
  WL_REPEAT_HIGH_RISK_QUESTION,
  WL_SIMPLE_REPEAT_HIGH_RISK_MEDS,
  WL_TRANSFER_HIGH_RISK_MED_IDS,
  formatWlHighRiskCatalogueList,
  labelForWlHighRiskMed,
  wlHighRiskMedLabelsIncludingLegacy,
  type WlTransferHighRiskMedId,
} from "@workspace/evidence-slots";

export {
  WL_HIGH_RISK_GATE_QUESTION,
  WL_HIGH_RISK_MEDICATIONS,
  WL_REPEAT_HIGH_RISK_QUESTION,
  WL_SIMPLE_REPEAT_HIGH_RISK_MEDS,
  WL_TRANSFER_HIGH_RISK_MED_IDS,
  type WlTransferHighRiskMedId,
};

export const TRANSFER_HIGH_RISK_MED_IDS = WL_TRANSFER_HIGH_RISK_MED_IDS;
export type TransferHighRiskMedId = WlTransferHighRiskMedId;

export const TRANSFER_HIGH_RISK_MED_LABELS =
  wlHighRiskMedLabelsIncludingLegacy() as Record<TransferHighRiskMedId, string>;

export const PMR_HIGH_RISK_MEDICATIONS = WL_HIGH_RISK_MEDICATIONS;
export const SIMPLE_REPEAT_HIGH_RISK_MEDS = WL_SIMPLE_REPEAT_HIGH_RISK_MEDS;

export const TRANSFER_HIGH_RISK_QUESTION = WL_HIGH_RISK_GATE_QUESTION;
export const PMR_HIGH_RISK_QUESTION =
  "These medicines need closer monitoring. Do you currently take any of the following medications?";
export const REPEAT_HIGH_RISK_QUESTION = WL_REPEAT_HIGH_RISK_QUESTION;

export const HIGH_RISK_CATALOGUE_ROW_LABEL = "Medications we ask about";

export function formatHighRiskCatalogueList(
  entries: ReadonlyArray<{ id: string; label: string }>,
): string {
  return entries.map((e) => e.label).join(", ");
}

export function transferHighRiskCatalogueList(): string {
  return formatWlHighRiskCatalogueList();
}

export function pmrHighRiskCatalogueList(): string {
  return formatWlHighRiskCatalogueList();
}

export function repeatHighRiskCatalogueList(): string {
  return formatWlHighRiskCatalogueList();
}

export function labelForTransferHighRiskMed(
  medId: string | undefined,
  medicationName: string | undefined,
): string {
  return labelForWlHighRiskMed(medId, medicationName);
}

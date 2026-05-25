/** High-risk medicine catalogues — parity with patient consultation forms. */

export const TRANSFER_HIGH_RISK_MED_IDS = [
  "digoxin",
  "methotrexate",
  "lithium",
  "warfarin",
  "phenytoin",
  "ciclosporin",
  "sirolimus",
  "tacrolimus",
  "theophylline",
  "amiodarone",
  "other",
] as const;

export type TransferHighRiskMedId = (typeof TRANSFER_HIGH_RISK_MED_IDS)[number];

export const TRANSFER_HIGH_RISK_MED_LABELS: Record<TransferHighRiskMedId, string> =
  {
    digoxin: "Digoxin",
    methotrexate: "Methotrexate",
    lithium: "Lithium",
    warfarin: "Warfarin",
    phenytoin: "Phenytoin",
    ciclosporin: "Ciclosporin",
    sirolimus: "Sirolimus",
    tacrolimus: "Tacrolimus",
    theophylline: "Theophylline",
    amiodarone: "Amiodarone",
    other: "Other high-risk medicine",
  };

export const PMR_HIGH_RISK_MEDICATIONS = [
  { id: "digoxin", label: "Digoxin" },
  { id: "methotrexate", label: "Methotrexate" },
  { id: "lithium", label: "Lithium" },
  { id: "warfarin", label: "Warfarin" },
  { id: "phenytoin", label: "Phenytoin" },
  { id: "ciclosporin", label: "Ciclosporin" },
  { id: "sirolimus", label: "Sirolimus" },
  { id: "tacrolimus", label: "Tacrolimus" },
  { id: "theophylline", label: "Theophylline" },
  { id: "amiodarone", label: "Amiodarone" },
] as const;

export const SIMPLE_REPEAT_HIGH_RISK_MEDS = [
  { id: "lithium", label: "Lithium" },
  { id: "methotrexate", label: "Methotrexate" },
  { id: "warfarin", label: "Warfarin" },
  { id: "digoxin", label: "Digoxin" },
  { id: "amiodarone", label: "Amiodarone" },
  { id: "theophylline", label: "Theophylline" },
  { id: "phenytoin", label: "Phenytoin" },
] as const;

export const TRANSFER_HIGH_RISK_QUESTION =
  "Are you currently taking any of the following high-risk medications?";

export const PMR_HIGH_RISK_QUESTION =
  "These medicines need closer monitoring. Do you currently take any of the following high-risk medications?";

export const REPEAT_HIGH_RISK_QUESTION =
  "Do you take any of the following high-risk medicines? If yes, we need your latest monitoring and symptom check.";

export const HIGH_RISK_CATALOGUE_ROW_LABEL =
  "High-risk medicines we ask about";

export function formatHighRiskCatalogueList(
  entries: ReadonlyArray<{ id: string; label: string }>,
): string {
  return entries.map((e) => e.label).join(", ");
}

export function transferHighRiskCatalogueList(): string {
  return formatHighRiskCatalogueList(
    TRANSFER_HIGH_RISK_MED_IDS.filter((id) => id !== "other").map((id) => ({
      id,
      label: TRANSFER_HIGH_RISK_MED_LABELS[id],
    })),
  );
}

export function pmrHighRiskCatalogueList(): string {
  return formatHighRiskCatalogueList(PMR_HIGH_RISK_MEDICATIONS);
}

export function repeatHighRiskCatalogueList(): string {
  return formatHighRiskCatalogueList(SIMPLE_REPEAT_HIGH_RISK_MEDS);
}

export function labelForTransferHighRiskMed(
  medId: string | undefined,
  medicationName: string | undefined,
): string {
  if (medId && medId in TRANSFER_HIGH_RISK_MED_LABELS) {
    return TRANSFER_HIGH_RISK_MED_LABELS[medId as TransferHighRiskMedId];
  }
  return medicationName?.trim() || medId || "—";
}

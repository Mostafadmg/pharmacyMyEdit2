/** High-risk medicines asked on transfer / new-starter continuation questionnaires. */
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

export const TRANSFER_HIGH_RISK_MED_LABELS: Record<TransferHighRiskMedId, string> = {
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
  if (d.medId === "other" && !d.name.trim()) return false;
  return Boolean(d.condition.trim() && d.duration.trim());
}

export const TRANSFER_HIGH_RISK_QUESTION =
  "Are you currently taking any of the following high-risk medications?";

export const REPEAT_HIGH_RISK_QUESTION =
  "Do you take any of the following high-risk medicines?";

/** Type 2 diabetes — oral/glucose meds asked when T2DM is selected on PMR medical history. */

export const WL_TYPE2_DIABETES_LISTED_MED_CLASSES = [
  {
    id: "sulfonylureas",
    label: "Sulfonylureas such as:",
    meds: [
      { id: "gliclazide", label: "Gliclazide" },
      { id: "glibenclamide", label: "Glibenclamide" },
      { id: "tolbutamide", label: "Tolbutamide" },
    ],
  },
  {
    id: "dpp4_inhibitors",
    label: "DPP-4 inhibitors such as:",
    meds: [
      { id: "sitagliptin", label: "Sitagliptin" },
      { id: "vildagliptin", label: "Vildagliptin" },
      { id: "linagliptin", label: "Linagliptin" },
    ],
  },
  {
    id: "sglt2_inhibitors",
    label: "SGLT2 inhibitors such as:",
    meds: [
      { id: "empagliflozin", label: "Empagliflozin" },
      { id: "canagliflozin", label: "Canagliflozin" },
      { id: "dapagliflozin", label: "Dapagliflozin" },
    ],
  },
  {
    id: "thiazolidinediones",
    label: "Thiazolidinediones",
    meds: [{ id: "pioglitazone", label: "Pioglitazone" }],
  },
] as const;

export type WlType2DiabetesListedMedId =
  (typeof WL_TYPE2_DIABETES_LISTED_MED_CLASSES)[number]["meds"][number]["id"];

export const WL_TYPE2_DIABETES_LISTED_MED_QUESTION =
  "Do you take any of the following?";

export const WL_TYPE2_DIABETES_OTHER_MED_QUESTION =
  "Do you take any other medication?";

export function wlType2DiabetesListedMedLabel(
  id: WlType2DiabetesListedMedId,
): string {
  for (const group of WL_TYPE2_DIABETES_LISTED_MED_CLASSES) {
    const med = group.meds.find((m) => m.id === id);
    if (med) return med.label;
  }
  return id;
}

export function isWlType2DiabetesListedMedId(
  id: string,
): id is WlType2DiabetesListedMedId {
  return WL_TYPE2_DIABETES_LISTED_MED_CLASSES.some((group) =>
    group.meds.some((m) => m.id === id),
  );
}

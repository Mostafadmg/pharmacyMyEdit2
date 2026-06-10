/** Excluding conditions for oral weight-loss consultations (Orlistat / Mysimba). */

export const WL_ORAL_EXCLUDING_CONDITIONS_GATE_QUESTION =
  "Have you been diagnosed with or had surgery for any of the following?";

export const WL_ORAL_EXCLUDING_CONDITIONS = [
  { id: "cholestasis", label: "Cholestasis" },
  {
    id: "chronic_malabsorption",
    label: "Chronic malabsorption syndrome",
  },
  {
    id: "inflammatory_bowel_disease",
    label: "IBD, ulcerative colitis, or Crohn's disease",
  },
  { id: "chronic_kidney_disease", label: "Chronic kidney disease" },
  {
    id: "calcium_oxalate_kidney_stones",
    label: "History of calcium oxalate kidney stones",
  },
  {
    id: "acute_hepatitis_liver_cirrhosis",
    label: "Acute hepatitis or liver cirrhosis",
  },
  {
    id: "weight_gain_hormonal_or_medical",
    label:
      "Told by a doctor that weight gain may be caused by a hormonal or medical condition (e.g. underactive thyroid, Cushing's syndrome) or by a medication you take",
  },
  {
    id: "gallstones_gallbladder",
    label:
      "Gallbladder issues, such as gallstones, inflammation, surgery, or bile duct problems",
  },
  {
    id: "eating_disorder",
    label: "Eating disorder, such as anorexia or bulimia nervosa",
  },
] as const;

export type WlOralExcludingConditionId =
  (typeof WL_ORAL_EXCLUDING_CONDITIONS)[number]["id"];

/** Old combined checklist id — kept for orders already submitted. */
export const LEGACY_WL_ORAL_EXCLUDING_CONDITION_LABELS: Record<string, string> =
  {
    chronic_kidney_liver_disease:
      "Chronic kidney disease, acute hepatitis or liver cirrhosis",
    active_eating_disorder: "Active eating disorder",
    type1_diabetes: "Type 1 diabetes",
    cholecystectomy: "Gallbladder removed (cholecystectomy)",
  };

export function wlOralExcludingConditionLabel(id: string): string | undefined {
  return (
    WL_ORAL_EXCLUDING_CONDITIONS.find((c) => c.id === id)?.label ??
    LEGACY_WL_ORAL_EXCLUDING_CONDITION_LABELS[id]
  );
}

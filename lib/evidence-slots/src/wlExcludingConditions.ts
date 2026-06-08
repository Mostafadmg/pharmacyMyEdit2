/** Excluding / serious conditions checklist (step 9 — medical conditions). */

export const WL_EXCLUDING_CONDITIONS_GATE_QUESTION =
  "Have you been diagnosed with or had surgery for any of the following?";

export const WL_EXCLUDING_CONDITIONS = [
  { id: "pancreatitis", label: "Pancreatitis" },
  { id: "type1_diabetes", label: "Type 1 diabetes" },
  {
    id: "eating_disorder",
    label: "Eating disorder, such as anorexia or bulimia nervosa",
  },
  {
    id: "gallstones_gallbladder",
    label:
      "Gallbladder issues, such as gallstones, inflammation, surgery, or bile duct problems",
  },
  {
    id: "bariatric_gastric_surgery",
    label:
      "Any weight loss procedures or surgery in the last 12 months - such as gastric sleeve, gastric band, gastric bypass, or gastric balloon",
  },
  { id: "liver_disease", label: "Liver disease or impairment" },
  {
    id: "mtc_or_men2",
    label:
      "Personal or family history of medullary thyroid cancer or multiple endocrine neoplasia type 2 (MEN2) syndrome",
  },
  {
    id: "cancer",
    label: "Any form of cancer that is being treated by a specialist",
  },
  {
    id: "diabetic_retinopathy",
    label:
      "Diabetic retinopathy under the care of a specialist, or non-arteritic anterior ischaemic optic neuropathy (NAION)",
  },
  {
    id: "heart_failure_rest",
    label: "Heart failure with shortness of breath at rest",
  },
] as const;

export type WlExcludingConditionId =
  (typeof WL_EXCLUDING_CONDITIONS)[number]["id"];

/** Detail follow-up (diagnosed when, medication) — these four conditions. */
export const WL_EXCLUDING_CONDITIONS_WITH_FOLLOW_UP: readonly WlExcludingConditionId[] =
  [
    "bariatric_gastric_surgery",
    "diabetic_retinopathy",
    "heart_failure_rest",
  ];

/** Gallbladder / cholecystectomy — surgery timing only (not free-text date). */
export const WL_EXCLUDING_CONDITIONS_CHOLECYSTECTOMY_TIMING = [
  "gallstones_gallbladder",
  "cholecystectomy",
] as const;

export type WlExcludingConditionCholecystectomyTimingId =
  (typeof WL_EXCLUDING_CONDITIONS_CHOLECYSTECTOMY_TIMING)[number];

export const WL_CHOLECYSTECTOMY_TIMING_OPTIONS = [
  { id: "more_than_12_months", label: "More than 12 months ago" },
  { id: "less_than_12_months", label: "Less than 12 months ago" },
] as const;

export type WlCholecystectomyTimingId =
  (typeof WL_CHOLECYSTECTOMY_TIMING_OPTIONS)[number]["id"];

export function wlCholecystectomyTimingLabel(id: string): string | undefined {
  return WL_CHOLECYSTECTOMY_TIMING_OPTIONS.find((o) => o.id === id)?.label;
}

export function isWlExcludingConditionCholecystectomyTiming(
  catalogueId: string | undefined,
): boolean {
  return (
    catalogueId != null &&
    (WL_EXCLUDING_CONDITIONS_CHOLECYSTECTOMY_TIMING as readonly string[]).includes(
      catalogueId,
    )
  );
}

export function wlExcludingConditionLabel(id: string): string | undefined {
  return WL_EXCLUDING_CONDITIONS.find((c) => c.id === id)?.label;
}

/** Legacy condition IDs from older consultations — display only. */
export const LEGACY_WL_EXCLUDING_CONDITION_LABELS: Record<string, string> = {
  inflammatory_bowel_disease:
    "Inflammatory bowel disease (Crohn's, ulcerative colitis)",
  gastroparesis: "Gastroparesis or delayed stomach emptying",
  chronic_malabsorption: "Chronic malabsorption",
  kidney_disease: "Kidney disease",
  heart_disease_rhythm: "Heart disease or rhythm issues",
  serious_hospitalisation: "Serious condition needing hospitalisation",
  thyroid_disease: "Thyroid disease",
};

export function wlExcludingConditionLabelsIncludingLegacy(): Record<
  string,
  string
> {
  return {
    ...Object.fromEntries(
      WL_EXCLUDING_CONDITIONS.map((c) => [c.id, c.label]),
    ),
    ...LEGACY_WL_EXCLUDING_CONDITION_LABELS,
  };
}

export function isWlExcludingConditionWithFollowUp(
  catalogueId: string | undefined,
): boolean {
  return (
    catalogueId != null &&
    WL_EXCLUDING_CONDITIONS_WITH_FOLLOW_UP.includes(
      catalogueId as WlExcludingConditionId,
    )
  );
}

export function isWlExcludingConditionNoFollowUp(
  catalogueId: string | undefined,
): boolean {
  if (catalogueId == null) return false;
  return (
    !isWlExcludingConditionWithFollowUp(catalogueId) &&
    !isWlExcludingConditionCholecystectomyTiming(catalogueId)
  );
}

export function wlExcludingConditionsGateQuestionWithList(): string {
  return `${WL_EXCLUDING_CONDITIONS_GATE_QUESTION} ${WL_EXCLUDING_CONDITIONS.map((c) => c.label).join(", ")}`;
}

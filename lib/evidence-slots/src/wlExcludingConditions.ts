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
      "Any weight loss procedures or surgery, such as gastric sleeve, gastric band, gastric bypass, or gastric balloon",
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

/** Detail follow-up (diagnosed when, medication) — these conditions. */
export const WL_EXCLUDING_CONDITIONS_WITH_FOLLOW_UP: readonly WlExcludingConditionId[] =
  ["diabetic_retinopathy", "heart_failure_rest"];

/** Bariatric / weight-loss surgery — 12-month timing + optional exact date. */
export const WL_EXCLUDING_CONDITIONS_BARIATRIC_TIMING = [
  "bariatric_gastric_surgery",
] as const;

export type WlExcludingConditionBariatricTimingId =
  (typeof WL_EXCLUDING_CONDITIONS_BARIATRIC_TIMING)[number];

export const WL_BARIATRIC_SURGERY_TIMING_QUESTION =
  "When did you have this procedure or surgery?";

export const WL_BARIATRIC_SURGERY_DATE_LABEL =
  "Month and year of procedure (optional)";

/** Cancer — free-text details for prescriber review (no auto-reject). */
export const WL_EXCLUDING_CONDITIONS_CANCER_DETAILS = ["cancer"] as const;

export type WlExcludingConditionCancerDetailsId =
  (typeof WL_EXCLUDING_CONDITIONS_CANCER_DETAILS)[number];

export const WL_CANCER_DETAILS_QUESTION =
  "Please tell us about your cancer, including the type of cancer, whether you are currently receiving any treatment, and any ongoing symptoms or issues.";

/** Gallbladder / cholecystectomy — surgery timing only (not free-text date). */
export const WL_EXCLUDING_CONDITIONS_CHOLECYSTECTOMY_TIMING = [
  "gallstones_gallbladder",
  "cholecystectomy",
] as const;

export type WlExcludingConditionCholecystectomyTimingId =
  (typeof WL_EXCLUDING_CONDITIONS_CHOLECYSTECTOMY_TIMING)[number];

export const WL_GALLBLADDER_CHOLECYSTECTOMY_QUESTION =
  "Have you had a cholecystectomy (gallbladder removal surgery)?";

export const WL_GALLBLADDER_SURGERY_TIMING_QUESTION =
  "Was your gallbladder surgery more or less than 12 months ago?";

export const WL_GALLBLADDER_SURGERY_DATE_LABEL =
  "Month and year of gallbladder surgery (optional)";

/** Shown under 12-month timing options — gallbladder and bariatric surgery. */
export const WL_SURGERY_TIMING_INSTRUCTION =
  "If you know the month and year, select it below (optional). Otherwise, choose whether it was more or less than 12 months ago.";

export const WL_CHOLECYSTECTOMY_TIMING_OPTIONS = [
  { id: "more_than_12_months", label: "More than 12 months ago" },
  { id: "less_than_12_months", label: "Less than 12 months ago" },
] as const;

export type WlCholecystectomyTimingId =
  (typeof WL_CHOLECYSTECTOMY_TIMING_OPTIONS)[number]["id"];

export function wlCholecystectomyTimingLabel(id: string): string | undefined {
  return WL_CHOLECYSTECTOMY_TIMING_OPTIONS.find((o) => o.id === id)?.label;
}

export function isWlExcludingConditionCancerDetails(
  catalogueId: string | undefined,
): boolean {
  return (
    catalogueId != null &&
    (WL_EXCLUDING_CONDITIONS_CANCER_DETAILS as readonly string[]).includes(
      catalogueId,
    )
  );
}

export function isWlExcludingConditionBariatricTiming(
  catalogueId: string | undefined,
): boolean {
  return (
    catalogueId != null &&
    (WL_EXCLUDING_CONDITIONS_BARIATRIC_TIMING as readonly string[]).includes(
      catalogueId,
    )
  );
}

const MONTH_YEAR_DISPLAY_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Display YYYY-MM or YYYY-MM-DD as "Month YYYY". */
export function wlFormatProcedureMonthYear(value: string): string {
  const trimmed = value.trim();
  const monthYear = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(trimmed);
  if (!monthYear) return trimmed || "—";
  const year = monthYear[1];
  const month = Number(monthYear[2]);
  if (month < 1 || month > 12) return trimmed;
  return `${MONTH_YEAR_DISPLAY_NAMES[month - 1]} ${year}`;
}

/** Derive more/less than 12 months from YYYY-MM or YYYY-MM-DD. */
export function wlTwelveMonthTimingFromDate(
  isoDate: string,
  referenceDate: Date = new Date(),
): WlCholecystectomyTimingId | null {
  const trimmed = isoDate.trim();
  const monthYear = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (monthYear) {
    const year = Number(monthYear[1]);
    const month = Number(monthYear[2]);
    if (month < 1 || month > 12) return null;
    const today = new Date(referenceDate);
    const todayMonths = today.getFullYear() * 12 + today.getMonth();
    const procedureMonths = year * 12 + (month - 1);
    const monthsAgo = todayMonths - procedureMonths;
    return monthsAgo >= 12 ? "more_than_12_months" : "less_than_12_months";
  }

  const procedure = new Date(trimmed);
  if (Number.isNaN(procedure.getTime())) return null;

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  procedure.setHours(0, 0, 0, 0);

  const cutoff = new Date(today);
  cutoff.setMonth(cutoff.getMonth() - 12);

  return procedure > cutoff ? "less_than_12_months" : "more_than_12_months";
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
  liver_cirrhosis_transplant: "Liver cirrhosis or a liver transplant",
  inflammatory_bowel_disease:
    "Inflammatory bowel disease (Crohn's, ulcerative colitis)",
  gastroparesis: "Gastroparesis or delayed stomach emptying",
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
    !isWlExcludingConditionCholecystectomyTiming(catalogueId) &&
    !isWlExcludingConditionBariatricTiming(catalogueId) &&
    !isWlExcludingConditionCancerDetails(catalogueId)
  );
}

export function wlExcludingConditionsGateQuestionWithList(): string {
  return `${WL_EXCLUDING_CONDITIONS_GATE_QUESTION} ${WL_EXCLUDING_CONDITIONS.map((c) => c.label).join(", ")}`;
}

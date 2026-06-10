/** Additional health screening (injectable step 9 — after GLP-1 safety). */

export const WL_ADDITIONAL_HEALTH_CONDITIONS_GATE_QUESTION =
  "Are any of the following part of your medical history, now or in the past?";

export const WL_ADDITIONAL_HEALTH_STEP_INTRO =
  "We need an accurate picture of your health background. Our prescribers review this to confirm this treatment is appropriate and safe for you.";

export const WL_ADDITIONAL_HEALTH_INFO_HEADING =
  "The following conditions are included in our assessment:";

export const WL_ADDITIONAL_HEALTH_INFO_HEADING_WHEN_NO =
  "For reference, these are the conditions included in our assessment:";

export const WL_ADDITIONAL_HEALTH_SELECT_HINT =
  "Tick every condition that applies to you, now or in the past.";

export const WL_ADDITIONAL_HEALTH_CONDITIONS = [
  {
    id: "ckd_egfr_below_30",
    label:
      "Chronic kidney disease with reduced function (eGFR less than 30ml/min – you can find this information on your kidney function blood test)",
  },
  {
    id: "severe_gastrointestinal_disease",
    label:
      "Severe gastrointestinal disease, including inflammatory bowel disease (e.g. ulcerative colitis or Crohn's disease), or gastroparesis (delayed stomach emptying)",
  },
  {
    id: "chronic_malabsorption",
    label: "Chronic malabsorption syndrome (problems absorbing nutrients)",
  },
  {
    id: "liver_cirrhosis_transplant",
    label: "Liver cirrhosis or a liver transplant",
  },
  {
    id: "endocrine_disorder",
    label:
      "An endocrine (hormone) disorder, such as overactive thyroid disease awaiting radioactive iodine or surgery, acromegaly, Addison's disease, Cushing's syndrome, congenital adrenal hyperplasia, or a growth hormone disorder",
  },
  {
    id: "alcohol_treatment_rehab",
    label: "Treatment or rehabilitation for excessive alcohol use",
  },
  {
    id: "cognitive_impairment",
    label:
      "Any cognitive or memory impairment, such as dementia, that may impact the ability to make decisions",
  },
] as const;

export type WlAdditionalHealthConditionId =
  (typeof WL_ADDITIONAL_HEALTH_CONDITIONS)[number]["id"];

export function wlAdditionalHealthConditionLabel(
  id: string,
): string | undefined {
  return WL_ADDITIONAL_HEALTH_CONDITIONS.find((c) => c.id === id)?.label;
}

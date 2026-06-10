import type { Consultation } from "@workspace/api-client-react";
import {
  PMR_MEDICAL_HISTORY_GATE_QUESTION,
  WL_ADDITIONAL_HEALTH_CONDITIONS_GATE_QUESTION,
  WL_CANCER_DETAILS_QUESTION,
  parseSideEffectSymptomsFromAnswers,
  wlCholecystectomyTimingLabel,
  wlExcludingConditionsGateQuestionWithList,
  wlFormatProcedureMonthYear,
  wlMedicalHistoryLabelById,
  wlMedicalHistoryLabelsIncludingLegacy,
} from "@workspace/evidence-slots";
import { cn } from "@/lib/utils";
import {
  HIGH_RISK_CATALOGUE_ROW_LABEL,
  PMR_HIGH_RISK_MEDICATIONS,
  PMR_HIGH_RISK_QUESTION,
  REPEAT_HIGH_RISK_QUESTION,
  SIMPLE_REPEAT_HIGH_RISK_MEDS,
  TRANSFER_HIGH_RISK_QUESTION,
  WL_HIGH_RISK_STOPPED_PAST_THREE_MONTHS_QUESTION,
  labelForTransferHighRiskMed,
  pmrHighRiskCatalogueList,
  repeatHighRiskCatalogueList,
  transferHighRiskCatalogueList,
} from "@/lib/weightLossHighRiskMeds";
import {
  ClinicalQaBundle,
  type ClinicalQaBundleData,
  type ClinicalQaGroupData,
  type ClinicalQaRowData,
} from "@/components/rx/ClinicalQaDisplay";

type DiagnosedRow = {
  catalogue_id?: string | null;
  condition: string;
  diagnosed_when?: string;
  how_long_had?: string;
  condition_details?: string;
  had_cholecystectomy?: string | null;
  cholecystectomy_timing?: string;
  bariatric_surgery_timing?: string;
  bariatric_surgery_timing_label?: string;
  procedure_date?: string;
  on_medication: string | null;
  medication_name?: string | null;
  medication_names?: string[];
};

type MedRow = {
  medication: string;
  for_condition: string;
  notes: string | null;
};

type HealthRow = {
  condition: string;
  when?: string;
  how_long_ago?: string;
  outcome: string;
};

type TransferMedRow = {
  medication: string;
  strength: string;
  dosage?: string;
  frequency?: string;
  last_injection?: string;
};

const TRANSFER_WL_PRODUCT_LABELS: Record<string, string> = {
  mounjaro: "Mounjaro",
  wegovy: "Wegovy",
};

type HighRiskMedRow = {
  med_id?: string;
  medication: string;
  condition: string;
  duration: string;
};

const EXCLUDING_CONDITIONS_Q = wlExcludingConditionsGateQuestionWithList();

const DIABETES_MEDS_Q =
  "If you have Type 2 Diabetes, are you taking any medications other than metformin?";

const CURRENTLY_TAKING_MEDS_Q =
  "Are you currently taking any prescribed, over-the-counter, or recreational drugs?";

const OTHER_HEALTH_Q =
  "Do you have any previous or current health conditions?";

const NEW_TO_INJECTABLES_Q =
  "Have you had weight loss medication in the past 6 months?";

const CHANGING_PROVIDER_Q = "Are you changing from a different provider?";

const LAST_INJECTION_Q = "When was your last injection?";

const LAST_INJECTION_LABELS: Record<string, string> = {
  exact_date: "Exact date provided",
  less_than_4_weeks: "Less than 4 weeks ago",
  "4_to_8_weeks": "Between 4–8 weeks ago",
  "2_to_3_months": "Between 2–3 months ago",
  "3_to_6_months": "Between 3–6 months ago",
  more_than_6_months: "More than 6 months ago",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatWhenAnswer(value: string | undefined): string {
  if (!value?.trim()) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return formatDate(value);
  return value.trim();
}

function yesNo(value: unknown): string {
  if (value === "yes" || value === true) return "Yes";
  if (value === "no" || value === false) return "No";
  return value != null ? String(value) : "—";
}

const CURRENT_MED_HISTORY_LABELS = wlMedicalHistoryLabelById();
const MED_HISTORY_LABELS = wlMedicalHistoryLabelsIncludingLegacy();

type PmrHighRiskMedRow = {
  drug: string;
  label: string;
  takes: string;
  medication_name?: string;
  condition?: string;
  duration?: string;
};

type RepeatHighRiskMedRow = {
  drug: string;
  label: string;
  takes: string;
  last_blood_test_date?: string | null;
  last_blood_test_result?: string | null;
  symptoms?: string;
  symptoms_details?: string | null;
};

function highRiskCatalogueRow(catalogue: string): ClinicalQaRowData {
  return {
    question: HIGH_RISK_CATALOGUE_ROW_LABEL,
    value: catalogue,
  };
}

function isPmrHighRiskDetails(details: unknown): details is PmrHighRiskMedRow[] {
  return (
    Array.isArray(details) &&
    details.some(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof (r as PmrHighRiskMedRow).takes === "string",
    )
  );
}

function hasTransferHighRiskAnswers(answers: Record<string, unknown>): boolean {
  if (answers.high_risk_medications_taken != null) return true;
  const details = answers.high_risk_medications_details;
  if (!Array.isArray(details) || details.length === 0) return false;
  return !isPmrHighRiskDetails(details);
}

function buildTransferHighRiskBundle(
  answers: Record<string, unknown>,
): ClinicalQaBundleData | null {
  const taken = answers.high_risk_medications_taken;
  const details = (answers.high_risk_medications_details ?? []) as HighRiskMedRow[];
  if (taken == null && details.length === 0) return null;

  const introRows: ClinicalQaRowData[] = [
    highRiskCatalogueRow(transferHighRiskCatalogueList()),
  ];
  if (taken != null) {
    introRows.push({
      question: TRANSFER_HIGH_RISK_QUESTION,
      value: yesNo(taken),
    });
  }

  const groups: ClinicalQaGroupData[] = [{ rows: introRows }];

  if (taken === "no") {
    const stopped = answers.high_risk_medications_stopped_past_three_months;
    if (stopped != null) {
      introRows.push({
        question: WL_HIGH_RISK_STOPPED_PAST_THREE_MONTHS_QUESTION,
        value: yesNo(stopped),
      });
    }
    groups.push({
      rows: [
        {
          question: "Medicines reported by patient",
          value: "None currently taking",
        },
      ],
    });
  } else if (taken === "yes" || details.length > 0) {
    details.forEach((row, i) => {
      const prefix = details.length > 1 ? ` (${i + 1})` : "";
      groups.push({
        rows: [
          {
            question: `Selected high-risk medicine${prefix}`,
            value: labelForTransferHighRiskMed(row.med_id, row.medication),
          },
        ],
      });
    });
  }

  return { title: "High-risk medications", groups };
}

function buildPmrHighRiskBundle(
  highRiskDetails: PmrHighRiskMedRow[] | undefined,
): ClinicalQaBundleData | null {
  if (!highRiskDetails?.length) return null;

  const byDrug = new Map(highRiskDetails.map((r) => [r.drug, r]));
  const anyYes = highRiskDetails.some((r) => r.takes === "yes");
  const introRows: ClinicalQaRowData[] = [
    highRiskCatalogueRow(pmrHighRiskCatalogueList()),
    {
      question: PMR_HIGH_RISK_QUESTION,
      value: anyYes ? "Yes" : "No",
    },
  ];
  const groups: ClinicalQaGroupData[] = [{ rows: introRows }];

  if (!anyYes) {
    groups.push({
      rows: [
        {
          question: "Medicines reported by patient",
          value: "None reported",
        },
      ],
    });
    return { title: "High-risk medications", groups };
  }

  for (const m of PMR_HIGH_RISK_MEDICATIONS) {
    const row = byDrug.get(m.id);
    if (!row || row.takes !== "yes") continue;
    const drugRows: ClinicalQaRowData[] = [
      { question: "Selected medicine", value: m.label },
    ];
    if (row.medication_name?.trim()) {
      drugRows.push({
        question: "Medication name",
        value: row.medication_name.trim(),
      });
    }
    if (row.condition?.trim()) {
      drugRows.push({
        question: "Condition treated",
        value: row.condition.trim(),
      });
    }
    if (row.duration?.trim()) {
      drugRows.push({
        question: "How long on treatment",
        value: row.duration.trim(),
      });
    }
    groups.push({ rows: drugRows });
  }

  return { title: "High-risk medications", groups };
}

function buildRepeatHighRiskBundle(
  repeatDetails: RepeatHighRiskMedRow[] | undefined,
): ClinicalQaBundleData | null {
  if (!repeatDetails?.length) return null;

  const byDrug = new Map(repeatDetails.map((r) => [r.drug, r]));
  const anyYes = repeatDetails.some((r) => r.takes === "yes");
  const introRows: ClinicalQaRowData[] = [
    highRiskCatalogueRow(repeatHighRiskCatalogueList()),
    {
      question: REPEAT_HIGH_RISK_QUESTION,
      value: anyYes ? "Yes" : "No",
    },
  ];
  const groups: ClinicalQaGroupData[] = [{ rows: introRows }];

  if (!anyYes) {
    groups.push({
      rows: [
        {
          question: "Medicines reported by patient",
          value: "None reported",
        },
      ],
    });
    return {
      title: "High-risk medicines (repeat monitoring)",
      groups,
    };
  }

  for (const m of SIMPLE_REPEAT_HIGH_RISK_MEDS) {
    const row = byDrug.get(m.id);
    if (!row || row.takes !== "yes") continue;
    const drugRows: ClinicalQaRowData[] = [
      { question: "Selected medicine", value: m.label },
    ];
    if (row.takes === "yes") {
      if (row.last_blood_test_date?.trim()) {
        drugRows.push({
          question: "Date of last blood test",
          value: formatWhenAnswer(row.last_blood_test_date),
        });
      }
      if (row.last_blood_test_result?.trim()) {
        drugRows.push({
          question: "Last blood test result",
          value: row.last_blood_test_result.trim(),
        });
      }
      if (row.symptoms != null) {
        drugRows.push({
          question: "Symptoms since last supply",
          value: yesNo(row.symptoms),
        });
      }
      if (row.symptoms === "yes" && row.symptoms_details?.trim()) {
        drugRows.push({
          question: "Symptom details",
          value: row.symptoms_details.trim(),
        });
      }
    }
    groups.push({ rows: drugRows });
  }

  return {
    title: "High-risk medicines (repeat monitoring)",
    groups,
  };
}

const ALCOHOL_FREQ_LABELS: Record<string, string> = {
  never: "Never",
  monthly_or_less: "Monthly or less",
  "2_4_per_month": "2–4 times a month",
  "2_3_per_week": "2–3 times a week",
  "4_plus_per_week": "4 or more times a week",
};

const ALCOHOL_UNITS_LABELS: Record<string, string> = {
  "0_2": "0–2 units",
  "3_4": "3–4 units",
  "5_6": "5–6 units",
  "7_9": "7–9 units",
  "10_plus": "10 or more units",
};

const ALCOHOL_BINGE_LABELS: Record<string, string> = {
  never: "Never",
  less_than_monthly: "Less than monthly",
  monthly: "Monthly",
  weekly: "Weekly",
  daily_or_almost: "Daily or almost daily",
};

const EXERCISE_SESSION_LABELS: Record<string, string> = {
  "0": "None",
  "1": "1 time",
  "2": "2 times",
  "3": "3 times",
  "4": "4 times",
  "5_plus": "5 or more times",
};

const EXERCISE_INTENSITY_LABELS: Record<string, string> = {
  light: "Light",
  moderate: "Moderate",
  vigorous: "Vigorous",
};

/** Keys rendered inside bundled groups — omit from flat consultation Q&A list. */
export const WEIGHT_LOSS_BUNDLED_ANSWER_KEYS = new Set([
  "excluding_conditions",
  "diabetes_meds_beyond_metformin",
  "currently_taking_meds",
  "other_health_conditions",
  "new_to_injectables",
  "changing_from_provider",
  "last_injection_timing",
  "last_injection_date",
  "medical_history_any",
  "medical_history_details",
  ...Object.keys(MED_HISTORY_LABELS).map((id) => `med_history_${id}`),
  "smokes",
  "ever_smoked",
  "smoking_cigs_per_day",
  "smoking_year_started",
  "smoking_year_stopped",
  ...PMR_HIGH_RISK_MEDICATIONS.flatMap((m) => [
    `takes_${m.id}`,
    `${m.id}_name`,
    `${m.id}_condition`,
    `${m.id}_duration`,
  ]),
  "high_risk_medications_details",
  "repeat_high_risk_medications",
  ...SIMPLE_REPEAT_HIGH_RISK_MEDS.flatMap((m) => [
    `repeat_takes_${m.id}`,
    `repeat_${m.id}_last_blood_test_date`,
    `repeat_${m.id}_last_blood_test_result`,
    `repeat_${m.id}_symptoms`,
    `repeat_${m.id}_symptoms_details`,
  ]),
  "drinks_alcohol",
  "alcohol_frequency",
  "alcohol_units_typical_day",
  "alcohol_binge_frequency",
  "exercise_sessions_per_week",
  "exercise_intensity",
  "is_carer",
  "has_carer",
  "transfer_continuation_questionnaire",
  "transfer_wl_product",
  "transfer_wl_strength",
  "transfer_wl_strength_pen_id",
  "transfer_wl_last_injection",
  "transfer_wl_first_treatment_weight_kg",
  "transfer_wl_first_treatment_weight_unit",
  "transfer_wl_first_treatment_weight_kg_input",
  "transfer_wl_first_treatment_weight_st",
  "transfer_wl_first_treatment_weight_lbs",
  "transfer_wl_first_treatment_start_date",
  "transfer_current_medications_details",
  "high_risk_medications_taken",
  "high_risk_medications_stopped_past_three_months",
  "transfer_side_effects",
  "transfer_side_effects_details",
  "transfer_hospitalised_wl_medication",
  "transfer_hospitalisation_details",
  "transfer_allergies",
  "transfer_allergies_details",
  "transfer_other_medical_conditions",
  "transfer_other_medical_conditions_details",
  "transfer_other_conditions_meds",
  "transfer_other_conditions_meds_details",
  "transfer_otc_supplements",
  "transfer_otc_supplements_details",
  "transfer_patient_declaration",
]);

export function buildWeightLossClinicalBundles(
  c: Consultation,
): ClinicalQaBundleData[] {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const bundles: ClinicalQaBundleData[] = [];

  const additionalDiagnosed = (answers.additional_health_conditions_details ??
    []) as DiagnosedRow[];
  const diagnosed = (answers.diagnosed_conditions_details ??
    []) as DiagnosedRow[];
  const meds = (answers.current_medications_details ?? []) as MedRow[];
  const health = (answers.other_health_conditions_details ?? []) as HealthRow[];

  const additionalAnswer = answers.additional_health_conditions;
  if (additionalAnswer != null || additionalDiagnosed.length > 0) {
    const groups: ClinicalQaGroupData[] = [];
    additionalDiagnosed.forEach((row, i) => {
      const prefix =
        additionalDiagnosed.length > 1 ? ` (condition ${i + 1})` : "";
      const rows: ClinicalQaRowData[] = [];
      if (i === 0 && additionalAnswer != null) {
        rows.push({
          question: WL_ADDITIONAL_HEALTH_CONDITIONS_GATE_QUESTION,
          value: yesNo(additionalAnswer),
        });
      }
      rows.push({
        question: `Condition${prefix}`,
        value: row.condition || "—",
      });
      groups.push({ rows });
    });
    if (groups.length === 0 && additionalAnswer != null) {
      groups.push({
        rows: [
          {
            question: WL_ADDITIONAL_HEALTH_CONDITIONS_GATE_QUESTION,
            value: yesNo(additionalAnswer),
          },
        ],
      });
    }
    if (groups.length > 0) {
      bundles.push({
        title: "About your health",
        groups,
      });
    }
  }

  const excludingAnswer = answers.excluding_conditions;
  if (excludingAnswer != null || diagnosed.length > 0) {
    const groups: ClinicalQaGroupData[] = [];
    diagnosed.forEach((row, i) => {
      const prefix =
        diagnosed.length > 1 ? ` (condition ${i + 1})` : "";
      const conditionRows: ClinicalQaRowData[] = [];
      if (i === 0 && excludingAnswer != null) {
        conditionRows.push({
          question: EXCLUDING_CONDITIONS_Q,
          value: yesNo(excludingAnswer),
        });
      }
      conditionRows.push({
        question: `Condition${prefix}`,
        value: row.condition || "—",
      });
      if (row.catalogue_id === "cancer") {
        conditionRows.push({
          question: `${WL_CANCER_DETAILS_QUESTION}${prefix}`,
          value: row.condition_details?.trim() || "—",
        });
      } else if (row.catalogue_id === "gallstones_gallbladder") {
        if (row.had_cholecystectomy != null) {
          conditionRows.push({
            question: `Had cholecystectomy (gallbladder removal)?${prefix}`,
            value: row.had_cholecystectomy === "yes" ? "Yes" : "No",
          });
        }
        if (row.had_cholecystectomy === "yes" && row.cholecystectomy_timing) {
          conditionRows.push({
            question: `Gallbladder surgery timing${prefix}`,
            value:
              wlCholecystectomyTimingLabel(row.cholecystectomy_timing) ??
              row.cholecystectomy_timing,
          });
        }
        if (row.procedure_date?.trim()) {
          conditionRows.push({
            question: `Gallbladder surgery month and year${prefix}`,
            value: wlFormatProcedureMonthYear(row.procedure_date),
          });
        }
      } else if (row.catalogue_id === "bariatric_gastric_surgery") {
        if (row.bariatric_surgery_timing || row.how_long_had) {
          conditionRows.push({
            question: `Weight-loss surgery timing${prefix}`,
            value:
              row.bariatric_surgery_timing_label ??
              wlCholecystectomyTimingLabel(
                row.bariatric_surgery_timing ?? row.how_long_had ?? "",
              ) ??
              row.how_long_had ??
              row.diagnosed_when ??
              "—",
          });
        }
        if (row.procedure_date?.trim()) {
          conditionRows.push({
            question: `Procedure month and year${prefix}`,
            value: wlFormatProcedureMonthYear(row.procedure_date),
          });
        }
      } else {
        const when = formatWhenAnswer(row.how_long_had ?? row.diagnosed_when);
        if (when !== "—") {
          conditionRows.push({
            question: `How long ago were you diagnosed with it?${prefix}`,
            value: when,
          });
        }
        if (row.on_medication != null) {
          conditionRows.push({
            question: `Do you take any medication?${prefix}`,
            value: row.on_medication === "yes" ? "Yes" : "No",
          });
        }
        if (row.on_medication === "yes") {
          const medList =
            row.medication_names?.length
              ? row.medication_names.join(", ")
              : row.medication_name;
          if (medList) {
            conditionRows.push({
              question: `Medications${prefix}`,
              value: medList,
            });
          }
        }
      }
      groups.push({ rows: conditionRows });
    });
    if (groups.length === 0 && excludingAnswer != null) {
      groups.push({
        rows: [
          {
            question: EXCLUDING_CONDITIONS_Q,
            value: yesNo(excludingAnswer),
          },
        ],
      });
    }
    if (groups.length > 0) {
      bundles.push({
        title: "Reported diagnoses / surgeries",
        groups,
      });
    }
  }

  if (answers.diabetes_meds_beyond_metformin != null) {
    bundles.push({
      title: "Type 2 diabetes medication",
      groups: [
        {
          rows: [
            {
              question: DIABETES_MEDS_Q,
              value: yesNo(answers.diabetes_meds_beyond_metformin),
            },
          ],
        },
      ],
    });
  }

  const takingMeds = answers.currently_taking_meds;
  if (takingMeds != null || meds.length > 0) {
    const groups: ClinicalQaGroupData[] = [];
    meds.forEach((row, i) => {
      const prefix = meds.length > 1 ? ` (medication ${i + 1})` : "";
      const medRows: ClinicalQaRowData[] = [];
      if (i === 0 && takingMeds != null) {
        medRows.push({
          question: CURRENTLY_TAKING_MEDS_Q,
          value: yesNo(takingMeds),
        });
      }
      medRows.push({
        question: `Medication name${prefix}`,
        value: row.medication || "—",
      });
      medRows.push({
        question: `Taken for which condition?${prefix}`,
        value: row.for_condition || "—",
      });
      if (row.notes?.trim()) {
        medRows.push({
          question: `Additional notes${prefix}`,
          value: row.notes.trim(),
        });
      }
      groups.push({ rows: medRows });
    });
    if (groups.length === 0 && takingMeds != null) {
      groups.push({
        rows: [
          {
            question: CURRENTLY_TAKING_MEDS_Q,
            value: yesNo(takingMeds),
          },
        ],
      });
    }
    if (groups.length > 0) {
      bundles.push({
        title: "Current medications",
        groups,
      });
    }
  }

  const otherHealth = answers.other_health_conditions;
  if (otherHealth != null || health.length > 0) {
    const groups: ClinicalQaGroupData[] = [];
    health.forEach((row, i) => {
      const prefix = health.length > 1 ? ` (condition ${i + 1})` : "";
      const healthRows: ClinicalQaRowData[] = [];
      if (i === 0 && otherHealth != null) {
        healthRows.push({
          question: OTHER_HEALTH_Q,
          value: yesNo(otherHealth),
        });
      }
      healthRows.push({
        question: `Condition${prefix}`,
        value: row.condition || "—",
      });
      healthRows.push({
        question: `How long ago?${prefix}`,
        value: formatWhenAnswer(row.how_long_ago ?? row.when),
      });
      if (row.outcome?.trim()) {
        healthRows.push({
          question: `Outcome${prefix}`,
          value: row.outcome.trim(),
        });
      }
      groups.push({ rows: healthRows });
    });
    if (groups.length === 0 && otherHealth != null) {
      groups.push({
        rows: [{ question: OTHER_HEALTH_Q, value: yesNo(otherHealth) }],
      });
    }
    if (groups.length > 0) {
      bundles.push({
        title: "Other health conditions",
        groups,
      });
    }
  }

  const transferWlProduct = answers.transfer_wl_product as string | undefined;
  const transferWlStrength = answers.transfer_wl_strength as string | undefined;
  const transferWlLastInjection = answers.transfer_wl_last_injection as
    | string
    | undefined;
  const transferWlFirstWeightKg = answers.transfer_wl_first_treatment_weight_kg as
    | number
    | undefined;
  const transferWlFirstWeightUnit = answers.transfer_wl_first_treatment_weight_unit as
    | string
    | undefined;
  const transferWlFirstWeightSt = answers.transfer_wl_first_treatment_weight_st as
    | string
    | undefined;
  const transferWlFirstWeightLbs = answers.transfer_wl_first_treatment_weight_lbs as
    | string
    | undefined;
  const transferWlFirstStartDate = answers.transfer_wl_first_treatment_start_date as
    | string
    | undefined;
  const transferMeds = (answers.transfer_current_medications_details ??
    []) as TransferMedRow[];
  const hasStructuredTransferWl =
    transferWlProduct != null ||
    transferWlStrength != null ||
    transferWlLastInjection != null ||
    transferWlFirstWeightKg != null ||
    transferWlFirstStartDate != null;
  if (
    answers.transfer_continuation_questionnaire ||
    hasStructuredTransferWl ||
    transferMeds.length > 0
  ) {
    const groups: ClinicalQaGroupData[] = [];
    if (hasStructuredTransferWl) {
      const productLabel =
        TRANSFER_WL_PRODUCT_LABELS[transferWlProduct ?? ""] ??
        transferWlProduct ??
        "—";
      const rows: ClinicalQaRowData[] = [
        { question: "Product", value: productLabel },
      ];
      if (transferWlStrength) {
        rows.push({ question: "Strength", value: transferWlStrength });
      }
      if (transferWlLastInjection) {
        rows.push({
          question: "Last injection date (this strength)",
          value: formatDate(transferWlLastInjection),
        });
      }
      if (transferWlFirstWeightKg != null && transferWlFirstWeightKg > 0) {
        const weightDisplay =
          transferWlFirstWeightUnit === "stlbs" &&
          (transferWlFirstWeightSt || transferWlFirstWeightLbs)
            ? `${transferWlFirstWeightSt || "0"} st ${transferWlFirstWeightLbs || "0"} lbs (${transferWlFirstWeightKg} kg)`
            : `${transferWlFirstWeightKg} kg`;
        rows.push({
          question: "Weight at first GLP-1 treatment start",
          value: weightDisplay,
        });
      }
      if (transferWlFirstStartDate) {
        rows.push({
          question: "First GLP-1 treatment start date",
          value: formatDate(transferWlFirstStartDate),
        });
      }
      groups.push({ rows });
    } else {
      transferMeds.forEach((row, i) => {
        const prefix =
          transferMeds.length > 1 ? ` (medication ${i + 1})` : "";
        const rows: ClinicalQaRowData[] = [
          {
            question: `Medication name${prefix}`,
            value: row.medication || "—",
          },
          {
            question: `Strength${prefix}`,
            value: row.strength || "—",
          },
        ];
        const lastInj = row.last_injection ?? row.dosage;
        if (lastInj?.trim()) {
          rows.push({
            question: `Last injection date${prefix}`,
            value: formatDate(lastInj.trim()),
          });
        }
        groups.push({ rows });
      });
    }
    if (groups.length > 0) {
      bundles.push({
        title: "Transfer — current weight loss medication",
        groups,
      });
    }
  }

  if (hasTransferHighRiskAnswers(answers)) {
    const transferHighRisk = buildTransferHighRiskBundle(answers);
    if (transferHighRisk) bundles.push(transferHighRisk);
  }

  const repeatHighRisk = buildRepeatHighRiskBundle(
    answers.repeat_high_risk_medications as RepeatHighRiskMedRow[] | undefined,
  );
  if (repeatHighRisk) bundles.push(repeatHighRisk);

  const transferSafetyRows: ClinicalQaRowData[] = [];
  if (answers.transfer_side_effects != null) {
    transferSafetyRows.push({
      question: "Side effects from weight-loss medication?",
      value: yesNo(answers.transfer_side_effects),
    });
    const transferSymptoms = parseSideEffectSymptomsFromAnswers(
      answers,
      "transfer_side_effects_symptoms",
      "transfer_side_effects_details",
    );
    if (transferSymptoms.symptomsReported.length > 0) {
      transferSafetyRows.push({
        question: "Side effect symptoms reported",
        value: transferSymptoms.symptomsReported.join(", "),
      });
    } else if (
      answers.transfer_side_effects === "yes" &&
      typeof answers.transfer_side_effects_details === "string" &&
      answers.transfer_side_effects_details.trim()
    ) {
      transferSafetyRows.push({
        question: "Side effects — details",
        value: answers.transfer_side_effects_details.trim() || "—",
      });
    }
    if (transferSymptoms.details) {
      transferSafetyRows.push({
        question: "Side effects — additional information",
        value: transferSymptoms.details,
      });
    }
  }
  if (answers.transfer_hospitalised_wl_medication != null) {
    transferSafetyRows.push({
      question: "Hospitalised due to weight-loss medication?",
      value: yesNo(answers.transfer_hospitalised_wl_medication),
    });
    if (
      answers.transfer_hospitalised_wl_medication === "yes" &&
      typeof answers.transfer_hospitalisation_details === "string"
    ) {
      transferSafetyRows.push({
        question: "Hospitalisation — details",
        value: answers.transfer_hospitalisation_details.trim() || "—",
      });
    }
  }
  if (answers.transfer_allergies != null) {
    transferSafetyRows.push({
      question: "Allergies?",
      value: yesNo(answers.transfer_allergies),
    });
    if (
      answers.transfer_allergies === "yes" &&
      typeof answers.transfer_allergies_details === "string"
    ) {
      transferSafetyRows.push({
        question: "Allergies — details",
        value: answers.transfer_allergies_details.trim() || "—",
      });
    }
  }
  if (answers.transfer_other_medical_conditions != null) {
    transferSafetyRows.push({
      question: "Other medical conditions?",
      value: yesNo(answers.transfer_other_medical_conditions),
    });
    if (
      answers.transfer_other_medical_conditions === "yes" &&
      typeof answers.transfer_other_medical_conditions_details === "string"
    ) {
      transferSafetyRows.push({
        question: "Other conditions — details",
        value:
          answers.transfer_other_medical_conditions_details.trim() || "—",
      });
    }
    if (answers.transfer_other_conditions_meds != null) {
      transferSafetyRows.push({
        question: "Medications for other conditions?",
        value: yesNo(answers.transfer_other_conditions_meds),
      });
    }
    if (
      answers.transfer_other_conditions_meds === "yes" &&
      typeof answers.transfer_other_conditions_meds_details === "string"
    ) {
      transferSafetyRows.push({
        question: "Other conditions — medication names",
        value:
          answers.transfer_other_conditions_meds_details.trim() || "—",
      });
    }
  }
  if (answers.transfer_otc_supplements != null) {
    transferSafetyRows.push({
      question: "Other medicines / supplements / herbal remedies?",
      value: yesNo(answers.transfer_otc_supplements),
    });
    if (
      answers.transfer_otc_supplements === "yes" &&
      typeof answers.transfer_otc_supplements_details === "string"
    ) {
      transferSafetyRows.push({
        question: "OTC / supplements — details",
        value: answers.transfer_otc_supplements_details.trim() || "—",
      });
    }
  }
  if (answers.transfer_patient_declaration === true) {
    transferSafetyRows.push({
      question: "Patient declaration",
      value: "Confirmed",
    });
  }
  if (transferSafetyRows.length > 0) {
    bundles.push({
      title: "Transfer continuation — safety",
      groups: [{ rows: transferSafetyRows }],
    });
  }

  const newToInjectables = answers.new_to_injectables;
  const changingProvider = answers.changing_from_provider;
  const lastTiming = answers.last_injection_timing;
  const lastDate = answers.last_injection_date;

  if (
    newToInjectables != null ||
    changingProvider != null ||
    lastTiming != null
  ) {
    const groupRows: ClinicalQaRowData[] = [];
    if (newToInjectables != null) {
      groupRows.push({
        question: NEW_TO_INJECTABLES_Q,
        value: yesNo(newToInjectables === "no" ? "yes" : "no"),
      });
    }
    if (changingProvider != null) {
      groupRows.push({
        question: CHANGING_PROVIDER_Q,
        value:
          changingProvider === "yes"
            ? "Yes — transfer patient"
            : "No",
      });
    }
    if (lastTiming) {
      const timing = String(lastTiming);
      groupRows.push({
        question: LAST_INJECTION_Q,
        value:
          timing === "exact_date" && typeof lastDate === "string"
            ? formatDate(lastDate)
            : (LAST_INJECTION_LABELS[timing] ?? timing),
      });
    }
    if (groupRows.length > 0) {
      bundles.push({
        title: "Injectable treatment history",
        groups: [{ rows: groupRows }],
      });
    }
  }

  return bundles;
}

const PMR_MEDICAL_HISTORY_GATE_QUESTION_WITH_LIST =
  `${PMR_MEDICAL_HISTORY_GATE_QUESTION} ${Object.values(
    CURRENT_MED_HISTORY_LABELS,
  ).join(", ")}`;

type MedicalHistoryDetailAnswer = {
  id?: string;
  label?: string;
  on_medication?: string;
  medications?: string[];
  takes_listed_meds?: string;
  listed_meds?: string[];
  listed_medication_names?: string[];
  on_other_medication?: string;
  other_medications?: string[];
};

function buildPmrHealthBundles(
  answers: Record<string, unknown>,
): ClinicalQaBundleData[] {
  const bundles: ClinicalQaBundleData[] = [];

  const explicitGate = answers.medical_history_any as string | undefined;
  const medValues = Object.keys(MED_HISTORY_LABELS).map(
    (id) => answers[`med_history_${id}`],
  );
  const hasLegacyMed = medValues.some((v) => v != null);
  const gate =
    explicitGate === "yes" || explicitGate === "no"
      ? explicitGate
      : hasLegacyMed
        ? medValues.every((v) => v === "no")
          ? "no"
          : medValues.some((v) => v === "yes")
            ? "yes"
            : null
        : null;

  if (gate != null) {
    const details = Array.isArray(answers.medical_history_details)
      ? (answers.medical_history_details as MedicalHistoryDetailAnswer[])
      : [];
    const reported = Object.entries(MED_HISTORY_LABELS)
      .filter(([id]) => answers[`med_history_${id}`] === "yes")
      .map(([, label]) => label);
    const rows: ClinicalQaRowData[] = [
      {
        question: PMR_MEDICAL_HISTORY_GATE_QUESTION_WITH_LIST,
        value: gate === "no" ? "No" : "Yes",
      },
    ];
    if (gate === "yes") {
      if (details.length > 0) {
        for (const d of details) {
          const label = d.label ?? MED_HISTORY_LABELS[d.id ?? ""] ?? d.id ?? "Condition";
          const medRows: string[] = [];
          if (d.id === "type2_diabetes") {
            const listedNames = d.listed_medication_names ?? [];
            if (d.takes_listed_meds === "yes" && listedNames.length > 0) {
              medRows.push(`Listed: ${listedNames.join(", ")}`);
            } else if (d.takes_listed_meds === "yes") {
              medRows.push("Listed medications reported (not specified)");
            } else if (d.takes_listed_meds === "no") {
              medRows.push("None of the listed medications");
            }
            const otherMeds = d.other_medications ?? [];
            const otherGate = d.on_other_medication ?? d.on_medication;
            if (otherGate === "yes" && otherMeds.length > 0) {
              medRows.push(`Other: ${otherMeds.join(", ")}`);
            } else if (otherGate === "yes") {
              medRows.push("Other medication reported (not specified)");
            } else if (otherGate === "no") {
              medRows.push("No other medication");
            }
          } else if (d.on_medication === "yes" && (d.medications?.length ?? 0) > 0) {
            medRows.push(...(d.medications ?? []));
          } else if (d.on_medication === "yes") {
            medRows.push("Medication reported (not specified)");
          } else if (d.on_medication === "no") {
            medRows.push("No medication");
          }
          rows.push({
            question: label,
            value:
              medRows.length > 0 ? medRows.join("; ") : "—",
          });
        }
      } else if (reported.length > 0) {
        rows.push({
          question: "Conditions reported",
          value: reported.join(", "),
        });
      } else {
        rows.push({
          question: "Conditions reported",
          value: "—",
        });
      }
    }
    bundles.push({
      title: "Medical history (PMR)",
      groups: [{ rows }],
    });
  }

  if (answers.smokes != null) {
    const rows: ClinicalQaRowData[] = [
      { question: "Do you smoke?", value: yesNo(answers.smokes) },
    ];
    if (answers.smokes === "yes" || answers.ever_smoked != null) {
      if (answers.smokes === "no") {
        rows.push({
          question: "Have you ever smoked?",
          value: yesNo(answers.ever_smoked),
        });
      }
      if (answers.smoking_cigs_per_day) {
        rows.push({
          question: "Cigarettes per day (average)",
          value: String(answers.smoking_cigs_per_day),
        });
      }
      if (answers.smoking_year_started) {
        rows.push({
          question: "Year started",
          value: String(answers.smoking_year_started),
        });
      }
      if (answers.smoking_year_stopped) {
        rows.push({
          question: "Year stopped",
          value: String(answers.smoking_year_stopped),
        });
      }
    }
    bundles.push({ title: "Smoking", groups: [{ rows }] });
  }

  const pmrDetails = answers.high_risk_medications_details;
  if (isPmrHighRiskDetails(pmrDetails)) {
    const pmrHighRisk = buildPmrHighRiskBundle(pmrDetails);
    if (pmrHighRisk) bundles.push(pmrHighRisk);
  }

  const drinksAlcohol = answers.drinks_alcohol;
  const showAlcoholBundle =
    drinksAlcohol != null || answers.alcohol_frequency != null;
  if (showAlcoholBundle) {
    const rows: { question: string; value: string }[] = [];
    if (drinksAlcohol != null) {
      rows.push({
        question: "Do you drink alcohol?",
        value: drinksAlcohol === "yes" ? "Yes" : "No",
      });
    }
    const showAuditC =
      drinksAlcohol === "yes" ||
      (drinksAlcohol == null && answers.alcohol_frequency != null);
    if (showAuditC) {
      rows.push(
        {
          question: "How often do you drink alcohol?",
          value:
            ALCOHOL_FREQ_LABELS[String(answers.alcohol_frequency)] ??
            String(answers.alcohol_frequency ?? "—"),
        },
        {
          question: "Units on a typical drinking day",
          value:
            ALCOHOL_UNITS_LABELS[String(answers.alcohol_units_typical_day)] ??
            String(answers.alcohol_units_typical_day ?? "—"),
        },
        {
          question: "Six or more units on one occasion",
          value:
            ALCOHOL_BINGE_LABELS[String(answers.alcohol_binge_frequency)] ??
            String(answers.alcohol_binge_frequency ?? "—"),
        },
      );
    }
    bundles.push({
      title: showAuditC ? "Alcohol (AUDIT-C)" : "Alcohol",
      groups: [{ rows }],
    });
  }

  if (answers.exercise_sessions_per_week != null) {
    bundles.push({
      title: "Exercise",
      groups: [
        {
          rows: [
            {
              question: "Sessions per week (30+ minutes)",
              value:
                EXERCISE_SESSION_LABELS[
                  String(answers.exercise_sessions_per_week)
                ] ?? String(answers.exercise_sessions_per_week),
            },
            {
              question: "Usual intensity",
              value:
                EXERCISE_INTENSITY_LABELS[String(answers.exercise_intensity)] ??
                String(answers.exercise_intensity ?? "—"),
            },
          ],
        },
      ],
    });
  }

  if (answers.is_carer != null || answers.has_carer != null) {
    const rows: ClinicalQaRowData[] = [];
    if (answers.is_carer != null) {
      rows.push({
        question: "Are you a carer?",
        value: yesNo(answers.is_carer),
      });
    }
    if (answers.has_carer != null) {
      rows.push({
        question: "Do you have a carer?",
        value: yesNo(answers.has_carer),
      });
    }
    bundles.push({ title: "Carer", groups: [{ rows }] });
  }

  return bundles;
}

export function WeightLossClinicalReview({ c }: { c: Consultation }) {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const bundles = [
    ...buildWeightLossClinicalBundles(c),
    ...buildPmrHealthBundles(answers),
  ];
  if (bundles.length === 0) return null;

  return (
    <div className="space-y-6">
      {bundles.map((bundle, index) => (
        <div
          key={bundle.title}
          className={cn(index > 0 && "border-t border-border pt-6")}
        >
          <ClinicalQaBundle {...bundle} />
        </div>
      ))}
    </div>
  );
}

import type { Consultation } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  ClinicalQaBundle,
  type ClinicalQaBundleData,
  type ClinicalQaGroupData,
  type ClinicalQaRowData,
} from "@/components/rx/ClinicalQaDisplay";

type DiagnosedRow = {
  condition: string;
  diagnosed_when?: string;
  how_long_had?: string;
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

const EXCLUDING_CONDITIONS_Q =
  "Have you been diagnosed with or had surgery for any of the following? Pancreatitis, Gallstones or gallbladder problems, Inflammatory bowel disease (Crohn's, ulcerative colitis), Gastroparesis or delayed stomach emptying, Chronic malabsorption, Bariatric or gastric surgery, Liver disease, Kidney disease, Type 1 Diabetes, Diabetic eye disease (retinopathy), Heart disease or rhythm issues, Cancer, Serious condition needing hospitalisation, Other condition not listed above";

const DIABETES_MEDS_Q =
  "If you have Type 2 Diabetes, are you taking any medications other than metformin?";

const CURRENTLY_TAKING_MEDS_Q =
  "Are you currently taking any prescribed, over-the-counter, or recreational drugs?";

const OTHER_HEALTH_Q =
  "Do you have any previous or current health conditions?";

const NEW_TO_INJECTABLES_Q =
  "Are you new to using injectable weight-loss medications?";

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
]);

export function buildWeightLossClinicalBundles(
  c: Consultation,
): ClinicalQaBundleData[] {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const bundles: ClinicalQaBundleData[] = [];

  const diagnosed = (answers.diagnosed_conditions_details ??
    []) as DiagnosedRow[];
  const meds = (answers.current_medications_details ?? []) as MedRow[];
  const health = (answers.other_health_conditions_details ?? []) as HealthRow[];

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
        question: `What were you diagnosed with?${prefix}`,
        value: row.condition || "—",
      });
      conditionRows.push({
        question: `How long ago were you diagnosed with it?${prefix}`,
        value: formatWhenAnswer(row.how_long_had ?? row.diagnosed_when),
      });
      conditionRows.push({
        question: `Do you take any medication?${prefix}`,
        value: row.on_medication === "yes" ? "Yes" : "No",
      });
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
        value: yesNo(newToInjectables),
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

export function WeightLossClinicalReview({ c }: { c: Consultation }) {
  const bundles = buildWeightLossClinicalBundles(c);
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

import {
  getConditionQuestions,
  type ClinicalQuestion,
  type EligibilityQuestion,
} from "@/data/conditionQuestions";
import { MEDICAL_HISTORY_CONDITIONS } from "@/lib/pmrHealthQuestionnaire";
import { EXCLUDING_CONDITIONS_ITEMS } from "@/components/consultation/WeightLossClinicalForms";

export type ConsultationQaRow = {
  question: string;
  answer: string;
  /** Conditions/options the question refers to — rendered as a bullet list. */
  items?: string[];
};

/**
 * Questions that ask about a list ("any of the following…"). We surface the
 * full list so the reader sees exactly what was being asked.
 */
const QUESTION_OPTION_LISTS: Record<string, readonly string[]> = {
  excluding_conditions: EXCLUDING_CONDITIONS_ITEMS,
  medical_history_any: MEDICAL_HISTORY_CONDITIONS.map((c) => c.label),
};

/** Keys stored on consultations but not shown as patient Q&A. */
const SKIP_ANSWER_KEYS = new Set([
  "patient_documents",
  "patient_documents_uploaded_at",
  "document_reviews",
  "document_requirements",
  "document_requirement_history",
  "order_document_slots",
  "order_tags",
  "patient_complexity",
  "auto_complex",
  "order_price_gbp_pence",
  "documents_pending",
  "consultation_type",
  "transfer_continuation_questionnaire",
  "high_risk_medications_details",
  "repeat_high_risk_medications",
  "journey_stage",
  "selected_plan",
  "addons",
]);

const FULL_QUESTION_LABELS: Record<string, string> = {
  age_18_75: "Are you aged between 18 and 75?",
  pregnant_or_breastfeeding:
    "Are you currently pregnant, breastfeeding, or planning to become pregnant or breastfeed while using this medication?",
  glp1_allergy_history:
    "Have you ever had an allergic reaction to Wegovy, Mounjaro, Ozempic, Saxenda, or other GLP-1 medications?",
  mtc_or_men2_history:
    "Do you or a family member have a history of medullary thyroid cancer or MEN2?",
  eating_disorder_history:
    "Have you ever had an eating disorder (e.g., anorexia, bulimia)?",
  excluding_conditions:
    "Have you been diagnosed with or had surgery for any of the following serious conditions?",
  medical_history_any:
    "Have you ever been diagnosed with any of the following?",
  diabetes_meds_beyond_metformin:
    "If you have Type 2 Diabetes, are you taking any medications other than metformin?",
  currently_taking_meds:
    "Are you currently taking any prescribed, over-the-counter, or recreational drugs?",
  oral_other_meds_not_listed:
    "Are you currently taking any other prescription medication, over-the-counter medicine, supplement, or herbal remedy not listed above?",
  oral_other_meds_not_listed_details:
    "Other medicines, supplements, or remedies (not listed above)",
  other_health_conditions:
    "Do you have any previous or current health conditions?",
  oral_contraceptive: "Are you taking an oral contraceptive?",
  glp1_ocp_counselling_acknowledged:
    "Mounjaro / Wegovy contraception counselling — acknowledged",
  orlistat_ocp_counselling_acknowledged:
    "Orlistat and oral contraception — counselling acknowledged",
  weight_gain_hormonal_or_medical:
    "Has a doctor ever told you that your weight gain may be caused by a hormonal or medical condition or by a medication you are currently taking?",
  cholecystectomy: "Have you had your gallbladder removed (cholecystectomy)?",
  clinical_team_notes: "Additional information for the clinical team",
  new_to_injectables:
    "Have you had weight loss medication in the past 6 months?",
  changing_from_provider: "Are you changing from a different provider?",
  last_injection_timing: "When was your last injection?",
  consent_agreement: "By proceeding, I confirm and agree to the following",
  gp_consent:
    "I consent to EveryDayMeds contacting my GP and share information about my prescription.",
  weight_today: "What is your current weight today?",
  changes_since_last_order:
    "Since your last order, have there been any changes in your medical history?",
  side_effects_since_last:
    "Have you had any side effects since your last order?",
  side_effects_details: "Side effects — additional information",
  side_effects_symptoms: "Side effect symptoms",
  transfer_side_effects_symptoms: "Side effect symptoms",
  transfer_side_effects_details: "Side effects — additional information",
  new_medicines_since_last:
    "Since your last supply, have you started any new medicines (including OTC or herbal remedies)?",
  stopped_medicines_since_last:
    "Since your last supply, have you stopped any medicines?",
  health_changes_since_last:
    "Since your last supply, have there been any changes to your health or have you seen a doctor or hospital specialist?",
  new_side_effects_since_last:
    "Since your last supply, have you had any new side effects from your current medication?",
  adherence_problems_since_last:
    "Since your last supply, have you had any problems taking your medicine as prescribed?",
  pharmacist_questions_since_last:
    "Do you have any other questions or concerns you would like the pharmacist to know about?",
  continuation_changes_since_review:
    "Has anything changed since your last review or treatment?",
  transfer_hospitalised_wl_medication:
    "Have you been hospitalised due to weight loss medication?",
  transfer_side_effects:
    "Have you experienced any side effects from your weight-loss medication?",
  patient_declaration_confirmed:
    "I confirm the information provided is accurate and complete.",
  dose_change:
    "Would you like to stay on the same dose, step up, or step down?",
  previous_provider: "What was the name of your previous provider?",
  current_dose: "What medicine and dose are you currently on?",
  last_dose_date:
    "When did you last take an injectable weight-loss medication?",
  time_on_medicine: "How long have you been on your current medicine?",
  highest_dose_tolerated:
    "What is the highest dose you have successfully tolerated?",
  reason_for_switching: "Why are you switching from your previous provider?",
  side_effects_previous:
    "Did you experience any side effects with your previous medicine?",
  allergies: "Do you have any allergies?",
  currentMedications: "What medications are you currently taking?",
  medicalHistory: "What is your relevant medical history?",
  height_cm: "Height (cm)",
  weight_kg: "Weight (kg)",
  bmi: "BMI",
};

function shouldSkipKey(key: string): boolean {
  if (SKIP_ANSWER_KEYS.has(key)) return true;
  if (key.endsWith("_original") || key.endsWith("_original_answer")) return true;
  if (/^changed[_-]/i.test(key)) return true;
  if (key.includes("patient_documents")) return true;
  return false;
}

function questionLabelForKey(
  key: string,
  labelById: Map<string, string>,
): string {
  if (labelById.has(key)) return labelById.get(key)!;
  if (FULL_QUESTION_LABELS[key]) return FULL_QUESTION_LABELS[key];
  if (key.endsWith("_details")) {
    const base = key.replace(/_details$/, "");
    const baseLabel =
      labelById.get(base) ??
      FULL_QUESTION_LABELS[base] ??
      base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return `${baseLabel} — details`;
  }
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAnswerValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (key === "bmi") return value.toFixed(1);
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (key === "side_effects_symptoms" || key === "transfer_side_effects_symptoms") {
      const lines = value
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as { label?: string; present?: string };
          if (!row.label) return "";
          const ans =
            row.present === "yes"
              ? "Yes"
              : row.present === "no"
                ? "No"
                : "—";
          return `${row.label}: ${ans}`;
        })
        .filter(Boolean);
      return lines.length ? lines.join("; ") : null;
    }
    if (typeof value[0] === "object" && value[0] !== null) {
      return value
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const row = item as Record<string, unknown>;
          const label =
            typeof row.label === "string"
              ? row.label
              : typeof row.drug === "string"
                ? row.drug
                : "";
          const takes =
            row.takes === "yes" ? "Yes" : row.takes === "no" ? "No" : "";
          const name =
            typeof row.medication_name === "string"
              ? row.medication_name
              : "";
          return [label, takes, name].filter(Boolean).join(" — ");
        })
        .filter(Boolean)
        .join("; ");
    }
    return value.map(String).join(", ");
  }
  if (typeof value === "object") return null;
  const s = String(value).trim();
  if (!s || s === "[object Object]") return null;
  if (s.toLowerCase() === "yes") return "Yes";
  if (s.toLowerCase() === "no") return "No";
  return s;
}

function addQuestionLabels(
  map: Map<string, string>,
  questions: Array<EligibilityQuestion | ClinicalQuestion>,
) {
  for (const q of questions) {
    map.set(q.id, q.text);
  }
}

function buildLabelMap(conditionId: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (conditionId) {
    const questionnaire = getConditionQuestions(conditionId);
    addQuestionLabels(map, questionnaire.eligibilityQuestions);
    addQuestionLabels(map, questionnaire.clinicalQuestions);
  }
  return map;
}

export function buildConsultationQaRows(
  answers: Record<string, unknown> | null | undefined,
  conditionId?: string | null,
): ConsultationQaRow[] {
  if (!answers || typeof answers !== "object") return [];

  const labelById = buildLabelMap(conditionId ?? undefined);
  const rows: ConsultationQaRow[] = [];

  const keys = Object.keys(answers)
    .filter((k) => !shouldSkipKey(k))
    .sort((a, b) => a.localeCompare(b));

  for (const key of keys) {
    const formatted = formatAnswerValue(key, answers[key]);
    if (!formatted) continue;
    const optionList = QUESTION_OPTION_LISTS[key];
    rows.push({
      question: questionLabelForKey(key, labelById),
      answer: formatted,
      ...(optionList ? { items: [...optionList] } : {}),
    });
  }

  return rows;
}

export function hasConsultationAnswers(
  answers: Record<string, unknown> | null | undefined,
): boolean {
  return buildConsultationQaRows(answers).length > 0;
}

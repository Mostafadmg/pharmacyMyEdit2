import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ShieldCheck, Lock, Mail, Phone, Eye, EyeOff,
  UserPlus, Upload, ExternalLink, FileText, User, Heart,
  Pill as PillIcon, CheckCircle2, ClipboardCheck, Stethoscope,
  Syringe, Plus, Minus, Sparkles, Clock,
  Check,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  checkoutVisibleSlots,
  EVIDENCE_SLOT_META,
  patientUploadFileHint,
  validatePatientDocumentFile,
  getDocumentRequirements,
  getBmiEligibilityThreshold,
  isPreviousPrescriptionRequired,
  isPreviousBmiVerificationRequired,
  requirementLabel,
  wlBmiEligibilityAnswerFields,
  type EvidenceSlotId,
} from "@workspace/evidence-slots";
import { EvidenceCriteriaList } from "@/components/EvidenceCriteriaList";
import { DateField } from "@/components/consultation/DateField";
import {
  type DiagnosedConditionEntry,
  type CurrentMedicationEntry,
  type OtherHealthEntry,
  type LastInjectionTiming,
  type TransferWeightLossMedicationValue,
  emptyMedicationEntry,
  emptyHealthEntry,
  emptyTransferWeightLossMedication,
  TRANSFER_WL_PEN_OPTIONS,
  CurrentMedicationsFollowUp,
  OtherHealthHistoryFollowUp,
  InjectablesFollowUp,
  TransferWeightLossMedicationPicker,
  transferWlMedicationToDetailsRow,
  HighRiskMedicationsSection,
  WlContinuationSafetySection,
  ExcludingConditionsSection,
  TransferOtherMedicalConditionsSection,
  isDiagnosedEntryComplete,
  isExcludingConditionsStepComplete,
  isMedicationEntryComplete,
  isHealthEntryComplete,
  isLastInjectionComplete,
  isTransferWeightLossMedicationComplete,
  isTransferOtherMedicalConditionsComplete,
} from "@/components/consultation/WeightLossClinicalForms";
import {
  formatHighRiskMedDetailsForAnswers,
  isHighRiskMedDetailComplete,
  TRANSFER_HIGH_RISK_MED_LABELS,
  type HighRiskMedDetail,
  type TransferHighRiskMedId,
} from "@/lib/weightLossHighRiskMeds";
import {
  MedicalHistorySection,
  PmrLifestyleQuestionnaire,
} from "@/components/consultation/PmrHealthQuestionnaireForms";
import {
  emptyPmrHealthFormSlice,
  isPmrLifestyleStepComplete,
  isMedicalHistoryComplete,
  pmrHealthToAnswers,
  type PmrHealthFormSlice,
} from "@/lib/pmrHealthQuestionnaire";
import { SimpleRepeatQuestionnaire } from "@/components/consultation/SimpleRepeatQuestionnaire";
import {
  emptySimpleRepeatFormState,
  isSimpleRepeatDeclarationComplete,
  isSimpleRepeatMonitoringComplete,
  isSimpleRepeatScreeningComplete,
  simpleRepeatToAnswers,
  type SimpleRepeatFormState,
} from "@/lib/simpleRepeatQuestionnaire";
import {
  type JourneyStage,
  type ConsultationKind,
  resolveEffectiveJourney,
  resolveConsultationKind,
  showsContinuationBlock,
  showsTransferMedicationPicker,
  showsNewPatientMedicationBlock,
  skipsTreatmentPlanPicker,
  isWlContinuationSafetyComplete,
  parsePriorSelectedPlan,
  parsePriorWlMedication,
  wlMedicationLabel,
} from "@/lib/wlConsultationRouting";
import {
  classifyNewStarterEligibility,
  computeRestartDosing,
  gapWeeksFromDate,
  penIdDoseMg,
  allowedPenIdsForDoses,
  starterDoseFor,
  offeredStarterDosesMg,
  validateStarterBundle,
  NEW_STARTER_MAX_BUNDLE_PENS,
  NEW_STARTER_PREVIOUS_USE_PROMPT,
  NOT_SUITABLE_MESSAGE,
  type NewStarterEligibility,
  type RestartDosingResult,
  type WlProduct,
} from "@/lib/wlEligibilityDosing";

type UnitHeight = "cm" | "ftin";
type UnitWeight = "kg" | "stlbs";
type Ethnicity =
  | "asian"
  | "black"
  | "middle-eastern"
  | "mixed"
  | "white"
  | "other"
  | "prefer-not-to-say";
type AssignedSex = "male" | "female" | "prefer-not-to-say";
type YesNo = "yes" | "no";
type ChangesSinceLastOrder =
  | "new_diagnosis"
  | "new_medication_allergy"
  | "no_changes";

/** Pregnancy / contraception questions only apply when not recorded as male at birth. */
function asksFemaleHealthQuestions(sex: AssignedSex | null): boolean {
  return sex === "female" || sex === "prefer-not-to-say";
}

function emptyTransferQuestionnaireFields(): Pick<
  FormState,
  | "transferWlMedication"
  | "transferHighRiskMedsTaken"
  | "transferHighRiskMedsSelected"
  | "transferHighRiskMedDetails"
  | "transferSideEffects"
  | "transferSideEffectsDetails"
  | "transferHealthChangesSinceReview"
  | "transferHealthChangesSinceReviewDetails"
  | "transferHospitalisedWlMedication"
  | "transferHospitalisationDetails"
  | "transferAllergies"
  | "transferAllergiesDetails"
  | "transferOtherMedicalConditions"
  | "transferOtherMedicalConditionsDetails"
  | "transferOtherConditionsMeds"
  | "transferOtherConditionsMedsDetails"
  | "transferOtcSupplements"
  | "transferOtcSupplementsDetails"
  | "transferPatientDeclaration"
> {
  return {
    transferWlMedication: emptyTransferWeightLossMedication(),
    transferHighRiskMedsTaken: null,
    transferHighRiskMedsSelected: [],
    transferHighRiskMedDetails: [],
    transferSideEffects: null,
    transferSideEffectsDetails: "",
    transferHealthChangesSinceReview: null,
    transferHealthChangesSinceReviewDetails: "",
    transferHospitalisedWlMedication: null,
    transferHospitalisationDetails: "",
    transferAllergies: null,
    transferAllergiesDetails: "",
    transferOtherMedicalConditions: null,
    transferOtherMedicalConditionsDetails: "",
    transferOtherConditionsMeds: null,
    transferOtherConditionsMedsDetails: "",
    transferOtcSupplements: null,
    transferOtcSupplementsDetails: "",
    transferPatientDeclaration: false,
  };
}

function isTransferHighRiskStepComplete(state: FormState): boolean {
  return (
    state.transferHighRiskMedsTaken !== null &&
    (state.transferHighRiskMedsTaken === "no" ||
      (state.transferHighRiskMedsSelected.length > 0 &&
        formatHighRiskMedDetailsForAnswers(
          state.transferHighRiskMedsSelected,
          state.transferHighRiskMedDetails,
        ).every(isHighRiskMedDetailComplete)))
  );
}

function isSharedScreeningStepComplete(state: FormState): boolean {
  return isTransferOtherMedicalConditionsComplete(
    state.transferOtherMedicalConditions,
    state.transferOtherMedicalConditionsDetails,
    state.transferOtherConditionsMeds,
    state.transferOtherConditionsMedsDetails,
  );
}

const CONTACT_STEP = 2;
const FLOW_TOTAL_STEPS = 14;

function getPatientSession() {
  if (typeof window === "undefined") {
    return { loggedIn: false, name: "", email: "", phone: "" };
  }
  return {
    loggedIn: Boolean(localStorage.getItem("patient_token")),
    name: localStorage.getItem("patient_name") ?? "",
    email: localStorage.getItem("patient_email") ?? "",
    phone: localStorage.getItem("patient_phone") ?? "",
  };
}

function savePatientSession(data: {
  token: string;
  patientId: string;
  name: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  sex?: string | null;
}) {
  localStorage.setItem("patient_token", data.token);
  localStorage.setItem("patient_id", data.patientId);
  localStorage.setItem("patient_name", data.name);
  localStorage.setItem("patient_email", data.email);
  if (data.phone) localStorage.setItem("patient_phone", data.phone);
  if (data.dateOfBirth) localStorage.setItem("patient_dob", data.dateOfBirth);
  if (data.sex) localStorage.setItem("patient_sex", data.sex);
}

function flowStepNumber(step: number, loggedIn: boolean): number {
  if (loggedIn && step > CONTACT_STEP) return step - 1;
  return step;
}

function flowTotalSteps(loggedIn: boolean): number {
  return loggedIn ? FLOW_TOTAL_STEPS - 1 : FLOW_TOTAL_STEPS;
}

function stepAfter(current: number, loggedIn: boolean): number {
  let n = current + 1;
  if (loggedIn && n === CONTACT_STEP) n++;
  return n;
}

function stepBefore(current: number, loggedIn: boolean): number {
  let n = current - 1;
  if (loggedIn && n === CONTACT_STEP) n--;
  return n;
}

type PatientDocSlot = EvidenceSlotId;

function emptyPatientDocs(): Record<PatientDocSlot, string | null> {
  return {
    "government-id": null,
    "full-body-video": null,
    "weight-scale-video": null,
    "previous-prescription": null,
    "previous-bmi-verification": null,
    "supporting-evidence": null,
  };
}

type AddOnId =
  | "weight-tracker"
  | "sharps-bin"
  | "alcohol-swabs"
  | "pen-needles"
  | "multivit"
  | "vitamin-d";

type PlanType = "single" | "two-pen" | "three-pen";
type MedicineId = "mounjaro" | "wegovy";

/** Restart/gap-dosing restriction passed to the PlanSelector. */
type PlanRestriction = {
  product: MedicineId;
  allowedPenIds: string[];
  recommendedPenId: string | null;
  note: string;
  blockedReason: string | null;
};

interface AddOn {
  id: AddOnId;
  name: string;
  price: number;
  blurb: string;
  icon: typeof FileText;
}

const ADD_ONS: AddOn[] = [
  { id: "weight-tracker", name: "Printable weight-loss tracker", price: 1.99, blurb: "Weekly progress sheet to log weight, dose and notes.", icon: FileText },
  { id: "sharps-bin",      name: "Sharps container — 1 litre",     price: 4.99, blurb: "BS-7320 yellow bin for safe pen-needle disposal.",      icon: ShieldCheck },
  { id: "alcohol-swabs",   name: "Alcohol swabs — 100 pack",       price: 1.99, blurb: "Isopropyl 70% pre-injection skin prep wipes.",         icon: Sparkles },
  { id: "pen-needles",     name: "Pen needles — 100 pack",         price: 4.99, blurb: "Universal sterile single-use 8 mm × 32 G.",            icon: Syringe },
  { id: "multivit",        name: "Daily multivitamin — 60 tabs",   price: 3.99, blurb: "Covers gaps while appetite is reduced.",               icon: PillIcon },
  { id: "vitamin-d",       name: "Vitamin D3 1000 IU — 60 tabs",   price: 3.99, blurb: "Supports immunity and bone health.",                   icon: PillIcon },
];

interface PenOption {
  id: string;
  medicine: MedicineId;
  label: string;
  dose: string;
  weeks: string;
  pricePerPen: number;
  originalPerPen: number;
}

const PEN_OPTIONS: PenOption[] = [
  { id: "mounjaro-2_5", medicine: "mounjaro", label: "Mounjaro 2.5 mg", dose: "2.5 mg",  weeks: "Weeks 1–4",  pricePerPen: 144.99, originalPerPen: 174.99 },
  { id: "mounjaro-5",   medicine: "mounjaro", label: "Mounjaro 5 mg",   dose: "5 mg",    weeks: "Weeks 5–8",  pricePerPen: 154.99, originalPerPen: 184.99 },
  { id: "mounjaro-7_5", medicine: "mounjaro", label: "Mounjaro 7.5 mg", dose: "7.5 mg",  weeks: "Weeks 9–12", pricePerPen: 174.99, originalPerPen: 204.99 },
  { id: "wegovy-0_25",  medicine: "wegovy",   label: "Wegovy 0.25 mg",  dose: "0.25 mg", weeks: "Weeks 1–4",  pricePerPen:  79.99, originalPerPen: 109.99 },
  { id: "wegovy-0_5",   medicine: "wegovy",   label: "Wegovy 0.5 mg",   dose: "0.5 mg",  weeks: "Weeks 5–8",  pricePerPen:  89.99, originalPerPen: 119.99 },
  { id: "wegovy-1_0",   medicine: "wegovy",   label: "Wegovy 1.0 mg",   dose: "1.0 mg",  weeks: "Weeks 9–12", pricePerPen:  99.99, originalPerPen: 129.99 },
];

interface FormState {
  // Step 2 — Contact
  fullName: string;
  email: string;
  phone: string;
  // Step 3 — Journey + repeat safety
  journey: JourneyStage | null;
  changesSinceLast: ChangesSinceLastOrder | null;
  repeatSideEffectsAny: YesNo | null;
  repeatSideEffectsHospital: YesNo | null;
  repeatSideEffectsVomiting: YesNo | null;
  repeatSideEffectsInjection: YesNo | null;
  // Step 4 — Ethnicity
  ethnicity: Ethnicity | null;
  // Step 6 — PMR health & lifestyle / repeat monitoring
  pmrHealth: PmrHealthFormSlice;
  simpleRepeat: SimpleRepeatFormState;
  // Step 5 — BMI
  dob: string;
  heightUnit: UnitHeight;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightUnit: UnitWeight;
  weightKg: string;
  weightSt: string;
  weightLbs: string;
  // Step 6 — Health
  assignedSex: AssignedSex | null;
  ageBracket: YesNo | null;
  pregnant: YesNo | null;
  glp1Allergy: YesNo | null;
  thyroidHistory: YesNo | null;
  eatingDisorder: YesNo | null;
  // Step 7 — Conditions
  excludingConditions: YesNo | null;
  diagnosedConditions: DiagnosedConditionEntry[];
  diabetesMedsOther: YesNo | null;
  // Step 8 — Medication
  takingMeds: YesNo | null;
  currentMedications: CurrentMedicationEntry[];
  otherConditions: YesNo | null;
  otherHealthHistory: OtherHealthEntry[];
  oralContraceptive: YesNo | null;
  newToInjectables: YesNo | null;
  changingProvider: YesNo | null;
  lastInjectionTiming: LastInjectionTiming | null;
  lastInjectionDate: string;
  // Transfer / continuation dose questionnaire
  transferWlMedication: TransferWeightLossMedicationValue;
  transferHighRiskMedsTaken: YesNo | null;
  transferHighRiskMedsSelected: TransferHighRiskMedId[];
  transferHighRiskMedDetails: HighRiskMedDetail[];
  transferSideEffects: YesNo | null;
  transferSideEffectsDetails: string;
  transferHealthChangesSinceReview: YesNo | null;
  transferHealthChangesSinceReviewDetails: string;
  transferHospitalisedWlMedication: YesNo | null;
  /** Repeat: medication prefilled from prior order — patient does not re-pick product. */
  repeatMedicationLocked: boolean;
  transferHospitalisationDetails: string;
  transferAllergies: YesNo | null;
  transferAllergiesDetails: string;
  transferOtherMedicalConditions: YesNo | null;
  transferOtherMedicalConditionsDetails: string;
  transferOtherConditionsMeds: YesNo | null;
  transferOtherConditionsMedsDetails: string;
  transferOtcSupplements: YesNo | null;
  transferOtcSupplementsDetails: string;
  transferPatientDeclaration: boolean;
  // Step 9 — Agreement
  agreement: YesNo | null;
  // Step 10 — GP
  gpConsent: YesNo | null;
  gpName: string;
  gpAddress: string;
  // Step 11 — Plan
  selectedPlan: { type: PlanType; medicine: MedicineId; penIds: string[] } | null;
  // Add-ons
  addOns: Record<AddOnId, number>;
  // Guest portal signup (final step)
  accountPassword: string;
  accountPasswordConfirm: string;
}

function prescriptionItemsFromPlan(
  plan: FormState["selectedPlan"],
): Array<{
  name: string;
  strength: string;
  form: string;
  quantity: string;
  sig: string;
  duration: string;
}> {
  if (!plan) return [];
  return plan.penIds.flatMap((penId) => {
    const pen = PEN_OPTIONS.find((p) => p.id === penId);
    if (!pen) return [];
    return [
      {
        name: pen.label,
        strength: pen.dose,
        form: "Injectable pen",
        quantity: "1 pen",
        sig: "Inject once weekly as directed by your prescriber",
        duration: pen.weeks,
      },
    ];
  });
}

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  journey: null,
  changesSinceLast: null,
  repeatSideEffectsAny: null,
  repeatSideEffectsHospital: null,
  repeatSideEffectsVomiting: null,
  repeatSideEffectsInjection: null,
  ethnicity: null,
  pmrHealth: emptyPmrHealthFormSlice(),
  simpleRepeat: emptySimpleRepeatFormState(),
  dob: "",
  heightUnit: "cm",
  heightCm: "",
  heightFt: "",
  heightIn: "",
  weightUnit: "kg",
  weightKg: "",
  weightSt: "",
  weightLbs: "",
  assignedSex: null,
  ageBracket: null,
  pregnant: null,
  glp1Allergy: null,
  thyroidHistory: null,
  eatingDisorder: null,
  excludingConditions: null,
  diagnosedConditions: [],
  diabetesMedsOther: null,
  takingMeds: null,
  currentMedications: [emptyMedicationEntry()],
  otherConditions: null,
  otherHealthHistory: [emptyHealthEntry()],
  oralContraceptive: null,
  newToInjectables: null,
  changingProvider: null,
  lastInjectionTiming: null,
  lastInjectionDate: "",
  transferWlMedication: emptyTransferWeightLossMedication(),
  transferHighRiskMedsTaken: null,
  transferHighRiskMedsSelected: [],
  transferHighRiskMedDetails: [],
  transferSideEffects: null,
  transferSideEffectsDetails: "",
  transferHealthChangesSinceReview: null,
  transferHealthChangesSinceReviewDetails: "",
  transferHospitalisedWlMedication: null,
  transferHospitalisationDetails: "",
  repeatMedicationLocked: false,
  transferAllergies: null,
  transferAllergiesDetails: "",
  transferOtherMedicalConditions: null,
  transferOtherMedicalConditionsDetails: "",
  transferOtherConditionsMeds: null,
  transferOtherConditionsMedsDetails: "",
  transferOtcSupplements: null,
  transferOtcSupplementsDetails: "",
  transferPatientDeclaration: false,
  agreement: null,
  gpConsent: null,
  gpName: "",
  gpAddress: "",
  selectedPlan: null,
  addOns: {
    "weight-tracker": 0,
    "sharps-bin": 0,
    "alcohol-swabs": 0,
    "pen-needles": 0,
    "multivit": 0,
    "vitamin-d": 0,
  },
  accountPassword: "",
  accountPasswordConfirm: "",
};

const STEP_TITLES = [
  "Eligibility",        // 1
  "Contact",            // 2
  "BMI Check",          // 3
  "Ethnicity",          // 4
  "BMI Check",          // 5
  "Your Health",        // 6
  "Medical Conditions", // 7
  "Medication",         // 8
  "Agreement",          // 9
  "GP Details",         // 10
  "Treatment",          // 11
  "Add-ons",            // 12
];

const TOTAL_STEPS = 11; // primary clinical flow (add-ons is post-plan upsell)

function bmiFrom(state: FormState): number | null {
  let h = NaN;
  if (state.heightUnit === "cm") {
    h = parseFloat(state.heightCm) / 100;
  } else {
    const ft = parseFloat(state.heightFt || "0");
    const inch = parseFloat(state.heightIn || "0");
    if (ft || inch) h = (ft * 30.48 + inch * 2.54) / 100;
  }
  let w = NaN;
  if (state.weightUnit === "kg") {
    w = parseFloat(state.weightKg);
  } else {
    const st = parseFloat(state.weightSt || "0");
    const lbs = parseFloat(state.weightLbs || "0");
    if (st || lbs) w = st * 6.35029 + lbs * 0.453592;
  }
  if (!h || !w || h <= 0 || w <= 0) return null;
  return w / (h * h);
}

const RadioRow: React.FC<{
  id?: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  testId?: string;
}> = ({ selected, onSelect, icon, title, subtitle, testId }) => (
  <button
    type="button"
    onClick={onSelect}
    data-testid={testId}
    className={`w-full text-left rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all ${
      selected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-stone-200/90 bg-card hover:border-stone-300"
    }`}
  >
    {icon && (
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
    )}
    <span className="flex-1 min-w-0">
      <span className="block font-semibold text-secondary">{title}</span>
      {subtitle && <span className="block text-sm text-muted-foreground mt-0.5">{subtitle}</span>}
    </span>
    <span
      className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all ${
        selected ? "bg-primary" : "border-2 border-stone-300"
      }`}
    >
      {selected && <Check className="h-3 w-3 text-white" />}
    </span>
  </button>
);

const YesNoChoice: React.FC<{
  value: YesNo | null;
  onChange: (v: YesNo) => void;
  testIdPrefix: string;
}> = ({ value, onChange, testIdPrefix }) => (
  <div className="space-y-2.5">
    {(["yes", "no"] as YesNo[]).map((opt) => (
      <RadioRow
        key={opt}
        selected={value === opt}
        onSelect={() => onChange(opt)}
        title={opt === "yes" ? "Yes" : "No"}
        testId={`${testIdPrefix}-${opt}`}
      />
    ))}
  </div>
);

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card className="rounded-2xl border border-stone-200/90 bg-card shadow-sm">
    <CardContent className="p-5 md:p-6">{children}</CardContent>
  </Card>
);

const StepShell: React.FC<{
  step: number;
  totalSteps?: number;
  label: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  continueLabel?: string;
  hideBack?: boolean;
}> = ({
  step, totalSteps = TOTAL_STEPS, label, icon, title, subtitle,
  children, onBack, onContinue, canContinue, continueLabel, hideBack,
}) => {
  const pct = Math.min(100, Math.round((step / totalSteps) * 100));
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
      className="max-w-xl mx-auto px-5 pt-6 pb-20"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors",
              hideBack && "invisible pointer-events-none",
            )}
            data-testid="button-step-back"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            Step {step} of {totalSteps}
          </p>
        </div>
        <div className="h-1 rounded-full bg-stone-200/90 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary/90">
          {label}
        </p>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
          {icon}
        </div>
        <h1 className="font-serif text-2xl md:text-[1.75rem] font-bold leading-tight text-secondary">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Body */}
      <div className="space-y-5">{children}</div>

      <div className="mt-10 border-t border-stone-200/80 pt-8">
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          size="lg"
          className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid="button-step-continue"
        >
          {continueLabel ?? "Continue"} <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Your answers are confidential and saved as you go.
        </p>
      </div>
    </motion.div>
  );
};

const TrustRow: React.FC = () => (
  <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted-foreground">
    <span className="inline-flex items-center gap-1.5">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      GPhC 9011677
    </span>
    <span className="hidden sm:inline text-stone-300" aria-hidden>
      ·
    </span>
    <span className="inline-flex items-center gap-1.5">
      <Lock className="h-3.5 w-3.5 text-primary" />
      Encrypted
    </span>
    <span className="hidden sm:inline text-stone-300" aria-hidden>
      ·
    </span>
    <span>UK registered pharmacy</span>
  </p>
);

export default function InjectableWeightLossConsultation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [repeatOfId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("repeatOf");
    return v?.trim() ? v.trim() : null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => getPatientSession().loggedIn);
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [patientDocs, setPatientDocs] = useState(emptyPatientDocs);
  const [photoError, setPhotoError] = useState<string | null>(null);
  /** Custom rejection text shown on the ineligible screen (BMI band / restart). */
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  /** Answer to the "have you taken Mounjaro/Wegovy before?" new-starter prompt. */
  const [priorUseAnswer, setPriorUseAnswer] = useState<YesNo | null>(null);

  const isRepeatFlow =
    state.journey === "existing" || Boolean(repeatOfId);

  const isExplicitTransferJourney = state.journey === "transferring";

  const effectiveJourney = useMemo(
    () =>
      resolveEffectiveJourney({
        journey: state.journey,
        newToInjectables: state.newToInjectables,
        changingProvider: state.changingProvider,
      }),
    [state.journey, state.newToInjectables, state.changingProvider],
  );

  /** answers.consultation_type — new_start | transfer | simple_repeat */
  const consultationType: ConsultationKind = useMemo(
    () => resolveConsultationKind(effectiveJourney),
    [effectiveJourney],
  );

  const isTransferFlow = consultationType === "transfer";

  /** Include prior WL product in answers when transfer picks it or repeat inherits from record. */
  const showCurrentWlMedicationInAnswers =
    consultationType === "transfer" ||
    (consultationType === "simple_repeat" && state.repeatMedicationLocked);

  useEffect(() => {
    const session = getPatientSession();
    if (!session.loggedIn) return;

    void apiFetch<{
      token: string;
      patientId: string;
      name: string;
      email: string;
      phone?: string | null;
      dateOfBirth?: string | null;
      sex?: string | null;
    }>("/api/auth/patient-me", { auth: "patient" })
      .then((profile) => {
        setIsLoggedIn(true);
        savePatientSession({
          token: profile.token,
          patientId: profile.patientId,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          sex: profile.sex,
        });
        setState((s) => ({
          ...s,
          fullName: profile.name || s.fullName,
          email: profile.email || s.email,
          phone: profile.phone || s.phone,
          dob: profile.dateOfBirth || s.dob || localStorage.getItem("patient_dob") || "",
          assignedSex:
            profile.sex === "male" || profile.sex === "female"
              ? profile.sex
              : profile.sex === "other"
                ? "prefer-not-to-say"
                : s.assignedSex,
        }));
      })
      .catch(() => {
        localStorage.removeItem("patient_token");
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    if (isLoggedIn && step === CONTACT_STEP) go(3);
  }, [isLoggedIn, step]);

  useEffect(() => {
    if (!repeatOfId) return;
    setState((s) => ({ ...s, journey: "existing" }));
    let cancelled = false;
    void apiFetch<{
      patientName: string;
      patientEmail: string;
      answers?: Record<string, unknown>;
      prescriptionItems?: unknown;
      verifiedHeightCm?: number | null;
      verifiedWeightKg?: number | null;
    }>(`/api/consultations/${encodeURIComponent(repeatOfId)}`, {
      auth: "patient",
    })
      .then((prior) => {
        if (cancelled) return;
        const answers = (prior.answers ?? {}) as Record<string, unknown>;
        const priorWl = parsePriorWlMedication(answers);
        const priorPlan = parsePriorSelectedPlan(answers);
        const wlLocked = wlMedicationLabel(priorWl) !== null;
        setState((s) => ({
          ...s,
          journey: "existing",
          fullName: prior.patientName || s.fullName,
          email: prior.patientEmail || s.email,
          ethnicity:
            (answers.ethnicity as FormState["ethnicity"]) ?? s.ethnicity,
          dob: typeof answers.dob === "string" ? answers.dob : s.dob,
          heightCm:
            prior.verifiedHeightCm != null
              ? String(prior.verifiedHeightCm)
              : typeof answers.height_cm === "number"
                ? String(answers.height_cm)
                : s.heightCm,
          weightKg:
            prior.verifiedWeightKg != null
              ? String(prior.verifiedWeightKg)
              : typeof answers.weight_kg === "number"
                ? String(answers.weight_kg)
                : s.weightKg,
          ...(wlLocked
            ? {
                transferWlMedication: priorWl,
                repeatMedicationLocked: true,
              }
            : {}),
          ...(priorPlan ? { selectedPlan: priorPlan } : {}),
        }));
      })
      .catch(() => {
        /* prefill optional */
      });
    return () => {
      cancelled = true;
    };
  }, [repeatOfId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const bmi = useMemo(() => bmiFrom(state), [state]);

  const ageYears = useMemo(() => {
    if (!state.dob) return null;
    const d = new Date(state.dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a;
  }, [state.dob]);

  /** Whether the patient reported a qualifying comorbidity (excluding-conditions question). */
  const hasComorbidity = state.excludingConditions === "yes";

  // Clinical hard-stops unrelated to BMI — these always block online prescribing.
  const clinicalHardStops = useMemo(() => {
    const reasons: string[] = [];
    if (state.ageBracket === "no" || (ageYears !== null && (ageYears < 18 || ageYears > 75))) reasons.push("Outside the 18–75 age range for online prescribing.");
    if (
      asksFemaleHealthQuestions(state.assignedSex) &&
      state.pregnant === "yes"
    ) {
      reasons.push(
        "Pregnant, breastfeeding or planning pregnancy — GLP-1 medicines are contraindicated.",
      );
    }
    if (state.glp1Allergy === "yes") reasons.push("Previous allergic reaction to GLP-1 medicines.");
    if (state.thyroidHistory === "yes") reasons.push("Personal or family history of medullary thyroid cancer or MEN2.");
    if (state.eatingDisorder === "yes") reasons.push("History of an eating disorder — requires in-person specialist review.");
    return reasons;
  }, [state.ageBracket, ageYears, state.assignedSex, state.pregnant, state.glp1Allergy, state.thyroidHistory, state.eatingDisorder]);

  // New-starter BMI band classification ("lowest threshold wins").
  const newStarterEligibility: NewStarterEligibility = useMemo(
    () =>
      classifyNewStarterEligibility({
        bmi,
        ethnicity: state.ethnicity,
        hasComorbidity,
      }),
    [bmi, state.ethnicity, hasComorbidity],
  );

  // BMI reason shown on the ineligible screen for a generic clinical stop.
  const bmiReason = useMemo(() => {
    const thresholdPreview = getBmiEligibilityThreshold({
      ethnicity: state.ethnicity,
      excluding_conditions: state.excludingConditions,
      diagnosed_conditions_details:
        state.excludingConditions === "yes"
          ? state.diagnosedConditions.filter(isDiagnosedEntryComplete)
          : [],
    });
    const minBmi = thresholdPreview ?? 27;
    if (bmi !== null && bmi < minBmi) {
      return `Your BMI (${bmi.toFixed(1)}) is below the ${minBmi} threshold for treatment based on your answers.`;
    }
    return null;
  }, [state.ethnicity, state.excludingConditions, state.diagnosedConditions, bmi]);

  // Combined list for the ineligible-screen fallback display.
  const contraindicated = useMemo(
    () => [...clinicalHardStops, ...(bmiReason ? [bmiReason] : [])],
    [clinicalHardStops, bmiReason],
  );

  // Restart / gap dosing for transfer (restart) journeys — drives the plan picker.
  const restartDosing: RestartDosingResult | null = useMemo(() => {
    if (consultationType !== "transfer") return null;
    const product = state.transferWlMedication.product;
    if (!product) return null;
    return computeRestartDosing({
      product: product as WlProduct,
      lastToleratedDoseMg: penIdDoseMg(state.transferWlMedication.strengthPenId),
      gapWeeks: gapWeeksFromDate(state.transferWlMedication.lastInjectionDate),
      bmi,
    });
  }, [
    consultationType,
    state.transferWlMedication.product,
    state.transferWlMedication.strengthPenId,
    state.transferWlMedication.lastInjectionDate,
    bmi,
  ]);

  // Map restart dosing → purchasable pen restriction for the PlanSelector.
  const planRestriction = useMemo((): PlanRestriction | null => {
    if (!restartDosing) return null;
    const product = restartDosing.product;
    const catalogIds = PEN_OPTIONS.map((p) => p.id);
    const allowedPenIds = allowedPenIdsForDoses(
      product,
      restartDosing.allowedDosesMg,
      catalogIds,
    );
    // Recommended pen: closest purchasable strength at or below the recommendation.
    let recommendedPenId: string | null = null;
    if (restartDosing.recommendedDoseMg != null && allowedPenIds.length > 0) {
      const target = restartDosing.recommendedDoseMg;
      const ranked = allowedPenIds
        .map((id) => ({ id, mg: penIdDoseMg(id) ?? -1 }))
        .filter((p) => p.mg <= target)
        .sort((a, b) => b.mg - a.mg);
      recommendedPenId = (ranked[0] ?? null)?.id ?? allowedPenIds[allowedPenIds.length - 1] ?? null;
    }
    return {
      product,
      allowedPenIds,
      recommendedPenId,
      note: restartDosing.note,
      blockedReason: restartDosing.blocked?.reason ?? null,
    };
  }, [restartDosing]);

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    // Clinical hard-stops (age, pregnancy, allergy, thyroid, eating disorder) —
    // always block, regardless of journey.
    if ((step === 7 || step === 8) && clinicalHardStops.length > 0) {
      setRejectionMessage(null);
      go(99); // ineligible screen
      return;
    }
    // New-starter BMI band logic runs once comorbidity is known (after step 8).
    if (step === 8 && consultationType === "new_start") {
      if (newStarterEligibility.status === "reject_low_bmi") {
        setRejectionMessage(newStarterEligibility.message);
        go(99);
        return;
      }
      if (newStarterEligibility.status === "prompt_previous_use") {
        go(98); // "have you taken Mounjaro/Wegovy before?" prompt
        return;
      }
    }
    let n = stepAfter(step, isLoggedIn);
    // Repeat: medication/plan come from prior order — skip pen picker (step 13).
    if (
      n === 13 &&
      skipsTreatmentPlanPicker(consultationType) &&
      state.selectedPlan
    ) {
      n = stepAfter(13, isLoggedIn);
    }
    go(n);
  };
  const back = () => {
    if (step === 99 || step === 98) {
      setRejectionMessage(null);
      go(8);
      return;
    }
    if (step > 1) {
      go(stepBefore(step, isLoggedIn));
      return;
    }
    navigate("/treatments/weight-loss");
  };

  const metrics = useMemo(() => {
    let heightCm = NaN;
    if (state.heightUnit === "cm") {
      heightCm = parseFloat(state.heightCm);
    } else {
      const ft = parseFloat(state.heightFt || "0");
      const inch = parseFloat(state.heightIn || "0");
      if (ft || inch) heightCm = ft * 30.48 + inch * 2.54;
    }
    let weightKg = NaN;
    if (state.weightUnit === "kg") {
      weightKg = parseFloat(state.weightKg);
    } else {
      const st = parseFloat(state.weightSt || "0");
      const lbs = parseFloat(state.weightLbs || "0");
      if (st || lbs) weightKg = st * 6.35029 + lbs * 0.453592;
    }
    return { heightCm, weightKg };
  }, [state]);

  const handleSlotFile = (slot: PatientDocSlot, files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setPhotoError(null);
    const check = validatePatientDocumentFile(f, slot);
    if (!check.ok) {
      setPhotoError(check.message);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPatientDocs((prev) => ({
        ...prev,
        [slot]: String(reader.result),
      }));
    };
    reader.onerror = () =>
      setPhotoError("Could not read your file. Please try again.");
    reader.readAsDataURL(f);
  };

  const transferWlPenPreview = state.transferWlMedication.strengthPenId
    ? TRANSFER_WL_PEN_OPTIONS.find(
        (p) => p.id === state.transferWlMedication.strengthPenId,
      )
    : undefined;

  const uploadAnswersPreview = useMemo((): Record<string, unknown> => {
    const { heightCm, weightKg } = metrics;
    return {
      journey_stage: effectiveJourney,
      excluding_conditions: state.excludingConditions,
      new_to_injectables: state.newToInjectables,
      changing_from_provider: state.changingProvider,
      consultation_type: consultationType,
      ethnicity: state.ethnicity,
      height_cm:
        Number.isFinite(heightCm) && heightCm > 0 ? Math.round(heightCm) : null,
      weight_kg:
        Number.isFinite(weightKg) && weightKg > 0
          ? Math.round(weightKg * 10) / 10
          : null,
      bmi: bmi ?? null,
      selected_plan: state.selectedPlan,
      transfer_wl_product: state.transferWlMedication.product || null,
      transfer_wl_strength: transferWlPenPreview?.dose ?? null,
      transfer_wl_strength_pen_id:
        state.transferWlMedication.strengthPenId || null,
      diagnosed_conditions_details:
        state.excludingConditions === "yes"
          ? state.diagnosedConditions.filter(isDiagnosedEntryComplete)
          : [],
    };
  }, [
    effectiveJourney,
    consultationType,
    state.excludingConditions,
    state.newToInjectables,
    state.changingProvider,
    state.ethnicity,
    metrics,
    state.selectedPlan,
    state.diagnosedConditions,
    state.transferWlMedication.product,
    state.transferWlMedication.strengthPenId,
    transferWlPenPreview?.dose,
    bmi,
  ]);

  const visibleUploadSlots = useMemo(
    () => checkoutVisibleSlots(uploadAnswersPreview),
    [uploadAnswersPreview],
  );

  const uploadRequirements = useMemo(
    () => getDocumentRequirements(uploadAnswersPreview),
    [uploadAnswersPreview],
  );

  // ── Validation per step ─────────────────────────────────────────────────
  const canContinue = useMemo(() => {
    switch (step) {
      case 1: return true;
      case 2:
        return state.fullName.trim().length >= 2
          && /\S+@\S+\.\S+/.test(state.email)
          && state.phone.trim().length >= 7;
      case 3:
        return state.journey !== null;
      case 4: return state.ethnicity !== null;
      case 5: {
        const heightOk = state.heightUnit === "cm"
          ? parseFloat(state.heightCm) > 0
          : parseFloat(state.heightFt || "0") + parseFloat(state.heightIn || "0") > 0;
        const weightOk = state.weightUnit === "kg"
          ? parseFloat(state.weightKg) > 0
          : parseFloat(state.weightSt || "0") + parseFloat(state.weightLbs || "0") > 0;
        return Boolean(state.dob) && heightOk && weightOk;
      }
      case 6:
        return (
          isMedicalHistoryComplete(state.pmrHealth) &&
          isTransferHighRiskStepComplete(state) &&
          isPmrLifestyleStepComplete(state.pmrHealth)
        );
      case 7: {
        const pregnancyOk =
          !asksFemaleHealthQuestions(state.assignedSex) ||
          state.pregnant !== null;
        return (
          state.assignedSex !== null &&
          state.ageBracket !== null &&
          pregnancyOk &&
          state.glp1Allergy !== null &&
          state.thyroidHistory !== null &&
          state.eatingDisorder !== null
        );
      }
      case 8:
        return (
          isExcludingConditionsStepComplete(
            state.excludingConditions,
            state.diagnosedConditions,
          ) && isSharedScreeningStepComplete(state)
        );
      case 9: {
        const continuationOk = isWlContinuationSafetyComplete({
          sideEffects: state.transferSideEffects,
          sideEffectsDetails: state.transferSideEffectsDetails,
          hospitalised: state.transferHospitalisedWlMedication,
          hospitalisationDetails: state.transferHospitalisationDetails,
          changesSinceReview: state.transferHealthChangesSinceReview,
          changesSinceReviewDetails:
            state.transferHealthChangesSinceReviewDetails,
          requireSideEffects: consultationType === "transfer",
          requireChanges: showsContinuationBlock(consultationType),
        });

        if (consultationType === "transfer") {
          return (
            continuationOk &&
            isTransferWeightLossMedicationComplete(state.transferWlMedication)
          );
        }

        if (consultationType === "simple_repeat") {
          if (!continuationOk) return false;
          if (!isSimpleRepeatScreeningComplete(state.simpleRepeat)) return false;
          if (!state.repeatSideEffectsAny) return false;
          if (state.repeatSideEffectsAny === "yes") {
            return (
              state.repeatSideEffectsHospital !== null &&
              state.repeatSideEffectsVomiting !== null &&
              state.repeatSideEffectsInjection !== null
            );
          }
          return true;
        }

        const contraceptionOk =
          !asksFemaleHealthQuestions(state.assignedSex) ||
          state.oralContraceptive !== null;
        const medsOk =
          state.takingMeds !== "yes" ||
          (state.currentMedications.length > 0 &&
            state.currentMedications.every(isMedicationEntryComplete));
        const healthOk =
          state.otherConditions !== "yes" ||
          (state.otherHealthHistory.length > 0 &&
            state.otherHealthHistory.every(isHealthEntryComplete));
        const injectablesOk =
          state.newToInjectables === "yes" ||
          (state.changingProvider !== null &&
            (state.changingProvider === "yes" ||
              isLastInjectionComplete(
                state.lastInjectionTiming,
                state.lastInjectionDate,
              )));
        return (
          state.takingMeds !== null &&
          medsOk &&
          state.otherConditions !== null &&
          healthOk &&
          contraceptionOk &&
          state.newToInjectables !== null &&
          injectablesOk
        );
      }
      case 10:
        if (isExplicitTransferJourney) {
          return (
            state.agreement === "yes" && state.transferPatientDeclaration
          );
        }
        if (isRepeatFlow) {
          return (
            state.agreement === "yes" &&
            isSimpleRepeatDeclarationComplete(state.simpleRepeat)
          );
        }
        return state.agreement === "yes";
      case 11:
        return state.gpConsent !== null
          && (state.gpConsent === "no" || (state.gpName.trim().length > 0 && state.gpAddress.trim().length > 0));
      case 12:
        return true;
      case 13: {
        if (skipsTreatmentPlanPicker(consultationType) && state.selectedPlan) {
          const need =
            state.selectedPlan.type === "single"
              ? 1
              : state.selectedPlan.type === "two-pen"
                ? 2
                : 3;
          return state.selectedPlan.penIds.length === need;
        }
        if (!state.selectedPlan) return false;
        const need = state.selectedPlan.type === "single" ? 1 : state.selectedPlan.type === "two-pen" ? 2 : 3;
        return state.selectedPlan.penIds.length === need;
      }
      case 14: {
        if (!state.selectedPlan) return false;
        const need =
          state.selectedPlan.type === "single"
            ? 1
            : state.selectedPlan.type === "two-pen"
              ? 2
              : 3;
        const planOk = state.selectedPlan.penIds.length === need;
        if (!planOk) return false;
        if (isLoggedIn) return true;
        return (
          state.accountPassword.length >= 8 &&
          state.accountPassword === state.accountPasswordConfirm
        );
      }
      default: return false;
    }
  }, [
    step,
    state,
    patientDocs,
    isLoggedIn,
    isRepeatFlow,
    isTransferFlow,
    isExplicitTransferJourney,
    consultationType,
  ]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true);
    try {
      const submitJourney = resolveEffectiveJourney({
        journey: state.journey,
        newToInjectables: state.newToInjectables,
        changingProvider: state.changingProvider,
      });
      const submitConsultationType = resolveConsultationKind(submitJourney);

      const formatDiagnosed = state.diagnosedConditions
        .filter((e) => e.condition.trim())
        .map((e) => {
          const medNames =
            e.onMedication === "yes"
              ? e.medications.map((m) => m.name.trim()).filter(Boolean)
              : [];
          return {
            catalogue_id: e.catalogueId ?? null,
            condition: e.condition.trim(),
            diagnosed_when: e.howLongHad.trim(),
            how_long_had: e.howLongHad.trim(),
            on_medication: e.onMedication,
            medication_names: medNames,
            medication_name:
              medNames.length > 0 ? medNames.join(", ") : null,
          };
        });

      const formatMeds = state.currentMedications
        .filter((e) => e.medication.trim())
        .map((e) => ({
          medication: e.medication.trim(),
          for_condition: e.forCondition.trim(),
          notes: e.reason.trim() || null,
        }));

      const formatHealth = state.otherHealthHistory
        .filter((e) => e.condition.trim())
        .map((e) => ({
          condition: e.condition.trim(),
          when: e.howLongAgo.trim(),
          how_long_ago: e.howLongAgo.trim(),
          outcome: e.outcome.trim(),
        }));

      const transferWlRow = transferWlMedicationToDetailsRow(
        state.transferWlMedication,
      );
      const transferWlPen = state.transferWlMedication.strengthPenId
        ? TRANSFER_WL_PEN_OPTIONS.find(
            (p) => p.id === state.transferWlMedication.strengthPenId,
          )
        : undefined;
      const formatTransferMeds = transferWlRow
        ? [
            {
              medication: transferWlRow.medication,
              strength: transferWlRow.strength,
              last_injection: state.transferWlMedication.lastInjectionDate.trim(),
            },
          ]
        : [];

      const formatHighRiskMeds =
        state.transferHighRiskMedsTaken === "yes"
          ? formatHighRiskMedDetailsForAnswers(
              state.transferHighRiskMedsSelected,
              state.transferHighRiskMedDetails,
            ).map((d) => ({
              med_id: d.medId,
              medication:
                TRANSFER_HIGH_RISK_MED_LABELS[d.medId] ??
                (d.name.trim() || d.medId),
              condition: d.condition.trim(),
              duration: d.duration.trim(),
            }))
          : [];

      const clinicalAnswers: Record<string, unknown> = {
        journey_stage: submitJourney,
        consultation_type: submitConsultationType,
        ethnicity: state.ethnicity,
        dob: state.dob,
        height_cm:
          Number.isFinite(metrics.heightCm) && metrics.heightCm > 0
            ? Math.round(metrics.heightCm)
            : null,
        weight_kg:
          Number.isFinite(metrics.weightKg) && metrics.weightKg > 0
            ? Math.round(metrics.weightKg * 10) / 10
            : null,
        bmi: bmi ? Number(bmi.toFixed(1)) : null,
        assigned_sex: state.assignedSex,
        age_18_75: state.ageBracket,
        pregnant_or_breastfeeding: state.pregnant,
        glp1_allergy_history: state.glp1Allergy,
        mtc_or_men2_history: state.thyroidHistory,
        eating_disorder_history: state.eatingDisorder,
        excluding_conditions: state.excludingConditions,
        diagnosed_conditions_details: formatDiagnosed,
        diabetes_meds_beyond_metformin: state.diabetesMedsOther,
        currently_taking_meds: state.takingMeds,
        current_medications_details: formatMeds,
        other_health_conditions: state.otherConditions,
        other_health_conditions_details: formatHealth,
        oral_contraceptive: state.oralContraceptive,
        new_to_injectables: state.newToInjectables,
        changing_from_provider: state.changingProvider,
        last_injection_timing: state.lastInjectionTiming,
        last_injection_date:
          state.lastInjectionTiming === "exact_date"
            ? state.lastInjectionDate
            : null,
        ...wlBmiEligibilityAnswerFields(uploadAnswersPreview),
        document_requirements: getDocumentRequirements(uploadAnswersPreview),
        documents_pending: {
          weight_scale: !patientDocs["weight-scale-video"],
          previous_prescription:
            isPreviousPrescriptionRequired(uploadAnswersPreview) &&
            !patientDocs["previous-prescription"],
          previous_bmi_verification:
            isPreviousBmiVerificationRequired(uploadAnswersPreview) &&
            !patientDocs["previous-bmi-verification"],
          supporting_evidence:
            state.excludingConditions === "yes" &&
            !patientDocs["supporting-evidence"],
        },
        consent_agreement: state.agreement,
        gp_consent: state.gpConsent,
        gp_name: state.gpName,
        gp_address: state.gpAddress,
        ...(isRepeatFlow
          ? {
              ...simpleRepeatToAnswers(state.simpleRepeat),
              side_effects_since_last: state.repeatSideEffectsAny,
              side_effects_hospitalisation: state.repeatSideEffectsHospital,
              side_effects_vomiting_diarrhoea: state.repeatSideEffectsVomiting,
              side_effects_injection_site: state.repeatSideEffectsInjection,
            }
          : {}),
        ...pmrHealthToAnswers(state.pmrHealth),
        high_risk_medications_taken: state.transferHighRiskMedsTaken,
        high_risk_medications_details: formatHighRiskMeds,
        transfer_allergies: state.transferAllergies,
        transfer_allergies_details:
          state.transferAllergies === "yes"
            ? state.transferAllergiesDetails.trim()
            : null,
        transfer_other_medical_conditions: state.transferOtherMedicalConditions,
        transfer_other_medical_conditions_details:
          state.transferOtherMedicalConditions === "yes"
            ? state.transferOtherMedicalConditionsDetails.trim()
            : null,
        transfer_other_conditions_meds:
          state.transferOtherMedicalConditions === "yes"
            ? state.transferOtherConditionsMeds
            : null,
        transfer_other_conditions_meds_details:
          state.transferOtherMedicalConditions === "yes" &&
          state.transferOtherConditionsMeds === "yes"
            ? state.transferOtherConditionsMedsDetails.trim()
            : null,
        transfer_otc_supplements: state.transferOtcSupplements,
        transfer_otc_supplements_details:
          state.transferOtcSupplements === "yes"
            ? state.transferOtcSupplementsDetails.trim()
            : null,
        continuation_changes_since_review: state.transferHealthChangesSinceReview,
        continuation_changes_since_review_details:
          state.transferHealthChangesSinceReview === "yes"
            ? state.transferHealthChangesSinceReviewDetails.trim()
            : null,
        ...(showCurrentWlMedicationInAnswers
          ? {
              transfer_wl_product: state.transferWlMedication.product,
              transfer_wl_strength: transferWlPen?.dose ?? null,
              transfer_wl_strength_pen_id:
                state.transferWlMedication.strengthPenId || null,
              transfer_wl_last_injection:
                state.transferWlMedication.lastInjectionDate.trim() || null,
              transfer_current_medications_details: formatTransferMeds,
              last_injection_timing: "exact_date",
              last_injection_date:
                state.transferWlMedication.lastInjectionDate.trim() || null,
            }
          : {}),
        ...(isExplicitTransferJourney
          ? {
              transfer_continuation_questionnaire: true,
              transfer_patient_declaration: state.transferPatientDeclaration,
              new_to_injectables: "no",
              changing_from_provider: "yes",
            }
          : {}),
        ...(showsContinuationBlock(submitConsultationType)
          ? {
              transfer_side_effects: state.transferSideEffects,
              transfer_side_effects_details:
                state.transferSideEffects === "yes"
                  ? state.transferSideEffectsDetails.trim()
                  : null,
              transfer_hospitalised_wl_medication:
                state.transferHospitalisedWlMedication,
              transfer_hospitalisation_details:
                state.transferHospitalisedWlMedication === "yes"
                  ? state.transferHospitalisationDetails.trim()
                  : null,
            }
          : {}),
        selected_plan: state.selectedPlan,
        addons: Object.entries(state.addOns).filter(([, q]) => q > 0).map(([id, q]) => ({ id, qty: q })),
        patient_documents: Object.fromEntries(
          Object.entries(patientDocs).filter(([, url]) => Boolean(url)),
        ) as Record<PatientDocSlot, string>,
        patient_documents_uploaded_at: Object.fromEntries(
          Object.entries(patientDocs)
            .filter(([, url]) => Boolean(url))
            .map(([slot]) => [slot, new Date().toISOString()]),
        ),
      };

      const contactOk =
        state.fullName.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(state.email) &&
        (isLoggedIn || state.phone.trim().length >= 7);
      if (!contactOk) {
        toast({
          title: "Contact details required",
          description: isLoggedIn
            ? "We couldn't load your account details. Sign in again from My Account, then retry."
            : "Please go back and enter your name, email and phone.",
          variant: "destructive",
        });
        setSubmitting(false);
        go(isLoggedIn ? 3 : CONTACT_STEP);
        return;
      }

      if (!state.selectedPlan) {
        toast({
          title: "Select a treatment plan",
          description:
            "Please go back and choose your Mounjaro or Wegovy pens before submitting.",
          variant: "destructive",
        });
        setSubmitting(false);
        go(13);
        return;
      }

      if (state.dob) {
        const dobCheck = new Date(state.dob);
        if (Number.isNaN(dobCheck.getTime())) {
          toast({
            title: "Check your date of birth",
            description: "Enter a valid date of birth, then try again.",
            variant: "destructive",
          });
          setSubmitting(false);
          go(isLoggedIn ? 3 : CONTACT_STEP);
          return;
        }
      }

      const sexForApi: "male" | "female" | "other" =
        state.assignedSex === "male"
          ? "male"
          : state.assignedSex === "female"
            ? "female"
            : "other";

      const prescriptionItems = prescriptionItemsFromPlan(state.selectedPlan);

      const created = await apiFetch<{
        id: string;
        consultationNumber?: string;
      }>("/api/consultations", {
        method: "POST",
        auth: "patient",
        body: JSON.stringify({
          conditionId: "weight-loss",
          previousConsultationId: repeatOfId ?? undefined,
          patientName: state.fullName.trim(),
          patientEmail: state.email.trim(),
          patientAge: ageYears ?? 0,
          patientSex: sexForApi,
          allergies:
            state.glp1Allergy === "yes"
              ? "GLP-1 allergy history reported"
              : "None",
          currentMedications:
            isTransferFlow && formatTransferMeds.length > 0
              ? formatTransferMeds
                  .map((m) => {
                    const base = `${m.medication} ${m.strength}`;
                    const inj = (m as { last_injection?: string }).last_injection;
                    return inj ? `${base} — last injection ${inj}` : base;
                  })
                  .join("; ")
              : formatMeds.length > 0
                ? formatMeds
                    .map((m) => `${m.medication} (${m.for_condition})`)
                    .join("; ")
                : state.takingMeds === "yes"
                  ? "Medications reported — see consultation answers"
                  : "None",
          medicalHistory:
            [...formatDiagnosed, ...formatHealth].length > 0
              ? [
                  ...formatDiagnosed.map((d) => d.condition),
                  ...formatHealth.map((h) => h.condition),
                ].join("; ")
              : "None reported",
          answers: clinicalAnswers,
          hasPhoto: Object.values(patientDocs).some(Boolean),
          verifiedHeightCm:
            Number.isFinite(metrics.heightCm) && metrics.heightCm > 0
              ? Math.round(metrics.heightCm)
              : undefined,
          verifiedWeightKg:
            Number.isFinite(metrics.weightKg) && metrics.weightKg > 0
              ? Math.round(metrics.weightKg * 10) / 10
              : undefined,
          bmi: bmi != null ? Math.round(bmi) : undefined,
          gpName: state.gpName.trim() || undefined,
          gpAddress: state.gpAddress.trim() || undefined,
          hasRegularGp: state.gpConsent !== "no",
          consentShareWithGp: state.gpConsent === "yes",
          consentToTreatment: state.agreement === "yes",
          consentToDelivery: true,
          consentDataProcessing: true,
          prescriptionItems,
        }),
      });

      if (!isLoggedIn) {
        try {
          const reg = await apiFetch<{
            token: string;
            patientId: string;
            name: string;
            email: string;
            phone?: string | null;
            dateOfBirth?: string | null;
            sex?: string | null;
          }>("/api/auth/patient-register", {
            method: "POST",
            body: JSON.stringify({
              name: state.fullName.trim(),
              email: state.email.trim(),
              password: state.accountPassword,
              phone: state.phone.trim() || undefined,
              dateOfBirth: state.dob || undefined,
              sex: sexForApi,
            }),
          });
          savePatientSession({
            ...reg,
            phone: state.phone.trim() || reg.phone,
            dateOfBirth: state.dob || reg.dateOfBirth,
            sex: sexForApi,
          });
          setIsLoggedIn(true);
        } catch (regErr) {
          const msg =
            regErr instanceof Error ? regErr.message : "Registration failed";
          if (msg.toLowerCase().includes("already exists")) {
            toast({
              title: "Consultation submitted",
              description:
                "An account with this email already exists — sign in to view your consultation and upload documents.",
            });
            navigate("/my-account/login");
            return;
          }
          toast({
            title: "Consultation submitted",
            description:
              "We could not create your portal account. Register from My Account to track your order.",
            variant: "destructive",
          });
          navigate("/my-account/register");
          return;
        }
      }

      const pendingDocs = [
        !patientDocs["weight-scale-video"] && "weight on scales",
        isPreviousPrescriptionRequired(uploadAnswersPreview) &&
          !patientDocs["previous-prescription"] &&
          "previous prescription",
        isPreviousBmiVerificationRequired(uploadAnswersPreview) &&
          !patientDocs["previous-bmi-verification"] &&
          "previous BMI verification",
        state.excludingConditions === "yes" &&
          !patientDocs["supporting-evidence"] &&
          "supporting evidence",
      ].filter(Boolean) as string[];

      const orderNumber =
        created.consultationNumber?.trim() ||
        `#${created.id.replace(/-/g, "").toUpperCase().slice(-8)}`;

      toast({
        title: "Consultation submitted",
        description:
          pendingDocs.length > 0
            ? `Order ${orderNumber}. You can upload ${pendingDocs.join(", ")} anytime from My consultations.`
            : isLoggedIn
              ? `Order ${orderNumber}. Our pharmacist prescriber will review and email you within a few hours.`
              : `Order ${orderNumber}. Your patient portal account is ready — our pharmacist will review your consultation shortly.`,
      });
      navigate("/my-consultations");
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const shellTotal = flowTotalSteps(isLoggedIn);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-background">
        <AnimatePresence mode="wait">
          {/* ───── Step 1 — Eligibility / Intro */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-xl mx-auto px-5 pt-8 pb-20"
            >
              <Link
                href="/treatments/weight-loss"
                className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Weight-loss treatments
              </Link>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Clinical consultation
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-secondary md:text-4xl">
                Weight-loss assessment
              </h1>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
                A pharmacist-led consultation to check your eligibility for
                injectable weight-loss treatment. Free to start — you are not
                committed until you choose a plan.
              </p>

              <ul className="mt-10 space-y-3">
                {[
                  {
                    icon: Clock,
                    title: "About 3 minutes",
                    desc: "Progress is saved automatically if you need a break.",
                  },
                  {
                    icon: Stethoscope,
                    title: "Reviewed by a UK prescriber",
                    desc: "Every consultation is checked by a GPhC-registered pharmacist.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Regulated UK pharmacy",
                    desc: "GPhC 9011677 · encrypted · discreet delivery.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="flex gap-4 rounded-2xl border border-stone-200/90 bg-card px-4 py-4 shadow-sm"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-secondary">{item.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Button
                  onClick={() => go(isLoggedIn ? 3 : 2)}
                  size="lg"
                  className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
                  data-testid="button-start-consultation"
                >
                  Start consultation
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
                <div className="mt-5">
                  <TrustRow />
                </div>
              </div>
            </motion.div>
          )}

          {/* ───── Step 2 — Contact (guests only) */}
          {!isLoggedIn && step === 2 && (
            <StepShell
              step={flowStepNumber(2, isLoggedIn)}
              totalSteps={shellTotal}
              label="Contact"
              icon={<User className="w-6 h-6" />}
              title="Your contact details"
              subtitle="We'll use these to keep you updated about your consultation."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <div className="rounded-2xl bg-white border border-stone-200 p-4 text-sm text-foreground/80">
                <p className="text-sm mb-2">
                  <span className="font-bold text-[#0E3D2D]">Why do we need this?</span>{" "}
                  <span className="text-muted-foreground">Your email and phone help us:</span>
                </p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0E3D2D] mt-2 shrink-0" /> Send prescription updates & tracking info</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0E3D2D] mt-2 shrink-0" /> Reach you if our prescribing team has any questions</li>
                  <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0E3D2D] mt-2 shrink-0" /> Save your progress so you can pick up where you left off anytime</li>
                </ul>
              </div>
              <SectionCard>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="font-semibold text-secondary">Full name *</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName" placeholder="Your full legal name"
                        value={state.fullName} onChange={(e) => update("fullName", e.target.value)}
                        className="h-12 pl-10 rounded-xl"
                        data-testid="input-fullname"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="font-semibold text-secondary">Email address *</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email" type="email" placeholder="you@email.com"
                        value={state.email} onChange={(e) => update("email", e.target.value)}
                        className="h-12 pl-10 rounded-xl"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="font-semibold text-secondary">Phone number *</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone" type="tel" placeholder="07700 900000"
                        value={state.phone} onChange={(e) => update("phone", e.target.value)}
                        className="h-12 pl-10 rounded-xl"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
              <div className="rounded-2xl bg-white border border-stone-200 p-4 text-sm">
                <p className="font-bold text-[#0E3D2D] mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0E3D2D]" /> Your data is protected
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" /> 256-bit SSL encryption</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" /> GDPR compliant data handling</li>
                  <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-stone-400 mt-2 shrink-0" /> We never share your details with third parties</li>
                </ul>
              </div>
            </StepShell>
          )}

          {/* ───── Step 3 — Journey */}
          {step === 3 && (
            <StepShell
              step={flowStepNumber(3, isLoggedIn)}
              totalSteps={shellTotal}
              label="BMI Check"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="BMI Assessment"
              subtitle="Let's calculate your BMI to confirm your eligibility"
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <p className="text-center text-sm font-bold text-[#0E3D2D]">Where are you in your weight loss journey?</p>
              <RadioRow icon={<UserPlus className="w-5 h-5" />} title="New Patient" subtitle="Starting Treatment"
                selected={state.journey === "new"}
                onSelect={() =>
                  setState((s) => ({
                    ...s,
                    journey: "new",
                    newToInjectables: null,
                    changingProvider: null,
                    lastInjectionTiming: null,
                    lastInjectionDate: "",
                    ...emptyTransferQuestionnaireFields(),
                  }))
                }
                testId="journey-new"
              />
              <RadioRow icon={<Upload className="w-5 h-5" />} title="Existing Patient" subtitle="Reorder Your Next Dose"
                selected={state.journey === "existing"}
                onSelect={() =>
                  setState((s) => ({
                    ...s,
                    journey: "existing",
                    newToInjectables: "no",
                    changingProvider: null,
                    lastInjectionTiming: null,
                    lastInjectionDate: "",
                    repeatMedicationLocked: false,
                  }))
                }
                testId="journey-existing"
              />
              <RadioRow icon={<ExternalLink className="w-5 h-5" />} title="Transferring" subtitle="From Another Provider"
                selected={state.journey === "transferring"}
                onSelect={() =>
                  setState((s) => ({
                    ...s,
                    journey: "transferring",
                    newToInjectables: "no",
                    changingProvider: "yes",
                    lastInjectionTiming: null,
                    lastInjectionDate: "",
                    ...emptyTransferQuestionnaireFields(),
                  }))
                }
                testId="journey-transferring"
              />

            </StepShell>
          )}

          {/* ───── Step 4 — Ethnicity */}
          {step === 4 && (
            <StepShell
              step={flowStepNumber(4, isLoggedIn)}
              totalSteps={shellTotal}
              label="Ethnicity"
              icon={<User className="w-6 h-6" />}
              title="Ethnicity"
              subtitle="We ask for this to help us accurately assess your eligibility — South Asian, Black African and Caribbean patients have lower BMI thresholds for cardiometabolic risk."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              {([
                ["asian", "Asian or Asian British"],
                ["black", "Black, African, Caribbean or Black British"],
                ["middle-eastern", "Middle Eastern"],
                ["mixed", "Mixed or multiple ethnicities"],
                ["white", "White"],
                ["other", "Other ethnic group"],
                ["prefer-not-to-say", "Prefer not to say"],
              ] as [Ethnicity, string][]).map(([val, label]) => (
                <RadioRow key={val}
                  selected={state.ethnicity === val} onSelect={() => update("ethnicity", val)}
                  title={label} testId={`ethnicity-${val}`}
                />
              ))}
            </StepShell>
          )}

          {/* ───── Step 5 — BMI Measurements */}
          {step === 5 && (
            <StepShell
              step={flowStepNumber(5, isLoggedIn)}
              totalSteps={shellTotal}
              label="BMI Check"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="BMI Assessment"
              subtitle="We'll calculate your BMI to determine your eligibility."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <SectionCard>
                <div className="space-y-5">
                  <DateField
                    label="Date of birth *"
                    value={state.dob}
                    onChange={(v) => update("dob", v)}
                    max={new Date().toISOString().slice(0, 10)}
                    min="1920-01-01"
                    hint="Used to confirm you are aged 18–75 for online prescribing."
                    placeholder="DD/MM/YYYY"
                  />

                  <div>
                    <Label className="font-semibold text-secondary">Your height *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 mb-2">
                      {(["cm", "ftin"] as UnitHeight[]).map((u) => (
                        <button key={u} type="button"
                          onClick={() => update("heightUnit", u)}
                          className={`h-11 rounded-xl font-semibold text-sm transition-colors ${
                            state.heightUnit === u ? "bg-[#0E3D2D] text-white" : "bg-[#D4EFE2] text-[#0E3D2D]"
                          }`}
                          data-testid={`unit-height-${u}`}
                        >
                          {u === "cm" ? "cm" : "ft/in"}
                        </button>
                      ))}
                    </div>
                    {state.heightUnit === "cm" ? (
                      <Input type="number" placeholder="cm" value={state.heightCm}
                        onChange={(e) => update("heightCm", e.target.value)}
                        className="h-12 rounded-xl" data-testid="input-height-cm"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="ft" value={state.heightFt}
                          onChange={(e) => update("heightFt", e.target.value)}
                          className="h-12 rounded-xl" data-testid="input-height-ft"
                        />
                        <Input type="number" placeholder="in" value={state.heightIn}
                          onChange={(e) => update("heightIn", e.target.value)}
                          className="h-12 rounded-xl" data-testid="input-height-in"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-semibold text-secondary">Your weight *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 mb-2">
                      {(["kg", "stlbs"] as UnitWeight[]).map((u) => (
                        <button key={u} type="button"
                          onClick={() => update("weightUnit", u)}
                          className={`h-11 rounded-xl font-semibold text-sm transition-colors ${
                            state.weightUnit === u ? "bg-[#0E3D2D] text-white" : "bg-[#D4EFE2] text-[#0E3D2D]"
                          }`}
                          data-testid={`unit-weight-${u}`}
                        >
                          {u === "kg" ? "kg" : "st/lbs"}
                        </button>
                      ))}
                    </div>
                    {state.weightUnit === "kg" ? (
                      <Input type="number" placeholder="kg" value={state.weightKg}
                        onChange={(e) => update("weightKg", e.target.value)}
                        className="h-12 rounded-xl" data-testid="input-weight-kg"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="st" value={state.weightSt}
                          onChange={(e) => update("weightSt", e.target.value)}
                          className="h-12 rounded-xl" data-testid="input-weight-st"
                        />
                        <Input type="number" placeholder="lbs" value={state.weightLbs}
                          onChange={(e) => update("weightLbs", e.target.value)}
                          className="h-12 rounded-xl" data-testid="input-weight-lbs"
                        />
                      </div>
                    )}
                  </div>

                  {bmi !== null && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-secondary">Your BMI</span>
                      <span className="text-2xl font-extrabold text-primary tabular-nums" data-testid="bmi-readout">
                        {bmi.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </SectionCard>
            </StepShell>
          )}

          {/* Step 6 — PMR basics for every journey (new_start, transfer, simple_repeat):
              medical history, high-risk meds, lifestyle — same checklist for all paths. */}
          {step === 6 && (
            <StepShell
              step={flowStepNumber(6, isLoggedIn)}
              totalSteps={shellTotal}
              label="Health & lifestyle"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="Health & lifestyle"
              subtitle="A few standard questions help our pharmacists review your safety — the same information we keep on your patient record."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <div className="space-y-5">
                <SectionCard>
                  <MedicalHistorySection
                    slice={state.pmrHealth}
                    onChange={(pmrHealth) =>
                      setState((s) => ({ ...s, pmrHealth }))
                    }
                  />
                </SectionCard>
                <SectionCard>
                  <HighRiskMedicationsSection
                    taken={state.transferHighRiskMedsTaken}
                    onTakenChange={(v) =>
                      setState((s) => ({
                        ...s,
                        transferHighRiskMedsTaken: v,
                        ...(v === "no"
                          ? {
                              transferHighRiskMedsSelected: [],
                              transferHighRiskMedDetails: [],
                            }
                          : {}),
                      }))
                    }
                    selected={state.transferHighRiskMedsSelected}
                    onSelectedChange={(transferHighRiskMedsSelected) =>
                      setState((s) => ({ ...s, transferHighRiskMedsSelected }))
                    }
                    details={state.transferHighRiskMedDetails}
                    onDetailsChange={(transferHighRiskMedDetails) =>
                      setState((s) => ({ ...s, transferHighRiskMedDetails }))
                    }
                  />
                </SectionCard>
                <SectionCard>
                  <PmrLifestyleQuestionnaire
                    slice={state.pmrHealth}
                    onChange={(pmrHealth) =>
                      setState((s) => ({ ...s, pmrHealth }))
                    }
                  />
                </SectionCard>
              </div>
            </StepShell>
          )}

          {/* ───── Step 7 — Your Health */}
          {step === 7 && (
            <StepShell
              step={flowStepNumber(7, isLoggedIn)}
              totalSteps={shellTotal}
              label="Your Health"
              icon={<Heart className="w-6 h-6" />}
              title="Your Health"
              subtitle="Please answer these questions honestly to ensure your safety."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">What sex were you assigned at birth? *</p>
                <div className="space-y-2.5">
                  {([
                    ["male", "Male"], ["female", "Female"], ["prefer-not-to-say", "Prefer not to say"],
                  ] as [AssignedSex, string][]).map(([val, label]) => (
                    <RadioRow key={val}
                      selected={state.assignedSex === val}
                      onSelect={() => {
                        setState((s) => ({
                          ...s,
                          assignedSex: val,
                          ...(val === "male"
                            ? { pregnant: null, oralContraceptive: null }
                            : {}),
                        }));
                      }}
                      title={label} testId={`assignedSex-${val}`}
                    />
                  ))}
                </div>
              </SectionCard>

              {[
                { key: "ageBracket", q: "Are you aged between 18 and 75? *" },
                ...(asksFemaleHealthQuestions(state.assignedSex)
                  ? [
                      {
                        key: "pregnant",
                        q: "Are you currently pregnant, breastfeeding, or planning to become pregnant or breastfeed while using this medication? *",
                      },
                    ]
                  : []),
                {
                  key: "glp1Allergy",
                  q: "Have you ever had an allergic reaction to Wegovy, Mounjaro, Ozempic, Saxenda, or other GLP-1 medications? *",
                },
                {
                  key: "thyroidHistory",
                  q: "Do you or a family member have a history of medullary thyroid cancer or MEN2? *",
                },
                {
                  key: "eatingDisorder",
                  q: "Have you ever had an eating disorder (e.g. anorexia, bulimia)? *",
                },
              ].map(({ key, q }) => (
                <SectionCard key={key}>
                  <p className="font-semibold text-secondary mb-3">{q}</p>
                  <YesNoChoice
                    value={state[key as keyof FormState] as YesNo | null}
                    onChange={(v) => update(key as keyof FormState, v as never)}
                    testIdPrefix={key}
                  />
                </SectionCard>
              ))}
            </StepShell>
          )}

          {/* ───── Step 8 — Medical Conditions */}
          {step === 8 && (
            <StepShell
              step={flowStepNumber(8, isLoggedIn)}
              totalSteps={shellTotal}
              label="Medical Conditions"
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Medical Conditions"
              subtitle="Help us understand your medical history."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <SectionCard>
                <ExcludingConditionsSection
                  excludingConditions={state.excludingConditions}
                  onExcludingConditionsChange={(v) => {
                    setState((s) => ({
                      ...s,
                      excludingConditions: v,
                      diagnosedConditions:
                        v === "no" ? [] : s.diagnosedConditions,
                    }));
                  }}
                  diagnosedConditions={state.diagnosedConditions}
                  onDiagnosedConditionsChange={(diagnosedConditions) =>
                    setState((s) => ({ ...s, diagnosedConditions }))
                  }
                />
              </SectionCard>

              <SectionCard>
                <TransferOtherMedicalConditionsSection
                  hasConditions={state.transferOtherMedicalConditions}
                  onHasConditionsChange={(v) =>
                    setState((s) => ({
                      ...s,
                      transferOtherMedicalConditions: v,
                      ...(v === "no"
                        ? {
                            transferOtherMedicalConditionsDetails: "",
                            transferOtherConditionsMeds: null,
                            transferOtherConditionsMedsDetails: "",
                          }
                        : {}),
                    }))
                  }
                  conditionsDetails={state.transferOtherMedicalConditionsDetails}
                  onConditionsDetailsChange={(transferOtherMedicalConditionsDetails) =>
                    update(
                      "transferOtherMedicalConditionsDetails",
                      transferOtherMedicalConditionsDetails,
                    )
                  }
                  takesMedications={state.transferOtherConditionsMeds}
                  onTakesMedicationsChange={(transferOtherConditionsMeds) =>
                    setState((s) => ({
                      ...s,
                      transferOtherConditionsMeds,
                      ...(transferOtherConditionsMeds === "no"
                        ? { transferOtherConditionsMedsDetails: "" }
                        : {}),
                    }))
                  }
                  medicationNames={state.transferOtherConditionsMedsDetails}
                  onMedicationNamesChange={(transferOtherConditionsMedsDetails) =>
                    update(
                      "transferOtherConditionsMedsDetails",
                      transferOtherConditionsMedsDetails,
                    )
                  }
                />
              </SectionCard>
            </StepShell>
          )}

          {/* ───── Step 9 — Branch: continuation (transfer/repeat) or new-patient medication */}
          {step === 9 && (
            <StepShell
              step={flowStepNumber(9, isLoggedIn)}
              totalSteps={shellTotal}
              label="Medication"
              icon={<PillIcon className="w-6 h-6" />}
              title={
                showsContinuationBlock(consultationType)
                  ? "Continuation & safety"
                  : "Medication"
              }
              subtitle={
                showsContinuationBlock(consultationType)
                  ? "Since your last review — then confirm your current treatment where needed."
                  : "Tell us about your current and past medications."
              }
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              {showsTransferMedicationPicker(consultationType) ? (
                <>
                  <SectionCard>
                    <WlContinuationSafetySection
                      sideEffects={state.transferSideEffects}
                      onSideEffectsChange={(v) =>
                        setState((s) => ({
                          ...s,
                          transferSideEffects: v,
                          ...(v === "no"
                            ? { transferSideEffectsDetails: "" }
                            : {}),
                        }))
                      }
                      sideEffectsDetails={state.transferSideEffectsDetails}
                      onSideEffectsDetailsChange={(transferSideEffectsDetails) =>
                        update("transferSideEffectsDetails", transferSideEffectsDetails)
                      }
                      hospitalised={state.transferHospitalisedWlMedication}
                      onHospitalisedChange={(v) =>
                        setState((s) => ({
                          ...s,
                          transferHospitalisedWlMedication: v,
                          ...(v === "no"
                            ? { transferHospitalisationDetails: "" }
                            : {}),
                        }))
                      }
                      hospitalisationDetails={state.transferHospitalisationDetails}
                      onHospitalisationDetailsChange={(transferHospitalisationDetails) =>
                        update(
                          "transferHospitalisationDetails",
                          transferHospitalisationDetails,
                        )
                      }
                      changesSinceReview={state.transferHealthChangesSinceReview}
                      onChangesSinceReviewChange={(v) =>
                        setState((s) => ({
                          ...s,
                          transferHealthChangesSinceReview: v,
                          ...(v === "no"
                            ? { transferHealthChangesSinceReviewDetails: "" }
                            : {}),
                        }))
                      }
                      changesSinceReviewDetails={
                        state.transferHealthChangesSinceReviewDetails
                      }
                      onChangesSinceReviewDetailsChange={(
                        transferHealthChangesSinceReviewDetails,
                      ) =>
                        update(
                          "transferHealthChangesSinceReviewDetails",
                          transferHealthChangesSinceReviewDetails,
                        )
                      }
                    />
                  </SectionCard>

                  <SectionCard>
                    <p className="font-semibold text-secondary mb-1">
                      What weight loss injection or medication are you currently taking from your previous provider? *
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose Wegovy or Mounjaro, your strength, and when your last (or next) dose is due.
                    </p>
                    <TransferWeightLossMedicationPicker
                      value={state.transferWlMedication}
                      onChange={(transferWlMedication) =>
                        setState((s) => ({ ...s, transferWlMedication }))
                      }
                    />
                  </SectionCard>
                </>
              ) : consultationType === "simple_repeat" ? (
                <>
                  {state.repeatMedicationLocked && wlMedicationLabel(state.transferWlMedication) && (
                    <SectionCard>
                      <p className="font-semibold text-secondary mb-1">
                        Your current treatment
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        We already have this from your previous order — you do not need to
                        choose a product again.
                      </p>
                      <p
                        className="text-lg font-bold text-[#0E3D2D]"
                        data-testid="repeat-known-medication"
                      >
                        {wlMedicationLabel(state.transferWlMedication)}
                      </p>
                    </SectionCard>
                  )}

                  <SectionCard>
                    <WlContinuationSafetySection
                      sideEffects={state.transferSideEffects}
                      onSideEffectsChange={(v) =>
                        setState((s) => ({
                          ...s,
                          transferSideEffects: v,
                          ...(v === "no"
                            ? { transferSideEffectsDetails: "" }
                            : {}),
                        }))
                      }
                      sideEffectsDetails={state.transferSideEffectsDetails}
                      onSideEffectsDetailsChange={(transferSideEffectsDetails) =>
                        update("transferSideEffectsDetails", transferSideEffectsDetails)
                      }
                      hospitalised={state.transferHospitalisedWlMedication}
                      onHospitalisedChange={(v) =>
                        setState((s) => ({
                          ...s,
                          transferHospitalisedWlMedication: v,
                          ...(v === "no"
                            ? { transferHospitalisationDetails: "" }
                            : {}),
                        }))
                      }
                      hospitalisationDetails={state.transferHospitalisationDetails}
                      onHospitalisationDetailsChange={(transferHospitalisationDetails) =>
                        update(
                          "transferHospitalisationDetails",
                          transferHospitalisationDetails,
                        )
                      }
                      changesSinceReview={state.transferHealthChangesSinceReview}
                      onChangesSinceReviewChange={(v) =>
                        setState((s) => ({
                          ...s,
                          transferHealthChangesSinceReview: v,
                          ...(v === "no"
                            ? { transferHealthChangesSinceReviewDetails: "" }
                            : {}),
                        }))
                      }
                      changesSinceReviewDetails={
                        state.transferHealthChangesSinceReviewDetails
                      }
                      onChangesSinceReviewDetailsChange={(
                        transferHealthChangesSinceReviewDetails,
                      ) =>
                        update(
                          "transferHealthChangesSinceReviewDetails",
                          transferHealthChangesSinceReviewDetails,
                        )
                      }
                      showSideEffects={false}
                    />
                  </SectionCard>

                  <div className="mt-2 space-y-5">
                    <SimpleRepeatQuestionnaire
                      section="screening"
                      state={state.simpleRepeat}
                      onChange={(simpleRepeat) =>
                        setState((s) => ({ ...s, simpleRepeat }))
                      }
                    />

                    <div className="space-y-2 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                      <p className="text-sm font-semibold text-secondary">
                        Side effects since your last order *
                      </p>
                      <RadioRow
                        selected={state.repeatSideEffectsAny === "yes"}
                        onSelect={() => update("repeatSideEffectsAny", "yes")}
                        title="Yes — I have had side effects"
                        testId="repeat-side-effects-yes"
                      />
                      <RadioRow
                        selected={state.repeatSideEffectsAny === "no"}
                        onSelect={() => {
                          update("repeatSideEffectsAny", "no");
                          update("repeatSideEffectsHospital", "no");
                          update("repeatSideEffectsVomiting", "no");
                          update("repeatSideEffectsInjection", "no");
                        }}
                        title="No side effects"
                        testId="repeat-side-effects-no"
                      />
                    </div>

                    {state.repeatSideEffectsAny === "yes" && (
                      <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                        <p className="text-xs font-semibold text-amber-900">
                          Please answer all of the following:
                        </p>
                        {(
                          [
                            [
                              "repeatSideEffectsHospital",
                              "Hospitalisation since your last order?",
                            ],
                            [
                              "repeatSideEffectsVomiting",
                              "Vomiting or diarrhoea?",
                            ],
                            [
                              "repeatSideEffectsInjection",
                              "Injection site reactions?",
                            ],
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key} className="flex flex-wrap gap-2">
                            <span className="w-full text-sm font-medium text-stone-800">
                              {label}
                            </span>
                            {(["yes", "no"] as YesNo[]).map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => update(key, v)}
                                className={cn(
                                  "h-10 min-w-[5rem] rounded-xl px-4 text-sm font-semibold transition-colors",
                                  state[key] === v
                                    ? "bg-[#0E3D2D] text-white"
                                    : "bg-white border border-stone-200 text-stone-700",
                                )}
                                data-testid={`${key}-${v}`}
                              >
                                {v === "yes" ? "Yes" : "No"}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : showsNewPatientMedicationBlock(consultationType) ? (
              <>
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  Are you currently taking any prescribed, over-the-counter, or recreational drugs? *
                </p>
                <YesNoChoice
                  value={state.takingMeds}
                  onChange={(v) => {
                    setState((s) => ({
                      ...s,
                      takingMeds: v,
                      currentMedications:
                        v === "yes" && s.currentMedications.length === 0
                          ? [emptyMedicationEntry()]
                          : s.currentMedications,
                    }));
                  }}
                  testIdPrefix="takingMeds"
                />
                {state.takingMeds === "yes" && (
                  <CurrentMedicationsFollowUp
                    entries={state.currentMedications}
                    onChange={(currentMedications) =>
                      setState((s) => ({ ...s, currentMedications }))
                    }
                  />
                )}
              </SectionCard>

              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  Do you have any previous or current health conditions? *
                </p>
                <YesNoChoice
                  value={state.otherConditions}
                  onChange={(v) => {
                    setState((s) => ({
                      ...s,
                      otherConditions: v,
                      otherHealthHistory:
                        v === "yes" && s.otherHealthHistory.length === 0
                          ? [emptyHealthEntry()]
                          : s.otherHealthHistory,
                    }));
                  }}
                  testIdPrefix="otherConditions"
                />
                {state.otherConditions === "yes" && (
                  <OtherHealthHistoryFollowUp
                    entries={state.otherHealthHistory}
                    onChange={(otherHealthHistory) =>
                      setState((s) => ({ ...s, otherHealthHistory }))
                    }
                  />
                )}
              </SectionCard>

              {asksFemaleHealthQuestions(state.assignedSex) && (
                <SectionCard>
                  <p className="font-semibold text-secondary mb-3">
                    Are you taking an oral contraceptive? *
                  </p>
                  <YesNoChoice
                    value={state.oralContraceptive}
                    onChange={(v) => update("oralContraceptive", v)}
                    testIdPrefix="oralContraceptive"
                  />
                </SectionCard>
              )}

              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  Are you new to using injectable weight-loss medications? *
                </p>
                <YesNoChoice
                  value={state.newToInjectables}
                  onChange={(v) => {
                    setState((s) => ({
                      ...s,
                      newToInjectables: v,
                      ...(v === "yes"
                        ? {
                            changingProvider: null,
                            lastInjectionTiming: null,
                            lastInjectionDate: "",
                            ...emptyTransferQuestionnaireFields(),
                          }
                        : {}),
                    }));
                  }}
                  testIdPrefix="newToInjectables"
                />
                {state.newToInjectables === "no" && (
                  <>
                    <InjectablesFollowUp
                      changingProvider={state.changingProvider}
                      onChangingProvider={(changingProvider) =>
                        setState((s) => ({
                          ...s,
                          changingProvider,
                          ...(changingProvider === "yes"
                            ? {
                                journey: "transferring",
                                lastInjectionTiming: null,
                                lastInjectionDate: "",
                              }
                            : changingProvider === "no"
                              ? {
                                  ...emptyTransferQuestionnaireFields(),
                                  lastInjectionTiming: null,
                                  lastInjectionDate: "",
                                }
                              : {
                                  lastInjectionTiming: null,
                                  lastInjectionDate: "",
                                }),
                        }))
                      }
                      lastInjectionTiming={state.lastInjectionTiming}
                      onLastInjectionTiming={(lastInjectionTiming) =>
                        setState((s) => ({
                          ...s,
                          lastInjectionTiming,
                          ...(lastInjectionTiming !== "exact_date"
                            ? { lastInjectionDate: "" }
                            : {}),
                        }))
                      }
                      lastInjectionDate={state.lastInjectionDate}
                      onLastInjectionDate={(lastInjectionDate) =>
                        update("lastInjectionDate", lastInjectionDate)
                      }
                      showLastInjection={state.changingProvider !== "yes"}
                    />
                    {state.changingProvider === "yes" && (
                      <p className="mt-4 text-sm text-muted-foreground rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                        Switching from another provider? Go back and choose{" "}
                        <strong>Transferring</strong> on the journey step — that
                        questionnaire collects your previous treatment details.
                      </p>
                    )}
                  </>
                )}
              </SectionCard>
              </>
              ) : null}
            </StepShell>
          )}

          {/* ───── Step 10 — Agreement */}
          {step === 10 && (
            <StepShell
              step={flowStepNumber(10, isLoggedIn)}
              totalSteps={shellTotal}
              label="Agreement"
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Agreement"
              subtitle="Please read and confirm you agree to proceed."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">By proceeding, I confirm and agree to the following: *</p>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground/80 space-y-3 mb-4">
                  {[
                    "All information I have provided is true and accurate to the best of my knowledge.",
                    "I understand that providing false information may put my health at serious risk.",
                    "I am over 18 years of age and ordering for myself.",
                    "I will read the patient information leaflet supplied with my medicine.",
                    "I consent to a pharmacist independent prescriber reviewing my consultation.",
                    "I understand my consultation may be declined if the prescriber considers treatment unsuitable.",
                    "I will store my medicine according to the storage instructions (refrigerate Mounjaro / Wegovy).",
                    "I will dispose of needles and pens in a sharps container, not in household waste.",
                    "I agree to participate in a video, photo or telephone verification (e.g. weighing-scale check) if requested — particularly for first orders, doses higher than starter, or after an 8-week gap.",
                    "I give permission for PharmaCare to access my NHS Summary Care Record or request medical history from my GP if required.",
                    "I consent to PharmaCare contacting my GP about this prescription where clinically appropriate. If the SCR is unavailable, I agree to participate in two-way communication (phone, secure message, video) to verify my history. If I do not respond, my order will be cancelled.",
                  ].map((line, i) => (
                    <p key={i} className="flex gap-3">
                      <span className="font-bold text-primary tabular-nums shrink-0">{i + 1}</span>
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
                <YesNoChoice value={state.agreement} onChange={(v) => update("agreement", v)} testIdPrefix="agreement" />
                {state.agreement === "no" && (
                  <p className="text-sm text-rose-600 mt-3">
                    We can't issue a prescription without your agreement. Please tap "Yes" to continue, or contact our team for support.
                  </p>
                )}
              </SectionCard>
              {consultationType === "transfer" && (
                <SectionCard>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.transferPatientDeclaration}
                      onChange={(e) =>
                        update("transferPatientDeclaration", e.target.checked)
                      }
                      className="mt-1 h-5 w-5 rounded border-stone-300 text-[#0E3D2D] focus:ring-[#0E3D2D]"
                      data-testid="transfer-patient-declaration"
                    />
                    <span className="text-sm text-secondary leading-relaxed">
                      <strong>Patient declaration:</strong> I confirm that all information
                      provided in this continuation-dose transfer questionnaire is complete
                      and accurate to the best of my knowledge. *
                    </span>
                  </label>
                </SectionCard>
              )}
              {isRepeatFlow && (
                <SectionCard>
                  <SimpleRepeatQuestionnaire
                    section="declaration"
                    state={state.simpleRepeat}
                    onChange={(simpleRepeat) =>
                      setState((s) => ({ ...s, simpleRepeat }))
                    }
                  />
                </SectionCard>
              )}
            </StepShell>
          )}

          {/* ───── Step 11 — GP Details */}
          {step === 11 && (
            <StepShell
              step={flowStepNumber(11, isLoggedIn)}
              totalSteps={shellTotal}
              label="GP Details"
              icon={<Stethoscope className="w-6 h-6" />}
              title="GP Information"
              subtitle="We need to contact your GP for your safety."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <div className="rounded-xl bg-white border border-stone-200 p-3 text-sm text-stone-600 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-[#0E3D2D]" /> Need help? Our team is here Mon-Fri 9am-5pm{" "}
                <a href="tel:03332070413" className="underline font-semibold text-[#0E3D2D]">0333 2070 413</a>
              </div>
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  I consent to PharmaCare contacting my GP and sharing information about my prescription. *
                </p>
                <YesNoChoice value={state.gpConsent} onChange={(v) => update("gpConsent", v)} testIdPrefix="gpConsent" />
                {state.gpConsent === "yes" && (
                  <div className="space-y-4 mt-5">
                    <div>
                      <Label htmlFor="gpName" className="font-semibold text-secondary">Practice / GP name *</Label>
                      <Input id="gpName" placeholder="Please specify..." value={state.gpName}
                        onChange={(e) => update("gpName", e.target.value)}
                        className="h-12 mt-1.5 rounded-xl" data-testid="input-gp-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gpAddress" className="font-semibold text-secondary">Practice / GP address *</Label>
                      <Input id="gpAddress" placeholder="Please specify..." value={state.gpAddress}
                        onChange={(e) => update("gpAddress", e.target.value)}
                        className="h-12 mt-1.5 rounded-xl" data-testid="input-gp-address"
                      />
                    </div>
                  </div>
                )}
              </SectionCard>
              <div className="rounded-xl border border-emerald-100 bg-accent/40 p-4 text-sm text-secondary">
                <p className="font-semibold mb-1">Why do we need this?</p>
                <p className="text-muted-foreground leading-relaxed">
                  For your safety, we share information about your prescription with
                  your GP to ensure continuity of care.
                </p>
              </div>
            </StepShell>
          )}

          {/* ───── Step 12 — Weight verification photo */}
          {step === 12 && (
            <StepShell
              step={flowStepNumber(12, isLoggedIn)}
              totalSteps={shellTotal}
              label="Verification"
              icon={<Upload className="w-6 h-6" />}
              title="Upload verification documents"
              subtitle="You can submit your order now and upload documents later from My consultations. Your pharmacist will be notified of anything still missing."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
              continueLabel="Continue to treatment plan"
            >
              <SectionCard>
                <div className="space-y-4">
                {visibleUploadSlots.map((slotId) => {
                  const meta = EVIDENCE_SLOT_META[slotId];
                  const req = uploadRequirements[slotId];
                  const url = patientDocs[slotId];
                  const inputId = `wl-doc-${slotId}`;
                  const isVideoUrl =
                    typeof url === "string" &&
                    (url.startsWith("data:video/") ||
                      /\.(mp4|webm|mov)(\?|#|$)/i.test(url));
                  return (
                    <div
                      key={slotId}
                      className="rounded-2xl border border-stone-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-secondary">
                            {meta.title}
                            {req === "required" ? (
                              <span className="ml-1 text-rose-600">*</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {meta.summary}
                          </p>
                          <EvidenceCriteriaList slotId={slotId} />
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            url
                              ? "bg-emerald-100 text-emerald-800"
                              : req === "not_required"
                                ? "bg-stone-100 text-stone-500"
                                : "bg-stone-100 text-stone-600",
                          )}
                        >
                          {url
                            ? "Uploaded"
                            : req === "not_required"
                              ? requirementLabel(req)
                              : "Not uploaded"}
                        </span>
                      </div>
                      {url ? (
                        <div className="relative mt-3 overflow-hidden rounded-xl border border-stone-200">
                          {isVideoUrl ? (
                            <video
                              src={url}
                              controls
                              playsInline
                              className="h-36 w-full bg-stone-900 object-contain"
                            />
                          ) : (
                            <img
                              src={url}
                              alt={meta.title}
                              className="h-36 w-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPatientDocs((prev) => ({
                                ...prev,
                                [slotId]: null,
                              }))
                            }
                            className="absolute right-1.5 top-1.5 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-rose-700 shadow"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor={inputId}
                          className="mt-3 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-[#0E3D2D]/25 bg-[#D4EFE2]/30 px-4 py-6 text-center transition-colors hover:border-[#0E3D2D]/45"
                        >
                          <Upload className="mb-2 h-8 w-8 text-[#0E3D2D]" />
                          <span className="text-sm font-semibold text-secondary">
                            Choose file
                          </span>
                          <span className="mt-0.5 text-xs text-muted-foreground">
                            {patientUploadFileHint(slotId)}
                          </span>
                          <input
                            id={inputId}
                            type="file"
                            accept={meta.accept}
                            className="sr-only"
                            onChange={(e) => {
                              handleSlotFile(slotId, e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
                {photoError && (
                  <p className="text-sm text-destructive">{photoError}</p>
                )}
                </div>
              </SectionCard>
              {state.excludingConditions === "yes" && (
                <p className="text-sm text-stone-600 -mt-2">
                  Upload supporting letters or notes if you have them — or add
                  them later from My consultations.
                </p>
              )}
              <div className="rounded-xl border border-emerald-100 bg-accent/40 p-4 text-sm text-secondary">
                <p className="font-semibold mb-1">Why we ask for this</p>
                <p className="leading-relaxed text-muted-foreground">
                  UK pharmacy regulations require us to verify weight before
                  prescribing GLP-1 medicines. Your uploads are reviewed only by our
                  clinical team. Missing items won&apos;t block submission — you can
                  complete them later in My consultations.
                </p>
              </div>
            </StepShell>
          )}

          {/* ───── Step 13 — Treatment plan (new + transfer pick; repeat uses prior plan) */}
          {step === 13 && (
            <StepShell
              step={flowStepNumber(13, isLoggedIn)}
              totalSteps={shellTotal}
              label="Treatment"
              icon={<Syringe className="w-6 h-6" />}
              title={
                skipsTreatmentPlanPicker(consultationType)
                  ? "Continuing your treatment"
                  : "Your injectable weight-loss prescription plan"
              }
              subtitle={
                skipsTreatmentPlanPicker(consultationType)
                  ? "Your next supply follows the plan from your previous order."
                  : "Select your Mounjaro or Wegovy treatment. Select a single pen or bundle that fits your goals."
              }
              onBack={back} onContinue={next} canContinue={canContinue}
              continueLabel="Continue to add-ons"
            >
              {skipsTreatmentPlanPicker(consultationType) && state.selectedPlan ? (
                <SectionCard>
                  <p className="text-sm text-muted-foreground mb-3">
                    You are reordering the same treatment plan — no need to pick pens again.
                  </p>
                  <ul className="space-y-2">
                    {state.selectedPlan.penIds.map((penId) => {
                      const pen = PEN_OPTIONS.find((p) => p.id === penId);
                      return pen ? (
                        <li
                          key={penId}
                          className="rounded-xl border border-stone-200 bg-[#F3F9F1] px-4 py-3 font-semibold text-[#0E3D2D]"
                          data-testid={`repeat-plan-pen-${penId}`}
                        >
                          {pen.label}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </SectionCard>
              ) : planRestriction?.blockedReason ? (
                <SectionCard>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary mb-1">
                        We can&apos;t restart your treatment online right now
                      </p>
                      <p className="text-sm text-foreground/80">
                        {planRestriction.blockedReason}
                      </p>
                    </div>
                  </div>
                </SectionCard>
              ) : (
                <PlanSelector
                  value={state.selectedPlan}
                  onChange={(p) => update("selectedPlan", p)}
                  starterOnly={consultationType === "new_start"}
                  restriction={planRestriction}
                />
              )}
            </StepShell>
          )}

          {/* ───── Step 14 — Add-ons (post-clinical upsell) */}
          {step === 14 && (
            <StepShell
              step={flowStepNumber(14, isLoggedIn)}
              totalSteps={shellTotal}
              label="Add-ons"
              icon={<Plus className="w-6 h-6" />}
              title="Popular add-ons"
              subtitle={
                isLoggedIn
                  ? "Power your treatment with additional services and supplements."
                  : "Optional extras, then create your patient portal to track this consultation."
              }
              onBack={back}
              onContinue={submit}
              canContinue={canContinue && !submitting}
              continueLabel={submitting ? "Submitting…" : "Submit for review"}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ADD_ONS.map((a) => (
                  <AddOnCard
                    key={a.id}
                    addon={a}
                    qty={state.addOns[a.id]}
                    onChange={(q) => update("addOns", { ...state.addOns, [a.id]: q })}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                You can also add these later from your account.
              </p>

              {!isLoggedIn && (
                <SectionCard>
                  <p className="font-semibold text-secondary mb-1 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#0E3D2D]" />
                    Create your patient portal
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use the contact details you entered earlier ({state.email || "your email"})
                    to track this consultation, upload documents, and message your pharmacist.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accountPassword" className="font-semibold text-secondary">
                        Password *
                      </Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="accountPassword"
                          type={showAccountPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          value={state.accountPassword}
                          onChange={(e) => update("accountPassword", e.target.value)}
                          className="h-12 pl-10 pr-10 rounded-xl"
                          data-testid="input-account-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAccountPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          aria-label={showAccountPassword ? "Hide password" : "Show password"}
                        >
                          {showAccountPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accountPasswordConfirm" className="font-semibold text-secondary">
                        Confirm password *
                      </Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="accountPasswordConfirm"
                          type={showAccountPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Re-enter password"
                          value={state.accountPasswordConfirm}
                          onChange={(e) =>
                            update("accountPasswordConfirm", e.target.value)
                          }
                          className="h-12 pl-10 rounded-xl"
                          data-testid="input-account-password-confirm"
                        />
                      </div>
                      {state.accountPasswordConfirm &&
                        state.accountPassword !== state.accountPasswordConfirm && (
                          <p className="text-xs text-rose-600 mt-1.5">
                            Passwords do not match
                          </p>
                        )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Already have an account?{" "}
                    <Link
                      href="/my-account/login"
                      className="font-semibold text-[#0E3D2D] underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </SectionCard>
              )}

              {isLoggedIn && (
                <div className="rounded-xl bg-[#D4EFE2]/60 border border-[#0E3D2D]/15 px-4 py-3 text-sm text-[#0E3D2D]">
                  Signed in as <strong>{state.fullName || state.email}</strong> — your
                  consultation will appear in My consultations after submit.
                </div>
              )}
            </StepShell>
          )}
          {/* ───── New-starter previous-use prompt (BMI below new-starter threshold) */}
          {step === 98 && (
            <motion.div
              key="previous-use-prompt"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto px-5 pt-8 pb-20"
            >
              <div className="mb-8">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <h1 className="font-serif text-2xl font-bold leading-tight text-secondary md:text-3xl">
                  A quick check before we continue
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                  {NEW_STARTER_PREVIOUS_USE_PROMPT}
                </p>
              </div>
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  Have you taken Mounjaro or Wegovy before? *
                </p>
                <div className="space-y-2.5">
                  <RadioRow
                    selected={priorUseAnswer === "yes"}
                    onSelect={() => {
                      setPriorUseAnswer("yes");
                      setRejectionMessage(null);
                      setState((s) => ({
                        ...s,
                        journey: "transferring",
                        newToInjectables: "no",
                        changingProvider: "yes",
                        lastInjectionTiming: null,
                        lastInjectionDate: "",
                        ...emptyTransferQuestionnaireFields(),
                      }));
                      go(9);
                    }}
                    title="Yes — I have taken Mounjaro or Wegovy before"
                    subtitle="We'll continue your treatment and ask for proof of your previous prescription and starting BMI."
                    testId="prior-use-yes"
                  />
                  <RadioRow
                    selected={priorUseAnswer === "no"}
                    onSelect={() => {
                      setPriorUseAnswer("no");
                      setRejectionMessage(NOT_SUITABLE_MESSAGE);
                      go(99);
                    }}
                    title="No — I have not taken either before"
                    testId="prior-use-no"
                  />
                </div>
              </SectionCard>
              <div className="mt-8">
                <Button
                  variant="outline"
                  onClick={back}
                  size="lg"
                  className="h-12 rounded-2xl"
                  data-testid="button-prior-use-back"
                >
                  Back to my answers
                </Button>
              </div>
            </motion.div>
          )}
          {/* ───── Ineligible screen */}
          {step === 99 && (
            <motion.div
              key="ineligible"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto px-5 pt-8 pb-20"
            >
              <div className="mb-8">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h1 className="font-serif text-2xl font-bold leading-tight text-secondary md:text-3xl">
                  Online treatment isn&apos;t appropriate right now
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                  Based on your answers, our prescribing safeguards mean we
                  can&apos;t issue this medicine through an online consultation.
                </p>
              </div>
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">Why we can't prescribe today</p>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {(rejectionMessage ? [rejectionMessage] : contraindicated).map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-xl bg-primary/5 border border-primary/15 p-4 text-sm text-foreground/80">
                  <p className="font-semibold text-secondary mb-1.5">What to do next</p>
                  <p>Please speak to your GP or NHS 111. If you'd like a pharmacist to call you back to discuss alternatives, message our team using the live-help bubble or email <a href="mailto:support@pharmacare.uk" className="text-primary font-semibold underline">support@pharmacare.uk</a>.</p>
                </div>
              </SectionCard>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={back} size="lg" className="flex-1 h-12 rounded-2xl" data-testid="button-ineligible-back">
                  Back to my answers
                </Button>
                <Button asChild size="lg" className="flex-1 h-12 rounded-2xl bg-secondary hover:bg-secondary/90 text-white" data-testid="button-ineligible-home">
                  <Link href="/treatments/weight-loss">Return to overview</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}

// ── Plan selector ─────────────────────────────────────────────────────────
/** Shared medicine (Mounjaro / Wegovy) toggle used by both plan pickers. */
const MedicineToggle: React.FC<{
  value: MedicineId;
  onSelect: (m: MedicineId) => void;
}> = ({ value, onSelect }) => (
  <div className="flex gap-2 mb-4">
    {(["mounjaro", "wegovy"] as MedicineId[]).map((m) => (
      <button key={m} type="button"
        onClick={() => onSelect(m)}
        className={`flex-1 h-10 rounded-full text-sm font-semibold transition-colors ${
          value === m
            ? (m === "mounjaro" ? "bg-[#0E3D2D] text-white" : "bg-[#D4EFE2] text-[#0E3D2D]")
            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
        data-testid={`plan-med-${m}`}
      >
        {m === "mounjaro" ? "Mounjaro · Tirzepatide" : "Wegovy · Semaglutide"}
      </button>
    ))}
  </div>
);

/**
 * New-starter titration bundle builder.
 *
 * The patient is offered their eligible (lowest) starter dose plus the higher
 * purchasable strengths, and may build a 1–3 pen (≈ 1–3 month) order. Doses
 * must step up one strength at a time — see `validateStarterBundle`.
 */
const StarterBundlePicker: React.FC<{
  medicine: MedicineId;
  onMedChange: (m: MedicineId) => void;
  value: FormState["selectedPlan"];
  onChange: (p: FormState["selectedPlan"]) => void;
}> = ({ medicine, onMedChange, value, onChange }) => {
  const maxPens = NEW_STARTER_MAX_BUNDLE_PENS;
  const eligibleDoseMg = starterDoseFor(medicine);

  const catalogPens = PEN_OPTIONS.filter((p) => p.medicine === medicine)
    .map((p) => ({ pen: p, mg: penIdDoseMg(p.id) ?? 0 }))
    .sort((a, b) => a.mg - b.mg);

  const offeredDosesMg = offeredStarterDosesMg(
    catalogPens.map((c) => c.mg),
    eligibleDoseMg,
  );
  const offeredPens = offeredDosesMg
    .map((mg) => catalogPens.find((c) => Math.abs(c.mg - mg) < 1e-9))
    .filter((c): c is { pen: PenOption; mg: number } => Boolean(c));

  // One entry per pen — strengths may repeat (e.g. two months at 2.5 mg).
  const penIds = value?.medicine === medicine ? value.penIds : [];
  const qtyOf = (penId: string) => penIds.filter((id) => id === penId).length;
  const dosesFor = (ids: string[]) => ids.map((id) => penIdDoseMg(id) ?? -1);
  const isValid = (ids: string[]) =>
    validateStarterBundle({
      offeredDosesMg,
      selectedDosesMg: dosesFor(ids),
      maxPens,
    }).ok;

  const planTypeForCount = (n: number): PlanType =>
    n >= 3 ? "three-pen" : n === 2 ? "two-pen" : "single";

  const commit = (nextIds: string[]) => {
    if (nextIds.length === 0) {
      onChange(null);
      return;
    }
    onChange({ type: planTypeForCount(nextIds.length), medicine, penIds: nextIds });
  };

  const canAdd = (penId: string) => isValid([...penIds, penId]);
  const canRemove = (penId: string) => {
    if (qtyOf(penId) === 0) return false;
    const idx = penIds.indexOf(penId);
    const next = penIds.filter((_, i) => i !== idx);
    return next.length === 0 || isValid(next);
  };
  const add = (penId: string) => {
    if (canAdd(penId)) commit([...penIds, penId]);
  };
  const remove = (penId: string) => {
    if (!canRemove(penId)) return;
    const idx = penIds.indexOf(penId);
    commit(penIds.filter((_, i) => i !== idx));
  };

  const totalPens = penIds.length;
  const bundleDiscount = totalPens >= 3 ? 0.1 : totalPens === 2 ? 0.05 : 0;
  const subtotal = penIds.reduce(
    (s, id) => s + (PEN_OPTIONS.find((p) => p.id === id)?.pricePerPen ?? 0),
    0,
  );
  const total = subtotal * (1 - bundleDiscount);

  return (
    <>
      <div
        className="mb-4 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-sm text-foreground/80"
        data-testid="starter-bundle-note"
      >
        New starters begin at the lowest starter dose. You can buy up to {maxPens}{" "}
        months in one order and build a titration bundle — but doses must step up
        one strength at a time, so a higher strength only unlocks once the one
        below it is in your bundle.
      </div>

      <MedicineToggle value={medicine} onSelect={(m) => { if (m !== medicine) onMedChange(m); }} />

      <p className="text-xs text-muted-foreground mb-3">
        Choose 1–{maxPens} pens — each pen is a 4-week supply at the listed dose.
      </p>

      <div className="space-y-2.5">
        {offeredPens.map(({ pen }, i) => {
          const qty = qtyOf(pen.id);
          const isEligible = i === 0;
          const addDisabled = !canAdd(pen.id);
          const lockedHint = addDisabled && qty === 0 && !isEligible && totalPens < maxPens;
          return (
            <div
              key={pen.id}
              className={`rounded-2xl border p-4 transition-all ${
                qty > 0 ? "border-[#0E3D2D] bg-[#F3F9F1]" : "border-stone-200 bg-white"
              }`}
              data-testid={`bundle-strength-${pen.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#0E3D2D] flex items-center gap-2">
                    {pen.label}
                    {isEligible && (
                      <span className="rounded-full bg-[#D4EFE2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0E3D2D]">
                        Your starter dose
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{pen.dose} · 4-week supply</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground line-through">£{pen.originalPerPen.toFixed(2)}</p>
                  <p className="text-lg font-extrabold text-[#0E3D2D]">£{pen.pricePerPen.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {qty} month{qty === 1 ? "" : "s"} selected
                </span>
                <div className="grid grid-cols-3 items-center gap-1 bg-[#D4EFE2] rounded-xl p-1 w-32">
                  <button type="button" onClick={() => remove(pen.id)} disabled={!canRemove(pen.id)}
                    className="h-9 rounded-lg bg-white text-[#0E3D2D] font-bold flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid={`bundle-dec-${pen.id}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-center font-bold text-[#0E3D2D] tabular-nums" data-testid={`bundle-qty-${pen.id}`}>{qty}</span>
                  <button type="button" onClick={() => add(pen.id)} disabled={addDisabled}
                    className="h-9 rounded-lg bg-white text-[#0E3D2D] font-bold flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid={`bundle-inc-${pen.id}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {lockedHint && (
                <p className="mt-2 text-[11px] text-muted-foreground" data-testid={`bundle-locked-${pen.id}`}>
                  Add {offeredPens[i - 1]?.pen.label} to your bundle first — strengths must be added in order.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {totalPens > 0 && (
        <div className="mt-5 rounded-xl bg-secondary/5 border border-secondary/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Plan total</p>
            <p className="text-2xl font-extrabold text-secondary">£{total.toFixed(2)}</p>
            {bundleDiscount > 0 && (
              <p className="text-xs text-emerald-600 font-semibold">
                Includes {Math.round(bundleDiscount * 100)}% bundle saving
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {totalPens} / {maxPens} pens selected
          </span>
        </div>
      )}
    </>
  );
};

const PlanSelector: React.FC<{
  value: FormState["selectedPlan"];
  onChange: (p: FormState["selectedPlan"]) => void;
  /** New starters: titration bundle starting at the eligible starter dose. */
  starterOnly?: boolean;
  /** Restart / gap-dosing restriction (transfer journey). */
  restriction?: PlanRestriction | null;
}> = ({ value, onChange, starterOnly = false, restriction = null }) => {
  // Restart restriction locks the medicine to the product being continued.
  const lockedMed = restriction?.product ?? null;
  const [tab, setTab] = useState<PlanType>("single");
  const [med, setMed] = useState<MedicineId>(lockedMed ?? "mounjaro");

  const effectiveTab: PlanType = tab;
  const effectiveMed: MedicineId = lockedMed ?? med;

  // Allowed pen ids for the current restriction (null = no restriction).
  const allowedIds: Set<string> | null = restriction
    ? new Set(restriction.allowedPenIds)
    : null;

  const pens = PEN_OPTIONS.filter(
    (p) =>
      p.medicine === effectiveMed && (allowedIds ? allowedIds.has(p.id) : true),
  );
  const requiredCount =
    effectiveTab === "single" ? 1 : effectiveTab === "two-pen" ? 2 : 3;

  const availableTabs: [PlanType, string][] = [
    ["single", "Single Pens"],
    ["two-pen", "2-Pen Bundles"],
    ["three-pen", "3-Pen Bundles"],
  ];

  const togglePen = (id: string) => {
    const current =
      value?.type === effectiveTab && value.medicine === effectiveMed
        ? value.penIds
        : [];
    if (current.includes(id)) {
      onChange({
        type: effectiveTab,
        medicine: effectiveMed,
        penIds: current.filter((x) => x !== id),
      });
    } else if (current.length < requiredCount) {
      onChange({
        type: effectiveTab,
        medicine: effectiveMed,
        penIds: [...current, id],
      });
    }
  };

  const bundleDiscount =
    effectiveTab === "two-pen" ? 0.05 : effectiveTab === "three-pen" ? 0.1 : 0;
  const selectedPens =
    value?.type === effectiveTab && value.medicine === effectiveMed
      ? pens.filter((p) => value.penIds.includes(p.id))
      : [];
  const total = selectedPens.reduce((s, p) => s + p.pricePerPen, 0) * (1 - bundleDiscount);

  const restrictionNote = restriction?.note ?? null;

  return (
    <>
      <SectionCard>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">All treatments include:</p>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0E3D2D]" /> Free Private Prescription</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0E3D2D]" /> x4 Needles & x4 Alcohol Swabs</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#0E3D2D]" /> Secure, Tracked Delivery</li>
        </ul>
      </SectionCard>

      <SectionCard>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Available discounts</p>
        <div className="space-y-2">
          <div className="rounded-xl bg-[#FEF6B8] border border-amber-200 px-3 py-2 flex items-center justify-between text-sm">
            <span className="font-mono font-bold text-amber-800">FIRST30</span>
            <span className="text-stone-700">£30 off your consultation</span>
          </div>
          <div className="rounded-xl bg-[#D4EFE2] border border-emerald-200 px-3 py-2 flex items-center justify-between text-sm">
            <span className="font-mono font-bold text-[#0E3D2D]">DOSE25</span>
            <span className="text-stone-700">£25 off your next dose</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <p className="font-semibold text-[#0E3D2D] mb-3">Select your plan</p>

        {starterOnly ? (
          <StarterBundlePicker
            medicine={effectiveMed}
            onMedChange={(m) => { setMed(m); onChange(null); }}
            value={value}
            onChange={onChange}
          />
        ) : (
          <>
            {restrictionNote && (
              <div
                className="mb-4 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 text-sm text-foreground/80"
                data-testid="plan-restriction-note"
              >
                {restrictionNote}
              </div>
            )}

            <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl mb-4">
              {availableTabs.map(([id, label]) => (
                <button
                  key={id} type="button"
                  onClick={() => { setTab(id); onChange(null); }}
                  className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${
                    effectiveTab === id ? "bg-[#0E3D2D] text-white" : "text-stone-600 hover:text-[#0E3D2D]"
                  }`}
                  data-testid={`plan-tab-${id}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {!lockedMed && (
              <MedicineToggle value={effectiveMed} onSelect={(m) => { setMed(m); onChange(null); }} />
            )}

            <p className="text-xs text-muted-foreground mb-3">
              Select {requiredCount} pen{requiredCount > 1 ? "s" : ""} — each pen is a 4-week supply at the listed dose.
            </p>

            <div className="space-y-2.5">
              {pens.map((p) => {
                const selected = value?.type === effectiveTab && value.medicine === effectiveMed && value.penIds.includes(p.id);
                const isRecommended = restriction?.recommendedPenId === p.id;
                return (
                  <button key={p.id} type="button"
                    onClick={() => togglePen(p.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      selected ? "border-[#0E3D2D] bg-[#F3F9F1]" : "border-stone-200 bg-white hover:border-stone-400"
                    }`}
                    data-testid={`plan-pen-${p.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#0E3D2D] flex items-center gap-2">
                          {p.label}
                          {isRecommended && (
                            <span className="rounded-full bg-[#D4EFE2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0E3D2D]">
                              Recommended
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.weeks}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground line-through">£{p.originalPerPen.toFixed(2)}</p>
                        <p className="text-lg font-extrabold text-[#0E3D2D]">£{p.pricePerPen.toFixed(2)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPens.length > 0 && (
              <div className="mt-5 rounded-xl bg-secondary/5 border border-secondary/20 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Plan total</p>
                  <p className="text-2xl font-extrabold text-secondary">£{total.toFixed(2)}</p>
                  {bundleDiscount > 0 && (
                    <p className="text-xs text-emerald-600 font-semibold">
                      Includes {Math.round(bundleDiscount * 100)}% bundle saving
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {selectedPens.length} / {requiredCount} pens selected
                </span>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </>
  );
};

const AddOnCard: React.FC<{
  addon: AddOn;
  qty: number;
  onChange: (q: number) => void;
}> = ({ addon, qty, onChange }) => {
  const Icon = addon.icon;
  return (
    <Card className="rounded-2xl border border-stone-200 bg-white shadow-none" data-testid={`addon-${addon.id}`}>
      <CardContent className="p-4 flex flex-col h-full">
        <div className="bg-stone-100 rounded-xl h-36 flex items-center justify-center">
          <Icon className="h-12 w-12 text-[#0E3D2D]/30" />
        </div>
        <p className="font-semibold text-[#0E3D2D] text-sm leading-tight mt-3">{addon.name}</p>
        <p className="text-xs text-muted-foreground mt-1 flex-1">{addon.blurb}</p>
        <p className="text-base font-semibold text-[#0E3D2D] mt-2">£{addon.price.toFixed(2)}</p>
        {qty === 0 ? (
          <Button
            type="button" onClick={() => onChange(1)}
            className="w-full mt-3 bg-[#0E3D2D] hover:bg-[#0a2e22] text-white rounded-xl h-10 text-sm font-semibold"
            data-testid={`addon-add-${addon.id}`}
          >
            Add to Cart
          </Button>
        ) : (
          <div className="mt-3 grid grid-cols-3 items-center gap-1 bg-[#D4EFE2] rounded-xl p-1">
            <button type="button" onClick={() => onChange(Math.max(0, qty - 1))}
              className="h-9 rounded-lg bg-white text-[#0E3D2D] font-bold flex items-center justify-center"
              data-testid={`addon-dec-${addon.id}`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-center font-bold text-[#0E3D2D] tabular-nums" data-testid={`addon-qty-${addon.id}`}>{qty}</span>
            <button type="button" onClick={() => onChange(qty + 1)}
              className="h-9 rounded-lg bg-white text-[#0E3D2D] font-bold flex items-center justify-center"
              data-testid={`addon-inc-${addon.id}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import React, { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ShieldCheck, Lock, Mail, Phone,
  UserPlus, Upload, ExternalLink, FileText, User, Heart,
  Pill as PillIcon, CheckCircle2, ClipboardCheck, Stethoscope,
  Syringe, Plus, Minus, Sparkles, Clock, Star, TrendingDown,
  Check, Leaf,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

type JourneyStage = "new" | "existing" | "transferring";
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

type AddOnId =
  | "weight-tracker"
  | "sharps-bin"
  | "alcohol-swabs"
  | "pen-needles"
  | "multivit"
  | "vitamin-d";

type PlanType = "single" | "two-pen" | "three-pen";
type MedicineId = "mounjaro" | "wegovy";

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
  // Step 3 — Journey
  journey: JourneyStage | null;
  // Step 4 — Ethnicity
  ethnicity: Ethnicity | null;
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
  diabetesMedsOther: YesNo | null;
  // Step 8 — Medication
  takingMeds: YesNo | null;
  otherConditions: YesNo | null;
  oralContraceptive: YesNo | null;
  newToInjectables: YesNo | null;
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
}

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  journey: null,
  ethnicity: null,
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
  diabetesMedsOther: null,
  takingMeds: null,
  otherConditions: null,
  oralContraceptive: null,
  newToInjectables: null,
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
        ? "border-[#0E3D2D] bg-[#F3F9F1]"
        : "border-stone-200 bg-white hover:border-stone-400"
    }`}
  >
    {icon && (
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          selected ? "bg-[#D4EFE2] text-[#0E3D2D]" : "bg-stone-100 text-stone-500"
        }`}
      >
        {icon}
      </span>
    )}
    <span className="flex-1 min-w-0">
      <span className="block font-semibold text-[#0E3D2D]">{title}</span>
      {subtitle && <span className="block text-sm text-muted-foreground mt-0.5">{subtitle}</span>}
    </span>
    <span
      className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all ${
        selected ? "bg-[#0E3D2D]" : "border-2 border-stone-300"
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
  <Card className="rounded-3xl border border-stone-200 shadow-sm bg-white">
    <CardContent className="p-6 md:p-7">{children}</CardContent>
  </Card>
);

const BrandHeader: React.FC = () => (
  <div className="pt-8 pb-4 flex flex-col items-center">
    <div className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
        <Leaf className="w-4 h-4 text-white" />
      </span>
      <span className="text-2xl font-serif font-bold text-[#0E3D2D]">PharmaCare</span>
    </div>
    <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">
      Everyday Care. Expertly Delivered.
    </p>
  </div>
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
      className="max-w-2xl mx-auto px-5 pb-16"
    >
      <BrandHeader />

      {/* Progress header */}
      <div className="grid grid-cols-3 items-center text-xs text-muted-foreground mb-3">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-1 text-muted-foreground hover:text-[#0E3D2D] transition-colors justify-self-start ${hideBack ? "invisible" : ""}`}
          data-testid="button-step-back"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center col-start-2">
          <p className="uppercase tracking-widest text-muted-foreground">Step {step} of {totalSteps}</p>
          <p className="text-[#0E3D2D] font-bold text-base mt-0.5">{label}</p>
        </div>
      </div>
      <div className="h-1 rounded-full bg-stone-200 overflow-hidden mb-10">
        <motion.div
          className="h-full bg-[#0E3D2D] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Title block */}
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-[#D4EFE2] text-[#0E3D2D] inline-flex items-center justify-center mb-4">
          {icon}
        </div>
        <h1 className="text-[2rem] leading-tight font-serif font-bold text-[#0E3D2D]">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-md mx-auto">{subtitle}</p>}
      </div>

      {/* Body */}
      <div className="space-y-5">{children}</div>

      {/* Continue */}
      <div className="mt-8 space-y-3">
        <div className="rounded-xl bg-white border border-stone-200 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Clock className="w-3.5 h-3.5" /> Takes about 3 minutes. Progress saved automatically.
        </div>
        <Button
          onClick={onContinue}
          disabled={!canContinue}
          size="lg"
          className="w-full h-14 rounded-2xl bg-[#0E3D2D] hover:bg-[#0a2e22] text-white text-base font-semibold disabled:bg-[#9CB8A6] disabled:hover:bg-[#9CB8A6] disabled:cursor-not-allowed"
          data-testid="button-step-continue"
        >
          {continueLabel ?? "Continue"} <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
        <p className="text-center text-xs text-stone-400">
          Your information is secure and confidential.
        </p>
      </div>
    </motion.div>
  );
};

const TrustRow: React.FC = () => (
  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
    <span className="flex flex-col items-center text-[9px] leading-tight text-stone-600">
      <span className="font-semibold text-[10px]">General</span>
      <span className="font-semibold text-[10px]">Pharmaceutical</span>
      <span className="font-semibold text-[10px]">Council</span>
    </span>
    <span className="font-extrabold text-[#005EB8] text-lg tracking-tight">NHS</span>
    <span className="w-8 h-8 rounded-full bg-[#D52B1E] text-white flex items-center justify-center font-serif italic font-bold text-lg">L</span>
    <span className="text-[10px] font-semibold text-stone-700">novo nordisk</span>
    <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> GPhC Registered</span>
    <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> Encrypted</span>
    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> MHRA</span>
  </div>
);

export default function InjectableWeightLossConsultation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

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

  // Clinical hard-stop: any of these answers makes them ineligible for online prescribing.
  const contraindicated = useMemo(() => {
    const reasons: string[] = [];
    if (state.ageBracket === "no" || (ageYears !== null && (ageYears < 18 || ageYears > 75))) reasons.push("Outside the 18–75 age range for online prescribing.");
    if (state.pregnant === "yes") reasons.push("Pregnant, breastfeeding or planning pregnancy — GLP-1 medicines are contraindicated.");
    if (state.glp1Allergy === "yes") reasons.push("Previous allergic reaction to GLP-1 medicines.");
    if (state.thyroidHistory === "yes") reasons.push("Personal or family history of medullary thyroid cancer or MEN2.");
    if (state.eatingDisorder === "yes") reasons.push("History of an eating disorder — requires in-person specialist review.");
    if (state.excludingConditions === "yes") reasons.push("One or more listed medical conditions require GP-led review before treatment.");
    if (bmi !== null && bmi < 27) reasons.push(`Your BMI (${bmi.toFixed(1)}) is below the 27 threshold for treatment.`);
    return reasons;
  }, [state, ageYears, bmi]);

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const next = () => {
    // Clinical hard-stop after the conditions step
    if ((step === 6 || step === 7) && contraindicated.length > 0) {
      go(99); // ineligible screen
      return;
    }
    go(step + 1);
  };
  const back = () => (step === 99 ? go(7) : step > 1 ? go(step - 1) : navigate("/treatments/weight-loss"));

  // ── Validation per step ─────────────────────────────────────────────────
  const canContinue = useMemo(() => {
    switch (step) {
      case 1: return true;
      case 2:
        return state.fullName.trim().length >= 2
          && /\S+@\S+\.\S+/.test(state.email)
          && state.phone.trim().length >= 7;
      case 3: return state.journey !== null;
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
        return state.assignedSex !== null && state.ageBracket !== null
          && state.pregnant !== null && state.glp1Allergy !== null
          && state.thyroidHistory !== null && state.eatingDisorder !== null;
      case 7: return state.excludingConditions !== null && state.diabetesMedsOther !== null;
      case 8:
        return state.takingMeds !== null && state.otherConditions !== null
          && state.oralContraceptive !== null && state.newToInjectables !== null;
      case 9: return state.agreement === "yes";
      case 10:
        return state.gpConsent !== null
          && (state.gpConsent === "no" || (state.gpName.trim().length > 0 && state.gpAddress.trim().length > 0));
      case 11: {
        if (!state.selectedPlan) return false;
        const need = state.selectedPlan.type === "single" ? 1 : state.selectedPlan.type === "two-pen" ? 2 : 3;
        return state.selectedPlan.penIds.length === need;
      }
      case 12: return true;
      default: return false;
    }
  }, [step, state]);

  // ── Submit ─────────────────────────────────────────────────────────────
  const submit = async () => {
    setSubmitting(true);
    try {
      const clinicalAnswers: Record<string, unknown> = {
        journey_stage: state.journey,
        ethnicity: state.ethnicity,
        dob: state.dob,
        bmi: bmi ? Number(bmi.toFixed(1)) : null,
        assigned_sex: state.assignedSex,
        age_18_75: state.ageBracket,
        pregnant_or_breastfeeding: state.pregnant,
        glp1_allergy_history: state.glp1Allergy,
        mtc_or_men2_history: state.thyroidHistory,
        eating_disorder_history: state.eatingDisorder,
        excluding_conditions: state.excludingConditions,
        diabetes_meds_beyond_metformin: state.diabetesMedsOther,
        currently_taking_meds: state.takingMeds,
        other_health_conditions: state.otherConditions,
        oral_contraceptive: state.oralContraceptive,
        new_to_injectables: state.newToInjectables,
        consent_agreement: state.agreement,
        gp_consent: state.gpConsent,
        gp_name: state.gpName,
        gp_address: state.gpAddress,
        selected_plan: state.selectedPlan,
        addons: Object.entries(state.addOns).filter(([, q]) => q > 0).map(([id, q]) => ({ id, qty: q })),
      };

      const sexForApi: "male" | "female" = state.assignedSex === "male" ? "male" : "female";

      await apiFetch("/api/consultations", {
        method: "POST",
        body: JSON.stringify({
          conditionId: "weight-loss",
          patientName: state.fullName.trim(),
          patientEmail: state.email.trim(),
          patientPhone: state.phone.trim(),
          patientAge: ageYears ?? 0,
          patientSex: sexForApi,
          allergies: state.glp1Allergy === "yes" ? "GLP-1 allergy history reported" : "None",
          currentMedications: state.takingMeds === "yes" ? "Patient reports current medication; details to follow" : "None",
          medicalHistory: state.otherConditions === "yes" ? "Has other health conditions; details to follow" : "None",
          answers: clinicalAnswers,
          hasPhoto: false,
        }),
      });

      toast({
        title: "Consultation submitted",
        description: "Our pharmacist prescriber will review and email you within a few hours.",
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <Header />

      <div className="bg-[#FAF6F0]">
        <AnimatePresence mode="wait">
          {/* ───── Step 1 — Eligibility / Intro */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto px-5 pb-16"
            >
              <BrandHeader />
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  209 viewing now
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                  Limited stock
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-secondary text-center mb-1">
                Weight-Loss Consultation
              </h1>
              <p className="text-center text-muted-foreground mb-6">
                Free · No obligation · Prescribed by UK pharmacists
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <Card className="rounded-2xl border-border"><CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto text-secondary mb-1.5" />
                  <p className="font-bold text-secondary">3 mins</p>
                  <p className="text-xs text-muted-foreground">to complete</p>
                </CardContent></Card>
                <Card className="rounded-2xl border-primary/40 bg-primary/5"><CardContent className="p-4 text-center">
                  <Stethoscope className="w-5 h-5 mx-auto text-primary mb-1.5" />
                  <p className="font-bold text-primary">Fast</p>
                  <p className="text-xs text-muted-foreground">prescriber review</p>
                </CardContent></Card>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className="rounded-2xl border-rose-200 bg-rose-50"><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">New here?</p>
                  <p className="text-2xl font-extrabold text-rose-700">£30 OFF</p>
                  <p className="text-xs text-muted-foreground mb-2">Your consultation</p>
                  <div className="bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-center font-mono text-sm text-rose-700">
                    Use code <strong>NEW30</strong>
                  </div>
                </CardContent></Card>
                <Card className="rounded-2xl border-emerald-200 bg-emerald-50"><CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Already a patient?</p>
                  <p className="text-2xl font-extrabold text-emerald-700">£25 OFF</p>
                  <p className="text-xs text-muted-foreground mb-2">Your consultation</p>
                  <div className="bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 text-center font-mono text-sm text-emerald-700">
                    Use code <strong>RETURN25</strong>
                  </div>
                </CardContent></Card>
              </div>

              {/* ── PharmaCare Tracker partner banner ───────────────────── */}
              <div className="rounded-2xl overflow-hidden mb-5 border border-violet-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-white/70">PharmaCare Tracker</p>
                    <p className="font-bold text-base md:text-lg leading-tight">Track your weight-loss journey with AI</p>
                    <p className="text-xs text-white/80 mt-0.5">50% off for founding members of our companion app.</p>
                  </div>
                  <button type="button" className="hidden sm:inline-flex shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-white text-violet-700 hover:bg-violet-50">
                    Join waitlist
                  </button>
                </div>
              </div>

              {/* ── Real Transformations ────────────────────────────────── */}
              <div className="mb-5">
                <h2 className="text-center font-serif text-2xl font-bold text-secondary">Real transformations</h2>
                <p className="text-center text-xs text-muted-foreground mb-4">Verified patient results — anonymised</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "James, 34", text: "Lost 2 stone on Mounjaro in 5 months", from: "from-sky-100", to: "to-sky-50", accent: "text-sky-700" },
                    { name: "Sarah, 41", text: "Lost 2.5 stone on Wegovy in 6 months", from: "from-rose-100", to: "to-rose-50", accent: "text-rose-700" },
                  ].map((t) => (
                    <Card key={t.name} className="rounded-2xl border-border overflow-hidden">
                      <div className={`grid grid-cols-2 h-36 bg-gradient-to-br ${t.from} ${t.to}`}>
                        <div className="relative flex items-end justify-center">
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-white">BEFORE</span>
                          <User className="w-16 h-16 text-secondary/30 mb-2" />
                        </div>
                        <div className="relative flex items-end justify-center border-l border-white/40">
                          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">AFTER</span>
                          <User className="w-14 h-14 text-secondary/30 mb-2" />
                        </div>
                      </div>
                      <CardContent className="p-3 text-center">
                        <p className="font-semibold text-secondary text-sm">{t.name}</p>
                        <p className={`text-xs ${t.accent}`}>{t.text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* ── Trusted & Certified (enhanced) ─────────────────────── */}
              <SectionCard>
                <p className="text-center font-serif font-bold text-secondary text-lg mb-4">Trusted & Certified</p>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/30">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-secondary text-sm">GPhC Registered Pharmacy</p>
                    <p className="text-xs text-muted-foreground">Reg 9011677 · Superintendent M Zuvaid Patel</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-extrabold text-xs">EL</div>
                    <div className="min-w-0">
                      <p className="font-bold text-rose-800 text-sm leading-tight">Eli Lilly</p>
                      <p className="text-[10px] text-rose-700">Authorised supplier</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-extrabold text-xs">NN</div>
                    <div className="min-w-0">
                      <p className="font-bold text-sky-800 text-sm leading-tight">Novo Nordisk</p>
                      <p className="text-[10px] text-sky-700">Authorised supplier</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ── Why Patients Choose Us ────────────────────────────── */}
              <div className="mt-5">
                <h2 className="text-center font-serif text-2xl font-bold text-secondary mb-4">Why patients choose us</h2>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: "Dave", text: "Customer service was excellent. Emailed to say there was a problem with my order due to the delivery — it was in no way PharmaCare's fault, but still organised a full re-order to be sent again soon. Excellent company that I'll be using in the future." },
                    { name: "Marison", text: "Very happy with this company and my order — best thing was actually being able to speak to someone in person about the process!" },
                  ].map((r) => (
                    <Card key={r.name} className="rounded-2xl border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-0.5 mb-2 text-amber-400">
                          {[0,1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                        <p className="text-sm text-foreground/80 mb-3 leading-relaxed">"{r.text}"</p>
                        <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                          <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-secondary text-sm leading-tight">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground">Verified purchase</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => go(2)}
                  size="lg"
                  className="w-full h-14 rounded-2xl bg-secondary hover:bg-secondary/90 text-white text-base font-semibold"
                  data-testid="button-start-consultation"
                >
                  Start free consultation <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <div className="mt-4"><TrustRow /></div>
              </div>
            </motion.div>
          )}

          {/* ───── Step 2 — Contact */}
          {step === 2 && (
            <StepShell
              step={2} label="Contact" icon={<User className="w-6 h-6" />}
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
              <TrustRow />
            </StepShell>
          )}

          {/* ───── Step 3 — Journey */}
          {step === 3 && (
            <StepShell
              step={3} label="BMI Check" icon={<ClipboardCheck className="w-6 h-6" />}
              title="BMI Assessment"
              subtitle="Let's calculate your BMI to confirm your eligibility"
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <p className="text-center text-sm font-bold text-[#0E3D2D]">Where are you in your weight loss journey?</p>
              <RadioRow icon={<UserPlus className="w-5 h-5" />} title="New Patient" subtitle="Starting Treatment"
                selected={state.journey === "new"} onSelect={() => update("journey", "new")}
                testId="journey-new"
              />
              <RadioRow icon={<Upload className="w-5 h-5" />} title="Existing Patient" subtitle="Reorder Your Next Dose"
                selected={state.journey === "existing"} onSelect={() => update("journey", "existing")}
                testId="journey-existing"
              />
              <RadioRow icon={<ExternalLink className="w-5 h-5" />} title="Transferring" subtitle="From Another Provider"
                selected={state.journey === "transferring"} onSelect={() => update("journey", "transferring")}
                testId="journey-transferring"
              />
            </StepShell>
          )}

          {/* ───── Step 4 — Ethnicity */}
          {step === 4 && (
            <StepShell
              step={4} label="Ethnicity" icon={<User className="w-6 h-6" />}
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
              step={5} label="BMI Check" icon={<ClipboardCheck className="w-6 h-6" />}
              title="BMI Assessment"
              subtitle="We'll calculate your BMI to determine your eligibility."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <SectionCard>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="dob" className="font-semibold text-secondary">Date of birth *</Label>
                    <Input
                      id="dob" type="date" value={state.dob}
                      onChange={(e) => update("dob", e.target.value)}
                      className="h-12 mt-1.5 rounded-xl" data-testid="input-dob"
                    />
                  </div>

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

          {/* ───── Step 6 — Your Health */}
          {step === 6 && (
            <StepShell
              step={6} label="Your Health" icon={<Heart className="w-6 h-6" />}
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
                      selected={state.assignedSex === val} onSelect={() => update("assignedSex", val)}
                      title={label} testId={`assignedSex-${val}`}
                    />
                  ))}
                </div>
              </SectionCard>

              {[
                { key: "ageBracket",     q: "Are you aged between 18 and 75? *" },
                { key: "pregnant",       q: "Are you currently pregnant, breastfeeding, or planning to become pregnant or breastfeed while using this medication? *" },
                { key: "glp1Allergy",    q: "Have you ever had an allergic reaction to Wegovy, Mounjaro, Ozempic, Saxenda, or other GLP-1 medications? *" },
                { key: "thyroidHistory", q: "Do you or a family member have a history of medullary thyroid cancer or MEN2? *" },
                { key: "eatingDisorder", q: "Have you ever had an eating disorder (e.g. anorexia, bulimia)? *" },
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

          {/* ───── Step 7 — Medical Conditions */}
          {step === 7 && (
            <StepShell
              step={7} label="Medical Conditions" icon={<ShieldCheck className="w-6 h-6" />}
              title="Medical Conditions"
              subtitle="Help us understand your medical history."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              <SectionCard>
                <p className="font-semibold text-secondary mb-2">
                  Have you been diagnosed with or had surgery for any of the following? *
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 mb-4 bg-[#F3F9F1] rounded-xl p-4">
                  {[
                    "Pancreatitis",
                    "Gallstones or gallbladder problems",
                    "Inflammatory bowel disease (Crohn's, ulcerative colitis)",
                    "Gastroparesis or delayed stomach emptying",
                    "Chronic malabsorption",
                    "Bariatric or gastric surgery",
                    "Liver disease",
                    "Kidney disease",
                    "Type 1 Diabetes",
                    "Diabetic eye disease (retinopathy)",
                    "Heart disease or rhythm issues",
                    "Cancer",
                    "Serious condition needing hospitalisation",
                    "Other condition not listed above",
                  ].map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0E3D2D] mt-2 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <YesNoChoice
                  value={state.excludingConditions}
                  onChange={(v) => update("excludingConditions", v)}
                  testIdPrefix="excludingConditions"
                />
              </SectionCard>

              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  If you have type 2 diabetes, are you taking any medications other than metformin? *
                </p>
                <YesNoChoice
                  value={state.diabetesMedsOther}
                  onChange={(v) => update("diabetesMedsOther", v)}
                  testIdPrefix="diabetesMedsOther"
                />
              </SectionCard>
            </StepShell>
          )}

          {/* ───── Step 8 — Medication */}
          {step === 8 && (
            <StepShell
              step={8} label="Medication" icon={<PillIcon className="w-6 h-6" />}
              title="Medication"
              subtitle="Tell us about your current and past medications."
              onBack={back} onContinue={next} canContinue={canContinue}
            >
              {[
                { key: "takingMeds",        q: "Are you currently taking any prescribed, over-the-counter, or recreational drugs? *" },
                { key: "otherConditions",   q: "Do you have any previous or current health conditions? *" },
                { key: "oralContraceptive", q: "Are you taking an oral contraceptive? *" },
                { key: "newToInjectables",  q: "Are you new to using injectable weight-loss medications? *" },
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

          {/* ───── Step 9 — Agreement */}
          {step === 9 && (
            <StepShell
              step={9} label="Agreement" icon={<CheckCircle2 className="w-6 h-6" />}
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
              <TrustRow />
            </StepShell>
          )}

          {/* ───── Step 10 — GP Details */}
          {step === 10 && (
            <StepShell
              step={10} label="GP Details" icon={<Stethoscope className="w-6 h-6" />}
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
              <div className="rounded-xl bg-[#D4EFE2] p-4 text-sm text-[#0E3D2D]">
                <p className="font-bold mb-1.5">Why do we need this?</p>
                <p className="text-stone-700">For your safety, we need to share information about your prescription with your GP to ensure continuity of care.</p>
              </div>
              <TrustRow />
            </StepShell>
          )}

          {/* ───── Step 11 — Treatment Plan */}
          {step === 11 && (
            <StepShell
              step={11} label="Treatment" icon={<Syringe className="w-6 h-6" />}
              title="Your injectable weight-loss prescription plan"
              subtitle="Select your Mounjaro or Wegovy treatment. Select a single pen or bundle that fits your goals."
              onBack={back} onContinue={next} canContinue={canContinue}
              continueLabel="Continue to add-ons"
            >
              <PlanSelector
                value={state.selectedPlan}
                onChange={(p) => update("selectedPlan", p)}
              />
            </StepShell>
          )}

          {/* ───── Step 12 — Add-ons (post-clinical upsell) */}
          {step === 12 && (
            <StepShell
              step={12} totalSteps={12} label="Add-ons" icon={<Plus className="w-6 h-6" />}
              title="Popular add-ons"
              subtitle="Power your treatment with additional services and supplements."
              onBack={back}
              onContinue={submit}
              canContinue={!submitting}
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
            </StepShell>
          )}
          {/* ───── Ineligible screen */}
          {step === 99 && (
            <motion.div
              key="ineligible"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto px-5 pb-16"
            >
              <BrandHeader />
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 inline-flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-secondary">
                  Online treatment isn't appropriate for you right now
                </h1>
                <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-md mx-auto">
                  Based on your answers, our prescribing safeguards mean we can't issue this medicine through an online consultation.
                </p>
              </div>
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">Why we can't prescribe today</p>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {contraindicated.map((r, i) => (
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
const PlanSelector: React.FC<{
  value: FormState["selectedPlan"];
  onChange: (p: FormState["selectedPlan"]) => void;
}> = ({ value, onChange }) => {
  const [tab, setTab] = useState<PlanType>("single");
  const [med, setMed] = useState<MedicineId>("mounjaro");

  const pens = PEN_OPTIONS.filter((p) => p.medicine === med);
  const requiredCount = tab === "single" ? 1 : tab === "two-pen" ? 2 : 3;

  const togglePen = (id: string) => {
    const current = value?.type === tab && value.medicine === med ? value.penIds : [];
    if (current.includes(id)) {
      onChange({ type: tab, medicine: med, penIds: current.filter((x) => x !== id) });
    } else if (current.length < requiredCount) {
      onChange({ type: tab, medicine: med, penIds: [...current, id] });
    }
  };

  const bundleDiscount = tab === "two-pen" ? 0.05 : tab === "three-pen" ? 0.1 : 0;
  const selectedPens = value?.type === tab && value.medicine === med
    ? pens.filter((p) => value.penIds.includes(p.id))
    : [];
  const total = selectedPens.reduce((s, p) => s + p.pricePerPen, 0) * (1 - bundleDiscount);

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
        <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl mb-4">
          {([
            ["single", "Single Pens"],
            ["two-pen", "2-Pen Bundles"],
            ["three-pen", "3-Pen Bundles"],
          ] as [PlanType, string][]).map(([id, label]) => (
            <button
              key={id} type="button"
              onClick={() => { setTab(id); onChange(null); }}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${
                tab === id ? "bg-[#0E3D2D] text-white" : "text-stone-600 hover:text-[#0E3D2D]"
              }`}
              data-testid={`plan-tab-${id}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {(["mounjaro", "wegovy"] as MedicineId[]).map((m) => (
            <button key={m} type="button"
              onClick={() => { setMed(m); onChange(null); }}
              className={`flex-1 h-10 rounded-full text-sm font-semibold transition-colors ${
                med === m
                  ? (m === "mounjaro" ? "bg-[#0E3D2D] text-white" : "bg-[#D4EFE2] text-[#0E3D2D]")
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              data-testid={`plan-med-${m}`}
            >
              {m === "mounjaro" ? "Mounjaro · Tirzepatide" : "Wegovy · Semaglutide"}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Select {requiredCount} pen{requiredCount > 1 ? "s" : ""} — each pen is a 4-week supply at the listed dose.
        </p>

        <div className="space-y-2.5">
          {pens.map((p) => {
            const selected = value?.type === tab && value.medicine === med && value.penIds.includes(p.id);
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
                    <p className="font-bold text-[#0E3D2D]">{p.label}</p>
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

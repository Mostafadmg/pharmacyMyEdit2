import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  UserPlus,
  Upload,
  ExternalLink,
  User,
  ClipboardCheck,
  Stethoscope,
  Clock,
  Heart,
  Pill as PillIcon,
  FileText,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/consultation/DateField";
import { RadioRow } from "@/components/consultation/RadioRow";
import { YesNoChoice, type YesNo } from "@/components/consultation/YesNoChoice";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CheckboxRow } from "@/components/consultation/CheckboxRow";
import { DeferredRedFlagNotice } from "@/components/consultation/DeferredRedFlagNotice";
import { ClinicalTeamNotesSection } from "@/components/consultation/ClinicalTeamNotesSection";
import {
  collectOralDeferredRedFlags,
} from "@/lib/oralRedFlags";
import { MedicalHistorySection } from "@/components/consultation/PmrHealthQuestionnaireForms";
import { HighRiskMedicationsSection, ExcludingConditionsSection } from "@/components/consultation/WeightLossClinicalForms";
import {
  ORAL_MEDICAL_HISTORY_CONDITIONS,
  ORAL_MEDICAL_HISTORY_GATE_QUESTION,
  ORAL_MEDICAL_HISTORY_INTRO,
  emptyOralHealthFormSlice,
  isOralMedicalHistoryComplete,
  ORAL_ORLISTAT_ALLERGY_QUESTION,
  ORAL_ORLISTAT_OCP_COUNSELLING_ACKNOWLEDGEMENT,
  ORAL_ORLISTAT_OCP_COUNSELLING_BODY,
  ORAL_ORLISTAT_OCP_COUNSELLING_HEADING,
  isOralYourHealthStepComplete,
  type OralHealthFormSlice,
} from "@/lib/oralHealthQuestionnaire";
import {
  WL_ORAL_EXCLUDED_MEDICATIONS,
  WL_ORAL_EXCLUDED_MEDS_GATE_QUESTION,
  WL_ORAL_EXCLUDED_MEDS_STOPPED_PAST_THREE_MONTHS_QUESTION,
  emptyOralExcludedMedsSlice,
  isOralExcludedMedsStepComplete,
  ORAL_OTHER_MEDS_NOT_LISTED_QUESTION,
  type OralExcludedMedsSlice,
  type WlOralExcludedMedId,
} from "@/lib/oralExcludedMedications";
import {
  WL_ORAL_EXCLUDING_CONDITIONS,
  WL_ORAL_EXCLUDING_CONDITIONS_GATE_QUESTION,
  emptyOralExcludingConditionsSlice,
  isOralExcludingConditionsStepComplete,
  type OralExcludingConditionsSlice,
} from "@/lib/oralExcludingConditions";
import type { JourneyStage } from "@/lib/wlConsultationRouting";

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

function asksFemaleHealthQuestions(sex: AssignedSex | null): boolean {
  return sex === "female" || sex === "prefer-not-to-say";
}

interface OralFormState {
  fullName: string;
  email: string;
  phone: string;
  journey: JourneyStage | null;
  ethnicity: Ethnicity | null;
  dob: string;
  heightUnit: UnitHeight;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  weightUnit: UnitWeight;
  weightKg: string;
  weightSt: string;
  weightLbs: string;
  assignedSex: AssignedSex | null;
  pregnant: YesNo | null;
  oralContraceptive: YesNo | null;
  orlistatAllergy: YesNo | null;
  orlistatOcpCounsellingAcknowledged: boolean;
  oralHealth: OralHealthFormSlice;
  excludedMeds: OralExcludedMedsSlice;
  oralExcludingConditions: OralExcludingConditionsSlice;
  clinicalTeamNotes: string;
}

const CONTACT_STEP = 2;
/** Matches injectable flow length — later steps added incrementally. */
const FLOW_TOTAL_STEPS = 14;
const LAST_IMPLEMENTED_STEP = 10;
/** End screen after clinical steps — eligibility assessed silently; patient sees a neutral completion message. */
const DEFERRED_REJECTION_STEP = 98;

const initialState: OralFormState = {
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
  pregnant: null,
  oralContraceptive: null,
  orlistatAllergy: null,
  orlistatOcpCounsellingAcknowledged: false,
  oralHealth: emptyOralHealthFormSlice(),
  excludedMeds: emptyOralExcludedMedsSlice(),
  oralExcludingConditions: emptyOralExcludingConditionsSlice(),
  clinicalTeamNotes: "",
};

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

function bmiFrom(state: OralFormState): number | null {
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

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card className="rounded-2xl border border-stone-200/90 bg-card shadow-sm">
    <CardContent className="p-5 md:p-6">{children}</CardContent>
  </Card>
);

const TrustRow: React.FC = () => (
  <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-muted-foreground">
    <span className="inline-flex items-center gap-1.5">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      GPhC regulated
    </span>
    <span className="inline-flex items-center gap-1.5">
      <Lock className="h-3.5 w-3.5 text-primary" />
      Encrypted &amp; confidential
    </span>
  </p>
);

const StepShell: React.FC<{
  step: number;
  totalSteps: number;
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
  step,
  totalSteps,
  label,
  icon,
  title,
  subtitle,
  children,
  onBack,
  onContinue,
  canContinue,
  continueLabel,
  hideBack,
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

export default function OralWeightLossConsultation() {
  const [, navigate] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => getPatientSession().loggedIn);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OralFormState>(() => {
    const session = getPatientSession();
    return {
      ...initialState,
      fullName: session.name,
      email: session.email,
      phone: session.phone,
    };
  });

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    if (step === DEFERRED_REJECTION_STEP) {
      go(LAST_IMPLEMENTED_STEP);
      return;
    }
    if (step > 1) {
      go(stepBefore(step, isLoggedIn));
      return;
    }
    navigate("/treatments/weight-loss");
  };

  const next = () => {
    if (step === LAST_IMPLEMENTED_STEP) {
      if (deferredRedFlags.length > 0) {
        go(DEFERRED_REJECTION_STEP);
        return;
      }
      go(LAST_IMPLEMENTED_STEP + 1);
      return;
    }
    if (step >= LAST_IMPLEMENTED_STEP) {
      go(Math.min(step + 1, LAST_IMPLEMENTED_STEP + 1));
      return;
    }
    go(stepAfter(step, isLoggedIn));
  };

  const update = <K extends keyof OralFormState>(key: K, value: OralFormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

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

  const bmi = useMemo(() => bmiFrom(state), [state]);

  const deferredRedFlags = useMemo(
    () =>
      collectOralDeferredRedFlags({
        journeyStage: state.journey,
        bmi,
        oralHealth: state.oralHealth,
        assignedSex: state.assignedSex,
        pregnant: state.pregnant,
        orlistatAllergy: state.orlistatAllergy,
        asksFemaleHealthQuestions,
        excludedMeds: state.excludedMeds,
        oralExcludingConditions: state.oralExcludingConditions,
      }),
    [
      state.journey,
      bmi,
      state.oralHealth,
      state.assignedSex,
      state.pregnant,
      state.orlistatAllergy,
      state.excludedMeds,
      state.oralExcludingConditions,
    ],
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return (
          state.fullName.trim().length >= 2 &&
          /\S+@\S+\.\S+/.test(state.email) &&
          state.phone.trim().length >= 7
        );
      case 3:
        return state.journey !== null;
      case 4:
        return state.ethnicity !== null;
      case 5: {
        const heightOk =
          state.heightUnit === "cm"
            ? parseFloat(state.heightCm) > 0
            : parseFloat(state.heightFt || "0") + parseFloat(state.heightIn || "0") > 0;
        const weightOk =
          state.weightUnit === "kg"
            ? parseFloat(state.weightKg) > 0
            : parseFloat(state.weightSt || "0") + parseFloat(state.weightLbs || "0") > 0;
        return Boolean(state.dob) && heightOk && weightOk;
      }
      case 6:
        return isOralYourHealthStepComplete({
          assignedSex: state.assignedSex,
          pregnant: state.pregnant,
          oralContraceptive: state.oralContraceptive,
          orlistatAllergy: state.orlistatAllergy,
          orlistatOcpCounsellingAcknowledged: state.orlistatOcpCounsellingAcknowledged,
          asksFemaleHealthQuestions,
        });
      case 7:
        return isOralMedicalHistoryComplete(state.oralHealth);
      case 8:
        return isOralExcludedMedsStepComplete(state.excludedMeds);
      case 9:
        return isOralExcludingConditionsStepComplete(state.oralExcludingConditions);
      case 10:
        return true;
      default:
        return false;
    }
  }, [step, state]);

  const shellTotal = flowTotalSteps(isLoggedIn);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-background">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="oral-step-1"
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
                A pharmacist-led consultation for oral weight-loss treatment
                (such as Orlistat or Mysimba). Free to start — you are not
                committed until you choose a treatment plan.
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
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Button
                  onClick={() => go(isLoggedIn ? 3 : 2)}
                  size="lg"
                  className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
                  data-testid="button-start-oral-consultation"
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

          {!isLoggedIn && step === 2 && (
            <StepShell
              step={flowStepNumber(2, isLoggedIn)}
              totalSteps={shellTotal}
              label="Contact"
              icon={<User className="w-6 h-6" />}
              title="Your contact details"
              subtitle="We'll use these to keep you updated about your consultation."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <div className="rounded-2xl bg-white border border-stone-200 p-4 text-sm text-foreground/80">
                <p className="text-sm mb-2">
                  <span className="font-bold text-[#0E3D2D]">Why do we need this?</span>{" "}
                  <span className="text-muted-foreground">Your email and phone help us:</span>
                </p>
                <ul className="space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E3D2D] mt-2 shrink-0" />
                    Send prescription updates &amp; tracking info
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E3D2D] mt-2 shrink-0" />
                    Reach you if our prescribing team has any questions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0E3D2D] mt-2 shrink-0" />
                    Save your progress so you can pick up where you left off anytime
                  </li>
                </ul>
              </div>
              <SectionCard>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="oral-fullName" className="font-semibold text-secondary">
                      Full name *
                    </Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="oral-fullName"
                        placeholder="Your full legal name"
                        value={state.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        className="h-12 pl-10 rounded-xl"
                        data-testid="input-fullname"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="oral-email" className="font-semibold text-secondary">
                      Email address *
                    </Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="oral-email"
                        type="email"
                        placeholder="you@email.com"
                        value={state.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="h-12 pl-10 rounded-xl"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="oral-phone" className="font-semibold text-secondary">
                      Phone number *
                    </Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="oral-phone"
                        type="tel"
                        placeholder="07700 900000"
                        value={state.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="h-12 pl-10 rounded-xl"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              step={flowStepNumber(3, isLoggedIn)}
              totalSteps={shellTotal}
              label="BMI Check"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="BMI Assessment"
              subtitle="Let's calculate your BMI as part of your assessment."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <p className="text-center text-sm font-bold text-[#0E3D2D]">
                Where are you in your weight loss journey?
              </p>
              <RadioRow
                icon={<UserPlus className="w-5 h-5" />}
                title="New Patient"
                subtitle="Starting Treatment"
                selected={state.journey === "new"}
                onSelect={() => update("journey", "new")}
                testId="journey-new"
              />
              <RadioRow
                icon={<Upload className="w-5 h-5" />}
                title="Existing Patient"
                subtitle="Reorder Your Next Dose"
                selected={state.journey === "existing"}
                onSelect={() => update("journey", "existing")}
                testId="journey-existing"
              />
              <RadioRow
                icon={<ExternalLink className="w-5 h-5" />}
                title="Transferring"
                subtitle="From Another Provider"
                selected={state.journey === "transferring"}
                onSelect={() => update("journey", "transferring")}
                testId="journey-transferring"
              />
            </StepShell>
          )}

          {step === 4 && (
            <StepShell
              step={flowStepNumber(4, isLoggedIn)}
              totalSteps={shellTotal}
              label="Ethnicity"
              icon={<User className="w-6 h-6" />}
              title="Ethnicity"
              subtitle="We ask for this to help us accurately assess cardiometabolic risk as part of your consultation."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              {(
                [
                  ["asian", "Asian or Asian British"],
                  ["black", "Black, African, Caribbean or Black British"],
                  ["middle-eastern", "Middle Eastern"],
                  ["mixed", "Mixed or multiple ethnicities"],
                  ["white", "White"],
                  ["other", "Other ethnic group"],
                  ["prefer-not-to-say", "Prefer not to say"],
                ] as [Ethnicity, string][]
              ).map(([val, label]) => (
                <RadioRow
                  key={val}
                  selected={state.ethnicity === val}
                  onSelect={() => update("ethnicity", val)}
                  title={label}
                  testId={`ethnicity-${val}`}
                />
              ))}
            </StepShell>
          )}

          {step === 5 && (
            <StepShell
              step={flowStepNumber(5, isLoggedIn)}
              totalSteps={shellTotal}
              label="BMI Check"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="BMI Assessment"
              subtitle="We'll calculate your BMI from your height and weight."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
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
                        <button
                          key={u}
                          type="button"
                          onClick={() => update("heightUnit", u)}
                          className={`h-11 rounded-xl font-semibold text-sm transition-colors ${
                            state.heightUnit === u
                              ? "bg-[#0E3D2D] text-white"
                              : "bg-[#D4EFE2] text-[#0E3D2D]"
                          }`}
                          data-testid={`unit-height-${u}`}
                        >
                          {u === "cm" ? "cm" : "ft/in"}
                        </button>
                      ))}
                    </div>
                    {state.heightUnit === "cm" ? (
                      <Input
                        type="number"
                        placeholder="cm"
                        value={state.heightCm}
                        onChange={(e) => update("heightCm", e.target.value)}
                        className="h-12 rounded-xl"
                        data-testid="input-height-cm"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="ft"
                          value={state.heightFt}
                          onChange={(e) => update("heightFt", e.target.value)}
                          className="h-12 rounded-xl"
                          data-testid="input-height-ft"
                        />
                        <Input
                          type="number"
                          placeholder="in"
                          value={state.heightIn}
                          onChange={(e) => update("heightIn", e.target.value)}
                          className="h-12 rounded-xl"
                          data-testid="input-height-in"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="font-semibold text-secondary">Your weight *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 mb-2">
                      {(["kg", "stlbs"] as UnitWeight[]).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => update("weightUnit", u)}
                          className={`h-11 rounded-xl font-semibold text-sm transition-colors ${
                            state.weightUnit === u
                              ? "bg-[#0E3D2D] text-white"
                              : "bg-[#D4EFE2] text-[#0E3D2D]"
                          }`}
                          data-testid={`unit-weight-${u}`}
                        >
                          {u === "kg" ? "kg" : "st/lbs"}
                        </button>
                      ))}
                    </div>
                    {state.weightUnit === "kg" ? (
                      <Input
                        type="number"
                        placeholder="kg"
                        value={state.weightKg}
                        onChange={(e) => update("weightKg", e.target.value)}
                        className="h-12 rounded-xl"
                        data-testid="input-weight-kg"
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="st"
                          value={state.weightSt}
                          onChange={(e) => update("weightSt", e.target.value)}
                          className="h-12 rounded-xl"
                          data-testid="input-weight-st"
                        />
                        <Input
                          type="number"
                          placeholder="lbs"
                          value={state.weightLbs}
                          onChange={(e) => update("weightLbs", e.target.value)}
                          className="h-12 rounded-xl"
                          data-testid="input-weight-lbs"
                        />
                      </div>
                    )}
                  </div>

                  {bmi !== null && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-secondary">Your BMI</span>
                      <span
                        className="text-2xl font-extrabold text-primary tabular-nums"
                        data-testid="bmi-readout"
                      >
                        {bmi.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </SectionCard>
            </StepShell>
          )}

          {step === 6 && (
            <StepShell
              step={flowStepNumber(6, isLoggedIn)}
              totalSteps={shellTotal}
              label="Your Health"
              icon={<Heart className="w-6 h-6" />}
              title="Your Health"
              subtitle="Please answer these questions honestly to ensure your safety."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  What sex were you assigned at birth? *
                </p>
                <div className="space-y-2.5">
                  {(
                    [
                      ["male", "Male"],
                      ["female", "Female"],
                      ["prefer-not-to-say", "Prefer not to say"],
                    ] as [AssignedSex, string][]
                  ).map(([val, label]) => (
                    <RadioRow
                      key={val}
                      selected={state.assignedSex === val}
                      onSelect={() => {
                        setState((s) => ({
                          ...s,
                          assignedSex: val,
                          ...(val === "male"
                            ? {
                                pregnant: null,
                                oralContraceptive: null,
                                orlistatOcpCounsellingAcknowledged: false,
                              }
                            : {}),
                        }));
                      }}
                      title={label}
                      testId={`assignedSex-${val}`}
                    />
                  ))}
                </div>
              </SectionCard>

              {asksFemaleHealthQuestions(state.assignedSex) && (
                <>
                  <SectionCard>
                    <p className="font-semibold text-secondary mb-3">
                      Are you currently pregnant, breastfeeding, or planning to become
                      pregnant or breastfeed while using this medication? *
                    </p>
                    <YesNoChoice
                      value={state.pregnant}
                      onChange={(pregnant) => update("pregnant", pregnant)}
                    />
                  </SectionCard>
                  <SectionCard>
                    <p className="font-semibold text-secondary mb-3">
                      Are you taking an oral contraceptive? *
                    </p>
                    <YesNoChoice
                      value={state.oralContraceptive}
                      onChange={(oralContraceptive) =>
                        setState((s) => ({
                          ...s,
                          oralContraceptive,
                          orlistatOcpCounsellingAcknowledged:
                            oralContraceptive === "yes"
                              ? s.orlistatOcpCounsellingAcknowledged
                              : false,
                        }))
                      }
                    />
                  </SectionCard>
                  {state.oralContraceptive === "yes" && (
                    <SectionCard>
                      <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-4 mb-4">
                        <p className="font-semibold text-secondary">
                          {ORAL_ORLISTAT_OCP_COUNSELLING_HEADING}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {ORAL_ORLISTAT_OCP_COUNSELLING_BODY}
                        </p>
                      </div>
                      <CheckboxRow
                        checked={state.orlistatOcpCounsellingAcknowledged}
                        onToggle={() =>
                          update(
                            "orlistatOcpCounsellingAcknowledged",
                            !state.orlistatOcpCounsellingAcknowledged,
                          )
                        }
                        title={ORAL_ORLISTAT_OCP_COUNSELLING_ACKNOWLEDGEMENT}
                      />
                    </SectionCard>
                  )}
                </>
              )}

              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  {ORAL_ORLISTAT_ALLERGY_QUESTION} *
                </p>
                <YesNoChoice
                  value={state.orlistatAllergy}
                  onChange={(orlistatAllergy) => update("orlistatAllergy", orlistatAllergy)}
                />
              </SectionCard>
            </StepShell>
          )}

          {step === 7 && (
            <StepShell
              step={flowStepNumber(7, isLoggedIn)}
              totalSteps={shellTotal}
              label="Medical history"
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Medical history"
              subtitle="Tell us about any conditions you have been diagnosed with — the same information we keep on your patient record."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <SectionCard>
                <MedicalHistorySection
                  slice={state.oralHealth}
                  onChange={(oralHealth) =>
                    setState((s) => ({ ...s, oralHealth }))
                  }
                  conditions={ORAL_MEDICAL_HISTORY_CONDITIONS}
                  intro={ORAL_MEDICAL_HISTORY_INTRO}
                  gateQuestion={ORAL_MEDICAL_HISTORY_GATE_QUESTION}
                />
              </SectionCard>
            </StepShell>
          )}

          {step === 8 && (
            <StepShell
              step={flowStepNumber(8, isLoggedIn)}
              totalSteps={shellTotal}
              label="Medications"
              icon={<PillIcon className="w-6 h-6" />}
              title="Medications"
              subtitle="Tell us about medicines, supplements, and remedies you take."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <SectionCard>
                <HighRiskMedicationsSection
                  gateQuestion={WL_ORAL_EXCLUDED_MEDS_GATE_QUESTION}
                  stoppedPastThreeMonthsQuestion={
                    WL_ORAL_EXCLUDED_MEDS_STOPPED_PAST_THREE_MONTHS_QUESTION
                  }
                  medications={WL_ORAL_EXCLUDED_MEDICATIONS}
                  infoHeading="These are the medicines we ask about:"
                  infoHeadingWhenNo="For your information, these are the medicines we ask about:"
                  taken={state.excludedMeds.excludedMedsTaken}
                  onTakenChange={(excludedMedsTaken) =>
                    setState((s) => ({
                      ...s,
                      excludedMeds: {
                        ...s.excludedMeds,
                        excludedMedsTaken,
                        ...(excludedMedsTaken === "yes"
                          ? { excludedMedsStoppedPastThreeMonths: null }
                          : {
                              excludedMedsSelected: [],
                            }),
                      },
                    }))
                  }
                  selected={state.excludedMeds.excludedMedsSelected}
                  onSelectedChange={(excludedMedsSelected) =>
                    setState((s) => ({
                      ...s,
                      excludedMeds: {
                        ...s.excludedMeds,
                        excludedMedsSelected:
                          excludedMedsSelected as WlOralExcludedMedId[],
                      },
                    }))
                  }
                  stoppedPastThreeMonths={
                    state.excludedMeds.excludedMedsStoppedPastThreeMonths
                  }
                  onStoppedPastThreeMonthsChange={(
                    excludedMedsStoppedPastThreeMonths,
                  ) =>
                    setState((s) => ({
                      ...s,
                      excludedMeds: {
                        ...s.excludedMeds,
                        excludedMedsStoppedPastThreeMonths,
                      },
                    }))
                  }
                />
              </SectionCard>
              <SectionCard>
                <p className="font-semibold text-secondary mb-3">
                  {ORAL_OTHER_MEDS_NOT_LISTED_QUESTION} *
                </p>
                <YesNoChoice
                  value={state.excludedMeds.otherMedsNotListed}
                  yesLabel="Yes — please list below"
                  noLabel="No"
                  onChange={(otherMedsNotListed) =>
                    setState((s) => ({
                      ...s,
                      excludedMeds: {
                        ...s.excludedMeds,
                        otherMedsNotListed,
                        ...(otherMedsNotListed === "no"
                          ? { otherMedsNotListedDetails: "" }
                          : {}),
                      },
                    }))
                  }
                />
                {state.excludedMeds.otherMedsNotListed === "yes" && (
                  <div className="mt-4">
                    <Label
                      htmlFor="oral-other-meds-detail"
                      className="font-semibold text-secondary"
                    >
                      Please list your other medicines, supplements, or remedies *
                    </Label>
                    <Textarea
                      id="oral-other-meds-detail"
                      value={state.excludedMeds.otherMedsNotListedDetails}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          excludedMeds: {
                            ...s.excludedMeds,
                            otherMedsNotListedDetails: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g. paracetamol, vitamin D, St John's wort"
                      rows={3}
                      className="mt-1.5 rounded-xl resize-y min-h-[88px]"
                      data-testid="oral-other-meds-detail"
                    />
                  </div>
                )}
              </SectionCard>
            </StepShell>
          )}

          {step === 9 && (
            <StepShell
              step={flowStepNumber(9, isLoggedIn)}
              totalSteps={shellTotal}
              label="Medical conditions"
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Medical conditions"
              subtitle="Help us understand your medical history."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <SectionCard>
                <ExcludingConditionsSection
                  conditions={WL_ORAL_EXCLUDING_CONDITIONS}
                  gateQuestion={WL_ORAL_EXCLUDING_CONDITIONS_GATE_QUESTION}
                  excludingConditions={
                    state.oralExcludingConditions.excludingConditions
                  }
                  onExcludingConditionsChange={(excludingConditions) =>
                    setState((s) => ({
                      ...s,
                      oralExcludingConditions: {
                        ...s.oralExcludingConditions,
                        excludingConditions,
                      },
                    }))
                  }
                  diagnosedConditions={
                    state.oralExcludingConditions.diagnosedConditions
                  }
                  onDiagnosedConditionsChange={(diagnosedConditions) =>
                    setState((s) => ({
                      ...s,
                      oralExcludingConditions: {
                        ...s.oralExcludingConditions,
                        diagnosedConditions,
                      },
                    }))
                  }
                />
              </SectionCard>
            </StepShell>
          )}

          {step === 10 && (
            <StepShell
              step={flowStepNumber(10, isLoggedIn)}
              totalSteps={shellTotal}
              label="Final details"
              icon={<FileText className="w-6 h-6" />}
              title="Anything else for our clinical team?"
              subtitle="Optional — share anything you think our prescribing team should know before we review your order."
              onBack={back}
              onContinue={next}
              canContinue={canContinue}
            >
              <SectionCard>
                <ClinicalTeamNotesSection
                  value={state.clinicalTeamNotes}
                  onChange={(clinicalTeamNotes) =>
                    update("clinicalTeamNotes", clinicalTeamNotes)
                  }
                />
              </SectionCard>
            </StepShell>
          )}

          {step === 11 && (
            <StepShell
              step={flowStepNumber(11, isLoggedIn)}
              totalSteps={shellTotal}
              label="Medical history"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="Medical history"
              subtitle="The next part of your oral weight-loss consultation continues here."
              onBack={back}
              onContinue={next}
              canContinue={false}
              continueLabel="More steps coming soon"
            >
              <SectionCard>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Additional clinical questions for oral tablet treatment will be added
                  in the following steps. You can go back to review your answers above.
                </p>
              </SectionCard>
            </StepShell>
          )}

          {step === DEFERRED_REJECTION_STEP && (
            <motion.div
              key="oral-deferred-rejection"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-xl mx-auto px-5 pt-6 pb-20"
            >
              <SectionCard>
                <DeferredRedFlagNotice />
              </SectionCard>
              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-secondary text-white hover:bg-secondary/90"
                  data-testid="button-oral-deferred-home"
                >
                  <Link href="/treatments/weight-loss">Back to treatments</Link>
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

import React, { useState, useCallback } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useGetCondition, useCreateConsultation, getGetConditionQueryKey, NewConsultationInputPatientSex } from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, CheckCircle2, UploadCloud, AlertCircle, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getConditionQuestions, type EligibilityQuestion, type ClinicalQuestion } from "@/data/conditionQuestions";

// ─── Step definitions ──────────────────────────────────────────────────────
const STEPS = {
  ELIGIBILITY: 1,
  PERSONAL: 2,
  CLINICAL: 3,
  MEDICAL: 4,
  PHOTO: 5,
  REVIEW: 6,
} as const;

// ─── Sub-components ─────────────────────────────────────────────────────────

function RadioCard({ value, label, selected, onSelect }: { value: string; label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/40 hover:bg-muted/10"}`}
    >
      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <span className={`text-base font-medium ${selected ? "text-secondary" : "text-secondary/80"}`}>{label}</span>
    </button>
  );
}

function CheckboxCard({ value, label, checked, onToggle }: { value: string; label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${checked ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/40 hover:bg-muted/10"}`}
    >
      <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${checked ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-base font-medium ${checked ? "text-secondary" : "text-secondary/80"}`}>{label}</span>
    </button>
  );
}

function StepWrapper({ children, stepKey }: { children: React.ReactNode; stepKey: string }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Consultation() {
  const { conditionId } = useParams();
  const [_, setLocation] = useLocation();

  const [step, setStep] = useState(STEPS.ELIGIBILITY);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");

  // Eligibility
  const [eligibilityAnswers, setEligibilityAnswers] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<{ message: string } | null>(null);

  // Personal details
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState<"male" | "female" | "">("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});

  // Clinical questions (dynamic per condition)
  const [clinicalAnswers, setClinicalAnswers] = useState<Record<string, string | string[]>>({});
  const [clinicalErrors, setClinicalErrors] = useState<Record<string, string>>({});

  // Medical history
  const [allergies, setAllergies] = useState("");
  const [noAllergies, setNoAllergies] = useState(false);
  const [medications, setMedications] = useState("");
  const [noMedications, setNoMedications] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [noMedicalHistory, setNoMedicalHistory] = useState(false);
  const [medicalErrors, setMedicalErrors] = useState<Record<string, string>>({});

  // Consent
  const [hasConsented, setHasConsented] = useState(false);

  const { data: condition, isLoading } = useGetCondition(conditionId || "", {
    query: { enabled: !!conditionId, queryKey: getGetConditionQueryKey(conditionId || "") },
  });

  const createMutation = useCreateConsultation({
    mutation: {
      onSuccess: (data) => {
        setSubmittedRef(data.id.toUpperCase().slice(0, 8));
        setIsSubmitted(true);
        window.scrollTo(0, 0);
      },
      onError: () => {
        toast.error("Failed to submit consultation. Please check your connection and try again.");
      },
    },
  });

  const questions = conditionId ? getConditionQuestions(conditionId) : null;

  // ─── Step counting ─────────────────────────────────────────────────────────
  const requiresPhoto = condition?.requiresPhoto ?? false;
  const totalSteps = requiresPhoto ? 6 : 5;

  function visualStep(s: number) {
    // Map internal step numbers to visual steps (skip PHOTO if not required)
    if (!requiresPhoto && s >= STEPS.PHOTO) return s - 1;
    return s;
  }

  const progressPct = Math.round((visualStep(step) / totalSteps) * 100);

  // ─── Navigation helpers ────────────────────────────────────────────────────
  function scrollTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }
  function goNext(s: number) { setStep(s); scrollTop(); }

  function goBack() {
    if (step === STEPS.ELIGIBILITY) return;
    if (step === STEPS.REVIEW && !requiresPhoto) return goNext(STEPS.MEDICAL);
    if (step === STEPS.REVIEW && requiresPhoto) return goNext(STEPS.PHOTO);
    if (step === STEPS.PHOTO) return goNext(STEPS.MEDICAL);
    setStep(s => s - 1);
    scrollTop();
  }

  // ─── Step 1: Eligibility ───────────────────────────────────────────────────
  function handleEligibilityNext() {
    if (!questions) return;
    for (const q of questions.eligibilityQuestions) {
      if (!eligibilityAnswers[q.id]) {
        toast.error("Please answer all questions before continuing.");
        return;
      }
      if (eligibilityAnswers[q.id] === q.blockingAnswer) {
        setBlocked({ message: q.blockingMessage });
        scrollTop();
        return;
      }
    }
    goNext(STEPS.PERSONAL);
  }

  // ─── Step 2: Personal details ──────────────────────────────────────────────
  function validatePersonal() {
    const errors: Record<string, string> = {};
    if (!patientName.trim() || patientName.trim().length < 2) errors.patientName = "Please enter your full name.";
    if (!patientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) errors.patientEmail = "Please enter a valid email address.";
    const ageNum = parseInt(patientAge);
    if (!patientAge || isNaN(ageNum) || ageNum < 18 || ageNum > 120) errors.patientAge = "You must be 18 or over to use this service.";
    if (!patientSex) errors.patientSex = "Please select your sex at birth.";
    setPersonalErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handlePersonalNext() {
    if (validatePersonal()) goNext(STEPS.CLINICAL);
  }

  // ─── Step 3: Clinical questions ────────────────────────────────────────────
  function setClinicalAnswer(id: string, value: string) {
    setClinicalAnswers(prev => ({ ...prev, [id]: value }));
    setClinicalErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
  }

  function toggleClinicalCheckbox(id: string, value: string) {
    setClinicalAnswers(prev => {
      const current = (prev[id] as string[]) || [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [id]: updated };
    });
    setClinicalErrors(prev => { const e = { ...prev }; delete e[id]; return e; });
  }

  function validateClinical() {
    if (!questions) return true;
    const errors: Record<string, string> = {};
    for (const q of questions.clinicalQuestions) {
      if (q.required) {
        const answer = clinicalAnswers[q.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === "") {
          errors[q.id] = "Please answer this question.";
        }
      }
    }
    setClinicalErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleClinicalNext() {
    if (validateClinical()) goNext(STEPS.MEDICAL);
  }

  // ─── Step 4: Medical history ───────────────────────────────────────────────
  function validateMedical() {
    const errors: Record<string, string> = {};
    if (!noAllergies && !allergies.trim()) errors.allergies = "Please list any allergies, or check the box if you have none.";
    if (!noMedications && !medications.trim()) errors.medications = "Please list any current medications, or check the box if you take none.";
    if (!noMedicalHistory && !medicalHistory.trim()) errors.medicalHistory = "Please describe your medical history, or check the box if none.";
    setMedicalErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleMedicalNext() {
    if (!validateMedical()) return;
    if (requiresPhoto) goNext(STEPS.PHOTO);
    else goNext(STEPS.REVIEW);
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  function submitConsultation() {
    if (!conditionId || !hasConsented) {
      if (!hasConsented) toast.error("Please accept the consent declaration to continue.");
      return;
    }

    // Flatten clinical answers for submission
    const answersPayload: Record<string, string> = {};
    if (questions) {
      for (const q of questions.clinicalQuestions) {
        const val = clinicalAnswers[q.id];
        if (Array.isArray(val)) {
          answersPayload[q.id] = val.join(", ");
        } else if (val) {
          answersPayload[q.id] = val as string;
        }
      }
    }

    createMutation.mutate({
      data: {
        conditionId,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        patientAge: parseInt(patientAge),
        patientSex: patientSex as NewConsultationInputPatientSex,
        isPregnant: patientSex === "female" ? isPregnant : undefined,
        allergies: noAllergies ? "None" : allergies.trim(),
        currentMedications: noMedications ? "None" : medications.trim(),
        medicalHistory: noMedicalHistory ? "None" : medicalHistory.trim(),
        answers: answersPayload,
        hasPhoto: requiresPhoto,
      },
    });
  }

  // ─── Loading / not found ───────────────────────────────────────────────────
  if (isLoading || !condition || !questions) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
          <Skeleton className="h-3 w-full mb-10 rounded-full" />
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-5 w-1/2 mb-10" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </main>
      </div>
    );
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-20 text-center">
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] border-green-50 shadow-inner"
          >
            <CheckCircle2 className="w-14 h-14 text-green-600" />
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-4"
          >
            Consultation Submitted
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground mb-4"
          >
            Reference: <span className="font-mono font-bold text-secondary">{submittedRef}</span>
          </motion.p>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-base text-muted-foreground mb-10"
          >
            Our pharmacists are reviewing your details. This typically takes under 2 hours during working hours. You will receive an email update at <strong className="text-secondary">{patientEmail}</strong>.
          </motion.p>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white border-border/50 mb-8 text-left shadow-lg rounded-3xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-accent" />
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-secondary mb-6 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-primary" /> What happens next?
                </h3>
                <ul className="space-y-5 text-muted-foreground">
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">1</div>
                    <div className="pt-1">A qualified pharmacist will review your consultation and send a decision to <strong className="text-secondary">{patientEmail}</strong>.</div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">2</div>
                    <div className="pt-1">If approved, your prescription will be dispensed and dispatched to your address.</div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">3</div>
                    <div className="pt-1">Track your consultation status anytime in your patient portal.</div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="rounded-full px-10 h-14 text-base font-bold bg-primary">
                <Link href="/my-consultations">View My Portal</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-10 h-14 text-base font-bold border-2">
                <Link href="/">Return to Homepage</Link>
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Blocked screen ────────────────────────────────────────────────────────
  if (blocked) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-20 text-center">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-amber-50">
            <AlertTriangle className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-4">Not suitable for online treatment</h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Based on your answers, an online consultation is not appropriate for your current symptoms.
          </p>
          <Card className="bg-amber-50 border-amber-200 text-left rounded-2xl mb-8">
            <CardContent className="p-6">
              <p className="text-amber-900 font-medium leading-relaxed">{blocked.message}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-border/50 text-left rounded-2xl mb-8">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-secondary text-lg">Get the right care now</h3>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">999</div>
                <div>
                  <p className="font-bold text-secondary text-sm">Life-threatening emergency</p>
                  <p className="text-muted-foreground text-sm">Call 999 immediately</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">111</div>
                <div>
                  <p className="font-bold text-secondary text-sm">Urgent medical advice</p>
                  <p className="text-muted-foreground text-sm">Call or visit NHS 111 online</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-2" onClick={() => { setBlocked(null); setEligibilityAnswers({}); scrollTop(); }}>
              Go back
            </Button>
            <Button asChild className="rounded-full px-8 h-12 font-bold bg-secondary">
              <Link href="/conditions">Browse other conditions</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Helpers to render clinical question ───────────────────────────────────
  function renderClinicalQuestion(q: ClinicalQuestion) {
    const answer = clinicalAnswers[q.id];
    const error = clinicalErrors[q.id];

    return (
      <div key={q.id} className="space-y-3">
        <div>
          <p className="text-base font-bold text-secondary">{q.text}</p>
          {q.subtext && <p className="text-sm text-muted-foreground mt-1">{q.subtext}</p>}
        </div>

        {q.type === "radio" && q.options && (
          <div className="space-y-2">
            {q.options.map(opt => (
              <RadioCard key={opt.value} value={opt.value} label={opt.label}
                selected={answer === opt.value}
                onSelect={() => setClinicalAnswer(q.id, opt.value)}
              />
            ))}
          </div>
        )}

        {q.type === "checkbox_group" && q.options && (
          <div className="space-y-2">
            {q.options.map(opt => (
              <CheckboxCard key={opt.value} value={opt.value} label={opt.label}
                checked={Array.isArray(answer) && answer.includes(opt.value)}
                onToggle={() => toggleClinicalCheckbox(q.id, opt.value)}
              />
            ))}
          </div>
        )}

        {q.type === "textarea" && (
          <Textarea
            value={(answer as string) || ""}
            onChange={e => setClinicalAnswer(q.id, e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[110px] text-base rounded-xl bg-muted/20 resize-none"
          />
        )}

        {error && <p className="text-sm text-red-600 font-medium flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
      </div>
    );
  }

  // ─── Header progress bar ───────────────────────────────────────────────────
  const stepLabels = requiresPhoto
    ? ["Safety Check", "About You", "Symptoms", "Medical", "Photo", "Review"]
    : ["Safety Check", "About You", "Symptoms", "Medical", "Review"];

  const currentStepLabel = stepLabels[visualStep(step) - 1] || "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky progress header */}
      <header className="bg-white border-b border-border/50 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-3">
          <Link href={`/conditions/${condition.id}`}
            className="text-muted-foreground hover:text-secondary flex items-center text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Cancel
          </Link>
          <div className="text-secondary font-bold text-base hidden sm:block">{condition.name}</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            <span>{currentStepLabel}</span>
            <span>Step {visualStep(step)} of {totalSteps}</span>
          </div>
          <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 md:py-14">
        <AnimatePresence mode="wait">

          {/* ── Step 1: Eligibility / Safety Check ───────────────────────── */}
          {step === STEPS.ELIGIBILITY && (
            <StepWrapper stepKey="eligibility">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-sm font-semibold px-4 py-2 rounded-full border border-amber-200 mb-4">
                  <ShieldCheck className="w-4 h-4" /> Safety Check
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Before we begin</h2>
                <p className="text-base text-muted-foreground">Please answer honestly — these questions help ensure this service is safe for you.</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8 space-y-8">
                {questions.eligibilityQuestions.map((q: EligibilityQuestion) => (
                  <div key={q.id} className="space-y-3">
                    <p className="text-base font-bold text-secondary">{q.text}</p>
                    {q.subtext && <p className="text-sm text-muted-foreground">{q.subtext}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      {["yes", "no"].map(v => (
                        <RadioCard key={v} value={v} label={v === "yes" ? "Yes" : "No"}
                          selected={eligibilityAnswers[q.id] === v}
                          onSelect={() => setEligibilityAnswers(prev => ({ ...prev, [q.id]: v }))}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-border/50">
                  <Button type="button" size="lg" onClick={handleEligibilityNext}
                    className="w-full sm:w-auto h-14 px-10 rounded-full text-base font-bold bg-primary hover:bg-primary/90 shadow-md float-right"
                  >
                    Continue <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ── Step 2: Personal Details ──────────────────────────────────── */}
          {step === STEPS.PERSONAL && (
            <StepWrapper stepKey="personal">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">About you</h2>
                <p className="text-base text-muted-foreground">We need to confirm your identity to prescribe medication safely.</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-secondary">Full Legal Name</Label>
                  <Input
                    value={patientName}
                    onChange={e => { setPatientName(e.target.value); setPersonalErrors(p => ({ ...p, patientName: "" })); }}
                    placeholder="e.g. Jane Smith"
                    className={`h-13 text-base rounded-xl bg-muted/20 ${personalErrors.patientName ? "border-red-500" : ""}`}
                  />
                  {personalErrors.patientName && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{personalErrors.patientName}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-secondary">Email Address</Label>
                  <p className="text-xs text-muted-foreground">Your consultation outcome and any prescriptions will be sent here.</p>
                  <Input
                    type="email"
                    value={patientEmail}
                    onChange={e => { setPatientEmail(e.target.value); setPersonalErrors(p => ({ ...p, patientEmail: "" })); }}
                    placeholder="jane@example.com"
                    className={`h-13 text-base rounded-xl bg-muted/20 ${personalErrors.patientEmail ? "border-red-500" : ""}`}
                  />
                  {personalErrors.patientEmail && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{personalErrors.patientEmail}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-secondary">Age</Label>
                    <Input
                      type="number"
                      min={18}
                      max={120}
                      value={patientAge}
                      onChange={e => { setPatientAge(e.target.value); setPersonalErrors(p => ({ ...p, patientAge: "" })); }}
                      placeholder="Enter your age"
                      className={`h-13 text-base rounded-xl bg-muted/20 ${personalErrors.patientAge ? "border-red-500" : ""}`}
                    />
                    {personalErrors.patientAge && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{personalErrors.patientAge}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-secondary">Sex at Birth</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["male", "female"] as const).map(s => (
                        <RadioCard key={s} value={s} label={s.charAt(0).toUpperCase() + s.slice(1)}
                          selected={patientSex === s}
                          onSelect={() => { setPatientSex(s); setPersonalErrors(p => ({ ...p, patientSex: "" })); }}
                        />
                      ))}
                    </div>
                    {personalErrors.patientSex && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{personalErrors.patientSex}</p>}
                  </div>
                </div>

                <AnimatePresence>
                  {patientSex === "female" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <div
                        className={`flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-colors ${isPregnant ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/10"}`}
                        onClick={() => setIsPregnant(!isPregnant)}
                      >
                        <Checkbox checked={isPregnant} onCheckedChange={v => setIsPregnant(!!v)} className="w-5 h-5 border-2 mt-0.5" onClick={e => e.stopPropagation()} />
                        <div>
                          <p className="font-bold text-secondary text-sm">I am currently pregnant or breastfeeding</p>
                          <p className="text-xs text-muted-foreground mt-1">Some medications are not suitable during pregnancy or breastfeeding.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 border-t border-border/50 flex flex-col-reverse sm:flex-row justify-between gap-3">
                  <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                  <Button type="button" size="lg" onClick={handlePersonalNext} className="h-12 px-10 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
                    Continue <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ── Step 3: Clinical Questions ────────────────────────────────── */}
          {step === STEPS.CLINICAL && (
            <StepWrapper stepKey="clinical">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Your {condition.name} symptoms</h2>
                <p className="text-base text-muted-foreground">These questions help our pharmacist make a safe prescribing decision for you.</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8 space-y-8">
                {questions.clinicalQuestions.map(renderClinicalQuestion)}

                <div className="pt-4 border-t border-border/50 flex flex-col-reverse sm:flex-row justify-between gap-3">
                  <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                  <Button type="button" size="lg" onClick={handleClinicalNext} className="h-12 px-10 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
                    Continue <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ── Step 4: Medical History ───────────────────────────────────── */}
          {step === STEPS.MEDICAL && (
            <StepWrapper stepKey="medical">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Medical background</h2>
                <p className="text-base text-muted-foreground">This helps our pharmacist ensure the treatment is safe and appropriate for you.</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8 space-y-8">
                {/* Allergies */}
                <div className="space-y-3">
                  <Label className="text-base font-bold text-secondary">Do you have any allergies to medications?</Label>
                  <p className="text-sm text-muted-foreground">Include drug allergies and any reactions to medication ingredients.</p>
                  <Textarea
                    value={allergies}
                    onChange={e => { setAllergies(e.target.value); setMedicalErrors(p => ({ ...p, allergies: "" })); }}
                    disabled={noAllergies}
                    placeholder="e.g. Penicillin – causes rash and swelling..."
                    className={`min-h-[100px] text-base rounded-xl resize-none transition-opacity ${noAllergies ? "opacity-40 bg-muted" : "bg-muted/20"} ${medicalErrors.allergies ? "border-red-500" : ""}`}
                  />
                  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => { setNoAllergies(!noAllergies); setAllergies(""); setMedicalErrors(p => ({ ...p, allergies: "" })); }}
                  >
                    <Checkbox checked={noAllergies} onCheckedChange={v => { setNoAllergies(!!v); setAllergies(""); setMedicalErrors(p => ({ ...p, allergies: "" })); }} className="w-4 h-4 border-2" onClick={e => e.stopPropagation()} />
                    <Label className="text-sm font-semibold text-secondary cursor-pointer">I have no known drug allergies</Label>
                  </div>
                  {medicalErrors.allergies && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{medicalErrors.allergies}</p>}
                </div>

                {/* Medications */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Label className="text-base font-bold text-secondary">Are you currently taking any other medication?</Label>
                  <p className="text-sm text-muted-foreground">Include all prescription medicines, over-the-counter drugs, vitamins and herbal supplements.</p>
                  <Textarea
                    value={medications}
                    onChange={e => { setMedications(e.target.value); setMedicalErrors(p => ({ ...p, medications: "" })); }}
                    disabled={noMedications}
                    placeholder="e.g. Lisinopril 10mg daily, Paracetamol when needed..."
                    className={`min-h-[100px] text-base rounded-xl resize-none transition-opacity ${noMedications ? "opacity-40 bg-muted" : "bg-muted/20"} ${medicalErrors.medications ? "border-red-500" : ""}`}
                  />
                  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => { setNoMedications(!noMedications); setMedications(""); setMedicalErrors(p => ({ ...p, medications: "" })); }}
                  >
                    <Checkbox checked={noMedications} onCheckedChange={v => { setNoMedications(!!v); setMedications(""); setMedicalErrors(p => ({ ...p, medications: "" })); }} className="w-4 h-4 border-2" onClick={e => e.stopPropagation()} />
                    <Label className="text-sm font-semibold text-secondary cursor-pointer">I am not currently taking any medication</Label>
                  </div>
                  {medicalErrors.medications && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{medicalErrors.medications}</p>}
                </div>

                {/* Medical history */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Label className="text-base font-bold text-secondary">Do you have any ongoing medical conditions?</Label>
                  <p className="text-sm text-muted-foreground">E.g. diabetes, heart disease, kidney disease, epilepsy, asthma, mental health conditions.</p>
                  <Textarea
                    value={medicalHistory}
                    onChange={e => { setMedicalHistory(e.target.value); setMedicalErrors(p => ({ ...p, medicalHistory: "" })); }}
                    disabled={noMedicalHistory}
                    placeholder="e.g. Type 2 diabetes, well-controlled. High blood pressure."
                    className={`min-h-[100px] text-base rounded-xl resize-none transition-opacity ${noMedicalHistory ? "opacity-40 bg-muted" : "bg-muted/20"} ${medicalErrors.medicalHistory ? "border-red-500" : ""}`}
                  />
                  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => { setNoMedicalHistory(!noMedicalHistory); setMedicalHistory(""); setMedicalErrors(p => ({ ...p, medicalHistory: "" })); }}
                  >
                    <Checkbox checked={noMedicalHistory} onCheckedChange={v => { setNoMedicalHistory(!!v); setMedicalHistory(""); setMedicalErrors(p => ({ ...p, medicalHistory: "" })); }} className="w-4 h-4 border-2" onClick={e => e.stopPropagation()} />
                    <Label className="text-sm font-semibold text-secondary cursor-pointer">I have no significant medical history</Label>
                  </div>
                  {medicalErrors.medicalHistory && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{medicalErrors.medicalHistory}</p>}
                </div>

                <div className="pt-4 border-t border-border/50 flex flex-col-reverse sm:flex-row justify-between gap-3">
                  <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                  <Button type="button" size="lg" onClick={handleMedicalNext} className="h-12 px-10 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
                    Continue <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ── Step 5: Photo Upload (conditional) ───────────────────────── */}
          {step === STEPS.PHOTO && requiresPhoto && (
            <StepWrapper stepKey="photo">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Upload photos</h2>
                <p className="text-base text-muted-foreground">Our pharmacist needs to see the affected area to prescribe safely.</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8">
                <div className="border-2 border-dashed border-primary/40 rounded-2xl p-14 text-center bg-primary/5 cursor-pointer hover:bg-primary/8 transition-colors group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary mb-2">Click to upload or drag & drop</h3>
                  <p className="text-muted-foreground text-sm mb-5">JPEG or PNG, up to 10MB each</p>
                  <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary/10 rounded-full px-8 font-bold">Select Files</Button>
                </div>

                <div className="mt-6 bg-amber-50 p-5 rounded-2xl text-amber-800 flex gap-4 border border-amber-100">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">Please ensure the area is well-lit and in focus. Avoid including your face or other identifiable features if possible. All images are encrypted and accessed only by our clinical team.</p>
                </div>

                <div className="pt-6 border-t border-border/50 mt-6 flex flex-col-reverse sm:flex-row justify-between gap-3">
                  <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                  <Button type="button" size="lg" onClick={() => goNext(STEPS.REVIEW)} className="h-12 px-10 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
                    Continue to Review <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ── Step 6: Review & Submit ───────────────────────────────────── */}
          {step === STEPS.REVIEW && (
            <StepWrapper stepKey="review">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Review & Submit</h2>
                <p className="text-base text-muted-foreground">Please review your information carefully before submitting.</p>
              </div>

              <div className="space-y-5">
                {/* Personal details card */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-7 py-4 border-b border-border/50">
                    <h3 className="font-bold text-secondary">Personal Details</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-full px-3 h-8 text-sm" onClick={() => { setStep(STEPS.PERSONAL); scrollTop(); }}>Edit</Button>
                  </div>
                  <CardContent className="p-7">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {[
                        { label: "Name", value: patientName },
                        { label: "Email", value: patientEmail },
                        { label: "Age", value: `${patientAge} years old` },
                        { label: "Sex", value: patientSex.charAt(0).toUpperCase() + patientSex.slice(1) },
                        ...(patientSex === "female" ? [{ label: "Pregnant / Breastfeeding", value: isPregnant ? "Yes" : "No" }] : []),
                      ].map(item => (
                        <div key={item.label}>
                          <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</dt>
                          <dd className="font-semibold text-secondary">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                {/* Clinical answers card */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-7 py-4 border-b border-border/50">
                    <h3 className="font-bold text-secondary">Clinical Questions</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-full px-3 h-8 text-sm" onClick={() => { setStep(STEPS.CLINICAL); scrollTop(); }}>Edit</Button>
                  </div>
                  <CardContent className="p-7">
                    <dl className="space-y-4 text-sm">
                      {questions.clinicalQuestions.map(q => {
                        const val = clinicalAnswers[q.id];
                        if (!val || (Array.isArray(val) && val.length === 0)) return null;
                        const displayVal = Array.isArray(val) ? val.join(", ") : val;
                        return (
                          <div key={q.id}>
                            <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{q.text}</dt>
                            <dd className="font-medium text-secondary">{displayVal}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  </CardContent>
                </Card>

                {/* Medical history card */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-7 py-4 border-b border-border/50">
                    <h3 className="font-bold text-secondary">Medical Background</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-full px-3 h-8 text-sm" onClick={() => { setStep(STEPS.MEDICAL); scrollTop(); }}>Edit</Button>
                  </div>
                  <CardContent className="p-7">
                    <dl className="space-y-4 text-sm">
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Allergies</dt>
                        <dd className="font-medium text-secondary">{noAllergies ? "No known drug allergies" : allergies}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Medications</dt>
                        <dd className="font-medium text-secondary">{noMedications ? "Not taking any medication" : medications}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Medical History</dt>
                        <dd className="font-medium text-secondary">{noMedicalHistory ? "No significant medical history" : medicalHistory}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {/* Consent */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-7 space-y-5">
                    <h3 className="font-bold text-secondary text-base">Declaration & Consent</h3>
                    <div
                      className={`flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-colors ${hasConsented ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/10"}`}
                      onClick={() => setHasConsented(!hasConsented)}
                    >
                      <Checkbox checked={hasConsented} onCheckedChange={v => setHasConsented(!!v)} className="w-5 h-5 border-2 mt-0.5 shrink-0" onClick={e => e.stopPropagation()} />
                      <div className="space-y-1">
                        <p className="font-bold text-secondary text-sm">I confirm the information I have provided is accurate and complete.</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          I understand that providing false or incomplete information could be harmful to my health. I consent to PharmaCare's pharmacist reviewing my data to make a prescribing decision, in accordance with their privacy policy.
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        <strong>Important:</strong> If you are experiencing a medical emergency, do not use this service. Call <strong>999</strong> immediately or <strong>NHS 111</strong> for urgent advice.
                      </p>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                      <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                      <Button
                        type="button"
                        size="lg"
                        onClick={submitConsultation}
                        disabled={!hasConsented || createMutation.isPending}
                        className={`h-12 px-10 rounded-full font-bold shadow-md transition-all ${hasConsented ? "bg-accent hover:bg-accent/90 text-accent-foreground hover:-translate-y-0.5" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                      >
                        {createMutation.isPending ? (
                          <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</span>
                        ) : (
                          "Submit Consultation"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </StepWrapper>
          )}

        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

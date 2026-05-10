import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  useGetCondition,
  getGetConditionQueryKey,
  NewConsultationInputPatientSex,
  type Consultation as ConsultationDto,
} from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, ShieldCheck, CheckCircle2, UploadCloud, AlertCircle,
  AlertTriangle, XCircle, ChevronRight, Eye, EyeOff, User, Mail,
  Lock, MapPin, Phone, LogIn, Stethoscope, FileCheck2, Truck, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getConditionQuestions, type EligibilityQuestion, type ClinicalQuestion } from "@/data/conditionQuestions";

// ─── Step definitions ──────────────────────────────────────────────────────
const STEPS = {
  ELIGIBILITY: 1,
  CLINICAL: 2,
  MEDICAL: 3,
  PHOTO: 4,
  ACCOUNT: 5,
  GP_DETAILS: 6,
  REVIEW: 7,
} as const;

// Conditions where the medicines need extra GPhC safeguards (4.2j)
const HIGH_RISK_CONDITION_IDS = new Set<string>([
  "weight-loss", "weight_loss", "weight-management",
  "erectile-dysfunction", "premature-ejaculation",
  "asthma", "hayfever-asthma",
  "anxiety", "insomnia",
  "uti", "urinary-tract-infection",
  "thrush", "bacterial-vaginosis",
  "chlamydia", "acne",
]);
const WEIGHT_MGMT_IDS = new Set<string>(["weight-loss", "weight_loss", "weight-management"]);

// ─── Helpers ───────────────────────────────────────────────────────────────
function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getBase() {
  return (import.meta.env.BASE_URL as string).replace(/\/$/, "");
}

function savePatientToStorage(data: {
  token: string; patientId: string; name: string; email: string;
  dateOfBirth?: string | null; sex?: string | null; phone?: string | null;
  addressLine1?: string | null; addressLine2?: string | null;
  city?: string | null; postcode?: string | null;
}) {
  localStorage.setItem("patient_token", data.token);
  localStorage.setItem("patient_id", data.patientId);
  localStorage.setItem("patient_name", data.name);
  localStorage.setItem("patient_email", data.email);
  if (data.dateOfBirth) localStorage.setItem("patient_dob", data.dateOfBirth);
  if (data.sex) localStorage.setItem("patient_sex", data.sex);
  if (data.addressLine1) localStorage.setItem("patient_address1", data.addressLine1);
  if (data.addressLine2) localStorage.setItem("patient_address2", data.addressLine2);
  if (data.city) localStorage.setItem("patient_city", data.city);
  if (data.postcode) localStorage.setItem("patient_postcode", data.postcode);
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function RadioCard({ value, label, selected, onSelect }: { value: string; label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect}
      className={`w-full flex items-center gap-4 p-5 border-2 rounded-2xl text-left transition-all duration-150 cursor-pointer min-h-[64px] ${selected ? "border-primary bg-primary/[0.07] shadow-md ring-1 ring-primary/20" : "border-border/60 bg-white hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-sm"}`}
    >
      <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${selected ? "border-primary bg-primary scale-110" : "border-muted-foreground/40"}`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
      </div>
      <span className={`text-base font-semibold ${selected ? "text-primary" : "text-secondary"}`}>{label}</span>
    </button>
  );
}

function YesNoCard({ value, selected, onSelect }: { value: "yes" | "no"; selected: boolean; onSelect: () => void }) {
  const isYes = value === "yes";
  const activeClass = selected
    ? isYes
      ? "border-rose-500 bg-rose-50 shadow-md ring-1 ring-rose-200"
      : "border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-200"
    : "border-border/60 bg-white hover:border-muted-foreground/40 hover:shadow-sm";
  const textClass = selected
    ? isYes ? "text-rose-700" : "text-emerald-700"
    : "text-secondary";
  return (
    <button type="button" onClick={onSelect}
      className={`flex-1 flex flex-col items-center justify-center gap-3 py-8 border-2 rounded-2xl transition-all duration-150 cursor-pointer ${activeClass}`}
    >
      <span className={`text-4xl font-black ${textClass}`}>{isYes ? "Yes" : "No"}</span>
    </button>
  );
}

function CheckboxCard({ value, label, checked, onToggle }: { value: string; label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${checked ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/40 hover:bg-muted/10"}`}
    >
      <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${checked ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-base font-medium ${checked ? "text-secondary" : "text-secondary/80"}`}>{label}</span>
    </button>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-red-600 font-medium flex items-center gap-1.5 mt-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{msg}</p>;
}

function StepWrapper({ children, stepKey }: { children: React.ReactNode; stepKey: string }) {
  return (
    <motion.div key={stepKey} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
      {children}
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Consultation() {
  const { conditionId } = useParams();
  const [_, setLocation] = useLocation();

  // ── Repeat / follow-up: read ?repeatOf=<consultationId> from the URL ──
  // Set on first render so it's stable for the lifetime of this page.
  const [repeatOfId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("repeatOf");
    return v && v.trim() ? v.trim() : null;
  });
  const [repeatPrefilled, setRepeatPrefilled] = useState(false);
  // ── Fetch the prior consultation with EXPLICIT patient auth ──
  // We do NOT use the generated `useGetConsultation` hook here because the
  // shared api-client token getter falls back to a pharmacist token when one
  // is present in localStorage. Using `apiFetch(..., { auth: "patient" })`
  // guarantees the request is made under the current patient's identity, so
  // the server's patient-ownership check on `GET /consultations/:id` is the
  // source of truth and a tampered `repeatOf` cannot reveal another
  // patient's record.
  const [priorConsultation, setPriorConsultation] = useState<ConsultationDto | null>(null);
  useEffect(() => {
    if (!repeatOfId) return;
    let cancelled = false;
    apiFetch<ConsultationDto>(
      `/api/consultations/${encodeURIComponent(repeatOfId)}`,
      { auth: "patient" },
    )
      .then((c) => { if (!cancelled) setPriorConsultation(c); })
      .catch(() => { /* silent — banner just won't render and prefill won't run */ });
    return () => { cancelled = true; };
  }, [repeatOfId]);

  const [step, setStep] = useState<number>(STEPS.ELIGIBILITY);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");

  // ── Eligibility ─────────────────────────────────────────
  const [eligibilityAnswers, setEligibilityAnswers] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<{ message: string } | null>(null);
  const [eligibilityIndex, setEligibilityIndex] = useState(0);
  const [clinicalIndex, setClinicalIndex] = useState(0);

  // ── Clinical questions ──────────────────────────────────
  const [clinicalAnswers, setClinicalAnswers] = useState<Record<string, string | string[]>>({});
  const [clinicalErrors, setClinicalErrors] = useState<Record<string, string>>({});

  // ── Medical history ─────────────────────────────────────
  const [allergies, setAllergies] = useState("");
  const [noAllergies, setNoAllergies] = useState(false);
  const [medications, setMedications] = useState("");
  const [noMedications, setNoMedications] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [noMedicalHistory, setNoMedicalHistory] = useState(false);
  const [medicalErrors, setMedicalErrors] = useState<Record<string, string>>({});

  // ── Account & delivery ──────────────────────────────────
  const [accountTab, setAccountTab] = useState<"signin" | "register">("register");
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("patient_token"));
  // Logged-in patient info (pre-filled from localStorage)
  const [patientName, setPatientName] = useState(() => localStorage.getItem("patient_name") || "");
  const [patientEmail, setPatientEmail] = useState(() => localStorage.getItem("patient_email") || "");
  const [patientDob, setPatientDob] = useState(() => localStorage.getItem("patient_dob") || "");
  const [patientSex, setPatientSex] = useState<"male" | "female" | "">(() => (localStorage.getItem("patient_sex") as "male" | "female") || "");
  // Delivery address
  const [addrLine1, setAddrLine1] = useState(() => localStorage.getItem("patient_address1") || "");
  const [addrLine2, setAddrLine2] = useState(() => localStorage.getItem("patient_address2") || "");
  const [addrCity, setAddrCity] = useState(() => localStorage.getItem("patient_city") || "");
  const [addrPostcode, setAddrPostcode] = useState(() => localStorage.getItem("patient_postcode") || "");
  // Sign in fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPass, setShowSignInPass] = useState(false);
  const [signInErrors, setSignInErrors] = useState<Record<string, string>>({});
  const [signInLoading, setSignInLoading] = useState(false);
  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regSex, setRegSex] = useState<"male" | "female" | "">("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});

  // ── GP / regular prescriber details (GPhC 4.2k) ─────────
  const [hasRegularGp, setHasRegularGp] = useState<"" | "yes" | "no">("");
  const [gpName, setGpName] = useState("");
  const [gpSurgery, setGpSurgery] = useState("");
  const [gpAddress, setGpAddress] = useState("");
  const [gpPhone, setGpPhone] = useState("");
  const [consentShareWithGp, setConsentShareWithGp] = useState<"" | "yes" | "no">("");
  const [gpErrors, setGpErrors] = useState<Record<string, string>>({});

  // ── Identity confirmation (GPhC 4.2e) ────────────────────
  const [identityRef, setIdentityRef] = useState("");

  // ── UK postcode lookup state ────────────────────────────
  const [postcodeLookupLoading, setPostcodeLookupLoading] = useState(false);
  const [postcodeLookupError, setPostcodeLookupError] = useState<string | null>(null);
  const [postcodeLookupResult, setPostcodeLookupResult] = useState<string | null>(null);

  // ── Photo upload state ──────────────────────────────────
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handlePostcodeLookup() {
    const cleaned = addrPostcode.trim().toUpperCase();
    if (!cleaned) {
      setPostcodeLookupError("Please enter a postcode first.");
      setPostcodeLookupResult(null);
      return;
    }
    setPostcodeLookupLoading(true);
    setPostcodeLookupError(null);
    setPostcodeLookupResult(null);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleaned)}`);
      if (!res.ok) {
        setPostcodeLookupError("We couldn't find that postcode.");
        return;
      }
      const data = await res.json();
      const r = data?.result;
      if (!r) {
        setPostcodeLookupError("No match found for that postcode.");
        return;
      }
      const town = r.post_town || r.parish || r.admin_district || "";
      if (town) setAddrCity(town);
      setAddrPostcode(r.postcode || cleaned);
      setPostcodeLookupResult(`${town}${r.admin_district && r.admin_district !== town ? ", " + r.admin_district : ""}`);
      setAccountErrors(p => ({ ...p, addrCity: "", addrPostcode: "" }));
    } catch {
      setPostcodeLookupError("Network error looking up postcode.");
    } finally {
      setPostcodeLookupLoading(false);
    }
  }

  function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const max = 10 * 1024 * 1024; // 10MB per file
    const allowed = ["image/jpeg", "image/png", "image/heic", "image/webp"];
    const accepted: File[] = [];
    setPhotoError(null);
    for (const f of Array.from(files)) {
      if (!allowed.includes(f.type) && !/\.(jpe?g|png|heic|webp)$/i.test(f.name)) {
        setPhotoError("Please upload JPEG, PNG, HEIC or WebP images only.");
        continue;
      }
      if (f.size > max) {
        setPhotoError(`"${f.name}" is over 10MB and was skipped.`);
        continue;
      }
      accepted.push(f);
    }
    Promise.all(
      accepted.map(f => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(f);
      }))
    ).then(urls => {
      setPhotoDataUrls(prev => [...prev, ...urls].slice(0, 6));
    }).catch(() => {
      setPhotoError("There was a problem reading one of your photos. Please try again.");
    });
  }

  function removePhoto(index: number) {
    setPhotoDataUrls(prev => prev.filter((_, i) => i !== index));
  }

  // ── Weight management verification (GPhC 4.2l) ───────────
  const [verifiedHeight, setVerifiedHeight] = useState<string>("");
  const [verifiedWeight, setVerifiedWeight] = useState<string>("");

  // ── Granular consent (Principle 4.1) ─────────────────────
  const [consentTreatment, setConsentTreatment] = useState(false);
  const [consentDelivery, setConsentDelivery] = useState(false);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [consentIdentityConfirmed, setConsentIdentityConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: condition, isLoading } = useGetCondition(conditionId || "", {
    query: { enabled: !!conditionId, queryKey: getGetConditionQueryKey(conditionId || "") },
  });

  const questions = conditionId ? getConditionQuestions(conditionId) : null;
  const requiresPhoto = condition?.requiresPhoto ?? false;

  // ── Pre-fill the form once when a prior consultation has loaded for repeat ──
  // Only applies if the prior consultation is for THIS condition; if conditions
  // differ (patient changed condition), we skip pre-fill but still send the
  // linkage so the pharmacist sees the "Repeat" badge.
  useEffect(() => {
    if (repeatPrefilled || !priorConsultation || !repeatOfId) return;
    if (priorConsultation.conditionId !== conditionId) {
      setRepeatPrefilled(true);
      return;
    }
    const priorAnswers = (priorConsultation.answers ?? {}) as Record<string, unknown>;
    if (questions) {
      const next: Record<string, string | string[]> = {};
      for (const q of questions.clinicalQuestions) {
        const raw = priorAnswers[q.id];
        if (typeof raw !== "string" || !raw) continue;
        if (q.type === "checkbox_group") {
          next[q.id] = raw.split(",").map(s => s.trim()).filter(Boolean);
        } else {
          next[q.id] = raw;
        }
      }
      if (Object.keys(next).length > 0) setClinicalAnswers(prev => ({ ...next, ...prev }));
    }
    if (priorConsultation.allergies) {
      const a = priorConsultation.allergies.trim();
      if (a.toLowerCase() === "none") setNoAllergies(true);
      else setAllergies(a);
    }
    if (priorConsultation.currentMedications) {
      const m = priorConsultation.currentMedications.trim();
      if (m.toLowerCase() === "none") setNoMedications(true);
      else setMedications(m);
    }
    if (priorConsultation.medicalHistory) {
      const h = priorConsultation.medicalHistory.trim();
      if (h.toLowerCase() === "none") setNoMedicalHistory(true);
      else setMedicalHistory(h);
    }
    setRepeatPrefilled(true);
  }, [priorConsultation, repeatOfId, conditionId, questions, repeatPrefilled]);

  const isRepeat = !!repeatOfId;
  const repeatConditionMatches = isRepeat && priorConsultation?.conditionId === conditionId;
  const isHighRisk = conditionId ? HIGH_RISK_CONDITION_IDS.has(conditionId) : false;
  const isWeightMgmt = conditionId ? WEIGHT_MGMT_IDS.has(conditionId) : false;

  // ─── Step count / progress ─────────────────────────────────────────────────
  // visual order: ELIGIBILITY, CLINICAL, MEDICAL, [PHOTO], ACCOUNT, GP_DETAILS, REVIEW
  const totalSteps = requiresPhoto ? 7 : 6;
  function visualStep(s: number) {
    if (!requiresPhoto && s >= STEPS.PHOTO) return s - 1;
    return s;
  }
  const progressPct = Math.round((visualStep(step) / totalSteps) * 100);

  // ─── Navigation ────────────────────────────────────────────────────────────
  function scrollTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }
  function goTo(s: number) { setStep(s); scrollTop(); }

  function goBack() {
    if (step === STEPS.ELIGIBILITY) {
      if (eligibilityIndex > 0) { setEligibilityIndex(i => i - 1); scrollTop(); return; }
      return;
    }
    if (step === STEPS.CLINICAL) {
      if (clinicalIndex > 0) { setClinicalIndex(i => i - 1); scrollTop(); return; }
      setEligibilityIndex(questions ? questions.eligibilityQuestions.length - 1 : 0);
      goTo(STEPS.ELIGIBILITY); return;
    }
    if (step === STEPS.MEDICAL) { setClinicalIndex(questions ? questions.clinicalQuestions.length - 1 : 0); goTo(STEPS.CLINICAL); return; }
    if (step === STEPS.PHOTO) { goTo(STEPS.MEDICAL); return; }
    if (step === STEPS.ACCOUNT) { goTo(requiresPhoto ? STEPS.PHOTO : STEPS.MEDICAL); return; }
    if (step === STEPS.GP_DETAILS) { goTo(STEPS.ACCOUNT); return; }
    if (step === STEPS.REVIEW) { goTo(STEPS.GP_DETAILS); return; }
  }

  // ─── Step 1: Eligibility ───────────────────────────────────────────────────
  function handleEligibilityNext() {
    if (!questions) return;
    for (const q of questions.eligibilityQuestions) {
      if (!eligibilityAnswers[q.id]) { toast.error("Please answer all questions before continuing."); return; }
      if (eligibilityAnswers[q.id] === q.blockingAnswer) { setBlocked({ message: q.blockingMessage }); scrollTop(); return; }
    }
    goTo(STEPS.CLINICAL);
  }

  function handleEligibilityAnswer(q: EligibilityQuestion, answer: string) {
    if (!questions) return;
    setEligibilityAnswers(prev => ({ ...prev, [q.id]: answer }));
    if (answer === q.blockingAnswer) {
      setTimeout(() => { setBlocked({ message: q.blockingMessage }); scrollTop(); }, 350);
      return;
    }
    setTimeout(() => {
      if (eligibilityIndex < questions.eligibilityQuestions.length - 1) {
        setEligibilityIndex(i => i + 1);
        scrollTop();
      } else {
        setClinicalIndex(0);
        goTo(STEPS.CLINICAL);
      }
    }, 350);
  }

  function handleClinicalAutoAdvance() {
    if (!questions) return;
    if (clinicalIndex < questions.clinicalQuestions.length - 1) {
      setTimeout(() => { setClinicalIndex(i => i + 1); scrollTop(); }, 350);
    }
  }

  // ─── Step 2: Clinical questions ────────────────────────────────────────────
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
    if (validateClinical()) goTo(STEPS.MEDICAL);
  }

  // ─── Step 3: Medical history ───────────────────────────────────────────────
  function validateMedical() {
    const errors: Record<string, string> = {};
    if (!noAllergies && !allergies.trim()) errors.allergies = "Please list any drug allergies, or check the box if you have none.";
    if (!noMedications && !medications.trim()) errors.medications = "Please list your current medications, or check the box if you take none.";
    if (!noMedicalHistory && !medicalHistory.trim()) errors.medicalHistory = "Please describe your medical history, or check the box if none.";
    setMedicalErrors(errors);
    return Object.keys(errors).length === 0;
  }
  function handleMedicalNext() {
    if (!validateMedical()) return;
    goTo(requiresPhoto ? STEPS.PHOTO : STEPS.ACCOUNT);
  }

  // ─── Step 5: Account / sign-in ────────────────────────────────────────────
  function validateAddress() {
    const errors: Record<string, string> = {};
    if (!addrLine1.trim()) errors.addrLine1 = "Address line 1 is required.";
    if (!addrCity.trim()) errors.addrCity = "Town or city is required.";
    if (!addrPostcode.trim()) errors.addrPostcode = "Postcode is required.";
    setAccountErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  }

  async function handleSignIn() {
    const errors: Record<string, string> = {};
    if (!signInEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInEmail)) errors.signInEmail = "Valid email required.";
    if (!signInPassword) errors.signInPassword = "Password required.";
    setSignInErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSignInLoading(true);
    try {
      const res = await fetch(`${getBase()}/api/auth/patient-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setSignInErrors({ signInEmail: data.error || "Sign in failed" }); return; }

      savePatientToStorage(data);
      setPatientName(data.name);
      setPatientEmail(data.email);
      setPatientDob(data.dateOfBirth || "");
      setPatientSex((data.sex as "male" | "female") || "");
      setAddrLine1(data.addressLine1 || "");
      setAddrLine2(data.addressLine2 || "");
      setAddrCity(data.city || "");
      setAddrPostcode(data.postcode || "");
      setIsLoggedIn(true);
      toast.success(`Welcome back, ${data.name.split(" ")[0]}!`);
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleRegister() {
    const errors: Record<string, string> = {};
    if (!regName.trim() || regName.trim().length < 2) errors.regName = "Full name is required.";
    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errors.regEmail = "Valid email required.";
    if (!regDob) errors.regDob = "Date of birth is required.";
    else {
      const age = calculateAge(regDob);
      if (age < 18) errors.regDob = "You must be 18 or over to use this service.";
      if (age > 120) errors.regDob = "Please enter a valid date of birth.";
    }
    if (!regSex) errors.regSex = "Please select your sex at birth.";
    if (!regPassword || regPassword.length < 8) errors.regPassword = "Password must be at least 8 characters.";
    if (regPassword !== regConfirm) errors.regConfirm = "Passwords do not match.";
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!validateAddress()) return;

    setRegLoading(true);
    try {
      const res = await fetch(`${getBase()}/api/auth/patient-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          dateOfBirth: regDob,
          sex: regSex,
          addressLine1: addrLine1.trim(),
          addressLine2: addrLine2.trim() || undefined,
          city: addrCity.trim(),
          postcode: addrPostcode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("already exists")) {
          setRegErrors({ regEmail: data.error });
        } else {
          toast.error(data.error || "Registration failed");
        }
        return;
      }

      savePatientToStorage(data);
      setPatientName(data.name);
      setPatientEmail(data.email);
      setPatientDob(data.dateOfBirth || "");
      setPatientSex((data.sex as "male" | "female") || "");
      setAddrLine1(data.addressLine1 || addrLine1.trim());
      setAddrLine2(data.addressLine2 || addrLine2.trim());
      setAddrCity(data.city || addrCity.trim());
      setAddrPostcode(data.postcode || addrPostcode.trim().toUpperCase());
      setIsLoggedIn(true);
      toast.success("Account created successfully!");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleAccountNext() {
    if (!isLoggedIn) {
      // They need to sign in or register first
      if (accountTab === "signin") {
        await handleSignIn();
        // After sign in, only proceed if now logged in
        if (!localStorage.getItem("patient_token")) return;
      } else {
        await handleRegister();
        if (!localStorage.getItem("patient_token")) return;
      }
    } else {
      // Already logged in — just validate address and optionally update profile
      if (!validateAddress()) return;

      // Save address to profile
      const token = localStorage.getItem("patient_token");
      if (token) {
        fetch(`${getBase()}/api/auth/patient-profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            addressLine1: addrLine1.trim(),
            addressLine2: addrLine2.trim() || undefined,
            city: addrCity.trim(),
            postcode: addrPostcode.trim().toUpperCase(),
          }),
        }).then(r => r.json()).then(d => {
          if (d.addressLine1) {
            localStorage.setItem("patient_address1", d.addressLine1);
            localStorage.setItem("patient_city", d.city || "");
            localStorage.setItem("patient_postcode", d.postcode || "");
          }
        }).catch(() => {});
      }
    }

    // Check again in case of async state update
    const token = localStorage.getItem("patient_token");
    if (!token) return;
    if (!addrLine1.trim() || !addrCity.trim() || !addrPostcode.trim()) {
      if (!validateAddress()) return;
    }

    // Try to pre-fill GP details from patient profile
    fetch(`${getBase()}/api/compliance/patient/gp-details`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d?.gpName && !gpName) setGpName(d.gpName);
      if (d?.gpSurgery && !gpSurgery) setGpSurgery(d.gpSurgery);
      if (d?.gpAddress && !gpAddress) setGpAddress(d.gpAddress);
      if (d?.gpPhone && !gpPhone) setGpPhone(d.gpPhone);
      if (d?.gpName) setHasRegularGp("yes");
    }).catch(() => {});

    goTo(STEPS.GP_DETAILS);
  }

  // ─── Step 6: GP details ────────────────────────────────────────────────────
  function handleGpNext() {
    const errors: Record<string, string> = {};
    if (!hasRegularGp) errors.hasRegularGp = "Please tell us whether you have a regular GP.";
    if (hasRegularGp === "yes") {
      if (!gpName.trim()) errors.gpName = "Your GP's name is required.";
      if (!gpSurgery.trim()) errors.gpSurgery = "Surgery name is required.";
      if (!consentShareWithGp) errors.consentShareWithGp = "Please confirm whether we can share details with your GP.";
    }
    if (isWeightMgmt) {
      const h = parseInt(verifiedHeight, 10);
      const w = parseInt(verifiedWeight, 10);
      if (!h || h < 100 || h > 250) errors.verifiedHeight = "A valid height in cm is required (100–250).";
      if (!w || w < 30 || w > 350) errors.verifiedWeight = "A valid weight in kg is required (30–350).";
    }
    setGpErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Persist GP details to the patient profile
    const token = localStorage.getItem("patient_token");
    if (token && hasRegularGp === "yes") {
      fetch(`${getBase()}/api/compliance/patient/gp-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          gpName: gpName.trim(), gpSurgery: gpSurgery.trim(),
          gpAddress: gpAddress.trim(), gpPhone: gpPhone.trim(),
        }),
      }).catch(() => {});
    }
    goTo(STEPS.REVIEW);
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  async function submitConsultation() {
    if (!conditionId) return;
    if (!consentTreatment || !consentDelivery || !consentDataProcessing || !consentIdentityConfirmed) {
      toast.error("Please tick every consent box before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const age = patientDob ? calculateAge(patientDob) : 30;
      const deliveryAddress = [addrLine1, addrLine2, addrCity, addrPostcode].filter(Boolean).join(", ");

      const answersPayload: Record<string, string> = {};
      if (questions) {
        for (const q of questions.clinicalQuestions) {
          const val = clinicalAnswers[q.id];
          if (Array.isArray(val)) answersPayload[q.id] = val.join(", ");
          else if (val) answersPayload[q.id] = val as string;
        }
      }
      answersPayload._deliveryAddress = deliveryAddress;

      // Defense in depth: only forward the repeat link when we actually loaded
      // the prior consultation client-side (which already required patient
      // auth via GET /consultations/:id). The server enforces ownership again,
      // but this avoids sending IDs we couldn't verify the patient owns.
      const verifiedRepeatOfId =
        repeatOfId && priorConsultation?.id === repeatOfId ? repeatOfId : undefined;
      const body = {
        conditionId,
        previousConsultationId: verifiedRepeatOfId,
        patientName,
        patientEmail,
        patientAge: age,
        patientSex: (patientSex || "female") as NewConsultationInputPatientSex,
        allergies: noAllergies ? "None" : allergies.trim(),
        currentMedications: noMedications ? "None" : medications.trim(),
        medicalHistory: noMedicalHistory ? "None" : medicalHistory.trim(),
        answers: answersPayload,
        hasPhoto: requiresPhoto && photoDataUrls.length > 0,
        photoUrls: photoDataUrls,
        identityVerificationMethod: "online_reference",
        identityVerificationRef: identityRef.trim(),
        hasRegularGp: hasRegularGp === "yes",
        gpName: hasRegularGp === "yes" ? gpName.trim() : null,
        gpSurgery: hasRegularGp === "yes" ? gpSurgery.trim() : null,
        gpAddress: hasRegularGp === "yes" ? gpAddress.trim() : null,
        gpPhone: hasRegularGp === "yes" ? gpPhone.trim() : null,
        consentShareWithGp: consentShareWithGp === "yes",
        consentToTreatment: consentTreatment,
        consentToDelivery: consentDelivery,
        consentDataProcessing,
        preferredDeliveryMethod: "royal_mail_tracked",
        deliveryAddress,
        verifiedHeightCm: isWeightMgmt && verifiedHeight ? parseInt(verifiedHeight, 10) : undefined,
        verifiedWeightKg: isWeightMgmt && verifiedWeight ? parseInt(verifiedWeight, 10) : undefined,
      };

      const res = await fetch(`${getBase()}/api/compliance/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit. Please try again.");
        return;
      }
      setSubmittedRef(String(data.id || "").toUpperCase().slice(0, 8));
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading || !condition || !questions) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
          <Skeleton className="h-3 w-full mb-10 rounded-full" />
          <Skeleton className="h-10 w-2/3 mb-4" />
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
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-4">
            Consultation Submitted
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-muted-foreground mb-2">
            Reference: <span className="font-mono font-bold text-secondary">{submittedRef}</span>
          </motion.p>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="text-base text-muted-foreground mb-10">
            Our pharmacists are reviewing your details — typically within 2 hours during working hours. You'll receive an email at <strong className="text-secondary">{patientEmail}</strong>.
          </motion.p>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-white border-border/50 mb-8 text-left shadow-lg rounded-3xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-accent" />
              <CardContent className="p-8 space-y-5">
                <h3 className="text-xl font-bold text-secondary flex items-center gap-3"><AlertCircle className="w-6 h-6 text-primary" /> What happens next?</h3>
                {[
                  ["1", "A qualified pharmacist will review your consultation and email the outcome to you."],
                  ["2", "If approved, your prescription will be dispensed and dispatched to your delivery address."],
                  ["3", "Track your consultation status anytime in your patient portal."],
                ].map(([n, text]) => (
                  <div key={n} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-sm">{n}</div>
                    <div className="pt-1 text-muted-foreground text-sm">{text}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="rounded-full px-10 h-14 text-base font-bold bg-primary"><Link href="/my-consultations">View My Portal</Link></Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-10 h-14 text-base font-bold border-2"><Link href="/">Return to Homepage</Link></Button>
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
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Based on your answers, an online consultation is not appropriate for your current symptoms.</p>
          <Card className="bg-amber-50 border-amber-200 text-left rounded-2xl mb-6"><CardContent className="p-6"><p className="text-amber-900 font-medium leading-relaxed">{blocked.message}</p></CardContent></Card>
          <Card className="bg-white border-border/50 text-left rounded-2xl mb-8">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-bold text-secondary text-lg">Get the right care now</h3>
              {[
                { num: "999", color: "red", title: "Life-threatening emergency", desc: "Call 999 immediately" },
                { num: "111", color: "blue", title: "Urgent medical advice", desc: "Call or visit NHS 111 online" },
              ].map(item => (
                <div key={item.num} className={`flex items-center gap-3 p-3 bg-${item.color}-50 rounded-xl`}>
                  <div className={`w-10 h-10 bg-${item.color}-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm`}>{item.num}</div>
                  <div><p className="font-bold text-secondary text-sm">{item.title}</p><p className="text-muted-foreground text-sm">{item.desc}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-2" onClick={() => { setBlocked(null); setEligibilityAnswers({}); scrollTop(); }}>Go back</Button>
            <Button asChild className="rounded-full px-8 h-12 font-bold bg-secondary"><Link href="/conditions">Browse other conditions</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Render clinical question ──────────────────────────────────────────────
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
            {q.options.map(opt => <RadioCard key={opt.value} value={opt.value} label={opt.label} selected={answer === opt.value} onSelect={() => setClinicalAnswer(q.id, opt.value)} />)}
          </div>
        )}
        {q.type === "checkbox_group" && q.options && (
          <div className="space-y-2">
            {q.options.map(opt => <CheckboxCard key={opt.value} value={opt.value} label={opt.label} checked={Array.isArray(answer) && answer.includes(opt.value)} onToggle={() => toggleClinicalCheckbox(q.id, opt.value)} />)}
          </div>
        )}
        {q.type === "textarea" && (
          <Textarea value={(answer as string) || ""} onChange={e => setClinicalAnswer(q.id, e.target.value)} placeholder="Type your answer here..." className="min-h-[110px] text-base rounded-xl bg-muted/20 resize-none" />
        )}
        {error && <FieldError msg={error} />}
      </div>
    );
  }

  // ─── Progress bar labels ───────────────────────────────────────────────────
  const stepLabels = requiresPhoto
    ? ["Safety Check", "Symptoms", "Medical", "Photo", "Account", "GP Details", "Review"]
    : ["Safety Check", "Symptoms", "Medical", "Account", "GP Details", "Review"];
  const currentStepLabel = stepLabels[visualStep(step) - 1] || "";

  // ─── Address fields (shared between register & logged-in) ─────────────────
  // NOTE: Returns JSX directly — never wrap as <Component/> inside another
  // component or React will remount inputs on every keystroke.
  function AddressFields() {
    return (
      <div className="space-y-5 pt-5 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm font-bold text-secondary">
          <MapPin className="w-4 h-4 text-primary" /> Delivery Address
        </div>
        <p className="text-sm text-muted-foreground -mt-3">Where should we send your medication?</p>

        {/* UK postcode lookup */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-secondary">Find your address</Label>
          <div className="flex gap-2">
            <Input
              value={addrPostcode}
              onChange={e => { setAddrPostcode(e.target.value.toUpperCase()); setAccountErrors(p => ({ ...p, addrPostcode: "" })); }}
              placeholder="Enter postcode, e.g. SW1A 1AA"
              className={`h-12 text-base rounded-xl bg-muted/20 font-mono uppercase ${accountErrors.addrPostcode ? "border-red-500" : ""}`}
              data-testid="input-postcode"
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl border-2 font-bold whitespace-nowrap"
              disabled={postcodeLookupLoading}
              onClick={handlePostcodeLookup}
              data-testid="button-postcode-lookup"
            >
              {postcodeLookupLoading ? "Searching…" : "Find address"}
            </Button>
          </div>
          {postcodeLookupError && (
            <p className="text-xs text-amber-700 font-medium">{postcodeLookupError} You can fill the address in manually below.</p>
          )}
          {postcodeLookupResult && (
            <p className="text-xs text-green-700 font-medium">Found: {postcodeLookupResult}. Edit the fields below if needed.</p>
          )}
          <FieldError msg={accountErrors.addrPostcode} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-secondary">Address Line 1</Label>
          <Input value={addrLine1} onChange={e => { setAddrLine1(e.target.value); setAccountErrors(p => ({ ...p, addrLine1: "" })); }}
            placeholder="e.g. 12 High Street" className={`h-12 text-base rounded-xl bg-muted/20 ${accountErrors.addrLine1 ? "border-red-500" : ""}`} data-testid="input-address-line1" />
          <FieldError msg={accountErrors.addrLine1} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-secondary">Address Line 2 <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input value={addrLine2} onChange={e => setAddrLine2(e.target.value)} placeholder="e.g. Flat 3, Apartment name" className="h-12 text-base rounded-xl bg-muted/20" data-testid="input-address-line2" />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold text-secondary">Town / City</Label>
          <Input value={addrCity} onChange={e => { setAddrCity(e.target.value); setAccountErrors(p => ({ ...p, addrCity: "" })); }}
            placeholder="e.g. London" className={`h-12 text-base rounded-xl bg-muted/20 ${accountErrors.addrCity ? "border-red-500" : ""}`} data-testid="input-city" />
          <FieldError msg={accountErrors.addrCity} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sticky progress header */}
      <header className="bg-white border-b border-border/50 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between mb-3">
          <button onClick={goBack} className="text-muted-foreground hover:text-secondary flex items-center text-sm font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            {step === STEPS.ELIGIBILITY ? <Link href={`/conditions/${condition.id}`}>Cancel</Link> : "Back"}
          </button>
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
        {/* ── Repeat / follow-up context banner ───────────────────────────── */}
        {isRepeat && priorConsultation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border-2 border-violet-200 bg-violet-50 p-5"
            data-testid="banner-repeat-consultation"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-violet-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-violet-900">
                  Follow-up of your {priorConsultation.conditionName} consultation
                </p>
                <p className="text-sm text-violet-800 mt-0.5">
                  Submitted {new Date(priorConsultation.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  {priorConsultation.reviewedBy ? ` · reviewed by ${priorConsultation.reviewedBy}` : ""}.
                </p>
                {repeatConditionMatches ? (
                  <p className="text-sm text-violet-800 mt-2">
                    Your previous answers, allergies and medical history have been pre-filled below.
                    <strong> Please review every answer carefully</strong> and update anything that has changed
                    before submitting — your pharmacist will see this is a repeat request.
                  </p>
                ) : (
                  <p className="text-sm text-violet-800 mt-2">
                    You've started a new consultation for a different condition. We've kept the link to your
                    previous one for your pharmacist's reference, but answers have not been pre-filled.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Safety Check — one question at a time ────────────── */}
          {step === STEPS.ELIGIBILITY && (() => {
            const q = questions.eligibilityQuestions[eligibilityIndex];
            if (!q) return null;
            const total = questions.eligibilityQuestions.length;
            const isLast = eligibilityIndex === total - 1;
            return (
              <StepWrapper stepKey={`eligibility-${eligibilityIndex}`}>
                {/* Mini progress dots */}
                {total > 1 && (
                  <div className="flex items-center gap-1.5 mb-6">
                    {questions.eligibilityQuestions.map((_: unknown, i: number) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === eligibilityIndex ? "w-6 bg-primary" : i < eligibilityIndex ? "w-3 bg-primary/40" : "w-3 bg-border"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2 font-medium">{eligibilityIndex + 1} / {total}</span>
                  </div>
                )}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 mb-5 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Safety Check
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-secondary leading-snug mb-3">{q.text}</h2>
                  {q.subtext && <p className="text-base text-muted-foreground">{q.subtext}</p>}
                </div>
                <div className="flex gap-4">
                  {(["yes", "no"] as const).map(v => (
                    <YesNoCard key={v} value={v} selected={eligibilityAnswers[q.id] === v} onSelect={() => handleEligibilityAnswer(q, v)} />
                  ))}
                </div>
                {isLast && eligibilityAnswers[q.id] && (
                  <div className="mt-6">
                    <Button type="button" size="lg" onClick={handleEligibilityNext} className="w-full h-14 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 shadow-md">
                      Continue to your questions <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                )}
              </StepWrapper>
            );
          })()}

          {/* ── Step 2: Clinical Questions — one question at a time ───────── */}
          {step === STEPS.CLINICAL && (() => {
            const cq = questions.clinicalQuestions[clinicalIndex];
            if (!cq) return null;
            const total = questions.clinicalQuestions.length;
            const isLast = clinicalIndex === total - 1;
            const answer = clinicalAnswers[cq.id];
            const error = clinicalErrors[cq.id];
            return (
              <StepWrapper stepKey={`clinical-${clinicalIndex}`}>
                {/* Mini progress dots */}
                {total > 1 && (
                  <div className="flex items-center gap-1.5 mb-6">
                    {questions.clinicalQuestions.map((_: unknown, i: number) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === clinicalIndex ? "w-6 bg-primary" : i < clinicalIndex ? "w-3 bg-primary/40" : "w-3 bg-border"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2 font-medium">{clinicalIndex + 1} / {total}</span>
                  </div>
                )}
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-secondary leading-snug mb-2">{cq.text}</h2>
                  {cq.subtext && <p className="text-base text-muted-foreground">{cq.subtext}</p>}
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8">
                  {cq.type === "radio" && cq.options && (
                    <div className="space-y-3">
                      {cq.options.map((opt: { value: string; label: string }) => (
                        <RadioCard key={opt.value} value={opt.value} label={opt.label}
                          selected={answer === opt.value}
                          onSelect={() => {
                            setClinicalAnswer(cq.id, opt.value);
                            if (!isLast) handleClinicalAutoAdvance();
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {cq.type === "checkbox_group" && cq.options && (
                    <div className="space-y-3">
                      {cq.options.map((opt: { value: string; label: string }) => (
                        <CheckboxCard key={opt.value} value={opt.value} label={opt.label} checked={Array.isArray(answer) && answer.includes(opt.value)} onToggle={() => toggleClinicalCheckbox(cq.id, opt.value)} />
                      ))}
                    </div>
                  )}
                  {cq.type === "textarea" && (
                    <Textarea value={(answer as string) || ""} onChange={e => setClinicalAnswer(cq.id, e.target.value)} placeholder="Type your answer here…" className="min-h-[120px] text-base rounded-xl bg-muted/20 resize-none" />
                  )}
                  {error && <FieldError msg={error} />}

                  <div className="mt-6 pt-5 border-t border-border/50 flex justify-between gap-3">
                    <Button type="button" variant="outline" className="h-12 px-7 rounded-2xl font-bold border-2" onClick={goBack}>Back</Button>
                    {isLast ? (
                      <Button type="button" size="lg" onClick={handleClinicalNext} className="h-12 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-md">
                        Continue <ChevronRight className="w-5 h-5 ml-1" />
                      </Button>
                    ) : (
                      <Button type="button" size="lg" onClick={() => {
                        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
                          setClinicalErrors(p => ({ ...p, [cq.id]: "Please answer before continuing." }));
                          return;
                        }
                        setClinicalIndex(i => i + 1);
                        scrollTop();
                      }} className="h-12 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-md">
                        Next <ChevronRight className="w-5 h-5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </StepWrapper>
            );
          })()}

          {/* ── Step 3: Medical History ───────────────────────────────────── */}
          {step === STEPS.MEDICAL && (
            <StepWrapper stepKey="medical">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Medical background</h2>
                <p className="text-base text-muted-foreground">Helps our pharmacist ensure the treatment is safe for you.</p>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8 space-y-8">
                {/* Allergies */}
                <div className="space-y-3">
                  <Label className="text-base font-bold text-secondary">Do you have any allergies to medications?</Label>
                  <p className="text-sm text-muted-foreground">Include all drug allergies and any reactions to medication ingredients.</p>
                  <Textarea value={allergies} onChange={e => { setAllergies(e.target.value); setMedicalErrors(p => ({ ...p, allergies: "" })); }} disabled={noAllergies}
                    placeholder="e.g. Penicillin – causes rash..." className={`min-h-[90px] text-base rounded-xl resize-none transition-opacity ${noAllergies ? "opacity-40 bg-muted" : "bg-muted/20"} ${medicalErrors.allergies ? "border-red-500" : ""}`} />
                  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => { setNoAllergies(!noAllergies); setAllergies(""); setMedicalErrors(p => ({ ...p, allergies: "" })); }}>
                    <Checkbox checked={noAllergies} onCheckedChange={v => { setNoAllergies(!!v); setAllergies(""); }} className="w-4 h-4 border-2" onClick={e => e.stopPropagation()} />
                    <Label className="text-sm font-semibold text-secondary cursor-pointer">I have no known drug allergies</Label>
                  </div>
                  <FieldError msg={medicalErrors.allergies} />
                </div>

                {/* Medications */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Label className="text-base font-bold text-secondary">Are you currently taking any medication?</Label>
                  <p className="text-sm text-muted-foreground">Include all prescription drugs, over-the-counter medicines, vitamins and herbal supplements.</p>
                  <Textarea value={medications} onChange={e => { setMedications(e.target.value); setMedicalErrors(p => ({ ...p, medications: "" })); }} disabled={noMedications}
                    placeholder="e.g. Lisinopril 10mg daily..." className={`min-h-[90px] text-base rounded-xl resize-none transition-opacity ${noMedications ? "opacity-40 bg-muted" : "bg-muted/20"} ${medicalErrors.medications ? "border-red-500" : ""}`} />
                  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => { setNoMedications(!noMedications); setMedications(""); setMedicalErrors(p => ({ ...p, medications: "" })); }}>
                    <Checkbox checked={noMedications} onCheckedChange={v => { setNoMedications(!!v); setMedications(""); }} className="w-4 h-4 border-2" onClick={e => e.stopPropagation()} />
                    <Label className="text-sm font-semibold text-secondary cursor-pointer">I am not currently taking any medication</Label>
                  </div>
                  <FieldError msg={medicalErrors.medications} />
                </div>

                {/* Medical history */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Label className="text-base font-bold text-secondary">Do you have any ongoing medical conditions?</Label>
                  <p className="text-sm text-muted-foreground">E.g. diabetes, heart disease, kidney disease, epilepsy, asthma, mental health conditions.</p>
                  <Textarea value={medicalHistory} onChange={e => { setMedicalHistory(e.target.value); setMedicalErrors(p => ({ ...p, medicalHistory: "" })); }} disabled={noMedicalHistory}
                    placeholder="e.g. Type 2 diabetes, well-controlled..." className={`min-h-[90px] text-base rounded-xl resize-none transition-opacity ${noMedicalHistory ? "opacity-40 bg-muted" : "bg-muted/20"} ${medicalErrors.medicalHistory ? "border-red-500" : ""}`} />
                  <div className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => { setNoMedicalHistory(!noMedicalHistory); setMedicalHistory(""); setMedicalErrors(p => ({ ...p, medicalHistory: "" })); }}>
                    <Checkbox checked={noMedicalHistory} onCheckedChange={v => { setNoMedicalHistory(!!v); setMedicalHistory(""); }} className="w-4 h-4 border-2" onClick={e => e.stopPropagation()} />
                    <Label className="text-sm font-semibold text-secondary cursor-pointer">I have no significant medical history</Label>
                  </div>
                  <FieldError msg={medicalErrors.medicalHistory} />
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

          {/* ── Step 4: Photo Upload (conditional) ───────────────────────── */}
          {step === STEPS.PHOTO && requiresPhoto && (
            <StepWrapper stepKey="photo">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Upload photos</h2>
                <p className="text-base text-muted-foreground">Our pharmacist needs to see the affected area to prescribe safely. You can add up to 6 photos.</p>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8">
                <label
                  htmlFor="photo-upload-input"
                  className="block border-2 border-dashed border-primary/40 rounded-2xl p-10 text-center bg-primary/5 cursor-pointer hover:bg-primary/8 transition-colors group"
                  data-testid="label-photo-upload"
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary mb-2">Click to select photos</h3>
                  <p className="text-muted-foreground text-sm mb-5">JPEG, PNG, HEIC or WebP — up to 10MB each</p>
                  <span className="inline-flex items-center justify-center border-2 border-primary text-primary hover:bg-primary/10 rounded-full px-8 font-bold h-11">Select photos</span>
                  <input
                    id="photo-upload-input"
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/webp"
                    multiple
                    className="sr-only"
                    onChange={e => handlePhotoFiles(e.target.files)}
                    data-testid="input-photo-upload"
                  />
                </label>

                {photoError && (
                  <p className="mt-3 text-sm text-red-600 font-medium" data-testid="text-photo-error">{photoError}</p>
                )}

                {photoDataUrls.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="grid-photo-previews">
                    {photoDataUrls.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-red-600 rounded-full p-1 shadow"
                          aria-label={`Remove photo ${i + 1}`}
                          data-testid={`button-remove-photo-${i}`}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 bg-amber-50 p-5 rounded-2xl flex gap-4 border border-amber-100">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">Please ensure the area is well-lit and in focus. All images are encrypted and only accessed by our clinical team.</p>
                </div>
                <div className="pt-6 border-t border-border/50 mt-6 flex flex-col-reverse sm:flex-row justify-between gap-3">
                  <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                  <Button type="button" size="lg" onClick={() => goTo(STEPS.ACCOUNT)} className="h-12 px-10 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
                    {photoDataUrls.length > 0 ? "Continue" : "Skip photos"} <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </div>
            </StepWrapper>
          )}

          {/* ── Step 5: Account & Delivery ────────────────────────────────── */}
          {step === STEPS.ACCOUNT && (
            <StepWrapper stepKey="account">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">
                  {isLoggedIn ? "Delivery details" : "Create your account"}
                </h2>
                <p className="text-base text-muted-foreground">
                  {isLoggedIn
                    ? `Signed in as ${patientName}. Where should we send your medication?`
                    : "Almost there. Create a free account so you can track your consultation and receive updates."
                  }
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-8 space-y-6">

                {/* ── LOGGED IN: Just show profile summary + address ─────── */}
                {isLoggedIn ? (
                  <>
                    <div className="bg-slate-50 rounded-2xl p-5 flex items-center gap-4 border border-border/50">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-secondary">{patientName}</p>
                        <p className="text-sm text-muted-foreground">{patientEmail}</p>
                        {patientDob && <p className="text-sm text-muted-foreground">DOB: {new Date(patientDob).toLocaleDateString("en-GB")}</p>}
                      </div>
                      <button onClick={() => { localStorage.removeItem("patient_token"); setIsLoggedIn(false); setPatientName(""); setPatientEmail(""); setPatientDob(""); setPatientSex(""); }} className="ml-auto text-xs text-muted-foreground hover:text-secondary underline">
                        Not you?
                      </button>
                    </div>
                    {AddressFields()}
                  </>
                ) : (
                  /* ── NOT LOGGED IN: Sign in / Register tabs ─────────────── */
                  <>
                    {/* Tabs */}
                    <div className="flex border-b border-border/50 -mx-8 px-8 gap-0">
                      {([["register", "Create Account"], ["signin", "Sign In"]] as const).map(([tab, label]) => (
                        <button key={tab} type="button" onClick={() => setAccountTab(tab)}
                          className={`flex-1 pb-3 text-sm font-bold transition-colors border-b-2 -mb-px ${accountTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-secondary"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {accountTab === "signin" ? (
                      /* ── Sign In ──────────────────────── */
                      <div className="space-y-5 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-secondary">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input type="email" value={signInEmail} onChange={e => { setSignInEmail(e.target.value); setSignInErrors(p => ({ ...p, signInEmail: "" })); }}
                              placeholder="jane@example.com" className={`pl-10 h-12 text-base rounded-xl bg-muted/20 ${signInErrors.signInEmail ? "border-red-500" : ""}`} />
                          </div>
                          <FieldError msg={signInErrors.signInEmail} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-secondary">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input type={showSignInPass ? "text" : "password"} value={signInPassword} onChange={e => { setSignInPassword(e.target.value); setSignInErrors(p => ({ ...p, signInPassword: "" })); }}
                              placeholder="Your password" className={`pl-10 pr-10 h-12 text-base rounded-xl bg-muted/20 ${signInErrors.signInPassword ? "border-red-500" : ""}`} />
                            <button type="button" onClick={() => setShowSignInPass(!showSignInPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-secondary">
                              {showSignInPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <FieldError msg={signInErrors.signInPassword} />
                        </div>

                        <Button type="button" onClick={handleSignIn} disabled={signInLoading} className="w-full h-12 rounded-xl font-bold bg-secondary text-white hover:bg-secondary/90">
                          {signInLoading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in...</span> : <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span>}
                        </Button>
                      </div>
                    ) : (
                      /* ── Create Account ────────────────── */
                      <div className="space-y-5 pt-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-secondary">Full Legal Name</Label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input value={regName} onChange={e => { setRegName(e.target.value); setRegErrors(p => ({ ...p, regName: "" })); }}
                              placeholder="e.g. Jane Smith" className={`pl-10 h-12 text-base rounded-xl bg-muted/20 ${regErrors.regName ? "border-red-500" : ""}`} />
                          </div>
                          <FieldError msg={regErrors.regName} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-secondary">Date of Birth</Label>
                            <Input type="date" value={regDob} onChange={e => { setRegDob(e.target.value); setRegErrors(p => ({ ...p, regDob: "" })); }}
                              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                              className={`h-12 text-base rounded-xl bg-muted/20 ${regErrors.regDob ? "border-red-500" : ""}`} />
                            <FieldError msg={regErrors.regDob} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-secondary">Sex at Birth</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {(["male", "female"] as const).map(s => (
                                <RadioCard key={s} value={s} label={s === "male" ? "Male" : "Female"} selected={regSex === s} onSelect={() => { setRegSex(s); setRegErrors(p => ({ ...p, regSex: "" })); }} />
                              ))}
                            </div>
                            <FieldError msg={regErrors.regSex} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-secondary">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input type="email" value={regEmail} onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({ ...p, regEmail: "" })); }}
                              placeholder="jane@example.com" className={`pl-10 h-12 text-base rounded-xl bg-muted/20 ${regErrors.regEmail ? "border-red-500" : ""}`} />
                          </div>
                          <FieldError msg={regErrors.regEmail} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-secondary">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                              <Input type={showRegPass ? "text" : "password"} value={regPassword} onChange={e => { setRegPassword(e.target.value); setRegErrors(p => ({ ...p, regPassword: "" })); }}
                                placeholder="Min. 8 characters" className={`pl-10 pr-10 h-12 text-base rounded-xl bg-muted/20 ${regErrors.regPassword ? "border-red-500" : ""}`} />
                              <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-secondary">
                                {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <FieldError msg={regErrors.regPassword} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-secondary">Confirm Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                              <Input type="password" value={regConfirm} onChange={e => { setRegConfirm(e.target.value); setRegErrors(p => ({ ...p, regConfirm: "" })); }}
                                placeholder="Repeat password" className={`pl-10 h-12 text-base rounded-xl bg-muted/20 ${regErrors.regConfirm ? "border-red-500" : ""}`} />
                            </div>
                            <FieldError msg={regErrors.regConfirm} />
                          </div>
                        </div>

                        {AddressFields()}

                        <Button type="button" onClick={handleRegister} disabled={regLoading} className="w-full h-12 rounded-xl font-bold bg-secondary text-white hover:bg-secondary/90">
                          {regLoading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account...</span> : "Create Account & Continue"}
                        </Button>
                      </div>
                    )}

                    {/* Address is shown after sign-in only if not logged in yet */}
                    {accountTab === "signin" && !isLoggedIn && (
                      <p className="text-xs text-center text-muted-foreground">Sign in first, then enter your delivery address.</p>
                    )}
                  </>
                )}

                {/* After logged in via sign-in tab, show address + continue */}
                {isLoggedIn && (
                  <div className="pt-4 border-t border-border/50 flex flex-col-reverse sm:flex-row justify-between gap-3">
                    <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                    <Button type="button" size="lg" onClick={handleAccountNext} className="h-12 px-10 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
                      Continue <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </StepWrapper>
          )}

          {/* ── Step 6: GP details + identity verification ──────────────── */}
          {step === STEPS.GP_DETAILS && (
            <StepWrapper stepKey="gp-details">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" /> Required for safe prescribing (GPhC)
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Your GP &amp; identity</h2>
                <p className="text-base text-muted-foreground">We use this information to keep your medical records joined-up and to verify who you are before any medicine can be supplied.</p>
              </div>

              {isHighRisk && (
                <Card className="border-amber-200 bg-amber-50 rounded-2xl mb-6">
                  <CardContent className="p-5 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-900">
                      <p className="font-bold mb-1">This medicine needs extra safeguards</p>
                      <p>Your prescriber will only supply it after careful clinical review. Sharing the details below makes that review more reliable and helps prevent harm.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-7 md:p-9 space-y-7">
                  {/* GP yes/no */}
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-secondary flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" /> Do you have a regular GP in the UK?</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["yes", "no"] as const).map(v => (
                        <RadioCard key={v} value={v} label={v === "yes" ? "Yes — registered with a GP" : "No regular GP"} selected={hasRegularGp === v} onSelect={() => { setHasRegularGp(v); setGpErrors(p => ({ ...p, hasRegularGp: "" })); }} />
                      ))}
                    </div>
                    <FieldError msg={gpErrors.hasRegularGp} />
                  </div>

                  {hasRegularGp === "yes" && (
                    <div className="space-y-5 pt-2 border-t border-border/40">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-secondary">GP's full name</Label>
                          <Input value={gpName} onChange={e => { setGpName(e.target.value); setGpErrors(p => ({ ...p, gpName: "" })); }} placeholder="e.g. Dr Sarah Khan" className={`h-12 rounded-xl bg-muted/20 ${gpErrors.gpName ? "border-red-500" : ""}`} />
                          <FieldError msg={gpErrors.gpName} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-secondary">Surgery / practice name</Label>
                          <Input value={gpSurgery} onChange={e => { setGpSurgery(e.target.value); setGpErrors(p => ({ ...p, gpSurgery: "" })); }} placeholder="e.g. The Old Vicarage Surgery" className={`h-12 rounded-xl bg-muted/20 ${gpErrors.gpSurgery ? "border-red-500" : ""}`} />
                          <FieldError msg={gpErrors.gpSurgery} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-secondary">Surgery address <span className="font-normal text-muted-foreground">(optional)</span></Label>
                        <Input value={gpAddress} onChange={e => setGpAddress(e.target.value)} placeholder="Street, town, postcode" className="h-12 rounded-xl bg-muted/20" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-secondary">Surgery phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
                        <Input value={gpPhone} onChange={e => setGpPhone(e.target.value)} placeholder="e.g. 020 7946 0123" className="h-12 rounded-xl bg-muted/20" />
                      </div>

                      <div className="space-y-3 pt-2">
                        <Label className="text-sm font-bold text-secondary">May we share details of your treatment with your GP?</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {(["yes", "no"] as const).map(v => (
                            <RadioCard key={v} value={v} label={v === "yes" ? "Yes, please share" : "No, do not share"} selected={consentShareWithGp === v} onSelect={() => { setConsentShareWithGp(v); setGpErrors(p => ({ ...p, consentShareWithGp: "" })); }} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Sharing helps keep your medical record up to date and prevents harmful interactions with other treatments. You can withdraw your consent at any time.</p>
                        <FieldError msg={gpErrors.consentShareWithGp} />
                      </div>
                    </div>
                  )}

                  {hasRegularGp === "no" && (
                    <Card className="bg-amber-50 border-amber-200 rounded-2xl">
                      <CardContent className="p-5 text-sm text-amber-900 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold mb-1">Not having a regular GP is a safety flag</p>
                          <p>Your prescriber will review your consultation more carefully and may decline to prescribe. They may direct you to your nearest NHS service first.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Weight management verification */}
                  {isWeightMgmt && (
                    <div className="space-y-4 pt-5 border-t border-border/40">
                      <Label className="text-sm font-bold text-secondary flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-primary" /> Verified height &amp; weight
                      </Label>
                      <p className="text-xs text-muted-foreground -mt-2">For weight management treatments we are required to record height and weight that have been measured (not estimated).</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">Height (cm)</Label>
                          <Input type="number" inputMode="numeric" min={100} max={250} value={verifiedHeight} onChange={e => { setVerifiedHeight(e.target.value); setGpErrors(p => ({ ...p, verifiedHeight: "" })); }} className={`h-12 rounded-xl bg-muted/20 ${gpErrors.verifiedHeight ? "border-red-500" : ""}`} />
                          <FieldError msg={gpErrors.verifiedHeight} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">Weight (kg)</Label>
                          <Input type="number" inputMode="numeric" min={30} max={350} value={verifiedWeight} onChange={e => { setVerifiedWeight(e.target.value); setGpErrors(p => ({ ...p, verifiedWeight: "" })); }} className={`h-12 rounded-xl bg-muted/20 ${gpErrors.verifiedWeight ? "border-red-500" : ""}`} />
                          <FieldError msg={gpErrors.verifiedWeight} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Identity reference (optional — pharmacist may request later) */}
                  <div className="space-y-3 pt-5 border-t border-border/40">
                    <Label className="text-sm font-bold text-secondary flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" /> Identity reference
                      <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
                    </Label>
                    <p className="text-xs text-muted-foreground -mt-2">If you have your NHS number, passport, or driving licence to hand, you can add it now to speed up review. Otherwise, our pharmacist will ask you for it later if needed.</p>
                    <Input value={identityRef} onChange={e => { setIdentityRef(e.target.value); setGpErrors(p => ({ ...p, identityRef: "" })); }} placeholder="e.g. NHS 943 476 5919 (optional)" className="h-12 rounded-xl bg-muted/20" />
                  </div>

                  <div className="pt-4 border-t border-border/50 flex flex-col-reverse sm:flex-row justify-between gap-3">
                    <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                    <Button type="button" size="lg" onClick={handleGpNext} className="h-12 px-10 rounded-full font-bold bg-primary hover:bg-primary/90 shadow-md">
                      Continue to Review <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </StepWrapper>
          )}

          {/* ── Step 7: Review & Submit ───────────────────────────────────── */}
          {step === STEPS.REVIEW && (
            <StepWrapper stepKey="review">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">Review & Submit</h2>
                <p className="text-base text-muted-foreground">Please check everything carefully before submitting your consultation.</p>
              </div>
              <div className="space-y-5">

                {/* Patient details */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-7 py-4 border-b border-border/50">
                    <h3 className="font-bold text-secondary">Your Details</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-full px-3 h-8 text-sm" onClick={() => { goTo(STEPS.ACCOUNT); scrollTop(); }}>Edit</Button>
                  </div>
                  <CardContent className="p-7">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {[
                        { label: "Name", value: patientName },
                        { label: "Email", value: patientEmail },
                        ...(patientDob ? [{ label: "Date of Birth", value: new Date(patientDob).toLocaleDateString("en-GB") }] : []),
                        ...(patientSex ? [{ label: "Sex at Birth", value: patientSex.charAt(0).toUpperCase() + patientSex.slice(1) }] : []),
                        { label: "Delivery Address", value: [addrLine1, addrLine2, addrCity, addrPostcode].filter(Boolean).join(", ") },
                      ].map(item => (
                        <div key={item.label} className={item.label === "Delivery Address" ? "sm:col-span-2" : ""}>
                          <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</dt>
                          <dd className="font-semibold text-secondary">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>

                {/* Clinical answers */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-7 py-4 border-b border-border/50">
                    <h3 className="font-bold text-secondary">Clinical Answers</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-full px-3 h-8 text-sm" onClick={() => { goTo(STEPS.CLINICAL); scrollTop(); }}>Edit</Button>
                  </div>
                  <CardContent className="p-7">
                    <dl className="space-y-4 text-sm">
                      {questions.clinicalQuestions.map(q => {
                        const val = clinicalAnswers[q.id];
                        if (!val || (Array.isArray(val) && val.length === 0)) return null;
                        return (
                          <div key={q.id}>
                            <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{q.text}</dt>
                            <dd className="font-medium text-secondary">{Array.isArray(val) ? val.join(", ") : val as string}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  </CardContent>
                </Card>

                {/* Medical history */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-7 py-4 border-b border-border/50">
                    <h3 className="font-bold text-secondary">Medical Background</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-full px-3 h-8 text-sm" onClick={() => { goTo(STEPS.MEDICAL); scrollTop(); }}>Edit</Button>
                  </div>
                  <CardContent className="p-7">
                    <dl className="space-y-4 text-sm">
                      <div><dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Allergies</dt><dd className="font-medium text-secondary">{noAllergies ? "No known drug allergies" : allergies}</dd></div>
                      <div><dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Medications</dt><dd className="font-medium text-secondary">{noMedications ? "Not taking any medication" : medications}</dd></div>
                      <div><dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Medical History</dt><dd className="font-medium text-secondary">{noMedicalHistory ? "No significant medical history" : medicalHistory}</dd></div>
                    </dl>
                  </CardContent>
                </Card>

                {/* GP & identity */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-7 py-4 border-b border-border/50">
                    <h3 className="font-bold text-secondary">GP &amp; Identity</h3>
                    <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10 rounded-full px-3 h-8 text-sm" onClick={() => { goTo(STEPS.GP_DETAILS); scrollTop(); }}>Edit</Button>
                  </div>
                  <CardContent className="p-7">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Regular GP</dt>
                        <dd className="font-semibold text-secondary">{hasRegularGp === "yes" ? `${gpName}${gpSurgery ? `, ${gpSurgery}` : ""}` : "No regular GP"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Share with GP</dt>
                        <dd className="font-semibold text-secondary">{hasRegularGp === "yes" ? (consentShareWithGp === "yes" ? "Yes — please share" : "No — do not share") : "N/A"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Identity reference</dt>
                        <dd className="font-mono font-semibold text-secondary">{identityRef}</dd>
                      </div>
                      {isWeightMgmt && (
                        <div className="sm:col-span-2">
                          <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Verified height &amp; weight</dt>
                          <dd className="font-semibold text-secondary">{verifiedHeight} cm &middot; {verifiedWeight} kg</dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                {/* Consent — GPhC granular */}
                <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-7 space-y-4">
                    <h3 className="font-bold text-secondary text-base">Your declarations</h3>
                    <p className="text-xs text-muted-foreground -mt-1">Each of these is required by professional pharmacy standards before we can supply medicine.</p>

                    {[
                      {
                        v: consentIdentityConfirmed, set: setConsentIdentityConfirmed,
                        title: "I confirm my identity and that all information I have provided is accurate.",
                        sub: "I understand that providing false or incomplete information could be harmful to my health and may result in refusal to supply.",
                      },
                      {
                        v: consentTreatment, set: setConsentTreatment,
                        title: "I consent to a UK-registered pharmacist independent prescriber making a prescribing decision based on this consultation.",
                        sub: "I understand they may approve, request more information, refer me, or decline to prescribe.",
                      },
                      {
                        v: consentDelivery, set: setConsentDelivery,
                        title: "I consent to medicine being dispatched to the delivery address shown above using a tracked carrier.",
                        sub: "I will receive tracking details by email and confirm I am able to receive medicine at this address safely and securely.",
                      },
                      {
                        v: consentDataProcessing, set: setConsentDataProcessing,
                        title: "I have read and understood the Privacy & Data Policy and consent to my health data being processed for this purpose.",
                        sub: "Records are kept for the periods required by UK pharmacy law. I can contact the DPO at any time to exercise my data rights.",
                      },
                    ].map((c, i) => (
                      <div key={i} className={`flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-colors ${c.v ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/10"}`} onClick={() => c.set(!c.v)}>
                        <Checkbox checked={c.v} onCheckedChange={x => c.set(!!x)} className="w-5 h-5 border-2 mt-0.5 shrink-0" onClick={e => e.stopPropagation()} />
                        <div>
                          <p className="font-bold text-secondary text-sm">{c.title}</p>
                          <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{c.sub}</p>
                        </div>
                      </div>
                    ))}

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed font-medium"><strong>Important:</strong> If you are experiencing a medical emergency, call <strong>999</strong>. For urgent advice, call <strong>NHS 111</strong>.</p>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-2">
                      <Button type="button" variant="outline" className="h-12 px-8 rounded-full font-bold border-2" onClick={goBack}>Back</Button>
                      <Button type="button" size="lg" onClick={submitConsultation} disabled={submitting || !consentTreatment || !consentDelivery || !consentDataProcessing || !consentIdentityConfirmed}
                        className={`h-12 px-10 rounded-full font-bold shadow-md transition-all ${(consentTreatment && consentDelivery && consentDataProcessing && consentIdentityConfirmed) ? "bg-accent hover:bg-accent/90 text-accent-foreground hover:-translate-y-0.5" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                      >
                        {submitting
                          ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting...</span>
                          : "Submit Consultation"
                        }
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

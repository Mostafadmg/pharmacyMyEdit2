import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  NewConsultationInputPatientSex,
  type Consultation as ConsultationDto,
} from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { UploadCloud, XCircle, CheckCircle2, Stethoscope } from "lucide-react";

import {
  ConsultationShell,
  StepCard,
  RadioRow,
  YesNoChoice,
  CheckboxRow,
  CheckboxGrid,
  NumberField,
  DateField,
  TextField,
  TextareaField,
  SelectField,
  ContinueButton,
  EligibilityNotice,
  EmergencyStop,
} from "@/components/consultation";
import {
  getConditionQuestions,
  type ClinicalQuestion,
  type EligibilityQuestion,
} from "@/data/conditionQuestions";
import { newConditionDbSeeds } from "@/data/newConditionsData";

// ─── Constants ────────────────────────────────────────────────────────────────
const PHARMACIST_TEL = "08001234567";

const PHOTO_CONDITIONS = new Set<string>([
  "acne-vulgaris",
  "acne",
  "rosacea",
  "hair-loss",
  "nail-infection",
  "fungal-nail-infection",
  "genital-herpes",
  "genital-warts",
]);

type Step =
  | "ELIGIBILITY"
  | "CLINICAL"
  | "MEDICAL"
  | "PHOTO"
  | "ACCOUNT"
  | "GP"
  | "REVIEW";

type ClinicalAnswers = Record<string, string | string[]>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calculateAge(dob: string): number {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface PatientStorage {
  token: string;
  patientId: string;
  name: string;
  email: string;
  dateOfBirth?: string | null;
  sex?: string | null;
  phone?: string | null;
}

function savePatientToStorage(data: PatientStorage) {
  localStorage.setItem("patient_token", data.token);
  localStorage.setItem("patient_id", data.patientId);
  localStorage.setItem("patient_name", data.name);
  localStorage.setItem("patient_email", data.email);
  if (data.dateOfBirth) localStorage.setItem("patient_dob", data.dateOfBirth);
  if (data.sex) localStorage.setItem("patient_sex", data.sex);
  if (data.phone) localStorage.setItem("patient_phone", data.phone);
}

function conditionDisplayName(id: string): string {
  const seed = newConditionDbSeeds.find((s) => s.id === id);
  if (seed) return seed.name.split(" (")[0];
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function answerLabel(q: ClinicalQuestion, value: string | string[] | undefined): string {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "—";
  }
  if (q.kind === "yesno") {
    return value === "yes" ? "Yes" : value === "no" ? "No" : String(value);
  }
  if (q.kind === "radio" || q.kind === "select") {
    const v = String(value);
    return q.options.find((o) => o.value === v)?.label ?? v;
  }
  if (q.kind === "checkbox-multi") {
    const arr = Array.isArray(value) ? value : [value];
    return arr
      .map((v) => q.options.find((o) => o.value === v)?.label ?? v)
      .join(", ");
  }
  return Array.isArray(value) ? value.join(", ") : String(value);
}

// ─── Clinical question dispatcher ─────────────────────────────────────────────
interface CqProps {
  question: ClinicalQuestion;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  unitValue?: string;
  onUnitChange?: (value: string) => void;
  error?: string;
}

function ClinicalQuestionRenderer({
  question: q,
  value,
  onChange,
  unitValue,
  onUnitChange,
  error,
}: CqProps) {
  switch (q.kind) {
    case "yesno": {
      const v = value === "yes" || value === "no" ? value : null;
      return <YesNoChoice value={v} onChange={(yn) => onChange(yn)} />;
    }
    case "radio":
      return (
        <div className="flex flex-col gap-3">
          {q.options.map((opt) => (
            <RadioRow
              key={opt.value}
              selected={value === opt.value}
              onSelect={() => onChange(opt.value)}
              title={opt.label}
              subtitle={opt.subtitle}
            />
          ))}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      );
    case "checkbox-multi": {
      const selected = Array.isArray(value) ? value : value ? [value] : [];
      return (
        <div>
          <CheckboxGrid
            options={q.options}
            selected={selected}
            onChange={(next) => onChange(next)}
            noneValue={q.noneValue ?? "none"}
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      );
    }
    case "number": {
      const numValue: number | "" =
        value === undefined || value === "" ? "" : Number(value);
      return (
        <NumberField
          label={q.text}
          value={Number.isNaN(numValue as number) ? "" : numValue}
          onChange={(n) => onChange(n === "" ? "" : String(n))}
          unit={q.unit}
          unitOptions={q.unitToggle?.options}
          unitValue={unitValue ?? q.unitToggle?.default}
          onUnitChange={onUnitChange}
          min={q.min}
          max={q.max}
          placeholder={q.placeholder}
          error={error}
        />
      );
    }
    case "date":
      return (
        <DateField
          label={q.text}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
          min={q.min}
          max={q.max}
          error={error}
        />
      );
    case "text":
      return (
        <TextField
          label={q.text}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
          placeholder={q.placeholder}
          error={error}
        />
      );
    case "textarea":
      return (
        <TextareaField
          label={q.text}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
          placeholder={q.placeholder}
          maxLength={q.maxLength}
          error={error}
        />
      );
    case "select":
      return (
        <SelectField
          label={q.text}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => onChange(v)}
          options={q.options}
          placeholder={q.placeholder ?? "Select…"}
          error={error}
        />
      );
  }
}

// ─── Success card ─────────────────────────────────────────────────────────────
function SuccessCard({
  reference,
  email,
}: {
  reference: string;
  email: string;
}) {
  return (
    <StepCard
      icon={<CheckCircle2 className="h-7 w-7" />}
      title="Consultation submitted"
      subtitle={`Order number ${reference}. We've emailed a confirmation to ${email}.`}
    >
      <ol className="mt-2 space-y-3 text-sm text-foreground/80">
        <li>1. A pharmacist will review your answers — typically within 2 hours.</li>
        <li>2. If suitable, your prescription is dispensed and dispatched.</li>
        <li>3. Track progress any time in your patient portal.</li>
      </ol>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/my-consultations"
          className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          View my consultations
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border-2 border-border bg-card px-4 text-sm font-medium text-foreground hover:border-foreground/30"
        >
          Browse shop
        </Link>
      </div>
    </StepCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Consultation() {
  const { conditionId: rawConditionId } = useParams<{ conditionId?: string }>();
  const conditionId = (rawConditionId ?? "").trim();
  const [, setLocation] = useLocation();

  const questions = useMemo(
    () => (conditionId ? getConditionQuestions(conditionId) : null),
    [conditionId],
  );
  const conditionName = useMemo(() => conditionDisplayName(conditionId), [conditionId]);
  const requiresPhoto = PHOTO_CONDITIONS.has(conditionId);

  // ── Repeat / follow-up: read ?repeatOf=<id> ────────────────────────────────
  const [repeatOfId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("repeatOf");
    return v && v.trim() ? v.trim() : null;
  });
  const [priorConsultation, setPriorConsultation] = useState<ConsultationDto | null>(null);
  const [repeatPrefilled, setRepeatPrefilled] = useState(false);

  useEffect(() => {
    if (!repeatOfId) return;
    let cancelled = false;
    apiFetch<ConsultationDto>(
      `/api/consultations/${encodeURIComponent(repeatOfId)}`,
      { auth: "patient" },
    )
      .then((c) => {
        if (!cancelled) setPriorConsultation(c);
      })
      .catch(() => {
        /* silent — prefill simply won't run */
      });
    return () => {
      cancelled = true;
    };
  }, [repeatOfId]);

  // ── Flow state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("ELIGIBILITY");
  const [eligibilityIndex, setEligibilityIndex] = useState(0);
  const [clinicalIndex, setClinicalIndex] = useState(0);

  const [eligibilityAnswers, setEligibilityAnswers] = useState<Record<string, "yes" | "no">>({});
  const [softFlags, setSoftFlags] = useState<string[]>([]);
  const [hardBlock, setHardBlock] = useState<EligibilityQuestion | null>(null);

  const [clinicalAnswers, setClinicalAnswers] = useState<ClinicalAnswers>({});
  const [clinicalErrors, setClinicalErrors] = useState<Record<string, string>>({});

  // Medical
  const [allergies, setAllergies] = useState("");
  const [noAllergies, setNoAllergies] = useState(false);
  const [medications, setMedications] = useState("");
  const [noMedications, setNoMedications] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState("");
  const [noMedicalHistory, setNoMedicalHistory] = useState(false);

  // Photo
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Account
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("patient_token"),
  );
  const [patientName, setPatientName] = useState(
    () => localStorage.getItem("patient_name") ?? "",
  );
  const [patientEmail, setPatientEmail] = useState(
    () => localStorage.getItem("patient_email") ?? "",
  );
  const [patientPhone, setPatientPhone] = useState(
    () => localStorage.getItem("patient_phone") ?? "",
  );
  const [patientDob, setPatientDob] = useState(
    () => localStorage.getItem("patient_dob") ?? "",
  );
  const [patientSex, setPatientSex] = useState<"male" | "female" | "other" | "">(
    () => (localStorage.getItem("patient_sex") as "male" | "female" | "other") || "",
  );

  const [accountTab, setAccountTab] = useState<"signin" | "register">("register");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInLoading, setSignInLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regSex, setRegSex] = useState<"male" | "female" | "other" | "">("");
  const [regPassword, setRegPassword] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);

  // GP
  const [gpShare, setGpShare] = useState<"" | "yes" | "no" | "no_gp">("");
  const [gpPractice, setGpPractice] = useState("");
  const [gpAddress, setGpAddress] = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");

  // ── Repeat prefill ───────────────────────────────────────────────────────
  useEffect(() => {
    if (repeatPrefilled || !priorConsultation || !repeatOfId || !questions) return;
    if (priorConsultation.conditionId !== conditionId) {
      setRepeatPrefilled(true);
      return;
    }
    const priorAnswers = (priorConsultation.answers ?? {}) as Record<string, unknown>;
    const next: ClinicalAnswers = {};
    for (const q of questions.clinicalQuestions) {
      const raw = priorAnswers[q.id];
      if (typeof raw !== "string" || !raw) continue;
      if (q.kind === "checkbox-multi") {
        next[q.id] = raw.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        next[q.id] = raw;
      }
    }
    if (Object.keys(next).length > 0) {
      setClinicalAnswers((prev) => ({ ...next, ...prev }));
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

  // ── Step ordering helpers ────────────────────────────────────────────────
  const stepOrder = useMemo<Step[]>(() => {
    const list: Step[] = ["ELIGIBILITY", "CLINICAL", "MEDICAL"];
    if (requiresPhoto) list.push("PHOTO");
    if (!isLoggedIn) list.push("ACCOUNT");
    list.push("GP", "REVIEW");
    return list;
  }, [requiresPhoto, isLoggedIn]);

  const stepNumber = stepOrder.indexOf(step) + 1;
  const totalSteps = stepOrder.length;
  const stepLabels: Record<Step, string> = {
    ELIGIBILITY: "Safety check",
    CLINICAL: "Your symptoms",
    MEDICAL: "Medical background",
    PHOTO: "Upload a photo",
    ACCOUNT: "Your account",
    GP: "Your GP",
    REVIEW: "Review & submit",
  };

  function goNext() {
    const idx = stepOrder.indexOf(step);
    if (idx >= 0 && idx < stepOrder.length - 1) {
      setStep(stepOrder[idx + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goBack() {
    if (step === "ELIGIBILITY") {
      if (eligibilityIndex > 0) {
        setEligibilityIndex((i) => i - 1);
        return;
      }
      setLocation(`/conditions/${conditionId}`);
      return;
    }
    if (step === "CLINICAL") {
      if (clinicalIndex > 0) {
        setClinicalIndex((i) => i - 1);
        return;
      }
      setStep("ELIGIBILITY");
      if (questions) setEligibilityIndex(questions.eligibilityQuestions.length - 1);
      return;
    }
    const idx = stepOrder.indexOf(step);
    if (idx > 0) {
      const prev = stepOrder[idx - 1];
      setStep(prev);
      if (prev === "CLINICAL" && questions) {
        setClinicalIndex(questions.clinicalQuestions.length - 1);
      }
    }
  }

  // ── Eligibility handlers ─────────────────────────────────────────────────
  function handleEligibilityAnswer(q: EligibilityQuestion, answer: "yes" | "no") {
    setEligibilityAnswers((prev) => ({ ...prev, [q.id]: answer }));
    if (answer === q.blockingAnswer) {
      if (q.severity === "hard") {
        setHardBlock(q);
      }
      // soft -> render notice in-place, user picks an action
      return;
    }
    // safe answer — auto-advance
    if (!questions) return;
    if (eligibilityIndex < questions.eligibilityQuestions.length - 1) {
      setEligibilityIndex((i) => i + 1);
    } else {
      setStep("CLINICAL");
      setClinicalIndex(0);
    }
  }

  function continueSoftFlag(q: EligibilityQuestion) {
    setSoftFlags((prev) => (prev.includes(q.id) ? prev : [...prev, q.id]));
    if (!questions) return;
    if (eligibilityIndex < questions.eligibilityQuestions.length - 1) {
      setEligibilityIndex((i) => i + 1);
    } else {
      setStep("CLINICAL");
      setClinicalIndex(0);
    }
  }

  function resetEligibilityAnswer(q: EligibilityQuestion) {
    setEligibilityAnswers((prev) => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
    setSoftFlags((prev) => prev.filter((id) => id !== q.id));
    setHardBlock(null);
  }

  // ── Clinical handlers ────────────────────────────────────────────────────
  function setClinicalValue(id: string, value: string | string[]) {
    setClinicalAnswers((prev) => ({ ...prev, [id]: value }));
    setClinicalErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function validateClinical(q: ClinicalQuestion): string | null {
    if (!q.required) return null;
    const v = clinicalAnswers[q.id];
    if (v === undefined || v === "") return "Please answer this question.";
    if (Array.isArray(v) && v.length === 0) return "Please pick at least one option.";
    return null;
  }

  function handleClinicalNext() {
    if (!questions) return;
    const q = questions.clinicalQuestions[clinicalIndex];
    if (!q) return;
    const err = validateClinical(q);
    if (err) {
      setClinicalErrors((prev) => ({ ...prev, [q.id]: err }));
      return;
    }
    if (clinicalIndex < questions.clinicalQuestions.length - 1) {
      setClinicalIndex((i) => i + 1);
    } else {
      goNext();
    }
  }

  // ── Account: sign in / register ──────────────────────────────────────────
  async function handleSignIn() {
    setSignInError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInEmail)) {
      setSignInError("Please enter a valid email.");
      return;
    }
    if (!signInPassword) {
      setSignInError("Please enter your password.");
      return;
    }
    setSignInLoading(true);
    try {
      const data = await apiFetch<PatientStorage>("/api/auth/patient-login", {
        method: "POST",
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      savePatientToStorage(data);
      setPatientName(data.name);
      setPatientEmail(data.email);
      setPatientDob(data.dateOfBirth ?? "");
      setPatientSex((data.sex as "male" | "female" | "other") || "");
      setPatientPhone(data.phone ?? "");
      setIsLoggedIn(true);
      toast.success(`Welcome back, ${data.name.split(" ")[0]}!`);
      // skip ACCOUNT step from now on
      setStep("GP");
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setSignInLoading(false);
    }
  }

  async function handleRegister() {
    const errs: Record<string, string> = {};
    if (regName.trim().length < 2) errs.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = "Valid email required.";
    if (!regDob) errs.dob = "Date of birth is required.";
    else {
      const age = calculateAge(regDob);
      if (age < 18) errs.dob = "You must be 18 or over.";
      if (age > 120) errs.dob = "Please enter a valid date.";
    }
    if (!regSex) errs.sex = "Please pick an option.";
    if (regPassword.length < 8) errs.password = "Password must be at least 8 characters.";
    setRegErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setRegLoading(true);
    try {
      const data = await apiFetch<PatientStorage>("/api/auth/patient-register", {
        method: "POST",
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim() || undefined,
          password: regPassword,
          dateOfBirth: regDob,
          sex: regSex,
        }),
      });
      savePatientToStorage(data);
      setPatientName(data.name);
      setPatientEmail(data.email);
      setPatientDob(data.dateOfBirth ?? regDob);
      setPatientSex((data.sex as "male" | "female" | "other") || regSex);
      setPatientPhone(data.phone ?? regPhone);
      setIsLoggedIn(true);
      toast.success("Account created.");
      setStep("GP");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed.";
      if (msg.toLowerCase().includes("exist")) {
        setRegErrors({ email: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setRegLoading(false);
    }
  }

  // ── Photo handling ───────────────────────────────────────────────────────
  function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const max = 10 * 1024 * 1024;
    const allowed = ["image/jpeg", "image/png", "image/heic", "image/webp"];
    const accepted: File[] = [];
    setPhotoError(null);
    for (const f of Array.from(files)) {
      if (!allowed.includes(f.type) && !/\.(jpe?g|png|heic|webp)$/i.test(f.name)) {
        setPhotoError("Please upload JPEG, PNG, HEIC or WebP only.");
        continue;
      }
      if (f.size > max) {
        setPhotoError(`"${f.name}" is over 10MB and was skipped.`);
        continue;
      }
      accepted.push(f);
    }
    Promise.all(
      accepted.map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("read failed"));
            reader.readAsDataURL(f);
          }),
      ),
    )
      .then((urls) => setPhotoDataUrls((prev) => [...prev, ...urls].slice(0, 6)))
      .catch(() => setPhotoError("Could not read one of your photos. Please try again."));
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function submitConsultation() {
    if (!conditionId || !questions) return;
    // Sex sanity check
    if (patientSex !== "male" && patientSex !== "female" && patientSex !== "other") {
      toast.error("Please tell us your sex so the pharmacist can prescribe safely.");
      return;
    }
    setSubmitting(true);
    try {
      const age = patientDob ? calculateAge(patientDob) : 0;

      const answersPayload: Record<string, unknown> = {};
      for (const q of questions.clinicalQuestions) {
        const v = clinicalAnswers[q.id];
        if (v === undefined || v === "") continue;
        if (Array.isArray(v)) {
          if (v.length === 0) continue;
          answersPayload[q.id] = v.join(", ");
        } else {
          answersPayload[q.id] = v;
        }
        if (q.kind === "number" && q.unitToggle) {
          const unit = clinicalAnswers[`${q.id}__unit`];
          if (typeof unit === "string" && unit) {
            answersPayload[`${q.id}__unit`] = unit;
          }
        }
      }

      // Pharmacist-review flags
      const flags = [...softFlags];
      if (patientSex === "other") flags.push("sex_prefer_to_discuss");
      answersPayload._softFlags = flags;
      answersPayload._needsPharmacistReview = flags.length > 0;

      if (gpShare) {
        answersPayload._gpShare = gpShare;
        if (gpShare === "yes") {
          if (gpPractice) answersPayload._gpPractice = gpPractice;
          if (gpAddress) answersPayload._gpAddress = gpAddress;
        }
      }

      const verifiedRepeatOfId =
        repeatOfId && priorConsultation?.id === repeatOfId ? repeatOfId : undefined;

      // Map "other" to API "other"
      const apiSex: NewConsultationInputPatientSex =
        patientSex === "male"
          ? NewConsultationInputPatientSex.male
          : patientSex === "female"
            ? NewConsultationInputPatientSex.female
            : NewConsultationInputPatientSex.other;

      const body = {
        conditionId,
        previousConsultationId: verifiedRepeatOfId,
        patientName,
        patientEmail,
        patientPhone: patientPhone || undefined,
        patientAge: age,
        patientSex: apiSex,
        allergies: noAllergies ? "None" : allergies.trim(),
        currentMedications: noMedications ? "None" : medications.trim(),
        medicalHistory: noMedicalHistory ? "None" : medicalHistory.trim(),
        answers: answersPayload,
        hasPhoto: requiresPhoto && photoDataUrls.length > 0,
        photoUrls: photoDataUrls,
      };

      const data = await apiFetch<{ id: string; consultationNumber?: string }>(
        "/api/consultations",
        {
        method: "POST",
        auth: "patient",
        body: JSON.stringify(body),
        },
      );
      setSubmittedRef(
        data.consultationNumber?.trim() ||
          `#${String(data.id || "").replace(/-/g, "").toUpperCase().slice(-8)}`,
      );
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / no questions guard ─────────────────────────────────────────
  if (!questions) {
    return (
      <ConsultationShell step={1} totalSteps={1} stepLabel="Loading" hideProgress>
        <StepCard title="Loading…">
          <p className="text-sm text-muted-foreground">Preparing your consultation.</p>
        </StepCard>
      </ConsultationShell>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <ConsultationShell step={totalSteps} totalSteps={totalSteps} stepLabel="Done" hideProgress>
        <SuccessCard reference={submittedRef} email={patientEmail} />
      </ConsultationShell>
    );
  }

  // ── Render step ──────────────────────────────────────────────────────────
  return (
    <ConsultationShell
      step={stepNumber}
      totalSteps={totalSteps}
      stepLabel={stepLabels[step]}
      onBack={goBack}
    >
      {priorConsultation && repeatOfId && (
        <div className="mb-4 rounded-2xl border border-border bg-accent/40 px-4 py-3 text-sm text-foreground/80">
          Follow-up of your{" "}
          <strong>{priorConsultation.conditionName ?? conditionName}</strong>{" "}
          consultation from{" "}
          {new Date(priorConsultation.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .{" "}
          {priorConsultation.conditionId === conditionId
            ? "We've pre-filled your previous answers — please review them carefully."
            : "We've linked this to your previous consultation for your pharmacist."}
        </div>
      )}

      {step === "ELIGIBILITY" && (
        <EligibilityStep
          question={questions.eligibilityQuestions[eligibilityIndex]}
          index={eligibilityIndex}
          total={questions.eligibilityQuestions.length}
          answer={
            eligibilityAnswers[questions.eligibilityQuestions[eligibilityIndex]?.id ?? ""] ?? null
          }
          hardBlock={hardBlock}
          softFlagged={softFlags.includes(
            questions.eligibilityQuestions[eligibilityIndex]?.id ?? "",
          )}
          onAnswer={handleEligibilityAnswer}
          onContinueSoftFlag={continueSoftFlag}
          onReset={resetEligibilityAnswer}
        />
      )}

      {step === "CLINICAL" && (
        <ClinicalStep
          question={questions.clinicalQuestions[clinicalIndex]}
          index={clinicalIndex}
          total={questions.clinicalQuestions.length}
          value={clinicalAnswers[questions.clinicalQuestions[clinicalIndex]?.id ?? ""]}
          unitValue={
            clinicalAnswers[
              `${questions.clinicalQuestions[clinicalIndex]?.id ?? ""}__unit`
            ] as string | undefined
          }
          onUnitChange={(unit) => {
            const q = questions.clinicalQuestions[clinicalIndex];
            if (!q) return;
            setClinicalAnswers((prev) => ({ ...prev, [`${q.id}__unit`]: unit }));
          }}
          error={clinicalErrors[questions.clinicalQuestions[clinicalIndex]?.id ?? ""]}
          onChange={(v) => {
            const q = questions.clinicalQuestions[clinicalIndex];
            if (!q) return;
            setClinicalValue(q.id, v);
          }}
          onNext={handleClinicalNext}
        />
      )}

      {step === "MEDICAL" && (
        <MedicalStep
          allergies={allergies}
          noAllergies={noAllergies}
          onAllergiesChange={setAllergies}
          onNoAllergiesChange={(v) => {
            setNoAllergies(v);
            if (v) setAllergies("");
          }}
          medications={medications}
          noMedications={noMedications}
          onMedicationsChange={setMedications}
          onNoMedicationsChange={(v) => {
            setNoMedications(v);
            if (v) setMedications("");
          }}
          medicalHistory={medicalHistory}
          noMedicalHistory={noMedicalHistory}
          onMedicalHistoryChange={setMedicalHistory}
          onNoMedicalHistoryChange={(v) => {
            setNoMedicalHistory(v);
            if (v) setMedicalHistory("");
          }}
          onNext={goNext}
        />
      )}

      {step === "PHOTO" && (
        <PhotoStep
          photos={photoDataUrls}
          error={photoError}
          onFiles={handlePhotoFiles}
          onRemove={(i) => setPhotoDataUrls((prev) => prev.filter((_, j) => j !== i))}
          onContinue={goNext}
          onSkip={() => {
            setPhotoDataUrls([]);
            goNext();
          }}
        />
      )}

      {step === "ACCOUNT" && (
        <AccountStep
          tab={accountTab}
          onTabChange={setAccountTab}
          signInEmail={signInEmail}
          signInPassword={signInPassword}
          signInError={signInError}
          signInLoading={signInLoading}
          onSignInEmailChange={setSignInEmail}
          onSignInPasswordChange={setSignInPassword}
          onSignIn={handleSignIn}
          regName={regName}
          regEmail={regEmail}
          regPhone={regPhone}
          regDob={regDob}
          regSex={regSex}
          regPassword={regPassword}
          regErrors={regErrors}
          regLoading={regLoading}
          onRegNameChange={setRegName}
          onRegEmailChange={setRegEmail}
          onRegPhoneChange={setRegPhone}
          onRegDobChange={setRegDob}
          onRegSexChange={setRegSex}
          onRegPasswordChange={setRegPassword}
          onRegister={handleRegister}
        />
      )}

      {step === "GP" && (
        <GpStep
          share={gpShare}
          practice={gpPractice}
          address={gpAddress}
          patientSex={patientSex}
          showSexPicker={isLoggedIn && !patientSex}
          onShareChange={setGpShare}
          onPracticeChange={setGpPractice}
          onAddressChange={setGpAddress}
          onSexChange={setPatientSex}
          onNext={goNext}
        />
      )}

      {step === "REVIEW" && (
        <ReviewStep
          conditionName={conditionName}
          age={patientDob ? calculateAge(patientDob) : 0}
          questions={questions.clinicalQuestions}
          answers={clinicalAnswers}
          softFlags={softFlags}
          submitting={submitting}
          onSubmit={submitConsultation}
        />
      )}
    </ConsultationShell>
  );
}

// ─── Eligibility step ─────────────────────────────────────────────────────────
function EligibilityStep({
  question,
  index,
  total,
  answer,
  hardBlock,
  softFlagged,
  onAnswer,
  onContinueSoftFlag,
  onReset,
}: {
  question: EligibilityQuestion | undefined;
  index: number;
  total: number;
  answer: "yes" | "no" | null;
  hardBlock: EligibilityQuestion | null;
  softFlagged: boolean;
  onAnswer: (q: EligibilityQuestion, v: "yes" | "no") => void;
  onContinueSoftFlag: (q: EligibilityQuestion) => void;
  onReset: (q: EligibilityQuestion) => void;
}) {
  if (!question) return null;

  if (hardBlock) {
    const isEmergency = /999/.test(hardBlock.blockMessage);
    return (
      <EmergencyStop
        title={hardBlock.blockTitle ?? "We need to stop here"}
        message={hardBlock.blockMessage}
        severity={isEmergency ? "emergency" : "urgent"}
        onChangeAnswer={() => onReset(hardBlock)}
      />
    );
  }

  const showSoftNotice =
    answer === question.blockingAnswer && question.severity === "soft" && !softFlagged;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Safety check · {index + 1} of {total}
      </p>
      <StepCard title={question.text} subtitle={question.subtext}>
        <YesNoChoice
          value={answer}
          onChange={(v) => onAnswer(question, v)}
        />
      </StepCard>
      {showSoftNotice && (
        <EligibilityNotice
          title={question.blockTitle ?? "Let's get a pharmacist to review this"}
          message={question.blockMessage}
          pharmacistTel={PHARMACIST_TEL}
          onContinueWithReview={() => onContinueSoftFlag(question)}
          onChangeAnswer={() => onReset(question)}
        />
      )}
    </div>
  );
}

// ─── Clinical step ────────────────────────────────────────────────────────────
function ClinicalStep({
  question,
  index,
  total,
  value,
  unitValue,
  onUnitChange,
  error,
  onChange,
  onNext,
}: {
  question: ClinicalQuestion | undefined;
  index: number;
  total: number;
  value: string | string[] | undefined;
  unitValue: string | undefined;
  onUnitChange: (v: string) => void;
  error: string | undefined;
  onChange: (v: string | string[]) => void;
  onNext: () => void;
}) {
  if (!question) return null;
  const isLast = index === total - 1;
  // For self-labelled fields, only show plain subtitle in StepCard
  const showTitleInCard =
    question.kind === "yesno" ||
    question.kind === "radio" ||
    question.kind === "checkbox-multi";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Question {index + 1} of {total}
      </p>
      <StepCard
        icon={<Stethoscope className="h-6 w-6" />}
        title={showTitleInCard ? question.text : undefined}
        subtitle={showTitleInCard ? question.subtext : undefined}
      >
        <ClinicalQuestionRenderer
          question={question}
          value={value}
          onChange={onChange}
          unitValue={unitValue}
          onUnitChange={onUnitChange}
          error={error}
        />
        <div className="mt-6">
          <ContinueButton onClick={onNext} label={isLast ? "Continue" : "Next question"} />
        </div>
      </StepCard>
    </div>
  );
}

// ─── Medical step ─────────────────────────────────────────────────────────────
function MedicalStep(props: {
  allergies: string;
  noAllergies: boolean;
  onAllergiesChange: (v: string) => void;
  onNoAllergiesChange: (v: boolean) => void;
  medications: string;
  noMedications: boolean;
  onMedicationsChange: (v: string) => void;
  onNoMedicationsChange: (v: boolean) => void;
  medicalHistory: string;
  noMedicalHistory: boolean;
  onMedicalHistoryChange: (v: string) => void;
  onNoMedicalHistoryChange: (v: boolean) => void;
  onNext: () => void;
}) {
  const canContinue =
    (props.noAllergies || props.allergies.trim().length > 0) &&
    (props.noMedications || props.medications.trim().length > 0) &&
    (props.noMedicalHistory || props.medicalHistory.trim().length > 0);

  return (
    <div className="flex flex-col gap-5">
      <StepCard title="Allergies" subtitle="Any reactions to medicines or ingredients.">
        <div className="flex flex-col gap-3">
          <TextField
            label="List your allergies"
            value={props.allergies}
            onChange={props.onAllergiesChange}
            placeholder="e.g. penicillin – rash"
          />
          <CheckboxRow
            checked={props.noAllergies}
            onToggle={() => props.onNoAllergiesChange(!props.noAllergies)}
            title="I have no known allergies"
          />
        </div>
      </StepCard>

      <StepCard title="Current medications" subtitle="Prescription, OTC, vitamins or supplements.">
        <div className="flex flex-col gap-3">
          <TextareaField
            label="What do you take?"
            value={props.medications}
            onChange={props.onMedicationsChange}
            placeholder="e.g. Lisinopril 10mg once daily"
            rows={4}
          />
          <CheckboxRow
            checked={props.noMedications}
            onToggle={() => props.onNoMedicationsChange(!props.noMedications)}
            title="I take no medicines"
          />
        </div>
      </StepCard>

      <StepCard
        title="Medical history"
        subtitle="Any ongoing conditions, surgeries or hospital admissions."
      >
        <div className="flex flex-col gap-3">
          <TextareaField
            label="Your medical history"
            value={props.medicalHistory}
            onChange={props.onMedicalHistoryChange}
            placeholder="e.g. type 2 diabetes (well-controlled)"
            rows={4}
          />
          <CheckboxRow
            checked={props.noMedicalHistory}
            onToggle={() => props.onNoMedicalHistoryChange(!props.noMedicalHistory)}
            title="I have no significant medical history"
          />
        </div>
      </StepCard>

      <ContinueButton onClick={props.onNext} disabled={!canContinue} />
    </div>
  );
}

// ─── Photo step ───────────────────────────────────────────────────────────────
function PhotoStep({
  photos,
  error,
  onFiles,
  onRemove,
  onContinue,
  onSkip,
}: {
  photos: string[];
  error: string | null;
  onFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <StepCard
      title="Upload a photo"
      subtitle="A clear, well-lit photo of the affected area helps our pharmacist prescribe safely."
    >
      <label
        htmlFor="photo-upload-input"
        className="block cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/40 p-8 text-center transition-colors hover:border-primary/60 hover:bg-accent/30"
      >
        <UploadCloud className="mx-auto mb-3 h-8 w-8 text-primary" />
        <p className="text-sm font-medium text-foreground">Tap to add photos</p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPEG, PNG, HEIC or WebP — up to 10MB each. Up to 6 photos.
        </p>
        <input
          id="photo-upload-input"
          type="file"
          accept="image/jpeg,image/png,image/heic,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((url, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-border bg-muted"
            >
              <img src={url} alt={`Photo ${i + 1}`} className="h-32 w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1.5 top-1.5 rounded-full bg-background/90 p-1 text-destructive shadow"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <ContinueButton onClick={onContinue} disabled={photos.length === 0} />
        <button
          type="button"
          onClick={onSkip}
          className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Skip — I don't have a photo right now
        </button>
      </div>
    </StepCard>
  );
}

// ─── Account step ─────────────────────────────────────────────────────────────
function AccountStep(props: {
  tab: "signin" | "register";
  onTabChange: (t: "signin" | "register") => void;
  signInEmail: string;
  signInPassword: string;
  signInError: string | null;
  signInLoading: boolean;
  onSignInEmailChange: (v: string) => void;
  onSignInPasswordChange: (v: string) => void;
  onSignIn: () => void;
  regName: string;
  regEmail: string;
  regPhone: string;
  regDob: string;
  regSex: "male" | "female" | "other" | "";
  regPassword: string;
  regErrors: Record<string, string>;
  regLoading: boolean;
  onRegNameChange: (v: string) => void;
  onRegEmailChange: (v: string) => void;
  onRegPhoneChange: (v: string) => void;
  onRegDobChange: (v: string) => void;
  onRegSexChange: (v: "male" | "female" | "other") => void;
  onRegPasswordChange: (v: string) => void;
  onRegister: () => void;
}) {
  return (
    <StepCard
      title="Your account"
      subtitle="Almost there. Create a free account or sign in to track your consultation."
    >
      <div className="mb-5 flex gap-2 rounded-full border border-border bg-muted p-1">
        {(
          [
            ["register", "Create account"],
            ["signin", "Sign in"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => props.onTabChange(tab)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              props.tab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {props.tab === "signin" ? (
        <div className="flex flex-col gap-4">
          <TextField
            label="Email"
            type="email"
            value={props.signInEmail}
            onChange={props.onSignInEmailChange}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            type="text"
            value={props.signInPassword}
            onChange={props.onSignInPasswordChange}
            autoComplete="current-password"
            placeholder="••••••••"
          />
          {props.signInError && (
            <p className="text-xs text-destructive">{props.signInError}</p>
          )}
          <ContinueButton
            onClick={props.onSignIn}
            loading={props.signInLoading}
            label="Sign in"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <TextField
            label="Full legal name"
            value={props.regName}
            onChange={props.onRegNameChange}
            error={props.regErrors.name}
            autoComplete="name"
          />
          <TextField
            label="Email"
            type="email"
            value={props.regEmail}
            onChange={props.onRegEmailChange}
            error={props.regErrors.email}
            autoComplete="email"
          />
          <TextField
            label="Mobile phone (optional)"
            type="tel"
            value={props.regPhone}
            onChange={props.onRegPhoneChange}
            autoComplete="tel"
          />
          <DateField
            label="Date of birth"
            value={props.regDob}
            onChange={props.onRegDobChange}
            error={props.regErrors.dob}
            max={new Date().toISOString().slice(0, 10)}
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Sex (for clinical safety)</p>
            <div className="flex flex-col gap-2">
              <RadioRow
                selected={props.regSex === "male"}
                onSelect={() => props.onRegSexChange("male")}
                title="Male"
              />
              <RadioRow
                selected={props.regSex === "female"}
                onSelect={() => props.onRegSexChange("female")}
                title="Female"
              />
              <RadioRow
                selected={props.regSex === "other"}
                onSelect={() => props.onRegSexChange("other")}
                title="I'd prefer to discuss with the pharmacist"
                subtitle="A pharmacist will reach out before prescribing."
                tone="warning"
              />
            </div>
            {props.regErrors.sex && (
              <p className="text-xs text-destructive">{props.regErrors.sex}</p>
            )}
          </div>
          <TextField
            label="Choose a password"
            type="text"
            value={props.regPassword}
            onChange={props.onRegPasswordChange}
            error={props.regErrors.password}
            hint="At least 8 characters"
            autoComplete="new-password"
          />
          <ContinueButton
            onClick={props.onRegister}
            loading={props.regLoading}
            label="Create account"
          />
        </div>
      )}
    </StepCard>
  );
}

// ─── GP step ──────────────────────────────────────────────────────────────────
function GpStep({
  share,
  practice,
  address,
  patientSex,
  showSexPicker,
  onShareChange,
  onPracticeChange,
  onAddressChange,
  onSexChange,
  onNext,
}: {
  share: "" | "yes" | "no" | "no_gp";
  practice: string;
  address: string;
  patientSex: "male" | "female" | "other" | "";
  showSexPicker: boolean;
  onShareChange: (v: "yes" | "no" | "no_gp") => void;
  onPracticeChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onSexChange: (v: "male" | "female" | "other") => void;
  onNext: () => void;
}) {
  const canContinue =
    !!share && (!showSexPicker || patientSex === "male" || patientSex === "female" || patientSex === "other");

  return (
    <div className="flex flex-col gap-5">
      {showSexPicker && (
        <StepCard
          title="One more thing"
          subtitle="Your sex helps the pharmacist prescribe safely."
        >
          <div className="flex flex-col gap-2">
            <RadioRow
              selected={patientSex === "male"}
              onSelect={() => onSexChange("male")}
              title="Male"
            />
            <RadioRow
              selected={patientSex === "female"}
              onSelect={() => onSexChange("female")}
              title="Female"
            />
            <RadioRow
              selected={patientSex === "other"}
              onSelect={() => onSexChange("other")}
              title="I'd prefer to discuss with the pharmacist"
              tone="warning"
            />
          </div>
        </StepCard>
      )}

      <StepCard
        title="Share with your GP?"
        subtitle="We can send a record of any prescription to your GP. This is optional."
      >
        <div className="flex flex-col gap-2">
          <RadioRow
            selected={share === "yes"}
            onSelect={() => onShareChange("yes")}
            title="Yes, please share with my GP"
            tone="success"
          />
          <RadioRow
            selected={share === "no"}
            onSelect={() => onShareChange("no")}
            title="No, don't share"
          />
          <RadioRow
            selected={share === "no_gp"}
            onSelect={() => onShareChange("no_gp")}
            title="I don't have a GP"
          />
        </div>

        {share === "yes" && (
          <div className="mt-5 flex flex-col gap-3">
            <TextField
              label="GP practice name"
              value={practice}
              onChange={onPracticeChange}
              placeholder="e.g. Riverside Medical Centre"
            />
            <TextField
              label="Practice address"
              value={address}
              onChange={onAddressChange}
              placeholder="Street, town, postcode"
            />
          </div>
        )}
      </StepCard>

      <ContinueButton onClick={onNext} disabled={!canContinue} />
    </div>
  );
}

// ─── Review step ──────────────────────────────────────────────────────────────
function ReviewStep({
  conditionName,
  age,
  questions,
  answers,
  softFlags,
  submitting,
  onSubmit,
}: {
  conditionName: string;
  age: number;
  questions: ClinicalQuestion[];
  answers: ClinicalAnswers;
  softFlags: string[];
  submitting: boolean;
  onSubmit: () => void;
}) {
  const summarised = questions
    .filter((q) => {
      const v = answers[q.id];
      return !(v === undefined || v === "" || (Array.isArray(v) && v.length === 0));
    })
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-5">
      <StepCard
        title="Review your consultation"
        subtitle="Please check everything looks right before submitting."
      >
        <dl className="divide-y divide-border text-sm">
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Condition</dt>
            <dd className="text-right font-medium text-foreground">{conditionName}</dd>
          </div>
          {age > 0 && (
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Age</dt>
              <dd className="text-right font-medium text-foreground">{age}</dd>
            </div>
          )}
          {summarised.map((q) => (
            <div key={q.id} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="flex-1 text-muted-foreground">{q.text}</dt>
              <dd className="max-w-[55%] text-right font-medium text-foreground">
                {answerLabel(q, answers[q.id])}
              </dd>
            </div>
          ))}
        </dl>
      </StepCard>

      {softFlags.length > 0 && (
        <EligibilityNotice
          title="Pharmacist will review your answers"
          message={`You flagged ${softFlags.length} item${
            softFlags.length === 1 ? "" : "s"
          } that need a pharmacist's eye. We'll route this to a clinician — there's nothing extra you need to do.`}
          pharmacistTel={PHARMACIST_TEL}
          onContinueWithReview={() => {
            /* no-op; pharmacist review is implicit */
          }}
          onChangeAnswer={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
      )}

      <ContinueButton
        onClick={onSubmit}
        loading={submitting}
        label="Submit consultation"
      />
    </div>
  );
}

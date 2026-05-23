import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Eye,
  ClipboardCheck,
  MessageSquare,
  FileText,
  Clock,
  Users,
  TrendingUp,
  StickyNote,
  Activity as ActivityIcon,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Phone,
  Plus,
  Bookmark,
  Pin,
  Flag as FlagIcon,
  Mail,
  AlertTriangle,
  Send,
  XCircle,
} from "lucide-react";
import {
  useGetConsultation,
  useReviewConsultation,
  type Consultation,
  type ConsultationReviewInputAction,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TabId =
  | "clinical"
  | "consultation"
  | "documents"
  | "history"
  | "counselling"
  | "monitoring"
  | "notes"
  | "activity";

const TABS: { id: TabId; label: string; icon: typeof ClipboardCheck; badge?: string }[] = [
  { id: "clinical", label: "Clinical Review", icon: ClipboardCheck },
  { id: "consultation", label: "Consultation", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "history", label: "Order History", icon: Clock },
  { id: "counselling", label: "Patient Counselling", icon: Users },
  { id: "monitoring", label: "Monitoring", icon: TrendingUp },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "activity", label: "Activity", icon: ActivityIcon, badge: "11" },
];

const VERIFIABLE_TABS = [
  "clinical",
  "consultation",
  "documents",
  "history",
  "counselling",
  "monitoring",
] as const satisfies readonly TabId[];

type VerifiableTabId = (typeof VERIFIABLE_TABS)[number];

type VerificationRecord = {
  verifiedBy: string;
  verifiedAt: string;
};

type VerificationState = Partial<Record<VerifiableTabId, VerificationRecord>>;

const CURRENT_PHARMACIST_NAME = "Mostafa Damghani";

const CHECKLIST_ITEMS: { id: VerifiableTabId; label: string }[] = [
  { id: "clinical", label: "Clinical Review" },
  { id: "consultation", label: "Consultation" },
  { id: "documents", label: "Documents" },
  { id: "history", label: "Order History" },
  { id: "counselling", label: "Patient Counselling" },
  { id: "monitoring", label: "Monitoring" },
];

function orderRefFromId(id: string): string {
  return "#" + id.replace(/-/g, "").toUpperCase().slice(-5);
}

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function isVerifiableTabId(value: TabId): value is VerifiableTabId {
  return VERIFIABLE_TABS.includes(value as VerifiableTabId);
}

function tabFromLocation(location: string): TabId | null {
  const [, search = ""] = location.split("?");
  const tab = new URLSearchParams(search).get("tab");
  return isTabId(tab) ? tab : null;
}

function verificationStorageKey(orderId: string): string {
  return `pharmacare:rx-review-verifications:${orderId}`;
}

function readVerificationState(orderId: string): VerificationState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(verificationStorageKey(orderId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as VerificationState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeVerificationState(orderId: string, state: VerificationState) {
  if (typeof window === "undefined") return;
  try {
    if (Object.keys(state).length === 0) {
      window.localStorage.removeItem(verificationStorageKey(orderId));
      return;
    }
    window.localStorage.setItem(verificationStorageKey(orderId), JSON.stringify(state));
  } catch {
    /* localStorage unavailable */
  }
}

function useOrderVerifications(orderId: string) {
  const [state, setState] = useState<VerificationState>(() =>
    readVerificationState(orderId),
  );

  useEffect(() => {
    writeVerificationState(orderId, state);
  }, [orderId, state]);

  const markDone = (section: VerifiableTabId) => {
    setState((current) => ({
      ...current,
      [section]: {
        verifiedBy: CURRENT_PHARMACIST_NAME,
        verifiedAt: new Date().toISOString(),
      },
    }));
  };

  const undo = (section: VerifiableTabId) => {
    setState((current) => {
      const next = { ...current };
      delete next[section];
      return next;
    });
  };

  return { markDone, state, undo };
}

function formatVerifiedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `at ${time} on ${date}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusPill(status: Consultation["status"]): {
  label: string;
  cls: string;
  dotCls: string;
} {
  switch (status) {
    case "pending":
      return {
        label: "Awaiting Review",
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        dotCls: "bg-amber-500",
      };
    case "more_info_needed":
      return {
        label: "More info needed",
        cls: "bg-amber-50 text-amber-800 border-amber-200",
        dotCls: "bg-amber-500",
      };
    case "approved":
      return {
        label: "Approved",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotCls: "bg-emerald-500",
      };
    case "rejected":
      return {
        label: "Rejected",
        cls: "bg-rose-50 text-rose-700 border-rose-200",
        dotCls: "bg-rose-500",
      };
    case "referred":
      return {
        label: "Referred",
        cls: "bg-sky-50 text-sky-700 border-sky-200",
        dotCls: "bg-sky-500",
      };
    case "red_flag":
      return {
        label: "Red flag",
        cls: "bg-rose-50 text-rose-700 border-rose-200",
        dotCls: "bg-rose-500",
      };
    case "patient_responded":
      return {
        label: "Patient responded",
        cls: "bg-violet-50 text-violet-700 border-violet-200",
        dotCls: "bg-violet-500",
      };
    default:
      return {
        label: "Re-Review",
        cls: "bg-rose-50 text-rose-700 border-rose-200",
        dotCls: "bg-rose-500",
      };
  }
}

export function OrderDetail({ id }: { id: string }) {
  const { data: c, isLoading } = useGetConsultation(id);
  const [location, navigate] = useLocation();
  const [tab, setTab] = useState<TabId>(() => tabFromLocation(location) ?? "clinical");
  const {
    markDone: markSectionDone,
    state: verifications,
    undo: undoSectionDone,
  } = useOrderVerifications(id);

  useEffect(() => {
    const nextTab = tabFromLocation(location);
    if (nextTab && nextTab !== tab) {
      setTab(nextTab);
    }
  }, [location, tab]);

  const handleTabChange = (next: TabId) => {
    setTab(next);
    const [path, search = ""] = location.split("?");
    const params = new URLSearchParams(search);
    params.set("tab", next);
    navigate(`${path}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 py-8 w-full max-w-[118rem] mx-auto overflow-x-hidden">
        <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(320px,360px)] gap-4">
          <div className="h-64 bg-stone-100 rounded-xl animate-pulse" />
          <div className="h-96 bg-stone-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-stone-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }
  if (!c) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-stone-500 mb-3">Consultation not found.</p>
        <Link href="/queue">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rx-safe-text w-full max-w-[118rem] mx-auto px-4 sm:px-6 py-5 overflow-x-hidden">
      {/* Top strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5 text-sm">
          <Link
            href="/queue"
            className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium"
          >
            <ChevronLeft className="h-4 w-4" /> Back to queue
          </Link>
          <span className="text-stone-300">·</span>
          <span className="font-semibold text-stone-800 text-base">
            Order {orderRefFromId(c.id)}
          </span>
          {(() => {
            const sp = statusPill(c.status);
            return (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  sp.cls,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", sp.dotCls)} />
                {sp.label}
              </span>
            );
          })()}
        </div>
        <div className="text-sm text-stone-500">{formatDateTime(c.createdAt)}</div>
      </div>

      <div className="grid grid-cols-1 items-start lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(320px,360px)] gap-6 xl:gap-7">
        {/* LEFT */}
        <div className="space-y-4 min-w-0 w-full">
          <PatientCardPro c={c} />
          <StatsGrid c={c} />
          <AutoFlags c={c} />
        </div>

        {/* CENTER */}
        <div className="min-w-0 w-full">
          <TabsBar current={tab} onChange={handleTabChange} verifications={verifications} />
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 mt-4 shadow-sm min-w-0 overflow-hidden">
            {tab === "clinical" && (
              <ClinicalReviewTab
                c={c}
                onUndo={() => undoSectionDone("clinical")}
                onVerify={() => markSectionDone("clinical")}
                verification={verifications.clinical}
              />
            )}
            {tab === "consultation" && (
              <ConsultationTab
                c={c}
                onUndo={() => undoSectionDone("consultation")}
                onVerify={() => markSectionDone("consultation")}
                verification={verifications.consultation}
              />
            )}
            {tab === "documents" && (
              <DocumentsTabPro
                onUndo={() => undoSectionDone("documents")}
                onVerify={() => markSectionDone("documents")}
                verification={verifications.documents}
              />
            )}
            {tab === "history" && (
              <OrderHistoryTab
                onUndo={() => undoSectionDone("history")}
                onVerify={() => markSectionDone("history")}
                verification={verifications.history}
              />
            )}
            {tab === "counselling" && (
              <CounsellingTab
                onUndo={() => undoSectionDone("counselling")}
                onVerify={() => markSectionDone("counselling")}
                verification={verifications.counselling}
              />
            )}
            {tab === "monitoring" && (
              <MonitoringTab
                onUndo={() => undoSectionDone("monitoring")}
                onVerify={() => markSectionDone("monitoring")}
                verification={verifications.monitoring}
              />
            )}
            {tab === "notes" && <NotesTab />}
            {tab === "activity" && <ActivityTab />}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4 min-w-0 w-full lg:col-span-2 xl:col-span-1 xl:col-start-3">
          <DecisionPanel
            consultationId={c.id}
            onSelectTab={handleTabChange}
            verifications={verifications}
          />
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;

// ─── LEFT RAIL ─────────────────────────────────────────────────────────────
type PatientProfileState = {
  name: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
};

function PatientCardPro({ c }: { c: Consultation }) {
  const { toast } = useToast();
  const initialProfile = useMemo<PatientProfileState>(() => {
    const dobYear = c.patientAge ? new Date().getFullYear() - c.patientAge : null;
    const addressParts = [
      c.deliveryAddressLine1,
      c.deliveryAddressLine2,
      c.deliveryCity,
      c.deliveryPostcode,
    ].filter(Boolean);
    const address =
      c.deliveryAddress || (addressParts.length > 0 ? addressParts.join(", ") : "-");

    return {
      name: c.patientName || "-",
      dob: dobYear != null ? `~${dobYear} (Age ${c.patientAge})` : "-",
      phone: "-",
      email: c.patientEmail || "-",
      address,
    };
  }, [c]);

  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
    setDraft(initialProfile);
  }, [initialProfile]);

  const openEditor = () => {
    setDraft(profile);
    setEditing(true);
  };

  const saveProfile = () => {
    setProfile(draft);
    setEditing(false);
    toast({ title: "Patient details updated for this review" });
  };

  const rows: { key: keyof PatientProfileState | "order"; label: string; value: string }[] = [
    { key: "order", label: "ORDER NO", value: orderRefFromId(c.id) },
    { key: "dob", label: "DOB", value: profile.dob },
    { key: "phone", label: "PHONE", value: profile.phone },
    { key: "email", label: "EMAIL", value: profile.email },
    { key: "address", label: "ADDRESS", value: profile.address },
  ];
  const isRepeat = Boolean(c.previousConsultationId);

  return (
    <>
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3 gap-3">
          <h3 className="font-serif font-bold text-xl leading-tight tracking-tight break-words [overflow-wrap:anywhere]">
            {profile.name}
          </h3>
          <button
            type="button"
            onClick={openEditor}
            className="rounded-full p-1 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
            aria-label="Edit patient details"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {isRepeat ? (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Transferring
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-lime-50 text-lime-800 border border-lime-100">
              1st Dose
            </span>
          )}
        </div>
        <dl className="space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[64px_1fr_18px] gap-3 items-start text-sm">
              <dt className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold pt-0.5">
                {r.label}
              </dt>
              <dd className="min-w-0 break-words text-stone-800 leading-relaxed [overflow-wrap:anywhere]">
                {r.value}
              </dd>
              <button
                type="button"
                onClick={openEditor}
                className="rounded-full p-0.5 text-stone-300 hover:bg-stone-50 hover:text-stone-500"
                aria-label={`Edit ${r.label.toLowerCase()}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          ))}
        </dl>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit patient details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["name", "Name"],
              ["dob", "DOB"],
              ["phone", "Phone"],
              ["email", "Email"],
            ] as const).map(([key, label]) => (
              <label key={key} className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                {label}
                <input
                  value={draft[key]}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [key]: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            ))}
            <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:col-span-2">
              Address
              <Textarea
                value={draft.address}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, address: event.target.value }))
                }
                className="mt-1 min-h-20 rounded-xl border-stone-200 text-sm normal-case tracking-normal"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Save details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PatientCard({ c }: { c: Consultation }) {
  const dobYear = useMemo(() => {
    if (!c.patientAge) return null;
    return new Date().getFullYear() - c.patientAge;
  }, [c.patientAge]);

  const addressParts = [
    c.deliveryAddressLine1,
    c.deliveryAddressLine2,
    c.deliveryCity,
    c.deliveryPostcode,
  ].filter(Boolean);
  const address =
    c.deliveryAddress ||
    (addressParts.length > 0 ? addressParts.join(", ") : "—");

  const rows: { label: string; value: string }[] = [
    { label: "ORDER NO", value: orderRefFromId(c.id) },
    {
      label: "DOB",
      value: dobYear != null ? `≈ ${dobYear} (Age ${c.patientAge})` : "—",
    },
    { label: "PHONE", value: "—" },
    { label: "EMAIL", value: c.patientEmail || "—" },
    { label: "ADDRESS", value: address },
  ];

  const isRepeat = Boolean(c.previousConsultationId);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-serif font-bold text-xl leading-tight tracking-tight">
          {c.patientName || "—"}
        </h3>
        <button className="text-stone-400 hover:text-stone-600" aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {isRepeat && (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Transferring
          </span>
        )}
        {!isRepeat && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-lime-50 text-lime-800 border border-lime-100">
            1st Dose
          </span>
        )}
      </div>
      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[64px_1fr_16px] gap-3 items-start text-sm">
            <dt className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold pt-0.5">
              {r.label}
            </dt>
            <dd className="min-w-0 break-words text-stone-800 leading-relaxed [overflow-wrap:anywhere]">
              {r.value}
            </dd>
            <button className="text-stone-300 hover:text-stone-500" aria-label="Edit">
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}

function StatsGrid({ c }: { c: Consultation }) {
  const answerBmi = (c.answers as Record<string, unknown>)?.bmi;
  const bmiValue =
    typeof answerBmi === "number"
      ? answerBmi.toFixed(2)
      : c.bmi != null
        ? Number(c.bmi).toFixed(2)
        : "—";

  const ethnicityRaw = (c.answers as Record<string, unknown>)?.ethnicity;
  const ethnicityLabel =
    typeof ethnicityRaw === "string" && ethnicityRaw.length > 0
      ? ethnicityRaw
          .replace(/_/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : "—";

  const cells = [
    { value: bmiValue, label: "BMI" },
    { value: c.patientAge ? `${c.patientAge}` : "—", suffix: "yrs", label: "AGE" },
    {
      value: c.patientSex
        ? c.patientSex.charAt(0).toUpperCase() + c.patientSex.slice(1)
        : "—",
      label: "SEX",
    },
    { value: ethnicityLabel, label: "ETHNICITY" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="bg-linear-to-br from-white to-emerald-50/40 border border-emerald-100 rounded-2xl p-4 shadow-sm"
        >
          <div className="font-semibold text-stone-900 text-lg tracking-tight break-words [overflow-wrap:anywhere]">
            {cell.value}
            {cell.suffix && (
              <span className="text-xs text-stone-500 ml-1">{cell.suffix}</span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 mt-1.5">
            {cell.label}
          </div>
        </div>
      ))}
    </div>
  );
}

type FlagTone = "red" | "green" | "amber" | "stone";

function AutoFlags({ c }: { c: Consultation }) {
  const flags: { tone: FlagTone; label: string }[] = [];

  if (c.currentMedications && c.currentMedications !== "None") {
    flags.push({ tone: "red", label: "Currently on other medications" });
  }
  if (c.allergies && c.allergies !== "None") {
    flags.push({ tone: "red", label: "Has allergies" });
  }
  if (c.patientAge != null && (c.patientAge < 18 || c.patientAge > 75)) {
    flags.push({
      tone: "red",
      label: `Outside 18-75 (age: ${c.patientAge})`,
    });
  }
  flags.push(
    c.hasRedFlag
      ? { tone: "red", label: "Red flag raised" }
      : { tone: "green", label: "No red flags" },
  );
  flags.push(
    c.hasPhoto
      ? { tone: "green", label: "Photo uploaded" }
      : { tone: "amber", label: "No photo provided" },
  );
  flags.push(
    c.previousConsultationId
      ? { tone: "green", label: "Repeat from prior consult" }
      : { tone: "stone", label: "First-time consult" },
  );

  const toneCls: Record<FlagTone, { bg: string; dot: string }> = {
    red: { bg: "bg-rose-50 text-rose-900", dot: "bg-rose-500" },
    green: { bg: "bg-emerald-50 text-emerald-900", dot: "bg-emerald-500" },
    amber: { bg: "bg-amber-50 text-amber-900", dot: "bg-amber-500" },
    stone: { bg: "bg-stone-50 text-stone-700", dot: "bg-stone-400" },
  };

  return (
    <div className="bg-linear-to-br from-white to-slate-50 border border-stone-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-stone-400 font-semibold mb-3.5">
        <FlagIcon className="h-3 w-3" /> Auto-Flags
      </div>
      <ul className="space-y-2">
        {flags.map((f, i) => (
          <li
            key={i}
            className={cn(
              "rounded-xl px-3 py-2 text-sm flex items-center gap-2.5",
              toneCls[f.tone].bg,
            )}
          >
            <span
              className={cn("h-2 w-2 rounded-full shrink-0", toneCls[f.tone].dot)}
            />
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── CENTER: TABS BAR ──────────────────────────────────────────────────────
function TabsBar({
  current,
  onChange,
  verifications,
}: {
  current: TabId;
  onChange: (t: TabId) => void;
  verifications: VerificationState;
}) {
  return (
    <div className="bg-white/95 border border-emerald-100 rounded-3xl p-2 shadow-sm min-w-0 overflow-hidden">
      <div
        className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = current === t.id;
          const verified = isVerifiableTabId(t.id) && Boolean(verifications[t.id]);
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              data-testid={`tab-${t.id}`}
              role="tab"
              aria-selected={active}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-[13px] sm:text-sm rounded-full border transition-colors whitespace-nowrap",
                active && "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm",
                !active && verified && "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
                !active && !verified && "text-stone-600 border-transparent hover:bg-emerald-50 hover:text-stone-900",
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{t.label}</span>
              {verified && (
                <span
                  className={cn(
                    "inline-flex h-4.5 w-4.5 items-center justify-center rounded-full",
                    active ? "bg-white/20 text-white" : "bg-emerald-600 text-white",
                  )}
                  title={`Verified by ${verifications[t.id as VerifiableTabId]?.verifiedBy}`}
                >
                  <CheckCircle2 className="h-3 w-3" />
                </span>
              )}
              {t.badge && (
                <span
                  className={cn(
                    "ml-0.5 inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 text-[10px] font-semibold rounded-full",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-600",
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CLINICAL REVIEW TAB ───────────────────────────────────────────────────
function ClinicalReviewTab({
  c,
  onUndo,
  onVerify,
  verification,
}: {
  c: Consultation;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const selectedPlan = (answers.selected_plan ?? null) as
    | { medicine?: string; penIds?: string[] }
    | null;
  const medicineName =
    (selectedPlan && typeof selectedPlan.medicine === "string"
      ? selectedPlan.medicine
      : null) || c.conditionName;
  const penIds =
    selectedPlan && Array.isArray(selectedPlan.penIds) ? selectedPlan.penIds : [];
  const subtitle = penIds.length > 0 ? penIds.join(", ") : c.conditionName;
  const qty = penIds.length > 0 ? penIds.length : 1;
  const initial = (medicineName || "?").charAt(0).toUpperCase();
  const [scrOpen, setScrOpen] = useState(false);

  const answerBmi = answers.bmi;
  const bmiText =
    typeof answerBmi === "number"
      ? answerBmi.toFixed(2)
      : c.bmi != null
        ? Number(c.bmi).toFixed(2)
        : "—";
  const heightCm =
    typeof answers.heightCm === "number"
      ? (answers.heightCm as number)
      : c.verifiedHeightCm ?? c.heightCm ?? null;
  const weightKg =
    typeof answers.weightKg === "number"
      ? (answers.weightKg as number)
      : c.verifiedWeightKg ?? c.weightKg ?? null;
  const bmiNumber = Number.parseFloat(bmiText);
  const bmiBand =
    Number.isFinite(bmiNumber) && bmiNumber >= 30
      ? "Clinical attention"
      : Number.isFinite(bmiNumber) && bmiNumber >= 25
        ? "Review range"
        : "Recorded";
  const bmiEntries = [
    {
      id: "current",
      date: new Date(c.createdAt).toLocaleDateString("en-GB"),
      status: "Current",
      bmi: bmiText,
      height: heightCm != null ? `${Number(heightCm).toFixed(1)} cm` : "-",
      weight: weightKg != null ? `${Number(weightKg).toFixed(1)} kg` : "-",
      change: "No previous dose",
      band: bmiBand,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-2">
          Order Summary
        </div>
        <div className="bg-linear-to-br from-amber-50 to-white border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-stone-900">{medicineName}</div>
            <div className="text-sm text-stone-600 mt-0.5">{subtitle}</div>
            <div className="text-xs text-stone-500 mt-1">
              {c.conditionName} · Qty: {qty}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
              Received
            </div>
            <div className="text-xs text-stone-700 mt-0.5">
              {formatDateTime(c.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-2">
          BMI History
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-emerald-50/30 to-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Measurement history
              </div>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                Recorded measurements from the patient questionnaire and verified values.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
              {bmiEntries.length} entry
            </span>
          </div>

          <div className="grid gap-3">
            {bmiEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm ring-1 ring-rose-50 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold tracking-tight text-stone-950">
                        {entry.date}
                      </span>
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700">
                        {entry.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-stone-500">{entry.band}</div>
                  </div>
                  <div className="rounded-2xl bg-rose-50 px-4 py-2 text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-500">
                      BMI
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-stone-950">
                      {entry.bmi}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Height", value: entry.height },
                    { label: "Weight", value: entry.weight },
                    { label: "Change since last dose", value: entry.change },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        {metric.label}
                      </div>
                      <div className="mt-1 text-base font-semibold text-stone-900 [overflow-wrap:anywhere]">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden border border-emerald-100 rounded-2xl overflow-x-auto shadow-sm">
          <table className="min-w-[620px] w-full text-sm">
            <thead className="bg-linear-to-r from-emerald-50 to-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-left px-3 py-2 font-semibold"></th>
                <th className="text-left px-3 py-2 font-semibold">BMI</th>
                <th className="text-left px-3 py-2 font-semibold">Height</th>
                <th className="text-left px-3 py-2 font-semibold">Weight</th>
                <th className="text-left px-3 py-2 font-semibold">
                  Change Since Last Dose
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-rose-50 border-l-4 border-rose-300">
                <td className="px-3 py-2 text-stone-700">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <span className="text-[10px] uppercase tracking-wide bg-rose-200/60 text-rose-800 px-1.5 py-0.5 rounded">
                    Current
                  </span>
                </td>
                <td className="px-3 py-2 font-semibold">{bmiText}</td>
                <td className="px-3 py-2">
                  {heightCm != null ? `${Number(heightCm).toFixed(1)} cm` : "—"}
                </td>
                <td className="px-3 py-2">
                  {weightKg != null ? `${Number(weightKg).toFixed(1)} kg` : "—"}
                </td>
                <td className="px-3 py-2 text-stone-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="border border-emerald-100 rounded-2xl p-3 flex items-center gap-3 bg-emerald-50/50 shadow-sm">
        <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
        <div className="flex-1 text-sm">
          <div className="font-semibold text-stone-900">NHS Summary Care Record</div>
          <div className="text-xs text-stone-500">
            View prescribed medications, allergies and clinical info from NHS.
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setScrOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
        >
          Go to NHS SCR <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <VerificationAction
        actionLabel="Mark Clinical Review as done"
        label="Clinical Review"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />

      <Dialog open={scrOpen} onOpenChange={setScrOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>NHS Summary Care Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Current medicines
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                {c.currentMedications || "No current medicines recorded."}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                Allergies
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                {c.allergies || "No allergies recorded."}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                Clinical summary
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">
                SCR lookup opened for this review. Confirm prescribed medicines,
                allergies, and relevant contraindications before marking the clinical
                review complete.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setScrOpen(false)} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── CONSULTATION TAB ──────────────────────────────────────────────────────
function VerificationAction({
  actionLabel,
  label,
  onUndo,
  onVerify,
  verification,
}: {
  actionLabel: string;
  label: string;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  if (verification) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-emerald-950">
                {label} verified
              </div>
              <div className="mt-1 text-sm leading-relaxed text-emerald-800">
                Verified by {verification.verifiedBy} {formatVerifiedAt(verification.verifiedAt)}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onUndo}
            className="h-9 shrink-0 rounded-full border-emerald-200 bg-white px-4 text-emerald-800 hover:bg-emerald-100"
          >
            Undo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={onVerify}
      className="w-full min-h-12 whitespace-normal break-words bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700 rounded-2xl shadow-sm text-base"
    >
      <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" /> {actionLabel}
    </Button>
  );
}

function ConsultationTab({
  c,
  onUndo,
  onVerify,
  verification,
}: {
  c: Consultation;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const entries = Object.entries(c.answers ?? {});
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-1">Consultation answers</h3>
      <p className="text-xs text-stone-500 mb-4">
        {entries.length} question{entries.length === 1 ? "" : "s"} answered at submission.
      </p>
      {entries.length === 0 ? (
        <div className="text-sm text-stone-500 italic">
          No structured answers recorded.
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {entries.map(([k, v]) => (
            <div key={k} className="py-3 grid sm:grid-cols-[1fr_2fr] gap-2">
              <div className="text-xs uppercase tracking-wide text-stone-400 font-semibold">
                {k.replace(/_/g, " ")}
              </div>
              <div className="text-sm text-stone-800">
                {Array.isArray(v) ? v.join(", ") : String(v ?? "—")}
              </div>
            </div>
          ))}
        </div>
      )}
      <VerificationAction
        actionLabel="Mark Consultation as done"
        label="Consultation"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
    </div>
  );
}

// ─── DOCUMENTS TAB ─────────────────────────────────────────────────────────
type ReviewDocument = {
  title: string;
  sub: string;
  uploaded: string;
  status: "verified" | "pending" | "rejected";
  reviewedBy?: string;
};

const INITIAL_REVIEW_DOCUMENTS: ReviewDocument[] = [
  {
    title: "Government-issued ID",
    sub: "Verified at upload time",
    uploaded: "Uploaded 18 May 2026, 16:26",
    status: "verified",
    reviewedBy: "Yoti",
  },
  {
    title: "Full Body Video",
    sub: "Self-recorded patient verification",
    uploaded: "Uploaded 21 May 2026, 14:10",
    status: "pending",
  },
  {
    title: "Weight Scale Video",
    sub: "Scale reading verification",
    uploaded: "Uploaded 21 May 2026, 14:10",
    status: "pending",
  },
  {
    title: "Previous Prescription",
    sub: "Patient-uploaded copy",
    uploaded: "Uploaded 18 May 2026, 16:13",
    status: "pending",
  },
];

function DocumentsTabPro({
  onUndo,
  onVerify,
  verification,
}: {
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<ReviewDocument[]>(INITIAL_REVIEW_DOCUMENTS);
  const [viewing, setViewing] = useState<ReviewDocument | null>(null);

  const counts = docs.reduce(
    (acc, doc) => {
      acc[doc.status] += 1;
      return acc;
    },
    { pending: 0, rejected: 0, verified: 0 },
  );
  const outstanding = docs.filter((doc) => doc.status !== "verified");

  const updateDoc = (title: string, status: ReviewDocument["status"]) => {
    setDocs((current) =>
      current.map((doc) =>
        doc.title === title
          ? {
              ...doc,
              status,
              reviewedBy: status === "pending" ? undefined : CURRENT_PHARMACIST_NAME,
            }
          : doc,
      ),
    );
    toast({
      title:
        status === "verified"
          ? `${title} verified`
          : `${title} rejected for follow-up`,
    });
  };

  const markDocumentsDone = () => {
    if (outstanding.length > 0) {
      toast({
        title: "Finish document review first",
        description: `${outstanding.length} document${outstanding.length === 1 ? "" : "s"} still need review.`,
        variant: "destructive",
      });
      return;
    }
    onVerify();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Prescription evidence
            </div>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">
              Documents
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
            Review uploaded identity and clinical documents before approving the order.
          </p>
        </div>
          <div className="min-w-32 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-emerald-900 shadow-sm">
            <div className="text-2xl font-bold tracking-tight">{counts.verified}/{docs.length}</div>
            <div className="text-xs text-emerald-700">verified</div>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(counts.verified / docs.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterPill color="emerald">{counts.verified} verified</FilterPill>
          <FilterPill color="amber">{counts.pending} pending</FilterPill>
          <FilterPill color="rose">{counts.rejected} rejected</FilterPill>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {docs.map((d) => {
          const verified = d.status === "verified";
          const rejected = d.status === "rejected";
          return (
            <div
              key={d.title}
              className={cn(
                "flex min-h-[31rem] overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                verified && "border-emerald-200 ring-1 ring-emerald-100",
                rejected && "border-rose-200 ring-1 ring-rose-100",
                !verified && !rejected && "border-stone-200 ring-1 ring-stone-100",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col">
              <div
                className={cn(
                    "relative flex h-36 items-center justify-center border-b",
                    verified && "border-emerald-100 bg-linear-to-br from-emerald-50 to-white",
                    rejected && "border-rose-100 bg-linear-to-br from-rose-50 to-white",
                    !verified && !rejected && "border-amber-100 bg-linear-to-br from-amber-50 to-white",
                )}
              >
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl border bg-white shadow-sm",
                      verified && "border-emerald-100 text-emerald-500",
                      rejected && "border-rose-100 text-rose-500",
                      !verified && !rejected && "border-amber-100 text-amber-500",
                    )}
                  >
                    <FileText className="h-8 w-8" />
                  </div>
                <span
                  className={cn(
                      "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm",
                    verified && "bg-emerald-600 text-white",
                    rejected && "bg-rose-600 text-white",
                    !verified && !rejected && "bg-amber-500 text-white",
                  )}
                >
                  {verified ? <CheckCircle2 className="h-3 w-3" /> : rejected ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {verified ? "Verified" : rejected ? "Rejected" : "Pending"}
                </span>
              </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="min-h-[8.75rem]">
                    <div className="text-base font-semibold leading-tight text-stone-950 [overflow-wrap:anywhere]">
                      {d.title}
                    </div>
                    <div className="mt-2 text-sm leading-relaxed text-stone-500">
                      {d.sub}
                    </div>
                    <div className="mt-3 text-xs leading-relaxed text-stone-400">
                      {d.uploaded}
                    </div>
                    <div className="mt-3 min-h-9">
                      {d.reviewedBy ? (
                        <div
                          className={cn(
                            "inline-flex items-start gap-1.5 rounded-xl px-2.5 py-1.5 text-xs leading-relaxed",
                            verified && "bg-emerald-50 text-emerald-700",
                            rejected && "bg-rose-50 text-rose-700",
                          )}
                        >
                          {verified ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>
                            {verified ? "Verified" : "Rejected"} by {d.reviewedBy}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                          <Clock className="h-3.5 w-3.5" /> Awaiting review
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto grid gap-2 border-t border-stone-100 pt-4">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setViewing(d)}
                      className="h-10 rounded-2xl border border-stone-200 bg-stone-950 text-sm font-semibold text-white shadow-sm hover:bg-stone-800"
                  >
                      <Eye className="h-4 w-4 mr-2" /> View document
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => updateDoc(d.title, "verified")}
                        className="h-10 rounded-2xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      Verify
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => updateDoc(d.title, "rejected")}
                        className="h-10 rounded-2xl bg-rose-600 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "rounded-2xl border p-4 text-sm shadow-sm",
          outstanding.length === 0
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-900",
        )}
      >
        <div className="flex gap-2">
          {outstanding.length === 0 ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div>
            <div className="font-semibold">
              {outstanding.length === 0
                ? "All documents are verified."
                : "Complete all document checks before approving."}
            </div>
            {outstanding.length > 0 && (
              <div className="mt-1 text-xs leading-relaxed">
                Outstanding: {outstanding.map((doc) => `${doc.title} (${doc.status})`).join(", ")}
              </div>
            )}
          </div>
        </div>
      </div>

      <VerificationAction
        actionLabel="Mark Documents as done"
        label="Documents"
        onUndo={onUndo}
        onVerify={markDocumentsDone}
        verification={verification}
      />

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-stone-300" />
            <p className="mt-3 text-sm text-stone-600">
              Secure preview loaded for review. This demo keeps the document local to the
              session while preserving the same review workflow.
            </p>
            <p className="mt-2 text-xs text-stone-400">{viewing?.uploaded}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && (
              <Button
                onClick={() => {
                  updateDoc(viewing.title, "verified");
                  setViewing(null);
                }}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Verify document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentsTab({
  onUndo,
  onVerify,
  verification,
}: {
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const docs = [
    {
      title: "Government-issued ID",
      sub: "Verified at upload time",
      uploaded: "Uploaded 18 May 2026, 16:26",
      status: "verified" as const,
    },
    {
      title: "Full Body Video",
      sub: "Self-recorded patient verification",
      uploaded: "Uploaded 21 May 2026, 14:10",
      status: "pending" as const,
    },
    {
      title: "Weight Scale Video",
      sub: "Scale reading verification",
      uploaded: "Uploaded 21 May 2026, 14:10",
      status: "pending" as const,
    },
    {
      title: "Previous Prescription",
      sub: "Patient-uploaded copy",
      uploaded: "Uploaded 18 May 2026, 16:13",
      status: "pending" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Documents</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Patient-uploaded ID and clinical documents. Each is reviewed and verified by a
          prescriber.
        </p>
        <p className="italic text-xs text-stone-400 mt-1">
          Demo content — wire up to real records in a future task.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterPill color="emerald">1 verified</FilterPill>
        <FilterPill color="amber">3 Pending for review</FilterPill>
        <FilterPill color="rose">0 rejected</FilterPill>
        <FilterPill color="stone">0 not uploaded</FilterPill>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {docs.map((d) => (
          <div
            key={d.title}
            className="bg-white border border-stone-200 rounded-xl overflow-hidden"
          >
            <div className="relative bg-stone-100 h-32 flex items-center justify-center">
              <FileText className="h-8 w-8 text-stone-300" />
              <span
                className={cn(
                  "absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                  d.status === "verified"
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 text-white",
                )}
              >
                <CheckCircle2 className="h-3 w-3" />
                {d.status === "verified" ? "Verified" : "Pending for review"}
              </span>
            </div>
            <div className="p-3">
              <div className="font-semibold text-sm text-stone-900">{d.title}</div>
              <div className="text-xs text-stone-500 mt-0.5">{d.sub}</div>
              <div className="text-[11px] text-stone-400 mt-2">{d.uploaded}</div>
              <div className="mt-3 space-y-1.5">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                  View
                </Button>
                {d.status === "verified" ? (
                  <div className="text-[11px] text-emerald-700 inline-flex items-center gap-1 px-2 py-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified by Yoti
                  </div>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex gap-2">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Complete all document verification first.</div>
          <div>
            Outstanding: Full Body Video (pending review), Weight Scale Video (pending
            review), Previous Prescription (pending review)
          </div>
        </div>
      </div>

      <VerificationAction
        actionLabel="Mark Documents as done"
        label="Documents"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
    </div>
  );
}

function FilterPill({
  color,
  children,
}: {
  color: "emerald" | "amber" | "rose" | "stone";
  children: React.ReactNode;
}) {
  const cls: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    stone: "bg-stone-50 text-stone-600 border-stone-200",
  };
  return (
    <span className={cn("text-xs px-2.5 py-1 rounded-full border", cls[color])}>
      {children}
    </span>
  );
}

// ─── ORDER HISTORY TAB ─────────────────────────────────────────────────────
function OrderHistoryTab({
  onUndo,
  onVerify,
  verification,
}: {
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const [filter, setFilter] = useState("All");
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Order history</h3>
        <p className="text-xs text-stone-500 mt-0.5">0 orders</p>
        <p className="italic text-xs text-stone-400 mt-1">
          Demo content — wire up to real records in a future task.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["All", "Fulfilled", "Unfulfilled", "Pending", "Cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border",
              filter === f
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50",
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="border border-dashed border-stone-200 rounded-xl py-10 text-center text-sm text-stone-400">
        No order history available for this customer.
      </div>
      <VerificationAction
        actionLabel="Mark Order History as done"
        label="Order History"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
    </div>
  );
}

// ─── PATIENT COUNSELLING TAB ───────────────────────────────────────────────
const COUNSELLING_TEMPLATES = [
  { title: "Wegovy — 1.7mg", body: "Escalation single pen from 1mg to 1.7mg." },
  {
    title: "Wegovy — Maintenance 1.7mg",
    body: "Repeat order at the same 1.7mg dose.",
  },
  {
    title: "Wegovy — Staying at 1.7mg",
    body: "Holding at current dose of 1.7mg rather than escalating.",
  },
  {
    title: "Wegovy — Reduce from 2.4mg to 1.7mg",
    body: "Dose reduction from 2.4mg down to 1.7mg.",
  },
  {
    title: "Wegovy — Reduce from 1.7mg to 1mg",
    body: "Dose reduction from 1.7mg down to 1mg.",
  },
  {
    title: "Wegovy — Managing side effects",
    body: "Practical guidance for nausea, constipation, diarrhoea and reflux on Wegovy.",
  },
  {
    title: "Wegovy — Restart after a treatment gap",
    body: "Restart guidance after more than 2 missed Wegovy doses.",
  },
  {
    title: "Wegovy — Switching from Mounjaro",
    body: "Patient moving from Mounjaro to Wegovy — restart at 0.25mg.",
  },
  {
    title: "Wegovy — Pregnancy & contraception",
    body: "Pregnancy, planning, contraception, and breastfeeding guidance on Wegovy.",
  },
  {
    title: "Wegovy — Stopping treatment",
    body: "Safe discontinuation guidance for Wegovy.",
  },
  {
    title: "Wegovy — 6-month review",
    body: "NICE TA875 5% weight loss review at 6 months on maintenance dose.",
  },
  {
    title: "Wegovy — Red flag / urgent symptoms",
    body: "Urgent escalation when red-flag symptoms are reported.",
  },
];

function CounsellingTab({
  onUndo,
  onVerify,
  verification,
}: {
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const [med, setMed] = useState("Wegovy");
  const [dose, setDose] = useState("1.7mg");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<{ id: string; title: string; body: string; at: string }[]>([]);
  const { toast } = useToast();

  const selectedTemplate = COUNSELLING_TEMPLATES.find((t) => t.title === selected) ?? null;
  const visibleTemplates = COUNSELLING_TEMPLATES.filter((template) => {
    const matchesMedication = template.title.toLowerCase().startsWith(med.toLowerCase());
    const matchesDose =
      dose === "All doses" ||
      dose === "Bundles" ||
      template.title.toLowerCase().includes(dose.toLowerCase()) ||
      template.body.toLowerCase().includes(dose.toLowerCase());
    const matchesCategory =
      cat === "All" ||
      template.title.toLowerCase().includes(cat.toLowerCase().split(" ")[0]) ||
      template.body.toLowerCase().includes(cat.toLowerCase().split(" ")[0]);
    return matchesMedication && matchesDose && matchesCategory;
  });

  useEffect(() => {
    if (!selectedTemplate) return;
    setDraft(
      `Hi, please read the following counselling information carefully:\n\n${selectedTemplate.body}\n\nReply in the secure thread if you have any questions or symptoms to report.`,
    );
  }, [selectedTemplate]);

  const sendCounselling = () => {
    if (!selectedTemplate || !draft.trim()) {
      toast({ title: "Select a counselling template first", variant: "destructive" });
      return;
    }
    setSent((current) => [
      {
        id: String(Date.now()),
        title: selectedTemplate.title,
        body: draft.trim(),
        at: new Date().toISOString(),
      },
      ...current,
    ]);
    toast({ title: "Counselling message sent to patient thread" });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Patient counselling</h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          Send templated guidance via the secure thread. Personalise before sending.
        </p>
        <p className="italic text-xs text-stone-400 mt-1.5">
          Demo content — wire up to real records in a future task.
        </p>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/40 p-4 shadow-sm sm:p-5">
        <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Template filters
        </div>
        <div className="space-y-4">
          <FilterRow label="MEDICATION">
            {["Mounjaro", "Wegovy"].map((m) => (
              <Chip key={m} active={med === m} onClick={() => setMed(m)}>
                {m}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="DOSE">
            {["All doses", "0.25mg", "0.5mg", "1mg", "1.7mg", "2.4mg", "Bundles"].map((d) => (
              <Chip key={d} active={dose === d} onClick={() => setDose(d)}>
                {d}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="CATEGORY">
            {[
              "All",
              "Order counselling",
              "Staying / Reducing Dose",
              "Side effects",
              "Restart after gap",
              "Switching medication",
              "Pregnancy / contraception",
              "Stopping treatment",
              "6-month review",
              "Red flag / urgent",
            ].map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </Chip>
            ))}
          </FilterRow>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 font-semibold">
            Templates ({visibleTemplates.length})
          </div>
          {selectedTemplate && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Selected: {selectedTemplate.title}
            </span>
          )}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((t) => (
            <button
              key={t.title}
              onClick={() => setSelected(t.title)}
              className={cn(
                "min-w-0 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
                selected === t.title
                  ? "border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-100"
                  : "border-stone-200",
              )}
            >
              <div className="flex items-start gap-3">
                <Bookmark className="mt-0.5 h-4.5 w-4.5 shrink-0 text-stone-400" />
                <div className="min-w-0 break-words">
                  <div className="font-semibold text-sm leading-tight tracking-tight text-stone-950">
                    {t.title}
                  </div>
                  <div className="mt-1.5 text-sm leading-relaxed text-stone-500">
                    {t.body}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {visibleTemplates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-400 md:col-span-2 xl:col-span-3">
              No templates match the selected filters.
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 font-semibold mb-2.5">
          Email / secure message
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-950 [overflow-wrap:anywhere]">
                      {selectedTemplate.title}
                    </div>
                    <div className="text-xs text-stone-500">Secure patient thread</div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={sendCounselling}
                  className="h-10 rounded-2xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
                >
                  <Send className="h-4 w-4 mr-2" /> Send counselling
                </Button>
              </div>
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-[18rem] w-full resize-y rounded-2xl border-stone-200 bg-stone-50/40 p-4 text-base leading-8 text-stone-800 focus-visible:ring-emerald-200"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-16 text-center text-sm text-stone-400">
              <Mail className="h-7 w-7 mx-auto mb-3 text-stone-300" />
              Select a template above to open the full-width email composer.
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 font-semibold mb-2.5">
          Recently Sent
        </div>
        {sent.length === 0 ? (
          <div className="border border-dashed border-stone-200 rounded-2xl py-6 text-center text-sm text-stone-400 bg-white">
            No templates sent yet for this conversation.
          </div>
        ) : (
          <ul className="space-y-2">
            {sent.map((item) => (
              <li key={item.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-emerald-950">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-emerald-700">
                  Sent by {CURRENT_PHARMACIST_NAME} {formatVerifiedAt(item.at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <VerificationAction
        actionLabel="Mark Patient Counselling as done"
        label="Patient Counselling"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start">
      <span className="pt-2 text-[10px] uppercase tracking-[0.14em] text-stone-400 font-semibold">
        {label}:
      </span>
      <div className="flex min-w-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs px-3.5 py-1.5 rounded-full border transition-colors",
        active
          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
          : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50",
      )}
    >
      {children}
    </button>
  );
}

// ─── MONITORING TAB ────────────────────────────────────────────────────────
function MonitoringTab({
  onUndo,
  onVerify,
  verification,
}: {
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const { toast } = useToast();
  const [flagDraft, setFlagDraft] = useState("");
  const [flagPinned, setFlagPinned] = useState(false);
  const [flags, setFlags] = useState<{ id: string; body: string; pinned: boolean; at: string }[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [notePinned, setNotePinned] = useState(false);
  const [notes, setNotes] = useState<{ id: string; body: string; at: string; pinned: boolean }[]>([]);

  const addFlag = () => {
    if (!flagDraft.trim()) {
      toast({ title: "Add a flag note first", variant: "destructive" });
      return;
    }
    setFlags((current) => [
      ...current,
      {
        id: String(Date.now()),
        body: flagDraft.trim(),
        pinned: flagPinned,
        at: new Date().toISOString(),
      },
    ]);
    setFlagDraft("");
    setFlagPinned(false);
    toast({ title: "Clinical flag added" });
  };

  const addMonitoringNote = () => {
    if (!noteDraft.trim()) {
      toast({ title: "Add a note first", variant: "destructive" });
      return;
    }
    setNotes((current) => [
      ...current,
      {
        id: String(Date.now()),
        body: noteDraft.trim(),
        at: new Date().toISOString(),
        pinned: notePinned,
      },
    ]);
    setNoteDraft("");
    setNotePinned(false);
    toast({ title: "Monitoring note added" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Monitoring</h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          Track patient progress over treatment. Compares current value against the first
          fulfilled order baseline.
        </p>
        <p className="italic text-xs text-stone-400 mt-1.5">
          Demo content — wire up to real records in a future task.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile label="Weight Progress" big="76.2 kg" sub="Baseline" />
        <StatTile label="Current Weight" big="76.2 kg" />
        <StatTile label="Current BMI" big="26.37" />
        <StatTile label="Time on Treatment" big="—" sub="No fulfilled orders yet" />
        <StatTile label="Current Dose" big="1.7mg" sub="Starter dose" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Milestone done label="Treatment Start" sub="" />
        <Milestone label="3 Month Review" sub="3 more pens to unlock" />
        <Milestone label="6 Month Review" sub="6 pens away" />
        <Milestone label="12 Month Review" sub="12 pens away" />
      </div>

      <div>
        <h4 className="font-semibold text-stone-900 tracking-tight">Dose history</h4>
        <p className="text-sm text-stone-500 mb-2.5">All adjustments since treatment start</p>
        <div className="border border-dashed border-stone-200 rounded-2xl py-6 text-center text-sm text-stone-400 bg-white">
          No fulfilled orders yet — dose history will appear here after the first refill.
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-stone-900 tracking-tight">Reorder questionnaire responses</h4>
        <p className="text-sm text-stone-500 mb-2.5">1 submission</p>
        <div className="border border-stone-200 rounded-2xl overflow-x-auto bg-white shadow-sm">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-[0.14em] text-stone-400">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Weight</th>
                <th className="text-left px-4 py-3 font-semibold">BMI</th>
                <th className="text-left px-4 py-3 font-semibold">Update</th>
                <th className="text-left px-4 py-3 font-semibold">Dose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3">
                  17 May 2026{" "}
                  <span className="text-[10px] uppercase tracking-wide bg-rose-200/60 text-rose-800 px-1.5 py-0.5 rounded ml-1">
                    Current
                  </span>
                </td>
                <td className="px-4 py-3">76.2 kg</td>
                <td className="px-4 py-3">26.37</td>
                <td className="px-4 py-3 text-stone-400">—</td>
                <td className="px-4 py-3">Initial</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
        <h4 className="font-semibold text-rose-900 tracking-tight">Flag History</h4>
        <p className="text-sm text-rose-700/80 mb-3.5 leading-relaxed">
          Clinical flags persist across all orders for this patient.
        </p>
        <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Textarea
            value={flagDraft}
            onChange={(event) => setFlagDraft(event.target.value)}
            placeholder="Add a clinical flag about this patient..."
            className="border-0 focus-visible:ring-0 resize-none p-0 text-sm min-h-10"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => setFlagPinned((current) => !current)}
              className={cn(
                "text-xs inline-flex items-center gap-1",
                flagPinned ? "text-rose-700 font-semibold" : "text-stone-500",
              )}
            >
              <Pin className="h-3 w-3" /> Pin
            </button>
            <Button
              type="button"
              size="sm"
              onClick={addFlag}
              className="bg-rose-200 text-rose-800 hover:bg-rose-300 h-7"
            >
              Flag
            </Button>
          </div>
        </div>
        {flags.length === 0 ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl py-6 text-center text-sm text-rose-700/70">
            <FlagIcon className="h-5 w-5 mx-auto mb-1.5 text-rose-300" />
            No clinical flags raised for this patient yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {flags.map((flag) => (
              <li key={flag.id} className="rounded-2xl border border-rose-100 bg-white p-3 text-sm text-rose-950">
                <div className="flex items-start gap-2">
                  <FlagIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div className="min-w-0">
                    <div className="whitespace-pre-wrap break-words">{flag.body}</div>
                    <div className="mt-1 text-[11px] text-rose-500">
                      {flag.pinned ? "Pinned - " : ""}{new Date(flag.at).toLocaleString("en-GB")}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-stone-900 tracking-tight">Order notes</h4>
        <p className="text-sm text-stone-500 mb-3.5 leading-relaxed">
          Free-form clinical commentary. Visible to all prescribers on this patient. Pin
          important notes.
        </p>
        <NoteComposer
          value={noteDraft}
          onChange={setNoteDraft}
          onPost={addMonitoringNote}
          pinned={notePinned}
          onTogglePinned={() => setNotePinned((current) => !current)}
        />
        {notes.length === 0 ? (
          <EmptyNotes />
        ) : (
          <ul className="mt-3 space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-2xl border border-stone-200 bg-white p-4 text-sm shadow-sm">
                <div className="whitespace-pre-wrap text-stone-800">{note.body}</div>
                <div className="mt-2 text-[11px] text-stone-400">
                  {note.pinned ? "Pinned - " : ""}{new Date(note.at).toLocaleString("en-GB")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <VerificationAction
        actionLabel="Mark Monitoring as done"
        label="Monitoring"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
    </div>
  );
}

function StatTile({ label, big, sub }: { label: string; big: string; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400 font-semibold">
        {label}
      </div>
      <div className="text-xl font-bold text-stone-900 mt-1 tracking-tight">{big}</div>
      {sub && <div className="text-sm text-stone-500 mt-0.5 leading-relaxed">{sub}</div>}
    </div>
  );
}

function Milestone({ label, sub, done }: { label: string; sub: string; done?: boolean }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          done ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400",
        )}
      >
        {done ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Clock className="h-4.5 w-4.5" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-stone-900 tracking-tight">{label}</div>
        {sub && <div className="text-sm text-stone-500 mt-0.5 leading-relaxed">{sub}</div>}
      </div>
    </div>
  );
}

// ─── NOTES TAB ─────────────────────────────────────────────────────────────
function NotesTab() {
  const [notes, setNotes] = useState<{ id: string; body: string; at: string; pinned: boolean }[]>([]);
  const [draft, setDraft] = useState("");
  const [pinned, setPinned] = useState(false);
  const { toast } = useToast();

  const postNote = () => {
    if (!draft.trim()) {
      toast({ title: "Add a note first", variant: "destructive" });
      return;
    }
    setNotes((n) => [
      ...n,
      { id: String(Date.now()), body: draft.trim(), at: new Date().toISOString(), pinned },
    ]);
    setDraft("");
    setPinned(false);
    toast({ title: "Note added to this review" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Notes</h3>
        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
          Free-form clinical commentary. Visible to all prescribers on this patient. Pin
          important notes.
        </p>
        <p className="italic text-xs text-stone-400 mt-1.5">
          Demo content — wire up to real records in a future task.
        </p>
      </div>

      <NoteComposer
        value={draft}
        onChange={setDraft}
        onPost={postNote}
        pinned={pinned}
        onTogglePinned={() => setPinned((current) => !current)}
      />

      {notes.length === 0 ? (
        <EmptyNotes />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="bg-white border border-stone-200 rounded-2xl p-4 text-sm shadow-sm"
            >
              <div className="text-stone-800 whitespace-pre-wrap">{n.body}</div>
              <div className="text-[11px] text-stone-400 mt-2.5">
                {n.pinned ? "Pinned - " : ""}{new Date(n.at).toLocaleString("en-GB")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteComposer({
  value,
  onChange,
  onPost,
  pinned,
  onTogglePinned,
}: {
  value?: string;
  onChange?: (v: string) => void;
  onPost?: () => void;
  pinned?: boolean;
  onTogglePinned?: () => void;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-semibold shrink-0">
          MD
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Add a clinical note about this patient..."
          className="border-0 focus-visible:ring-0 resize-none p-0 text-sm min-h-10"
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={onTogglePinned}
          className={cn(
            "text-xs inline-flex items-center gap-1",
            pinned ? "text-emerald-700 font-semibold" : "text-stone-500",
          )}
        >
          <Pin className="h-3 w-3" /> Pin
        </button>
        <Button
          size="sm"
          onClick={onPost}
          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 h-8 rounded-full px-3"
        >
          Post note
        </Button>
      </div>
    </div>
  );
}

function EmptyNotes() {
  return (
    <div className="border border-dashed border-stone-200 rounded-xl py-8 text-center text-xs text-stone-400">
      <StickyNote className="h-6 w-6 mx-auto mb-2 text-stone-300" />
      No notes yet. Be the first to add a clinical note about this patient.
    </div>
  );
}

// ─── ACTIVITY TAB ──────────────────────────────────────────────────────────
type EvDot = "green" | "blue" | "orange" | "amber";
type Ev = { time: string; title: string; body: string; actor?: string; dot: EvDot };
const ACTIVITY: { date: string; events: Ev[] }[] = [
  {
    date: "19 May 2026",
    events: [
      {
        time: "15:57",
        title: "Clinical hold released",
        body: "Released by Om Khetia (customer_support). Reason: provided everything asked for. Order moved to re-review.",
        actor: "Om Khetia",
        dot: "orange",
      },
    ],
  },
  {
    date: "18 May 2026",
    events: [
      {
        time: "16:45",
        title: "Document re-uploaded by customer",
        body: "Customer re-uploaded Weight Scale Video. Order status unchanged — awaiting team review.",
        dot: "orange",
      },
      {
        time: "16:44",
        title: "Document re-uploaded by customer",
        body: "Customer re-uploaded Full Body Video. Order status unchanged — awaiting team review.",
        dot: "orange",
      },
      {
        time: "16:13",
        title: "Document re-uploaded by customer",
        body: "Customer re-uploaded Previous Prescription. Order status unchanged — awaiting team review.",
        dot: "orange",
      },
      {
        time: "09:06",
        title: "Patient contacted",
        body: "Contact logged by Sadia Islam via Phone Call on 18 May 2026, 10:06. Notes: Spoke to CS — Will upload documents later.",
        actor: "Sadia Islam",
        dot: "amber",
      },
    ],
  },
  {
    date: "17 May 2026",
    events: [
      {
        time: "20:37",
        title: "Placed on clinical hold (bulk)",
        body: "Bulk hold by Mohamed Dagol. Reason: awaiting id or vid docs · Auto-flagged for re-upload: ID Card, Full Body Video, Weight Scale Video, Previous Prescription · Email sent to iparson@hotmail.com.",
        actor: "Mohamed Dagol, Reason",
        dot: "green",
      },
      {
        time: "20:03",
        title: "Documents SMS sent",
        body: "Combined SMS sent for: ID card, full body video, weight scale video, previous prescription.",
        dot: "blue",
      },
      {
        time: "20:03",
        title: "Previous prescription requested",
        body: 'Customer asked to upload previous prescription (answered "No"). Via Customerlo.',
        dot: "amber",
      },
      {
        time: "20:03",
        title: "Weight-loss documents requested by Customerlo",
        body: "Customer emailed to upload: id_card, full_body_video, weight_scale_video.",
        dot: "amber",
      },
      {
        time: "20:03",
        title: "Weight-loss welcome email sent by Customerlo",
        body: "Sent program welcome/next-steps email.",
        dot: "blue",
      },
      {
        time: "20:03",
        title: "Order was placed",
        body: "Order was received from Shopify and saved.",
        dot: "green",
      },
    ],
  },
];

function ActivityTab() {
  const dotCls: Record<EvDot, string> = {
    green: "bg-emerald-500",
    blue: "bg-sky-500",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
  };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Activity log</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Auto-generated audit trail. Every system + prescriber action on this order is
          recorded.
        </p>
        <p className="italic text-xs text-stone-400 mt-1">
          Demo content — wire up to real records in a future task.
        </p>
      </div>
      {ACTIVITY.map((day) => (
        <div key={day.date}>
          <div className="sticky top-0 bg-white py-1 text-xs uppercase tracking-wide text-stone-400 font-semibold">
            {day.date}
          </div>
          <ul className="border-l-2 border-stone-100 ml-2 mt-2 space-y-4">
            {day.events.map((ev, i) => (
              <li key={i} className="relative pl-5">
                <span
                  className={cn(
                    "absolute -left-1.75 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                    dotCls[ev.dot],
                  )}
                />
                <div className="text-[11px] text-stone-400">{ev.time}</div>
                <div className="font-semibold text-sm text-stone-900">{ev.title}</div>
                <div className="text-xs text-stone-600 mt-0.5">{ev.body}</div>
                {ev.actor && (
                  <div className="text-[11px] text-stone-400 mt-1">— {ev.actor}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── RIGHT RAIL: DECISION PANEL ────────────────────────────────────────────
type ActionKind = "approve" | "hold" | "reject" | "urgent";

function DecisionPanel({
  consultationId,
  onSelectTab,
  verifications,
}: {
  consultationId: string;
  onSelectTab: (tab: TabId) => void;
  verifications: VerificationState;
}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState<ActionKind | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [urgentMarked, setUrgentMarked] = useState(false);
  const [contactMethod, setContactMethod] = useState("Phone call");
  const [contactNote, setContactNote] = useState("");
  const [contacts, setContacts] = useState([
    {
      method: "Phone call",
      note: "Spoke to CS - will upload documents later.",
      actor: "Sadia Islam",
      at: "2026-05-18T09:06:00.000Z",
    },
  ]);
  const review = useReviewConsultation();
  const remainingSections = CHECKLIST_ITEMS.filter((item) => !verifications[item.id]);
  const checklistComplete = remainingSections.length === 0;

  const submit = async () => {
    if (!open) return;
    if (open === "urgent") {
      setUrgentMarked(true);
      toast({ title: "Order marked as urgent" });
      setOpen(null);
      setReason("");
      return;
    }
    if ((open === "hold" || open === "reject") && !reason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    const actionMap: Record<Exclude<ActionKind, "urgent">, ConsultationReviewInputAction> = {
      approve: "approve",
      hold: "more_info",
      reject: "reject",
    };
    try {
      await review.mutateAsync({
        id: consultationId,
        data: {
          action: actionMap[open],
          pharmacistNote:
            reason.trim() || "Approved after completing the clinical checklist.",
          rejectReason: open === "reject" ? "other" : undefined,
        },
      });
      toast({ title: "Action recorded" });
      setOpen(null);
      setReason("");
      navigate("/queue");
    } catch {
      toast({ title: "Failed to submit action", variant: "destructive" });
    }
  };

  const openApproval = () => {
    if (!checklistComplete) {
      toast({
        title: "Complete the checklist before approving",
        description: `${remainingSections.length} section${remainingSections.length === 1 ? "" : "s"} still pending.`,
        variant: "destructive",
      });
      return;
    }
    setOpen("approve");
  };

  const logContact = () => {
    if (!contactNote.trim()) {
      toast({ title: "Add contact notes first", variant: "destructive" });
      return;
    }
    setContacts((current) => [
      {
        method: contactMethod,
        note: contactNote.trim(),
        actor: CURRENT_PHARMACIST_NAME,
        at: new Date().toISOString(),
      },
      ...current,
    ]);
    setContactNote("");
    setContactOpen(false);
    toast({ title: "Contact logged" });
  };

  const latestContact = contacts[0];

  return (
    <>
      <div className="bg-linear-to-br from-white to-emerald-50/60 border border-emerald-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-emerald-700">
              Returned to review
            </div>
            <div className="text-sm text-stone-900 font-medium mt-1.5 leading-snug">
              Released by Om Khetia
            </div>
            <div className="text-xs text-stone-500 mt-0.5">
              19 May 2026 · 15:57
            </div>
            <div className="text-xs text-stone-600 mt-2 leading-relaxed">
              Provided everything asked for.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-linear-to-br from-white to-amber-50/60 border border-amber-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="text-sm font-semibold text-stone-900">
            Review checklist
          </div>
        </div>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed">
          Mark each section as done before approving this order.
        </p>
        <ul className="mt-3 space-y-2">
          {CHECKLIST_ITEMS.map((it) => {
            const verified = verifications[it.id];
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab(it.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left transition-colors",
                    verified
                      ? "bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
                      : "bg-white/60 text-stone-600 hover:bg-stone-50",
                  )}
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    {verified ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                    )}
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium leading-snug">
                        {it.label}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 text-[11px] leading-relaxed",
                          verified ? "text-emerald-700" : "text-stone-400",
                        )}
                      >
                        {verified
                          ? `Verified by ${verified.verifiedBy} ${formatVerifiedAt(verified.verifiedAt)}`
                          : "Pending"}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-2">
        <ActionCard
          tone="success"
          title="Approve prescription"
          sub={checklistComplete ? "Green light the order" : `${remainingSections.length} checklist items remaining`}
          onClick={openApproval}
          IconCmp={CheckCircle2}
        />
        <ActionCard
          tone="warning"
          title="Put on hold"
          sub="Yellow flag for more info"
          onClick={() => setOpen("hold")}
          IconCmp={Clock}
        />
        <ActionCard
          tone="danger"
          title="Reject prescription"
          sub="Decline and refund"
          onClick={() => setOpen("reject")}
          IconCmp={AlertTriangle}
        />
        {urgentMarked ? (
          <button
            type="button"
            onClick={() => {
              setUrgentMarked(false);
              toast({ title: "Urgent flag removed" });
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-100 px-4 py-2.5 text-xs font-semibold text-sky-800 hover:bg-sky-50 transition-colors shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Urgent - undo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpen("urgent")}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors shadow-sm"
          >
            <FlagIcon className="h-3.5 w-3.5" /> Mark as urgent
          </button>
        )}
      </div>

      <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-500 font-semibold">
            Last contacted
          </div>
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-full px-2.5 py-1 transition-colors"
          >
            <Plus className="h-3 w-3" /> Log
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
            <Phone className="h-3 w-3" /> {latestContact.method}
          </span>
          <span className="text-[11px] text-stone-500">
            {new Date(latestContact.at).toLocaleDateString("en-GB")}
          </span>
        </div>
        <div className="text-[11px] text-stone-400 mt-1.5">
          {new Date(latestContact.at).toLocaleString("en-GB")}
        </div>
        <p className="hidden text-[13px] text-stone-700 mt-2.5 leading-relaxed">
          Spoke to CS — will upload documents later.
        </p>
        <p className="text-[13px] text-stone-700 mt-2.5 leading-relaxed">
          {latestContact.note}
        </p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100">
          <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-[10px] font-semibold">
            {latestContact.actor
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
          <span className="text-[12px] text-stone-600">{latestContact.actor}</span>
        </div>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log patient contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              Method
              <select
                value={contactMethod}
                onChange={(event) => setContactMethod(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-stone-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option>Phone call</option>
                <option>Secure message</option>
                <option>Email</option>
                <option>SMS</option>
              </select>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              Notes
              <Textarea
                value={contactNote}
                onChange={(event) => setContactNote(event.target.value)}
                placeholder="Summarise what happened and any next action..."
                className="mt-1 min-h-28 rounded-xl border-stone-200 text-sm normal-case tracking-normal"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>
              Cancel
            </Button>
            <Button onClick={logContact} className="bg-emerald-600 text-white hover:bg-emerald-700">
              Save log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {open === "approve" && "Approve prescription"}
              {open === "hold" && "Put on hold"}
              {open === "reject" && "Reject prescription"}
              {open === "urgent" && "Mark as urgent"}
            </DialogTitle>
          </DialogHeader>
          {open !== "urgent" && (
            <div className="space-y-2">
              <label className="text-xs text-stone-500">
                {open === "approve" ? "Approval note (optional)" : "Reason"}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a brief reason for the audit log..."
                rows={4}
              />
            </div>
          )}
          {open === "urgent" && (
            <p className="text-sm text-stone-600">
              This order will be flagged as urgent and bumped to the top of the queue.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={review.isPending}
              className={cn(
                "text-white",
                open === "approve" && "bg-emerald-600 hover:bg-emerald-700",
                open === "hold" && "bg-amber-500 hover:bg-amber-600",
                open === "reject" && "bg-rose-600 hover:bg-rose-700",
                open === "urgent" && "bg-sky-600 hover:bg-sky-700",
              )}
            >
              {review.isPending ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionCard({
  tone,
  title,
  sub,
  onClick,
  IconCmp,
}: {
  tone: "success" | "warning" | "danger" | "info";
  title: string;
  sub: string;
  onClick: () => void;
  IconCmp: typeof Pin;
}) {
  const cardCls: Record<typeof tone, string> = {
    success: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    warning: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    danger: "bg-rose-50 border-rose-200 hover:bg-rose-100",
    info: "bg-sky-50 border-sky-200 hover:bg-sky-100",
  };
  const iconCls: Record<typeof tone, string> = {
    success: "bg-emerald-600 text-white",
    warning: "bg-amber-500 text-white",
    danger: "bg-rose-600 text-white",
    info: "bg-sky-500 text-white",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl p-4 border hover:shadow-sm transition-all flex items-center gap-3 shadow-sm",
        cardCls[tone],
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-sm",
          iconCls[tone],
        )}
      >
        <IconCmp className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-stone-900 leading-tight">
          {title}
        </div>
        <div className="text-xs text-stone-500 mt-0.5 leading-snug">{sub}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
    </button>
  );
}

import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
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

function orderRefFromId(id: string): string {
  return "#" + id.replace(/-/g, "").toUpperCase().slice(-5);
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
  const [tab, setTab] = useState<TabId>("clinical");

  if (isLoading) {
    return (
      <div className="px-6 py-8 max-w-[1700px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-4">
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
    <div className="max-w-[1700px] mx-auto px-6 py-4">
      {/* Top strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/queue"
            className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back to queue
          </Link>
          <span className="text-stone-300">·</span>
          <span className="font-semibold text-stone-800">
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
        <div className="text-xs text-stone-500">{formatDateTime(c.createdAt)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_260px] gap-4">
        {/* LEFT */}
        <div className="space-y-3">
          <PatientCard c={c} />
          <StatsGrid c={c} />
          <AutoFlags c={c} />
        </div>

        {/* CENTER */}
        <div className="min-w-0">
          <TabsBar current={tab} onChange={setTab} />
          <div className="bg-white border border-stone-200 rounded-xl p-5 mt-3">
            {tab === "clinical" && <ClinicalReviewTab c={c} />}
            {tab === "consultation" && <ConsultationTab c={c} />}
            {tab === "documents" && <DocumentsTab />}
            {tab === "history" && <OrderHistoryTab />}
            {tab === "counselling" && <CounsellingTab />}
            {tab === "monitoring" && <MonitoringTab />}
            {tab === "notes" && <NotesTab />}
            {tab === "activity" && <ActivityTab />}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-3">
          <DecisionPanel consultationId={c.id} />
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;

// ─── LEFT RAIL ─────────────────────────────────────────────────────────────
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
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-serif font-bold text-lg leading-tight">
          {c.patientName || "—"}
        </h3>
        <button className="text-stone-400 hover:text-stone-600" aria-label="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {isRepeat && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Transferring
          </span>
        )}
        {!isRepeat && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-lime-50 text-lime-800 border border-lime-100">
            1st Dose
          </span>
        )}
      </div>
      <dl className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[64px_1fr_16px] gap-2 items-start text-xs">
            <dt className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold pt-0.5">
              {r.label}
            </dt>
            <dd className="text-stone-800 break-words">{r.value}</dd>
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
    <div className="grid grid-cols-2 gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="bg-white border border-stone-200 rounded-xl p-3"
        >
          <div className="font-semibold text-stone-900">
            {cell.value}
            {cell.suffix && (
              <span className="text-xs text-stone-500 ml-1">{cell.suffix}</span>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-stone-400 mt-1">
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
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-3">
        <FlagIcon className="h-3 w-3" /> Auto-Flags
      </div>
      <ul className="space-y-1.5">
        {flags.map((f, i) => (
          <li
            key={i}
            className={cn(
              "rounded-md p-2 text-xs flex items-center gap-2",
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
function TabsBar({ current, onChange }: { current: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl px-2">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              data-testid={`tab-${t.id}`}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 px-3 py-3 text-sm border-b-2 -mb-px transition-colors",
                active
                  ? "border-[#0E3D2D] text-[#0E3D2D] font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {t.badge && (
                <span
                  className={cn(
                    "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                    active
                      ? "bg-emerald-100 text-emerald-700"
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
function ClinicalReviewTab({ c }: { c: Consultation }) {
  const { toast } = useToast();
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

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-2">
          Order Summary
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0">
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
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
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

      <div className="border border-stone-200 rounded-xl p-3 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
        <div className="flex-1 text-sm">
          <div className="font-semibold text-stone-900">NHS Summary Care Record</div>
          <div className="text-xs text-stone-500">
            View prescribed medications, allergies and clinical info from NHS.
          </div>
        </div>
        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white">
          Go to NHS SCR <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <Button
        onClick={() => toast({ title: "Clinical Review marked as done" })}
        className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Clinical Review as done
      </Button>
    </div>
  );
}

// ─── CONSULTATION TAB ──────────────────────────────────────────────────────
function ConsultationTab({ c }: { c: Consultation }) {
  const entries = Object.entries(c.answers ?? {});
  return (
    <div>
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
    </div>
  );
}

// ─── DOCUMENTS TAB ─────────────────────────────────────────────────────────
function DocumentsTab() {
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
function OrderHistoryTab() {
  const { toast } = useToast();
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
      <Button
        onClick={() => toast({ title: "Order History marked as done" })}
        className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Order History as done
      </Button>
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

function CounsellingTab() {
  const { toast } = useToast();
  const [med, setMed] = useState("Wegovy");
  const [dose, setDose] = useState("1.7mg");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Patient counselling</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Send templated guidance via the secure thread. Personalise before sending.
        </p>
        <p className="italic text-xs text-stone-400 mt-1">
          Demo content — wire up to real records in a future task.
        </p>
      </div>

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

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-2">
            Templates ({COUNSELLING_TEMPLATES.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COUNSELLING_TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => setSelected(t.title)}
                className={cn(
                  "text-left bg-white border rounded-xl p-3 hover:border-emerald-300 transition-colors",
                  selected === t.title ? "border-emerald-400" : "border-stone-200",
                )}
              >
                <div className="flex items-start gap-2">
                  <Bookmark className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{t.title}</div>
                    <div className="text-xs text-stone-500 mt-1">{t.body}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-2">
            Preview & Send
          </div>
          <div className="border border-dashed border-stone-200 rounded-xl py-12 px-4 text-center text-xs text-stone-400">
            <Mail className="h-6 w-6 mx-auto mb-2 text-stone-300" />
            {selected
              ? `Previewing: ${selected}`
              : "Select a template on the left to preview and personalise."}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mb-2">
          Recently Sent
        </div>
        <div className="border border-dashed border-stone-200 rounded-xl py-6 text-center text-xs text-stone-400">
          No templates sent yet for this conversation.
        </div>
      </div>

      <Button
        onClick={() => toast({ title: "Patient Counselling marked as done" })}
        className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Patient Counselling as done
      </Button>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold mr-1">
        {label}:
      </span>
      {children}
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
        "text-xs px-3 py-1 rounded-full border transition-colors",
        active
          ? "bg-emerald-700 text-white border-emerald-700"
          : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50",
      )}
    >
      {children}
    </button>
  );
}

// ─── MONITORING TAB ────────────────────────────────────────────────────────
function MonitoringTab() {
  const { toast } = useToast();
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Monitoring</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Track patient progress over treatment. Compares current value against the first
          fulfilled order baseline.
        </p>
        <p className="italic text-xs text-stone-400 mt-1">
          Demo content — wire up to real records in a future task.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <StatTile label="Weight Progress" big="76.2 kg" sub="Baseline" />
        <StatTile label="Current Weight" big="76.2 kg" />
        <StatTile label="Current BMI" big="26.37" />
        <StatTile label="Time on Treatment" big="—" sub="No fulfilled orders yet" />
        <StatTile label="Current Dose" big="1.7mg" sub="Starter dose" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Milestone done label="Treatment Start" sub="" />
        <Milestone label="3 Month Review" sub="3 more pens to unlock" />
        <Milestone label="6 Month Review" sub="6 pens away" />
        <Milestone label="12 Month Review" sub="12 pens away" />
      </div>

      <div>
        <h4 className="font-semibold">Dose history</h4>
        <p className="text-xs text-stone-500 mb-2">All adjustments since treatment start</p>
        <div className="border border-dashed border-stone-200 rounded-xl py-6 text-center text-sm text-stone-400">
          No fulfilled orders yet — dose history will appear here after the first refill.
        </div>
      </div>

      <div>
        <h4 className="font-semibold">Reorder questionnaire responses</h4>
        <p className="text-xs text-stone-500 mb-2">1 submission</p>
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-400">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Date</th>
                <th className="text-left px-3 py-2 font-semibold">Weight</th>
                <th className="text-left px-3 py-2 font-semibold">BMI</th>
                <th className="text-left px-3 py-2 font-semibold">Update</th>
                <th className="text-left px-3 py-2 font-semibold">Dose</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2">
                  17 May 2026{" "}
                  <span className="text-[10px] uppercase tracking-wide bg-rose-200/60 text-rose-800 px-1.5 py-0.5 rounded ml-1">
                    Current
                  </span>
                </td>
                <td className="px-3 py-2">76.2 kg</td>
                <td className="px-3 py-2">26.37</td>
                <td className="px-3 py-2 text-stone-400">—</td>
                <td className="px-3 py-2">Initial</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
        <h4 className="font-semibold text-rose-900">Flag History</h4>
        <p className="text-xs text-rose-700/80 mb-3">
          Clinical flags persist across all orders for this patient.
        </p>
        <div className="bg-white rounded-lg p-3 mb-3">
          <Textarea
            placeholder="Add a clinical flag about this patient..."
            className="border-0 focus-visible:ring-0 resize-none p-0 text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <button className="text-xs text-stone-500 inline-flex items-center gap-1">
              <Pin className="h-3 w-3" /> Pin
            </button>
            <Button size="sm" className="bg-rose-200 text-rose-800 hover:bg-rose-300 h-7">
              Flag
            </Button>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-lg py-6 text-center text-xs text-rose-700/70">
          <FlagIcon className="h-5 w-5 mx-auto mb-1 text-rose-300" />
          No clinical flags raised for this patient yet.
        </div>
      </div>

      <div>
        <h4 className="font-semibold">Order notes</h4>
        <p className="text-xs text-stone-500 mb-3">
          Free-form clinical commentary. Visible to all prescribers on this patient. Pin
          important notes.
        </p>
        <NoteComposer />
        <EmptyNotes />
      </div>

      <Button
        onClick={() => toast({ title: "Monitoring marked as done" })}
        className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Monitoring as done
      </Button>
    </div>
  );
}

function StatTile({ label, big, sub }: { label: string; big: string; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold text-stone-900 mt-1">{big}</div>
      {sub && <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Milestone({ label, sub, done }: { label: string; sub: string; done?: boolean }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3 flex items-start gap-2">
      <div
        className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
          done ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400",
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-stone-900">{label}</div>
        {sub && <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── NOTES TAB ─────────────────────────────────────────────────────────────
function NotesTab() {
  const [notes, setNotes] = useState<{ id: string; body: string; at: string }[]>([]);
  const [draft, setDraft] = useState("");
  const { toast } = useToast();

  const postNote = () => {
    if (!draft.trim()) return;
    setNotes((n) => [
      ...n,
      { id: String(Date.now()), body: draft.trim(), at: new Date().toISOString() },
    ]);
    setDraft("");
    toast({ title: "Note added (session only)" });
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">Notes</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Free-form clinical commentary. Visible to all prescribers on this patient. Pin
          important notes.
        </p>
        <p className="italic text-xs text-stone-400 mt-1">
          Demo content — wire up to real records in a future task.
        </p>
      </div>

      <NoteComposer value={draft} onChange={setDraft} onPost={postNote} />

      {notes.length === 0 ? (
        <EmptyNotes />
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="bg-white border border-stone-200 rounded-xl p-3 text-sm"
            >
              <div className="text-stone-800 whitespace-pre-wrap">{n.body}</div>
              <div className="text-[11px] text-stone-400 mt-2">
                {new Date(n.at).toLocaleString("en-GB")}
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
}: {
  value?: string;
  onChange?: (v: string) => void;
  onPost?: () => void;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-semibold shrink-0">
          MD
        </div>
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Add a clinical note about this patient..."
          className="border-0 focus-visible:ring-0 resize-none p-0 text-sm min-h-[40px]"
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <button className="text-xs text-stone-500 inline-flex items-center gap-1">
          <Pin className="h-3 w-3" /> Pin
        </button>
        <Button
          size="sm"
          onClick={onPost}
          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 h-7"
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
                    "absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white",
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
type ActionKind = "prescriber_hold" | "cs_hold" | "decline" | "urgent";

function DecisionPanel({ consultationId }: { consultationId: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState<ActionKind | null>(null);
  const [reason, setReason] = useState("");
  const review = useReviewConsultation();

  const submit = async () => {
    if (!open) return;
    if (open === "urgent") {
      toast({ title: "Order marked as urgent" });
      setOpen(null);
      setReason("");
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    const actionMap: Record<Exclude<ActionKind, "urgent">, ConsultationReviewInputAction> = {
      prescriber_hold: "more_info",
      cs_hold: "more_info",
      decline: "reject",
    };
    try {
      await review.mutateAsync({
        id: consultationId,
        data: {
          action: actionMap[open],
          pharmacistNote: reason.trim(),
          rejectReason: open === "decline" ? "other" : undefined,
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

  return (
    <>
      <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
        Make a Decision
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-emerald-900 uppercase tracking-wide text-[11px]">
              Returned to Review
            </div>
            <div className="text-emerald-800 mt-1">
              Released by Om Khetia on 19 May 2026, 15:57
            </div>
            <div className="text-emerald-700 mt-1">provided everything asked for</div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
        <div className="mb-2">
          Review checklist incomplete. Mark these as done before approving:
        </div>
        <ul className="space-y-1">
          {[
            "Clinical Review",
            "Consultation",
            "Documents",
            "Order History",
            "Patient Counselling",
            "Monitoring",
          ].map((it) => (
            <li key={it} className="flex items-center gap-2 italic">
              <Lock className="h-3 w-3 shrink-0" />
              {it}
            </li>
          ))}
        </ul>
      </div>

      <ActionCard
        color="indigo"
        title="Place on Prescriber Hold"
        sub="Pause for prescriber action"
        onClick={() => setOpen("prescriber_hold")}
        iconBg="bg-white"
        IconCmp={Pin}
      />
      <ActionCard
        color="amber"
        title="Place on hold"
        sub="Move to CS Hold"
        onClick={() => setOpen("cs_hold")}
        iconBg="bg-white"
        IconCmp={Clock}
      />
      <ActionCard
        color="rose"
        title="Decline order"
        sub="Reject & refund"
        onClick={() => setOpen("decline")}
        iconBg="bg-white"
        IconCmp={AlertTriangle}
      />
      <ActionCard
        color="yellow"
        title="Mark as urgent"
        sub="Prioritize in queue"
        onClick={() => setOpen("urgent")}
        iconBg="bg-white"
        IconCmp={FlagIcon}
      />

      <div className="bg-white border border-stone-200 rounded-xl p-3 mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
            Last Contacted
          </div>
          <button className="inline-flex items-center gap-1 text-[10px] bg-emerald-700 text-white rounded-full px-2 py-1">
            <Plus className="h-3 w-3" /> Log
          </button>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1 text-[11px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
            <Phone className="h-3 w-3" /> Phone Call
          </span>
          <span className="text-[11px] text-stone-500">3 days ago</span>
        </div>
        <div className="text-[11px] text-stone-400">18 May 2026, 09:06</div>
        <div className="text-xs text-stone-700 mt-1.5">
          Spoke to CS - Will upload documents later
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="h-5 w-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-semibold">
            SI
          </div>
          <span className="text-[11px] text-stone-600">Sadia Islam</span>
        </div>
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {open === "prescriber_hold" && "Place on Prescriber Hold"}
              {open === "cs_hold" && "Place on CS Hold"}
              {open === "decline" && "Decline order"}
              {open === "urgent" && "Mark as urgent"}
            </DialogTitle>
          </DialogHeader>
          {open !== "urgent" && (
            <div className="space-y-2">
              <label className="text-xs text-stone-500">Reason</label>
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
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
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
  color,
  title,
  sub,
  onClick,
  iconBg,
  IconCmp,
}: {
  color: "indigo" | "amber" | "rose" | "yellow";
  title: string;
  sub: string;
  onClick: () => void;
  iconBg: string;
  IconCmp: typeof Pin;
}) {
  const cls: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-900",
    amber: "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900",
    rose: "bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-900",
    yellow: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-900",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl p-3 border transition-colors flex items-start gap-2 hover:shadow-sm",
        cls[color],
      )}
    >
      <div
        className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
          iconBg,
        )}
      >
        <IconCmp className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight">{title}</div>
        <div className="text-xs opacity-80 mt-0.5">{sub}</div>
      </div>
    </button>
  );
}

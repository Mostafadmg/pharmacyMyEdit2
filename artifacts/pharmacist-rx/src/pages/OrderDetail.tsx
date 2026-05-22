import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  FileText,
  Stethoscope,
  Image as ImageIcon,
  History,
  ClipboardCheck,
  Activity,
  StickyNote,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Send,
  Pill,
  Phone,
  Mail,
  Calendar,
  Heart,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import {
  useGetConsultation,
  useReviewConsultation,
  useListConsultationMessages,
  usePostConsultationMessage,
  getGetConsultationQueryKey,
  getListConsultationMessagesQueryKey,
  type Consultation,
  type PrescriptionItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "clinical", label: "Clinical Review", icon: Stethoscope },
  { id: "consultation", label: "Consultation", icon: ClipboardCheck },
  { id: "documents", label: "Documents", icon: ImageIcon },
  { id: "history", label: "Order History", icon: History },
  { id: "counselling", label: "Counselling", icon: Heart },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

export function OrderDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data: c, isLoading } = useGetConsultation(id);
  const { data: msgs } = useListConsultationMessages(id);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("clinical");
  const [messageDraft, setMessageDraft] = useState("");
  const [showInteractions, setShowInteractions] = useState(false);

  const postMessage = usePostConsultationMessage({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListConsultationMessagesQueryKey(id) });
        setMessageDraft("");
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading consultation…
      </div>
    );
  }
  if (!c) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">Consultation not found.</p>
        <Link href="/queue">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link href="/queue">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Queue
          </Button>
        </Link>
        <h1 className="text-xl md:text-2xl font-serif font-semibold tracking-tight">
          {c.patientName}
        </h1>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm">{c.conditionName}</span>
        <StatusPill status={c.status} />
        {c.hasRedFlag && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Red flag
          </Badge>
        )}
        {c.previousConsultationId && (
          <Badge variant="secondary">Repeat / Follow-up</Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          <a
            href={`/api/consultations/${c.id}/prescription.pdf`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInteractions(true)}
            data-testid="button-interactions"
          >
            <ShieldCheck className="h-4 w-4 mr-2" /> Interactions
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_320px] gap-5">
        {/* LEFT RAIL — patient + auto-flags */}
        <div className="space-y-4">
          <PatientCard c={c} />
          <AutoFlagsCard c={c} />
        </div>

        {/* CENTER — tabs */}
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="w-full justify-start flex-wrap h-auto bg-muted/40 p-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    data-testid={`tab-trigger-${t.id}`}
                    className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="clinical">
              <ClinicalReview c={c} />
            </TabsContent>
            <TabsContent value="consultation">
              <ConsultationTab c={c} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab c={c} />
            </TabsContent>
            <TabsContent value="history">
              <OrderHistoryTab c={c} />
            </TabsContent>
            <TabsContent value="counselling">
              <CounsellingTab c={c} />
            </TabsContent>
            <TabsContent value="monitoring">
              <MonitoringTab c={c} />
            </TabsContent>
            <TabsContent value="notes">
              <NotesTab consultationId={c.id} />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTab c={c} messages={msgs?.messages ?? []} />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT RAIL — decision panel */}
        <div className="lg:sticky lg:top-20 self-start space-y-4">
          <DecisionPanel c={c} />
          <MessagesPanel
            messages={msgs?.messages ?? []}
            draft={messageDraft}
            setDraft={setMessageDraft}
            onSend={() => {
              if (!messageDraft.trim()) return;
              postMessage.mutate({
                id: c.id,
                data: { body: messageDraft.trim(), kind: "message" },
              });
            }}
            sending={postMessage.isPending}
          />
        </div>
      </div>

      <InteractionsDialog
        c={c}
        open={showInteractions}
        onOpenChange={setShowInteractions}
      />
    </div>
  );
}

// ── LEFT RAIL ───────────────────────────────────────────────────────────────
function PatientCard({ c }: { c: Consultation }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
          {c.patientName
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{c.patientName}</div>
          <div className="text-xs text-muted-foreground">
            {c.patientAge}y · {c.patientSex}
          </div>
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        <Row icon={Mail} text={c.patientEmail} />
        {c.gpName && <Row icon={Stethoscope} text={`GP: ${c.gpName}`} />}
        {c.gpPhone && <Row icon={Phone} text={c.gpPhone} />}
        <Row
          icon={Calendar}
          text={`Submitted ${new Date(c.createdAt).toLocaleDateString("en-GB")}`}
        />
      </div>
      {c.bmi != null && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">BMI</span>
          <span className="font-semibold">{Number(c.bmi).toFixed(1)}</span>
        </div>
      )}
    </Card>
  );
}

function Row({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function AutoFlagsCard({ c }: { c: Consultation }) {
  const flags = useMemo(() => computeAutoFlags(c), [c]);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="font-semibold text-sm">Auto-flags</h3>
      </div>
      {flags.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No clinical risk markers detected.
        </p>
      ) : (
        <ul className="space-y-2">
          {flags.map((f, i) => (
            <li
              key={i}
              data-testid={`flag-${i}`}
              className={cn(
                "text-xs rounded-md px-2.5 py-2 border-l-2",
                f.severity === "high"
                  ? "bg-destructive/5 border-destructive text-destructive"
                  : f.severity === "med"
                  ? "bg-amber-50 border-amber-500 text-amber-800"
                  : "bg-muted/40 border-muted-foreground/40 text-foreground/80",
              )}
            >
              <div className="font-semibold">{f.label}</div>
              <div className="opacity-80 mt-0.5">{f.detail}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function computeAutoFlags(c: Consultation) {
  const flags: { label: string; detail: string; severity: "high" | "med" | "low" }[] =
    [];
  if (c.hasRedFlag)
    flags.push({
      label: "Red flag answer",
      detail: "Patient answered a yes/no question outside safe parameters.",
      severity: "high",
    });
  if (c.isPregnant)
    flags.push({
      label: "Pregnancy",
      detail: "Patient indicated current pregnancy.",
      severity: "high",
    });
  if (c.bmi != null) {
    const bmi = Number(c.bmi);
    if (bmi < 18.5)
      flags.push({
        label: "BMI low",
        detail: `BMI ${bmi.toFixed(1)} — underweight, weight-loss meds contraindicated.`,
        severity: "high",
      });
    else if (bmi < 27)
      flags.push({
        label: "BMI below threshold",
        detail: `BMI ${bmi.toFixed(1)} — below NICE threshold for injectable weight loss.`,
        severity: "med",
      });
  }
  if (c.allergies && c.allergies.toLowerCase() !== "none")
    flags.push({
      label: "Allergies on file",
      detail: c.allergies,
      severity: "med",
    });
  if (c.currentMedications && c.currentMedications.toLowerCase() !== "none")
    flags.push({
      label: "Concurrent meds",
      detail: "Check for interactions before prescribing.",
      severity: "med",
    });
  if (c.patientAge < 18)
    flags.push({
      label: "Under-18",
      detail: "Most online treatments require adulthood.",
      severity: "high",
    });
  if (c.patientAge >= 65)
    flags.push({
      label: "Elderly patient (65+)",
      detail: "Consider dose adjustment and frailty.",
      severity: "low",
    });
  return flags;
}

// ── TABS ─────────────────────────────────────────────────────────────────────
function ClinicalReview({ c }: { c: Consultation }) {
  return (
    <div className="space-y-4 mt-4">
      <Card className="p-5">
        <h3 className="font-serif font-semibold mb-3">Presenting condition</h3>
        <p className="text-sm">{c.conditionName}</p>
        {c.clinicalDecisionRationale && (
          <div className="mt-3 p-3 bg-muted/40 rounded-md text-sm">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Rationale captured at submission
            </div>
            {c.clinicalDecisionRationale}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-serif font-semibold mb-3">Patient-reported background</h3>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <DT label="Allergies" v={c.allergies ?? "None reported"} />
          <DT label="Current medications" v={c.currentMedications ?? "None"} />
          <DT label="Medical history" v={c.medicalHistory ?? "Unremarkable"} />
          <DT label="Pregnancy" v={c.isPregnant ? "Yes" : "No / N/A"} />
          {c.heightCm && <DT label="Height" v={`${c.heightCm} cm`} />}
          {c.weightKg && <DT label="Weight" v={`${c.weightKg} kg`} />}
        </dl>
      </Card>

      {c.riskFlags && c.riskFlags.length > 0 && (
        <Card className="p-5 border-amber-300 bg-amber-50/50">
          <h3 className="font-serif font-semibold mb-2 text-amber-900">
            Submission risk flags
          </h3>
          <ul className="text-sm space-y-1 list-disc list-inside text-amber-900">
            {c.riskFlags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function DT({ label, v }: { label: string; v: string | number | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </dt>
      <dd className="mt-0.5">{v || "—"}</dd>
    </div>
  );
}

function ConsultationTab({ c }: { c: Consultation }) {
  const entries = Object.entries(c.answers ?? {});
  return (
    <Card className="p-5 mt-4">
      <h3 className="font-serif font-semibold mb-3">
        Questionnaire answers ({entries.length})
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No structured answers recorded.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([k, v]) => (
            <div key={k} className="grid sm:grid-cols-[1fr_2fr] gap-2 py-2 border-b border-border last:border-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                {k.replace(/_/g, " ")}
              </div>
              <div className="text-sm" data-testid={`answer-${k}`}>
                {Array.isArray(v) ? v.join(", ") : String(v ?? "—")}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DocumentsTab({ c }: { c: Consultation }) {
  return (
    <Card className="p-5 mt-4">
      <h3 className="font-serif font-semibold mb-3">Patient uploads</h3>
      {!c.hasPhoto || !c.photoUrls?.length ? (
        <p className="text-sm text-muted-foreground">
          No photos or documents uploaded for this consultation.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {c.photoUrls.map((u, i) => (
            <a
              key={i}
              href={u}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md border border-border overflow-hidden hover:border-primary"
            >
              <img src={u} alt={`Upload ${i + 1}`} className="w-full h-40 object-cover" />
            </a>
          ))}
        </div>
      )}
      <div className="mt-5 pt-5 border-t border-border">
        <h4 className="text-sm font-semibold mb-2">ID verification</h4>
        <p className="text-xs text-muted-foreground">
          {c.identityVerificationMethod
            ? `${c.identityVerificationMethod} (${c.identityVerificationRef ?? "ref pending"})`
            : "Not yet verified."}
        </p>
      </div>
    </Card>
  );
}

function OrderHistoryTab({ c }: { c: Consultation }) {
  return (
    <Card className="p-5 mt-4">
      <h3 className="font-serif font-semibold mb-3">Order &amp; delivery</h3>
      <dl className="grid sm:grid-cols-2 gap-3 text-sm">
        <DT
          label="Delivery address"
          v={
            c.deliveryAddress ||
            [c.deliveryAddressLine1, c.deliveryCity, c.deliveryPostcode]
              .filter(Boolean)
              .join(", ")
          }
        />
        <DT label="Delivery method" v={c.preferredDeliveryMethod} />
        <DT label="Carrier" v={c.deliveryCarrier} />
        <DT label="Tracking" v={c.deliveryTrackingNumber} />
        <DT
          label="Dispatched"
          v={c.dispatchedAt ? new Date(c.dispatchedAt).toLocaleString("en-GB") : "—"}
        />
        <DT
          label="Delivered"
          v={c.deliveredAt ? new Date(c.deliveredAt).toLocaleString("en-GB") : "—"}
        />
      </dl>
      {c.previousConsultationId && (
        <div className="mt-4 p-3 rounded-md bg-violet-50 border border-violet-200 text-sm text-violet-900">
          This is a repeat / follow-up of consultation #{c.previousConsultationId}.
        </div>
      )}
    </Card>
  );
}

const COUNSELLING_TEMPLATES = [
  {
    title: "Injection technique",
    body: "Pen storage 2–8°C, rotate injection site weekly (abdomen / thigh / upper arm), inject same day each week.",
  },
  {
    title: "Side-effect expectations",
    body: "Mild nausea is common in the first 2–4 weeks. Persistent vomiting, severe abdominal pain → contact us immediately.",
  },
  {
    title: "Diet & hydration",
    body: "Small protein-forward meals, 2L water daily, avoid alcohol while titrating dose.",
  },
  {
    title: "Missed dose",
    body: "If within 4 days of usual day: inject when remembered. If >4 days: skip dose and resume normal schedule.",
  },
  {
    title: "Pregnancy & contraception",
    body: "Effective contraception required throughout treatment and 2 months after stopping. Notify us immediately if pregnancy planned or suspected.",
  },
  {
    title: "Red-flag symptoms",
    body: "Severe upper abdominal pain, jaundice, persistent vomiting, signs of gallstones — seek urgent medical review.",
  },
];

function CounsellingTab({ c }: { c: Consultation }) {
  return (
    <Card className="p-5 mt-4">
      <h3 className="font-serif font-semibold mb-1">Patient counselling library</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Snippets you can send to {c.patientName.split(" ")[0]} via the message panel.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {COUNSELLING_TEMPLATES.map((t) => (
          <div
            key={t.title}
            className="p-3 rounded-md border border-border bg-muted/20"
            data-testid={`counsel-${t.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            <p className="text-xs text-muted-foreground mt-1">{t.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MonitoringTab({ c }: { c: Consultation }) {
  const checks = [
    { label: "Baseline weight", ok: c.weightKg != null, v: `${c.weightKg ?? "—"} kg` },
    { label: "Baseline height", ok: c.heightCm != null, v: `${c.heightCm ?? "—"} cm` },
    { label: "BMI calculated", ok: c.bmi != null, v: c.bmi != null ? Number(c.bmi).toFixed(1) : "—" },
    { label: "GP notified", ok: !!c.consentShareWithGp, v: c.consentShareWithGp ? "Yes" : "No consent" },
    { label: "ID verified", ok: !!c.identityVerificationMethod, v: c.identityVerificationMethod ?? "Pending" },
    { label: "Pregnancy status", ok: c.isPregnant !== null, v: c.isPregnant ? "Pregnant" : "Not pregnant" },
  ];
  return (
    <Card className="p-5 mt-4">
      <h3 className="font-serif font-semibold mb-3">Safety monitoring checklist</h3>
      <ul className="divide-y divide-border">
        {checks.map((ch) => (
          <li
            key={ch.label}
            className="py-2.5 flex items-center justify-between text-sm"
            data-testid={`monitor-${ch.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center gap-2">
              {ch.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              {ch.label}
            </div>
            <span className="text-muted-foreground">{ch.v}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 p-3 rounded-md bg-primary/5 text-xs text-primary">
        Next safety review:{" "}
        {c.reviewedAt
          ? new Date(
              new Date(c.reviewedAt).getTime() + 28 * 24 * 60 * 60 * 1000,
            ).toLocaleDateString("en-GB")
          : "after first prescription"}
      </div>
    </Card>
  );
}

function NotesTab({ consultationId }: { consultationId: string }) {
  const key = `rx:notes:${consultationId}`;
  const [notes, setNotes] = useState<{ id: string; body: string; at: string }[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        return [];
      }
    },
  );
  const [draft, setDraft] = useState("");

  const persist = (next: typeof notes) => {
    setNotes(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <Card className="p-5 mt-4">
      <h3 className="font-serif font-semibold mb-1">Scratchpad notes (draft only)</h3>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mb-3">
        <strong>Not part of the clinical record.</strong> Stored only in this browser — will be lost if cookies/site data are cleared or you switch device. For audit-grade notes, use the decision panel's "Pharmacist note" field when approving / referring / rejecting.
      </p>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a note for yourself or a colleague…"
        rows={3}
        data-testid="input-note"
      />
      <Button
        size="sm"
        className="mt-2"
        onClick={() => {
          if (!draft.trim()) return;
          persist([
            { id: Date.now().toString(), body: draft.trim(), at: new Date().toISOString() },
            ...notes,
          ]);
          setDraft("");
        }}
        data-testid="button-add-note"
      >
        <Plus className="h-4 w-4 mr-1" /> Add note
      </Button>
      <ul className="mt-5 space-y-2">
        {notes.map((n) => (
          <li
            key={n.id}
            className="p-3 rounded-md bg-muted/40 border border-border text-sm flex gap-3"
            data-testid={`note-${n.id}`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted-foreground mb-1">
                {new Date(n.at).toLocaleString("en-GB")}
              </div>
              <div className="whitespace-pre-wrap">{n.body}</div>
            </div>
            <button
              onClick={() => persist(notes.filter((x) => x.id !== n.id))}
              className="text-muted-foreground hover:text-destructive shrink-0"
              aria-label="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {notes.length === 0 && (
          <li className="text-xs text-muted-foreground text-center py-4">
            No notes yet.
          </li>
        )}
      </ul>
    </Card>
  );
}

function ActivityTab({
  c,
  messages,
}: {
  c: Consultation;
  messages: { id: string; body: string; senderRole: string; senderName: string; createdAt: string }[];
}) {
  const events: { at: string; label: string; detail?: string }[] = [];
  events.push({ at: c.createdAt, label: "Consultation submitted by patient" });
  if (c.reviewedAt)
    events.push({
      at: c.reviewedAt,
      label: `Reviewed → ${c.status.replace(/_/g, " ")}`,
      detail: c.reviewedBy ? `by ${c.reviewedBy}` : undefined,
    });
  if (c.dispatchedAt)
    events.push({ at: c.dispatchedAt, label: "Order dispatched" });
  if (c.deliveredAt)
    events.push({ at: c.deliveredAt, label: "Order delivered" });
  for (const m of messages) {
    events.push({
      at: m.createdAt,
      label: `Message from ${m.senderRole}`,
      detail: m.body.slice(0, 120),
    });
  }
  events.sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card className="p-5 mt-4">
      <h3 className="font-serif font-semibold mb-3">Activity timeline</h3>
      <ol className="relative border-l border-border ml-2">
        {events.map((e, i) => (
          <li key={i} className="ml-4 pb-4" data-testid={`event-${i}`}>
            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
            <time className="text-[11px] text-muted-foreground">
              {new Date(e.at).toLocaleString("en-GB")}
            </time>
            <div className="text-sm font-medium capitalize">{e.label}</div>
            {e.detail && (
              <div className="text-xs text-muted-foreground mt-0.5">{e.detail}</div>
            )}
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ── DECISION PANEL ──────────────────────────────────────────────────────────
const REJECT_REASONS = [
  "medically_unsuitable",
  "outside_our_scope",
  "insufficient_information",
  "already_prescribed",
  "other",
] as const;

const REFER_TYPES = [
  "gp",
  "hospital_specialist",
  "ae",
  "nhs_111",
  "sexual_health_clinic",
  "mental_health",
  "other",
] as const;

function DecisionPanel({ c }: { c: Consultation }) {
  const qc = useQueryClient();
  const review = useReviewConsultation({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetConsultationQueryKey(c.id) });
      },
    },
  });

  return (
    <Card className="p-4">
      <h3 className="font-serif font-semibold mb-3 flex items-center gap-2">
        <Pill className="h-4 w-4 text-primary" /> Make a decision
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <ApproveDialog c={c} onSubmit={review.mutateAsync} pending={review.isPending} />
        <MoreInfoDialog c={c} onSubmit={review.mutateAsync} pending={review.isPending} />
        <ReferDialog c={c} onSubmit={review.mutateAsync} pending={review.isPending} />
        <RejectDialog c={c} onSubmit={review.mutateAsync} pending={review.isPending} />
      </div>
      {review.isError && (
        <p className="text-xs text-destructive mt-2">
          Could not save decision. Try again.
        </p>
      )}
      {c.pharmacistNote && (
        <div className="mt-3 p-3 rounded-md bg-muted/40 text-xs">
          <div className="font-semibold mb-1">Last pharmacist note</div>
          <p className="text-muted-foreground whitespace-pre-wrap">{c.pharmacistNote}</p>
        </div>
      )}
    </Card>
  );
}

type ReviewMutate = (vars: {
  id: string;
  data: {
    action: "approve" | "reject" | "more_info" | "refer";
    pharmacistNote?: string | null;
    prescription?: string | null;
    prescriptionItems?: PrescriptionItem[] | null;
    referralInfo?: string | null;
    rejectReason?: string | null;
    referRecipientType?: string | null;
    referRecipientName?: string | null;
    referUrgency?: string | null;
  };
}) => Promise<unknown>;

function ApproveDialog({
  c,
  onSubmit,
  pending,
}: {
  c: Consultation;
  onSubmit: ReviewMutate;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PrescriptionItem[]>(
    c.prescriptionItems ?? [
      { name: "", strength: "", form: "", quantity: "", sig: "", duration: "" },
    ],
  );
  const [note, setNote] = useState(c.pharmacistNote ?? "");

  const update = (i: number, k: keyof PrescriptionItem, v: string) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-approve">
          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve & prescribe</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div
              key={i}
              className="p-3 rounded-md border border-border space-y-2"
              data-testid={`rx-item-${i}`}
            >
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Medicine"
                  value={it.name}
                  onChange={(e) => update(i, "name", e.target.value)}
                />
                <Input
                  placeholder="Strength (e.g. 0.25mg)"
                  value={it.strength}
                  onChange={(e) => update(i, "strength", e.target.value)}
                />
                <Input
                  placeholder="Form (pen, tablet…)"
                  value={it.form}
                  onChange={(e) => update(i, "form", e.target.value)}
                />
                <Input
                  placeholder="Quantity"
                  value={it.quantity}
                  onChange={(e) => update(i, "quantity", e.target.value)}
                />
                <Input
                  placeholder="Duration (e.g. 4 weeks)"
                  value={it.duration}
                  onChange={(e) => update(i, "duration", e.target.value)}
                />
                <Input
                  placeholder="Sig (e.g. inject 0.25mg s/c weekly)"
                  value={it.sig}
                  onChange={(e) => update(i, "sig", e.target.value)}
                />
              </div>
              {items.length > 1 && (
                <button
                  onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove item
                </button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setItems([
                ...items,
                { name: "", strength: "", form: "", quantity: "", sig: "", duration: "" },
              ])
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Add item
          </Button>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pharmacist note (visible to patient)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Start at lowest dose. Review in 4 weeks."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={pending || items.some((i) => !i.name || !i.strength || !i.sig)}
            onClick={async () => {
              await onSubmit({
                id: c.id,
                data: {
                  action: "approve",
                  prescriptionItems: items,
                  pharmacistNote: note || null,
                },
              });
              setOpen(false);
            }}
            data-testid="button-confirm-approve"
          >
            Confirm prescription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoreInfoDialog({
  c,
  onSubmit,
  pending,
}: {
  c: Consultation;
  onSubmit: ReviewMutate;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-more-info">
          <HelpCircle className="h-4 w-4 mr-1" /> More info
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request more information</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="What do you need from the patient?"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || !text.trim()}
            onClick={async () => {
              await onSubmit({
                id: c.id,
                data: { action: "more_info", pharmacistNote: text.trim() },
              });
              setOpen(false);
            }}
          >
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReferDialog({
  c,
  onSubmit,
  pending,
}: {
  c: Consultation;
  onSubmit: ReviewMutate;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [recipient, setRecipient] = useState<string>("gp");
  const [name, setName] = useState("");
  const [urgency, setUrgency] = useState<string>("routine");
  const [info, setInfo] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-refer">
          <ExternalLink className="h-4 w-4 mr-1" /> Refer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refer onward</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Recipient type</label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFER_TYPES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.replace(/_/g, " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold">Recipient name</label>
            <Input
              placeholder="e.g. Dr A Patel / Same-day GP team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Urgency</label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["routine", "soon", "urgent", "emergency"].map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            placeholder="Referral context for the recipient and patient"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || !info.trim() || !name.trim()}
            onClick={async () => {
              await onSubmit({
                id: c.id,
                data: {
                  action: "refer",
                  referralInfo: info,
                  referRecipientType: recipient,
                  referRecipientName: name.trim(),
                  referUrgency: urgency,
                },
              });
              setOpen(false);
            }}
          >
            Send referral
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  c,
  onSubmit,
  pending,
}: {
  c: Consultation;
  onSubmit: ReviewMutate;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("medically_unsuitable");
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" data-testid="button-reject">
          <XCircle className="h-4 w-4 mr-1" /> Decline
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline consultation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REJECT_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Explain your decision to the patient (will be emailed)"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending || !note.trim()}
            onClick={async () => {
              await onSubmit({
                id: c.id,
                data: {
                  action: "reject",
                  rejectReason: reason,
                  pharmacistNote: note,
                },
              });
              setOpen(false);
            }}
          >
            Confirm decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── MESSAGES PANEL ──────────────────────────────────────────────────────────
function MessagesPanel({
  messages,
  draft,
  setDraft,
  onSend,
  sending,
}: {
  messages: {
    id: string;
    body: string;
    senderRole: string;
    senderName: string;
    createdAt: string;
  }[];
  draft: string;
  setDraft: (s: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <Card className="p-4">
      <h3 className="font-serif font-semibold mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" /> Message patient
      </h3>
      <div className="max-h-64 overflow-y-auto space-y-2 mb-3 pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            No messages yet.
          </p>
        )}
        {messages.map((m) => {
          const isPharm = m.senderRole === "pharmacist";
          return (
            <div
              key={m.id}
              className={cn(
                "p-2.5 rounded-md text-xs",
                isPharm
                  ? "bg-primary/10 ml-4"
                  : "bg-muted/60 mr-4",
              )}
              data-testid={`msg-${m.id}`}
            >
              <div className="font-semibold mb-0.5">{m.senderName}</div>
              <div className="whitespace-pre-wrap">{m.body}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {new Date(m.createdAt).toLocaleString("en-GB")}
              </div>
            </div>
          );
        })}
      </div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type a message to the patient…"
        rows={3}
        data-testid="input-message"
      />
      <Button
        size="sm"
        className="mt-2 w-full"
        onClick={onSend}
        disabled={sending || !draft.trim()}
        data-testid="button-send-message"
      >
        <Send className="h-4 w-4 mr-1" /> {sending ? "Sending…" : "Send"}
      </Button>
    </Card>
  );
}

// ── INTERACTIONS DIALOG ─────────────────────────────────────────────────────
function InteractionsDialog({
  c,
  open,
  onOpenChange,
}: {
  c: Consultation;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const meds = (c.currentMedications ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== "none");
  const allergies = (c.allergies ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== "none");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contraindication checker</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Current medications ({meds.length})
            </h4>
            {meds.length === 0 ? (
              <p className="text-sm text-muted-foreground">None on file.</p>
            ) : (
              <ul className="text-sm list-disc list-inside">
                {meds.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Allergies ({allergies.length})
            </h4>
            {allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">None on file.</p>
            ) : (
              <ul className="text-sm list-disc list-inside text-destructive">
                {allergies.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Always cross-reference proposed therapy against the BNF and Stockley's
            Drug Interactions before finalising your prescription.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── shared bits ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Consultation["status"] }) {
  const map: Record<Consultation["status"], string> = {
    pending: "bg-primary/15 text-primary",
    patient_responded: "bg-accent/30 text-accent-foreground",
    more_info_needed: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-destructive/15 text-destructive",
    referred: "bg-violet-100 text-violet-700",
    red_flag: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
        map[status],
      )}
      data-testid="text-status"
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

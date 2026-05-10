import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare, ExternalLink,
  Plus, FileText, Pill, RefreshCw, Ban, Download, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import ConsultationChat from "@/components/ConsultationChat";

interface Consultation {
  id: string;
  conditionName: string;
  status: string;
  patientName: string;
  createdAt: string;
  reviewedAt: string | null;
  pharmacistNote: string | null;
  prescription: string | null;
  referralInfo: string | null;
}

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; pillClass: string; description: string; icon: React.ReactNode;
}> = {
  pending: {
    label: "Under review",
    pillClass: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Your consultation is being reviewed by our pharmacist.",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  red_flag: {
    label: "Urgent review",
    pillClass: "bg-rose-100 text-rose-800 border-rose-200",
    description: "This consultation needs urgent clinical review.",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  approved: {
    label: "Approved",
    pillClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    description: "Your treatment has been approved.",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Not suitable",
    pillClass: "bg-rose-100 text-rose-800 border-rose-200",
    description: "This treatment isn't suitable for you right now.",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  more_info_needed: {
    label: "More info needed",
    pillClass: "bg-sky-100 text-sky-800 border-sky-200",
    description: "Your pharmacist has asked you a question.",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  referred: {
    label: "Referred",
    pillClass: "bg-violet-100 text-violet-800 border-violet-200",
    description: "You've been referred for further care.",
    icon: <ExternalLink className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    pillClass: "bg-gray-100 text-gray-600 border-gray-200",
    description: "This consultation was cancelled.",
    icon: <Ban className="w-3.5 h-3.5" />,
  },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.pillClass}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function ConsultationCard({
  consultation, index, onCancel, cancelling,
}: {
  consultation: Consultation;
  index: number;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const cfg = STATUS_CONFIG[consultation.status] ?? STATUS_CONFIG.pending;
  const placed = new Date(consultation.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const isPending = consultation.status === "pending" || consultation.status === "red_flag";
  const needsReply = consultation.status === "more_info_needed";
  const ref = consultation.id.toUpperCase().slice(0, 8);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-border/40 hover:shadow-md transition-shadow overflow-hidden"
      data-testid={`consult-card-${ref}`}
    >
      {/* Top meta row */}
      <div className="px-5 md:px-7 pt-6 pb-5 flex items-start justify-between gap-4 flex-wrap border-b border-border/40">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg md:text-xl font-extrabold text-secondary truncate">{consultation.conditionName}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-semibold uppercase tracking-wider">Placed</span> {placed}
            <span className="mx-2 text-border">·</span>
            <span className="font-semibold uppercase tracking-wider">Ref</span> {ref}
          </p>
        </div>
        <StatusPill status={consultation.status} />
      </div>

      {/* Body */}
      <div className="px-5 md:px-7 py-5 space-y-4">
        <p className="text-sm text-foreground/80 leading-relaxed">{cfg.description}</p>

        {consultation.pharmacistNote && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1">Pharmacist's note</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{consultation.pharmacistNote}</p>
          </div>
        )}

        {consultation.prescription && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="inline-flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-700" />
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Prescription issued</p>
              </div>
              <a
                href={`${(import.meta.env.BASE_URL as string).replace(/\/$/, "")}/api/consultations/${consultation.id}/prescription.pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
                data-testid={`button-download-pdf-${ref}`}
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{consultation.prescription}</p>
          </div>
        )}

        {consultation.referralInfo && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <ExternalLink className="w-4 h-4 text-violet-700" />
              <p className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Referral information</p>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{consultation.referralInfo}</p>
          </div>
        )}

        {!isPending && consultation.reviewedAt && (
          <p className="text-xs text-muted-foreground">
            Reviewed {new Date(consultation.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Action row */}
      {consultation.status !== "cancelled" && (
        <div className="px-5 md:px-7 pb-5 pt-4 border-t border-border/40 flex items-center justify-between gap-3 flex-wrap">
          {isPending ? (
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Our pharmacist is reviewing your case
            </div>
          ) : needsReply ? (
            <p className="text-xs font-semibold text-sky-700 inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Pharmacist is waiting for your reply
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Need to ask the pharmacist a question?</p>
          )}

          <div className="flex items-center gap-2">
            {isPending && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCancelConfirm(true)}
                className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold"
                data-testid={`button-cancel-${ref}`}
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" /> Cancel
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setChatOpen(o => !o)}
              className={`rounded-full font-bold ${
                needsReply
                  ? "bg-sky-600 hover:bg-sky-700 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
              data-testid={`button-chat-${ref}`}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              {chatOpen ? "Close conversation" : needsReply ? "Reply to pharmacist" : "Open conversation"}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-50 border-t border-rose-200 overflow-hidden"
          >
            <div className="px-5 md:px-7 py-4">
              <p className="text-sm font-semibold text-rose-800 mb-3">
                Cancel this consultation? This can't be undone.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full border-border bg-white font-semibold"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep it
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  disabled={cancelling === consultation.id}
                  onClick={() => onCancel(consultation.id)}
                  data-testid={`button-confirm-cancel-${ref}`}
                >
                  {cancelling === consultation.id ? "Cancelling…" : "Yes, cancel consultation"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat thread */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/40 bg-[#FAF7F2] overflow-hidden"
          >
            <div className="px-5 md:px-7 py-5">
              <ConsultationChat
                consultationId={consultation.id}
                audience="patient"
                onClose={() => setChatOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MyConsultations() {
  const [, navigate] = useLocation();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const token = localStorage.getItem("patient_token");

  useEffect(() => {
    if (!token) { navigate("/my-account/login"); return; }
    fetchConsultations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchConsultations() {
    setLoading(true);
    setError(null);
    try {
      const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");
      const res = await fetch(`${base}/api/patient/consultations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem("patient_token"); navigate("/my-account/login"); return; }
        throw new Error("Failed to load consultations");
      }
      const data = await res.json();
      setConsultations(data.consultations || []);
    } catch {
      setError("Unable to load your consultations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");
      const res = await fetch(`${base}/api/patient/consultations/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to cancel consultation"); return; }
      toast.success("Consultation cancelled.");
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: "cancelled" } : c));
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCancelling(null);
    }
  }

  const COMPLETED_STATUSES = ["approved", "rejected", "referred", "more_info_needed", "cancelled"];
  const PENDING_STATUSES = ["pending", "red_flag"];

  const filtered = consultations.filter(c => {
    if (filter === "pending") return PENDING_STATUSES.includes(c.status);
    if (filter === "completed") return COMPLETED_STATUSES.includes(c.status);
    return true;
  });

  const pendingCount = consultations.filter(c => PENDING_STATUSES.includes(c.status)).length;
  const completedCount = consultations.filter(c => COMPLETED_STATUSES.includes(c.status)).length;

  const FILTERS: Array<{ value: "all" | "pending" | "completed"; label: string; count: number }> = [
    { value: "all", label: "All", count: consultations.length },
    { value: "pending", label: "In review", count: pendingCount },
    { value: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F1EC]">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-5 md:px-6 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/account" className="hover:text-primary inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Your account
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">My consultations</span>
        </nav>

        {/* Heading */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-secondary">My consultations</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              Track your consultations, message your prescriber, and download issued prescriptions.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchConsultations}
            className="rounded-full text-muted-foreground hover:text-foreground font-semibold"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {FILTERS.map(f => (
            <div key={f.value} className="bg-white rounded-2xl border border-border/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{f.label}</p>
              <p className={`text-2xl font-bold mt-1 ${
                f.value === "pending" ? "text-amber-600" :
                f.value === "completed" ? "text-emerald-700" : "text-secondary"
              }`}>{f.count}</p>
            </div>
          ))}
        </div>

        {/* Filter pills + actions */}
        <div className="flex items-center gap-2 mt-8 flex-wrap">
          <div className="flex gap-1.5 bg-white rounded-full border border-border/40 p-1">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                data-testid={`filter-${f.value}`}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label} <span className="opacity-70">({f.count})</span>
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <Button
            asChild
            className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-sm"
            data-testid="button-new-consultation"
          >
            <Link href="/conditions"><Plus className="w-4 h-4 mr-1.5" /> New consultation</Link>
          </Button>
        </div>

        {/* List */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-border/40 p-6 animate-pulse">
                  <div className="h-5 bg-muted rounded-full w-48 mb-3" />
                  <div className="h-3 bg-muted rounded-full w-32 mb-5" />
                  <div className="h-3 bg-muted rounded-full w-full mb-2" />
                  <div className="h-3 bg-muted rounded-full w-3/4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-border/40 text-center py-16 px-6">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-rose-500" />
              </div>
              <p className="text-foreground/80 mb-4">{error}</p>
              <Button onClick={fetchConsultations} variant="outline" className="rounded-full">Try again</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border/60 text-center py-16 px-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-secondary text-lg mb-1">
                {filter === "all" ? "No consultations yet" : `No ${filter === "pending" ? "in-review" : "completed"} consultations`}
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                {filter === "all"
                  ? "Start your first consultation with one of our UK-registered pharmacists."
                  : `You don't have any ${filter === "pending" ? "in-review" : "completed"} consultations right now.`}
              </p>
              {filter === "all" && (
                <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                  <Link href="/conditions"><Plus className="w-4 h-4 mr-1.5" /> Start a consultation</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <ConsultationCard
                    key={c.id}
                    consultation={c}
                    index={i}
                    onCancel={handleCancel}
                    cancelling={cancelling}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Emergency banner */}
        <div className="mt-10 bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-900 text-sm">Medical emergency?</p>
            <p className="text-rose-800 text-sm mt-0.5">
              In an emergency, call <strong>999</strong>. For urgent advice, call <strong>NHS 111</strong> or visit{" "}
              <a href="https://111.nhs.uk" target="_blank" rel="noopener noreferrer" className="underline font-semibold">111.nhs.uk</a>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

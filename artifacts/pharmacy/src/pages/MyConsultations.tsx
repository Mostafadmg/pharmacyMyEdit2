import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare, ExternalLink,
  LogOut, Plus, ChevronRight, FileText, Pill, RefreshCw, User, Ban, Download,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; description: string }> = {
  pending: {
    label: "Under Review",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Clock className="w-4 h-4" />,
    description: "Your consultation is being reviewed by our pharmacist",
  },
  red_flag: {
    label: "Urgent Review",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "This consultation requires urgent clinical review",
  },
  approved: {
    label: "Approved",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: "Your treatment has been approved",
  },
  rejected: {
    label: "Not Suitable",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <XCircle className="w-4 h-4" />,
    description: "This treatment is not suitable at this time",
  },
  more_info_needed: {
    label: "More Info Needed",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "Our pharmacist has requested additional information",
  },
  referred: {
    label: "Referred",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: <ExternalLink className="w-4 h-4" />,
    description: "You have been referred for further care",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: <Ban className="w-4 h-4" />,
    description: "This consultation was cancelled",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ConsultationCard({
  consultation,
  index,
  onCancel,
  cancelling,
}: {
  consultation: Consultation;
  index: number;
  onCancel: (id: string) => void;
  cancelling: string | null;
}) {
  const cfg = STATUS_CONFIG[consultation.status] ?? STATUS_CONFIG.pending;
  const date = new Date(consultation.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const isPending = consultation.status === "pending" || consultation.status === "red_flag";
  const barColor = {
    approved: "bg-emerald-400",
    rejected: "bg-red-400",
    referred: "bg-purple-400",
    red_flag: "bg-red-500",
    more_info_needed: "bg-blue-400",
    cancelled: "bg-gray-300",
  }[consultation.status] ?? "bg-amber-400";

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      <div className={`h-1.5 w-full ${barColor}`} />

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base truncate">{consultation.conditionName}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{date} · Ref: {consultation.id.toUpperCase().slice(0, 8)}</p>
          </div>
          <StatusBadge status={consultation.status} />
        </div>

        <p className="text-gray-600 text-sm mb-4">{cfg.description}</p>

        {consultation.pharmacistNote && (
          <div className="bg-[#0A7EA4]/5 border border-[#0A7EA4]/20 rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-[#0A7EA4] mb-1 uppercase tracking-wide">Pharmacist's Note</p>
            <p className="text-gray-700 text-sm leading-relaxed">{consultation.pharmacistNote}</p>
          </div>
        )}

        {consultation.prescription && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Prescription Issued</p>
              </div>
              <a
                href={`${(import.meta.env.BASE_URL as string).replace(/\/$/, "")}/api/consultations/${consultation.id}/prescription.pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-sm"
              >
                <Download className="w-3 h-3" />
                Download PDF
              </a>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{consultation.prescription}</p>
          </div>
        )}

        {consultation.referralInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Referral Information</p>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{consultation.referralInfo}</p>
          </div>
        )}

        {isPending && !showCancelConfirm && (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-gray-500">Our pharmacist is reviewing your case</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        )}

        {isPending && showCancelConfirm && (
          <div className="pt-3 border-t border-red-100 bg-red-50 -mx-6 -mb-6 px-6 pb-5 mt-4 rounded-b-2xl">
            <p className="text-sm font-semibold text-red-700 mb-3">
              Are you sure you want to cancel this consultation? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full border-gray-300 text-gray-600 font-semibold"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep it
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                disabled={cancelling === consultation.id}
                onClick={() => onCancel(consultation.id)}
              >
                {cancelling === consultation.id ? (
                  <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Cancelling...</span>
                ) : (
                  "Yes, Cancel Consultation"
                )}
              </Button>
            </div>
          </div>
        )}

        {!isPending && consultation.reviewedAt && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Reviewed {new Date(consultation.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}

        {consultation.status !== "cancelled" && (
          <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {consultation.status === "more_info_needed"
                ? "Pharmacist is waiting for your reply."
                : "Need to ask the pharmacist a question?"}
            </p>
            <Button
              type="button"
              size="sm"
              variant={consultation.status === "more_info_needed" ? "default" : "outline"}
              onClick={() => setChatOpen(o => !o)}
              className={`rounded-full text-xs font-bold ${consultation.status === "more_info_needed" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              {chatOpen ? "Close conversation" : "Open conversation"}
            </Button>
          </div>
        )}

        {chatOpen && (
          <div className="mt-4">
            <ConsultationChat
              consultationId={consultation.id}
              audience="patient"
              onClose={() => setChatOpen(false)}
            />
          </div>
        )}

        {consultation.status === "cancelled" && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">This consultation was cancelled and will not be processed.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MyConsultations() {
  const [, navigate] = useLocation();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const patientName = localStorage.getItem("patient_name") || "Patient";
  const patientEmail = localStorage.getItem("patient_email") || "";
  const token = localStorage.getItem("patient_token");

  useEffect(() => {
    if (!token) { navigate("/my-account/login"); return; }
    fetchConsultations();
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
      toast.success("Consultation cancelled successfully.");
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: "cancelled" } : c));
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCancelling(null);
    }
  }

  const handleLogout = () => {
    ["patient_token", "patient_name", "patient_email", "patient_id",
      "patient_dob", "patient_sex", "patient_address1", "patient_address2",
      "patient_city", "patient_postcode"].forEach(k => localStorage.removeItem(k));
    navigate("/");
  };

  const COMPLETED_STATUSES = ["approved", "rejected", "referred", "more_info_needed", "cancelled"];
  const PENDING_STATUSES = ["pending", "red_flag"];

  const filtered = consultations.filter(c => {
    if (filter === "pending") return PENDING_STATUSES.includes(c.status);
    if (filter === "completed") return COMPLETED_STATUSES.includes(c.status);
    return true;
  });

  const pendingCount = consultations.filter(c => PENDING_STATUSES.includes(c.status)).length;
  const completedCount = consultations.filter(c => COMPLETED_STATUSES.includes(c.status)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-[#0F3460] to-[#0A7EA4] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
                <User className="w-4 h-4" />
                <span>{patientEmail}</span>
              </div>
              <h1 className="text-3xl font-extrabold mb-2">Hello, {patientName.split(" ")[0]}</h1>
              <p className="text-white/70 text-base">Track all your consultations and prescription outcomes here.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={fetchConsultations} variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full gap-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>

          {!loading && (
            <div className="flex gap-4 mt-8">
              {[
                { value: consultations.length, label: "Total" },
                { value: pendingCount, label: "In review" },
                { value: completedCount, label: "Completed" },
              ].map(item => (
                <div key={item.label} className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-center">
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-white/60 text-xs mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${filter === f ? "bg-[#0F3460] text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}
            >
              {f === "all" ? `All (${consultations.length})` : f === "pending" ? `In Review (${pendingCount})` : `Completed (${completedCount})`}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex gap-2">
            <Link href="/contact">
              <Button size="sm" variant="outline" className="text-[#0F3460] border-[#0F3460]/30 font-semibold rounded-full gap-1.5 hover:bg-[#0F3460]/5">
                <MessageSquare className="w-3.5 h-3.5" /> Contact Us
              </Button>
            </Link>
            <Link href="/conditions">
              <Button size="sm" className="bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0F3460] font-semibold rounded-full gap-1.5 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> New Consultation
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded-full w-48 mb-3" />
                <div className="h-3 bg-gray-100 rounded-full w-32 mb-4" />
                <div className="h-3 bg-gray-100 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchConsultations} variant="outline" className="rounded-full">Try again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">
              {filter === "all" ? "No consultations yet" : `No ${filter} consultations`}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {filter === "all" ? "Start your first online consultation with our pharmacist." : `You don't have any ${filter} consultations.`}
            </p>
            {filter === "all" && (
              <Link href="/conditions">
                <Button className="bg-[#0F3460] hover:bg-[#0F3460]/90 text-white rounded-full gap-1.5">
                  <Plus className="w-4 h-4" /> Start a Consultation
                </Button>
              </Link>
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

        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm mb-1">Medical Emergency?</p>
              <p className="text-amber-700 text-sm">
                If you're experiencing a medical emergency, call <strong>999</strong> immediately. For urgent advice, call <strong>NHS 111</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

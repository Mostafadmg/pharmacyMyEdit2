import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare, ExternalLink,
  LogOut, Plus, ChevronRight, FileText, Pill, RefreshCw, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

function ConsultationCard({ consultation, index }: { consultation: Consultation; index: number }) {
  const cfg = STATUS_CONFIG[consultation.status] ?? STATUS_CONFIG.pending;
  const date = new Date(consultation.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      {/* Status bar */}
      <div className={`h-1.5 w-full ${consultation.status === "approved" ? "bg-emerald-400" : consultation.status === "rejected" ? "bg-red-400" : consultation.status === "referred" ? "bg-purple-400" : consultation.status === "red_flag" ? "bg-red-500" : consultation.status === "more_info_needed" ? "bg-blue-400" : "bg-amber-400"}`} />

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
            <div className="flex items-center gap-1.5 mb-1">
              <Pill className="w-3.5 h-3.5 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Prescription Issued</p>
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

        {consultation.status === "pending" || consultation.status === "red_flag" ? (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-gray-500">Our pharmacist is reviewing your case</span>
            </div>
          </div>
        ) : consultation.reviewedAt ? (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Reviewed {new Date(consultation.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        ) : null}
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

  const patientName = localStorage.getItem("patient_name") || "Patient";
  const patientEmail = localStorage.getItem("patient_email") || "";
  const token = localStorage.getItem("patient_token");

  useEffect(() => {
    if (!token) {
      navigate("/my-account/login");
      return;
    }
    fetchConsultations();
  }, [token]);

  async function fetchConsultations() {
    setLoading(true);
    setError(null);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/patient/consultations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("patient_token");
          navigate("/my-account/login");
          return;
        }
        throw new Error("Failed to load consultations");
      }
      const data = await res.json();
      setConsultations(data.consultations || []);
    } catch (err) {
      setError("Unable to load your consultations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    ["patient_token", "patient_name", "patient_email", "patient_id"].forEach(k => localStorage.removeItem(k));
    navigate("/");
  };

  const COMPLETED_STATUSES = ["approved", "rejected", "referred", "more_info_needed"];
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

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0F3460] to-[#0A7EA4] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
                <User className="w-4 h-4" />
                <span>{patientEmail}</span>
              </div>
              <h1 className="text-3xl font-extrabold mb-2">
                Hello, {patientName.split(" ")[0]} 👋
              </h1>
              <p className="text-white/70 text-base">
                Track all your consultations and prescription outcomes here.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={fetchConsultations}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          {!loading && (
            <div className="flex gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-center">
                <div className="text-2xl font-bold">{consultations.length}</div>
                <div className="text-white/60 text-xs mt-0.5">Total</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-center">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-white/60 text-xs mt-0.5">In review</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-center">
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-white/60 text-xs mt-0.5">Completed</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === f
                  ? "bg-[#0F3460] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {f === "all" ? `All (${consultations.length})` : f === "pending" ? `In Review (${pendingCount})` : `Completed (${completedCount})`}
            </button>
          ))}
          <div className="flex-1" />
          <Link href="/conditions">
            <Button size="sm" className="bg-[#E8B84B] hover:bg-[#E8B84B]/90 text-[#0F3460] font-semibold rounded-full gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              New Consultation
            </Button>
          </Link>
        </div>

        {/* Content */}
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
              {filter === "all"
                ? "Start your first online consultation with our pharmacist."
                : `You don't have any ${filter} consultations.`}
            </p>
            {filter === "all" && (
              <Link href="/conditions">
                <Button className="bg-[#0F3460] hover:bg-[#0F3460]/90 text-white rounded-full gap-1.5">
                  <Plus className="w-4 h-4" />
                  Start a Consultation
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((c, i) => (
                <ConsultationCard key={c.id} consultation={c} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Important notice */}
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

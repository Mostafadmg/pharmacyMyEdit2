import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare, ExternalLink,
  Plus, FileText, Pill, RefreshCw, Ban, ChevronDown, ChevronLeft, Download,
  Stethoscope, CalendarDays, CircleAlert, ClipboardList, HelpCircle,
} from "lucide-react";
import PatientDocumentViewer from "@/components/PatientDocumentViewer";
import DocumentRequirementsModal from "@/components/DocumentRequirementsModal";
import { ConsultationAnswersModal } from "@/components/consultation/ConsultationAnswersModal";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { prescriptionPdfUrl } from "@/lib/prescriptionPdf";
import { shortConditionName, displayConsultationNumber } from "@/lib/patientOrderContext";
import { InlineDocumentUploadButton } from "@/components/consultation/InlineDocumentUpload";
import { cn } from "@/lib/utils";
import { getSlotMeta, isEvidenceSlotId } from "@workspace/evidence-slots";
import {
  buildConsultationDocumentFocusPath,
  parseConsultationDocumentFocus,
  patientDocSlotElementId,
} from "@/lib/consultationDocumentFocus";

type DocumentSlotStatus = "required" | "uploaded" | "verified" | "rejected";

type DocumentSlot = {
  docId: string;
  docTitle: string;
  status: DocumentSlotStatus;
  uploadedAt?: string;
  uploadCount?: number;
  rejectionNote?: string;
  uploadPath: string;
  uploadUrl: string;
  pharmacistUploadRequested?: boolean;
};

type DocumentAction = {
  docId: string;
  docTitle: string;
  rejectionNote?: string;
  uploadPath: string;
  uploadUrl: string;
};

interface Consultation {
  id: string;
  consultationNumber?: string | null;
  conditionId?: string;
  conditionName: string;
  answers?: Record<string, unknown>;
  status: string;
  patientName: string;
  createdAt: string;
  reviewedAt: string | null;
  pharmacistNote: string | null;
  prescription: string | null;
  referralInfo: string | null;
  documentSlots?: DocumentSlot[];
  documentActions?: DocumentAction[];
  documentsNeedAttention?: boolean;
  pharmacistUploadRequested?: boolean;
  requiresPatientReply?: boolean;
}

function actionToSlot(a: DocumentAction): DocumentSlot {
  return {
    ...a,
    status: (a.rejectionNote?.startsWith("Required")
      ? "required"
      : "rejected") as DocumentSlotStatus,
  };
}

function resolveDocumentSlots(c: Consultation): DocumentSlot[] {
  if (c.documentSlots?.length) return c.documentSlots;
  return (c.documentActions ?? []).map(actionToSlot);
}

/** Red alert on order row when any slot needs upload (required / rejected). */
function needsDocumentAction(c: Consultation): boolean {
  const slots = resolveDocumentSlots(c);
  // When we know the actual slots, trust them: the server `documentsNeedAttention`
  // flag can lag behind a fresh upload, so it must not keep the alert sticky once
  // everything has been uploaded.
  if (slots.length > 0) {
    return slots.some(
      (s) => s.status === "required" || s.status === "rejected",
    );
  }
  return Boolean(c.documentsNeedAttention);
}

/** Internal RX notes (holds, tag sync) — not shown to patients; they see Messages instead. */
function isPatientVisiblePharmacistNote(
  note: string | null | undefined,
): note is string {
  if (!note?.trim()) return false;
  const t = note.trim();
  if (/^\[(CS_HOLD|PRESCRIBER_HOLD|HOLD)\]/i.test(t)) return false;
  if (/tags applied:/i.test(t)) return false;
  return true;
}

function mergeDocumentSlotLists(
  previous: DocumentSlot[] | undefined,
  incoming: DocumentSlot[] | undefined,
  previousConsultation: Consultation,
  incomingConsultation: Consultation,
): DocumentSlot[] {
  const prev = previous?.length
    ? previous
    : resolveDocumentSlots(previousConsultation);
  const next = incoming?.length
    ? incoming
    : resolveDocumentSlots(incomingConsultation);
  const byId = new Map<string, DocumentSlot>();
  for (const slot of next) byId.set(slot.docId, slot);
  for (const slot of prev) {
    const fresh = byId.get(slot.docId);
    if (!fresh) {
      byId.set(slot.docId, slot);
      continue;
    }
    if (fresh.status === "rejected") {
      continue;
    }
    if (fresh.status === "required") {
      const recentUpload =
        slot.status === "uploaded" &&
        slot.uploadedAt &&
        Date.now() - new Date(slot.uploadedAt).getTime() < 120_000;
      if (recentUpload) {
        byId.set(slot.docId, {
          ...fresh,
          ...slot,
          status: "uploaded",
          uploadedAt: slot.uploadedAt ?? fresh.uploadedAt,
        });
      }
      continue;
    }
    if (slot.status === "verified" && fresh.status !== "rejected") {
      byId.set(slot.docId, { ...slot, ...fresh, status: "verified" });
    }
  }
  return Array.from(byId.values());
}

function slotDisplayTitle(docId: string, fallback?: string): string {
  return isEvidenceSlotId(docId) ? getSlotMeta(docId).title : (fallback ?? docId);
}

function buildUploadedSlot(
  consultationId: string,
  docId: string,
  existing?: DocumentSlot,
): DocumentSlot {
  const title = slotDisplayTitle(docId, existing?.docTitle);
  const uploadPath =
    existing?.uploadPath ??
    buildConsultationDocumentFocusPath(consultationId, docId);
  return {
    docId,
    docTitle: title,
    status: "uploaded",
    uploadedAt: new Date().toISOString(),
    uploadPath,
    uploadUrl: existing?.uploadUrl ?? "",
  };
}

function formatUploadTime(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatConsultationPlacedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DocumentStatusBadge({ status }: { status: DocumentSlotStatus }) {
  if (status === "required") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Required
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-destructive">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Rejected
      </span>
    );
  }
  if (status === "uploaded") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
        Uploaded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      Verified
    </span>
  );
}

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; pillClass: string; description: string; icon: React.ReactNode;
}> = {
  pending: {
    label: "Under review",
    pillClass: "bg-accent text-primary border-accent",
    description: "Your consultation is being reviewed by our pharmacist.",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  red_flag: {
    label: "Urgent review",
    pillClass: "bg-destructive/10 text-destructive border-destructive/20",
    description: "This consultation needs urgent clinical review.",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  approved: {
    label: "Approved",
    pillClass: "bg-primary text-primary-foreground border-primary",
    description: "Your treatment has been approved.",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Not suitable",
    pillClass: "bg-destructive/10 text-destructive border-destructive/20",
    description: "This treatment isn't suitable for you right now.",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  more_info_needed: {
    label: "More info needed",
    pillClass: "bg-primary/10 text-primary border-primary/20",
    description: "Your pharmacist has asked you a question or needs a new document.",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  patient_responded: {
    label: "Update sent",
    pillClass: "bg-primary/10 text-primary border-primary/20",
    description: "We received your reply and will review it shortly.",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
  },
  referred: {
    label: "Referred",
    pillClass: "bg-muted text-foreground border-border",
    description: "You've been referred for further care.",
    icon: <ExternalLink className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    pillClass: "bg-muted text-muted-foreground border-border",
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

// ── Status accent map (icon tile; left bar is always primary) ────────────────
const STATUS_ACCENT: Record<string, { tile: string; tileText: string }> = {
  pending:           { tile: "bg-accent",         tileText: "text-primary" },
  red_flag:          { tile: "bg-destructive/10", tileText: "text-destructive" },
  approved:          { tile: "bg-primary/10",     tileText: "text-primary" },
  rejected:          { tile: "bg-destructive/10", tileText: "text-destructive" },
  more_info_needed:  { tile: "bg-primary/10",     tileText: "text-primary" },
  patient_responded: { tile: "bg-primary/10",     tileText: "text-primary" },
  referred:          { tile: "bg-muted",            tileText: "text-foreground" },
  cancelled:         { tile: "bg-muted",          tileText: "text-muted-foreground" },
};

// ── Collapsible row ──────────────────────────────────────────────────────────
function ConsultationRow({
  consultation, index, onCancel, cancelling, defaultOpen, focusSlot, onDocumentsChanged, onDocumentUploaded,
}: {
  consultation: Consultation;
  index: number;
  onCancel: (id: string) => void;
  cancelling: string | null;
  defaultOpen?: boolean;
  focusSlot?: string;
  onDocumentsChanged: () => void;
  onDocumentUploaded: (consultationId: string, docId: string) => void;
}) {
  const placedAt = formatConsultationPlacedAt(consultation.createdAt);
  const requiresPatientReply =
    consultation.requiresPatientReply ??
    consultation.status === "more_info_needed";
  const documentSlots = resolveDocumentSlots(consultation);
  const documentsNeedAttention = needsDocumentAction(consultation);
  const needsReply =
    requiresPatientReply ||
    (consultation.documentActions?.length ?? 0) > 0;
  // Once the patient has uploaded everything and has no outstanding question,
  // the order is back with the pharmacist — show it as "Under review" rather
  // than "Update sent" / "More info needed".
  const awaitingPatient = documentsNeedAttention || requiresPatientReply;
  const effectiveStatus =
    (consultation.status === "patient_responded" ||
      consultation.status === "more_info_needed") &&
    !awaitingPatient
      ? "pending"
      : consultation.status;
  const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.pending;
  const accent = STATUS_ACCENT[effectiveStatus] ?? STATUS_ACCENT.pending;
  const isPending =
    effectiveStatus === "pending" || effectiveStatus === "red_flag";
  const patientPharmacistNote = isPatientVisiblePharmacistNote(
    consultation.pharmacistNote,
  )
    ? consultation.pharmacistNote
    : null;
  const showPharmacistNote =
    Boolean(patientPharmacistNote) && !documentsNeedAttention;
  const showMessagesUploadHint =
    consultation.pharmacistUploadRequested ??
    documentSlots.some((d) => d.pharmacistUploadRequested);
  const showReviewedDate =
    !isPending && !documentsNeedAttention && Boolean(consultation.reviewedAt);
  const hasUpdate = !!(
    consultation.prescription ||
    patientPharmacistNote ||
    consultation.referralInfo
  );
  const orderNumber = displayConsultationNumber(
    consultation.consultationNumber,
    consultation.id,
  );

  const [open, setOpen] = useState(
    !!defaultOpen || !!focusSlot || documentsNeedAttention || needsReply,
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{
    docId: string;
    docTitle: string;
  } | null>(null);
  const [rulesDocId, setRulesDocId] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!focusSlot || !open) return;
    const id = patientDocSlotElementId(focusSlot);
    const scrollToSlot = () => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };
    const t0 = window.setTimeout(scrollToSlot, 120);
    const t1 = window.setTimeout(scrollToSlot, 450);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [focusSlot, open]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="relative bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      data-testid={`consult-card-${orderNumber}`}
    >
      {/* Notification-style header (expand on title row; View answers is separate) */}
      <div className="relative z-0 flex w-full items-stretch gap-0 group">
        <span className="w-1.5 shrink-0 bg-primary" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="relative flex min-w-0 flex-1 items-center gap-4 px-4 py-5 text-left md:px-6"
          data-testid={`consult-toggle-${orderNumber}`}
        >
          <div
            className={`hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent.tile} ${accent.tileText}`}
          >
            <Stethoscope className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-extrabold text-secondary md:text-lg">
                {shortConditionName(consultation.conditionName)}
              </h3>
              {documentsNeedAttention && (
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/25"
                  title="Documents required or rejected"
                  aria-label="Documents need your attention"
                >
                  <CircleAlert className="h-4 w-4 text-destructive" />
                </span>
              )}
              {hasUpdate && !open && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Update
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                Order placed {placedAt}
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span
                className="font-mono text-xs font-semibold text-primary"
                title="Your order reference number"
              >
                Order {orderNumber}
              </span>
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2 px-3 py-5 sm:gap-3 md:pr-6">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="hidden rounded-lg border-primary/25 bg-primary/5 font-semibold text-primary hover:bg-primary/10 sm:inline-flex"
            data-testid={`button-view-answers-${orderNumber}`}
            onClick={() => setShowAnswers(true)}
          >
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
            View answers
          </Button>
          <StatusPill status={effectiveStatus} />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Collapse consultation details" : "Expand consultation details"}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/40"
          >
            <div className="px-5 md:px-7 py-6 space-y-6">
              <p className="text-sm text-foreground/85 leading-relaxed">{cfg.description}</p>

              <div className="sm:hidden">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full rounded-lg border-primary/25 bg-primary/5 font-semibold text-primary hover:bg-primary/10"
                  data-testid={`button-view-answers-mobile-${orderNumber}`}
                  onClick={() => setShowAnswers(true)}
                >
                  <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                  View your consultation answers
                </Button>
              </div>

              {documentSlots.length > 0 && (
                <section>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Your documents
                  </h4>
                  <div className="space-y-3">
                    {documentSlots.map((doc) => {
                      const uploadedLabel = formatUploadTime(doc.uploadedAt);
                      const title = slotDisplayTitle(doc.docId, doc.docTitle);
                      const needsAction =
                        doc.status === "required" || doc.status === "rejected";
                      const canView =
                        !needsAction &&
                        (doc.status === "uploaded" || doc.status === "verified");
                      const isFocused = focusSlot === doc.docId;
                      return (
                        <div
                          key={doc.docId}
                          id={patientDocSlotElementId(doc.docId)}
                          className={cn(
                            "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between",
                            needsAction &&
                              "border-amber-300/90 bg-amber-50 shadow-sm",
                            doc.status === "uploaded" &&
                              "border-emerald-200/80 bg-emerald-50/45",
                            doc.status === "verified" &&
                              "border-primary/25 bg-primary/5",
                            !needsAction &&
                              doc.status !== "uploaded" &&
                              doc.status !== "verified" &&
                              "border-border bg-muted/20",
                            isFocused && "ring-2 ring-amber-400/80 ring-offset-2",
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <DocumentStatusBadge status={doc.status} />
                              <span className="text-sm font-semibold text-foreground">
                                {title}
                              </span>
                            </div>
                            {doc.status === "rejected" && doc.rejectionNote ? (
                              <p className="text-sm leading-relaxed text-destructive/90">
                                {doc.rejectionNote}
                              </p>
                            ) : null}
                            {doc.status === "rejected" ? (
                              <p className="text-xs text-muted-foreground">
                                Please upload a new file and check{" "}
                                <Link
                                  href="/my-messages"
                                  className="font-semibold text-primary hover:underline"
                                >
                                  Messages
                                </Link>{" "}
                                in the prescriber portal.
                              </p>
                            ) : null}
                            {doc.status === "required" ? (
                              <p className="text-xs text-muted-foreground">
                                Required — please upload when you can.
                              </p>
                            ) : null}
                            {needsAction ? (
                              <button
                                type="button"
                                onClick={() => setRulesDocId(doc.docId)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:text-violet-900 hover:underline"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                                See eligible documents &amp; what&apos;s required
                              </button>
                            ) : null}
                            {doc.status === "uploaded" ? (
                              <p className="text-xs text-muted-foreground">
                                Uploaded — your pharmacist will review it shortly.
                                {(doc.uploadCount ?? 0) > 1
                                  ? ` (${doc.uploadCount} files`
                                  : uploadedLabel
                                    ? ` (${uploadedLabel}`
                                    : ""}
                                {(doc.uploadCount ?? 0) > 1 || uploadedLabel ? ")" : ""}
                                {uploadedLabel && (doc.uploadCount ?? 0) > 1
                                  ? ` · latest ${uploadedLabel}`
                                  : ""}
                              </p>
                            ) : null}
                            {doc.status === "verified" ? (
                              <p className="text-xs text-muted-foreground">
                                Verified by your pharmacist.
                                {uploadedLabel ? ` Uploaded ${uploadedLabel}.` : ""}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                          {canView ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-lg font-semibold"
                              onClick={() =>
                                setViewingDoc({
                                  docId: doc.docId,
                                  docTitle: title,
                                })
                              }
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              View upload
                            </Button>
                          ) : null}
                          {(doc.status === "required" ||
                            doc.status === "rejected" ||
                            doc.status === "uploaded" ||
                            doc.status === "verified") && (
                            <InlineDocumentUploadButton
                              consultationId={consultation.id}
                              docId={doc.docId}
                              label={
                                doc.status === "rejected"
                                  ? "Upload again"
                                  : doc.status === "required"
                                    ? "Upload now"
                                    : "Upload another"
                              }
                              onSuccess={() => {
                                onDocumentUploaded(consultation.id, doc.docId);
                                onDocumentsChanged();
                              }}
                            />
                          )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {showMessagesUploadHint ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      You can also attach files in{" "}
                      <Link
                        href="/my-messages"
                        className="font-semibold text-primary hover:underline"
                      >
                        Messages
                      </Link>
                      .
                    </p>
                  ) : null}
                </section>
              )}

              {showPharmacistNote && (
                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pharmacist&apos;s note
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {patientPharmacistNote}
                  </p>
                </section>
              )}

              {consultation.prescription && (
                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Pill className="h-4 w-4 text-primary" />
                      Prescription issued
                    </h4>
                    <a
                      href={prescriptionPdfUrl(consultation.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors shadow-sm"
                      data-testid={`button-download-pdf-${orderNumber}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </a>
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {consultation.prescription}
                  </p>
                </section>
              )}

              {consultation.referralInfo && (
                <section>
                  <h4 className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    Referral information
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {consultation.referralInfo}
                  </p>
                </section>
              )}

              {showReviewedDate && consultation.reviewedAt && (
                <p className="text-xs text-muted-foreground">
                  Reviewed {new Date(consultation.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}

              {/* Action row */}
              {consultation.status !== "cancelled" && (
                <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3 flex-wrap">
                  {isPending ? (
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Our pharmacist is reviewing your case
                    </div>
                  ) : requiresPatientReply ? (
                    <p className="text-xs font-semibold text-primary inline-flex items-center gap-1.5">
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
                        className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
                        data-testid={`button-cancel-${orderNumber}`}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1.5" /> Cancel
                      </Button>
                    )}
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full font-bold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid={`button-chat-${orderNumber}`}
                    >
                      <Link
                        href={`/my-messages?consultation=${encodeURIComponent(consultation.id)}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        {requiresPatientReply ? "Reply in messages" : "Message pharmacy team"}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Cancel confirm */}
            <AnimatePresence>
              {showCancelConfirm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-destructive/10 border-t border-destructive/20 overflow-hidden"
                >
                  <div className="px-5 md:px-7 py-4">
                    <p className="text-sm font-semibold text-destructive mb-3">
                      Cancel this consultation? This can't be undone.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-border bg-white font-semibold"
                        onClick={() => setShowCancelConfirm(false)}
                      >
                        Keep it
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold shadow-sm"
                        disabled={cancelling === consultation.id}
                        onClick={() => onCancel(consultation.id)}
                        data-testid={`button-confirm-cancel-${orderNumber}`}
                      >
                        {cancelling === consultation.id ? "Cancelling…" : "Yes, cancel consultation"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.section>
        )}
      </AnimatePresence>

      {viewingDoc ? (
        <PatientDocumentViewer
          consultationId={consultation.id}
          docId={viewingDoc.docId}
          docTitle={viewingDoc.docTitle}
          open={!!viewingDoc}
          onOpenChange={(next) => {
            if (!next) setViewingDoc(null);
          }}
        />
      ) : null}

      {rulesDocId ? (
        <DocumentRequirementsModal
          docId={rulesDocId}
          open={!!rulesDocId}
          onOpenChange={(next) => {
            if (!next) setRulesDocId(null);
          }}
        />
      ) : null}

      <ConsultationAnswersModal
        consultationId={consultation.id}
        conditionName={shortConditionName(consultation.conditionName)}
        conditionId={consultation.conditionId}
        initialAnswers={consultation.answers}
        open={showAnswers}
        onOpenChange={setShowAnswers}
      />
    </motion.article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MyConsultations() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const urlFocus = useMemo(
    () => parseConsultationDocumentFocus(search),
    [search],
  );
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const token = localStorage.getItem("patient_token");

  useEffect(() => {
    if (urlFocus.consultationId) setFilter("all");
  }, [urlFocus.consultationId]);

  useEffect(() => {
    if (!urlFocus.consultationId || !urlFocus.focusSlot || loading) return;
    const id = patientDocSlotElementId(urlFocus.focusSlot);
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 500);
    return () => window.clearTimeout(t);
  }, [urlFocus, loading, consultations]);

  useEffect(() => {
    if (!token) { navigate("/my-account/login"); return; }
    fetchConsultations();
    const onFocus = () => void fetchConsultations({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchConsultations(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await apiFetch<{ consultations: Consultation[] }>(
        "/api/patient/consultations",
        { auth: "patient" },
      );
      setConsultations((prev) => {
        const incoming = data.consultations || [];
        if (prev.length === 0) return incoming;
        return incoming.map((c) => {
          const old = prev.find((o) => o.id === c.id);
          if (!old) return c;
          const documentSlots = mergeDocumentSlotLists(
            old.documentSlots,
            c.documentSlots,
            old,
            c,
          );
          return {
            ...c,
            documentSlots,
            documentsNeedAttention: needsDocumentAction({
              ...c,
              documentSlots,
            }),
          };
        });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("patient_token");
        navigate("/my-account/login");
        return;
      }
      if (!options?.silent) {
        setError("Unable to load your consultations. Please try again.");
      } else {
        toast.error("Could not refresh your documents. Please try again.");
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      await apiFetch(`/api/patient/consultations/${id}/cancel`, {
        method: "POST",
        auth: "patient",
      });
      toast.success("Consultation cancelled.");
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "cancelled" } : c)),
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setCancelling(null);
    }
  }

  function handleDocumentUploaded(consultationId: string, docId: string) {
    setConsultations((prev) =>
      prev.map((c) => {
        if (c.id !== consultationId) return c;
        const slots = resolveDocumentSlots(c);
        const existing = slots.find((s) => s.docId === docId);
        const nextSlots = existing
          ? slots.map((s) =>
              s.docId === docId
                ? {
                    ...s,
                    status: "uploaded" as DocumentSlotStatus,
                    uploadedAt: new Date().toISOString(),
                  }
                : s,
            )
          : [...slots, buildUploadedSlot(consultationId, docId)];
        return {
          ...c,
          documentSlots: nextSlots,
          documentsNeedAttention: needsDocumentAction({
            ...c,
            documentSlots: nextSlots,
          }),
        };
      }),
    );
  }

  const COMPLETED_STATUSES = [
    "approved",
    "rejected",
    "referred",
    "more_info_needed",
    "patient_responded",
    "cancelled",
  ];
  const PENDING_STATUSES = ["pending", "red_flag"];

  const filtered = consultations.filter((c) => {
    const needsAction = needsDocumentAction(c);
    if (filter === "pending") {
      return PENDING_STATUSES.includes(c.status) || needsAction;
    }
    if (filter === "completed") {
      return COMPLETED_STATUSES.includes(c.status) && !needsAction;
    }
    return true;
  });

  const pendingCount = consultations.filter(
    (c) => PENDING_STATUSES.includes(c.status) || needsDocumentAction(c),
  ).length;
  const completedCount = consultations.filter(c => COMPLETED_STATUSES.includes(c.status)).length;

  const FILTERS: Array<{ value: "all" | "pending" | "completed"; label: string; count: number }> = [
    { value: "all", label: "All", count: consultations.length },
    { value: "pending", label: "In review", count: pendingCount },
    { value: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
            onClick={() => void fetchConsultations()}
            className="rounded-lg text-muted-foreground hover:text-foreground font-semibold"
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
                f.value === "completed" ? "text-primary" : "text-secondary"
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
            className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm h-10 px-5"
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
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-destructive" />
              </div>
              <p className="text-foreground/80 mb-4">{error}</p>
              <Button onClick={() => void fetchConsultations()} variant="outline" className="rounded-lg">Try again</Button>
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
                <Button asChild className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-5">
                  <Link href="/conditions"><Plus className="w-4 h-4 mr-1.5" /> Start a consultation</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <ConsultationRow
                    key={c.id}
                    consultation={c}
                    index={i}
                    onCancel={handleCancel}
                    cancelling={cancelling}
                    defaultOpen={c.id === urlFocus.consultationId}
                    focusSlot={
                      c.id === urlFocus.consultationId
                        ? urlFocus.focusSlot
                        : undefined
                    }
                    onDocumentsChanged={() => void fetchConsultations({ silent: true })}
                    onDocumentUploaded={handleDocumentUploaded}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

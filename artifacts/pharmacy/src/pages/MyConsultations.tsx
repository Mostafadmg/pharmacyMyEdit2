import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare, ExternalLink,
  Plus, FileText, Pill, RefreshCw, Ban, Download, ChevronLeft, ChevronDown,
  Stethoscope, CalendarDays, CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { shortConditionName } from "@/lib/patientOrderContext";
import { InlineDocumentUploadButton } from "@/components/consultation/InlineDocumentUpload";
import { cn } from "@/lib/utils";
import { EVIDENCE_SLOT_META, isEvidenceSlotId } from "@workspace/evidence-slots";

type DocumentSlotStatus = "required" | "uploaded" | "verified" | "rejected";

type DocumentSlot = {
  docId: string;
  docTitle: string;
  status: DocumentSlotStatus;
  uploadedAt?: string;
  rejectionNote?: string;
  uploadPath: string;
  uploadUrl: string;
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
  conditionName: string;
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
    if (
      slot.status === "uploaded" &&
      (!fresh || fresh.status === "required")
    ) {
      byId.set(slot.docId, {
        ...slot,
        ...fresh,
        status: "uploaded",
        uploadedAt: slot.uploadedAt ?? fresh?.uploadedAt,
      });
    } else if (
      slot.status === "verified" &&
      fresh?.status !== "rejected"
    ) {
      byId.set(slot.docId, { ...slot, ...fresh, status: "verified" });
    }
  }
  return Array.from(byId.values());
}

function buildUploadedSlot(
  consultationId: string,
  docId: string,
  existing?: DocumentSlot,
): DocumentSlot {
  const title =
    existing?.docTitle ??
    (isEvidenceSlotId(docId) ? EVIDENCE_SLOT_META[docId].title : docId);
  const uploadPath =
    existing?.uploadPath ??
    `/upload-documents/${consultationId}?slot=${encodeURIComponent(docId)}`;
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

function PatientDocumentViewer({
  consultationId,
  docId,
  docTitle,
  open,
  onOpenChange,
}: {
  consultationId: string;
  docId: string;
  docTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<{
    dataUrl: string;
    uploadedAt?: string;
    reviewStatus?: string;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setPayload(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void apiFetch<{
      dataUrl: string;
      uploadedAt?: string;
      reviewStatus?: string;
    }>(
      `/api/patient/consultations/${consultationId}/documents/${encodeURIComponent(docId)}`,
      { auth: "patient" },
    )
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load document.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, consultationId, docId]);

  const isVideo =
    payload?.dataUrl.startsWith("data:video") ||
    /\.(mp4|webm|mov)/i.test(payload?.dataUrl ?? "");
  const isPdf =
    payload?.dataUrl.startsWith("data:application/pdf") ||
    payload?.dataUrl.includes("application/pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{docTitle}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Loading your upload…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive py-4">{error}</p>
        ) : payload ? (
          <div className="space-y-3">
            {payload.uploadedAt ? (
              <p className="text-xs text-muted-foreground">
                Uploaded {formatUploadTime(payload.uploadedAt)}
                {payload.reviewStatus === "verified"
                  ? " · Verified by pharmacist"
                  : payload.reviewStatus === "rejected"
                    ? " · Rejected — please upload again"
                    : " · Awaiting pharmacist review"}
              </p>
            ) : null}
            {isPdf ? (
              <a
                href={payload.dataUrl}
                download={`${docId}.pdf`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            ) : isVideo ? (
              <video
                src={payload.dataUrl}
                controls
                className="w-full max-h-[60vh] rounded-xl border border-border bg-black"
              />
            ) : (
              <img
                src={payload.dataUrl}
                alt={docTitle}
                className="w-full max-h-[60vh] object-contain rounded-xl border border-border bg-muted/30"
              />
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
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

// ── Status accent map (left bar + soft icon tile) ────────────────────────────
const STATUS_ACCENT: Record<string, { bar: string; tile: string; tileText: string }> = {
  pending:           { bar: "bg-primary/40",    tile: "bg-accent",         tileText: "text-primary" },
  red_flag:          { bar: "bg-destructive",   tile: "bg-destructive/10", tileText: "text-destructive" },
  approved:          { bar: "bg-primary",       tile: "bg-primary/10",     tileText: "text-primary" },
  rejected:          { bar: "bg-destructive",   tile: "bg-destructive/10", tileText: "text-destructive" },
  more_info_needed:  { bar: "bg-primary",       tile: "bg-primary/10",     tileText: "text-primary" },
  patient_responded: { bar: "bg-primary/60",    tile: "bg-primary/10",     tileText: "text-primary" },
  referred:          { bar: "bg-muted-foreground/40", tile: "bg-muted",    tileText: "text-foreground" },
  cancelled:         { bar: "bg-border",        tile: "bg-muted",          tileText: "text-muted-foreground" },
};

// ── Collapsible row ──────────────────────────────────────────────────────────
function ConsultationRow({
  consultation, index, onCancel, cancelling, defaultOpen, onDocumentsChanged, onDocumentUploaded,
}: {
  consultation: Consultation;
  index: number;
  onCancel: (id: string) => void;
  cancelling: string | null;
  defaultOpen?: boolean;
  onDocumentsChanged: () => void;
  onDocumentUploaded: (consultationId: string, docId: string) => void;
}) {
  const cfg = STATUS_CONFIG[consultation.status] ?? STATUS_CONFIG.pending;
  const accent = STATUS_ACCENT[consultation.status] ?? STATUS_ACCENT.pending;
  const placedAt = formatConsultationPlacedAt(consultation.createdAt);
  const isPending = consultation.status === "pending" || consultation.status === "red_flag";
  const requiresPatientReply =
    consultation.requiresPatientReply ??
    consultation.status === "more_info_needed";
  const needsReply =
    requiresPatientReply ||
    (consultation.documentActions?.length ?? 0) > 0;
  const documentSlots = resolveDocumentSlots(consultation);
  const documentsNeedAttention =
    consultation.documentsNeedAttention ??
    documentSlots.some(
      (s) => s.status === "required" || s.status === "rejected",
    );
  const hasUpdate = !!(consultation.prescription || consultation.pharmacistNote || consultation.referralInfo);
  const ref =
    consultation.consultationNumber ??
    consultation.id.toUpperCase().slice(0, 8);

  const [open, setOpen] = useState(
    !!defaultOpen || documentsNeedAttention || needsReply,
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{
    docId: string;
    docTitle: string;
  } | null>(null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="relative bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      data-testid={`consult-card-${ref}`}
    >
      {/* Notification-style header (always visible, click to expand) */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="relative z-0 w-full text-left flex items-stretch gap-0 group"
        data-testid={`consult-toggle-${ref}`}
      >
        {/* Left status bar */}
        <span className={`w-1.5 ${accent.bar} flex-shrink-0`} aria-hidden="true" />

        <div className="relative flex-1 flex items-center gap-4 px-4 md:px-6 py-5 min-w-0">
          {/* Icon tile */}
          <div className={`hidden sm:flex w-12 h-12 rounded-xl ${accent.tile} ${accent.tileText} items-center justify-center flex-shrink-0`}>
            <Stethoscope className="w-5 h-5" />
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base md:text-lg font-extrabold text-secondary truncate">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Update
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" />
                Order placed {placedAt}
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span className="font-mono text-[11px]">REF {ref}</span>
            </div>
          </div>

          {/* Status + chevron */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <StatusPill status={consultation.status} />
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground ${open ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </button>

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

              {documentSlots.length > 0 && (
                <section>
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Your documents
                  </h4>
                  <div className="space-y-3">
                    {documentSlots.map((doc) => {
                      const uploadedLabel = formatUploadTime(doc.uploadedAt);
                      const canView =
                        doc.status === "uploaded" || doc.status === "verified";
                      return (
                        <div
                          key={doc.docId}
                          className={cn(
                            "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between",
                            doc.status === "rejected" &&
                              "border-destructive/35 bg-destructive/[0.03]",
                            doc.status === "required" &&
                              "border-amber-200/90 bg-amber-50/40",
                            doc.status === "uploaded" &&
                              "border-emerald-200/80 bg-emerald-50/45",
                            doc.status === "verified" &&
                              "border-primary/25 bg-primary/5",
                            doc.status !== "rejected" &&
                              doc.status !== "required" &&
                              doc.status !== "uploaded" &&
                              doc.status !== "verified" &&
                              "border-border bg-muted/20",
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <DocumentStatusBadge status={doc.status} />
                              <span className="text-sm font-semibold text-foreground">
                                {doc.docTitle}
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
                            {doc.status === "uploaded" ? (
                              <p className="text-xs text-muted-foreground">
                                Uploaded — your pharmacist will review it shortly.
                                {uploadedLabel ? ` (${uploadedLabel})` : ""}
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
                                  docTitle: doc.docTitle,
                                })
                              }
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              View upload
                            </Button>
                          ) : null}
                          {(doc.status === "required" ||
                            doc.status === "rejected") && (
                            <InlineDocumentUploadButton
                              consultationId={consultation.id}
                              docId={doc.docId}
                              label={
                                doc.status === "rejected"
                                  ? "Upload again"
                                  : "Upload now"
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
                </section>
              )}

              {consultation.pharmacistNote && (
                <section>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pharmacist&apos;s note
                  </h4>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {consultation.pharmacistNote}
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
                      href={`${(import.meta.env.BASE_URL as string).replace(/\/$/, "")}/api/consultations/${consultation.id}/prescription.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors shadow-sm"
                      data-testid={`button-download-pdf-${ref}`}
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

              {!isPending && consultation.reviewedAt && (
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
                        data-testid={`button-cancel-${ref}`}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1.5" /> Cancel
                      </Button>
                    )}
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full font-bold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                      data-testid={`button-chat-${ref}`}
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
                        data-testid={`button-confirm-cancel-${ref}`}
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
            documentsNeedAttention: documentSlots.some(
              (s) => s.status === "required" || s.status === "rejected",
            ),
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
          documentsNeedAttention: nextSlots.some(
            (s) => s.status === "required" || s.status === "rejected",
          ),
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
    const needsAction =
      c.documentsNeedAttention ?? (c.documentActions?.length ?? 0) > 0;
    if (filter === "pending") {
      return PENDING_STATUSES.includes(c.status) || needsAction;
    }
    if (filter === "completed") {
      return COMPLETED_STATUSES.includes(c.status) && !needsAction;
    }
    return true;
  });

  const pendingCount = consultations.filter(
    (c) =>
      PENDING_STATUSES.includes(c.status) ||
      c.documentsNeedAttention ||
      (c.documentActions?.length ?? 0) > 0,
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
            onClick={fetchConsultations}
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
              <Button onClick={fetchConsultations} variant="outline" className="rounded-lg">Try again</Button>
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

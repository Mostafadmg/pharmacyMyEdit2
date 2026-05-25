import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Mail,
  Upload,
  XCircle,
} from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import {
  getGetConsultationQueryKey,
  useGetConsultation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  EVIDENCE_SLOT_META,
  requirementLabel,
} from "@workspace/evidence-slots";
import {
  buildPrescriptionEvidenceSlots,
  countEvidenceSlots,
  type EvidenceSlot,
  type EvidenceSlotId,
} from "@/lib/prescriptionEvidenceSlots";
import {
  fetchDocumentRejectionTemplates,
  templatesForSlot,
  TEMPLATES_CHANGED_EVENT,
  type DocumentRejectionTemplate,
} from "@/lib/documentRejectionTemplates";
import { RX_DOCUMENT as DOC } from "@/lib/orderTheme";

const CURRENT_PHARMACIST_NAME =
  (typeof localStorage !== "undefined" &&
    localStorage.getItem("pharmacist_name")) ||
  "Pharmacist";

function FilterPill({
  color,
  children,
}: {
  color: "emerald" | "amber" | "rose" | "stone";
  children: React.ReactNode;
}) {
  const cls = {
    emerald: DOC.filterVerified,
    amber: DOC.filterPending,
    rose: DOC.filterRejected,
    stone: DOC.filterEmpty,
  }[color];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        cls,
      )}
    >
      {children}
    </span>
  );
}

type ConfirmAction = {
  doc: EvidenceSlot;
  status: "verified" | "rejected";
};

function isVideoDataUrl(url: string): boolean {
  return (
    url.startsWith("data:video/") || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)
  );
}

function MediaPreview({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  if (isVideoDataUrl(url)) {
    return (
      <video
        src={url}
        controls
        playsInline
        className={cn("h-full w-full object-contain bg-foreground/90", className)}
        aria-label={title}
      />
    );
  }
  return (
    <img
      src={url}
      alt={title}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function PrescriptionEvidenceGrid({
  consultationId,
  consultation: consultationProp,
  allowReview = true,
  compact = false,
  showHeader = true,
  onDocumentReview,
  onDocumentRequirementChange,
  onUploadLinkSent,
}: {
  consultationId?: string;
  /** When provided (e.g. Consultation tab), skips fetch. */
  consultation?: Consultation;
  allowReview?: boolean;
  compact?: boolean;
  showHeader?: boolean;
  onDocumentReview?: (payload: {
    docId: string;
    docTitle: string;
    status: "verified" | "rejected";
    emailSent?: boolean;
    templateTitle?: string;
    note?: string;
  }) => void;
  onDocumentRequirementChange?: (payload: {
    requirement: "required" | "not_required";
    emailSent?: boolean;
  }) => void;
  onUploadLinkSent?: (payload: {
    docId: string;
    docTitle: string;
    emailSent?: boolean;
  }) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const shouldFetch = !consultationProp && Boolean(consultationId);
  const { data: fetched } = useGetConsultation(consultationId!, {
    query: { enabled: shouldFetch },
  });
  const c = consultationProp ?? fetched;

  const slots = useMemo(() => (c ? buildPrescriptionEvidenceSlots(c) : []), [c]);
  const counts = useMemo(() => countEvidenceSlots(slots), [slots]);

  const [viewing, setViewing] = useState<EvidenceSlot | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templates, setTemplates] = useState<DocumentRejectionTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<EvidenceSlot["id"] | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      setViewing(null);
      setConfirmAction(null);
    };
  }, []);

  useEffect(() => {
    void fetchDocumentRejectionTemplates()
      .then(setTemplates)
      .catch(() => {});
    const onChange = () => {
      void fetchDocumentRejectionTemplates().then(setTemplates);
    };
    window.addEventListener(TEMPLATES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(TEMPLATES_CHANGED_EVENT, onChange);
  }, []);

  const slotTemplates = useMemo(() => {
    if (!confirmAction || confirmAction.status !== "rejected") return [];
    return templatesForSlot(
      templates,
      confirmAction.doc.id as EvidenceSlotId,
    );
  }, [templates, confirmAction]);

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) setRejectionNote(tpl.emailBody);
  };

  const persistReview = useCallback(
    async (
      docId: string,
      status: "verified" | "pending" | "rejected",
      opts?: {
        sendUploadEmail?: boolean;
        rejectionNote?: string;
        rejectionTemplateId?: string;
        rejectionTemplateTitle?: string;
        emailSubject?: string;
      },
    ) => {
      const id = consultationId ?? c?.id;
      if (!id) return null;
      return apiFetch<Consultation & { emailSent?: boolean }>(
        `/api/consultations/${id}/document-reviews`,
        {
          method: "PATCH",
          body: JSON.stringify({
            docId,
            status,
            sendUploadEmail: opts?.sendUploadEmail,
            rejectionNote: opts?.rejectionNote,
            rejectionTemplateId: opts?.rejectionTemplateId,
            rejectionTemplateTitle: opts?.rejectionTemplateTitle,
            emailSubject: opts?.emailSubject,
          }),
        },
      );
    },
    [consultationId, c?.id],
  );

  const invalidateConsultation = useCallback(async () => {
    const id = consultationId ?? c?.id;
    if (!id) return;
    await queryClient.invalidateQueries({
      queryKey: getGetConsultationQueryKey(id),
    });
  }, [consultationId, c?.id, queryClient]);

  const resendUploadEmail = async (doc: EvidenceSlot) => {
    const id = consultationId ?? c?.id;
    if (!id) return;
    setSaving(true);
    try {
      const reviewStatus =
        doc.status === "rejected" ? "rejected" : ("pending" as const);
      const result = await persistReview(doc.id, reviewStatus, {
        sendUploadEmail: true,
        rejectionNote:
          doc.rejectionNote?.trim() ||
          "Please upload this document when you can using the secure link in your patient portal.",
      });
      await invalidateConsultation();
      toast({
        title: result?.emailSent ? "Upload link emailed" : "Upload request saved",
        description: result?.emailSent
          ? `${doc.title} — patient can upload via the link or My consultations.`
          : `${doc.title} — in-app notification sent (configure email to also mail the patient).`,
      });
      onUploadLinkSent?.({
        docId: doc.id,
        docTitle: doc.title,
        emailSent: result?.emailSent,
      });
    } catch (err) {
      toast({
        title: "Could not send email",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadDocumentForPatient = async (
    docId: EvidenceSlot["id"],
    dataUrl: string,
  ) => {
    const id = consultationId ?? c?.id;
    if (!id) return;
    setSaving(true);
    try {
      await apiFetch(`/api/consultations/${id}/patient-documents`, {
        method: "POST",
        body: JSON.stringify({
          docId,
          dataUrl,
          messageBody: `${CURRENT_PHARMACIST_NAME} uploaded a replacement document on your behalf.`,
        }),
      });
      await invalidateConsultation();
      toast({ title: "Document uploaded", description: "Marked pending for review." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadTargetId(null);
    }
  };

  const patchPreviousPrescriptionRequirement = async (
    requirement: "required" | "not_required",
    sendUploadEmail: boolean,
  ) => {
    const id = consultationId ?? c?.id;
    if (!id) return;
    setSaving(true);
    try {
      const result = await apiFetch<{
        emailSent?: boolean;
        requirementChange?: { note: string };
      }>(`/api/consultations/${id}/document-requirements`, {
        method: "PATCH",
        body: JSON.stringify({
          slotId: "previous-prescription",
          requirement,
          sendUploadEmail,
        }),
      });
      await invalidateConsultation();
      toast({
        title:
          requirement === "required"
            ? "Previous prescription now required"
            : "Previous prescription not required",
        description: result?.emailSent
          ? "Upload link emailed to the patient."
          : result?.requirementChange?.note,
      });
      onDocumentRequirementChange?.({
        requirement,
        emailSent: result?.emailSent,
      });
    } catch (err) {
      toast({
        title: "Could not update requirement",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onFilePicked = (file: File | undefined) => {
    if (!file || !uploadTargetId) return;
    const maxMb = EVIDENCE_SLOT_META[uploadTargetId].maxMb;
    if (file.size > maxMb * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum size is ${maxMb} MB.`,
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        void uploadDocumentForPatient(uploadTargetId, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyReview = async (
    doc: EvidenceSlot,
    status: "verified" | "rejected",
  ) => {
    setSaving(true);
    try {
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      const result = await persistReview(doc.id, status, {
        sendUploadEmail: status === "rejected",
        rejectionNote:
          status === "rejected" ? rejectionNote.trim() || undefined : undefined,
        rejectionTemplateId: tpl?.id,
        rejectionTemplateTitle: tpl?.title,
        emailSubject: tpl?.emailSubject,
      });
      await invalidateConsultation();
      toast({
        title:
          status === "verified"
            ? `${doc.title} verified`
            : `${doc.title} rejected`,
        description:
          status === "rejected"
            ? result?.emailSent
              ? "Upload link emailed to patient."
              : "Rejection saved (configure RESEND_API_KEY or SMTP to email patients)."
            : undefined,
      });
      onDocumentReview?.({
        docId: doc.id,
        docTitle: doc.title,
        status,
        emailSent: result?.emailSent,
        templateTitle: tpl?.title,
        note: rejectionNote.trim() || undefined,
      });
      setConfirmAction(null);
      setRejectionNote("");
      setSelectedTemplateId("");
      setViewing(null);
    } catch (err) {
      toast({
        title: "Could not save review",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatEmailSent = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!c) {
    return (
      <div
        className={cn(
          "grid gap-4 animate-pulse",
          compact
            ? "grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
            : "grid-cols-[repeat(auto-fit,minmax(260px,1fr))]",
        )}
      >
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={cn(
              "rounded-2xl bg-muted",
              compact ? "h-[28rem]" : "h-[30rem]",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          onFilePicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {showHeader && (
        <div>
          <h4
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-base" : "text-lg",
            )}
          >
            Patient documents
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Patient-uploaded ID and clinical documents from the weight-loss
            questionnaire. Each is reviewed by a prescriber.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterPill color="emerald">
          <CheckCircle2 className="h-3 w-3" />
          {counts.verified} verified
        </FilterPill>
        <FilterPill color="amber">
          <Clock className="h-3 w-3" />
          {counts.pending} Pending for review
        </FilterPill>
        <FilterPill color="rose">
          <XCircle className="h-3 w-3" />
          {counts.rejected} rejected
        </FilterPill>
        <FilterPill color="stone">
          {counts.not_uploaded} not uploaded
        </FilterPill>
      </div>

      <div
        className={cn(
          "grid gap-4 items-stretch",
          compact
            ? "grid-cols-[repeat(auto-fit,minmax(260px,1fr))]"
            : "grid-cols-[repeat(auto-fit,minmax(280px,1fr))]",
        )}
      >
        {slots.map((d) => {
          const notUploaded = d.status === "not_uploaded";
          const verified = d.status === "verified";
          const rejected = d.status === "rejected";
          const pending = d.status === "pending";

          return (
            <div
              key={d.id}
              className={cn(
                "flex flex-col",
                DOC.card,
                compact ? "min-h-[28rem]" : "min-h-[30rem]",
                verified && DOC.cardVerified,
                rejected && DOC.cardRejected,
                pending && DOC.cardPending,
                notUploaded && DOC.cardEmpty,
              )}
            >
              <div
                className={cn(
                  "relative flex shrink-0 items-center justify-center",
                  compact ? "h-52 sm:h-56" : "h-56 sm:h-64",
                  notUploaded ? DOC.previewEmpty : DOC.previewFilled,
                )}
              >
                {d.imageUrl ? (
                  <MediaPreview url={d.imageUrl} title={d.title} />
                ) : (
                  <FileText
                    className={cn(
                      "text-muted-foreground",
                      compact ? "h-10 w-10" : "h-14 w-14",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                    verified && "bg-primary text-primary-foreground",
                    rejected && "bg-destructive text-destructive-foreground",
                    pending && "bg-rx-cs text-white",
                    notUploaded && "bg-muted text-muted-foreground",
                  )}
                >
                  {notUploaded ? (
                    <>
                      <Clock className="h-3 w-3" /> Not uploaded
                    </>
                  ) : verified ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </>
                  ) : rejected ? (
                    <>
                      <XCircle className="h-3 w-3" /> Rejected
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" /> Pending for review
                    </>
                  )}
                </span>
              </div>
              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col",
                  compact ? "p-3" : "p-4",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={cn(
                      "font-semibold text-foreground",
                      compact ? "text-sm" : "text-base",
                    )}
                  >
                    {d.title}
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      d.requirement === "required" && DOC.requiredBadge,
                      d.requirement === "not_required" && DOC.optionalNotRequired,
                      d.requirement === "optional" && DOC.optionalBadge,
                    )}
                  >
                    {requirementLabel(d.requirement)}
                  </span>
                </div>
                <div
                  className={cn(
                    "text-muted-foreground mt-1 leading-relaxed",
                    compact ? "text-xs" : "text-sm",
                  )}
                >
                  {d.sub}
                </div>
                <div
                  className={cn(
                    "mt-2",
                    compact ? "text-[11px]" : "text-xs",
                    "text-muted-foreground",
                    notUploaded && "italic",
                  )}
                >
                  {d.uploaded}
                </div>
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                  {EVIDENCE_SLOT_META[d.id].criteria.slice(0, 3).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div
                  className={cn(
                    "mt-auto flex flex-col gap-2",
                    DOC.sectionDivider,
                    compact ? "pt-3" : "pt-4",
                  )}
                >
                  {allowReview && d.id === "previous-prescription" && (
                    <div className="flex flex-col gap-2">
                      {d.requirement !== "required" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() =>
                            void patchPreviousPrescriptionRequirement(
                              "required",
                              true,
                            )
                          }
                          className={cn("h-10 w-full text-xs font-semibold", DOC.btnEmail)}
                        >
                          Mark as required &amp; email upload link
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() =>
                            void patchPreviousPrescriptionRequirement(
                              "not_required",
                              false,
                            )
                          }
                          className={cn("h-10 w-full text-xs font-semibold", DOC.btnOutline)}
                        >
                          Mark as not required
                        </Button>
                      )}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-10 w-full text-xs font-semibold cursor-pointer disabled:opacity-45",
                      DOC.btnOutline,
                    )}
                    disabled={!d.imageUrl}
                    onClick={() => d.imageUrl && setViewing(d)}
                  >
                    <Eye className="mr-1.5 h-4 w-4 text-muted-foreground" />
                    View
                  </Button>
                  {allowReview && notUploaded && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => void resendUploadEmail(d)}
                      className={cn("h-10 w-full text-xs font-semibold", DOC.btnEmail)}
                    >
                      <Mail className="mr-1.5 h-4 w-4" />
                      Email upload link
                    </Button>
                  )}
                  {allowReview && !notUploaded && (
                    <>
                      {verified ? (
                        <div className={cn("flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold", DOC.verifiedBanner)}>
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          {d.reviewedBy
                            ? `Verified by ${d.reviewedBy}`
                            : "Verified"}
                        </div>
                      ) : rejected ? (
                        <div className="flex flex-col gap-2">
                          <div className={cn("rounded-xl border px-3 py-2.5 text-xs", DOC.rejectedBanner)}>
                            <div className="flex items-center gap-2 font-semibold">
                              <XCircle className="h-4 w-4 shrink-0" />
                              Rejected — awaiting new upload
                            </div>
                            {d.uploadEmailSentAt ? (
                              <p className="mt-1.5 text-[11px] font-medium leading-relaxed opacity-90">
                                Upload link emailed
                                {formatEmailSent(d.uploadEmailSentAt)
                                  ? ` · ${formatEmailSent(d.uploadEmailSentAt)}`
                                  : ""}
                                {(d.uploadEmailCount ?? 0) > 1
                                  ? ` (${d.uploadEmailCount} emails)`
                                  : ""}
                              </p>
                            ) : (
                              <p className="mt-1.5 text-[11px] opacity-90">
                                Email not sent yet — resend link below.
                              </p>
                            )}
                            {d.rejectionTemplateTitle ? (
                              <p className="mt-1 text-[11px] font-semibold">
                                {d.rejectionTemplateTitle}
                              </p>
                            ) : null}
                            {d.rejectionNote ? (
                              <p className="mt-1 text-[11px] italic line-clamp-3 opacity-80">
                                {d.rejectionNote}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => void resendUploadEmail(d)}
                            className={cn("h-10 w-full text-xs font-semibold hover:opacity-90", DOC.btnEmail)}
                          >
                            <Mail className="mr-1.5 h-4 w-4" />
                            Resend upload link
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => {
                              setUploadTargetId(d.id);
                              fileInputRef.current?.click();
                            }}
                            className={cn("h-10 w-full text-xs font-semibold", DOC.btnOutline)}
                          >
                            <Upload className="mr-1.5 h-4 w-4" />
                            Upload for patient
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            disabled={saving}
                            onClick={() =>
                              setConfirmAction({ doc: d, status: "verified" })
                            }
                            className={cn("h-10 w-full text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-50", DOC.btnVerify)}
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            Verify
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => {
                              setRejectionNote("");
                              setSelectedTemplateId("");
                              setConfirmAction({ doc: d, status: "rejected" });
                            }}
                            className={cn("h-10 w-full text-xs font-semibold cursor-pointer disabled:opacity-50", DOC.btnReject)}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>{viewing?.sub}</DialogDescription>
          </DialogHeader>
          {viewing?.imageUrl && (
            <div className="px-5 pb-2">
              <MediaPreview
                url={viewing.imageUrl}
                title={viewing.title}
                className="max-h-[70vh] w-full rounded-2xl object-contain bg-muted"
              />
            </div>
          )}
          <DialogFooter className="p-5 pt-2 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {allowReview && viewing && viewing.status !== "not_uploaded" && (
              <>
                <Button
                  variant="outline"
                  className={DOC.btnReject}
                  onClick={() =>
                    setConfirmAction({ doc: viewing, status: "rejected" })
                  }
                >
                  Reject
                </Button>
                <Button
                  className={DOC.btnVerify}
                  onClick={() =>
                    setConfirmAction({ doc: viewing, status: "verified" })
                  }
                >
                  Verify
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {allowReview && (
        <Dialog
          open={confirmAction !== null}
          onOpenChange={(open) => !open && !saving && setConfirmAction(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {confirmAction?.status === "verified"
                  ? "Verify document?"
                  : "Reject document?"}
              </DialogTitle>
              <DialogDescription>
                {confirmAction?.status === "verified"
                  ? `Confirm that "${confirmAction.doc.title}" meets prescribing standards. Logged under ${CURRENT_PHARMACIST_NAME}.`
                  : `Reject "${confirmAction?.doc.title}". We will email the patient a secure link to upload a replacement (they can also attach files in Messages).`}
              </DialogDescription>
            </DialogHeader>
            {confirmAction?.status === "rejected" ? (
              <div className="px-6 pb-2 space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rejection reason
                  </span>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      if (e.target.value) applyTemplate(e.target.value);
                      else {
                        setSelectedTemplateId("");
                        setRejectionNote("");
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium"
                  >
                    <option value="">Custom message…</option>
                    {slotTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email &amp; message to patient
                  </span>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Select a reason above or type your own message…"
                    className="mt-1 min-h-[5.5rem] w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed"
                  />
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Manage templates in Settings → Document emails.
                </p>
              </div>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={saving}
                className={cn(
                  confirmAction?.status === "verified"
                    ? DOC.btnVerify
                    : "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                )}
                onClick={() => {
                  if (confirmAction) {
                    void applyReview(confirmAction.doc, confirmAction.status);
                  }
                }}
              >
                {saving
                  ? "Saving…"
                  : confirmAction?.status === "verified"
                    ? "Yes, verify"
                    : "Yes, reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/** Uploaded slots that still need pharmacist review. */
export function outstandingEvidenceSlots(slots: EvidenceSlot[]) {
  return slots.filter(
    (s) => s.status !== "not_uploaded" && s.status !== "verified",
  );
}

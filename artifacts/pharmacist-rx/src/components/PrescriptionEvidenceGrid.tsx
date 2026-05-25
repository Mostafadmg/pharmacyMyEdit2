import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Mail,
  Upload,
  XCircle,
  ZoomIn,
  ZoomOut,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  EVIDENCE_SLOT_META,
  type PharmacistDocumentRequirementSlotId,
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

/** Outline Button variant has no hover — card actions share pointer + transition */
const EVIDENCE_CARD_BTN =
  "h-10 w-full cursor-pointer text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
/** Amber email actions: theme hover on same surface is invisible; match Resend link */
const EVIDENCE_EMAIL_BTN_HOVER = "hover:opacity-90 hover:bg-rx-cs/15";

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

type UploadRequestAction = {
  doc: EvidenceSlot;
  mode: "request" | "resend";
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
  style,
}: {
  url: string;
  title: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (isVideoDataUrl(url)) {
    return (
      <video
        src={url}
        controls
        playsInline
        style={style}
        className={cn("h-full w-full object-contain bg-foreground/90", className)}
        aria-label={title}
      />
    );
  }
  return (
    <img
      src={url}
      alt={title}
      style={style}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

function EvidenceViewerModal({
  slot,
  allowReview,
  docTheme,
  onClose,
  onReject,
  onUnverify,
  onVerify,
  onRequestUpload,
}: {
  slot: EvidenceSlot;
  allowReview: boolean;
  docTheme: typeof DOC;
  onClose: () => void;
  onReject: () => void;
  onUnverify: () => void;
  onVerify: () => void;
  onRequestUpload: () => void;
}) {
  const urls =
    slot.imageUrls.length > 0
      ? slot.imageUrls
      : slot.imageUrl
        ? [slot.imageUrl]
        : [];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setIndex(0);
    setZoom(1);
  }, [slot.id]);

  const currentUrl = urls[index];
  const canPrev = index > 0;
  const canNext = index < urls.length - 1;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] w-[min(96vw,72rem)] max-w-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="pr-8">{slot.title}</DialogTitle>
          <DialogDescription>
            {slot.sub}
            {urls.length > 1 ? (
              <span className="mt-1 block text-foreground/80">
                Document {index + 1} of {urls.length}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        {currentUrl ? (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!canPrev}
                  aria-label="Previous document"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={!canNext}
                  aria-label="Next document"
                  onClick={() =>
                    setIndex((i) => Math.min(urls.length - 1, i + 1))
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                {urls.length > 1 ? (
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {index + 1} / {urls.length}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Zoom out"
                  disabled={zoom <= 0.5}
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Zoom in"
                  disabled={zoom >= 3}
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4 touch-pan-x touch-pan-y">
              <div
                className="mx-auto flex min-h-[min(60vh,32rem)] min-w-full items-center justify-center"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top center",
                }}
              >
                <MediaPreview
                  url={currentUrl}
                  title={`${slot.title} (${index + 1})`}
                  className="max-h-[min(72vh,40rem)] w-full max-w-full rounded-2xl object-contain shadow-sm"
                />
              </div>
            </div>
          </div>
        ) : null}
        <DialogFooter className="shrink-0 gap-2 border-t border-border p-5 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {allowReview && slot.status !== "not_uploaded" ? (
            <>
              {slot.status === "verified" ? (
                <>
                  <Button
                    variant="outline"
                    className={docTheme.btnReject}
                    onClick={onReject}
                  >
                    Reject
                  </Button>
                  <Button variant="outline" onClick={onRequestUpload}>
                    Request re-upload
                  </Button>
                  <Button variant="outline" onClick={onUnverify}>
                    Unverify
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className={docTheme.btnReject}
                    onClick={onReject}
                  >
                    Reject
                  </Button>
                  <Button className={docTheme.btnVerify} onClick={onVerify}>
                    Verify
                  </Button>
                </>
              )}
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    note?: string;
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
  const [uploadRequestAction, setUploadRequestAction] =
    useState<UploadRequestAction | null>(null);
  const [uploadRequestNote, setUploadRequestNote] = useState("");
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

  const resendUploadEmail = async (doc: EvidenceSlot, note?: string) => {
    const id = consultationId ?? c?.id;
    if (!id) return;
    setSaving(true);
    try {
      const reviewStatus =
        doc.status === "rejected" ? "rejected" : ("pending" as const);
      const result = await persistReview(doc.id, reviewStatus, {
        sendUploadEmail: true,
        rejectionNote:
          note?.trim() ||
          doc.rejectionNote?.trim() ||
          "Please upload this document when you can using the secure link in your patient portal.",
      });
      await invalidateConsultation();
      toast({
        title: result?.emailSent ? "Upload request sent" : "Upload request saved",
        description: result?.emailSent
          ? `${doc.title} — patient can upload under My consultations (email sent).`
          : `${doc.title} — shown under My consultations (configure email to also mail the patient).`,
      });
      onUploadLinkSent?.({
        docId: doc.id,
        docTitle: doc.title,
        emailSent: result?.emailSent,
        note: note?.trim() || undefined,
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

  const unverifyDocument = async (doc: EvidenceSlot) => {
    setSaving(true);
    try {
      await persistReview(doc.id, "pending");
      await invalidateConsultation();
      toast({
        title: "Verification removed",
        description: `${doc.title} is pending review again. You can reject or request a new upload.`,
      });
      setViewing(null);
    } catch (err) {
      toast({
        title: "Could not unverify",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openUploadRequestDialog = (
    doc: EvidenceSlot,
    mode: UploadRequestAction["mode"],
  ) => {
    setUploadRequestNote("");
    setUploadRequestAction({ doc, mode });
  };

  const submitUploadRequest = async () => {
    if (!uploadRequestAction) return;
    const { doc } = uploadRequestAction;
    const note = uploadRequestNote.trim() || undefined;
    await resendUploadEmail(doc, note);
    setUploadRequestAction(null);
    setUploadRequestNote("");
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

  const patchDocumentRequirement = async (
    slotId: PharmacistDocumentRequirementSlotId,
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
          slotId,
          requirement,
          sendUploadEmail,
        }),
      });
      await invalidateConsultation();
      const title = EVIDENCE_SLOT_META[slotId].title;
      toast({
        title:
          requirement === "required"
            ? `${title} now required`
            : `${title} not required`,
        description: result?.emailSent
          ? "Patient notified — document upload requested (email sent)."
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
              ? "Upload requested — patient notified by email."
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
                  {d.uploadCount > 1 ? (
                    <span className="font-semibold text-foreground">
                      {d.uploadCount} documents
                    </span>
                  ) : null}
                  {d.uploadCount > 1 ? (
                    <span className="block">{d.uploaded}</span>
                  ) : (
                    d.uploaded
                  )}
                </div>
                <ul
                  className={cn(
                    "mt-2 list-disc pl-4 text-[11px] leading-relaxed text-muted-foreground",
                    compact ? "space-y-1" : "space-y-1.5",
                  )}
                >
                  {EVIDENCE_SLOT_META[d.id].criteria.slice(0, 3).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className={cn("mt-auto shrink-0", compact ? "pt-3" : "pt-4")}>
                  <div
                    className={cn(
                      "flex flex-col gap-2",
                      DOC.sectionDivider,
                      compact ? "pt-4" : "pt-5",
                    )}
                  >
                  {allowReview &&
                    (d.id === "previous-prescription" ||
                      d.id === "previous-bmi-verification") && (
                    <div className="flex flex-col gap-2">
                      {d.requirement !== "required" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() =>
                            void patchDocumentRequirement(
                              d.id as PharmacistDocumentRequirementSlotId,
                              "required",
                              true,
                            )
                          }
                          className={cn(
                            EVIDENCE_CARD_BTN,
                            EVIDENCE_EMAIL_BTN_HOVER,
                            DOC.btnEmail,
                          )}
                        >
                          Mark as required &amp; request upload
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saving}
                          onClick={() =>
                            void patchDocumentRequirement(
                              d.id as PharmacistDocumentRequirementSlotId,
                              "not_required",
                              false,
                            )
                          }
                          className={cn(EVIDENCE_CARD_BTN, DOC.btnOutline)}
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
                    className={cn(EVIDENCE_CARD_BTN, DOC.btnOutline)}
                    disabled={d.uploadCount === 0}
                    onClick={() => d.uploadCount > 0 && setViewing(d)}
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
                      onClick={() => openUploadRequestDialog(d, "request")}
                      className={cn(
                        EVIDENCE_CARD_BTN,
                        EVIDENCE_EMAIL_BTN_HOVER,
                        DOC.btnEmail,
                      )}
                    >
                      <Mail className="mr-1.5 h-4 w-4" />
                      Request document upload
                    </Button>
                  )}
                  {allowReview && !notUploaded && (
                    <>
                      {verified ? (
                        <div className="flex flex-col gap-2">
                          <div className={cn("flex h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold", DOC.verifiedBanner)}>
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            {d.reviewedBy
                              ? `Verified by ${d.reviewedBy}`
                              : "Verified"}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => void unverifyDocument(d)}
                            className={cn(EVIDENCE_CARD_BTN, DOC.btnOutline)}
                          >
                            Unverify
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
                            className={cn(EVIDENCE_CARD_BTN, DOC.btnReject)}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => openUploadRequestDialog(d, "request")}
                            className={cn(
                              EVIDENCE_CARD_BTN,
                              EVIDENCE_EMAIL_BTN_HOVER,
                              DOC.btnEmail,
                            )}
                          >
                            <Mail className="mr-1.5 h-4 w-4" />
                            Request re-upload
                          </Button>
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
                                Upload requested
                                {formatEmailSent(d.uploadEmailSentAt)
                                  ? ` · ${formatEmailSent(d.uploadEmailSentAt)}`
                                  : ""}
                                {(d.uploadEmailCount ?? 0) > 1
                                  ? ` (${d.uploadEmailCount} emails)`
                                  : ""}
                              </p>
                            ) : (
                              <p className="mt-1.5 text-[11px] opacity-90">
                                Email not sent yet — request upload again below.
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
                            onClick={() => openUploadRequestDialog(d, "resend")}
                            className={cn(
                              EVIDENCE_CARD_BTN,
                              EVIDENCE_EMAIL_BTN_HOVER,
                              DOC.btnEmail,
                            )}
                          >
                            <Mail className="mr-1.5 h-4 w-4" />
                            Resend upload request
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
                            className={cn(EVIDENCE_CARD_BTN, DOC.btnOutline)}
                          >
                            <Upload className="mr-1.5 h-4 w-4" />
                            Upload for patient
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={saving}
                            onClick={() => openUploadRequestDialog(d, "request")}
                            className={cn(
                              EVIDENCE_CARD_BTN,
                              EVIDENCE_EMAIL_BTN_HOVER,
                              DOC.btnEmail,
                            )}
                          >
                            <Mail className="mr-1.5 h-4 w-4" />
                            Request re-upload
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={saving}
                            onClick={() =>
                              setConfirmAction({ doc: d, status: "verified" })
                            }
                            className={cn(
                              EVIDENCE_CARD_BTN,
                              "shadow-sm",
                              DOC.btnVerify,
                            )}
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
                            className={cn(EVIDENCE_CARD_BTN, DOC.btnReject)}
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
            </div>
          );
        })}
      </div>

      {viewing ? (
        <EvidenceViewerModal
          slot={viewing}
          allowReview={allowReview}
          docTheme={DOC}
          onClose={() => setViewing(null)}
          onReject={() => {
            setRejectionNote("");
            setSelectedTemplateId("");
            setConfirmAction({ doc: viewing, status: "rejected" });
          }}
          onUnverify={() => void unverifyDocument(viewing)}
          onVerify={() =>
            setConfirmAction({ doc: viewing, status: "verified" })
          }
          onRequestUpload={() => openUploadRequestDialog(viewing, "request")}
        />
      ) : null}

      {allowReview && (
        <Dialog
          open={uploadRequestAction !== null}
          onOpenChange={(open) =>
            !open && !saving && setUploadRequestAction(null)
          }
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {uploadRequestAction?.mode === "resend"
                  ? "Resend upload request?"
                  : "Request document upload?"}
              </DialogTitle>
              <DialogDescription>
                {uploadRequestAction
                  ? `Ask the patient to upload "${uploadRequestAction.doc.title}". They will see your message in Messages and can upload from My consultations.`
                  : null}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Message to patient{" "}
                <span className="font-normal normal-case">(optional)</span>
              </span>
              <textarea
                value={uploadRequestNote}
                onChange={(e) => setUploadRequestNote(e.target.value)}
                placeholder="e.g. Please upload a clearer full-body video in good lighting…"
                maxLength={2000}
                className="min-h-[5.5rem] w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setUploadRequestAction(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={saving}
                className={cn(DOC.btnEmail, "text-white hover:opacity-90")}
                onClick={() => void submitUploadRequest()}
              >
                {saving ? "Sending…" : "Send request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rejection reason
                  </span>
                  <Select
                    value={selectedTemplateId || "__custom__"}
                    onValueChange={(value) => {
                      if (value === "__custom__") {
                        setSelectedTemplateId("");
                        setRejectionNote("");
                        return;
                      }
                      applyTemplate(value);
                    }}
                  >
                    <SelectTrigger
                      aria-label="Rejection reason"
                      className="h-10 w-full font-medium"
                    >
                      <SelectValue placeholder="Custom message…" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      sideOffset={6}
                      align="start"
                    >
                      <SelectItem value="__custom__">Custom message…</SelectItem>
                      {slotTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          <span className="block whitespace-normal leading-snug">
                            {tpl.title}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email &amp; message to patient
                  </span>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Select a reason above or type your own message…"
                    className="min-h-[5.5rem] w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed"
                  />
                </div>
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

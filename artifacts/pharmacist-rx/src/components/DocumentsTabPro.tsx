import { useMemo } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { useGetConsultation } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  buildPrescriptionEvidenceSlots,
  countEvidenceSlots,
} from "@/lib/prescriptionEvidenceSlots";
import {
  outstandingEvidenceSlots,
  PrescriptionEvidenceGrid,
} from "@/components/PrescriptionEvidenceGrid";
import { RX_DOCUMENT as DOC } from "@/lib/orderTheme";

type VerificationRecord = { done: boolean; at?: string };

const PRESCRIPTION_SLOT_COUNT = 4;

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
  return (
    <div className="od2-tab-completion-footer flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {verification?.done
            ? `Marked done ${verification.at ? new Date(verification.at).toLocaleString("en-GB") : ""}`
            : "Complete this section when finished reviewing."}
        </div>
      </div>
      <div className="flex gap-2">
        {verification?.done && (
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium",
              DOC.btnOutline,
            )}
            onClick={onUndo}
          >
            Undo
          </button>
        )}
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center rounded-md px-4 text-sm font-semibold",
            DOC.btnVerify,
          )}
          onClick={onVerify}
        >
          {verification?.done ? "Update completion" : actionLabel}
        </button>
      </div>
    </div>
  );
}

export function DocumentsTabPro({
  consultationId,
  onUndo,
  onVerify,
  verification,
  onDocumentReview,
  onDocumentRequirementChange,
  onUploadLinkSent,
}: {
  consultationId: string;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
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
  const { data: c, isLoading } = useGetConsultation(consultationId);

  const slots = useMemo(
    () => (c ? buildPrescriptionEvidenceSlots(c) : []),
    [c],
  );
  const counts = useMemo(() => countEvidenceSlots(slots), [slots]);
  const outstanding = useMemo(
    () => outstandingEvidenceSlots(slots),
    [slots],
  );
  const uploadedCount = slots.filter((s) => s.status !== "not_uploaded").length;

  const markDocumentsDone = () => {
    if (uploadedCount === 0) {
      toast({
        title: "No documents uploaded yet",
        description:
          "The patient completes uploads during the weight-loss questionnaire at /treatments/weight-loss.",
        variant: "destructive",
      });
      return;
    }
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

  if (isLoading || !c) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-80 rounded-2xl bg-muted" />
          <div className="h-80 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={DOC.headerPanel}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Prescription evidence
            </div>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Documents
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Photos and files from the patient questionnaire. Verify each item
              before approving GLP-1 treatment.
            </p>
          </div>
          <div className="min-w-32 rounded-2xl border border-rx-approve-border bg-rx-approve-surface px-4 py-3 text-sm text-primary shadow-sm">
            <div className="text-2xl font-bold tracking-tight">
              {counts.verified}/{PRESCRIPTION_SLOT_COUNT}
            </div>
            <div className="text-xs opacity-80">verified</div>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${(counts.verified / PRESCRIPTION_SLOT_COUNT) * 100}%`,
            }}
          />
        </div>
      </div>

      <PrescriptionEvidenceGrid
        consultationId={consultationId}
        consultation={c}
        allowReview
        showHeader={false}
        onDocumentReview={onDocumentReview}
        onDocumentRequirementChange={onDocumentRequirementChange}
        onUploadLinkSent={onUploadLinkSent}
      />

      <div
        className={cn(
          "rounded-2xl border p-4 text-sm shadow-sm",
          outstanding.length === 0 && uploadedCount > 0
            ? DOC.alertReady
            : DOC.alertPending,
        )}
      >
        <div className="flex gap-2">
          {outstanding.length === 0 && uploadedCount > 0 ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-rx-cs" />
          )}
          <div className="font-semibold">
            {uploadedCount === 0
              ? "Waiting for patient uploads — all four document slots are shown below."
              : outstanding.length === 0
                ? "All uploaded documents are verified."
                : "Complete all uploaded document checks before approving."}
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
    </div>
  );
}

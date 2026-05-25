import { useMemo } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import { useGetConsultation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
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

type VerificationRecord = {
  verifiedBy: string;
  verifiedAt: string;
};

const PRESCRIPTION_SLOT_COUNT = 4;

function formatVerifiedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  if (verification) {
    return (
      <div className="rx-verified-banner">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {label} verified
              </div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Verified by {verification.verifiedBy}{" "}
                {formatVerifiedAt(verification.verifiedAt)}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onUndo}
            className="h-9 shrink-0 rounded-full border-border bg-card px-4 text-primary hover:bg-muted"
          >
            Undo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={onVerify}
      className="w-full min-h-12 whitespace-normal break-words bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-sm text-base"
    >
      <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" /> {actionLabel}
    </Button>
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
    note?: string;
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

      <div className="od2-tab-completion-footer pt-2">
        <VerificationAction
          actionLabel="Mark Documents as done"
          label="Documents"
          onUndo={onUndo}
          onVerify={markDocumentsDone}
          verification={verification}
        />
      </div>
    </div>
  );
}

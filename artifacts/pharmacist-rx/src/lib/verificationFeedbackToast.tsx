import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type VerifiableSectionId =
  | "clinical"
  | "consultation"
  | "documents"
  | "history"
  | "counselling"
  | "monitoring";

const SECTION_LABELS: Record<VerifiableSectionId, string> = {
  clinical: "Clinical Review",
  consultation: "Consultation",
  documents: "Documents",
  history: "Order History",
  counselling: "Patient Counselling",
  monitoring: "Monitoring",
};

function formatVerifiedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `at ${time} on ${date}`;
}

function VerificationToastContent({
  phase,
  sectionLabel,
  verifiedBy,
  verifiedAt,
}: {
  phase: "loading" | "success";
  sectionLabel: string;
  verifiedBy?: string;
  verifiedAt?: string;
}) {
  return (
    <div className="flex w-full items-start gap-3 pr-2">
      <div className="relative h-11 w-11 shrink-0">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm",
            phase === "loading" && "animate-pulse",
          )}
        >
          <img
            src="/favicon.svg"
            alt=""
            className="h-7 w-7 object-contain"
          />
        </div>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-xl transition-opacity",
            phase === "loading"
              ? "bg-foreground/15"
              : "pointer-events-none bg-transparent",
          )}
        >
          {phase === "loading" && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
        </div>
        {phase === "success" && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold leading-snug text-foreground">
          {phase === "loading"
            ? `Verifying ${sectionLabel}…`
            : `${sectionLabel} verified`}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {phase === "loading" ? (
            "Saving sign-off to this order…"
          ) : verifiedBy && verifiedAt ? (
            <>
              Verified by{" "}
              <span className="font-medium text-foreground">{verifiedBy}</span>{" "}
              {formatVerifiedAt(verifiedAt)}
            </>
          ) : (
            "Section marked complete on this order."
          )}
        </p>
      </div>
    </div>
  );
}

const VERIFICATION_TOAST_CLASS =
  "rounded-2xl border-y border-r border-border border-l-[5px] border-l-primary bg-rx-approve-surface p-4 shadow-lg";

/** Top-right toast: brand logo loads, then updates with what was verified. */
export function showVerificationFeedbackToast(
  section: VerifiableSectionId,
  verifiedBy: string,
): void {
  const sectionLabel = SECTION_LABELS[section] ?? section;
  const verifiedAt = new Date().toISOString();

  const { update, dismiss } = toast({
    className: VERIFICATION_TOAST_CLASS,
    title: (
      <VerificationToastContent
        phase="loading"
        sectionLabel={sectionLabel}
      />
    ),
  });

  window.setTimeout(() => {
    update({
      className: VERIFICATION_TOAST_CLASS,
      title: (
        <VerificationToastContent
          phase="success"
          sectionLabel={sectionLabel}
          verifiedBy={verifiedBy}
          verifiedAt={verifiedAt}
        />
      ),
    });
    window.setTimeout(() => dismiss(), 6000);
  }, 420);
}

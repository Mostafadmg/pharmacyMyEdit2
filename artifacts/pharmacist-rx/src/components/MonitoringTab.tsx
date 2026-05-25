import type { Consultation } from "@workspace/api-client-react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderMonitoringPanel } from "@/components/OrderMonitoringPanel";
import { cn } from "@/lib/utils";
import { RX } from "@/lib/orderTheme";

export type VerificationRecord = {
  verifiedBy: string;
  verifiedAt: string;
};

function formatVerifiedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
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
      <div className={cn(RX.panel, "p-4")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
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
            className="h-9 shrink-0 rounded-full border-border bg-background px-4 text-primary hover:bg-muted"
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
      className="w-full min-h-12 whitespace-normal break-words rounded-2xl px-4 py-3 text-base shadow-sm"
    >
      <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" /> {actionLabel}
    </Button>
  );
}

export function MonitoringTab({
  c,
  onUndo,
  onVerify,
  verification,
}: {
  c: Consultation;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-serif text-xl font-semibold tracking-tight text-secondary">
          Monitoring
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Weight trajectory and per-order clinical monitoring for weight-loss
          treatment.
        </p>
      </div>
      <OrderMonitoringPanel consultation={c} />
      <VerificationAction
        actionLabel="Mark Monitoring as done"
        label="Monitoring"
        onUndo={onUndo}
        onVerify={onVerify}
        verification={verification}
      />
    </div>
  );
}

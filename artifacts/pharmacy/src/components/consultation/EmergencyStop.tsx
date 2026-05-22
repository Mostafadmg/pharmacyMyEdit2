import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencyStopProps {
  title: string;
  message: string;
  severity: "urgent" | "emergency";
  onChangeAnswer?: () => void;
  className?: string;
}

export function EmergencyStop({
  title,
  message,
  severity,
  onChangeAnswer,
  className,
}: EmergencyStopProps) {
  const isEmergency = severity === "emergency";
  const callNumber = isEmergency ? "999" : "111";
  const callLabel = isEmergency ? "Call 999" : "Call NHS 111";

  return (
    <div
      className={cn(
        "rounded-3xl border-2 border-destructive/30 bg-destructive/5 p-6",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          If you are unwell right now
        </p>
        <a
          href={`tel:${callNumber}`}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-2xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors",
            "hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          {callLabel}
        </a>
        {onChangeAnswer && (
          <button
            type="button"
            onClick={onChangeAnswer}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center rounded-2xl border-2 border-border bg-card px-4 text-sm font-medium text-foreground transition-colors",
              "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            Change answer
          </button>
        )}
      </div>
    </div>
  );
}

export default EmergencyStop;

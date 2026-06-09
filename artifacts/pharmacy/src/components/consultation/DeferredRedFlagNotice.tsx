import { CheckCircle2 } from "lucide-react";
import {
  ORAL_DEFERRED_REJECTION_BODY,
  ORAL_DEFERRED_REJECTION_HEADING,
} from "@/lib/oralRedFlags";

/** Shown only after the consultation is complete — no mid-flow hints or reason list. */
export function DeferredRedFlagNotice() {
  return (
    <div
      className="rounded-xl border border-stone-200/90 bg-muted/30 p-4"
      data-testid="oral-deferred-rejection"
      role="status"
    >
      <div className="flex gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
        <div className="min-w-0 space-y-2">
          <p className="font-semibold text-secondary">
            {ORAL_DEFERRED_REJECTION_HEADING}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {ORAL_DEFERRED_REJECTION_BODY}
          </p>
        </div>
      </div>
    </div>
  );
}

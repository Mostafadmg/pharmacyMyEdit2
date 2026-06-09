import { AlertTriangle } from "lucide-react";
import type { OralRedFlag } from "@/lib/oralRedFlags";
import {
  ORAL_DEFERRED_REJECTION_BODY,
  ORAL_DEFERRED_REJECTION_HEADING,
  ORAL_RED_FLAG_INLINE_BODY,
  ORAL_RED_FLAG_INLINE_HEADING,
} from "@/lib/oralRedFlags";

export function DeferredRedFlagNotice({
  flags,
  variant = "inline",
}: {
  flags: readonly OralRedFlag[];
  variant?: "inline" | "final";
}) {
  if (flags.length === 0) return null;

  const heading =
    variant === "final"
      ? ORAL_DEFERRED_REJECTION_HEADING
      : ORAL_RED_FLAG_INLINE_HEADING;
  const body =
    variant === "final" ? ORAL_DEFERRED_REJECTION_BODY : ORAL_RED_FLAG_INLINE_BODY;

  return (
    <div
      className="rounded-xl border border-amber-200/90 bg-amber-50/90 p-4"
      data-testid={
        variant === "final" ? "oral-deferred-rejection" : "oral-red-flag-notice"
      }
      role="alert"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0 space-y-2">
          <p className="font-semibold text-secondary">{heading}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
          <ul className="space-y-1 text-sm text-secondary">
            {flags.map((flag) => (
              <li key={flag.id} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-700" />
                <span data-testid={`oral-red-flag-item-${flag.id}`}>
                  {flag.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

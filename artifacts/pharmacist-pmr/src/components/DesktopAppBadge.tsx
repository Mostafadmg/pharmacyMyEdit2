import { Monitor } from "lucide-react";
import { isDesktopApp } from "@/lib/electronBridge";

export function DesktopAppBadge() {
  if (!isDesktopApp()) return null;

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded border border-[var(--edm-mint)]/30 bg-[var(--edm-mint)]/15 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-primary/80"
      title="Running as Windows desktop application"
    >
      <Monitor className="h-2.5 w-2.5" />
      Desktop
    </span>
  );
}

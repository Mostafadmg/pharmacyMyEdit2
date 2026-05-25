import { ChevronRight, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionTone = "success" | "warning" | "danger" | "info" | "urgent";

const BASE =
  "group w-full text-left rounded-2xl border-y border-r border-l-[5px] p-4 shadow-sm transition-all flex items-center gap-3 hover:shadow-md";

const STYLES: Record<
  ActionTone | "successReady",
  { button: string; icon: string; title: string; sub: string; chevron: string }
> = {
  success: {
    button: cn(
      BASE,
      "border-l-rx-approve-stripe border-rx-approve-border bg-rx-approve-surface hover:bg-rx-approve-surface/90",
    ),
    icon: "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-primary text-primary-foreground",
    title: "text-sm font-semibold leading-tight text-primary",
    sub: "text-xs mt-0.5 leading-snug text-primary/70",
    chevron: "h-4 w-4 shrink-0 text-primary/50 group-hover:text-primary",
  },
  successReady: {
    button: cn(
      BASE,
      "border-l-rx-approve-stripe border-primary/80 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90",
    ),
    icon: "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-primary-foreground/20 text-primary-foreground",
    title: "text-sm font-semibold leading-tight text-primary-foreground",
    sub: "text-xs mt-0.5 leading-snug text-primary-foreground/80",
    chevron:
      "h-4 w-4 shrink-0 text-primary-foreground/60 group-hover:text-primary-foreground",
  },
  info: {
    button: cn(
      BASE,
      "border-l-rx-hold-stripe border-rx-hold-border bg-rx-hold-surface hover:bg-rx-hold-surface/90",
    ),
    icon: "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-rx-hold text-white",
    title: "text-sm font-semibold leading-tight text-rx-hold",
    sub: "text-xs mt-0.5 leading-snug text-rx-hold/70",
    chevron: "h-4 w-4 shrink-0 text-rx-hold/50 group-hover:text-rx-hold",
  },
  warning: {
    button: cn(
      BASE,
      "border-l-rx-cs-stripe border-rx-cs-border bg-rx-cs-surface hover:bg-rx-cs-surface/90",
    ),
    icon: "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-rx-cs text-white",
    title: "text-sm font-semibold leading-tight text-rx-cs",
    sub: "text-xs mt-0.5 leading-snug text-rx-cs/75",
    chevron: "h-4 w-4 shrink-0 text-rx-cs/50 group-hover:text-rx-cs",
  },
  danger: {
    button: cn(
      BASE,
      "border-l-rx-decline-stripe border-rx-decline-border bg-rx-decline-surface hover:bg-destructive/5",
    ),
    icon: "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-destructive text-destructive-foreground",
    title: "text-sm font-semibold leading-tight text-destructive",
    sub: "text-xs mt-0.5 leading-snug text-destructive/70",
    chevron: "h-4 w-4 shrink-0 text-destructive/50 group-hover:text-destructive",
  },
  urgent: {
    button: cn(
      BASE,
      "border-l-rx-urgent-stripe border-rx-urgent-border bg-rx-urgent-surface hover:bg-rx-urgent-surface/90",
    ),
    icon: "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-rx-urgent text-white",
    title: "text-sm font-semibold leading-tight text-rx-urgent",
    sub: "text-xs mt-0.5 leading-snug text-rx-urgent/70",
    chevron: "h-4 w-4 shrink-0 text-rx-urgent/50 group-hover:text-rx-urgent",
  },
};

export function ActionCard({
  tone,
  title,
  sub,
  onClick,
  IconCmp,
  active = false,
}: {
  tone: ActionTone;
  title: string;
  sub: string;
  onClick: () => void;
  IconCmp: typeof Pin;
  active?: boolean;
}) {
  const s =
    tone === "success" && active ? STYLES.successReady : STYLES[tone];

  return (
    <button type="button" onClick={onClick} className={s.button}>
      <div className={s.icon}>
        <IconCmp className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={s.title}>{title}</div>
        <div className={s.sub}>{sub}</div>
      </div>
      <ChevronRight className={s.chevron} />
    </button>
  );
}

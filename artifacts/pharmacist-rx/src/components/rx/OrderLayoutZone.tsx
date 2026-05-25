import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RX } from "@/lib/orderTheme";

export type OrderLayoutZoneVariant = "patient" | "review" | "actions";

const ZONE_STYLES: Record<
  OrderLayoutZoneVariant,
  {
    shell: string;
    header: string;
    step: string;
    title: string;
    subtitle: string;
    icon: string;
    body: string;
  }
> = {
  patient: {
    shell: cn(RX.card),
    header: RX.zoneHeader,
    step: "bg-secondary text-secondary-foreground",
    title: "text-foreground",
    subtitle: "text-muted-foreground",
    icon: "text-muted-foreground",
    body: "bg-card",
  },
  review: {
    shell: cn(RX.card, "shadow-md lg:shadow-lg"),
    header: "border-b border-border bg-secondary text-secondary-foreground",
    step: "bg-primary text-primary-foreground",
    title: "text-secondary-foreground",
    subtitle: "text-secondary-foreground/75",
    icon: "text-secondary-foreground/80",
    body: "bg-card",
  },
  actions: {
    shell: cn(RX.card, "bg-muted/20"),
    header: "border-b border-border bg-muted/60",
    step: "bg-secondary text-secondary-foreground",
    title: "text-foreground",
    subtitle: "text-muted-foreground",
    icon: "text-muted-foreground",
    body: "bg-card/80",
  },
};

export function OrderLayoutZone({
  variant,
  step,
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  bodyClassName,
}: {
  variant: OrderLayoutZoneVariant;
  step: 1 | 2 | 3;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const z = ZONE_STYLES[variant];

  return (
    <section
      aria-label={title}
      className={cn("flex min-w-0 flex-col overflow-hidden", z.shell, className)}
    >
      <header className={cn("flex items-center gap-3 px-4 py-3", z.header)}>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
            z.step,
          )}
        >
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4 shrink-0", z.icon)} aria-hidden />
            <h2 className={cn("text-sm font-bold tracking-tight", z.title)}>
              {title}
            </h2>
          </div>
          <p className={cn("mt-0.5 text-xs leading-snug", z.subtitle)}>
            {subtitle}
          </p>
        </div>
      </header>
      <div className={cn("flex-1 p-4", z.body, bodyClassName)}>{children}</div>
    </section>
  );
}

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLINICAL_STEP,
  LEGACY_THEME_TO_STEP,
  RX,
  type ClinicalStepAccent,
} from "@/lib/orderTheme";

export type ClinicalSectionTheme =
  | "emerald"
  | "rose"
  | "sky"
  | "amber"
  | "violet";

export const WEIGHT_LOSS_CLINICAL_REVIEW_NAV = [
  { id: "cr-order", step: 1, label: "Order", theme: "emerald" as const },
  { id: "cr-vitals", step: 2, label: "Vitals", theme: "rose" as const },
  { id: "cr-history", step: 3, label: "History", theme: "sky" as const },
  { id: "cr-scr", step: 4, label: "NHS SCR", theme: "amber" as const },
  { id: "cr-rx", step: 5, label: "Prescription", theme: "violet" as const },
];

export const GENERIC_CLINICAL_REVIEW_NAV = [
  { id: "cr-order", step: 1, label: "Order", theme: "emerald" as const },
  { id: "cr-safety", step: 2, label: "Safety", theme: "rose" as const },
  { id: "cr-clinical", step: 3, label: "Clinical", theme: "sky" as const },
  { id: "cr-scr", step: 4, label: "NHS SCR", theme: "amber" as const },
  { id: "cr-rx", step: 5, label: "Prescription", theme: "violet" as const },
];

export const CLINICAL_REVIEW_NAV = WEIGHT_LOSS_CLINICAL_REVIEW_NAV;

function stepAccent(theme: ClinicalSectionTheme): ClinicalStepAccent {
  return LEGACY_THEME_TO_STEP[theme] ?? "order";
}

export function ClinicalReviewNav({
  weightLoss = true,
}: {
  weightLoss?: boolean;
}) {
  const items = weightLoss
    ? WEIGHT_LOSS_CLINICAL_REVIEW_NAV
    : GENERIC_CLINICAL_REVIEW_NAV;

  return (
    <nav
      aria-label="Clinical review checklist"
      className={cn(RX.card, "px-3 py-3 sm:px-4")}
    >
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Review checklist - work top to bottom
      </p>
      <ol className="flex flex-wrap items-center gap-x-0.5 gap-y-2">
        {items.map((item, index) => {
          const accent = CLINICAL_STEP[stepAccent(item.theme)];
          return (
            <li key={item.id} className="flex items-center">
              {index > 0 ? (
                <ChevronRight
                  aria-hidden
                  className="mx-0.5 h-3.5 w-3.5 shrink-0 text-border"
                />
              ) : null}
              <a
                href={`#${item.id}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors",
                  accent.navLink,
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    accent.navStep,
                  )}
                >
                  {item.step}
                </span>
                <span className="text-xs font-semibold">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ClinicalReviewSection({
  step,
  theme,
  id,
  icon: Icon,
  eyebrow,
  title,
  description,
  badge,
  children,
  className,
  bodyClassName,
}: {
  step: number;
  theme: ClinicalSectionTheme;
  id?: string;
  icon?: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const accent = CLINICAL_STEP[stepAccent(theme)];

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <header className={cn("border-b border-border px-4 py-4 sm:px-5", RX.zoneHeader)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-4",
                accent.step,
              )}
            >
              {step}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.16em]",
                  accent.eyebrow,
                )}
              >
                {eyebrow}
              </p>
              <h3 className="mt-0.5 flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
                {Icon ? (
                  <Icon
                    className={cn("h-5 w-5 shrink-0", accent.icon)}
                    aria-hidden
                  />
                ) : null}
                {title}
              </h3>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {badge ? (
            <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              {badge}
            </span>
          ) : null}
        </div>
      </header>
      <div className={cn("px-4 py-4 sm:px-5 sm:py-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

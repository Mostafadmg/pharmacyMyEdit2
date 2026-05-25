/**
 * Order-detail UI tokens aligned with app CSS variables (primary, secondary, muted, highlight).
 * Use these instead of scattered emerald-* classes.
 */

export const RX = {
  /** Standard content card */
  card: "rounded-2xl border border-border bg-card shadow-sm",
  /** Soft panel background */
  panel: "rounded-2xl border border-border bg-muted/30",
  /** Active tab / primary CTA only */
  tabActive: "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/25",
  tabVerified: "bg-primary/8 text-primary border-primary/25 font-medium",
  tabIdle:
    "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
  verifiedPill: "bg-primary text-primary-foreground",
  zoneHeader: "border-b border-border bg-muted/50",
  /** Medication / product picker */
  pickerLabel: "text-[10px] font-semibold uppercase tracking-[0.14em] text-primary",
  pickerTrigger:
    "rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/30",
  pickerTriggerOpen: "border-primary/30 ring-2 ring-primary/20 shadow-md",
  pickerMenu:
    "overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl ring-1 ring-border/60",
  pickerOptionSelected: "bg-primary text-primary-foreground shadow-sm",
  pickerOptionIdle: "text-foreground hover:bg-primary/8",
} as const;

/** Clinical review step accents — one muted accent per step, primary green reserved for prescription */
export type ClinicalStepAccent =
  | "order"
  | "vitals"
  | "history"
  | "scr"
  | "prescription";

export const CLINICAL_STEP: Record<
  ClinicalStepAccent,
  {
    step: string;
    eyebrow: string;
    navStep: string;
    navLink: string;
    icon: string;
  }
> = {
  order: {
    step: "bg-secondary text-secondary-foreground ring-muted",
    eyebrow: "text-muted-foreground",
    navStep: "bg-secondary text-secondary-foreground",
    navLink: "hover:bg-muted text-foreground",
    icon: "text-muted-foreground",
  },
  vitals: {
    step: "bg-highlight text-highlight-foreground ring-border",
    eyebrow: "text-highlight",
    navStep: "bg-highlight text-highlight-foreground",
    navLink: "hover:bg-muted text-foreground",
    icon: "text-highlight",
  },
  history: {
    step: "bg-secondary text-secondary-foreground ring-border",
    eyebrow: "text-muted-foreground",
    navStep: "bg-secondary text-secondary-foreground",
    navLink: "hover:bg-muted text-foreground",
    icon: "text-muted-foreground",
  },
  scr: {
    step: "bg-highlight text-highlight-foreground ring-border",
    eyebrow: "text-highlight",
    navStep: "bg-highlight text-highlight-foreground",
    navLink: "hover:bg-muted text-foreground",
    icon: "text-highlight",
  },
  prescription: {
    step: "bg-primary text-primary-foreground ring-primary/20",
    eyebrow: "text-primary",
    navStep: "bg-primary text-primary-foreground",
    navLink: "hover:bg-accent text-primary",
    icon: "text-primary",
  },
};

/** Documents tab — aligned with rx-approve / rx-cs / rx-decline semantic tokens */
export const RX_DOCUMENT = {
  filterVerified:
    "bg-rx-approve-surface text-primary border-rx-approve-border",
  filterPending: "bg-rx-cs-surface text-rx-cs border-rx-cs-border",
  filterRejected:
    "bg-rx-decline-surface text-destructive border-rx-decline-border",
  filterEmpty: "bg-muted text-muted-foreground border-border",
  card: "rounded-2xl border bg-card shadow-sm overflow-hidden",
  cardVerified: "border-rx-approve-border",
  cardPending: "border-rx-cs-border",
  cardRejected: "border-rx-decline-border",
  cardEmpty: "border-border",
  previewEmpty: "bg-muted/40 border-b border-border",
  previewFilled: "bg-muted/60 border-b border-border",
  sectionDivider: "border-t border-border/70",
  btnOutline:
    "rounded-xl border-border bg-card text-foreground shadow-sm hover:bg-muted",
  btnVerify: "rounded-xl bg-primary text-primary-foreground hover:bg-primary/90",
  btnReject:
    "rounded-xl border-rx-decline-border bg-card text-destructive shadow-sm hover:bg-rx-decline-surface",
  btnEmail:
    "rounded-xl border-rx-cs-border bg-rx-cs-surface text-rx-cs hover:bg-rx-cs-surface/80",
  verifiedBanner:
    "border-rx-approve-border bg-rx-approve-surface text-primary",
  rejectedBanner:
    "border-rx-decline-border bg-rx-decline-surface text-destructive",
  alertReady: "border-rx-approve-border bg-rx-approve-surface text-foreground",
  alertPending: "border-rx-cs-border bg-rx-cs-surface text-foreground",
  headerPanel: "rounded-2xl border border-border bg-card p-5 shadow-sm",
  requiredBadge: "bg-destructive/10 text-destructive",
  optionalBadge: "bg-rx-hold-surface text-rx-hold",
  optionalNotRequired: "bg-muted text-muted-foreground",
} as const;

/** Map legacy theme names to step accents */
export const LEGACY_THEME_TO_STEP: Record<
  string,
  ClinicalStepAccent
> = {
  emerald: "order",
  rose: "vitals",
  sky: "history",
  amber: "scr",
  violet: "prescription",
};

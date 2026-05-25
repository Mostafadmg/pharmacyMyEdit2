/** Picker UI tokens — aligned with pharmacist-rx orderTheme picker styles. */
export const PICKER = {
  pickerLabel: "text-[10px] font-semibold uppercase tracking-[0.14em] text-primary",
  pickerTrigger:
    "cursor-pointer rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/30",
  pickerTriggerOpen: "border-primary/30 ring-2 ring-primary/20 shadow-md",
  pickerMenu:
    "overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl ring-1 ring-border/60",
  pickerOptionSelected: "bg-primary text-primary-foreground shadow-sm",
  pickerOptionIdle: "text-foreground hover:bg-primary/8 cursor-pointer",
} as const;

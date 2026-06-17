import type { PrescriptionItem } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { hasDisplayValue } from "@/lib/pmrStatus";
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  MessageSquare,
  Pencil,
  Pill,
  ShoppingBasket,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ItemDecision = "accept" | "reject" | null;
export type StepStatus = "complete" | "pending" | "alert";

export type EditablePrescriptionItem = PrescriptionItem & {
  itemNote?: string;
};

export type MedicationInteraction = {
  severity: "contraindicated" | "major" | "moderate" | "minor";
  count: number;
  label: string;
};

export type DrugsTagWarning = {
  message: string;
  accepted?: boolean;
};

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm"
      aria-hidden
    >
      {n}
    </span>
  );
}

/** Vertical rail: numbered circle + connector line to next step. */
export function TimelineStep({
  step,
  isLast,
  children,
}: {
  step: number;
  status?: StepStatus;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-4 items-stretch">
      <div className="relative flex flex-col items-center w-9 shrink-0">
        {!isLast && (
          <div
            className="absolute left-1/2 top-[18px] bottom-0 w-px -translate-x-1/2 bg-border"
            aria-hidden
          />
        )}
        <div className="relative z-10 pt-0.5 pb-1">
          <StepBadge n={step} />
        </div>
      </div>
      <div className="flex-1 min-w-0 pb-6">{children}</div>
    </div>
  );
}

function TimelineCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function DetailCell({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children && !hasDisplayValue(value)) return null;

  return (
    <div className={cn("min-w-0 py-2", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 leading-tight mb-1">
        {label}
      </p>
      {children ?? (
        <p className="text-sm text-foreground leading-snug break-words">
          {value!.trim()}
        </p>
      )}
    </div>
  );
}

function MetaChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground leading-snug break-words">
        {value}
      </p>
    </div>
  );
}

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PillBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold leading-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

function ActionLink({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-xs font-semibold underline underline-offset-2 shrink-0",
        active ? "text-primary" : "text-foreground hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

/** Section 1 — FP10 prescription header + summary chips. */
export function GpPrescribingSection({
  step,
  isLast,
  rxDate,
  itemCount,
  treatmentType,
  conditionName,
}: {
  step: number;
  isLast?: boolean;
  rxDate: string;
  prescriptionId?: string;
  itemCount: number;
  treatmentType: string;
  conditionName?: string | null;
  gpSurgery?: string | null;
  gpName?: string | null;
  gpAddress?: string | null;
  gpPhone?: string | null;
  prescriberNote?: string | null;
}) {
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <TimelineStep step={step} isLast={isLast}>
      <TimelineCard>
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-[var(--edm-mint)]/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-primary leading-tight">
                FP10
              </h2>
              {hasDisplayValue(conditionName) && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {conditionName}
                </p>
              )}
            </div>
          </div>
          <HeaderIconButton label="Prescription note">
            <MessageSquare className="h-3.5 w-3.5" />
          </HeaderIconButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 px-4 py-3">
          <MetaChip label="Date of Rx" value={rxDate} />
          <MetaChip label="Number of items" value={itemLabel} />
          <MetaChip label="Treatment type" value={treatmentType} />
        </div>
      </TimelineCard>
    </TimelineStep>
  );
}

/** Section 2 — Patient match header + adaptive detail grid. */
export function PatientMatchSection({
  step,
  isLast,
  patientName,
  dateOfBirth,
  sex,
  nhsNumber,
  address,
  allergies,
  surgery,
  patientMatched,
  showDeliveryBadge,
  onPatientNameClick,
}: {
  step: number;
  isLast?: boolean;
  patientName: string;
  dateOfBirth?: string;
  sex?: string;
  nhsNumber?: string;
  address?: string;
  allergies?: string | null;
  surgery?: string | null;
  patientMatched: boolean;
  showDeliveryBadge?: boolean;
  onPatientNameClick?: () => void;
}) {
  const allergyText = allergies?.trim();
  const allergyKnown = hasDisplayValue(allergyText);
  const allergyUnknown =
    !allergyKnown ||
    allergyText!.toLowerCase() === "unknown" ||
    allergyText!.toLowerCase() === "not recorded";

  const detailFields = [
    hasDisplayValue(dateOfBirth) && { label: "Date of birth", value: dateOfBirth! },
    hasDisplayValue(sex) && sex!.toLowerCase() !== "unknown" && { label: "Sex", value: sex! },
    hasDisplayValue(nhsNumber) && { label: "NHS number", value: nhsNumber! },
    hasDisplayValue(address) && { label: "Address", value: address!, wide: true },
    hasDisplayValue(surgery) && { label: "GP surgery", value: surgery! },
  ].filter(Boolean) as Array<{ label: string; value: string; wide?: boolean }>;

  return (
    <TimelineStep step={step} isLast={isLast}>
      <TimelineCard>
        <div className="px-4 pt-3.5 pb-3 border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 shrink-0 mt-0.5">
                <User className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="text-base font-semibold text-primary hover:underline underline-offset-2 text-left truncate"
                    onClick={onPatientNameClick}
                  >
                    {patientName}
                  </button>
                  {patientMatched ? (
                    <PillBadge className="border-primary/30 text-primary bg-[var(--edm-mint)]/40">
                      Full match
                    </PillBadge>
                  ) : (
                    <PillBadge className="border-amber-300/60 text-amber-800 bg-amber-50 dark:border-amber-700/50 dark:text-amber-200 dark:bg-amber-950/30">
                      Unmatched
                    </PillBadge>
                  )}
                </div>
                {showDeliveryBadge !== false && (
                  <PillBadge className="mt-2 border-sky-200 text-sky-700 bg-sky-50 dark:border-sky-800 dark:text-sky-200 dark:bg-sky-950/40">
                    Delivery
                  </PillBadge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <HeaderIconButton label="Patient message">
                <MessageSquare className="h-3.5 w-3.5" />
              </HeaderIconButton>
              <HeaderIconButton label="Edit patient">
                <Pencil className="h-3.5 w-3.5" />
              </HeaderIconButton>
            </div>
          </div>
        </div>

        {detailFields.length > 0 && (
          <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
            {detailFields.map((field) => (
              <DetailCell
                key={field.label}
                label={field.label}
                value={field.value}
                className={field.wide ? "sm:col-span-2" : undefined}
              />
            ))}
          </div>
        )}

        <div className="px-4 pb-3 pt-1">
          <div
            className={cn(
              "rounded-lg px-3 py-2.5",
              allergyUnknown
                ? "bg-amber-50/80 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40"
                : "bg-muted/40 border border-border/40",
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 mb-1">
              Allergies
            </p>
            <div className="flex items-start gap-2">
              {allergyUnknown && (
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 dark:text-amber-400" />
              )}
              <p className="text-sm text-foreground leading-snug">
                {allergyKnown && !allergyUnknown
                  ? allergyText
                  : "Not recorded — confirm with patient"}
              </p>
            </div>
          </div>
        </div>
      </TimelineCard>
    </TimelineStep>
  );
}

function severityLabel(severity: MedicationInteraction["severity"]): string {
  switch (severity) {
    case "contraindicated":
      return "Contraindicated";
    case "major":
      return "High interaction";
    case "moderate":
      return "Moderate interaction";
    case "minor":
      return "Minor interaction";
    default:
      return "Interaction";
  }
}

function medicationDisplayName(item: EditablePrescriptionItem): {
  name: string;
  subtitle?: string;
} {
  const name = item.name?.trim() || "Unnamed item";
  const subtitleParts = [item.strength, item.form].filter((p) => p?.trim());
  return {
    name,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined,
  };
}

/** Section 3+ — Medication with optional drugs tag + interaction rows. */
export function MedicationCheckSection({
  step,
  isLast,
  item,
  decision,
  onDecision,
  onEdit,
  editing,
  onSaveEdit,
  onCancelEdit,
  draftQty,
  draftSig,
  onDraftQty,
  onDraftSig,
  interactions,
  drugsTag,
  onAcceptDrugsTag,
}: {
  step: number;
  isLast?: boolean;
  item: EditablePrescriptionItem;
  decision: ItemDecision;
  onDecision: (d: "accept" | "reject") => void;
  onEdit: () => void;
  editing: boolean;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  draftQty: string;
  draftSig: string;
  onDraftQty: (v: string) => void;
  onDraftSig: (v: string) => void;
  interactions?: MedicationInteraction[];
  drugsTag?: DrugsTagWarning | null;
  onAcceptDrugsTag?: () => void;
}) {
  const { name: drugName, subtitle } = medicationDisplayName(item);
  const rejected = decision === "reject";
  const accepted = decision === "accept";
  const primaryInteraction = interactions?.[0];
  const interactionCount =
    interactions?.reduce((sum, i) => sum + i.count, 0) ?? 0;
  const hasQty = hasDisplayValue(item.quantity);
  const hasSig = hasDisplayValue(item.sig);
  const hasDuration = hasDisplayValue(item.duration);

  return (
    <TimelineStep step={step} isLast={isLast}>
      <TimelineCard>
        <div
          className={cn(
            "px-4 pt-3.5 pb-3 border-b border-border/40",
            accepted && "bg-[var(--edm-mint)]/15",
            rejected && "bg-destructive/5",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5",
                  rejected ? "bg-destructive/10" : "bg-primary/10",
                )}
              >
                <Pill
                  className={cn(
                    "h-4 w-4",
                    rejected ? "text-destructive" : "text-primary",
                  )}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-base font-semibold text-primary leading-snug",
                    rejected && "line-through text-muted-foreground",
                  )}
                >
                  {drugName}
                </p>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                    {subtitle}
                  </p>
                )}
                {rejected && (
                  <PillBadge className="mt-2 border-destructive/40 text-destructive bg-destructive/10">
                    Clinically unsuitable
                  </PillBadge>
                )}
                {accepted && !rejected && (
                  <PillBadge className="mt-2 border-primary/30 text-primary bg-[var(--edm-mint)]/50">
                    Accepted
                  </PillBadge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <HeaderIconButton label="Item note">
                <MessageSquare className="h-3.5 w-3.5" />
              </HeaderIconButton>
              <HeaderIconButton label="Basket">
                <span className="relative inline-flex">
                  <ShoppingBasket
                    className={cn(
                      "h-3.5 w-3.5",
                      rejected ? "text-destructive" : "text-amber-500",
                    )}
                  />
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-white">
                    1
                  </span>
                </span>
              </HeaderIconButton>
              {editing ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={onSaveEdit}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <HeaderIconButton label="Edit item" onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </HeaderIconButton>
              )}
            </div>
          </div>
        </div>

        {(editing || hasQty || hasSig || hasDuration) && (
          <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-b border-border/30">
            {(editing || hasQty) && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 mb-1">
                  Quantity
                </p>
                {editing ? (
                  <Input
                    value={draftQty}
                    onChange={(e) => onDraftQty(e.target.value)}
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {item.quantity}
                  </p>
                )}
              </div>
            )}
            {(editing || hasSig) && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 mb-1">
                  Dose
                </p>
                {editing ? (
                  <Input
                    value={draftSig}
                    onChange={(e) => onDraftSig(e.target.value)}
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">
                    {item.sig}
                  </p>
                )}
              </div>
            )}
            {hasDuration && !editing && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80 mb-1">
                  Duration
                </p>
                <p className="text-sm text-muted-foreground">{item.duration}</p>
              </div>
            )}
          </div>
        )}

        {drugsTag && (
          <div className="flex items-start justify-between gap-3 px-4 py-3 bg-[var(--edm-mint)]/35 border-t border-[var(--edm-mint)]/50">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <PillBadge className="border-primary/30 text-primary bg-card shrink-0 mt-0.5">
                Drugs tag
              </PillBadge>
              <p className="text-sm text-foreground leading-relaxed">
                {drugsTag.message}
              </p>
            </div>
            <ActionLink
              onClick={onAcceptDrugsTag}
              active={drugsTag.accepted}
            >
              Accept
            </ActionLink>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-muted/30 border-t border-border/40">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {primaryInteraction ? (
              <>
                <PillBadge className="border-primary/30 text-primary bg-[var(--edm-mint)]/50">
                  Interaction
                </PillBadge>
                <span className="text-sm text-foreground">
                  {primaryInteraction.label ||
                    severityLabel(primaryInteraction.severity)}
                </span>
                <Badge
                  variant="outline"
                  className="h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full"
                >
                  {interactionCount || primaryInteraction.count}
                </Badge>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                No interactions flagged
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ActionLink
              onClick={() => onDecision("accept")}
              active={decision === "accept"}
            >
              Accept
            </ActionLink>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-semibold gap-1 px-3",
                    decision === "reject" &&
                      "border-destructive text-destructive bg-destructive/10",
                  )}
                >
                  Do not dispense
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                <DropdownMenuItem onClick={() => onDecision("reject")}>
                  Mark clinically unsuitable
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDecision("reject")}>
                  Out of stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDecision("reject")}>
                  Query prescriber
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TimelineCard>
    </TimelineStep>
  );
}

export function ClinicalCheckToolbar({
  submitting,
  canComplete,
  anyRejected,
  onBack,
  onPrint,
  onSkip,
  onSaveExit,
  onComplete,
  onPark,
}: {
  submitting: boolean;
  canComplete: boolean;
  anyRejected: boolean;
  onBack: () => void;
  onPrint: () => void;
  onSkip: () => void;
  onSaveExit: () => void;
  onComplete: () => void;
  onPark: () => void;
}) {
  return (
    <footer className="shrink-0 sticky bottom-0 z-10 w-full border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onBack}
          disabled={submitting}
        >
          Return to board
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onPrint}
          disabled={submitting}
        >
          Print prescription
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={onSkip}
          disabled={submitting}
        >
          Skip
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onSaveExit}
          disabled={submitting}
        >
          Save &amp; exit
        </Button>
        {anyRejected ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="shrink-0"
            disabled={submitting}
            onClick={onPark}
          >
            Park prescription
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            disabled={submitting || !canComplete}
            onClick={onComplete}
          >
            Complete check → Pick
          </Button>
        )}
      </div>
    </footer>
  );
}

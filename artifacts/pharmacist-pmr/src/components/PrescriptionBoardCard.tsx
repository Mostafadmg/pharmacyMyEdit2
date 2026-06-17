import { Link } from "wouter";

import type { Consultation } from "@workspace/api-client-react";

import { MessageSquare, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  BOARD_COLUMN_BORDER,
  formatRelativeTime,
  isControlledDrug,
  medicationPickLine,
  patientAddressOrUndefined,
  prescriptionSourceCode,
  type BoardColumn,
} from "@/lib/pmrStatus";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tag = { label: string; variant: "blue" | "red" | "orange" };

function buildTags(c: Consultation): Tag[] {
  const tags: Tag[] = [];
  const addr = patientAddressOrUndefined(c)?.toLowerCase() ?? "";
  if (
    addr.includes("court") ||
    addr.includes("care home") ||
    addr.includes("nursing") ||
    addr.includes("residential")
  ) {
    tags.push({ label: "Care home", variant: "blue" });
  }
  if (c.deliveryAddress || c.deliveryAddressLine1) {
    tags.push({ label: "Delivery", variant: "blue" });
  }
  if (c.hasRedFlag) tags.push({ label: "Urgent", variant: "red" });
  if (isControlledDrug(c)) tags.push({ label: "CD", variant: "red" });
  return tags.slice(0, 2);
}

const TAG_STYLES: Record<Tag["variant"], string> = {
  blue: "border-primary/20 bg-[var(--edm-mint)]/40 text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-[var(--edm-mint)]",
  red: "border-red-200/80 bg-red-50/90 text-red-800 dark:border-red-800/40 dark:bg-red-950/35 dark:text-red-200",
  orange:
    "border-amber-200/80 bg-amber-50/90 text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/35 dark:text-amber-200",
};

function CardMenu({ id }: { id: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground shrink-0 rounded-md hover:bg-muted/50 transition-colors dark:text-white/35 dark:hover:text-white/70"
          aria-label="Prescription actions"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={2}
        className="w-[9.5rem] min-w-0 p-0.5 rounded-md shadow-md border-border/70"
      >
        <DropdownMenuItem
          asChild
          className="text-[11px] py-1.5 px-2 rounded-sm font-medium"
        >
          <Link href={`/prescription/${id}`}>Open prescription</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PrescriptionBoardCard({
  consultation,
  column = "inbox",
  variant = "full",
  selected = false,
  onOpen,
}: {
  consultation: Consultation;
  column?: BoardColumn;
  variant?: "full" | "compact";
  selected?: boolean;
  onOpen?: () => void;
}) {
  const itemCount = consultation.prescriptionItems?.length ?? 0;
  const tags = buildTags(consultation);
  const ts = formatRelativeTime(
    consultation.reviewedAt ?? consultation.updatedAt,
  );
  const source = prescriptionSourceCode(consultation);
  const hasComments = Boolean(consultation.pharmacistNote?.trim());
  const medication = medicationPickLine(consultation);
  const ref = consultation.consultationNumber ?? consultation.id.slice(0, 8);
  const borderAccent = BOARD_COLUMN_BORDER[column];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      className={cn(
        "pmr-board-card group border-l-[3px]",
        borderAccent,
        selected && "pmr-board-card--selected",
        variant === "compact" ? "px-2.5 py-2" : "px-3 py-3",
      )}
      data-testid={`board-card-${consultation.id}`}
      aria-selected={selected}
    >
      <div className="flex items-start gap-2">
        <span className="shrink-0 mt-0.5 rounded-md bg-muted/70 px-1.5 py-0.5 text-[9px] font-bold text-center text-muted-foreground tracking-tight dark:bg-white/10 dark:text-white/50">
          {source}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[13px] leading-snug text-primary dark:text-[#9ec5ff]">
            {consultation.patientName}
          </p>
          {medication && (
            <p className="mt-1 text-[11px] text-foreground/90 leading-snug line-clamp-2 dark:text-white/80">
              {medication}
            </p>
          )}
        </div>
        {itemCount > 1 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/90 px-1 text-[9px] font-bold text-primary-foreground shrink-0 dark:bg-primary">
            {itemCount}
          </span>
        )}
        <CardMenu id={consultation.id} />
      </div>

      {variant === "full" && (
        <>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t.label}
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide border",
                    TAG_STYLES[t.variant],
                  )}
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-border/40 dark:border-white/8">
            <span className="text-[9px] font-mono text-muted-foreground/80 truncate dark:text-white/35">
              {ref}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {hasComments && (
                <MessageSquare className="h-3 w-3 text-muted-foreground dark:text-white/40" />
              )}
              <span className="text-[10px] text-muted-foreground/80 tabular-nums dark:text-white/35">
                {ts}
              </span>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export function EmptyBoardSlot() {
  return <div className="pmr-board-empty-slot" aria-hidden />;
}

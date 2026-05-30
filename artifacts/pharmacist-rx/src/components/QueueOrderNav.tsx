import { Link } from "wouter";
import { ChevronLeft, ChevronRight, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildOrderDetailHref,
  buildQueueListHref,
  QUEUE_CATEGORY_LABELS,
  type QueueContext,
} from "@/lib/queueFilters";

export function QueueOrderNav({
  ctx,
  index,
  total,
  prevId,
  nextId,
  currentSearch,
}: {
  ctx: QueueContext;
  index: number;
  total: number;
  prevId: string | null;
  nextId: string | null;
  currentSearch: string;
}) {
  const queueLabel = QUEUE_CATEGORY_LABELS[ctx.category];
  const position =
    index >= 0 && total > 0 ? `${index + 1} of ${total}` : null;
  const remaining = index >= 0 && total > 0 ? total - index - 1 : 0;

  return (
    <nav
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4"
      aria-label="Queue navigation"
      data-testid="queue-order-nav"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Link
          href={buildQueueListHref(ctx)}
          className="rx-back !rounded-full !py-1.5 !text-xs"
          data-testid="link-back-queue"
        >
          <ChevronLeft className="h-4 w-4" />
          {queueLabel}
        </Link>
        {position ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <ListOrdered className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="tabular-nums text-foreground">{position}</span>
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        {prevId ? (
          <Link
            href={buildOrderDetailHref(prevId, ctx, currentSearch)}
            className="rx-btn-outline !text-xs"
            data-testid="link-queue-prev"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : (
          <span
            className={cn(
              "rx-btn-outline !text-xs pointer-events-none opacity-40",
            )}
            aria-disabled
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        )}
        {nextId ? (
          <Link
            href={buildOrderDetailHref(nextId, ctx, currentSearch)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            data-testid="link-queue-next"
          >
            Next
            {remaining > 0 ? (
              <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                {remaining} left
              </span>
            ) : null}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground pointer-events-none opacity-40",
            )}
            aria-disabled
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}

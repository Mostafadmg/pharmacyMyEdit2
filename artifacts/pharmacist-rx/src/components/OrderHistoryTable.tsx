import { Link } from "wouter";
import { CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  formatHistoryMedication,
  formatOrderHistoryDate,
  orderHistoryDisplayStatus,
  orderRefFromId,
} from "@/lib/orderHistory";

/** Mint row + thick forest-green left stripe (Order History / Clinical Review). */
export const orderHistoryCurrentRowClass =
  "bg-rx-approve-surface/70 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-emerald-600 before:rounded-r";

/** Same highlight for HTML table rows (`<tr>`). */
export const orderHistoryCurrentTableRowClass =
  "bg-rx-approve-surface/70 border-l-4 border-l-emerald-600";

export const orderHistoryCurrentBadgeClass =
  "mt-1 inline-flex rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800";

const ORDER_HISTORY_GRID =
  "grid gap-3 px-4 py-4 sm:items-center grid-cols-1 sm:grid-cols-[minmax(7rem,1fr)_minmax(6rem,0.7fr)_minmax(0,2.2fr)_minmax(9rem,1fr)_4.5rem]";

export function HistoryStatusBadge({
  status,
}: {
  status: ReturnType<typeof orderHistoryDisplayStatus>;
}) {
  if (status.tone === "fulfilled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-rx-approve-surface px-2.5 py-1 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        {status.label}
      </span>
    );
  }
  if (status.tone === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-sky-200">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        {status.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-foreground">
      {status.label}
    </span>
  );
}

export function OrderHistoryTable({
  orders,
  currentConsultationId,
  linkTab = "history",
  emptyMessage = "No orders to show.",
}: {
  orders: Consultation[];
  currentConsultationId: string;
  linkTab?: string;
  emptyMessage?: string;
}) {
  if (orders.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="hidden sm:grid sm:grid-cols-[minmax(7rem,1fr)_minmax(6rem,0.7fr)_minmax(0,2.2fr)_minmax(9rem,1fr)_4.5rem] gap-3 px-4 py-3 border-b border-border bg-muted/40/80">
        {["ORDER #", "DATE", "MEDICATION", "STATUS", ""].map((col) => (
          <span
            key={col}
            className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
          >
            {col}
          </span>
        ))}
      </div>

      <ul className="divide-y divide-stone-100">
        {orders.map((order) => {
          const isCurrent = order.id === currentConsultationId;
          const status = orderHistoryDisplayStatus(order.status);
          const ref = orderRefFromId(order.id);

          return (
            <li
              key={order.id}
              className={cn("relative", isCurrent && orderHistoryCurrentRowClass)}
            >
              <div className={ORDER_HISTORY_GRID}>
                <div className="min-w-0">
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Order #
                  </span>
                  <div className="font-mono text-base font-bold text-foreground tabular-nums">
                    {ref}
                  </div>
                  {isCurrent ? (
                    <span className={orderHistoryCurrentBadgeClass}>current</span>
                  ) : null}
                </div>

                <div className="min-w-0">
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Date
                  </span>
                  <span className="text-sm text-foreground tabular-nums">
                    {formatOrderHistoryDate(order.createdAt)}
                  </span>
                </div>

                <div className="min-w-0 sm:col-span-1">
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Medication
                  </span>
                  <p className="text-sm font-medium text-foreground leading-snug">
                    {formatHistoryMedication(order)}
                  </p>
                </div>

                <div className="min-w-0">
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Status
                  </span>
                  <HistoryStatusBadge status={status} />
                </div>

                <div className="flex sm:justify-end items-center">
                  {isCurrent ? (
                    <span className="text-sm italic text-muted-foreground font-medium">
                      Viewing
                    </span>
                  ) : (
                    <Link
                      href={`/orders/${order.id}?tab=${linkTab}`}
                      className="inline-flex items-center gap-0.5 text-sm font-semibold text-foreground hover:text-emerald-800 transition-colors"
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

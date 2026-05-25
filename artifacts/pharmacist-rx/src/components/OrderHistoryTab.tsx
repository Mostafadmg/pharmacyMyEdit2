import { useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  filterOrdersByHistoryTab,
  formatHistoryMedication,
  formatOrderHistoryDate,
  orderHistoryDisplayStatus,
  orderRefFromId,
  sortOrdersForHistory,
  type OrderHistoryFilter,
} from "@/lib/orderHistory";

type VerificationRecord = {
  verifiedBy: string;
  verifiedAt: string;
};

const FILTERS: OrderHistoryFilter[] = [
  "All",
  "Fulfilled",
  "Unfulfilled",
  "Pending",
  "Cancelled",
];

function HistoryStatusBadge({
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

function VerificationAction({
  actionLabel,
  label,
  onUndo,
  onVerify,
  verification,
}: {
  actionLabel: string;
  label: string;
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  if (verification) {
    return (
      <div className="rounded-2xl border border-border bg-rx-approve-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-emerald-950">
                {label} marked as done
              </div>
              <div className="mt-1 text-sm leading-relaxed text-emerald-800">
                by {verification.verifiedBy} |{" "}
                {new Date(verification.verifiedAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onUndo}
            className="h-9 shrink-0 rounded-full border border-border bg-card px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Undo
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onVerify}
      className="w-full min-h-12 whitespace-normal wrap-break-word bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700 rounded-2xl shadow-sm text-base font-semibold flex items-center justify-center gap-2"
    >
      <CheckCircle2 className="h-4 w-4 shrink-0" /> {actionLabel}
    </button>
  );
}

export function OrderHistoryTab({
  currentConsultationId,
  orders,
  onUndo,
  onVerify,
  verification,
}: {
  currentConsultationId: string;
  orders: Consultation[];
  onUndo: () => void;
  onVerify: () => void;
  verification?: VerificationRecord;
}) {
  const [filter, setFilter] = useState<OrderHistoryFilter>("All");

  const sorted = useMemo(() => sortOrdersForHistory(orders), [orders]);
  const filtered = useMemo(
    () => filterOrdersByHistoryTab(sorted, filter),
    [sorted, filter],
  );

  const hasPriorOrders = sorted.length > 1;
  const orderCount = sorted.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground tracking-tight">
            Order history
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {orderCount} order{orderCount === 1 ? "" : "s"}
            {hasPriorOrders ? "" : " | first order for this patient"}
          </p>
        </div>
        {hasPriorOrders && (
          <div
            className="inline-flex flex-wrap rounded-full border border-border bg-muted/90 p-1 gap-0.5 shrink-0"
            role="tablist"
            aria-label="Filter orders"
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasPriorOrders ? (
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

          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No orders match this filter.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {filtered.map((order) => {
                const isCurrent = order.id === currentConsultationId;
                const status = orderHistoryDisplayStatus(order.status);
                const ref = orderRefFromId(order.id);

                return (
                  <li
                    key={order.id}
                    className={cn(
                      "relative",
                      isCurrent &&
                        "bg-rx-approve-surface/70 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-emerald-600 before:rounded-r",
                    )}
                  >
                    <div
                      className={cn(
                        "grid gap-3 px-4 py-4 sm:items-center",
                        "grid-cols-1 sm:grid-cols-[minmax(7rem,1fr)_minmax(6rem,0.7fr)_minmax(0,2.2fr)_minmax(9rem,1fr)_4.5rem]",
                      )}
                    >
                      <div className="min-w-0">
                        <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                          Order #
                        </span>
                        <div className="font-mono text-base font-bold text-foreground tabular-nums">
                          {ref}
                        </div>
                        {isCurrent && (
                          <span className="mt-1 inline-flex rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                            current
                          </span>
                        )}
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
                            href={`/orders/${order.id}?tab=history`}
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
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40/50 py-12 px-6 text-center">
          <p className="text-sm font-medium text-foreground">
            No previous orders for this patient
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            This is their first consultation on record. Previous orders will appear
            here once they place another.
          </p>
        </div>
      )}

      <div className="border-t border-dashed border-border pt-5">
        <VerificationAction
          actionLabel="Mark Order History as done"
          label="Order History"
          onUndo={onUndo}
          onVerify={onVerify}
          verification={verification}
        />
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OrderHistoryTable } from "@/components/OrderHistoryTable";
import {
  filterOrdersByHistoryTab,
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

function formatVerifiedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      <div className="rx-verified-banner">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {label} verified
              </div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Verified by {verification.verifiedBy}{" "}
                {formatVerifiedAt(verification.verifiedAt)}
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onUndo}
            className="h-9 shrink-0 rounded-full border-border bg-card px-4 text-primary hover:bg-muted"
          >
            Undo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={onVerify}
      className="w-full min-h-12 whitespace-normal break-words bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-sm text-base"
    >
      <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" /> {actionLabel}
    </Button>
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
        filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
            No orders match this filter.
          </div>
        ) : (
          <OrderHistoryTable
            orders={filtered}
            currentConsultationId={currentConsultationId}
            linkTab="history"
          />
        )
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

      <div className="od2-tab-completion-footer pt-2">
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

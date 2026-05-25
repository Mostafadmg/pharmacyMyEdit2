import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { OrderHistoryTable } from "@/components/OrderHistoryTable";
import { parseOrderMedication } from "@/lib/orderPatientUi";
import { sortOrdersForHistory } from "@/lib/orderHistory";

export const CLINICAL_PANEL =
  "overflow-hidden rounded-2xl border border-border border-l-4 border-l-secondary bg-card shadow-sm";

function PanelHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-border bg-muted/30 px-5 py-4">
      <h3 className="font-serif text-lg font-semibold text-secondary">{title}</h3>
      {description ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function formatOrderPlaced(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClinicalReviewOrderHistory({
  currentConsultationId,
  orders,
}: {
  currentConsultationId: string;
  orders: Consultation[];
}) {
  const sorted = useMemo(() => sortOrdersForHistory(orders), [orders]);
  if (sorted.length === 0) return null;

  return (
    <section className={CLINICAL_PANEL} id="cr-order-history">
      <PanelHeader
        title="Patient orders"
        description="Orders for this patient — the row you are reviewing is highlighted."
      />
      <div className="p-4 sm:p-5">
        <OrderHistoryTable
          orders={sorted}
          currentConsultationId={currentConsultationId}
          linkTab="clinical"
        />
      </div>
    </section>
  );
}

export function ClinicalReviewOrderSummary({ c }: { c: Consultation }) {
  const orderMed = parseOrderMedication(c);
  const rxLines = (c.prescriptionItems ?? []) as Array<{
    name: string;
    strength: string;
    quantity: string;
    form?: string;
  }>;
  const isBundle = rxLines.length > 1;

  return (
    <section className={CLINICAL_PANEL}>
      <PanelHeader title="Order summary" />
      <div className="px-5 py-4">
        <dl className="grid gap-5 sm:grid-cols-3">
          <div className={isBundle ? "sm:col-span-2" : undefined}>
            <dt className="rx-label-caps">What they ordered</dt>
            {isBundle ? (
              <ul className="mt-1.5 space-y-1">
                {rxLines.map((line, i) => {
                  const q = Number.parseInt(String(line.quantity), 10) || 1;
                  return (
                    <li
                      key={`${line.name}-${line.strength}-${i}`}
                      className="text-sm font-semibold text-foreground"
                    >
                      <span className="tabular-nums text-primary">{q}×</span>{" "}
                      {line.name}{" "}
                      <span className="text-primary">{line.strength}</span>
                      {line.form ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          ({line.form})
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <>
                <dd className="mt-1.5 text-base font-semibold text-foreground">
                  {orderMed.title}
                </dd>
                {orderMed.doseLabel ? (
                  <dd className="mt-0.5 text-sm text-primary">{orderMed.doseLabel}</dd>
                ) : null}
                {orderMed.subtitle ? (
                  <dd className="mt-0.5 text-xs text-muted-foreground">
                    {orderMed.subtitle}
                  </dd>
                ) : null}
              </>
            )}
          </div>
          <div>
            <dt className="rx-label-caps">Quantity</dt>
            <dd className="mt-1.5 text-base font-semibold text-foreground tabular-nums">
              {orderMed.qty}
            </dd>
          </div>
          <div>
            <dt className="rx-label-caps">Order placed</dt>
            <dd className="mt-1.5 text-base font-semibold text-foreground tabular-nums">
              {formatOrderPlaced(c.createdAt)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function ClinicalReviewNhsScr({ onOpenScr }: { onOpenScr: () => void }) {
  return (
    <section className={CLINICAL_PANEL} id="cr-scr">
      <PanelHeader
        title="NHS Summary Care Record"
        description="Open SCR to confirm medicines, allergies and contraindications."
      />
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Required before marking clinical review complete — verify prescribed
          medicines and allergies match the consultation.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={onOpenScr}
          className="w-full shrink-0 rounded-full px-5 sm:w-auto"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Go to NHS SCR
        </Button>
      </div>
    </section>
  );
}

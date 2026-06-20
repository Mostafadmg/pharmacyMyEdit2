import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";
import { ORDER_PROGRESS_STEPS } from "@/data/patientAccountNav";
import { buildConsultationDocumentFocusPath } from "@/lib/consultationDocumentFocus";
import {
  displayConsultationNumber,
  medicationLabelFromOrder,
} from "@/lib/patientOrderContext";
import DevTestCredentialsHint from "@/components/dev/DevTestCredentialsHint";
import {
  nextDoseRecommendation,
  productImageForCondition,
  progressForConsultation,
  progressForShopOrder,
  stepVisualStates,
  type OrderProgressState,
} from "@/lib/patientOrderProgress";

type PrescriptionItem = {
  name?: string;
  strength?: string;
  form?: string;
  quantity?: string;
};

type ConsultationRow = {
  id: string;
  consultationNumber?: string | null;
  conditionId: string;
  conditionName: string;
  status: string;
  createdAt: string;
  dispatchedAt?: string | null;
  documentsNeedAttention?: boolean;
  prescriptionItems?: PrescriptionItem[];
  answers?: Record<string, unknown>;
};

type ShopOrderLine = {
  productName: string;
  imageUrl: string | null;
  quantity: number;
};

type ShopOrder = {
  id: string;
  orderNumber: string;
  totalGbp: number;
  status: string;
  paymentStatus: string;
  consultationId: string | null;
  prescriptionItems: PrescriptionItem[] | null;
  createdAt: string;
  items?: ShopOrderLine[];
};

type OrderItemRow = {
  name: string;
  subtitle?: string;
  imageUrl: string | null;
  quantity: number;
};

type UnifiedOrder = {
  id: string;
  kind: "consultation" | "shop";
  orderLabel: string;
  createdAt: string;
  progress: OrderProgressState;
  items: OrderItemRow[];
  totalGbp: number | null;
  paymentStatus?: string;
  consultationId: string | null;
  conditionId?: string;
  conditionName?: string;
  currentDose?: string;
};

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function doseFromConsultation(c: ConsultationRow): string | undefined {
  const fromRx = c.prescriptionItems?.[0]?.strength?.trim();
  if (fromRx) return fromRx;
  const answers = c.answers ?? {};
  const pick = answers.selectedDose ?? answers.dose ?? answers.currentDose;
  return typeof pick === "string" ? pick : undefined;
}

function itemsFromConsultation(c: ConsultationRow): OrderItemRow[] {
  const rx = c.prescriptionItems ?? [];
  if (rx.length > 0) {
    return rx.map((item) => ({
      name: item.name?.trim() || c.conditionName,
      subtitle: item.strength?.trim(),
      imageUrl: productImageForCondition(c.conditionId, item.name),
      quantity: 1,
    }));
  }
  const med = medicationLabelFromOrder({
    id: c.id,
    conditionName: c.conditionName,
    status: c.status,
    createdAt: c.createdAt,
    prescriptionItems: c.prescriptionItems,
  });
  return [
    {
      name: med,
      imageUrl: productImageForCondition(c.conditionId),
      quantity: 1,
    },
  ];
}

function variantSubtitleFromName(name: string): string | undefined {
  const weeksMatch = name.match(/\((Weeks?\s[\d–\-+]+)\)/i);
  const doseMatch = name.match(/([\d.]+\s*mg)/i);
  if (doseMatch && weeksMatch) return `${doseMatch[1]} ${weeksMatch[1]}`;
  if (weeksMatch) return weeksMatch[1];
  const parts = name.split(" - ");
  if (parts.length > 1) {
    const tail = parts[parts.length - 1]?.trim();
    if (tail && tail.length < 80) return tail;
  }
  return undefined;
}

function itemsFromShopOrder(o: ShopOrder, c?: ConsultationRow): OrderItemRow[] {
  if (o.items && o.items.length > 0) {
    return o.items.map((it) => ({
      name: it.productName,
      subtitle: variantSubtitleFromName(it.productName),
      imageUrl: it.imageUrl ?? productImageForCondition(c?.conditionId, it.productName),
      quantity: it.quantity,
    }));
  }
  const rx = o.prescriptionItems ?? [];
  if (rx.length > 0) {
    return rx.map((item) => ({
      name: item.name?.trim() || "Product",
      subtitle: item.strength?.trim(),
      imageUrl: productImageForCondition(c?.conditionId, item.name),
      quantity: 1,
    }));
  }
  if (c) return itemsFromConsultation(c);
  return [{ name: "Order", imageUrl: null, quantity: 1 }];
}

function displayShopOrderNumber(orderNumber: string): string {
  return orderNumber.replace(/^PC-?/i, "") || orderNumber;
}

function unifyOrders(
  consultations: ConsultationRow[],
  shopOrders: ShopOrder[],
): UnifiedOrder[] {
  const consultById = new Map(consultations.map((c) => [c.id, c]));
  const linkedConsultIds = new Set(
    shopOrders.map((o) => o.consultationId).filter((id): id is string => Boolean(id)),
  );

  const fromShop: UnifiedOrder[] = shopOrders.map((o) => {
    const c = o.consultationId ? consultById.get(o.consultationId) : undefined;
    const progress = c ? progressForConsultation(c) : progressForShopOrder(o.status);

    return {
      id: o.id,
      kind: "shop",
      orderLabel: `Order #${displayShopOrderNumber(o.orderNumber)}`,
      createdAt: o.createdAt,
      progress,
      items: itemsFromShopOrder(o, c),
      totalGbp: o.totalGbp,
      paymentStatus: o.paymentStatus,
      consultationId: o.consultationId,
      conditionId: c?.conditionId,
      conditionName: c?.conditionName,
      currentDose: c ? doseFromConsultation(c) : undefined,
    };
  });

  const fromConsultOnly: UnifiedOrder[] = consultations
    .filter((c) => !linkedConsultIds.has(c.id))
    .map((c) => ({
      id: c.id,
      kind: "consultation",
      orderLabel: `Order #${displayConsultationNumber(c.consultationNumber, c.id)}`,
      createdAt: c.createdAt,
      progress: progressForConsultation(c),
      items: itemsFromConsultation(c),
      totalGbp: null,
      consultationId: c.id,
      conditionId: c.conditionId,
      conditionName: c.conditionName,
      currentDose: doseFromConsultation(c),
    }));

  return [...fromShop, ...fromConsultOnly].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function statusPillClass(badge: string): string {
  if (badge === "Cancelled") return "cancelled";
  return "pending";
}

function ProgressStepper({ progress }: { progress: OrderProgressState }) {
  const states = stepVisualStates(progress);
  const stepNumber = progress.allComplete ? 6 : progress.activeStep + 1;

  return (
    <div className="em-progress-section">
      <div className="em-progress-header">
        <span className="em-progress-stage">
          <i className="ti ti-clock-hour-4" aria-hidden />
          {progress.statusLabel}
        </span>
        <span className="em-progress-count">Step {stepNumber} of 6</span>
      </div>

      <div className="em-progress-mobile">
        <div className="em-mobile-track">
          <div
            className="em-mobile-fill"
            style={{ width: `${progress.fillPercent}%` }}
          />
        </div>
      </div>

      <div className="em-stepper" aria-label="Order progress">
        {ORDER_PROGRESS_STEPS.map((label, i) => {
          const state = states[i];
          return (
            <React.Fragment key={label}>
              <div className={`em-step ${state}`}>
                <span className={`em-dot ${state}`} title={label}>
                  {state === "done" ? (
                    <i className="ti ti-check" aria-hidden />
                  ) : state === "active" ? (
                    <span className="em-dot-inner" />
                  ) : null}
                </span>
                <span className="em-step-label" title={label}>
                  {label}
                </span>
              </div>
              {i < ORDER_PROGRESS_STEPS.length - 1 ? (
                <div className={`em-bar ${states[i] === "done" ? "filled" : ""}`} />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onRepeat,
  repeatLoading,
}: {
  order: UnifiedOrder;
  onRepeat: (consultationId: string) => void;
  repeatLoading: boolean;
}) {
  const { progress } = order;
  const primaryItem = order.items[0];
  const medName = primaryItem?.name ?? "Treatment";
  const nextDose =
    order.conditionId === "weight-loss" && order.currentDose
      ? nextDoseRecommendation(order.currentDose, medName, order.conditionName)
      : null;

  const detailsHref =
    order.kind === "shop"
      ? `/order-confirmation/${order.id}`
      : order.consultationId
        ? buildConsultationDocumentFocusPath(order.consultationId)
        : `/order-confirmation/${order.id}`;

  const showReorder =
    Boolean(order.consultationId) && order.conditionId === "weight-loss";

  return (
    <div className="em-order-card">
      <div className="em-card-head">
        <div className="em-head-left">
          <div className="em-head-icon">
            <i className="ti ti-package" aria-hidden />
          </div>
          <div className="em-head-meta">
            <p className="em-order-id">{order.orderLabel}</p>
            <p className="em-order-date">
              <i className="ti ti-calendar" aria-hidden />
              Ordered on {formatOrderDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className={`em-status-pill ${statusPillClass(progress.badge)}`}>
          <span className="em-status-dot" />
          {progress.badge}
        </div>
      </div>

      <ProgressStepper progress={progress} />

      <div className="em-body">
        <div className="em-items">
          {order.items.map((item, idx) => (
            <div key={idx} className="em-item">
              <div className="em-item-img">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <i className="ti ti-package" aria-hidden style={{ fontSize: 28, opacity: 0.35 }} />
                )}
              </div>
              <div className="em-item-info">
                <h4>{item.name}</h4>
                {item.subtitle ? <p>{item.subtitle}</p> : null}
                <span className="em-qty-chip">Qty: {item.quantity}</span>
              </div>
            </div>
          ))}
        </div>

        {nextDose ? (
          <div className="em-dose-col">
            <div className="em-dose-card">
              <span className="em-dose-badge">Next recommended dose</span>
              <p className="em-dose-title">{nextDose.title}</p>
              <p className="em-dose-date">
                <i className="ti ti-calendar-event" aria-hidden />
                Reorder by {nextDose.reorderBy}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="em-footer">
        <div className="em-total">
          <span className="em-total-label">Total</span>
          <p className="em-total-value">
            {order.paymentStatus === "rx_internal"
              ? "NHS Rx"
              : order.totalGbp != null
                ? formatGbp(order.totalGbp)
                : "—"}
          </p>
        </div>
        <div className="em-actions">
          {showReorder ? (
            <button
              type="button"
              className="em-btn em-btn-primary reorder-button"
              disabled={repeatLoading}
              onClick={() => order.consultationId && onRepeat(order.consultationId)}
            >
              <i className="ti ti-refresh" aria-hidden /> Reorder
            </button>
          ) : null}
          <Link href={detailsHref} className="em-btn em-btn-ghost view-details-button">
            <i className="ti ti-eye" aria-hidden /> View details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<UnifiedOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [repeatLoadingId, setRepeatLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  async function startRepeat(consultationId: string) {
    if (repeatLoadingId) return;
    setRepeatLoadingId(consultationId);
    try {
      const consult = await apiFetch<{ id: string; conditionId: string }>(
        `/api/consultations/${encodeURIComponent(consultationId)}`,
        { auth: "patient" },
      );
      const consultPath =
        consult.conditionId === "weight-loss"
          ? "/consultation/weight-loss-injectable"
          : `/consult/${consult.conditionId}`;
      navigate(`${consultPath}?repeatOf=${encodeURIComponent(consult.id)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start repeat consultation.");
    } finally {
      setRepeatLoadingId(null);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
      return;
    }
    Promise.all([
      apiFetch<{ consultations: ConsultationRow[] }>("/api/patient/consultations", {
        auth: "patient",
      }),
      apiFetch<{ orders: ShopOrder[] }>("/api/orders", { auth: "patient" }).catch(() => ({
        orders: [],
      })),
    ])
      .then(([consultData, orderData]) => {
        setOrders(unifyOrders(consultData.consultations, orderData.orders));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Couldn't load orders."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const activeCount = useMemo(
    () => orders?.filter((o) => o.progress.badge !== "Cancelled").length ?? 0,
    [orders],
  );

  const pageOrders = orders?.slice(page * pageSize, (page + 1) * pageSize) ?? [];
  const totalPages = orders ? Math.ceil(orders.length / pageSize) : 0;

  return (
    <PatientAccountLayout
      title="My Orders"
      subtitle="Track your orders, manage doses and reorder anytime."
      statsChip={
        orders && orders.length > 0
          ? { label: "Active", value: `${activeCount} order${activeCount === 1 ? "" : "s"}` }
          : undefined
      }
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 3V2h6v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M9 9h6M9 13h6M9 17h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      }
    >
      <DevTestCredentialsHint role="patient" variant="light" className="mb-1" compact />

      <div className="em-orders main-area-for-customer-portal">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <>
            {pageOrders.map((o) => (
              <OrderCard
                key={`${o.kind}-${o.id}`}
                order={o}
                onRepeat={startRepeat}
                repeatLoading={repeatLoadingId === o.consultationId}
              />
            ))}

            {totalPages > 1 ? (
              <div className="em-pagination pagination-controls">
                <button
                  type="button"
                  className="em-page-btn pagination-btn"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="ti ti-arrow-left" aria-hidden /> Previous
                </button>
                <button
                  type="button"
                  className="em-page-btn next-page-btn pagination-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <i className="ti ti-arrow-right" aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="em-empty">
            <i className="ti ti-package" aria-hidden />
            <p>No orders yet</p>
            <Link href="/shop" className="em-btn em-btn-primary" style={{ marginTop: 16 }}>
              Browse shop
            </Link>
          </div>
        )}
      </div>
    </PatientAccountLayout>
  );
}

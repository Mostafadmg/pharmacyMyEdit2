import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Package, Check, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";
import { ORDER_PROGRESS_STEPS } from "@/data/patientAccountNav";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  totalGbp: number;
  status: string;
  paymentStatus: string;
  consultationId: string | null;
  prescriptionItems: Array<{ name: string; strength: string; form: string }> | null;
  createdAt: string;
};

function progressForStatus(status: string): { step: number; statusLabel: string; badge: string } {
  switch (status) {
    case "delivered":
      return { step: 5, statusLabel: "Sent", badge: "Fulfilled" };
    case "shipped":
      return { step: 4, statusLabel: "Dispatched", badge: "Fulfilled" };
    case "preparing":
      return { step: 3, statusLabel: "Approved", badge: "Fulfilled" };
    case "paid":
      return { step: 2, statusLabel: "Under Review", badge: "Pending" };
    case "pending":
      return { step: 1, statusLabel: "Waiting for Documents", badge: "Pending" };
    case "cancelled":
      return { step: 0, statusLabel: "Cancelled", badge: "Cancelled" };
    default:
      return { step: 2, statusLabel: "Under Review", badge: "Pending" };
  }
}

function OrderCard({
  order,
  onRepeat,
  repeatLoading,
}: {
  order: Order;
  onRepeat: (id: string) => void;
  repeatLoading: boolean;
}) {
  const { step, statusLabel, badge } = progressForStatus(order.status);
  const items = order.prescriptionItems ?? [];
  const product = items[0];
  const productName = product
    ? `${product.name}${product.strength ? ` — ${product.strength}` : ""}`
    : "Treatment order";
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const fulfilled = badge === "Fulfilled";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d9ede3] text-[#314a40]">
            <Package className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">Order #{order.orderNumber}</p>
            <p className="text-xs text-gray-500">{orderDate}</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
            fulfilled ? "bg-[#314a40] text-white" : "bg-[#fef3c7] text-[#92400e]",
          )}
        >
          {badge}
        </span>
      </div>

      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-sm font-semibold text-[#314a40]">{statusLabel}</p>
          <p className="text-xs text-gray-500">
            Step {Math.min(step + 1, 6)} of 6
          </p>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {ORDER_PROGRESS_STEPS.map((label, i) => {
            const done = i <= step;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center min-w-[52px]">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold",
                      done
                        ? "border-[#314a40] bg-[#314a40] text-white"
                        : "border-gray-200 bg-white text-gray-400",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={cn("mt-1 text-[10px] text-center leading-tight", done ? "text-gray-800 font-medium" : "text-gray-400")}>
                    {label}
                  </span>
                </div>
                {i < ORDER_PROGRESS_STEPS.length - 1 ? (
                  <div className={cn("h-0.5 w-4 sm:w-6 mb-5 shrink-0", i < step ? "bg-[#314a40]" : "bg-gray-200")} />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Package className="h-6 w-6 text-[#314a40]/60" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 line-clamp-2">{productName}</p>
            <p className="text-xs text-gray-500 mt-0.5">Qty: 1</p>
          </div>
        </div>
        {order.consultationId ? (
          <div className="rounded-xl bg-[#ecfdf3] border border-[#b8f0c8] px-3 py-2 text-xs text-[#1f3d32] max-w-xs">
            Next recommended dose shown after clinical review
          </div>
        ) : null}
      </div>

      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          TOTAL{" "}
          <span className="font-bold text-lg text-[#314a40] ml-1">
            {order.paymentStatus === "rx_internal" ? "NHS Rx" : formatGbp(order.totalGbp)}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {order.consultationId ? (
            <Button
              size="sm"
              disabled={repeatLoading}
              className="rounded-full bg-[#314a40] hover:bg-[#2a4038] text-white"
              onClick={() => order.consultationId && onRepeat(order.consultationId)}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reorder
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline" className="rounded-full border-[#314a40] text-[#314a40]">
            <Link href={`/order-confirmation/${order.id}`}>View details</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function MyOrders() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<Order[] | null>(null);
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
    apiFetch<{ orders: Order[] }>("/api/orders", { auth: "patient" })
      .then((d) => setOrders(d.orders))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Couldn't load orders."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const activeCount = orders?.filter((o) => !["delivered", "cancelled"].includes(o.status)).length ?? 0;
  const pageOrders = orders?.slice(page * pageSize, (page + 1) * pageSize) ?? [];
  const totalPages = orders ? Math.ceil(orders.length / pageSize) : 0;

  return (
    <PatientAccountLayout
      title="My Orders"
      subtitle="Track your orders, manage doses and reorder anytime."
      badge={activeCount > 0 ? `Active ${activeCount} orders` : undefined}
      icon={<Package className="h-5 w-5" />}
    >
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <>
          <div className="space-y-4">
            {pageOrders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onRepeat={startRepeat}
                repeatLoading={repeatLoadingId === o.consultationId}
              />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-800">No orders yet</p>
          <p className="text-sm text-gray-500 mt-2 mb-6">Browse treatments or shop products to get started.</p>
          <Button asChild className="rounded-full bg-[#314a40] hover:bg-[#2a4038]">
            <Link href="/shop">Browse shop</Link>
          </Button>
        </div>
      )}
    </PatientAccountLayout>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Package, Truck, Check, Clock, ShoppingBag, RotateCcw,
  ChevronLeft, MessageSquare, HelpCircle, AlertTriangle,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalGbp: number;
  status: string;
  paymentStatus: string;
  consultationId: string | null;
  prescriptionItems: Array<{ name: string; strength: string; form: string }> | null;
  shippingAddress?: { line1?: string; line2?: string; city?: string; postcode?: string } | null;
  createdAt: string;
  delivery: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string | null;
    status: string;
    estimatedDelivery: string | null;
    shippedAt: string | null;
  } | null;
};

// ── Timeline definition ───────────────────────────────────────────────────────
// Mirrors the MedExpress order-timeline pattern: clinical review → awaiting
// dispatch → dispatched. Maps onto our existing `status` column so the same
// data drives both Rx and shop orders.
const TIMELINE_STAGES = [
  { key: "review", label: "Under clinical review", icon: Clock, statuses: ["pending", "paid"] as string[] },
  { key: "awaiting", label: "Awaiting dispatch", icon: Package, statuses: ["preparing"] as string[] },
  { key: "dispatched", label: "Dispatched", icon: Truck, statuses: ["shipped", "delivered"] as string[] },
];

function stageIndexFor(status: string): number {
  if (status === "cancelled") return -1;
  for (let i = 0; i < TIMELINE_STAGES.length; i++) {
    if (TIMELINE_STAGES[i].statuses.includes(status)) return i;
  }
  // Anything we don't recognise: assume the latest stage so the UI doesn't
  // hide progress.
  return TIMELINE_STAGES.length - 1;
}

function shortAddress(addr: Order["shippingAddress"]): string {
  if (!addr) return "—";
  return [addr.line1, addr.city, addr.postcode].filter(Boolean).join(", ").toUpperCase();
}

function OrderTimelineCard({
  order,
  onRepeat,
  onReorder,
  repeatLoading,
}: {
  order: Order;
  onRepeat: (consultationId: string) => void;
  onReorder: (order: Order) => void;
  repeatLoading: boolean;
}) {
  const isRx = order.paymentStatus === "rx_internal";
  const cancelled = order.status === "cancelled";
  const stageIdx = stageIndexFor(order.status);
  const items = order.prescriptionItems ?? [];

  const placedDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border/40 hover:shadow-md transition-shadow"
      data-testid={`order-card-${order.orderNumber}`}
    >
      {/* ── Top meta row (placed / order # / delivery / total) ── */}
      <div className="px-5 md:px-7 pt-6 pb-5 grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 border-b border-border/40">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order placed</p>
          <p className="font-bold text-secondary mt-1">{placedDate}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order number</p>
          <p className="font-mono font-bold text-secondary mt-1 truncate" data-testid={`order-number-${order.orderNumber}`}>
            {order.orderNumber}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Delivery method</p>
          <p className="font-bold text-secondary mt-1">Royal Mail Tracked</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Delivered to</p>
          <p className="font-bold text-secondary mt-1 truncate" title={shortAddress(order.shippingAddress)}>
            {shortAddress(order.shippingAddress)}
          </p>
        </div>
        <div className="text-right md:text-left">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total cost</p>
          <p className="font-bold text-primary text-lg mt-1">
            {isRx ? "NHS Rx" : formatGbp(order.totalGbp)}
          </p>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="px-5 md:px-7 py-6">
        {cancelled ? (
          <div className="flex items-center gap-3 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">This order was cancelled.</p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {TIMELINE_STAGES.map((stage, i) => {
              const reached = i <= stageIdx;
              const Icon = stage.icon;
              const isLast = i === TIMELINE_STAGES.length - 1;
              return (
                <React.Fragment key={stage.key}>
                  <div className="flex flex-col items-center text-center gap-2 min-w-0">
                    <div
                      className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        reached
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-border text-muted-foreground"
                      }`}
                      data-testid={`timeline-${stage.key}-${reached ? "done" : "pending"}`}
                    >
                      {reached ? <Check className="w-4 h-4 md:w-5 md:h-5" strokeWidth={3} /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                    </div>
                    <p className={`text-[11px] md:text-xs font-bold leading-tight max-w-[7rem] ${reached ? "text-secondary" : "text-muted-foreground"}`}>
                      {stage.label}
                    </p>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mx-1 mb-7 ${i < stageIdx ? "bg-primary" : "bg-border"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Treatment lines ── */}
      {items.length > 0 && (
        <div className="px-5 md:px-7 pb-5 border-t border-border/40 pt-5 space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-secondary truncate">
                  {it.name}{it.strength ? ` ${it.strength}` : ""}{it.form ? ` ${it.form}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRx ? "Prescription · " : ""}One-time purchase
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Action row ── */}
      <div className="px-5 md:px-7 pb-6 pt-2 flex flex-wrap gap-2 border-t border-border/40 mt-2 pt-5">
        <Button asChild variant="outline" className="rounded-full border-2 border-primary text-primary hover:bg-primary/5 font-semibold">
          <Link href={isRx ? `/track-order/${order.id}` : `/order-confirmation/${order.id}`} data-testid={`button-track-${order.orderNumber}`}>
            <Truck className="w-4 h-4 mr-2" /> Track delivery
          </Link>
        </Button>

        {isRx && order.consultationId ? (
          <Button
            type="button"
            disabled={repeatLoading}
            className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            onClick={() => order.consultationId && onRepeat(order.consultationId)}
            data-testid={`button-repeat-${order.orderNumber}`}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {repeatLoading ? "Starting…" : "Reorder treatment"}
          </Button>
        ) : items.length > 0 ? (
          <Button
            type="button"
            className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            onClick={() => onReorder(order)}
            data-testid={`button-reorder-${order.orderNumber}`}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reorder this order
          </Button>
        ) : null}

        {order.consultationId && (
          <Button asChild variant="ghost" className="rounded-full text-secondary hover:bg-secondary/5 font-semibold">
            <Link href={`/my-consultations`} data-testid={`button-message-${order.orderNumber}`}>
              <MessageSquare className="w-4 h-4 mr-2" /> Message your prescriber
            </Link>
          </Button>
        )}

        <Button asChild variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground font-semibold ml-auto">
          <Link href="/account/customer-service" data-testid={`button-help-${order.orderNumber}`}>
            <HelpCircle className="w-4 h-4 mr-2" /> Need help?
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}

export default function MyOrders() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [repeatLoadingId, setRepeatLoadingId] = useState<string | null>(null);

  async function startRepeat(consultationId: string) {
    if (repeatLoadingId) return;
    setRepeatLoadingId(consultationId);
    try {
      const consult = await apiFetch<{ id: string; conditionId: string }>(
        `/api/consultations/${encodeURIComponent(consultationId)}`,
        { auth: "patient" },
      );
      if (!consult?.conditionId) {
        toast.error("We couldn't find the original consultation to repeat.");
        return;
      }
      navigate(`/consultation/${consult.conditionId}?repeatOf=${encodeURIComponent(consult.id)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start a repeat consultation.");
    } finally {
      setRepeatLoadingId(null);
    }
  }

  function reorderShopOrder(order: Order) {
    // Shop orders don't carry full product refs in `prescriptionItems`, so we
    // route the patient to the original confirmation where items + Buy-again
    // links already work via the existing order-detail page.
    toast.info("Opening your original order so you can re-add the items.");
    navigate(`/order-confirmation/${order.id}`);
  }

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      navigate("/my-account/login");
      return;
    }
    apiFetch<{ orders: Order[] }>("/api/orders", { auth: "patient" })
      .then(d => setOrders(d.orders))
      .catch(e => toast.error(e instanceof Error ? e.message : "Couldn't load your orders."))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F1EC]">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-5 md:px-6 py-8 md:py-12 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/account" className="hover:text-primary inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Your account
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Order history</span>
        </nav>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-secondary">Order history</h1>
            <p className="text-muted-foreground mt-1">All your orders, in one place. Track delivery, message your prescriber, or reorder a treatment.</p>
          </div>
          <Button asChild variant="ghost" className="rounded-full text-primary hover:text-primary/80 font-semibold underline">
            <Link href="/account/customer-service">Need help?</Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(o => (
              <OrderTimelineCard
                key={o.id}
                order={o}
                onRepeat={startRepeat}
                onReorder={reorderShopOrder}
                repeatLoading={repeatLoadingId === o.consultationId}
              />
            ))}
          </div>
        ) : (
          <Card className="border-0 bg-white rounded-2xl">
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg mb-4">You haven't placed any orders yet.</p>
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
                <Link href="/shop"><ShoppingBag className="w-4 h-4 mr-2" /> Browse the shop</Link>
              </Button>
            </div>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Package, Truck, Check, MapPin, Clock, Pill, FileText, ExternalLink } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";
import ConsultationChat from "@/components/ConsultationChat";

type Order = {
  id: string; orderNumber: string; status: string; totalGbp: number; createdAt: string;
  shippingAddress: { line1: string; line2?: string; city: string; postcode: string };
  prescriptionItems?: Array<{ name: string; strength: string; form: string; quantity: string; sig: string; duration: string; notes?: string }>;
  consultationId?: string | null;
};
type Item = { id: string; productName: string; quantity: number; unitPriceGbp: number; lineTotalGbp: number; imageUrl: string | null };
type Delivery = {
  carrier: string; trackingNumber: string; status: string;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  events: Array<{ ts: string; status: string; message: string }>;
};

const STAGES = ["preparing", "shipped", "out_for_delivery", "delivered"];
const STAGE_META: Record<string, { label: string; icon: React.ElementType }> = {
  preparing: { label: "Preparing", icon: Package },
  shipped: { label: "Shipped", icon: Truck },
  out_for_delivery: { label: "Out for delivery", icon: Truck },
  delivered: { label: "Delivered", icon: Check },
};

export default function OrderTracking() {
  const [, params] = useRoute<{ id: string }>("/track-order/:id");
  const [data, setData] = useState<{ order: Order; items: Item[]; delivery: Delivery | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let key: string | null = null;
    try {
      const search = new URLSearchParams(window.location.search);
      key = search.get("key");
      if (!key) {
        const raw = localStorage.getItem("pharmacare_guest_orders");
        if (raw) {
          const map = JSON.parse(raw) as Record<string, string>;
          key = map[params.id] ?? null;
        }
      }
    } catch { /* ignore */ }
    const url = key ? `/api/orders/${params.id}?key=${encodeURIComponent(key)}` : `/api/orders/${params.id}`;
    apiFetch<{ order: Order; items: Item[]; delivery: Delivery | null }>(url)
      .then(setData)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const stageIdx = data?.delivery ? STAGES.indexOf(data.delivery.status) : -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <Link href="/my-orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> My orders
        </Link>

        {loading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !data ? (
          <Card><CardContent className="p-8 text-center">Order not found.</CardContent></Card>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-serif font-bold mb-1">Order {data.order.orderNumber}</h1>
              <p className="text-muted-foreground">
                Placed {new Date(data.order.createdAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </div>

            {data.delivery && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-baseline justify-between flex-wrap gap-2 mb-6">
                    <h2 className="font-serif text-xl font-bold">Delivery progress</h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        Tracking <span className="font-mono">{data.delivery.trackingNumber}</span> · {data.delivery.carrier}
                      </span>
                      {data.delivery.trackingUrl && (data.delivery.status === "shipped" || data.delivery.status === "out_for_delivery") && (
                        <a
                          href={data.delivery.trackingUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90"
                          data-testid="link-carrier-tracking"
                        >
                          <Truck className="w-3.5 h-3.5" /> Track on {data.delivery.carrier} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2 relative">
                    <div className="absolute inset-x-6 top-5 h-1 bg-muted -z-0">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${stageIdx >= 0 ? (stageIdx / (STAGES.length - 1)) * 100 : 0}%` }}
                      />
                    </div>
                    {STAGES.map((s, i) => {
                      const meta = STAGE_META[s];
                      const Icon = meta.icon;
                      const reached = stageIdx >= i;
                      return (
                        <div key={s} className="flex flex-col items-center gap-2 relative z-10" data-testid={`stage-${s}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${reached ? "bg-primary border-primary text-white" : "bg-white border-muted text-muted-foreground"}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`text-xs font-medium text-center ${reached ? "text-foreground" : "text-muted-foreground"}`}>{meta.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {data.delivery.estimatedDelivery && (
                    <p className="text-sm text-center mt-6">
                      Estimated delivery: <strong>{new Date(data.delivery.estimatedDelivery).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</strong>
                    </p>
                  )}

                  <div className="border-t mt-6 pt-4 space-y-3 max-h-72 overflow-auto">
                    {data.delivery.events.slice().reverse().map((e, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium capitalize">{e.status.replace(/_/g, " ")}</p>
                          <p className="text-muted-foreground text-xs">{e.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(e.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.order.prescriptionItems && data.order.prescriptionItems.length > 0 && (
              <Card className="mb-6 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                      <Pill className="w-5 h-5 text-primary" /> Your prescription
                    </h2>
                    {data.order.consultationId && (
                      <a
                        href={`/api/consultations/${data.order.consultationId}/prescription.pdf?token=${encodeURIComponent(localStorage.getItem("patient_token") ?? "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90"
                        data-testid="link-prescription-pdf"
                      >
                        <FileText className="w-3.5 h-3.5" /> View PDF
                      </a>
                    )}
                  </div>
                  <div className="space-y-3">
                    {data.order.prescriptionItems.map((it, i) => (
                      <div key={i} className="border border-border rounded-xl p-4 bg-white" data-testid={`prescription-item-${i}`}>
                        <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
                          <p className="font-bold text-secondary">
                            {i + 1}. {it.name}
                            {it.strength && <span className="font-normal text-muted-foreground"> · {it.strength}</span>}
                            {it.form && <span className="font-normal text-muted-foreground"> · {it.form}</span>}
                          </p>
                          {it.quantity && <Badge variant="outline" className="text-[10px]">Qty: {it.quantity}</Badge>}
                        </div>
                        {it.sig && <p className="text-sm text-foreground"><strong>How to take:</strong> {it.sig}</p>}
                        {it.duration && <p className="text-xs text-muted-foreground mt-1">Duration: {it.duration}</p>}
                        {it.notes && <p className="text-xs text-amber-700 mt-2 bg-amber-50 px-2 py-1 rounded">Note: {it.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {data.items.length > 0 && (
              <Card><CardContent className="p-5">
                <h3 className="font-semibold mb-3">Order items</h3>
                <div className="space-y-3">
                  {data.items.map(i => (
                    <div key={i.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                      {i.imageUrl && <img src={i.imageUrl} alt={i.productName} className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{i.productName}</p>
                        <p className="text-xs text-muted-foreground">Qty {i.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatGbp(i.lineTotalGbp)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between font-bold">
                  <span>Total</span><span className="text-primary">{formatGbp(data.order.totalGbp)}</span>
                </div>
              </CardContent></Card>
              )}

              {data.order.consultationId && (
                <div className="md:col-span-2">
                  <ConsultationChat consultationId={data.order.consultationId} audience="patient" />
                </div>
              )}
              <Card><CardContent className="p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Shipping to</h3>
                <p className="text-sm">
                  {data.order.shippingAddress.line1}<br />
                  {data.order.shippingAddress.line2 && <>{data.order.shippingAddress.line2}<br /></>}
                  {data.order.shippingAddress.city}<br />
                  <strong>{data.order.shippingAddress.postcode}</strong>
                </p>
              </CardContent></Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

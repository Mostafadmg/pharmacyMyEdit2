import React, { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Package, Truck, Check, Clock, MapPin, User, Mail, Phone } from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";

type Item = { id: string; productName: string; productSlug: string; imageUrl: string | null; unitPriceGbp: number; quantity: number; lineTotalGbp: number };
type Order = {
  id: string; orderNumber: string;
  customerName: string; customerEmail: string; customerPhone: string | null;
  shippingAddress: { line1: string; line2?: string; city: string; postcode: string; country?: string };
  itemsTotalGbp: number; shippingGbp: number; totalGbp: number;
  status: string; paymentStatus: string;
  notes: string | null;
  createdAt: string;
};
type Delivery = {
  carrier: string; trackingNumber: string;
  status: string;
  estimatedDelivery: string | null;
  events: Array<{ ts: string; status: string; message: string }>;
};

const ORDER_STATUSES = ["paid", "preparing", "shipped", "delivered", "cancelled"];
const DELIVERY_STAGES = ["preparing", "shipped", "out_for_delivery", "delivered"];

export default function AdminOrderDetail() {
  const [, params] = useRoute<{ id: string }>("/dashboard/orders/:id");
  const [data, setData] = useState<{ order: Order; items: Item[]; delivery: Delivery | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deliveryStage, setDeliveryStage] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");

  const load = () => {
    if (!params?.id) return;
    apiFetch<{ order: Order; items: Item[]; delivery: Delivery | null }>(`/api/orders/${params.id}`, { auth: "pharmacist" })
      .then(d => {
        setData(d);
        setDeliveryStage(d.delivery?.status ?? "");
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [params?.id]);

  const updateOrderStatus = async (newStatus: string) => {
    if (!data) return;
    setStatusUpdating(true);
    try {
      await apiFetch(`/api/admin/orders/${data.order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
        auth: "pharmacist",
      });
      toast.success("Order status updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  const updateDelivery = async () => {
    if (!data || !deliveryStage) return;
    setStatusUpdating(true);
    try {
      await apiFetch(`/api/admin/orders/${data.order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ deliveryStatus: deliveryStage, deliveryMessage: deliveryMsg }),
        auth: "pharmacist",
      });
      toast.success("Delivery updated");
      setDeliveryMsg("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <PharmacistLayout current="orders">
      <div className="p-6 max-w-6xl mx-auto">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
        ) : !data ? (
          <Card><CardContent className="p-8 text-center">Order not found</CardContent></Card>
        ) : (
          <div className="grid lg:grid-cols-[1fr,320px] gap-6">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <h1 className="text-2xl font-bold">{data.order.orderNumber}</h1>
                      <p className="text-sm text-muted-foreground">
                        Placed {new Date(data.order.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                    <Badge className="capitalize">{data.order.status}</Badge>
                  </div>
                  <div className="space-y-3">
                    {data.items.map(i => (
                      <div key={i.id} className="flex gap-3 items-center pb-3 border-b last:border-0 last:pb-0">
                        {i.imageUrl && <img src={i.imageUrl} alt={i.productName} className="w-14 h-14 rounded-lg object-cover bg-muted flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{i.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty {i.quantity} × {formatGbp(i.unitPriceGbp)}</p>
                        </div>
                        <p className="font-semibold">{formatGbp(i.lineTotalGbp)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatGbp(data.order.itemsTotalGbp)}</span></div>
                    <div className="flex justify-between"><span>Delivery</span><span>{data.order.shippingGbp === 0 ? "Free" : formatGbp(data.order.shippingGbp)}</span></div>
                    <div className="flex justify-between font-bold pt-2 text-lg"><span>Total</span><span className="text-primary">{formatGbp(data.order.totalGbp)}</span></div>
                  </div>
                  {data.order.notes && (
                    <div className="mt-4 p-3 bg-muted/40 rounded-lg text-sm">
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Customer note</p>
                      <p>{data.order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {data.delivery && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-semibold mb-1">Delivery management</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      {data.delivery.carrier} · <span className="font-mono">{data.delivery.trackingNumber}</span>
                    </p>

                    <div className="grid sm:grid-cols-[1fr,auto] gap-3 mb-4">
                      <Select value={deliveryStage} onValueChange={setDeliveryStage}>
                        <SelectTrigger data-testid="select-delivery-stage"><SelectValue placeholder="Set stage" /></SelectTrigger>
                        <SelectContent>
                          {DELIVERY_STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button onClick={updateDelivery} disabled={statusUpdating || !deliveryStage} data-testid="btn-update-delivery">Update tracking</Button>
                    </div>
                    <Textarea placeholder="Optional note for the customer..." value={deliveryMsg} onChange={e => setDeliveryMsg(e.target.value)} rows={2} className="mb-4" />

                    <div className="space-y-2 max-h-60 overflow-auto pr-2">
                      {data.delivery.events.slice().reverse().map((e, i) => (
                        <div key={i} className="text-sm flex gap-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                            {new Date(e.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <div>
                            <p className="font-medium capitalize">{e.status.replace(/_/g, " ")}</p>
                            <p className="text-muted-foreground text-xs">{e.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Order status</p>
                    <Select value={data.order.status} onValueChange={updateOrderStatus} disabled={statusUpdating}>
                      <SelectTrigger data-testid="select-order-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold">Customer</h3>
                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" /> {data.order.customerName}</p>
                    <a href={`mailto:${data.order.customerEmail}`} className="flex items-center gap-2 text-primary hover:underline">
                      <Mail className="w-3.5 h-3.5" /> {data.order.customerEmail}
                    </a>
                    {data.order.customerPhone && (
                      <a href={`tel:${data.order.customerPhone}`} className="flex items-center gap-2 text-primary hover:underline">
                        <Phone className="w-3.5 h-3.5" /> {data.order.customerPhone}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery address</h3>
                  <p className="text-sm">
                    {data.order.shippingAddress.line1}<br />
                    {data.order.shippingAddress.line2 && <>{data.order.shippingAddress.line2}<br /></>}
                    {data.order.shippingAddress.city}<br />
                    <strong>{data.order.shippingAddress.postcode}</strong><br />
                    {data.order.shippingAddress.country ?? "United Kingdom"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PharmacistLayout>
  );
}

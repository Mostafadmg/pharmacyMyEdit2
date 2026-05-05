import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Package, Truck, Check, Clock, ArrowRight, ShoppingBag, Pill } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Received", icon: Clock, color: "bg-blue-100 text-blue-700" },
  paid: { label: "Confirmed", icon: Check, color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparing", icon: Package, color: "bg-amber-100 text-amber-700" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Delivered", icon: Check, color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", icon: Clock, color: "bg-rose-100 text-rose-700" },
};

export default function MyOrders() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      navigate("/my-account/login");
      return;
    }
    apiFetch<{ orders: Order[] }>("/api/orders", { auth: "patient" })
      .then(d => setOrders(d.orders))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">My orders</h1>
            <p className="text-muted-foreground mt-1">Track your pharmacy orders & deliveries.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/shop"><ShoppingBag className="w-4 h-4 mr-2" /> Continue shopping</Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map(o => {
              const isRx = o.paymentStatus === "rx_internal";
              const href = isRx ? `/track-order/${o.id}` : `/order-confirmation/${o.id}`;
              const meta = STATUS_META[o.status] ?? STATUS_META.pending;
              const Icon = isRx ? Pill : meta.icon;
              const rxItems = isRx && Array.isArray(o.prescriptionItems) && o.prescriptionItems.length > 0
                ? o.prescriptionItems : null;
              return (
                <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Link href={href}>
                    <Card className="border-0 bg-white rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isRx ? "bg-emerald-50" : "bg-[#168A7B]/10"}`}>
                          <Icon className={`w-5 h-5 ${isRx ? "text-emerald-600" : "text-[#168A7B]"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold" data-testid={`order-number-${o.orderNumber}`}>{o.orderNumber}</p>
                            {isRx && (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0 font-semibold">Prescription</Badge>
                            )}
                            <Badge className={`${meta.color} hover:${meta.color} border-0`}>{meta.label}</Badge>
                          </div>
                          {rxItems ? (
                            <p className="text-sm text-muted-foreground truncate">
                              {rxItems.map(it => `${it.name}${it.strength ? ` ${it.strength}` : ""}`).join(", ")}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                          {rxItems && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {isRx ? (
                            <p className="text-sm font-semibold text-emerald-700">NHS Rx</p>
                          ) : (
                            <p className="font-bold text-lg text-[#168A7B]">{formatGbp(o.totalGbp)}</p>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="border-0 bg-white rounded-2xl">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg mb-4">You haven't placed any orders yet.</p>
              <Button asChild className="rounded-full bg-[#168A7B] hover:bg-[#0E5A52]">
                <Link href="/shop">Browse shop</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}

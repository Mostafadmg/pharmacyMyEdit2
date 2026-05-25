import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Package, Truck, Check, Clock, ChevronRight, Search, ShoppingBag } from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalGbp: number;
  itemsTotalGbp: number;
  shippingGbp: number;
  status: string;
  createdAt: string;
};

const STATUSES = ["all", "paid", "preparing", "shipped", "delivered", "cancelled"];
const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  paid: { label: "New", color: "bg-blue-100 text-blue-700", icon: Check },
  preparing: { label: "Preparing", color: "bg-amber-100 text-amber-700", icon: Package },
  shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: Check },
  cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-700", icon: Clock },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    apiFetch<{ orders: Order[] }>(`/api/orders?${params.toString()}`, { auth: "pharmacist" })
      .then(d => setOrders(d.orders))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerEmail.toLowerCase().includes(q)
    );
  }, [orders, search]);

  return (
    <PharmacistLayout current="orders">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><ShoppingBag className="w-7 h-7 text-primary" /> Shop Orders</h1>
            <p className="text-muted-foreground">Manage customer orders, fulfilment & deliveries.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search order, name, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-orders-search" />
          </div>
        </div>

        <Tabs value={status} onValueChange={setStatus} className="mb-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto">
            {STATUSES.map(s => (
              <TabsTrigger key={s} value={s} className="capitalize" data-testid={`tab-orders-${s}`}>
                {s === "all" ? "All" : STATUS_META[s]?.label ?? s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : filtered.length > 0 ? (
          <div className="bg-white rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(o => {
                  const meta = STATUS_META[o.status] ?? STATUS_META.pending;
                  const Icon = meta.icon;
                  return (
                    <tr key={o.id} className="hover:bg-muted/20 cursor-pointer" data-testid={`order-row-${o.orderNumber}`}>
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/dashboard/orders/${o.id}`}>{o.orderNumber}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/patients/${encodeURIComponent(o.customerEmail)}`}>
                          <a className="block hover:text-primary transition-colors" data-testid={`order-patient-${o.orderNumber}`}>
                            <div className="font-medium">{o.customerName}</div>
                            <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                          </a>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${meta.color} hover:${meta.color} border-0`}>
                          <Icon className="w-3 h-3 mr-1" />{meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatGbp(o.totalGbp)}</td>
                      <td className="px-4 py-3">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/orders/${o.id}`}>View <ChevronRight className="w-4 h-4 ml-1" /></Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Card><CardContent className="p-12 text-center text-muted-foreground">No orders match your filter.</CardContent></Card>
        )}
      </div>
    </PharmacistLayout>
  );
}

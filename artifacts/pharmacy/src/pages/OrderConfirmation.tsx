import React, { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Package, Truck, Clock, Home, ShoppingBag, MapPin, UserPlus, Lock, Loader2, Tag, Wallet } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";

type Item = { id: string; productName: string; productSlug: string; imageUrl: string | null; unitPriceGbp: number; quantity: number; lineTotalGbp: number };
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: { line1: string; line2?: string; city: string; postcode: string; country?: string };
  itemsTotalGbp: number;
  shippingGbp: number;
  totalGbp: number;
  promoCode: string | null;
  promoDiscountPence: number;
  creditsAppliedPence: number;
  status: string;
  createdAt: string;
};
type Delivery = {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery: string | null;
  events: Array<{ ts: string; status: string; message: string }>;
};

const TRACKING_STAGES = [
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function OrderConfirmation() {
  const [, params] = useRoute<{ id: string }>("/order-confirmation/:id");
  const [, navigate] = useLocation();
  const [data, setData] = useState<{ order: Order; items: Item[]; delivery: Delivery | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("patient_token");
  const [upgradePassword, setUpgradePassword] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    if (upgradePassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setUpgrading(true);
    try {
      const res = await apiFetch<{ token: string; patientId: string; name: string; email: string }>(
        "/api/auth/patient-upgrade-guest",
        {
          method: "POST",
          body: JSON.stringify({
            orderId: data.order.id,
            orderKey: data.order.orderNumber,
            email: data.order.customerEmail,
            password: upgradePassword,
            name: data.order.customerName,
          }),
        },
      );
      localStorage.setItem("patient_token", res.token);
      localStorage.setItem("patient_id", res.patientId);
      localStorage.setItem("patient_name", res.name);
      localStorage.setItem("patient_email", res.email);
      setUpgraded(true);
      toast.success("Account created — you're signed in.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create your account.");
    } finally {
      setUpgrading(false);
    }
  }

  useEffect(() => {
    if (!params?.id) return;
    let key: string | null = null;
    let sessionId: string | null = null;
    try {
      const search = new URLSearchParams(window.location.search);
      key = search.get("key");
      sessionId = search.get("session_id");
      if (!key) {
        const raw = localStorage.getItem("pharmacare_guest_orders");
        if (raw) {
          const map = JSON.parse(raw) as Record<string, string>;
          key = map[params.id] ?? null;
        }
      }
    } catch { /* ignore */ }

    const verifyAndLoad = async () => {
      try {
        // If we just came back from Stripe, verify the payment first.
        if (sessionId) {
          try {
            await apiFetch(`/api/orders/${params.id}/verify-payment`, {
              method: "POST",
              body: JSON.stringify({ sessionId }),
            });
          } catch (err) {
            console.warn("Payment verification failed", err);
          }
        }
        const url = key ? `/api/orders/${params.id}?key=${encodeURIComponent(key)}` : `/api/orders/${params.id}`;
        const res = await apiFetch<{ order: Order; items: Item[]; delivery: Delivery | null }>(url);
        setData(res);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoad();
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-10 w-full flex-1 space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center w-full flex-1">
          <p>Order not found.</p>
          <Button asChild className="mt-4 rounded-full"><Link href="/shop">Back to shop</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { order, items, delivery } = data;
  const stageIdx = delivery
    ? Math.max(0, TRACKING_STAGES.findIndex(s => s.key === delivery.status))
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-10 w-full flex-1 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 bg-gradient-to-br from-[#0E3D2D] to-[#0E5A52] text-white rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold">Thank you for your order!</h1>
                  <p className="text-white/90 mt-1">Order <span className="font-semibold">{order.orderNumber}</span> has been received and is being prepared by our pharmacy.</p>
                  {delivery?.estimatedDelivery && (
                    <p className="text-white/90 mt-2 text-sm">
                      Estimated delivery: <strong>{new Date(delivery.estimatedDelivery).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</strong>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {delivery && (
          <Card className="border-0 bg-white rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
                <h2 className="font-semibold text-lg">Delivery tracking</h2>
                <p className="text-xs text-muted-foreground">
                  {delivery.carrier} · <span className="font-mono">{delivery.trackingNumber}</span>
                </p>
              </div>
              <div className="relative">
                <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
                <div
                  className="absolute top-5 left-0 h-1 bg-[#0E3D2D] rounded-full transition-all duration-500"
                  style={{ width: `${(stageIdx / (TRACKING_STAGES.length - 1)) * 100}%` }}
                />
                <div className="relative flex justify-between">
                  {TRACKING_STAGES.map((stage, i) => {
                    const Icon = stage.icon;
                    const done = i <= stageIdx;
                    return (
                      <div key={stage.key} className="flex flex-col items-center text-center" style={{ width: `${100 / TRACKING_STAGES.length}%` }}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${
                          done ? "bg-[#0E3D2D] border-[#0E3D2D] text-white" : "bg-white border-muted text-muted-foreground"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className={`text-xs mt-2 font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>{stage.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              {delivery.events.length > 0 && (
                <div className="mt-6 pt-6 border-t space-y-3">
                  <h3 className="text-sm font-semibold">Tracking history</h3>
                  {delivery.events.slice().reverse().map((e, i) => (
                    <div key={i} className="text-sm flex gap-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                        {new Date(e.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div>
                        <p className="font-medium capitalize">{e.status.replace(/_/g, " ")}</p>
                        <p className="text-muted-foreground">{e.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-white rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-4">Order details</h2>
            <div className="space-y-3 mb-6">
              {items.map(i => (
                <div key={i.id} className="flex gap-3 items-center">
                  {i.imageUrl && <img src={i.imageUrl} alt={i.productName} className="w-14 h-14 rounded-lg object-cover bg-muted flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${i.productSlug}`} className="font-medium hover:text-[#0E3D2D] line-clamp-1">{i.productName}</Link>
                    <p className="text-xs text-muted-foreground">Qty {i.quantity} · {formatGbp(i.unitPriceGbp)}</p>
                  </div>
                  <p className="font-semibold whitespace-nowrap">{formatGbp(i.lineTotalGbp)}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatGbp(order.itemsTotalGbp)}</span></div>
              {order.promoDiscountPence > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="inline-flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Promo {order.promoCode}</span>
                  <span>−{formatGbp(order.promoDiscountPence)}</span>
                </div>
              )}
              {order.creditsAppliedPence > 0 && (
                <div className="flex justify-between text-[#0E3D2D]">
                  <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Credit applied</span>
                  <span>−{formatGbp(order.creditsAppliedPence)}</span>
                </div>
              )}
              <div className="flex justify-between"><span>Delivery</span><span>{order.shippingGbp === 0 ? "Free" : formatGbp(order.shippingGbp)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span className="text-[#0E3D2D]">{formatGbp(order.totalGbp)}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#0E3D2D]" /> Delivery address</h2>
            <p className="text-sm">
              <span className="font-medium">{order.customerName}</span><br />
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
              {order.shippingAddress.city}<br />
              {order.shippingAddress.postcode}<br />
              {order.shippingAddress.country ?? "United Kingdom"}
            </p>
          </CardContent>
        </Card>

        {/* Guest → account upsell. Hidden once signed in or after upgrade. */}
        {!isLoggedIn && !upgraded && (
          <Card className="border-0 bg-gradient-to-br from-[#0E3D2D]/5 to-[#0E3D2D]/10 border-2 border-[#0E3D2D]/20 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0E3D2D]/15 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-6 h-6 text-[#0E3D2D]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg text-secondary">Save your details for next time</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set a password to track this order, message your prescriber, and reorder treatments faster. We'll attach this order to your new account.
                  </p>
                  <form onSubmit={handleUpgrade} className="mt-4 flex flex-col sm:flex-row gap-2 max-w-lg">
                    <div className="flex-1">
                      <Label className="sr-only">Choose a password</Label>
                      <Input
                        type="password"
                        value={upgradePassword}
                        onChange={e => setUpgradePassword(e.target.value)}
                        placeholder="Choose a password (8+ characters)"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        data-testid="input-upgrade-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={upgrading}
                      className="rounded-full bg-[#0E3D2D] hover:bg-[#0E5A52] whitespace-nowrap"
                      data-testid="button-create-account"
                    >
                      {upgrading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                        : <><Lock className="w-4 h-4 mr-2" />Create account</>}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    By creating an account, you agree to our <Link href="/legal/terms" className="underline">terms</Link> and <Link href="/legal/privacy" className="underline">privacy policy</Link>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {upgraded && (
          <Card className="border-0 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
            <CardContent className="p-5 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-emerald-900">Welcome to EveryDayMeds!</p>
                <p className="text-sm text-emerald-800">Your account is ready. Find this order anytime in Your Account.</p>
              </div>
              <Button onClick={() => navigate("/account")} className="rounded-full bg-emerald-700 hover:bg-emerald-800">Go to account</Button>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 flex-wrap">
          {isLoggedIn ? (
            <Button asChild variant="outline" className="rounded-full"><Link href="/my-orders">View all my orders</Link></Button>
          ) : (
            <Button asChild variant="outline" className="rounded-full"><Link href="/shop"><Home className="w-4 h-4 mr-2" /> Back to home</Link></Button>
          )}
          <Button asChild className="rounded-full bg-[#0E3D2D] hover:bg-[#0E5A52]"><Link href="/shop"><ShoppingBag className="w-4 h-4 mr-2" /> Continue shopping</Link></Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

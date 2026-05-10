import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Lock, CreditCard, ShieldCheck, Tag, Wallet, Loader2, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useCart, formatGbp } from "@/hooks/useCart";
import { DeliveryPromise } from "@/components/checkout/DeliveryPromise";

type AppliedPromo = { code: string; label: string; discountPence: number };
type Referral = { balancePence: number };

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, itemsTotal, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", line1: "", line2: "", city: "", postcode: "", notes: "",
  });

  // Discount state
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const [validating, setValidating] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [useCredits, setUseCredits] = useState(true);
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("patient_token");

  useEffect(() => {
    setForm(f => ({
      ...f,
      name: localStorage.getItem("patient_name") || f.name,
      email: localStorage.getItem("patient_email") || f.email,
    }));
    apiFetch<{ stripeEnabled: boolean }>("/api/payments/status")
      .then(r => setStripeEnabled(r.stripeEnabled))
      .catch(() => setStripeEnabled(false));
    if (isLoggedIn) {
      apiFetch<Referral>("/api/patient/referral", { auth: "patient" })
        .then(r => setCreditsBalance(r.balancePence))
        .catch(() => setCreditsBalance(0));
    }
  }, [isLoggedIn]);

  // Re-validate promo if subtotal changes underneath us (e.g. min-spend gate fails).
  useEffect(() => {
    if (!promo) return;
    if (itemsTotal < promo.discountPence) {
      setPromo(null);
      toast.info("Promo removed — basket no longer eligible.");
    }
  }, [itemsTotal, promo]);

  const totals = useMemo(() => {
    const promoDiscount = promo ? Math.min(itemsTotal, promo.discountPence) : 0;
    const remainingAfterPromo = Math.max(0, itemsTotal - promoDiscount);
    const credits = isLoggedIn && useCredits ? Math.min(creditsBalance, remainingAfterPromo) : 0;
    const subAfterDiscounts = Math.max(0, remainingAfterPromo - credits);
    const shipping = itemsTotal >= 2500 ? 0 : 299;
    const total = subAfterDiscounts + shipping;
    return { promoDiscount, credits, shipping, total };
  }, [itemsTotal, promo, useCredits, creditsBalance, isLoggedIn]);

  const handleChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setValidating(true);
    try {
      const res = await apiFetch<AppliedPromo>("/api/promo-codes/validate", {
        method: "POST",
        body: JSON.stringify({ code: promoInput.trim(), subtotalPence: itemsTotal }),
      });
      setPromo(res);
      setPromoInput("");
      toast.success(`Applied ${res.label}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't apply that code.");
    } finally {
      setValidating(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your basket is empty");
      navigate("/shop");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ order: { id: string; orderNumber: string } }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone || undefined,
          shippingAddress: {
            line1: form.line1, line2: form.line2, city: form.city, postcode: form.postcode,
          },
          notes: form.notes || undefined,
          promoCode: promo?.code,
          applyCreditsPence: totals.credits > 0 ? totals.credits : undefined,
        }),
      });

      try {
        const raw = localStorage.getItem("pharmacare_guest_orders");
        const map: Record<string, string> = raw ? JSON.parse(raw) : {};
        map[res.order.id] = res.order.orderNumber;
        localStorage.setItem("pharmacare_guest_orders", JSON.stringify(map));
      } catch { /* ignore */ }

      if (stripeEnabled) {
        const origin = window.location.origin;
        const base = import.meta.env.BASE_URL.replace(/\/$/, "");
        const session = await apiFetch<{ url: string }>(`/api/orders/${res.order.id}/checkout-session`, {
          method: "POST",
          body: JSON.stringify({
            successUrl: `${origin}${base}/order-confirmation/${res.order.id}?key=${res.order.orderNumber}`,
            cancelUrl: `${origin}${base}/checkout`,
          }),
        });
        clear();
        window.location.href = session.url;
        return;
      }

      clear();
      toast.success("Order placed successfully!");
      navigate(`/order-confirmation/${res.order.id}?key=${res.order.orderNumber}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
        <Header />
        <div className="max-w-2xl mx-auto px-6 py-16 w-full flex-1 text-center">
          <p className="text-lg mb-4">Your basket is empty.</p>
          <Button asChild className="rounded-full bg-[#168A7B] hover:bg-[#0E5A52]"><Link href="/shop">Back to shop</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full flex-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-6 sm:mb-8 flex items-center gap-1.5 text-sm">
          <Lock className="w-3.5 h-3.5" /> Secure checkout · GPhC-registered UK pharmacy
        </p>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr,360px] gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <Card className="border-0 bg-white rounded-2xl">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <h2 className="font-semibold text-lg">Contact details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Full name</Label><Input value={form.name} onChange={handleChange("name")} required data-testid="input-name" /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={handleChange("email")} required data-testid="input-email" /></div>
                </div>
                <div><Label>Phone</Label><Input type="tel" value={form.phone} onChange={handleChange("phone")} data-testid="input-phone" /></div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white rounded-2xl">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <h2 className="font-semibold text-lg">Delivery address</h2>
                <div><Label>Address line 1</Label><Input value={form.line1} onChange={handleChange("line1")} placeholder="123 High Street" required data-testid="input-line1" /></div>
                <div><Label>Address line 2 (optional)</Label><Input value={form.line2} onChange={handleChange("line2")} data-testid="input-line2" /></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Town/City</Label><Input value={form.city} onChange={handleChange("city")} placeholder="Manchester" required data-testid="input-city" /></div>
                  <div><Label>Postcode</Label><Input value={form.postcode} onChange={handleChange("postcode")} placeholder="M1 1AB" required data-testid="input-postcode" /></div>
                </div>
                <DeliveryPromise postcode={form.postcode} />
                <div><Label>Notes for the pharmacist (optional)</Label>
                  <Textarea rows={2} value={form.notes} onChange={handleChange("notes")} placeholder="Allergies, delivery instructions, etc." data-testid="input-notes" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white rounded-2xl">
              <CardContent className="p-5 sm:p-6 space-y-3">
                <h2 className="font-semibold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#168A7B]" /> Payment</h2>
                {stripeEnabled === null ? (
                  <Badge variant="outline">Loading…</Badge>
                ) : stripeEnabled ? (
                  <>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Secure card payment via Stripe
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      You'll be securely redirected to Stripe to enter your card details. We never see or store your card number.
                    </p>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
                      Demo mode — no real payment is taken
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Stripe is not yet connected on this environment. Click "Place order" to simulate a paid order for testing.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order summary */}
          <Card className="border-0 bg-white rounded-2xl h-fit lg:sticky lg:top-24">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <h2 className="font-semibold text-lg">Your order</h2>
              <div className="space-y-3 max-h-64 overflow-auto">
                {items.map(i => (
                  <div key={i.productId} className="flex gap-3">
                    <img src={i.imageUrl} alt={i.name} className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{i.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {i.quantity} · {formatGbp(i.unitPriceGbp)}</p>
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap">{formatGbp(i.unitPriceGbp * i.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Promo code */}
              <div className="border-t pt-4 space-y-2">
                <Label className="flex items-center gap-1.5 text-sm"><Tag className="w-3.5 h-3.5" /> Promo code</Label>
                {promo ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm" data-testid="promo-applied">
                    <div className="min-w-0">
                      <p className="font-semibold text-emerald-900 truncate">{promo.code}</p>
                      <p className="text-xs text-emerald-800 truncate">{promo.label}</p>
                    </div>
                    <button type="button" onClick={() => setPromo(null)} className="p-1 text-emerald-700 hover:text-emerald-900" aria-label="Remove promo" data-testid="button-remove-promo">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="WELCOME10"
                      className="text-sm"
                      data-testid="input-promo-code"
                    />
                    <Button
                      type="button"
                      onClick={applyPromo}
                      disabled={validating || !promoInput.trim()}
                      variant="outline"
                      className="rounded-full"
                      data-testid="button-apply-promo"
                    >
                      {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Credits */}
              {isLoggedIn && creditsBalance > 0 && (
                <label className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 cursor-pointer text-sm">
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span>Apply £{(creditsBalance / 100).toFixed(2)} credit</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={useCredits}
                    onChange={e => setUseCredits(e.target.checked)}
                    className="h-4 w-4"
                    data-testid="checkbox-use-credits"
                  />
                </label>
              )}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatGbp(itemsTotal)}</span></div>
                {totals.promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700"><span>Promo ({promo?.code})</span><span>−{formatGbp(totals.promoDiscount)}</span></div>
                )}
                {totals.credits > 0 && (
                  <div className="flex justify-between text-primary"><span>Credit applied</span><span>−{formatGbp(totals.credits)}</span></div>
                )}
                <div className="flex justify-between"><span>Delivery</span><span>{totals.shipping === 0 ? "Free" : formatGbp(totals.shipping)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span className="text-[#168A7B]">{formatGbp(totals.total)}</span></div>
              </div>

              <Button type="submit" disabled={submitting || stripeEnabled === null} className="w-full rounded-full bg-[#168A7B] hover:bg-[#0E5A52] h-12" data-testid="btn-place-order">
                {submitting
                  ? (stripeEnabled ? "Redirecting to Stripe…" : "Placing order…")
                  : (stripeEnabled ? "Pay securely" : "Place order")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">Order processed by PharmaCare Pharmacy, GPhC 9011677</p>
            </CardContent>
          </Card>
        </form>
      </div>
      <Footer />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, CreditCard, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useCart, formatGbp } from "@/hooks/useCart";

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, itemsTotal, shipping, total, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    notes: "",
  });

  useEffect(() => {
    setForm(f => ({
      ...f,
      name: localStorage.getItem("patient_name") || f.name,
      email: localStorage.getItem("patient_email") || f.email,
    }));
  }, []);

  const handleChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

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
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            postcode: form.postcode,
          },
          notes: form.notes || undefined,
        }),
      });
      // Remember guest order numbers so confirmation/tracking pages can authenticate
      try {
        const raw = localStorage.getItem("pharmacare_guest_orders");
        const map: Record<string, string> = raw ? JSON.parse(raw) : {};
        map[res.order.id] = res.order.orderNumber;
        localStorage.setItem("pharmacare_guest_orders", JSON.stringify(map));
      } catch { /* ignore */ }
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
      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Secure checkout</p>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr,360px] gap-8">
          <div className="space-y-6">
            <Card className="border-0 bg-white rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Contact details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Full name</Label><Input value={form.name} onChange={handleChange("name")} required data-testid="input-name" /></div>
                  <div><Label>Email</Label><Input type="email" value={form.email} onChange={handleChange("email")} required data-testid="input-email" /></div>
                </div>
                <div><Label>Phone</Label><Input type="tel" value={form.phone} onChange={handleChange("phone")} data-testid="input-phone" /></div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Delivery address</h2>
                <div><Label>Address line 1</Label><Input value={form.line1} onChange={handleChange("line1")} placeholder="123 High Street" required data-testid="input-line1" /></div>
                <div><Label>Address line 2 (optional)</Label><Input value={form.line2} onChange={handleChange("line2")} data-testid="input-line2" /></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label>Town/City</Label><Input value={form.city} onChange={handleChange("city")} placeholder="Manchester" required data-testid="input-city" /></div>
                  <div><Label>Postcode</Label><Input value={form.postcode} onChange={handleChange("postcode")} placeholder="M1 1AB" required data-testid="input-postcode" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#168A7B]" /> Payment</h2>
                <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">Demo mode — no real payment is taken</Badge>
                <p className="text-sm text-muted-foreground">In production this is where Stripe/payment is collected. For demo, click "Place order" below.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 bg-white rounded-2xl h-fit sticky top-24">
            <CardContent className="p-6 space-y-4">
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
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatGbp(itemsTotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{shipping === 0 ? "Free" : formatGbp(shipping)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span className="text-[#168A7B]">{formatGbp(total)}</span></div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full rounded-full bg-[#168A7B] hover:bg-[#0E5A52] h-12" data-testid="btn-place-order">
                {submitting ? "Placing order..." : "Place order"}
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

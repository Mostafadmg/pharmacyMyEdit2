import React from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart, formatGbp } from "@/hooks/useCart";

export default function Cart() {
  const [, navigate] = useLocation();
  const { items, updateQty, removeItem, itemsTotal, shipping, total } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-10 w-full flex-1">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Your basket</h1>
        <p className="text-muted-foreground mb-8">{items.length === 0 ? "Your basket is empty." : `${items.length} ${items.length === 1 ? "item" : "items"}`}</p>

        {items.length === 0 ? (
          <Card className="border-0 bg-white rounded-2xl">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg mb-4">Your basket is currently empty.</p>
              <Button asChild className="rounded-full bg-[#168A7B] hover:bg-[#0E5A52]">
                <Link href="/shop">Browse shop</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-[1fr,360px] gap-8">
            <div className="space-y-3">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                  >
                    <Card className="border-0 bg-white rounded-2xl">
                      <CardContent className="p-4 flex gap-4">
                        <Link href={`/product/${item.slug}`}>
                          <img src={item.imageUrl} alt={item.name} className="w-24 h-24 rounded-xl object-cover bg-muted" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          {item.brand && <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.brand}</p>}
                          <Link href={`/product/${item.slug}`} className="font-semibold hover:text-[#168A7B]">{item.name}</Link>
                          <p className="text-sm text-muted-foreground">{formatGbp(item.unitPriceGbp)} each</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border rounded-full overflow-hidden">
                              <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-1.5 hover:bg-muted" data-testid={`btn-cart-minus-${item.slug}`}><Minus className="w-3.5 h-3.5" /></button>
                              <span className="w-8 text-center text-sm font-semibold" data-testid={`cart-qty-${item.slug}`}>{item.quantity}</span>
                              <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-1.5 hover:bg-muted" data-testid={`btn-cart-plus-${item.slug}`}><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                            <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-rose-600 text-sm flex items-center gap-1" data-testid={`btn-cart-remove-${item.slug}`}>
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#168A7B]">{formatGbp(item.unitPriceGbp * item.quantity)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Card className="border-0 bg-white rounded-2xl h-fit sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Order summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatGbp(itemsTotal)}</span></div>
                  <div className="flex justify-between">
                    <span>Standard delivery</span>
                    <span>{shipping === 0 ? <span className="text-green-700 font-medium">Free</span> : formatGbp(shipping)}</span>
                  </div>
                  {itemsTotal < 2500 && (
                    <p className="text-xs text-muted-foreground">Add {formatGbp(2500 - itemsTotal)} for free delivery</p>
                  )}
                </div>
                <div className="border-t pt-4 flex justify-between items-baseline">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-[#168A7B]" data-testid="cart-total">{formatGbp(total)}</span>
                </div>
                <Button onClick={() => navigate("/checkout")} className="w-full rounded-full bg-[#168A7B] hover:bg-[#0E5A52] h-12" data-testid="btn-checkout">
                  Checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button asChild variant="ghost" className="w-full rounded-full">
                  <Link href="/shop">Continue shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

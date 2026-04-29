import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, ShoppingBag, Truck, ShieldCheck, Star, Plus, Minus, Filter, Zap, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useCart, formatGbp } from "@/hooks/useCart";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  classification: string;
  shortDescription: string;
  imageUrl: string;
  packSize: string | null;
  priceGbp: number;
  rrpGbp: number | null;
  stock: number;
  requiresConsultation: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  "pain-relief": "Pain Relief",
  "cold-flu": "Cold & Flu",
  allergy: "Allergy & Hayfever",
  digestive: "Digestive Health",
  skin: "Skin Care",
  "eye-care": "Eye & Ear Care",
  "first-aid": "First Aid",
  vitamins: "Vitamins",
  sleep: "Sleep & Stress",
  oral: "Oral Care",
  "foot-care": "Foot Care",
  "womens-health": "Women's Health",
};

export default function Shop() {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { addItem, items: cartItems, updateQty, removeItem } = useCart();
  const cartQtyById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of cartItems) m[it.productId] = it.quantity;
    return m;
  }, [cartItems]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (search.trim()) params.set("search", search.trim());
    apiFetch<{ products: Product[]; categories: Array<{ category: string; count: number }> }>(
      `/api/products?${params.toString()}`
    )
      .then(d => {
        setProducts(d.products);
        setCategories(d.categories);
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const handleQuickAdd = (p: Product) => {
    if (p.requiresConsultation) {
      toast.error("This product requires a consultation");
      return;
    }
    if (p.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    addItem({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      imageUrl: p.imageUrl,
      unitPriceGbp: p.priceGbp,
    });
    toast.success(`${p.name} added to basket`);
  };

  const handleBuyNow = (p: Product) => {
    if (p.requiresConsultation) {
      toast.error("This product requires a consultation");
      return;
    }
    if (p.stock <= 0) {
      toast.error("Out of stock");
      return;
    }
    addItem({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      imageUrl: p.imageUrl,
      unitPriceGbp: p.priceGbp,
    });
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#168A7B] to-[#0E5A52] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <Badge className="bg-white/20 text-white border-0 mb-4">UK Registered Pharmacy · GPhC 9011677</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Pharmacy Shop</h1>
            <p className="text-lg text-white/90 mb-6">
              Trusted UK pharmacy products, dispatched same-day from our Manchester pharmacy. Free standard delivery on orders over £25.
            </p>
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#168A7B]" />
              <Input
                placeholder="Search paracetamol, hayfever, vitamins..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-full bg-white text-foreground border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-white/50 placeholder:text-muted-foreground"
                data-testid="input-shop-search"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#168A7B]" /> Free UK delivery £25+</div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#168A7B]" /> GPhC registered</div>
          <div className="flex items-center gap-2"><Star className="w-4 h-4 text-[#168A7B]" /> 4.8 rating from 12k reviews</div>
          <div className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-[#168A7B]" /> Same-day dispatch</div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Category filter bar — horizontal scrollable chips */}
        <div className="mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                activeCategory === "all"
                  ? "bg-[#168A7B] border-[#168A7B] text-white shadow-sm"
                  : "bg-white border-border text-foreground hover:border-[#168A7B]/40 hover:text-[#168A7B]"
              }`}
              data-testid="btn-category-all"
            >
              All products
            </button>
            {categories.map(c => (
              <button
                key={c.category}
                onClick={() => setActiveCategory(c.category)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                  activeCategory === c.category
                    ? "bg-[#168A7B] border-[#168A7B] text-white shadow-sm"
                    : "bg-white border-border text-foreground hover:border-[#168A7B]/40 hover:text-[#168A7B]"
                }`}
                data-testid={`btn-category-${c.category}`}
              >
                {CATEGORY_LABELS[c.category] ?? c.category}
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeCategory === c.category ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product grid — full width */}
        <div>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-xl font-bold">
                {activeCategory === "all" ? "All products" : CATEGORY_LABELS[activeCategory] ?? activeCategory}
              </h2>
              <p className="text-sm text-muted-foreground">{products?.length ?? 0} products</p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="group overflow-hidden border-0 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col" data-testid={`product-card-${p.slug}`}>
                      <Link href={`/product/${p.slug}`}>
                        <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted overflow-hidden relative">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          {p.classification === "P" && (
                            <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-500 text-white border-0">Pharmacy</Badge>
                          )}
                          {p.rrpGbp && p.rrpGbp > p.priceGbp && (
                            <Badge className="absolute top-3 right-3 bg-rose-500 hover:bg-rose-500 text-white border-0">
                              Save {formatGbp(p.rrpGbp - p.priceGbp)}
                            </Badge>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <Link href={`/product/${p.slug}`}>
                          {p.brand && <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{p.brand}</p>}
                          <h3 className="font-semibold leading-snug text-base line-clamp-2 mb-1.5 hover:text-[#168A7B] transition-colors">{p.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.shortDescription}</p>
                          {p.packSize && <p className="text-xs text-muted-foreground mb-3">{p.packSize}</p>}
                        </Link>
                        <div className="mt-auto space-y-2">
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-bold text-[#168A7B]" data-testid={`product-price-${p.slug}`}>{formatGbp(p.priceGbp)}</p>
                              {p.rrpGbp && p.rrpGbp > p.priceGbp && (
                                <p className="text-xs text-muted-foreground line-through">{formatGbp(p.rrpGbp)}</p>
                              )}
                            </div>
                            {p.requiresConsultation ? (
                              <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-0">Consult required</Badge>
                            ) : p.stock <= 0 ? (
                              <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-700 border-0">Out of stock</Badge>
                            ) : null}
                          </div>
                          {!p.requiresConsultation && p.stock > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {(cartQtyById[p.id] ?? 0) === 0 ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickAdd(p)}
                                  className="rounded-full border-[#168A7B] text-[#168A7B] hover:bg-[#168A7B]/5"
                                  data-testid={`btn-add-${p.slug}`}
                                >
                                  <Plus className="w-4 h-4 mr-1" /> Add
                                </Button>
                              ) : (
                                <div
                                  className="flex items-center justify-between rounded-full border border-[#168A7B] bg-[#168A7B]/5 overflow-hidden h-9"
                                  data-testid={`stepper-${p.slug}`}
                                >
                                  <button
                                    type="button"
                                    aria-label="Decrease quantity"
                                    onClick={() => {
                                      const next = (cartQtyById[p.id] ?? 1) - 1;
                                      if (next <= 0) removeItem(p.id);
                                      else updateQty(p.id, next);
                                    }}
                                    className="px-3 h-full text-[#168A7B] hover:bg-[#168A7B]/10 flex items-center"
                                    data-testid={`btn-stepper-minus-${p.slug}`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="font-semibold text-sm text-[#0E5A52] flex items-center gap-1" data-testid={`text-stepper-qty-${p.slug}`}>
                                    <Check className="w-3.5 h-3.5" /> {cartQtyById[p.id]}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Increase quantity"
                                    onClick={() => {
                                      const cur = cartQtyById[p.id] ?? 0;
                                      if (cur >= Math.min(20, p.stock)) {
                                        toast.error(`Only ${p.stock} available`);
                                        return;
                                      }
                                      updateQty(p.id, cur + 1);
                                    }}
                                    className="px-3 h-full text-[#168A7B] hover:bg-[#168A7B]/10 flex items-center"
                                    data-testid={`btn-stepper-plus-${p.slug}`}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleBuyNow(p)}
                                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full"
                                data-testid={`btn-buy-now-${p.slug}`}
                              >
                                <Zap className="w-4 h-4 mr-1" /> Buy now
                              </Button>
                            </div>
                          )}
                          {p.requiresConsultation && (
                            <Button asChild size="sm" variant="outline" className="w-full rounded-full" data-testid={`btn-consult-${p.slug}`}>
                              <Link href="/conditions">Start consultation</Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center">
                <p className="text-muted-foreground">No products match your search.</p>
              </div>
            )}
          </div>
      </div>

      <Footer />
    </div>
  );
}

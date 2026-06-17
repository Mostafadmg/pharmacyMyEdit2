import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Star,
  Plus,
  Minus,
  Filter,
  Check,
  ImageIcon,
} from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useCart, formatGbp } from "@/hooks/useCart";
import WishlistButton from "@/components/WishlistButton";
import ShopCategoryBar from "@/components/ShopCategoryBar";
import CategoryCardGrid from "@/components/marketing/CategoryCardGrid";
import GphcTrustSection from "@/components/marketing/GphcTrustSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import HomeFAQ from "@/components/HomeFAQ";
import { SHOP_CATEGORY_CARDS } from "@/data/everydaymedsSite";
import { useSeo } from "@/hooks/useSeo";

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
  tags?: string[];
};

function reviewCountFromTags(tags?: string[]): number | null {
  for (const t of tags ?? []) {
    const m = /^(\d+)-reviews$/.exec(t);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  "pain-relief": "Pain Relief",
  "cold-flu": "Cold & Flu",
  allergy: "Allergy & Hayfever",
  digestive: "Digestive Health",
  skin: "Skin Care",
  "eye-care": "Eye & Ear Care",
  "first-aid": "First Aid",
  vitamins: "Vitamins & Supplements",
  sleep: "Sleep & Stress",
  oral: "Oral Care",
  "foot-care": "Foot Care",
  "womens-health": "Women's Health",
  "weight-loss": "Weight Loss",
  "erectile-dysfunction": "Men's Health (ED)",
  migraine: "Migraine",
  asthma: "Asthma",
  acne: "Acne",
  "hair-loss": "Hair Loss",
  "travel-health": "Travel Health",
  "sexual-health": "Sexual Health",
  "stop-smoking": "Stop Smoking",
  "general-health": "General Health",
};

export default function Shop() {
  useSeo({
    title: "Pharmacy Shop · UK pharmacy products with free delivery",
    description:
      "Shop UK pharmacy medicines, vitamins and skincare from EveryDayMeds. Free tracked next-day delivery on orders over £25, dispatched same-day from a GPhC-registered pharmacy.",
    canonicalPath: "/shop",
  });
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<
    Array<{ category: string; count: number }>
  >([]);
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
    const q = new URLSearchParams(params);
    q.set("limit", "1500");
    apiFetch<{
      products: Product[];
      categories: Array<{ category: string; count: number }>;
    }>(`/api/products?${q.toString()}`)
      .then((d) => {
        setProducts(d.products);
        setCategories(d.categories);
      })
      .catch((e) => {
        // If the API is unavailable (dev server / database not running), fall back to a small local catalog
        toast.error(
          e.message || "Failed to load products — showing local demo catalog",
        );
        const fallback: Product[] = [
          {
            id: "paracetamol-500mg-16",
            slug: "paracetamol-500mg-16",
            name: "Panadol Advance 500mg Tablets",
            brand: "Panadol",
            category: "pain-relief",
            classification: "GSL",
            shortDescription:
              "Effective relief from headache, toothache, period pain and fever.",
            imageUrl: "/products/paracetamol-500mg-16.jpg",
            packSize: "16 tablets",
            priceGbp: 99,
            rrpGbp: 150,
            stock: 250,
            requiresConsultation: false,
          },
          {
            id: "ibuprofen-200mg-16",
            slug: "ibuprofen-200mg-16",
            name: "Nurofen 200mg Tablets",
            brand: "Nurofen",
            category: "pain-relief",
            classification: "GSL",
            shortDescription:
              "Anti-inflammatory pain relief for muscle aches, joint pain and headaches.",
            imageUrl: "/products/ibuprofen-200mg-16.webp",
            packSize: "16 tablets",
            priceGbp: 129,
            rrpGbp: 199,
            stock: 240,
            requiresConsultation: false,
          },
          {
            id: "loratadine-10mg-30",
            slug: "loratadine-10mg-30",
            name: "Clarityn Allergy Loratadine 10mg Tablets",
            brand: "Clarityn",
            category: "allergy",
            classification: "GSL",
            shortDescription:
              "Once-a-day non-drowsy hayfever and allergy relief.",
            imageUrl: "/products/loratadine-10mg-30.webp",
            packSize: "30 tablets",
            priceGbp: 449,
            rrpGbp: 699,
            stock: 300,
            requiresConsultation: false,
          },
        ];
        setProducts(fallback);
        setCategories([
          { category: "pain-relief", count: 2 },
          { category: "allergy", count: 1 },
        ]);
      })
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
      category: p.category,
    });
    toast.success(`${p.name} added to basket`);
  };

  const bumpQty = (p: Product, delta: number) => {
    if (p.requiresConsultation) return;
    const cur = cartQtyById[p.id] ?? 0;
    const next = cur + delta;
    if (next <= 0) {
      if (cur > 0) removeItem(p.id);
      return;
    }
    if (next > Math.min(20, p.stock)) {
      toast.error(`Only ${p.stock} available`);
      return;
    }
    if (cur === 0) {
      addItem({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        imageUrl: p.imageUrl,
        unitPriceGbp: p.priceGbp,
        category: p.category,
      });
      if (next > 1) updateQty(p.id, next);
      toast.success(`${p.name} added to basket`);
      return;
    }
    updateQty(p.id, next);
  };

  return (
    <SiteLayout className="min-h-screen flex flex-col bg-[#faf6f3] edm-site">

      {/* Hero */}
      <section className="border-b border-border/50 bg-gradient-to-b from-white to-muted/20 py-14">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-secondary mb-4">
              How can we assist you today?
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover all your healthcare essentials, conveniently organised into categories for easy browsing and shopping.
            </p>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search paracetamol, hayfever, vitamins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-full bg-white text-foreground border border-border shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-muted-foreground"
                data-testid="input-shop-search"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {activeCategory === "all" && !search.trim() ? (
        <section className="bg-white py-12 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-6">
            <CategoryCardGrid
              items={SHOP_CATEGORY_CARDS}
              columns={5}
              showImages
              testIdPrefix="shop-category"
            />
          </div>
        </section>
      ) : null}

      {/* Trust strip */}
      <section className="bg-white border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#0E3D2D]" /> Free UK delivery £25+
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0E3D2D]" /> GPhC registered
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#0E3D2D]" /> 4.8 rating from 12k
            reviews
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#0E3D2D]" /> Same-day dispatch
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="mb-6">
          <ShopCategoryBar
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            categoryLabels={CATEGORY_LABELS}
          />
        </div>

        {/* Product grid — full width */}
        <div>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-xl font-bold">
              {activeCategory === "all"
                ? "All products"
                : (CATEGORY_LABELS[activeCategory] ?? activeCategory)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {products?.length ?? 0} products
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="group overflow-hidden border-0 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative"
                    data-testid={`product-card-${p.slug}`}
                  >
                    <Link href={`/product/${p.slug}`}>
                      <div className="aspect-square bg-white overflow-hidden relative border-b border-border/30">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 bg-[#FAF7F2]">
                            <ImageIcon className="w-10 h-10 opacity-30" />
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                        {p.requiresConsultation && (
                          <Badge className="absolute top-3 left-3 bg-[#0E3D2D] hover:bg-[#0E3D2D] text-white border-0">
                            Consultation
                          </Badge>
                        )}
                        {!p.requiresConsultation && p.classification === "P" && (
                          <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-500 text-white border-0">
                            Pharmacy
                          </Badge>
                        )}
                        {p.rrpGbp && p.rrpGbp > p.priceGbp && (
                          <Badge className="absolute top-3 right-3 bg-rose-500 hover:bg-rose-500 text-white border-0">
                            Save {formatGbp(p.rrpGbp - p.priceGbp)}
                          </Badge>
                        )}
                      </div>
                    </Link>
                    <div className="absolute top-3 right-3 z-10">
                      <WishlistButton
                        productId={p.id}
                        slug={p.slug}
                        name={p.name}
                        brand={p.brand}
                        imageUrl={p.imageUrl}
                        unitPriceGbp={p.priceGbp}
                      />
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <Link href={`/product/${p.slug}`}>
                        {p.brand && (
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                            {p.brand}
                          </p>
                        )}
                        <h3 className="font-serif font-semibold leading-snug text-base line-clamp-2 mb-1 hover:text-[#0E3D2D] transition-colors text-secondary">
                          {p.name}
                        </h3>
                        {reviewCountFromTags(p.tags) != null ? (
                          <div className="flex items-center gap-1 mb-2">
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className="w-3.5 h-3.5 fill-current"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {reviewCountFromTags(p.tags)!.toLocaleString()}{" "}
                              reviews
                            </span>
                          </div>
                        ) : null}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {p.shortDescription}
                        </p>
                        {p.packSize && (
                          <p className="text-xs text-muted-foreground mb-3">
                            {p.packSize}
                          </p>
                        )}
                      </Link>
                      <div className="mt-auto space-y-2">
                        <div className="flex items-end justify-between">
                          <div>
                            <p
                              className="text-2xl font-bold text-[#0E3D2D]"
                              data-testid={`product-price-${p.slug}`}
                            >
                              {formatGbp(p.priceGbp)}
                            </p>
                            {p.rrpGbp && p.rrpGbp > p.priceGbp && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatGbp(p.rrpGbp)}
                              </p>
                            )}
                          </div>
                          {p.requiresConsultation ? (
                            <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-0">
                              Consult required
                            </Badge>
                          ) : p.stock <= 0 ? (
                            <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-700 border-0">
                              Out of stock
                            </Badge>
                          ) : null}
                        </div>
                        {!p.requiresConsultation && p.stock > 0 && (
                          <div className="space-y-2">
                            <div
                              className="flex items-center justify-between rounded-full border border-[#0E3D2D]/40 bg-white overflow-hidden h-9 shrink-0"
                              data-testid={`stepper-${p.slug}`}
                            >
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={(cartQtyById[p.id] ?? 0) === 0}
                                onClick={() => bumpQty(p, -1)}
                                className="px-2.5 h-full text-[#0E3D2D] hover:bg-[#0E3D2D]/10 flex items-center disabled:opacity-30 disabled:pointer-events-none"
                                data-testid={`btn-stepper-minus-${p.slug}`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span
                                className="font-semibold text-sm text-[#0E5A52] min-w-[1.25rem] text-center tabular-nums"
                                data-testid={`text-stepper-qty-${p.slug}`}
                              >
                                {cartQtyById[p.id] ?? 0}
                              </span>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                onClick={() => bumpQty(p, 1)}
                                className="px-2.5 h-full text-[#0E3D2D] hover:bg-[#0E3D2D]/10 flex items-center"
                                data-testid={`btn-stepper-plus-${p.slug}`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {(cartQtyById[p.id] ?? 0) === 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleQuickAdd(p)}
                                className="w-full rounded-full bg-[#0E3D2D] hover:bg-[#0E5A52] text-white"
                                data-testid={`btn-add-${p.slug}`}
                              >
                                <ShoppingBag className="w-4 h-4 mr-1.5" />
                                Add to basket
                              </Button>
                            )}
                            {(cartQtyById[p.id] ?? 0) > 0 && (
                              <p className="text-xs text-[#0E5A52] font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                In basket
                              </p>
                            )}
                          </div>
                        )}
                        {p.requiresConsultation && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="w-full rounded-full"
                            data-testid={`btn-consult-${p.slug}`}
                          >
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
              <p className="text-muted-foreground">
                No products match your search.
              </p>
            </div>
          )}
        </div>
      </div>

      {activeCategory === "all" && !search.trim() ? (
        <>
          <GphcTrustSection />
          <HowItWorksSection />
          <HomeFAQ variant="live" />
        </>
      ) : null}
    </SiteLayout>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, ShoppingBag, ShieldCheck, Truck, Check, AlertTriangle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useCart, formatGbp } from "@/hooks/useCart";
import { recordRecentlyViewed } from "@/hooks/useWishlist";
import RecentlyViewedStrip from "@/components/RecentlyViewedStrip";
import WishlistButton from "@/components/WishlistButton";
import { useSeo } from "@/hooks/useSeo";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  classification: string;
  shortDescription: string;
  longDescription: string;
  ingredients: string | null;
  directions: string | null;
  warnings: string | null;
  imageUrl: string;
  packSize: string | null;
  priceGbp: number;
  rrpGbp: number | null;
  stock: number;
  requiresConsultation: boolean;
};

export default function ProductDetail() {
  const [, params] = useRoute<{ id: string }>("/product/:id");
  const [, navigate] = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem, items: cartItems, updateQty, removeItem } = useCart();
  const inCart = product ? cartItems.find(i => i.productId === product.id) : null;
  const inCartQty = inCart?.quantity ?? 0;

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    apiFetch<{ product: Product }>(`/api/products/${params.id}`)
      .then(d => {
        setProduct(d.product);
        recordRecentlyViewed({
          productId: d.product.id,
          slug: d.product.slug,
          name: d.product.name,
          brand: d.product.brand,
          imageUrl: d.product.imageUrl,
          unitPriceGbp: d.product.priceGbp,
        });
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  useSeo(product ? {
    title: `${product.name}${product.brand ? ` (${product.brand})` : ""}`,
    description: product.shortDescription,
    canonicalPath: `/product/${product.slug}`,
    ogImage: product.imageUrl,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
      image: product.imageUrl,
      description: product.shortDescription,
      sku: product.id,
      offers: {
        "@type": "Offer",
        priceCurrency: "GBP",
        price: (product.priceGbp / 100).toFixed(2),
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `/product/${product.slug}`,
      },
    },
  } : { title: "Loading product…" });

  const handleAdd = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      unitPriceGbp: product.priceGbp,
      category: product.category,
    }, qty);
    toast.success(`Added ${qty} × ${product.name} to basket`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      unitPriceGbp: product.priceGbp,
      category: product.category,
    }, qty);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to shop
        </Link>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-10">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : product ? (
          <>
            <div className="grid md:grid-cols-2 gap-10">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 relative">
                <div className="absolute top-9 right-9 z-10">
                  <WishlistButton
                    productId={product.id}
                    slug={product.slug}
                    name={product.name}
                    brand={product.brand}
                    imageUrl={product.imageUrl}
                    unitPriceGbp={product.priceGbp}
                    size="lg"
                  />
                </div>
                <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {product.brand && <p className="text-sm uppercase tracking-wider text-muted-foreground font-medium">{product.brand}</p>}
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">{product.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {product.classification === "P" && (
                    <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0">Pharmacy Medicine</Badge>
                  )}
                  {product.classification === "GSL" && (
                    <Badge variant="outline" className="border-[#0E3D2D]/40 text-[#0E3D2D]">General Sales</Badge>
                  )}
                  {product.packSize && <Badge variant="outline">{product.packSize}</Badge>}
                  {product.stock > 10 ? (
                    <Badge className="bg-green-100 hover:bg-green-100 text-green-700 border-0">In stock</Badge>
                  ) : product.stock > 0 ? (
                    <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-700 border-0">Only {product.stock} left</Badge>
                  ) : (
                    <Badge className="bg-rose-100 hover:bg-rose-100 text-rose-700 border-0">Out of stock</Badge>
                  )}
                </div>

                <p className="text-lg text-muted-foreground">{product.shortDescription}</p>

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-[#0E3D2D]" data-testid="product-detail-price">{formatGbp(product.priceGbp)}</span>
                  {product.rrpGbp && product.rrpGbp > product.priceGbp && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">{formatGbp(product.rrpGbp)}</span>
                      <Badge className="bg-rose-500 hover:bg-rose-500 text-white border-0">
                        Save {formatGbp(product.rrpGbp - product.priceGbp)}
                      </Badge>
                    </>
                  )}
                </div>

                {!product.requiresConsultation && product.stock > 0 ? (
                  inCartQty > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0E3D2D]/5 border border-[#0E3D2D]/30 rounded-xl">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#0E5A52]">
                          <Check className="w-4 h-4" />
                          <span>{inCartQty} in your basket</span>
                        </div>
                        <div className="flex items-center border border-[#0E3D2D] rounded-full overflow-hidden bg-white">
                          <button
                            type="button"
                            aria-label="Decrease basket quantity"
                            onClick={() => {
                              if (inCartQty <= 1) removeItem(product.id);
                              else updateQty(product.id, inCartQty - 1);
                            }}
                            className="p-2 hover:bg-muted text-[#0E3D2D]"
                            data-testid="btn-cart-qty-minus"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-semibold text-[#0E5A52]" data-testid="text-cart-qty">{inCartQty}</span>
                          <button
                            type="button"
                            aria-label="Increase basket quantity"
                            onClick={() => {
                              if (inCartQty >= Math.min(20, product.stock)) {
                                toast.error(`Only ${product.stock} available`);
                                return;
                              }
                              updateQty(product.id, inCartQty + 1);
                            }}
                            className="p-2 hover:bg-muted text-[#0E3D2D]"
                            data-testid="btn-cart-qty-plus"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <Button asChild size="lg" className="w-full rounded-full bg-[#0E3D2D] hover:bg-[#0E5A52]" data-testid="btn-go-to-basket">
                        <Link href="/cart"><ShoppingBag className="w-4 h-4 mr-2" /> View basket</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">Quantity</span>
                        <div className="flex items-center border rounded-full overflow-hidden bg-white">
                          <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-muted" data-testid="btn-qty-minus"><Minus className="w-4 h-4" /></button>
                          <span className="w-10 text-center font-semibold" data-testid="text-qty">{qty}</span>
                          <button onClick={() => setQty(Math.min(20, qty + 1))} className="p-2 hover:bg-muted" data-testid="btn-qty-plus"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <Button onClick={handleAdd} variant="outline" size="lg" className="rounded-full border-[#0E3D2D] text-[#0E3D2D] hover:bg-[#0E3D2D]/5" data-testid="btn-add-to-cart">
                          <ShoppingBag className="w-4 h-4 mr-2" /> Add to basket
                        </Button>
                        <Button onClick={handleBuyNow} size="lg" className="rounded-full bg-[#0E3D2D] hover:bg-[#0E5A52]" data-testid="btn-buy-now">
                          Buy now
                        </Button>
                      </div>
                    </>
                  )
                ) : product.requiresConsultation ? (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">Consultation required</p>
                        <p className="text-sm text-amber-800">
                          A pharmacist needs to review a short questionnaire before this product can be supplied.
                        </p>
                        <Button asChild variant="link" className="px-0 text-amber-900">
                          <Link href="/conditions">Start consultation</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center text-xs text-muted-foreground">
                    <Truck className="w-5 h-5 mx-auto mb-1 text-[#0E3D2D]" /> Same-day dispatch
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-[#0E3D2D]" /> GPhC pharmacy
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    <Check className="w-5 h-5 mx-auto mb-1 text-[#0E3D2D]" /> Free over £25
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Tabs */}
            <div className="mt-12 bg-white rounded-2xl p-6 md:p-8">
              <Tabs defaultValue="description">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  {product.ingredients && <TabsTrigger value="ingredients">Ingredients</TabsTrigger>}
                  {product.directions && <TabsTrigger value="directions">Directions</TabsTrigger>}
                  {product.warnings && <TabsTrigger value="warnings">Warnings</TabsTrigger>}
                </TabsList>
                <TabsContent value="description" className="prose prose-sm max-w-none mt-6">
                  <p>{product.longDescription || product.shortDescription}</p>
                </TabsContent>
                {product.ingredients && (
                  <TabsContent value="ingredients" className="prose prose-sm max-w-none mt-6">
                    <p>{product.ingredients}</p>
                  </TabsContent>
                )}
                {product.directions && (
                  <TabsContent value="directions" className="prose prose-sm max-w-none mt-6">
                    <p>{product.directions}</p>
                  </TabsContent>
                )}
                {product.warnings && (
                  <TabsContent value="warnings" className="prose prose-sm max-w-none mt-6">
                    <div className="flex gap-2 items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p>{product.warnings}</p>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-12">Product not found.</p>
        )}
      </div>
      <RecentlyViewedStrip excludeProductId={product?.id} />
      <Footer />
    </div>
  );
}

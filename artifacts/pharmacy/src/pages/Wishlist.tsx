import React from "react";
import { Link } from "wouter";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart, formatGbp } from "@/hooks/useCart";
import { useSeo } from "@/hooks/useSeo";
import { toast } from "sonner";

export default function Wishlist() {
  const { items, remove } = useWishlist();
  const { addItem } = useCart();

  useSeo({ title: "My Wishlist", noindex: true });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <h1 className="text-3xl md:text-4xl font-bold">Your wishlist</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            {items.length === 0 ? "You haven't saved anything yet." : `${items.length} ${items.length === 1 ? "item" : "items"} saved`}
          </p>

          {items.length === 0 ? (
            <div className="text-center bg-white rounded-3xl border border-dashed border-border py-20">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg mb-4">Tap the heart on any product to save it for later.</p>
              <Button asChild className="rounded-full bg-primary hover:bg-primary/90"><Link href="/shop">Browse the shop</Link></Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((it) => (
                <article key={it.productId} className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col" data-testid={`wishlist-item-${it.slug}`}>
                  <Link href={`/product/${it.slug}`}>
                    <div className="aspect-square bg-muted/40 overflow-hidden">
                      <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                  </Link>
                  <div className="p-5 flex-1 flex flex-col">
                    {it.brand && <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{it.brand}</p>}
                    <Link href={`/product/${it.slug}`} className="font-semibold leading-snug hover:text-primary mb-2 line-clamp-2">{it.name}</Link>
                    <p className="text-2xl font-bold text-primary mb-4">{formatGbp(it.unitPriceGbp)}</p>
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          addItem({
                            productId: it.productId,
                            slug: it.slug,
                            name: it.name,
                            brand: it.brand,
                            imageUrl: it.imageUrl,
                            unitPriceGbp: it.unitPriceGbp,
                          });
                          toast.success(`${it.name} added to basket`);
                        }}
                        className="rounded-full bg-primary hover:bg-primary/90"
                      >
                        <ShoppingBag className="w-4 h-4 mr-1" /> Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(it.productId)} className="rounded-full" data-testid={`btn-remove-${it.slug}`}>
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

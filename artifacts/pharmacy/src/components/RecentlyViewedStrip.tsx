import React from "react";
import { Link } from "wouter";
import { Eye } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useWishlist";
import { formatGbp } from "@/hooks/useCart";

export default function RecentlyViewedStrip({ excludeProductId }: { excludeProductId?: string }) {
  const items = useRecentlyViewed(excludeProductId);
  if (items.length === 0) return null;

  return (
    <section className="border-t border-border/60 py-12 bg-muted/20" data-testid="recently-viewed-strip">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-bold text-secondary flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Recently viewed
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
          {items.map((it) => (
            <Link key={it.productId} href={`/product/${it.slug}`}>
              <article
                className="snap-start shrink-0 w-44 bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                data-testid={`recently-viewed-${it.slug}`}
              >
                <div className="aspect-square bg-muted/40 overflow-hidden">
                  <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-3">
                  {it.brand && <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{it.brand}</p>}
                  <p className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5">{it.name}</p>
                  <p className="text-sm font-bold text-primary">{formatGbp(it.unitPriceGbp)}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

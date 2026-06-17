import React, { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ChevronDown, Filter, ImageIcon, ShoppingBag, SlidersHorizontal } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useCart, formatGbp } from "@/hooks/useCart";
import { useSeo } from "@/hooks/useSeo";
import { getCollectionMeta } from "@/data/shopMenu";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  shortDescription: string;
  imageUrl: string;
  packSize: string | null;
  priceGbp: number;
  stock: number;
  requiresConsultation: boolean;
};

type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  "price-asc": "Price, low to high",
  "price-desc": "Price, high to low",
  "name-asc": "Alphabetically, A-Z",
};

export default function ShopCollection() {
  const [, params] = useRoute<{ slug: string }>("/collections/:slug");
  const slug = params?.slug ?? "all";
  const meta = getCollectionMeta(slug);

  useSeo({
    title: `${meta.title} · EveryDayMeds`,
    description: meta.description ?? `Shop ${meta.title} at EveryDayMeds UK online pharmacy.`,
    canonicalPath: `/collections/${slug}`,
  });

  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("featured");
  const [filterOpen, setFilterOpen] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (meta.productCategory) q.set("category", meta.productCategory);
    q.set("limit", "500");

    apiFetch<{ products: Product[] }>(`/api/products?${q.toString()}`)
      .then((d) => setProducts(d.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, meta.productCategory]);

  const sortedProducts = useMemo(() => {
    const list = [...(products ?? [])];
    switch (sort) {
      case "price-asc":
        return list.sort((a, b) => a.priceGbp - b.priceGbp);
      case "price-desc":
        return list.sort((a, b) => b.priceGbp - a.priceGbp);
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [products, sort]);

  const handleAdd = (p: Product) => {
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

  return (
    <SiteLayout className="min-h-screen flex flex-col bg-[#faf6f3]">
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-[#314a40]">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              {meta.breadcrumbParent ? (
                <>
                  <li>
                    <Link href={meta.breadcrumbParent.href} className="hover:text-[#314a40]">
                      {meta.breadcrumbParent.label}
                    </Link>
                  </li>
                  <li aria-hidden="true">·</li>
                </>
              ) : null}
              <li className="text-[#314a40] font-medium">{meta.title}</li>
            </ol>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{meta.title}</h1>
              {meta.description ? (
                <p className="mt-2 text-gray-600 max-w-2xl">{meta.description}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                className="lg:hidden rounded-full border-gray-300"
                onClick={() => setFilterOpen((v) => !v)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>

              <div className="relative">
                <label htmlFor="collection-sort" className="sr-only">
                  Sort by
                </label>
                <select
                  id="collection-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="appearance-none rounded-full border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm text-gray-700 outline-none focus:border-[#314a40]/40 min-w-[190px]"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <option key={key} value={key}>
                      {SORT_LABELS[key]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            <aside
              className={cn(
                "w-full lg:w-56 shrink-0",
                filterOpen ? "block" : "hidden lg:block",
              )}
            >
              <div className="rounded-2xl border border-gray-200 bg-white p-5 sticky top-28">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Products Category</h3>
                    <p className="text-gray-500">{meta.title}</p>
                  </div>
                  <Link
                    href="/shop"
                    className="inline-block text-[#314a40] font-medium hover:underline"
                  >
                    View all shop
                  </Link>
                </div>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-72 rounded-2xl" />
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {sortedProducts.map((p) => (
                    <article
                      key={p.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Link href={`/product/${p.slug}`}>
                        <div className="aspect-square bg-white border-b border-gray-100 overflow-hidden">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-contain p-4 group-hover:scale-[1.02] transition-transform"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center text-gray-400 gap-2">
                              <ImageIcon className="h-10 w-10 opacity-30" />
                              <span className="text-xs">No image</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col p-4">
                        {p.brand ? (
                          <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                            {p.brand}
                          </p>
                        ) : null}
                        <Link href={`/product/${p.slug}`}>
                          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-gray-900 hover:text-[#314a40]">
                            {p.name}
                          </h3>
                        </Link>
                        {p.packSize ? (
                          <p className="mt-1 text-xs text-gray-500">{p.packSize}</p>
                        ) : null}
                        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                          <p className="text-lg font-bold text-[#314a40]">{formatGbp(p.priceGbp)}</p>
                          {!p.requiresConsultation && p.stock > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => handleAdd(p)}
                              className="rounded-full bg-[#314a40] hover:bg-[#2a4038] text-white h-8 px-3"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
                  <p className="text-lg font-semibold text-gray-800">No products found</p>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    Use the search bar or browse other categories to find what you need.
                  </p>
                  <Button asChild className="mt-6 rounded-full bg-[#314a40] hover:bg-[#2a4038]">
                    <Link href="/shop">Back to shop</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Pill, Plus, Search, Edit, TrendingUp, PoundSterling, Package } from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";

type Product = {
  id: string; slug: string; name: string; brand: string | null; category: string;
  classification: string; imageUrl: string; priceGbp: number; stock: number; active: boolean;
};
type ProductSale = { product_id: string; product_name: string; units_sold: number; revenue: string };
type Analytics = {
  totals: { orders: number; revenue: string };
  byProduct: ProductSale[];
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch<{ products: Product[] }>("/api/products?includeInactive=true&limit=200", { auth: "pharmacist" }),
      apiFetch<Analytics>("/api/admin/analytics/sales", { auth: "pharmacist" }),
    ])
      .then(([p, a]) => { setProducts(p.products); setAnalytics(a); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const salesByProduct = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number }>();
    (analytics?.byProduct ?? []).forEach(s => {
      map.set(s.product_id, { units: Number(s.units_sold), revenue: Number(s.revenue) });
    });
    return map;
  }, [analytics]);

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.brand?.toLowerCase().includes(q) ?? false));
  }, [products, search]);

  const totalRevenue = analytics ? Number(analytics.totals.revenue) : 0;
  const totalOrders = analytics?.totals.orders ?? 0;

  return (
    <PharmacistLayout current="products">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Pill className="w-7 h-7 text-primary" /> Products</h1>
            <p className="text-muted-foreground">Catalogue, stock & sales analytics.</p>
          </div>
          <Button asChild className="rounded-full" data-testid="btn-new-product">
            <Link href="/dashboard/products/new"><Plus className="w-4 h-4 mr-1" /> New product</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-3"><PoundSterling className="w-8 h-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
              <div><p className="text-2xl font-bold">{formatGbp(totalRevenue)}</p><p className="text-xs text-muted-foreground">All-time revenue</p></div>
            </div></CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-3"><TrendingUp className="w-8 h-8 text-blue-600 p-1.5 bg-blue-100 rounded-lg" />
              <div><p className="text-2xl font-bold">{totalOrders}</p><p className="text-xs text-muted-foreground">Orders placed</p></div>
            </div></CardContent></Card>
          <Card><CardContent className="p-5">
            <div className="flex items-center gap-3"><Package className="w-8 h-8 text-amber-600 p-1.5 bg-amber-100 rounded-lg" />
              <div><p className="text-2xl font-bold">{products?.filter(p => p.active).length ?? 0}</p><p className="text-xs text-muted-foreground">Active SKUs</p></div>
            </div></CardContent></Card>
        </div>

        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-products-search" />
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Units sold</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(p => {
                  const sales = salesByProduct.get(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-muted/20" data-testid={`product-row-${p.slug}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            {p.brand && <p className="text-xs text-muted-foreground">{p.brand}</p>}
                          </div>
                          {!p.active && <Badge variant="outline" className="text-rose-600 border-rose-200">Inactive</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{p.category.replace(/-/g, " ")}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatGbp(p.priceGbp)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={p.stock < 20 ? "text-amber-600 font-medium" : ""}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-right">{sales?.units ?? 0}</td>
                      <td className="px-4 py-3 text-right">{sales ? formatGbp(sales.revenue) : "—"}</td>
                      <td className="px-4 py-3">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/products/${p.id}/edit`}><Edit className="w-4 h-4" /></Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PharmacistLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ExternalLink,
  Image as ImageIcon,
  Plus,
  Search,
  Store,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { RxPageTitle, RxShell } from "@/components/rx";
import { apiFetch } from "@/lib/api";
import { patientAppUrl } from "@/lib/portalLinks";
import {
  formatShopGbp,
  SHOP_CATEGORY_LABELS,
  type ShopProduct,
} from "@/lib/shopProducts";
import { useToast } from "@/hooks/use-toast";

export function ShopAdmin() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ShopProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    apiFetch<{ products: ShopProduct[] }>(
      "/api/products?includeInactive=true&limit=500",
    )
      .then((d) => setProducts(d.products))
      .catch((e) =>
        toast({
          title: "Could not load products",
          description: e instanceof Error ? e.message : "Request failed",
          variant: "destructive",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.brand?.toLowerCase().includes(q) ?? false),
    );
  }, [products, search]);

  const toggleActive = async (p: ShopProduct, active: boolean) => {
    setSavingId(p.id);
    try {
      const res = await apiFetch<{ product: ShopProduct }>(
        `/api/admin/products/${p.id}`,
        { method: "PATCH", body: JSON.stringify({ active }) },
      );
      setProducts((prev) =>
        prev?.map((x) => (x.id === p.id ? { ...x, ...res.product } : x)) ?? null,
      );
      toast({ title: active ? "Published to shop" : "Unpublished" });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const activeCount = products?.filter((p) => p.active).length ?? 0;

  return (
    <RxShell wide>
      <RxPageTitle
        title="Shop"
        subtitle="Manage OTC products shown in the patient Pharmacare shop. Use clean packaging photos on a white background."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <a
                href={`${patientAppUrl()}/shop`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                View patient shop
              </a>
            </Button>
            <Button size="sm" asChild className="gap-1.5" data-testid="btn-new-shop-product">
              <Link href="/shop/new">
                <Plus className="h-4 w-4" />
                Add new item
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Store className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
            <div>
              <p className="text-2xl font-serif font-semibold text-secondary">
                {activeCount}
              </p>
              <p className="text-xs text-muted-foreground">Live in shop</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
            <div>
              <p className="text-2xl font-serif font-semibold text-secondary">
                {products?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Total SKUs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search name, brand, SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          data-testid="input-shop-admin-search"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={!p.active ? "opacity-70" : undefined}
              data-testid={`shop-admin-card-${p.slug}`}
            >
              <CardContent className="p-4 flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-white border overflow-hidden flex-shrink-0">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 m-auto text-muted-foreground mt-7" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {SHOP_CATEGORY_LABELS[p.category] ?? p.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {p.slug}
                    </span>
                  </div>
                  <p className="text-sm font-serif text-primary font-bold mt-1">
                    {formatShopGbp(p.priceGbp)}
                  </p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.active}
                        disabled={savingId === p.id}
                        onCheckedChange={(v) => toggleActive(p, v)}
                        data-testid={`switch-active-${p.slug}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {p.active ? "Published" : "Draft"}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/shop/${encodeURIComponent(p.id)}/edit`}
                        data-testid={`btn-edit-${p.slug}`}
                      >
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="sm:col-span-2 xl:col-span-3">
              <CardContent className="p-10 text-center text-muted-foreground">
                No products yet.{" "}
                <Link href="/shop/new" className="text-primary font-medium hover:underline">
                  Add your first shop item
                </Link>
                .
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </RxShell>
  );
}

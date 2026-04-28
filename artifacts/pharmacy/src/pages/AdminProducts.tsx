import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Pill, Plus, Search, Edit, TrendingUp, PoundSterling, Package,
  Image as ImageIcon, Save, X, Loader2, Trash2, Copy, MoreHorizontal,
} from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

const CATEGORIES = ["all", "pain-relief", "cold-flu", "allergy", "digestive", "skin", "eye-care", "first-aid", "vitamins", "sleep", "oral", "foot-care", "womens-health"];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ id: string; field: "price" | "stock" } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [imageDialog, setImageDialog] = useState<Product | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Product | null>(null);
  const committingRef = React.useRef(false);

  const reload = () => {
    setLoading(true);
    Promise.all([
      apiFetch<{ products: Product[] }>("/api/products?includeInactive=true&limit=200", { auth: "pharmacist" }),
      apiFetch<Analytics>("/api/admin/analytics/sales", { auth: "pharmacist" }),
    ])
      .then(([p, a]) => { setProducts(p.products); setAnalytics(a); })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const salesByProduct = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number }>();
    (analytics?.byProduct ?? []).forEach(s => {
      map.set(s.product_id, { units: Number(s.units_sold), revenue: Number(s.revenue) });
    });
    return map;
  }, [analytics]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.brand?.toLowerCase().includes(q) ?? false);
    });
  }, [products, search, categoryFilter]);

  const totalRevenue = analytics ? Number(analytics.totals.revenue) : 0;
  const totalOrders = analytics?.totals.orders ?? 0;

  const patchProduct = async (id: string, patch: Partial<Product>) => {
    setSavingIds(prev => { const next = new Set(prev); next.add(id); return next; });
    try {
      const res = await apiFetch<{ product: Product }>(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        auth: "pharmacist",
      });
      setProducts(prev => prev?.map(p => p.id === id ? { ...p, ...res.product } : p) ?? null);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const startEdit = (id: string, field: "price" | "stock", current: number) => {
    setEditingField({ id, field });
    setEditValue(field === "price" ? (current / 100).toFixed(2) : String(current));
  };

  const commitEdit = async () => {
    if (!editingField || committingRef.current) return;
    committingRef.current = true;
    const { id, field } = editingField;
    setEditingField(null);
    try {
      const product = products?.find(p => p.id === id);
      if (!product) return;
      const trimmed = editValue.trim();
      if (trimmed === "") {
        toast.error("Value cannot be empty");
        return;
      }
      const num = Number(trimmed);
      if (Number.isNaN(num) || num < 0) {
        toast.error("Invalid value");
        return;
      }
      if (field === "price") {
        const pence = Math.round(num * 100);
        if (pence === product.priceGbp) return;
        await patchProduct(id, { priceGbp: pence });
      } else {
        const stock = Math.round(num);
        if (stock === product.stock) return;
        await patchProduct(id, { stock });
      }
    } finally {
      committingRef.current = false;
    }
  };

  const cancelEdit = () => {
    committingRef.current = true;
    setEditingField(null);
    setTimeout(() => { committingRef.current = false; }, 0);
  };

  const handleDuplicate = async (p: Product) => {
    setSavingIds(prev => { const next = new Set(prev); next.add(p.id); return next; });
    try {
      const res = await apiFetch<{ product: Product }>(`/api/admin/products/${p.id}/duplicate`, {
        method: "POST",
        auth: "pharmacist",
      });
      toast.success(`Duplicated as "${res.product.name}" (inactive draft)`);
      setProducts(prev => prev ? [res.product, ...prev] : [res.product]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duplicate failed");
    } finally {
      setSavingIds(prev => { const next = new Set(prev); next.delete(p.id); return next; });
    }
  };

  const handleDelete = async (p: Product, hard: boolean) => {
    setSavingIds(prev => { const next = new Set(prev); next.add(p.id); return next; });
    try {
      const url = hard ? `/api/admin/products/${p.id}?hard=true` : `/api/admin/products/${p.id}`;
      await apiFetch(url, { method: "DELETE", auth: "pharmacist" });
      if (hard) {
        toast.success(`"${p.name}" permanently deleted`);
        setProducts(prev => prev?.filter(x => x.id !== p.id) ?? null);
      } else {
        toast.success(`"${p.name}" deactivated (hidden from shop)`);
        setProducts(prev => prev?.map(x => x.id === p.id ? { ...x, active: false } : x) ?? null);
      }
      setDeleteDialog(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSavingIds(prev => { const next = new Set(prev); next.delete(p.id); return next; });
    }
  };

  const renderRowActions = (p: Product) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid={`btn-actions-${p.slug}`}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/products/${p.id}/edit`} data-testid={`menu-edit-${p.slug}`}>
            <Edit className="w-4 h-4 mr-2" /> Edit details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDuplicate(p)} data-testid={`menu-duplicate-${p.slug}`}>
          <Copy className="w-4 h-4 mr-2" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDeleteDialog(p)} className="text-red-600 focus:text-red-700" data-testid={`menu-delete-${p.slug}`}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <PharmacistLayout current="products">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2"><Pill className="w-7 h-7 text-primary" /> Products</h1>
            <p className="text-muted-foreground text-sm">Tap any price/stock to edit, tap an image to replace it.</p>
          </div>
          <Button asChild className="rounded-full" data-testid="btn-new-product">
            <Link href="/dashboard/products/new"><Plus className="w-4 h-4 mr-1" /> New product</Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Card><CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <PoundSterling className="w-7 h-7 sm:w-8 sm:h-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
              <div className="min-w-0"><p className="text-base sm:text-2xl font-bold truncate">{formatGbp(totalRevenue)}</p><p className="text-[10px] sm:text-xs text-muted-foreground">All-time revenue</p></div>
            </div></CardContent></Card>
          <Card><CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 p-1.5 bg-blue-100 rounded-lg" />
              <div className="min-w-0"><p className="text-base sm:text-2xl font-bold">{totalOrders}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Orders placed</p></div>
            </div></CardContent></Card>
          <Card><CardContent className="p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <Package className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 p-1.5 bg-amber-100 rounded-lg" />
              <div className="min-w-0"><p className="text-base sm:text-2xl font-bold">{products?.filter(p => p.active).length ?? 0}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Active SKUs</p></div>
            </div></CardContent></Card>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-products-search" />
          </div>
          <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
            {CATEGORIES.map(c => (
              <Button key={c} size="sm" variant={categoryFilter === c ? "default" : "outline"}
                onClick={() => setCategoryFilter(c)} className="rounded-full capitalize whitespace-nowrap"
                data-testid={`btn-cat-${c}`}>
                {c.replace(/-/g, " ")}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {filtered.map(p => {
                const sales = salesByProduct.get(p.id);
                const isSaving = savingIds.has(p.id);
                const isEditingPrice = editingField?.id === p.id && editingField.field === "price";
                const isEditingStock = editingField?.id === p.id && editingField.field === "stock";
                return (
                  <Card key={p.id} data-testid={`product-card-${p.slug}`} className={!p.active ? "opacity-60" : ""}>
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setImageDialog(p)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                          data-testid={`img-edit-${p.slug}`}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 m-auto text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">{p.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                                {p.brand && <span>{p.brand}</span>}
                                <Badge variant="outline" className="h-4 text-[10px] px-1">{p.classification}</Badge>
                                <span className="capitalize">· {p.category.replace(/-/g, " ")}</span>
                              </div>
                            </div>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" /> : renderRowActions(p)}
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
                              {isEditingPrice ? (
                                <Input
                                  autoFocus type="number" step="0.01" value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                                  className="h-7 px-1 text-sm"
                                  data-testid={`input-price-${p.slug}`}
                                />
                              ) : (
                                <button onClick={() => startEdit(p.id, "price", p.priceGbp)} className="font-semibold hover:text-primary text-sm" data-testid={`btn-edit-price-${p.slug}`}>
                                  {formatGbp(p.priceGbp)}
                                </button>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stock</p>
                              {isEditingStock ? (
                                <Input
                                  autoFocus type="number" value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={commitEdit}
                                  onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                                  className="h-7 px-1 text-sm"
                                  data-testid={`input-stock-${p.slug}`}
                                />
                              ) : (
                                <button onClick={() => startEdit(p.id, "stock", p.stock)} className={`font-semibold text-sm ${p.stock < 20 ? "text-amber-600" : ""}`} data-testid={`btn-edit-stock-${p.slug}`}>
                                  {p.stock}
                                </button>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
                              <Switch
                                checked={p.active}
                                onCheckedChange={v => patchProduct(p.id, { active: v })}
                                disabled={isSaving}
                                data-testid={`switch-active-${p.slug}`}
                              />
                            </div>
                          </div>
                          {sales && (
                            <p className="text-[10px] text-muted-foreground mt-2">
                              {sales.units} sold · {formatGbp(sales.revenue)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filtered.length === 0 && (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No products match your filters.</CardContent></Card>
              )}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block bg-white rounded-2xl overflow-hidden border">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Price (£)</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-right">Sold</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-center">Active</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(p => {
                    const sales = salesByProduct.get(p.id);
                    const isSaving = savingIds.has(p.id);
                    const isEditingPrice = editingField?.id === p.id && editingField.field === "price";
                    const isEditingStock = editingField?.id === p.id && editingField.field === "stock";
                    return (
                      <tr key={p.id} className={`hover:bg-muted/20 ${!p.active ? "opacity-60" : ""}`} data-testid={`product-row-${p.slug}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setImageDialog(p)}
                              className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 group"
                              data-testid={`img-edit-desktop-${p.slug}`}
                              title="Click to replace image"
                            >
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 m-auto text-muted-foreground" />
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                              </div>
                            </button>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{p.name}</p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                {p.brand && <span>{p.brand}</span>}
                                <Badge variant="outline" className="h-4 text-[10px] px-1">{p.classification}</Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground text-xs">{p.category.replace(/-/g, " ")}</td>
                        <td className="px-4 py-3 text-right">
                          {isEditingPrice ? (
                            <Input
                              autoFocus type="number" step="0.01" value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className="h-8 w-20 text-right inline-block"
                              data-testid={`input-price-desktop-${p.slug}`}
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(p.id, "price", p.priceGbp)}
                              className="font-semibold hover:bg-primary/10 rounded px-2 py-1 -mx-2 -my-1 transition"
                              data-testid={`btn-edit-price-desktop-${p.slug}`}
                            >
                              {formatGbp(p.priceGbp)}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditingStock ? (
                            <Input
                              autoFocus type="number" value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className="h-8 w-20 text-right inline-block"
                              data-testid={`input-stock-desktop-${p.slug}`}
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(p.id, "stock", p.stock)}
                              className={`hover:bg-primary/10 rounded px-2 py-1 -mx-2 -my-1 transition ${p.stock < 20 ? "text-amber-600 font-medium" : ""}`}
                              data-testid={`btn-edit-stock-desktop-${p.slug}`}
                            >
                              {p.stock}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{sales?.units ?? 0}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{sales ? formatGbp(sales.revenue) : "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={p.active}
                            onCheckedChange={v => patchProduct(p.id, { active: v })}
                            disabled={isSaving}
                            data-testid={`switch-active-desktop-${p.slug}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline text-muted-foreground" /> : renderRowActions(p)}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No products match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ImageReplaceDialog
        product={imageDialog}
        onClose={() => setImageDialog(null)}
        onSaved={(updated) => {
          setProducts(prev => prev?.map(p => p.id === updated.id ? { ...p, imageUrl: updated.imageUrl } : p) ?? null);
          setImageDialog(null);
        }}
      />

      <DeleteProductDialog
        product={deleteDialog}
        onClose={() => setDeleteDialog(null)}
        onConfirm={(hard) => deleteDialog && handleDelete(deleteDialog, hard)}
        saving={deleteDialog ? savingIds.has(deleteDialog.id) : false}
      />
    </PharmacistLayout>
  );
}

function ImageReplaceDialog({ product, onClose, onSaved }: {
  product: Product | null;
  onClose: () => void;
  onSaved: (p: { id: string; imageUrl: string }) => void;
}) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setUrl(product?.imageUrl ?? ""); }, [product]);

  if (!product) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch<{ product: Product }>(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ imageUrl: url }),
        auth: "pharmacist",
      });
      toast.success("Image updated");
      onSaved({ id: res.product.id, imageUrl: res.product.imageUrl });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg" data-testid="dialog-image-replace">
        <DialogHeader>
          <DialogTitle>Replace product image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{product.name}</p>
          <div className="flex justify-center">
            {url ? (
              <img src={url} alt="preview" className="w-48 h-48 rounded-xl object-cover bg-muted border" />
            ) : (
              <div className="w-48 h-48 rounded-xl bg-muted flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Image URL or path (e.g. /products/your-image.jpg)</label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://... or /products/xxx.jpg" data-testid="input-image-url" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Or upload a new image</label>
            <Input type="file" accept="image/*" onChange={handleFile} data-testid="input-image-file" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}><X className="w-4 h-4 mr-1" /> Cancel</Button>
          <Button onClick={handleSave} disabled={saving} data-testid="btn-save-image">
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save image"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductDialog({ product, onClose, onConfirm, saving }: {
  product: Product | null;
  onClose: () => void;
  onConfirm: (hard: boolean) => void;
  saving: boolean;
}) {
  if (!product) return null;
  return (
    <Dialog open={!!product} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md" data-testid="dialog-delete-product">
        <DialogHeader>
          <DialogTitle>Delete "{product.name}"?</DialogTitle>
          <DialogDescription>
            Choose how you want to remove this product.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border p-3">
            <p className="font-semibold mb-1">Deactivate (recommended)</p>
            <p className="text-xs text-muted-foreground">Hides the product from the shop but keeps it in past orders and analytics. Reversible — just toggle Active back on.</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
            <p className="font-semibold mb-1 text-red-700">Permanently delete</p>
            <p className="text-xs text-red-700/80">Removes the product entirely. Only works if it has never been ordered. Cannot be undone.</p>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => onConfirm(false)} disabled={saving} variant="outline" data-testid="btn-confirm-deactivate">
            Deactivate
          </Button>
          <Button onClick={() => onConfirm(true)} disabled={saving} variant="destructive" data-testid="btn-confirm-hard-delete">
            Permanently delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

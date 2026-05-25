import { useEffect, useMemo, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RxPageTitle, RxShell } from "@/components/rx";
import { ShopProductPreviewCard } from "@/components/ShopProductPreviewCard";
import { apiFetch } from "@/lib/api";
import {
  parseTagsInput,
  SHOP_CATEGORIES,
  SHOP_CATEGORY_LABELS,
  slugFromName,
  tagsToInput,
  type ShopProduct,
} from "@/lib/shopProducts";
import { useToast } from "@/hooks/use-toast";

type FormState = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  classification: string;
  shortDescription: string;
  longDescription: string;
  directions: string;
  warnings: string;
  ingredients: string;
  imageUrl: string;
  packSize: string;
  priceGbpInput: string;
  stock: string;
  tagsInput: string;
  active: boolean;
  requiresConsultation: boolean;
};

const emptyForm = (): FormState => ({
  slug: "",
  name: "",
  brand: "",
  category: "general-health",
  classification: "GSL",
  shortDescription: "",
  longDescription: "",
  directions: "",
  warnings: "",
  ingredients: "",
  imageUrl: "",
  packSize: "",
  priceGbpInput: "",
  stock: "50",
  tagsInput: "",
  active: true,
  requiresConsultation: false,
});

function productToForm(p: ShopProduct): FormState {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand ?? "",
    category: p.category,
    classification: p.classification,
    shortDescription: p.shortDescription,
    longDescription: p.longDescription,
    directions: p.directions ?? "",
    warnings: p.warnings ?? "",
    ingredients: p.ingredients ?? "",
    imageUrl: p.imageUrl,
    packSize: p.packSize ?? "",
    priceGbpInput: (p.priceGbp / 100).toFixed(2),
    stock: String(p.stock),
    tagsInput: tagsToInput(p.tags as string[] | undefined),
    active: p.active,
    requiresConsultation: p.requiresConsultation,
  };
}

export function ShopProductForm() {
  const [, editParams] = useRoute<{ id: string }>("/shop/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEdit = !!editParams?.id;
  const productId = editParams?.id ? decodeURIComponent(editParams.id) : undefined;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !productId) return;
    apiFetch<{ product: ShopProduct }>(`/api/products/${productId}`)
      .then((d) => setForm(productToForm(d.product)))
      .catch((e) =>
        toast({
          title: "Could not load product",
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        }),
      )
      .finally(() => setLoading(false));
  }, [isEdit, productId]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const pricePence = useMemo(() => {
    const n = Number(form.priceGbpInput);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [form.priceGbpInput]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Image must be under 4 MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("imageUrl", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const buildPayload = () => {
    const slug =
      form.slug.trim() || slugFromName(form.name) || `product-${Date.now()}`;
    const priceGbp = pricePence;
    const stock = Math.max(0, Math.round(Number(form.stock) || 0));
    return {
      slug,
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category,
      classification: form.classification,
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim(),
      directions: form.directions.trim() || null,
      warnings: form.warnings.trim() || null,
      ingredients: form.ingredients.trim() || null,
      imageUrl: form.imageUrl.trim(),
      packSize: form.packSize.trim() || null,
      priceGbp,
      stock,
      active: form.active,
      requiresConsultation: form.requiresConsultation,
      tags: parseTagsInput(form.tagsInput),
    };
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }
    if (!form.category) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }
    if (pricePence <= 0) {
      toast({ title: "Enter a valid price in GBP", variant: "destructive" });
      return;
    }
    if (!form.shortDescription.trim()) {
      toast({ title: "Short description is required", variant: "destructive" });
      return;
    }
    if (!form.imageUrl.trim()) {
      toast({
        title: "Product photo required",
        description: "Upload packaging on a clean white background.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit && productId) {
        await apiFetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast({ title: "Product updated" });
      } else {
        await apiFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: "Product created — visible when published" });
      }
      navigate("/shop");
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RxShell>
        <Skeleton className="h-96 rounded-xl" />
      </RxShell>
    );
  }

  return (
    <RxShell wide>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <RxPageTitle
        title={isEdit ? "Edit shop item" : "Add shop item"}
        subtitle="Packaging photo, pricing, and patient-facing copy for the Pharmacare shop."
      />

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-serif text-secondary text-lg font-semibold">
                Product information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => {
                      update("name", e.target.value);
                      if (!isEdit && !form.slug.trim()) {
                        update("slug", slugFromName(e.target.value));
                      }
                    }}
                    data-testid="input-product-name"
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={form.brand}
                    onChange={(e) => update("brand", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">SKU / slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    disabled={isEdit}
                    placeholder="auto-from-name"
                    data-testid="input-product-slug"
                  />
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => update("category", v)}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOP_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {SHOP_CATEGORY_LABELS[c] ?? c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Classification</Label>
                  <Select
                    value={form.classification}
                    onValueChange={(v) => update("classification", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GSL">GSL — General Sales</SelectItem>
                      <SelectItem value="P">P — Pharmacy Medicine</SelectItem>
                      <SelectItem value="POM">POM — Prescription Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pack">Pack size</Label>
                  <Input
                    id="pack"
                    value={form.packSize}
                    onChange={(e) => update("packSize", e.target.value)}
                    placeholder="e.g. 30 tablets"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={form.tagsInput}
                    onChange={(e) => update("tagsInput", e.target.value)}
                    placeholder="hayfever, bestseller"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="short">Short description *</Label>
                <Input
                  id="short"
                  value={form.shortDescription}
                  onChange={(e) => update("shortDescription", e.target.value)}
                  placeholder="Shown on shop grid card"
                />
              </div>
              <div>
                <Label htmlFor="long">Full description</Label>
                <Textarea
                  id="long"
                  rows={4}
                  value={form.longDescription}
                  onChange={(e) => update("longDescription", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-serif text-secondary text-lg font-semibold">
                Packaging photo *
              </h2>
              <p className="text-sm text-muted-foreground">
                Use a clear product-on-white photo (retail catalogue style). JPEG or
                PNG, max 4 MB.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload image
                  </Label>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    onChange={handleImage}
                    data-testid="input-product-image"
                  />
                  <Label htmlFor="imageUrl" className="text-xs text-muted-foreground">
                    Or paste image URL
                  </Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                    onChange={(e) => update("imageUrl", e.target.value)}
                    placeholder="https://… or /products/…"
                  />
                </div>
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt="Upload preview"
                    className="w-36 h-36 rounded-xl object-contain bg-white border p-2"
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-serif text-secondary text-lg font-semibold">
                Pricing & stock
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (GBP) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.priceGbpInput}
                    onChange={(e) => update("priceGbpInput", e.target.value)}
                    data-testid="input-product-price"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock units</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => update("stock", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-serif text-secondary text-lg font-semibold">
                Patient information
              </h2>
              <div>
                <Label htmlFor="directions">Directions</Label>
                <Textarea
                  id="directions"
                  rows={3}
                  value={form.directions}
                  onChange={(e) => update("directions", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="warnings">Warnings</Label>
                <Textarea
                  id="warnings"
                  rows={3}
                  value={form.warnings}
                  onChange={(e) => update("warnings", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea
                  id="ingredients"
                  rows={2}
                  value={form.ingredients}
                  onChange={(e) => update("ingredients", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Published (visible in patient shop)</Label>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => update("active", v)}
                  data-testid="switch-product-active"
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Requires consultation</Label>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Off (default): patients add to basket with quantity controls.
                    On: shop shows &quot;Start consultation&quot; instead of basket.
                  </p>
                </div>
                <Switch
                  checked={form.requiresConsultation}
                  onCheckedChange={(v) => update("requiresConsultation", v)}
                  data-testid="switch-requires-consultation"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" asChild>
              <Link href="/shop">Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="btn-save-shop-product">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 space-y-3">
          <p className="rx-label-caps text-muted-foreground">Shop preview</p>
          <ShopProductPreviewCard
            name={form.name}
            brand={form.brand || null}
            shortDescription={form.shortDescription}
            imageUrl={form.imageUrl}
            pricePence={pricePence}
            packSize={form.packSize || null}
            requiresConsultation={form.requiresConsultation}
          />
        </div>
      </div>
    </RxShell>
  );
}

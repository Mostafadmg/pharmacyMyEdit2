import React, { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, Save, Image as ImageIcon, AlertTriangle } from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type Product = {
  id: string; slug: string; name: string; brand: string | null; category: string; subcategory: string | null;
  classification: string; shortDescription: string; longDescription: string;
  ingredients: string | null; directions: string | null; warnings: string | null;
  imageUrl: string; packSize: string | null; priceGbp: number; rrpGbp: number | null; stock: number;
  active: boolean; requiresConsultation: boolean;
};

const CATEGORIES = ["pain-relief", "cold-flu", "allergy", "digestive", "skin", "eye-care", "first-aid", "vitamins", "sleep", "oral", "foot-care", "womens-health"];

export default function AdminProductForm() {
  const [, editParams] = useRoute<{ id: string }>("/dashboard/products/:id/edit");
  const [, navigate] = useLocation();
  const isEdit = !!editParams?.id;
  const productId = editParams?.id;

  const [form, setForm] = useState<Partial<Product>>({
    slug: "", name: "", brand: "", category: "pain-relief", subcategory: "",
    classification: "GSL", shortDescription: "", longDescription: "",
    ingredients: "", directions: "", warnings: "",
    imageUrl: "", packSize: "", priceGbp: 0, rrpGbp: null, stock: 0,
    active: true, requiresConsultation: false,
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit || !productId) return;
    apiFetch<{ product: Product }>(`/api/products/${productId}`)
      .then(d => setForm(d.product))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [isEdit, productId]);

  const update = <K extends keyof Product>(k: K, v: Product[K] | string) => setForm({ ...form, [k]: v });

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("imageUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.priceGbp || form.priceGbp <= 0) {
      toast.error("Name, category and price are required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
          auth: "pharmacist",
        });
        toast.success("Product updated");
      } else {
        await apiFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify({ ...form, slug: form.slug || form.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") }),
          auth: "pharmacist",
        });
        toast.success("Product created");
      }
      navigate("/dashboard/products");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PharmacistLayout current="products"><div className="p-6"><Skeleton className="h-96 rounded-xl" /></div></PharmacistLayout>;

  return (
    <PharmacistLayout current="products">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to products
        </Link>

        <h1 className="text-3xl font-bold">{isEdit ? "Edit product" : "New product"}</h1>

        <Card><CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Basics</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name *</Label><Input value={form.name ?? ""} onChange={e => update("name", e.target.value)} data-testid="input-name" /></div>
            <div><Label>Brand</Label><Input value={form.brand ?? ""} onChange={e => update("brand", e.target.value)} /></div>
            <div><Label>Slug (auto from name)</Label><Input value={form.slug ?? ""} onChange={e => update("slug", e.target.value)} placeholder="paracetamol-500mg-16" disabled={isEdit} data-testid="input-slug" /></div>
            <div><Label>Pack size</Label><Input value={form.packSize ?? ""} onChange={e => update("packSize", e.target.value)} /></div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/-/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Classification</Label>
              <Select value={form.classification} onValueChange={v => update("classification", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GSL">GSL — General Sales</SelectItem>
                  <SelectItem value="P">P — Pharmacy Medicine</SelectItem>
                  <SelectItem value="POM">POM — Prescription Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Short description</Label><Input value={form.shortDescription ?? ""} onChange={e => update("shortDescription", e.target.value)} /></div>
          <div><Label>Long description</Label><Textarea rows={4} value={form.longDescription ?? ""} onChange={e => update("longDescription", e.target.value)} /></div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Pricing & stock</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label>Price (pence) *</Label><Input type="number" value={form.priceGbp ?? 0} onChange={e => update("priceGbp", Number(e.target.value))} data-testid="input-price" /></div>
            <div><Label>RRP (pence)</Label><Input type="number" value={form.rrpGbp ?? ""} onChange={e => update("rrpGbp", e.target.value ? Number(e.target.value) : null as any)} /></div>
            <div><Label>Stock units</Label><Input type="number" value={form.stock ?? 0} onChange={e => update("stock", Number(e.target.value))} data-testid="input-stock" /></div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Image</h2>
          <div className="grid sm:grid-cols-[1fr,160px] gap-4">
            <div className="space-y-2">
              <Input value={form.imageUrl ?? ""} onChange={e => update("imageUrl", e.target.value)} placeholder="https://... or upload below" />
              <Input type="file" accept="image/*" onChange={handleImage} className="text-sm" data-testid="input-image-upload" />
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="preview" className="w-40 h-40 rounded-xl object-cover bg-muted" />}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Patient information</h2>
          <div><Label>Ingredients</Label><Textarea rows={2} value={form.ingredients ?? ""} onChange={e => update("ingredients", e.target.value)} /></div>
          <div><Label>Directions</Label><Textarea rows={2} value={form.directions ?? ""} onChange={e => update("directions", e.target.value)} /></div>
          <div><Label>Warnings</Label><Textarea rows={2} value={form.warnings ?? ""} onChange={e => update("warnings", e.target.value)} /></div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between"><Label>Active (visible in shop)</Label>
            <Switch checked={form.active ?? true} onCheckedChange={v => update("active", v)} /></div>
          <div className="flex items-center justify-between"><Label>Requires consultation</Label>
            <Switch checked={form.requiresConsultation ?? false} onCheckedChange={v => update("requiresConsultation", v)} /></div>
        </CardContent></Card>

        <div className="flex justify-end gap-3 pb-10">
          <Button asChild variant="outline"><Link href="/dashboard/products">Cancel</Link></Button>
          <Button onClick={handleSave} disabled={saving} data-testid="btn-save-product">
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>
    </PharmacistLayout>
  );
}

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
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
  active: boolean;
  requiresConsultation: boolean;
  tags?: string[];
};

export const SHOP_CATEGORIES = [
  "pain-relief",
  "cold-flu",
  "allergy",
  "digestive",
  "skin",
  "eye-care",
  "first-aid",
  "vitamins",
  "sleep",
  "oral",
  "foot-care",
  "womens-health",
  "general-health",
] as const;

export const SHOP_CATEGORY_LABELS: Record<string, string> = {
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
  "general-health": "General Health",
};

export function formatShopGbp(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function tagsToInput(tags: string[] | undefined): string {
  return (tags ?? []).join(", ");
}

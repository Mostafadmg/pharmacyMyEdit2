export type ShopMenuItem = {
  label: string;
  slug: string;
  href: string;
};

export type ShopMenuGroup = {
  label: string;
  slug: string;
  href: string;
  subcategories?: ShopMenuItem[];
};

/** Left column — main shop categories (everydaymeds.co.uk Shop mega-menu) */
export const SHOP_MAIN_CATEGORIES: ShopMenuItem[] = [
  { label: "Medicines & Treatments", slug: "medicines-treatments", href: "/collections/medicines-treatments" },
  { label: "Vitamins & Supplements", slug: "vitamins-supplements", href: "/collections/vitamins-supplements" },
  { label: "Beauty & Personal Care", slug: "beauty-personal-care", href: "/collections/beauty-personal-care" },
  { label: "Baby & Child", slug: "baby-child", href: "/collections/baby-child" },
  { label: "Health & Wellbeing", slug: "health-wellbeing", href: "/collections/health-wellbeing" },
  { label: "Mobility & Daily Living Aids", slug: "mobility-daily-living-aids", href: "/collections/mobility-daily-living-aids" },
  { label: "Weight Management", slug: "weight-management", href: "/collections/weight-management" },
  { label: "Medical Devices & Diagnostics", slug: "medical-devices-diagnostics", href: "/collections/medical-devices-diagnostics" },
  { label: "Toiletries", slug: "toiletries", href: "/collections/toiletries" },
  { label: "Pet care", slug: "pet-care", href: "/collections/pet-care" },
  { label: "Foot care", slug: "foot-care", href: "/collections/foot-care" },
];

/** Right columns — Medicines & Treatments subcategories (live site column order) */
export const MEDICINE_SUBCATEGORIES_LEFT: ShopMenuItem[] = [
  { label: "Allergy & Hay Fever", slug: "allergy-hay-fever", href: "/collections/allergy-hay-fever" },
  { label: "Cough, Cold & Flu", slug: "cough-cold-flu", href: "/collections/cough-cold-flu" },
  { label: "Footcare", slug: "footcare", href: "/collections/footcare" },
  { label: "Pain Relief", slug: "pain-relief", href: "/collections/pain-relief" },
  { label: "Specialist Hair Care", slug: "specialist-hair-care", href: "/collections/specialist-hair-care" },
  { label: "Travel Medicines", slug: "travel-medicines", href: "/collections/travel-medicines" },
  { label: "Sleeping Aids", slug: "sleeping-aids", href: "/collections/sleeping-aids" },
  { label: "Heart Conditions", slug: "heart-conditions", href: "/collections/heart-conditions" },
];

export const MEDICINE_SUBCATEGORIES_RIGHT: ShopMenuItem[] = [
  { label: "Children's Medicines", slug: "childrens-medicines", href: "/collections/childrens-medicines" },
  { label: "Eyecare & Earcare", slug: "eyecare-earcare", href: "/collections/eyecare-earcare" },
  { label: "Mouth & Oral Care", slug: "mouth-oral-care", href: "/collections/mouth-oral-care" },
  { label: "Skin Conditions", slug: "skin-conditions", href: "/collections/skin-conditions" },
  { label: "Stomach & Bowel", slug: "stomach-bowel", href: "/collections/stomach-bowel" },
  { label: "Women's Health", slug: "womens-health", href: "/collections/womens-health" },
  { label: "Men's Sexual Health", slug: "mens-sexual-health", href: "/collections/mens-sexual-health" },
  { label: "General", slug: "medicines-treatments", href: "/collections/medicines-treatments" },
];

/** Flat list — preserves live reading order (left column then right column) */
export const MEDICINE_SUBCATEGORIES: ShopMenuItem[] = [
  ...MEDICINE_SUBCATEGORIES_LEFT,
  ...MEDICINE_SUBCATEGORIES_RIGHT,
];

export type CollectionMeta = {
  title: string;
  description?: string;
  /** Maps to internal product API category filter */
  productCategory?: string;
  breadcrumbParent?: { label: string; href: string };
};

/** Collection slug → page metadata + optional product filter */
export const COLLECTION_META: Record<string, CollectionMeta> = {
  all: { title: "Shop", description: "Browse all pharmacy products." },
  "medicines-treatments": {
    title: "Medicines & Treatments",
    description: "Buy medicines and treatments at affordable prices.",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "vitamins-supplements": {
    title: "Vitamins & Supplements",
    productCategory: "vitamins",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "beauty-personal-care": {
    title: "Beauty & Personal Care",
    productCategory: "skin",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "baby-child": {
    title: "Baby & Child",
    productCategory: "general-health",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "health-wellbeing": {
    title: "Health & Wellbeing",
    productCategory: "general-health",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "mobility-daily-living-aids": {
    title: "Mobility & Daily Living Aids",
    productCategory: "first-aid",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "weight-management": {
    title: "Weight Management",
    productCategory: "weight-loss",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "medical-devices-diagnostics": {
    title: "Medical Devices & Diagnostics",
    productCategory: "first-aid",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  toiletries: {
    title: "Toiletries",
    productCategory: "oral",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "pet-care": {
    title: "Pet care",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "foot-care": {
    title: "Foot care",
    productCategory: "foot-care",
    breadcrumbParent: { label: "Shop", href: "/shop" },
  },
  "allergy-hay-fever": {
    title: "Allergy & Hay Fever",
    productCategory: "allergy",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "childrens-medicines": {
    title: "Children's Medicines",
    productCategory: "general-health",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "cough-cold-flu": {
    title: "Cough, Cold & Flu",
    productCategory: "cold-flu",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "eyecare-earcare": {
    title: "Eyecare & Earcare",
    productCategory: "eye-care",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  footcare: {
    title: "Footcare",
    productCategory: "foot-care",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "mouth-oral-care": {
    title: "Mouth & Oral Care",
    productCategory: "oral",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "pain-relief": {
    title: "Pain Relief",
    productCategory: "pain-relief",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "skin-conditions": {
    title: "Skin Conditions",
    productCategory: "skin",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "specialist-hair-care": {
    title: "Specialist Hair Care",
    productCategory: "hair-loss",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "stomach-bowel": {
    title: "Stomach & Bowel",
    productCategory: "digestive",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "travel-medicines": {
    title: "Travel Medicines",
    productCategory: "travel-health",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "womens-health": {
    title: "Women's Health",
    productCategory: "womens-health",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "sleeping-aids": {
    title: "Sleeping Aids",
    productCategory: "sleep",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "mens-sexual-health": {
    title: "Men's Sexual Health",
    productCategory: "erectile-dysfunction",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
  "heart-conditions": {
    title: "Heart Conditions",
    productCategory: "general-health",
    breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  },
};

export function getCollectionMeta(slug: string): CollectionMeta {
  const known = COLLECTION_META[slug];
  if (known) return known;

  const fromMain = SHOP_MAIN_CATEGORIES.find((c) => c.slug === slug);
  if (fromMain) {
    return {
      title: fromMain.label,
      breadcrumbParent: { label: "Shop", href: "/shop" },
    };
  }

  const fromSub = MEDICINE_SUBCATEGORIES.find((c) => c.slug === slug);
  if (fromSub) {
    return {
      title: fromSub.label,
      breadcrumbParent: { label: "Medicines & Treatments", href: "/collections/medicines-treatments" },
    };
  }

  return {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    breadcrumbParent: { label: "Shop", href: "/shop" },
  };
}

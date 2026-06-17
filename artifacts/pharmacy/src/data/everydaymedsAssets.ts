/** Live everydaymeds.co.uk Shopify CDN assets */
const CDN = "https://cdn.shopify.com/s/files/1/0935/0479/9065/files";
const SHOP = "https://everydaymeds.co.uk/cdn/shop/files";

export function edmAsset(file: string, width?: number) {
  const url = `${CDN}/${file}`;
  return width ? `${url}?width=${width}` : url;
}

export function edmShopAsset(file: string, width = 84) {
  return `${SHOP}/${file}?width=${width}`;
}

export const EDM_ASSETS = {
  logo: edmAsset("EDM_LOGO.png", 330),
  /** Header — live site caps at 156px mobile / 250×40 desktop */
  logoHeader: edmAsset("EDM_LOGO.png", 330),
  logoSvg: edmAsset("FINAL_LOGO_2_1.svg"),
  favicon: edmAsset("favicon.png", 64),

  heroPhones: edmAsset("Group_469353.png", 1200),
  heroBannerText: edmAsset("bannertext.svg"),
  heroBannerTextMobile: edmAsset("mobiletext.svg"),
  heroBannerSub: edmAsset("text.svg"),
  heroBannerSubMobile: edmAsset("mobile-text-btm.svg"),
  heroAppBadges: edmAsset("banner-play.svg"),

  trustUkPharmacy: edmShopAsset("Vector_7.svg"),
  trustDiscreet: edmShopAsset("Frame_1.svg", 84),
  trustConsultation: edmShopAsset("Vector_9.svg"),
  trustGenuine: edmShopAsset("Vector_10.svg"),

  treatmentWeightLoss: edmAsset("Frame_1321316553.png", 600),
  treatmentHairLoss: edmAsset("Frame_1321316553_1.png", 600),
  treatmentMensHealth: edmAsset("Frame_1321316553_2.png", 600),
  treatmentWomensHealth: edmAsset("Frame_1321316553_3.png", 600),

  exploreVitamins: edmAsset("14190_1_1_2.png", 500),
  exploreBeauty: edmAsset("14190_1_1_3.png", 500),
  exploreBaby: edmAsset("14190_1_1_4.png", 500),
  exploreWellbeing: edmAsset("14190_1_1_6.png", 500),
  exploreMobility: edmAsset("14190_1_1_7.png", 500),
  exploreWeightMgmt: edmAsset("14190_1_1_8.png", 500),
  exploreMedicalDevices: edmAsset("14190_1_1_9.png", 500),
  exploreToiletries: edmAsset("14190_1_1_11.png", 500),
  explorePetCare: edmAsset("14190_1_1_11.png", 500),

  safeSecureIllustration: edmAsset("Frame_1321316515.svg"),
  gphcLogo: edmAsset("image.svg"),

  howItWorksHeader: edmAsset("Group_469326_b1c6415e-384f-4438-8a5f-776b1befdae0.png", 800),
  howItWorksStep1: edmAsset("Background_1.png", 600),
  howItWorksStep2: edmAsset("Background_3.png", 600),
  howItWorksStep3: edmAsset("Group_469326_b1c6415e-384f-4438-8a5f-776b1befdae0.png", 600),

  payments: edmAsset("payments.svg", 400),

  aboutMission: edmAsset("Group_84_1.svg"),
  aboutVision: edmAsset("Group_85.svg"),
  aboutValues: edmAsset("Group_83.svg"),

  fontSofiaSemiBold:
    "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/Sofia_Pro_Semi_Bold_Az_e52b1180-e4bb-4fa0-bb23-ef8d2423f588.woff?v=1755691475",
} as const;

export const TRUST_BAR_ITEMS = [
  { icon: EDM_ASSETS.trustUkPharmacy, label: "UK Regulated Pharmacy" },
  { icon: EDM_ASSETS.trustDiscreet, label: "Discreet Packaging" },
  { icon: EDM_ASSETS.trustConsultation, label: "Free online consultation" },
  { icon: EDM_ASSETS.trustGenuine, label: "Genuine products" },
] as const;

export const EXPLORE_CATEGORIES = [
  { title: "Vitamins & Supplements", href: "/collections/vitamins-supplements", image: EDM_ASSETS.exploreVitamins },
  { title: "Beauty & Personal Care", href: "/collections/beauty-personal-care", image: EDM_ASSETS.exploreBeauty },
  { title: "Baby & Child", href: "/collections/baby-child", image: EDM_ASSETS.exploreBaby },
  { title: "Health & Wellbeing", href: "/collections/health-wellbeing", image: EDM_ASSETS.exploreWellbeing },
  { title: "Mobility & Daily Living Aids", href: "/collections/mobility-daily-living-aids", image: EDM_ASSETS.exploreMobility },
  { title: "Weight Managements", href: "/collections/weight-management", image: EDM_ASSETS.exploreWeightMgmt },
  { title: "Medical Devices", href: "/collections/medical-devices-diagnostics", image: EDM_ASSETS.exploreMedicalDevices },
  { title: "Toiletries", href: "/collections/toiletries", image: EDM_ASSETS.exploreToiletries },
  { title: "Pet Care", href: "/collections/pet-care", image: EDM_ASSETS.explorePetCare },
] as const;

/** Collection slug → hero image on shop/category grids */
export const COLLECTION_IMAGES: Record<string, string> = {
  "vitamins-supplements": EDM_ASSETS.exploreVitamins,
  "beauty-personal-care": EDM_ASSETS.exploreBeauty,
  "baby-child": EDM_ASSETS.exploreBaby,
  "health-wellbeing": EDM_ASSETS.exploreWellbeing,
  "mobility-daily-living-aids": EDM_ASSETS.exploreMobility,
  "weight-management": EDM_ASSETS.exploreWeightMgmt,
  "medical-devices-diagnostics": EDM_ASSETS.exploreMedicalDevices,
  toiletries: EDM_ASSETS.exploreToiletries,
  "pet-care": EDM_ASSETS.explorePetCare,
};

export const INDEPENDENT_PRESCRIBERS = [
  { name: "Shelan Salih", gphc: "2084501" },
  { name: "Rehenaaz Uddin", gphc: "2083426" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: "/about/our-service", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
  { href: "/track", label: "Track Your Order" },
  { href: "/#faqs", label: "FAQs" },
  { href: "/legal/terms", label: "Terms & Conditions" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal/complaints", label: "Complaints Procedure" },
  { href: "/legal/prescribing", label: "Prescribing and Dispensing Policy" },
  { href: "/legal/returns", label: "Returns and Refunds Policy" },
  { href: "/legal/safeguarding", label: "Patient Safety and Safeguarding Policy" },
  { href: "/legal/delivery", label: "Delivery Policy" },
  { href: "/legal/payment", label: "Payment Policy" },
  { href: "/legal/refund-request", label: "Refund Request" },
] as const;

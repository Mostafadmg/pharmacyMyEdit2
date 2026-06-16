export const PROMO_COPY = {
  headline: "£30 OFF your first consultation, £25 OFF every consultation after",
  couponCode: "FIRST30",
} as const;

export type SiteCategoryCard = {
  title: string;
  tagline?: string;
  description?: string;
  href: string;
  image?: string;
};

export const TREATMENT_GOAL_CARDS: SiteCategoryCard[] = [
  {
    title: "Weight Loss",
    tagline: "Hit your long-term",
    description: "Personalised treatment plans and clinical support to help you lose weight safely.",
    href: "/treatments/weight-loss",
  },
  {
    title: "Hair Loss",
    tagline: "Regrowth your",
    description: "Expert-recommended solutions for hair thinning and regrowth.",
    href: "/conditions/hair-loss",
  },
  {
    title: "Men's Health",
    tagline: "Take control of your",
    description: "Confidential, expert-led care for ED, hair loss, and more.",
    href: "/conditions/erectile-dysfunction",
  },
  {
    title: "Women's Health",
    tagline: "Take control of your",
    description: "Online care for contraception, menopause, and more.",
    href: "/conditions/emergency-contraception",
  },
];

export const SHOP_CATEGORY_CARDS: SiteCategoryCard[] = [
  { title: "Vitamins & Supplements", href: "/shop?category=vitamins" },
  { title: "Beauty & Personal Care", href: "/shop?category=skin" },
  { title: "Baby & Child", href: "/shop?category=general-health" },
  { title: "Health & Wellbeing", href: "/shop?category=general-health" },
  { title: "Mobility & Daily Living Aids", href: "/shop?category=first-aid" },
  { title: "Weight Managements", href: "/shop?category=weight-loss" },
  { title: "Medical Devices", href: "/shop?category=first-aid" },
  { title: "Toiletries", href: "/shop?category=oral" },
  { title: "Pet Care", href: "/shop" },
];

export const CLINIC_CATEGORY_CARDS: SiteCategoryCard[] = [
  {
    title: "Weight Loss",
    description:
      "Personalised treatment plans and clinical support to help you lose weight safely and sustainably. 100% online care, from consultation to delivery.",
    href: "/treatments/weight-loss",
  },
  {
    title: "Men's Health",
    description:
      "Confidential, expert-led care for men's health concerns like ED, hair loss, and more. Discreet, 100% online treatment and support.",
    href: "/conditions/erectile-dysfunction",
  },
  {
    title: "Women's Health",
    description:
      "Online care for common women's health concerns like contraception, menopause, and more. Discreet, expert-led support from home.",
    href: "/conditions/emergency-contraception",
  },
  {
    title: "STI Treatments",
    description:
      "Discreet online testing and treatment for common STIs. Expert clinical review and fast delivery.",
    href: "/conditions/chlamydia",
  },
  {
    title: "Pain Relief",
    description:
      "Get clinical support and treatment for ongoing or acute pain like migraines or joint pain. Safe, effective care delivered to your door.",
    href: "/conditions/migraine",
  },
  {
    title: "Hair, Skin & Nails",
    description:
      "Treat concerns like hair thinning, acne, and brittle nails with expert-recommended solutions.",
    href: "/conditions/hair-loss",
  },
  {
    title: "Allergies & Respiratory",
    description:
      "Relief for seasonal allergies, hay fever, asthma and more without the wait.",
    href: "/conditions/allergic-rhinitis",
  },
  {
    title: "Digestive Health",
    description:
      "Support for common digestive issues like acid reflux, bloating, and IBS. Get personalised treatment plans 100% online.",
    href: "/conditions/acid-reflux",
  },
  {
    title: "Infections & Illnesses",
    description:
      "Fast, effective treatment for common infections like UTIs, sinusitis, and more. Get expert care without the clinic visit.",
    href: "/conditions/uti",
  },
  {
    title: "Travel Health",
    description:
      "Stay protected wherever you go. Access travel-related treatments like antimalarials and jet lag support delivered before you fly.",
    href: "/conditions/travel-sickness",
  },
  {
    title: "General Health",
    description:
      "Everyday treatments for common health concerns like tiredness, sleep, and immunity. Expert advice and care, all from home.",
    href: "/conditions",
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Choose your treatment",
    description: "Browse conditions or shop categories and select what you need.",
  },
  {
    title: "Complete your consultation",
    description: "Answer a secure medical questionnaire online in minutes.",
  },
  {
    title: "Clinical review",
    description: "A UK-registered prescriber or pharmacist reviews your answers.",
  },
  {
    title: "Discreet delivery",
    description: "Approved orders are dispensed and delivered to your door.",
  },
] as const;

export const LIVE_SITE_FAQS = [
  {
    q: "Is EveryDayMeds a registered pharmacy?",
    a: "Yes. EveryDayMeds is operated by OVIO Ltd, a UK-based distance-selling pharmacy. All medicines are dispensed from our registered premises under the supervision of a GPhC-registered pharmacist. We also work with UK-registered prescribers for all private treatments.",
  },
  {
    q: "How does the online consultation process work?",
    a: "When you choose a treatment, you'll complete a secure medical questionnaire. This is reviewed by a qualified prescriber or pharmacist, who may contact you if more information is needed. If your treatment is approved, your medicine will be dispensed and delivered directly to your address.",
  },
  {
    q: "How do you make sure medicines are safe for me?",
    a: "Every order is checked against your medical history and the answers you provide in your consultation. We use ID and age verification, review for medicine interactions, and follow strict GPhC and MHRA guidance. If anything needs clarification, our team will contact you before dispensing.",
  },
  {
    q: "How long does delivery take?",
    a: "Once your order has been approved, it is normally dispatched the same or next working day. Delivery times may vary depending on the option you choose at checkout, but most patients receive their medicines within 1–3 working days.",
  },
] as const;

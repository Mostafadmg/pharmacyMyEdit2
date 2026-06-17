export const SITE_TAGLINE = "Everyday Care. Expertly Delivered.";

export const PROMO_COPY = {
  headline: "£30 OFF your first consultation, £25 OFF every consultation after",
  couponCode: "FIRST30",
  repeatCode: "DOSE25",
} as const;

export const COMPANY = {
  legalName: "OVIO Ltd",
  brandName: "EveryDayMeds",
  phone: "0333 2070 413",
  phoneDisplay: "0333 207 0413",
  phoneHref: "tel:03332070413",
  email: "support@everydaymeds.co.uk",
  gphcNumber: "9012878",
  icoNumber: "ZB897471",
  superintendent: "Mahommed Zunaid Ayub Patel",
  superintendentGphc: "2217101",
  registeredAddress: "109 Coleman Road, Leicester, United Kingdom, LE5 4LE",
  premisesAddress: "54 Thurcaston Road, Leicester, LE4 5PF, UK",
  supportHours: "Monday to Friday: 9:00am - 5:00pm",
  supportHoursNote: "Closed Friday: 12:30pm - 2:30pm",
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
    href: "/treatments/hair-loss",
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
  { title: "Medicines & Treatments", href: "/collections/medicines-treatments" },
  { title: "Vitamins & Supplements", href: "/collections/vitamins-supplements" },
  { title: "Beauty & Personal Care", href: "/collections/beauty-personal-care" },
  { title: "Baby & Child", href: "/collections/baby-child" },
  { title: "Health & Wellbeing", href: "/collections/health-wellbeing" },
  { title: "Mobility & Daily Living Aids", href: "/collections/mobility-daily-living-aids" },
  { title: "Weight Management", href: "/collections/weight-management" },
  { title: "Medical Devices & Diagnostics", href: "/collections/medical-devices-diagnostics" },
  { title: "Toiletries", href: "/collections/toiletries" },
  { title: "Pet care", href: "/collections/pet-care" },
  { title: "Foot care", href: "/collections/foot-care" },
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

export const WEIGHT_LOSS_PAGE = {
  title: "Simple Weight Loss Treatments That Work",
  subtitle:
    "Take control of your health and achieve sustainable weight loss with clinically approved medication prescribed online and delivered discreetly",
  bullets: [
    "Quick online consultation. No in-person appointments",
    "Suppress appetite or block fat absorption",
    "Options include popular weight-management plans and products",
  ],
  ctaHref: "/treatments/weight-loss/choose",
  aboutTitle: "About Weight Loss Treatment",
  aboutParagraphs: [
    "Weight loss isn't just about appearance — it's about improving your overall health, energy, and confidence. Even small changes can make a big difference to how you feel day to day.",
    "At EveryDayMeds, we offer simple, effective weight-loss support designed to help you reach your goals by suppressing appetite, blocking fat absorption, helping you feel fuller for longer, and supporting gradual, safe, and sustainable weight reduction.",
    "Before getting started, you'll complete a simple online form so our team can make sure everything is right for you. Once approved, your order is packed and shipped discreetly to your door.",
  ],
  products: [
    { name: "Mounjaro (Tirzepatide)", priceFrom: "Live pricing in consultation" },
    { name: "Wegovy (Semaglutide)", priceFrom: "Live pricing in consultation" },
    { name: "Orlistat / Xenical", priceFrom: "From consultation", href: "/consultation/weight-loss-oral" },
  ],
  faqs: [
    { q: "How do weight-loss plans work?", a: "They help manage appetite and support healthy habits that make it easier to maintain a balanced diet and active lifestyle over time." },
    { q: "What's the difference between the available weight-loss options?", a: "Different plans work in different ways — some focus on helping manage appetite, while others support the way your body processes food." },
    { q: "Who is eligible for weight loss medication?", a: "You may qualify if your BMI is 30+, or 27+ with conditions like diabetes or high blood pressure." },
    { q: "Are there any side effects with weight loss treatments?", a: "Appetite suppressants may cause nausea or constipation; fat blockers can lead to oily stools — effects usually lessen over time." },
    { q: "How quickly will I see results?", a: "With injectables, changes may show in a few weeks; oral takes longer, but both work best with consistent diet and exercise." },
    { q: "Can I stop taking the treatment once I've lost weight?", a: "Yes, but weight may return without a solid lifestyle plan; continuing treatment helps keep weight off long-term." },
  ],
} as const;

export const HAIR_LOSS_PAGE = {
  title: "Hair Loss Treatment",
  subtitle: "Regain hair growth and slow down hair thinning with proven, clinically reviewed treatments.",
  bullets: [
    "No face-to-face appointments required",
    "Branded & generic options available",
    "Treatments to help stop and reverse male pattern baldness",
  ],
  ctaHref: "/conditions/hair-loss",
  aboutTitle: "About Hair Loss",
  aboutParagraphs: [
    "Hair loss in men is often caused by male pattern baldness (androgenetic alopecia), a hereditary condition that leads to gradual thinning and receding of the hairline.",
    "The good news is that clinically proven treatments can help stop or even reverse hair loss in many men. Treatments work best when started early.",
  ],
  products: [
    { name: "Finasteride (Generic)", priceFrom: "From £11.99" },
    { name: "Propecia", priceFrom: "From £48.99" },
    { name: "Dutasteride (Avodart)", priceFrom: "From £27.99" },
    { name: "Regaine Extra Strength Foam", priceFrom: "From £42.99" },
    { name: "Regaine Extra Strength Solution", priceFrom: "From £36.99" },
  ],
  faqs: [
    { q: "What causes hair loss in men, and how does it progress?", a: "The most common cause is androgenetic alopecia, linked to DHT sensitivity. Early treatment is key." },
    { q: "What treatments do you offer for hair loss, and how do they work?", a: "We offer Finasteride, Propecia, Dutasteride, and Regaine (Minoxidil)." },
    { q: "How effective are these treatments, and how long do they take to work?", a: "Finasteride stops hair loss in up to 90% of men; Regaine helps about 60% with twice-daily use over 4–6 months." },
    { q: "What's the difference between Regaine Foam and Solution?", a: "Both contain 5% Minoxidil. The foam is quick-drying; the solution allows more precise application." },
    { q: "Are there any side effects I should be aware of?", a: "Finasteride may cause low libido in about 1–2% of users. Regaine may cause scalp irritation or early shedding." },
    { q: "Do I have to keep using treatment forever?", a: "Yes — if you stop, hair loss usually resumes within 3–6 months." },
  ],
} as const;

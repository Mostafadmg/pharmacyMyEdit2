// Curated long-form landing pages for high-intent treatment searches.
// /treatments/weight-loss already has its own bespoke page (WeightLoss.tsx).
// All other slugs render the generic <TreatmentLanding> page using these props.

export type TreatmentOption = {
  name: string;
  generic?: string;
  pricePerMonth: string;
  badge?: string;
  badgeTone?: string;
  blurb: string;
  bullets: string[];
};

export type TreatmentFAQ = { q: string; a: string };

export type TreatmentPage = {
  slug: string;
  conditionId: string;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
  };
  intro: string;
  options: TreatmentOption[];
  benefits: Array<{ title: string; body: string; emoji: string }>;
  faq: TreatmentFAQ[];
  metaTitle: string;
  metaDescription: string;
};

export const TREATMENT_PAGES: TreatmentPage[] = [
  {
    slug: "erectile-dysfunction",
    conditionId: "erectile-dysfunction",
    hero: {
      eyebrow: "Sexual performance · Discreet next-day delivery",
      title: "Treatment for erectile dysfunction",
      subtitle: "All five UK-licensed PDE5 inhibitors — sildenafil, tadalafil, vardenafil, avanafil and daily tadalafil — prescribed by GPhC-registered pharmacist independent prescribers.",
      primaryCta: "Start ED consultation",
    },
    intro: "Erectile dysfunction affects around half of UK men aged 40–70 at some point. It is almost always treatable, often with one tablet taken before sex. Our pharmacist reviews your full medical history, checks for underlying causes, and recommends the medicine and dose that suits your lifestyle — whether you want spontaneity, predictability, or the cheapest option.",
    options: [
      {
        name: "Sildenafil (generic Viagra)",
        generic: "Sildenafil 25 / 50 / 100 mg",
        pricePerMonth: "from £6 / 8 tablets",
        badge: "Cheapest",
        badgeTone: "bg-emerald-100 text-emerald-700",
        blurb: "The original PDE5 inhibitor. Take 30–60 minutes before sex; effect lasts 4–6 hours. Now off-patent and very affordable.",
        bullets: ["Take on demand", "Effect lasts 4–6 hours", "Avoid heavy/fatty meals before"],
      },
      {
        name: "Tadalafil 'on demand' (Cialis)",
        generic: "Tadalafil 10 / 20 mg",
        pricePerMonth: "from £19 / 4 tablets",
        badge: "The 'weekend pill'",
        badgeTone: "bg-primary text-primary-foreground",
        blurb: "Effect lasts up to 36 hours, so you can be spontaneous over a weekend. Onset around 30 minutes.",
        bullets: ["One tablet covers a weekend", "Less affected by food", "Can be taken with alcohol in moderation"],
      },
      {
        name: "Tadalafil daily (Cialis Daily)",
        generic: "Tadalafil 2.5 / 5 mg daily",
        pricePerMonth: "from £39 / month",
        badge: "Always-on",
        badgeTone: "bg-accent text-accent-foreground",
        blurb: "A small daily dose keeps your system topped up so you're never planning around medication. Best for regular sex lives.",
        bullets: ["No timing required", "Steady, predictable effect", "Often improves urinary symptoms too"],
      },
      {
        name: "Avanafil (Spedra)",
        generic: "Avanafil 50 / 100 / 200 mg",
        pricePerMonth: "from £29 / 4 tablets",
        badge: "Fastest onset",
        badgeTone: "bg-violet-100 text-violet-700",
        blurb: "Onset in just 15 minutes and the cleanest side-effect profile — useful if sildenafil gives you a headache or visual disturbance.",
        bullets: ["Onset in 15 minutes", "Lower headache rates", "Effect lasts 4–6 hours"],
      },
      {
        name: "Vardenafil (Levitra)",
        generic: "Vardenafil 5 / 10 / 20 mg",
        pricePerMonth: "from £24 / 4 tablets",
        badge: "Tablet alternative",
        badgeTone: "bg-secondary text-secondary-foreground",
        blurb: "An alternative for patients who don't tolerate sildenafil or tadalafil. Onset 25–60 minutes; effect lasts ~5 hours.",
        bullets: ["Take on demand", "Useful if other PDE5s caused side effects", "Avoid grapefruit juice"],
      },
    ],
    benefits: [
      { emoji: "🔒", title: "Discreet packaging", body: "Plain padded envelope, no pharmacy branding visible. Delivered to your door, locker or workplace." },
      { emoji: "👨‍⚕️", title: "Real pharmacist review", body: "A GPhC-registered prescriber reviews every consultation — no automated tick-box approvals." },
      { emoji: "💬", title: "Ongoing chat support", body: "Message your pharmacist any time during treatment if a dose isn't working or causes side effects." },
      { emoji: "🚚", title: "Free next-day delivery", body: "Order before 4pm on a working day for tracked, signed-for next-day arrival." },
    ],
    faq: [
      { q: "Will I be charged if I'm declined?", a: "No. If our prescriber decides ED medication is not safe for you we refund your consultation in full and explain why, with onward signposting where appropriate." },
      { q: "Do I need a paper prescription from my GP?", a: "No. Our pharmacist independent prescribers can prescribe directly after reviewing your online consultation." },
      { q: "Can I take ED medication with blood-pressure tablets?", a: "Often yes, but it depends on which one. Always declare your full medication list. We do not prescribe PDE5 inhibitors alongside any nitrate medicine (e.g. GTN spray) — that combination is unsafe." },
      { q: "How long until I get my treatment?", a: "Consultations submitted before 4pm on a weekday are typically reviewed within hours. Approved orders dispatch same-day with tracked next-day delivery." },
    ],
    metaTitle: "Erectile Dysfunction Treatment Online · UK Pharmacy",
    metaDescription: "Buy sildenafil, tadalafil, avanafil and vardenafil online from a GPhC-registered UK pharmacy. Free discreet next-day delivery, real pharmacist review.",
  },
  {
    slug: "hair-loss",
    conditionId: "hair-loss",
    hero: {
      eyebrow: "Hair loss · Pharmacist-led treatment",
      title: "Stop and reverse male pattern hair loss",
      subtitle: "Finasteride, dutasteride and topical minoxidil — the only three treatments with strong UK evidence for male androgenetic alopecia.",
      primaryCta: "Start hair-loss consultation",
    },
    intro: "Male pattern hair loss is overwhelmingly genetic and tends to follow the same pattern in every man it affects: thinning at the temples, then the crown, gradually progressing. Treatment works best when started early — once a follicle has been miniaturised for several years, regrowth becomes unlikely. The earlier you start, the more hair you keep.",
    options: [
      {
        name: "Finasteride 1 mg",
        generic: "Finasteride 1 mg tablet daily",
        pricePerMonth: "from £19 / month",
        badge: "Most prescribed",
        badgeTone: "bg-primary text-primary-foreground",
        blurb: "A daily 1 mg tablet that blocks the conversion of testosterone to DHT — the hormone responsible for follicle miniaturisation. Slows or stops loss in around 90% of men, with regrowth in around 65%.",
        bullets: ["One tablet a day", "Visible effect from 3–6 months", "Continue indefinitely to maintain"],
      },
      {
        name: "Topical minoxidil 5%",
        generic: "Minoxidil 5% solution / foam",
        pricePerMonth: "from £15 / month",
        badge: "Adds regrowth",
        badgeTone: "bg-accent text-accent-foreground",
        blurb: "Applied twice a day to the scalp. Boosts follicle blood flow and prolongs the active growth phase. Works particularly well at the crown.",
        bullets: ["Apply morning + evening", "Pairs well with finasteride", "Initial 'shed' is normal at week 4"],
      },
      {
        name: "Dutasteride 0.5 mg",
        generic: "Dutasteride 0.5 mg capsule daily",
        pricePerMonth: "from £39 / month",
        badge: "Stronger option",
        badgeTone: "bg-violet-100 text-violet-700",
        blurb: "A more potent DHT-blocker than finasteride (used off-label for hair loss in the UK). Offered when finasteride hasn't been enough after 12 months.",
        bullets: ["One capsule a day", "Stronger DHT suppression", "Same side-effect profile as finasteride"],
      },
    ],
    benefits: [
      { emoji: "📸", title: "Photo progress reviews", body: "Send us a hairline / crown photo every 3 months and our pharmacist will review and adjust dose if needed." },
      { emoji: "💸", title: "Subscribe and save", body: "Save 10% when you switch to a recurring 3-monthly supply at checkout." },
      { emoji: "👨‍⚕️", title: "Honest expectations", body: "We won't sell you treatment that won't help. If your loss is too advanced for medication we'll tell you." },
      { emoji: "🔒", title: "Plain packaging", body: "Discreet envelopes, no pharmacy branding." },
    ],
    faq: [
      { q: "Will I lose my hair if I stop the tablets?", a: "Yes — within 6–12 months hair loss usually resumes from the point you started. Treatment must be continued long-term to maintain results." },
      { q: "What about sexual side effects of finasteride?", a: "Reported in around 1–2% of men. Most resolve when the dose is paused. We screen for this in every consultation and review at the 3-month check-in." },
      { q: "Can I just buy minoxidil over the counter?", a: "Yes — minoxidil 5% is a P-medicine and we stock it in the shop. The biggest gains for most men come from combining it with prescription finasteride." },
    ],
    metaTitle: "Hair Loss Treatment Online · Finasteride & Minoxidil UK",
    metaDescription: "Pharmacist-prescribed finasteride, dutasteride and topical minoxidil for male pattern hair loss. Free UK delivery, ongoing pharmacist support.",
  },
  {
    slug: "hayfever",
    conditionId: "allergic-rhinitis",
    hero: {
      eyebrow: "Allergies · Free next-day delivery",
      title: "Stronger hayfever treatment when supermarket tablets stop working",
      subtitle: "Prescription-strength fexofenadine 180 mg, combined nasal sprays and steroid eye drops — reviewed and prescribed online by a UK pharmacist.",
      primaryCta: "Start hayfever consultation",
    },
    intro: "If your hayfever costs you sleep, work, or driving safety, you've outgrown supermarket loratadine. Prescription-strength antihistamines and combined nasal sprays are dramatically more effective for moderate-to-severe symptoms — and most patients see a difference within 48 hours of starting.",
    options: [
      {
        name: "Fexofenadine 180 mg",
        generic: "Fexofenadine 180 mg tablet",
        pricePerMonth: "from £15 / month",
        badge: "Strongest non-drowsy",
        badgeTone: "bg-primary text-primary-foreground",
        blurb: "The most potent non-sedating antihistamine available in the UK. Excellent for severe sneezing, watery eyes and itchy throat.",
        bullets: ["Once-daily tablet", "Non-drowsy", "Safe for drivers and pilots"],
      },
      {
        name: "Dymista nasal spray",
        generic: "Azelastine + fluticasone",
        pricePerMonth: "from £27 / spray",
        badge: "Combined action",
        badgeTone: "bg-accent text-accent-foreground",
        blurb: "Combines an antihistamine spray with a steroid spray in one device. The most effective single treatment for blocked, runny nose and sneezing.",
        bullets: ["Two sprays per nostril, twice daily", "Effect within 30 minutes", "Full benefit at 1–2 weeks"],
      },
      {
        name: "Steroid eye drops",
        generic: "Olopatadine 0.1% drops",
        pricePerMonth: "from £19 / bottle",
        badge: "For itchy red eyes",
        badgeTone: "bg-violet-100 text-violet-700",
        blurb: "Twice-daily drops for severe allergic conjunctivitis. Faster and more powerful than over-the-counter sodium cromoglicate.",
        bullets: ["Twice-daily drops", "Effect within hours", "Use alongside an oral antihistamine"],
      },
    ],
    benefits: [
      { emoji: "🌡️", title: "Pollen-forecast reminders", body: "Opt-in alerts when your local pollen count is forecast to spike — so you can pre-medicate." },
      { emoji: "🚚", title: "Order before 4pm", body: "Same-day dispatch with free tracked next-day delivery on orders over £25." },
      { emoji: "🔁", title: "Easy season-long supply", body: "Subscribe to a monthly refill from May to August and save 10%." },
    ],
    faq: [
      { q: "Can I take fexofenadine 180 mg with my asthma inhalers?", a: "Yes. There are no significant interactions between fexofenadine and standard asthma reliever or preventer inhalers." },
      { q: "How early should I start?", a: "If you know your trigger season, start a steroid nasal spray 1–2 weeks before your symptoms usually begin — it takes that long to reach full effect." },
      { q: "Are there any drowsiness concerns?", a: "Fexofenadine and loratadine are non-sedating in the vast majority of patients. Cetirizine causes mild drowsiness in around 1 in 8." },
    ],
    metaTitle: "Hayfever Treatment Online · Strong Prescription Antihistamines UK",
    metaDescription: "Buy fexofenadine 180 mg, Dymista combined nasal spray and steroid eye drops online. Pharmacist-prescribed, free UK next-day delivery.",
  },
];

export const getTreatmentPage = (slug: string): TreatmentPage | undefined =>
  TREATMENT_PAGES.find((p) => p.slug === slug);

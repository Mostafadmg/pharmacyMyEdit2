export type HealthArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Weight Loss" | "Sexual Health" | "Skin" | "Allergies" | "Mental Health" | "General Wellbeing" | "Hair Loss" | "Womens Health";
  author: string;
  authorRole: string;
  readMins: number;
  publishedAt: string;
  heroEmoji: string;
  relatedConditionId?: string;
  relatedTreatmentSlug?: string;
  body: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "h3"; text: string }
    | { type: "ul"; items: string[] }
    | { type: "callout"; tone: "info" | "warning" | "tip"; text: string }
    | { type: "quote"; text: string; cite?: string }
  >;
};

const PHARMA_AUTHOR = { name: "Dr Aisha Patel", role: "Superintendent Pharmacist · MPharm IP" };
const CLINICAL_AUTHOR = { name: "Sam Lawson", role: "Pharmacist Independent Prescriber · MPharm" };
const NUTRITION_AUTHOR = { name: "Megan Howell", role: "Registered Dietitian · ANutr" };

export const HEALTH_ARTICLES: HealthArticle[] = [
  {
    slug: "mounjaro-vs-wegovy-uk-2026",
    title: "Mounjaro vs Wegovy: which weight-loss injection is right for you in 2026?",
    excerpt:
      "Tirzepatide (Mounjaro) and semaglutide (Wegovy) are both weekly GLP-1 weight-loss injections — but the trial data, side effects and dosing schedules are very different. Our pharmacist breaks it down.",
    category: "Weight Loss",
    author: PHARMA_AUTHOR.name,
    authorRole: PHARMA_AUTHOR.role,
    readMins: 8,
    publishedAt: "2026-04-12",
    heroEmoji: "💉",
    relatedConditionId: "weight-loss",
    relatedTreatmentSlug: "weight-loss",
    body: [
      { type: "p", text: "If you've been researching weight-loss medication in the UK, two names will keep coming up: Mounjaro and Wegovy. Both are weekly self-injections, both are licensed for weight loss in adults with a BMI of 30 or above (or 27 with a weight-related condition), and both have produced impressive results in clinical trials. But they are not the same medicine, and they don't suit everyone equally." },
      { type: "h2", text: "Quick comparison" },
      { type: "ul", items: [
        "Mounjaro contains tirzepatide and acts on two appetite hormones (GLP-1 and GIP).",
        "Wegovy contains semaglutide and acts only on GLP-1.",
        "In trials, Mounjaro produced an average 20.9% body-weight reduction over 72 weeks (SURMOUNT-1) compared with 14.9% for Wegovy over 68 weeks (STEP-1).",
        "Both are once-weekly subcutaneous injections delivered with a pre-filled pen.",
        "Both follow a gradual titration schedule, increasing the dose every 4 weeks to limit side effects.",
      ]},
      { type: "h2", text: "How they actually work" },
      { type: "p", text: "Both medicines mimic naturally occurring gut hormones that are released after a meal. They slow stomach emptying so you feel full for longer, and they act on the brain's appetite centres so you feel less hungry between meals. Tirzepatide adds a second mechanism — it also activates GIP receptors, which appears to amplify the appetite-suppressing effect and improve how your body handles blood sugar." },
      { type: "h2", text: "Side effects to expect" },
      { type: "p", text: "The most common side effects of both medicines are gastrointestinal: nausea, constipation, diarrhoea, and burping. These tend to be worst in the first week of each new dose level and settle within a few days. Drinking plenty of water, eating smaller meals, and avoiding very fatty foods all help. Around 1 in 20 patients stop treatment because of side effects." },
      { type: "callout", tone: "warning", text: "Neither medicine is suitable if you have a personal or family history of medullary thyroid cancer or MEN2, a history of pancreatitis, or are pregnant, breastfeeding, or actively trying to conceive." },
      { type: "h2", text: "Which one is right for you?" },
      { type: "p", text: "There is no single right answer — it depends on your medical history, what your pharmacist sees in your consultation, and current UK supply. In our experience, patients new to weight-loss injections often start with Wegovy (more years of post-launch data) and switch to Mounjaro if they need a stronger response or stall on weight loss. Patients with type 2 diabetes alongside obesity are often offered Mounjaro first because of its stronger effect on blood sugar." },
      { type: "h2", text: "The bottom line" },
      { type: "p", text: "Both medicines work — and they work much better than diet and exercise alone. The right choice for you should always be made with a prescriber who has seen your full medical history. Start a consultation and our pharmacist will give you a personalised recommendation." },
    ],
  },
  {
    slug: "do-glp1-injections-cause-muscle-loss",
    title: "Do GLP-1 injections cause muscle loss? The honest answer.",
    excerpt: "Yes, all rapid weight loss can cause some lean-mass loss — but here's what the data actually shows for tirzepatide and semaglutide, and what you can do to protect your muscle.",
    category: "Weight Loss",
    author: CLINICAL_AUTHOR.name,
    authorRole: CLINICAL_AUTHOR.role,
    readMins: 6,
    publishedAt: "2026-03-28",
    heroEmoji: "💪",
    relatedTreatmentSlug: "weight-loss",
    body: [
      { type: "p", text: "It's the question we get asked most in messages: 'Will Mounjaro or Wegovy make me lose muscle?' The honest answer is: some, yes — but probably less than the headlines suggest, and you can do a lot to protect your lean mass while you lose fat." },
      { type: "h2", text: "What the trials show" },
      { type: "p", text: "When researchers measured body composition in patients on semaglutide, lean mass loss accounted for about 39% of total weight lost — broadly similar to what happens during any sustained calorie deficit, including bariatric surgery and very-low-calorie diets. Tirzepatide trials show a similar pattern." },
      { type: "h2", text: "The two-part protection plan" },
      { type: "h3", text: "1. Eat enough protein — every day" },
      { type: "p", text: "Aim for 1.2–1.6 g of protein per kg of bodyweight, every day. For a 90 kg adult, that is roughly 110–145 g of protein — about 30–40 g across each main meal." },
      { type: "h3", text: "2. Resistance train 2–3 times a week" },
      { type: "p", text: "You don't need to deadlift. Even bodyweight squats, push-ups, rows with resistance bands, and a brisk walk most days will protect lean mass." },
      { type: "callout", tone: "tip", text: "Track your progress with a tape measure and how your clothes fit, not just the scale. If you're losing 1–2 lb a week, eating 100+ g of protein, and lifting twice a week, your weight loss is overwhelmingly fat." },
    ],
  },
  {
    slug: "hayfever-uk-pollen-2026",
    title: "Your 2026 UK hay fever survival guide",
    excerpt: "Pollen counts in the UK have started earlier and run higher every year since 2020. Here's what actually works — and when to step up your treatment.",
    category: "Allergies",
    author: PHARMA_AUTHOR.name,
    authorRole: PHARMA_AUTHOR.role,
    readMins: 5,
    publishedAt: "2026-03-15",
    heroEmoji: "🌼",
    relatedConditionId: "allergic-rhinitis",
    body: [
      { type: "p", text: "Hay fever is no longer a 'few weeks in May' problem. Tree pollen now starts in late February in the south of England, and grass pollen runs from mid-May to August. If your symptoms cost you sleep, work, or driving safety, you have plenty of options that work better than a generic supermarket tablet." },
      { type: "h2", text: "Step 1: a once-daily non-drowsy antihistamine" },
      { type: "p", text: "Loratadine, cetirizine, or fexofenadine — taken every morning during your trigger season. Fexofenadine 180 mg is generally the best for moderate-to-severe symptoms and the least sedating." },
      { type: "h2", text: "Step 2: add a steroid nasal spray" },
      { type: "p", text: "If sneezing and a blocked nose are still a problem after 7 days on antihistamines, add a steroid nasal spray (e.g. mometasone or fluticasone). It takes 7–14 days to reach full effect — start it before pollen peaks." },
      { type: "h2", text: "Step 3: eye drops for itchy red eyes" },
      { type: "p", text: "Sodium cromoglicate or olopatadine eye drops twice a day, plus wraparound sunglasses outdoors." },
      { type: "callout", tone: "info", text: "If you've maxed out steps 1–3 and your hay fever still ruins your day, our pharmacist can prescribe high-strength fexofenadine and a combined nasal spray (Dymista) in a single online consultation." },
    ],
  },
  {
    slug: "acne-vs-rosacea-tell-difference",
    title: "Acne or rosacea? Here's how to tell — and what each one needs.",
    excerpt: "They look similar, they affect adults, and both can be embarrassing — but acne and rosacea are different conditions and need very different prescriptions.",
    category: "Skin",
    author: CLINICAL_AUTHOR.name,
    authorRole: CLINICAL_AUTHOR.role,
    readMins: 7,
    publishedAt: "2026-03-02",
    heroEmoji: "✨",
    relatedConditionId: "acne-vulgaris",
    body: [
      { type: "p", text: "Adult acne is now diagnosed in 1 in 4 women aged 25–44 in the UK. Rosacea affects roughly 1 in 10 adults of Northern European descent. Both cause red, inflamed-looking skin, but the right treatment is very different — and using the wrong one (especially harsh acne washes on rosacea) usually makes things worse." },
      { type: "h2", text: "Quick visual checklist" },
      { type: "ul", items: [
        "Acne: blackheads, whiteheads, papules, and sometimes painful cysts on the chin, jawline, and back. Skin is often oily.",
        "Rosacea: persistent redness across the cheeks and nose, visible tiny blood vessels, occasional pus-filled bumps. Skin often feels sensitive or burns easily.",
      ]},
      { type: "h2", text: "What works for acne" },
      { type: "p", text: "First-line: a topical retinoid (adapalene or tretinoin) at night, plus benzoyl peroxide in the morning. If that's not enough after 12 weeks, your prescriber may add an oral antibiotic (lymecycline) for 3 months, or refer you for hormonal options." },
      { type: "h2", text: "What works for rosacea" },
      { type: "p", text: "A gentle non-foaming cleanser, daily SPF 50, and prescription topicals — usually metronidazole gel, ivermectin cream, or azelaic acid. Oral doxycycline 40 mg modified-release is licensed for rosacea and works well." },
    ],
  },
  {
    slug: "ed-treatment-uk-options",
    title: "Erectile dysfunction: every treatment available in the UK in 2026",
    excerpt: "Sildenafil, tadalafil, vardenafil, avanafil and the daily option — what they cost, how fast they work, and which one suits which lifestyle.",
    category: "Sexual Health",
    author: PHARMA_AUTHOR.name,
    authorRole: PHARMA_AUTHOR.role,
    readMins: 6,
    publishedAt: "2026-02-18",
    heroEmoji: "💙",
    relatedConditionId: "erectile-dysfunction",
    body: [
      { type: "p", text: "ED affects roughly 50% of men aged 40–70 in the UK at some point. The good news: in 2026 there are five PDE5-inhibitor medicines, all available with a private online consultation, and most cost under £30 a month for the generic version." },
      { type: "h2", text: "Sildenafil (generic Viagra)" },
      { type: "p", text: "Tablet 25 / 50 / 100 mg taken on demand 30–60 minutes before sex. Effect lasts 4–6 hours. Cheapest option — generic sildenafil starts from around £6 for 8 tablets." },
      { type: "h2", text: "Tadalafil (Cialis)" },
      { type: "p", text: "Two ways to take it: 10 / 20 mg on demand (effect lasts up to 36 hours, hence the 'weekend pill'), or 2.5 / 5 mg taken every day (effect is 'always on'). Best option if you want spontaneity or have predictable sex life." },
      { type: "h2", text: "Vardenafil and Avanafil" },
      { type: "p", text: "Less commonly used. Avanafil (Spedra) has the fastest onset (15 minutes) and the cleanest side-effect profile — useful if sildenafil gives you a headache or visual disturbance." },
      { type: "callout", tone: "warning", text: "All PDE5 inhibitors are unsafe with nitrate medicines (e.g. GTN spray) and need caution with certain blood-pressure tablets. Always declare your full medication list during the consultation." },
    ],
  },
  {
    slug: "uti-women-when-to-treat",
    title: "Cystitis & UTIs in women: when to self-treat, when to call us",
    excerpt: "Most uncomplicated UTIs in women under 65 can be safely treated with a 3-day course of antibiotics. Here's how to tell yours apart from a more serious infection.",
    category: "Womens Health",
    author: CLINICAL_AUTHOR.name,
    authorRole: CLINICAL_AUTHOR.role,
    readMins: 5,
    publishedAt: "2026-02-04",
    heroEmoji: "🩺",
    relatedConditionId: "uti",
    body: [
      { type: "p", text: "Around half of all women in the UK will have at least one urinary tract infection in their lifetime. Most are uncomplicated, caused by E. coli, and clear up quickly with a short course of antibiotics. But it is important to spot the signs that point to something more serious." },
      { type: "h2", text: "Classic uncomplicated UTI" },
      { type: "ul", items: [
        "Burning or stinging when you pass urine",
        "Needing to urinate more often, including at night",
        "Cloudy or strong-smelling urine",
        "Mild ache low in the abdomen",
      ]},
      { type: "callout", tone: "warning", text: "Call NHS 111 or your GP urgently if you also have: a temperature above 38°C, pain in your back or side, blood in your urine, vomiting, confusion, or symptoms during pregnancy. These can indicate a kidney infection." },
      { type: "h2", text: "First-line treatment" },
      { type: "p", text: "Nitrofurantoin 100 mg modified-release twice a day for 3 days is now the UK first-line antibiotic for uncomplicated UTI in women under 65. Trimethoprim is a backup option in those allergic to nitrofurantoin." },
    ],
  },
  {
    slug: "sleep-hygiene-melatonin-uk",
    title: "Melatonin in the UK: what it actually treats and where to start",
    excerpt: "Melatonin is now the UK's most-googled sleep aid — but it's prescription-only, and it isn't a sleeping pill. Here's the honest guide.",
    category: "Mental Health",
    author: PHARMA_AUTHOR.name,
    authorRole: PHARMA_AUTHOR.role,
    readMins: 5,
    publishedAt: "2026-01-22",
    heroEmoji: "🌙",
    body: [
      { type: "p", text: "Unlike in the US, melatonin in the UK is a prescription-only medicine (POM). The two licensed indications are short-term insomnia in adults aged 55+, and sleep problems in children with neurodevelopmental conditions." },
      { type: "h2", text: "What melatonin is — and isn't" },
      { type: "p", text: "Melatonin is a hormone your brain releases as it gets dark. Taking it as a tablet shifts your body clock and can help you fall asleep at the right time. It does not knock you out the way zopiclone or a benzodiazepine would." },
      { type: "h2", text: "Realistic expectations" },
      { type: "p", text: "In trials of prolonged-release melatonin (Circadin) in adults 55+, patients fell asleep an average of 9 minutes faster and slept around 17 minutes longer per night. Useful, but not a miracle. The bigger gains usually come from sleep hygiene work alongside the tablet." },
    ],
  },
  {
    slug: "creatine-vitamin-d-uk-deficiency",
    title: "Vitamin D in the UK: who needs to supplement, and how much",
    excerpt: "Public Health England recommends every adult in the UK considers a daily 10 µg vitamin D supplement from October to March. Here's why — and the evidence behind it.",
    category: "General Wellbeing",
    author: NUTRITION_AUTHOR.name,
    authorRole: NUTRITION_AUTHOR.role,
    readMins: 4,
    publishedAt: "2026-01-08",
    heroEmoji: "☀️",
    body: [
      { type: "p", text: "From early October until late March, the sun in the UK is too low in the sky for your skin to make any meaningful vitamin D, no matter how much time you spend outdoors. That's why the official NHS recommendation is for everyone to consider taking a daily 10 µg (400 IU) supplement during the winter months." },
      { type: "h2", text: "Who should supplement year-round" },
      { type: "ul", items: [
        "People who rarely go outdoors (e.g. care home residents, people who work nights)",
        "People who cover most of their skin when outside",
        "People with darker skin (Black, African, Caribbean, South Asian)",
        "Pregnant and breastfeeding women",
        "Children aged 1–4 years",
      ]},
      { type: "h2", text: "How much is too much?" },
      { type: "p", text: "The safe upper limit for adults is 100 µg (4,000 IU) per day. Most over-the-counter supplements provide 10–25 µg, which is plenty for the general population." },
    ],
  },
];

export const HEALTH_CATEGORIES = Array.from(new Set(HEALTH_ARTICLES.map((a) => a.category)));

export const getArticle = (slug: string): HealthArticle | undefined =>
  HEALTH_ARTICLES.find((a) => a.slug === slug);

export const getRelatedArticles = (slug: string, max = 3): HealthArticle[] => {
  const current = getArticle(slug);
  if (!current) return [];
  const sameCategory = HEALTH_ARTICLES.filter((a) => a.slug !== slug && a.category === current.category);
  const others = HEALTH_ARTICLES.filter((a) => a.slug !== slug && a.category !== current.category);
  return [...sameCategory, ...others].slice(0, max);
};

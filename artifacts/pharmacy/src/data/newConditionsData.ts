// 22 new MedExpress / Pharmacy2U-style conditions with full questionnaires.
// Eligibility questions block the patient from continuing if answered with `blockingAnswer`.
// Clinical questions are reviewed by the pharmacist.
//
// This file is imported and merged into conditionQuestions.ts.

import type { ConditionQuestionnaire, Option } from "./conditionQuestions";

const YN: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export type DbConditionSeed = {
  id: string;
  name: string;
  category: string;
  description: string;
  onlineEligible: boolean;
  requiresPhoto: boolean;
  requiresInPerson: boolean;
  ageRestrictions: string | null;
  redFlags: string[];
  priceGbp: number; // pence
};

export const newConditionDbSeeds: DbConditionSeed[] = [
  // ─── Weight Management ──────────────────────────────────────────────
  {
    id: "weight-loss",
    name: "Weight Loss (Mounjaro · Wegovy · Saxenda · Orlistat · Mysimba)",
    category: "weight_management",
    description:
      "Clinically-led weight management with prescription medicines including the GLP-1 family (Mounjaro tirzepatide, Wegovy/Saxenda semaglutide & liraglutide), Orlistat/Xenical and Mysimba. Includes BMI eligibility, contraindication screening and pharmacist follow-up.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["pregnancy", "eating_disorder", "thyroid_cancer_history", "pancreatitis", "type1_diabetes"],
    priceGbp: 14900,
  },
  // ─── Sexual Performance ─────────────────────────────────────────────
  {
    id: "erectile-dysfunction",
    name: "Erectile Dysfunction (Sildenafil · Tadalafil · Viagra · Cialis)",
    category: "sexual_performance",
    description:
      "Confidential ED treatment with PDE5 inhibitors. Sildenafil (Viagra), Tadalafil (Cialis daily/on-demand), Vardenafil and Spedra. Pharmacist review of cardiovascular risk and drug interactions.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["recent_mi", "unstable_angina", "nitrate_use", "severe_hypotension"],
    priceGbp: 1900,
  },
  {
    id: "premature-ejaculation",
    name: "Premature Ejaculation (Priligy / Dapoxetine · EMLA)",
    category: "sexual_performance",
    description:
      "Treatment for premature ejaculation with dapoxetine (Priligy) and topical anaesthetic creams. Pharmacist screens for SSRI interactions and bipolar/cardiac history.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "18-64",
    redFlags: ["mania", "ssri_interaction", "fainting_history"],
    priceGbp: 2900,
  },
  // ─── Sexual Health ──────────────────────────────────────────────────
  {
    id: "bacterial-vaginosis",
    name: "Bacterial Vaginosis (Metronidazole · Clindamycin)",
    category: "sexual_health",
    description:
      "BV treatment with oral or topical metronidazole, clindamycin cream or lactic-acid gels. Pharmacist confirms diagnosis criteria and rules out STI overlap.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "16+",
    redFlags: ["pregnancy_with_pv_bleed", "fever", "pelvic_pain"],
    priceGbp: 1500,
  },
  {
    id: "cystitis",
    name: "Cystitis / UTI (Trimethoprim · Nitrofurantoin · MacroBID)",
    category: "sexual_health",
    description:
      "First-line antibiotics for uncomplicated lower urinary tract infection in adults assigned female at birth. Pharmacist review per NICE NG109.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "16-64",
    redFlags: ["loin_pain", "fever", "rigors", "vomiting", "pregnancy_first_trimester"],
    priceGbp: 1200,
  },
  {
    id: "emergency-contraception",
    name: "Emergency Contraception (Levonelle · ellaOne)",
    category: "sexual_health",
    description:
      "Morning-after pill: levonorgestrel (Levonelle) within 72h or ulipristal acetate (ellaOne) within 120h of unprotected sex. Pharmacist supplies same-day after a short eligibility check.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "16+",
    redFlags: ["over_120h_since_uspi", "severe_asthma_with_steroids"],
    priceGbp: 1500,
  },
  {
    id: "period-delay",
    name: "Period Delay (Norethisterone)",
    category: "sexual_health",
    description:
      "Norethisterone 5mg three times daily can delay a period for up to 17 days. Used for holidays, sport or special events. Pharmacist screens for clot risk.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "16+",
    redFlags: ["personal_vte", "family_vte_first_degree", "smoker_over_35", "migraine_with_aura"],
    priceGbp: 1900,
  },
  // ─── STIs ───────────────────────────────────────────────────────────
  {
    id: "chlamydia",
    name: "Chlamydia (Doxycycline · Azithromycin)",
    category: "stis",
    description:
      "First-line antibiotic treatment for confirmed chlamydia: doxycycline 100mg BD for 7 days, or azithromycin 1g single dose if doxycycline contraindicated. Includes partner-notification advice.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "16+",
    redFlags: ["pelvic_pain", "fever", "unable_to_provide_test_result"],
    priceGbp: 2500,
  },
  {
    id: "genital-herpes",
    name: "Genital Herpes (Aciclovir · Valaciclovir)",
    category: "stis",
    description:
      "Episodic and suppressive treatment for genital HSV with aciclovir 400mg or valaciclovir 500mg, started within 72h of prodrome. Pharmacist takes a brief outbreak history.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "16+",
    redFlags: ["pregnancy_third_trimester", "first_outbreak_with_meningism"],
    priceGbp: 2900,
  },
  {
    id: "genital-warts",
    name: "Genital Warts (Aldara · Warticon · Condyline)",
    category: "stis",
    description:
      "Topical treatments for external genital warts (HPV): imiquimod (Aldara), podophyllotoxin solution/cream (Warticon, Condyline). Pharmacist excludes intra-anal/cervical lesions which need clinic referral.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["pregnancy", "internal_warts", "lesions_with_bleeding"],
    priceGbp: 3900,
  },
  // ─── Pain Relief ────────────────────────────────────────────────────
  {
    id: "arthritis",
    name: "Arthritis & Joint Pain (Naproxen · Topical Diclofenac)",
    category: "pain_minor_illness",
    description:
      "Symptomatic relief of mild-moderate osteoarthritis with topical diclofenac (Voltarol), oral naproxen with PPI cover, capsaicin cream and lifestyle advice.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["new_severe_swelling", "warm_red_joint", "weight_loss_with_pain"],
    priceGbp: 1500,
  },
  {
    id: "migraine",
    name: "Migraine (Sumatriptan · Rizatriptan)",
    category: "pain_minor_illness",
    description:
      "Acute migraine relief with triptans (sumatriptan 50/100mg, rizatriptan 10mg) plus anti-emetic. Pharmacist screens for cardiovascular risk and atypical aura.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "18-64",
    redFlags: ["thunderclap_headache", "neuro_deficit", "fever_with_headache", "pregnancy"],
    priceGbp: 1900,
  },
  {
    id: "numbing-cream",
    name: "Numbing Cream (EMLA · Lidocaine 5%)",
    category: "pain_minor_illness",
    description:
      "Topical anaesthetic creams for tattoos, laser, dermal fillers, vaccinations and minor procedures. Pharmacist confirms intended use site.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "16+",
    redFlags: ["mucosal_application", "broken_skin", "lidocaine_allergy"],
    priceGbp: 1500,
  },
  // ─── Hair, Skin & Nails ─────────────────────────────────────────────
  {
    id: "hair-loss",
    name: "Hair Loss (Finasteride · Minoxidil · Regaine)",
    category: "hair_skin_nails",
    description:
      "Male-pattern hair loss treatment with finasteride 1mg tablets and topical minoxidil 5% (Regaine). Pharmacist screens for prostate symptoms and mood changes.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "18-65",
    redFlags: ["female_or_pregnant", "prostate_cancer_family", "depression_history"],
    priceGbp: 2900,
  },
  {
    id: "nail-infection",
    name: "Nail Infection / Fungal Nail (Amorolfine · Curanail)",
    category: "hair_skin_nails",
    description:
      "Topical treatment for mild-moderate fungal nail infection with amorolfine 5% (Curanail) for up to 9 months. Pharmacist confirms appropriateness vs oral terbinafine.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["diabetes_with_foot_ulcer", "more_than_2_nails", "matrix_involvement"],
    priceGbp: 2500,
  },
  {
    id: "rosacea",
    name: "Rosacea (Mirvaso · Soolantra · Rozex)",
    category: "hair_skin_nails",
    description:
      "Topical treatment for facial rosacea with brimonidine (Mirvaso), ivermectin (Soolantra), metronidazole (Rozex) and azelaic acid. Includes oral doxycycline for moderate cases.",
    onlineEligible: true,
    requiresPhoto: true,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["ocular_rosacea_with_visual_change", "pregnancy_for_doxy"],
    priceGbp: 2900,
  },
  // ─── Digestive Health ───────────────────────────────────────────────
  {
    id: "acid-reflux",
    name: "Acid Reflux & Heartburn (Omeprazole · Lansoprazole · Esomeprazole)",
    category: "digestive",
    description:
      "Proton-pump inhibitor treatment for GORD: omeprazole 20mg, lansoprazole 30mg, esomeprazole 20mg. Pharmacist screens for alarm symptoms warranting endoscopy referral.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["dysphagia", "weight_loss", "anaemia", "haematemesis", "melaena", "age_55_plus_new_dyspepsia"],
    priceGbp: 1500,
  },
  {
    id: "ibs",
    name: "Irritable Bowel Syndrome (Mebeverine · Buscopan · Colpermin)",
    category: "digestive",
    description:
      "Antispasmodic and lifestyle treatment for IBS: mebeverine (Colofac), hyoscine (Buscopan), peppermint oil capsules (Colpermin), with low-FODMAP advice.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "16+",
    redFlags: ["rectal_bleeding", "weight_loss", "nocturnal_diarrhoea", "family_bowel_cancer"],
    priceGbp: 1500,
  },
  // ─── Seasonal Viruses ───────────────────────────────────────────────
  {
    id: "covid-19-tests",
    name: "COVID-19 Tests (LFT · PCR home kits)",
    category: "seasonal_viruses",
    description:
      "Self-test lateral flow and PCR home test kits for COVID-19, including pre-travel certified tests with digital reporting.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: null,
    redFlags: ["severe_breathlessness", "chest_pain", "blue_lips"],
    priceGbp: 999,
  },
  {
    id: "flu",
    name: "Flu (Tamiflu / Oseltamivir · Vaccination)",
    category: "seasonal_viruses",
    description:
      "Antiviral oseltamivir (Tamiflu) within 48h of flu symptoms in eligible adults, plus annual flu vaccination booking.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "13+",
    redFlags: ["severe_breathlessness", "confusion", "chest_pain", "pregnancy_third_trimester"],
    priceGbp: 4900,
  },
  // ─── Travel Health ──────────────────────────────────────────────────
  {
    id: "anti-malaria",
    name: "Anti-Malaria (Malarone · Doxycycline · Lariam)",
    category: "travel_health",
    description:
      "Malaria chemoprophylaxis tailored to your destination: atovaquone-proguanil (Malarone), doxycycline or mefloquine (Lariam), with NaTHNaC region check.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "12+",
    redFlags: ["pregnancy", "epilepsy_for_mefloquine", "kidney_failure"],
    priceGbp: 1500,
  },
  {
    id: "jet-lag",
    name: "Jet Lag (Melatonin · Circadin)",
    category: "travel_health",
    description:
      "Short-course melatonin 3mg / Circadin 2mg PR for jet lag after eastward flights crossing ≥5 time zones. Pharmacist confirms travel itinerary.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "18-64",
    redFlags: ["epilepsy", "auto_immune_disease", "warfarin_use"],
    priceGbp: 1900,
  },
  {
    id: "sleep",
    name: "Sleep Aid (Nytol · Phenergan · Melatonin)",
    category: "travel_health",
    description:
      "Short-term insomnia relief with antihistamines (diphenhydramine — Nytol, promethazine — Phenergan) and prolonged-release melatonin for over-55s.",
    onlineEligible: true,
    requiresPhoto: false,
    requiresInPerson: false,
    ageRestrictions: "18+",
    redFlags: ["sleep_apnoea_untreated", "alcohol_dependency", "elderly_falls_risk"],
    priceGbp: 1500,
  },
];

// Reusable building blocks
const NOT_PREG_OR_BF = {
  id: "pregnant_breastfeeding",
  text: "Are you currently pregnant, trying to conceive, or breastfeeding?",
  blockingAnswer: "yes" as const,
  blockingMessage:
    "This treatment is not suitable during pregnancy or breastfeeding. Please book a consultation with your GP.",
};

const EMERGENCY = {
  id: "emergency",
  text: "Are you experiencing a medical emergency such as severe chest pain, fainting, or a serious allergic reaction?",
  blockingAnswer: "yes" as const,
  blockingMessage: "Please call 999 immediately for a medical emergency.",
};

export const newConditionQuestions: Record<string, ConditionQuestionnaire> = {
  // ─────────── Weight Loss ──────────────────────────────────────────────
  "weight-loss": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "under_18",
        text: "Are you under 18 years old?",
        blockingAnswer: "yes",
        blockingMessage: "Weight-loss prescription medicines are only suitable for adults 18+.",
      },
      {
        id: "pregnancy",
        text: "Are you pregnant, planning a pregnancy, or breastfeeding?",
        blockingAnswer: "yes",
        blockingMessage: "Weight-loss medicines are not safe in pregnancy or breastfeeding.",
      },
      {
        id: "type1_diabetes",
        text: "Do you have type 1 diabetes?",
        blockingAnswer: "yes",
        blockingMessage: "GLP-1 weight-loss medicines are not licensed for type 1 diabetes.",
      },
      {
        id: "thyroid_cancer",
        text: "Have you or any close family member had medullary thyroid cancer or MEN2?",
        blockingAnswer: "yes",
        blockingMessage: "GLP-1 medicines are contraindicated in personal/family history of MTC or MEN2.",
      },
      {
        id: "pancreatitis",
        text: "Have you ever been diagnosed with pancreatitis?",
        blockingAnswer: "yes",
        blockingMessage: "A history of pancreatitis means GLP-1 medicines are not suitable.",
      },
      {
        id: "eating_disorder",
        text: "Have you been diagnosed with an eating disorder (anorexia, bulimia)?",
        blockingAnswer: "yes",
        blockingMessage: "We are unable to safely prescribe weight-loss medicines if you have a current or recent eating disorder.",
      },
    ],
    clinicalQuestions: [
      { id: "height_cm", text: "What is your height in cm?", type: "textarea", required: true },
      { id: "weight_kg", text: "What is your current weight in kg?", type: "textarea", required: true },
      { id: "weight_kg_12mo", text: "What was your weight 12 months ago in kg (approximate)?", type: "textarea" },
      { id: "ethnicity", text: "What is your ethnicity?", type: "radio", required: true,
        options: [
          { value: "white", label: "White" },
          { value: "south_asian", label: "South Asian" },
          { value: "black", label: "Black" },
          { value: "mixed_other", label: "Mixed / Other" },
        ] },
      { id: "previous_attempts", text: "What lifestyle changes have you tried in the last 6 months (diet, exercise, programmes)?", type: "textarea", required: true },
      { id: "comorbidities", text: "Do you have any of the following weight-related conditions?", type: "checkbox_group",
        options: [
          { value: "type2_diabetes", label: "Type 2 diabetes" },
          { value: "prediabetes", label: "Prediabetes" },
          { value: "hypertension", label: "High blood pressure" },
          { value: "high_cholesterol", label: "High cholesterol" },
          { value: "sleep_apnoea", label: "Sleep apnoea" },
          { value: "pcos", label: "PCOS" },
          { value: "fatty_liver", label: "Fatty liver disease" },
          { value: "joint_pain", label: "Significant joint pain" },
          { value: "none", label: "None of these" },
        ] },
      { id: "preferred_treatment", text: "Which treatment would you like to discuss?", type: "radio", required: true,
        options: [
          { value: "mounjaro", label: "Mounjaro (tirzepatide) — weekly injection" },
          { value: "wegovy", label: "Wegovy (semaglutide) — weekly injection" },
          { value: "saxenda", label: "Saxenda (liraglutide) — daily injection" },
          { value: "orlistat", label: "Orlistat / Xenical — capsule with meals" },
          { value: "mysimba", label: "Mysimba — daily tablet" },
          { value: "open", label: "Open to your recommendation" },
        ] },
      { id: "current_meds", text: "List all medicines you currently take (prescription and over-the-counter).", type: "textarea", required: true },
      { id: "allergies", text: "List any allergies to medicines.", type: "textarea" },
      { id: "alcohol", text: "How much alcohol do you drink per week (units)?", type: "textarea" },
      { id: "previous_glp1", text: "Have you previously taken a GLP-1 medicine (Wegovy, Saxenda, Ozempic, Mounjaro, Victoza, Trulicity)?", type: "radio", options: YN, required: true },
      { id: "gallbladder", text: "Have you had gallbladder problems or had your gallbladder removed?", type: "radio", options: YN, required: true },
      { id: "kidney_liver", text: "Do you have kidney or liver disease?", type: "radio", options: YN, required: true },
    ],
  },
  // ─────────── ED ───────────────────────────────────────────────────────
  "erectile-dysfunction": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "nitrates",
        text: "Do you take nitrates such as GTN spray, isosorbide mononitrate, or nicorandil for chest pain?",
        blockingAnswer: "yes",
        blockingMessage: "PDE5 inhibitors must not be combined with nitrates due to risk of severe hypotension.",
      },
      {
        id: "recent_mi_stroke",
        text: "Have you had a heart attack or stroke in the last 6 months?",
        blockingAnswer: "yes",
        blockingMessage: "We cannot prescribe ED medicines within 6 months of a cardiovascular event. Please see your GP.",
      },
      {
        id: "low_bp_history",
        text: "Have you ever fainted during sex or fainted while taking ED medicines?",
        blockingAnswer: "yes",
        blockingMessage: "Please see your GP — further cardiovascular review is needed before treatment.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have you had ED symptoms?", type: "radio", required: true,
        options: [
          { value: "lt_6mo", label: "Under 6 months" },
          { value: "6_24", label: "6–24 months" },
          { value: "gt_2y", label: "Over 2 years" },
        ] },
      { id: "trigger", text: "Was the onset gradual or sudden?", type: "radio", required: true,
        options: [
          { value: "gradual", label: "Gradual" },
          { value: "sudden", label: "Sudden" },
        ] },
      { id: "morning_erections", text: "Do you still get morning erections?", type: "radio", options: YN, required: true },
      { id: "previous_pde5", text: "Have you tried sildenafil, tadalafil, vardenafil or avanafil before?", type: "textarea" },
      { id: "preferred_med", text: "Which medicine would you like?", type: "radio", required: true,
        options: [
          { value: "sildenafil_50", label: "Sildenafil 50mg (generic Viagra) on demand" },
          { value: "tadalafil_10", label: "Tadalafil 10/20mg on demand" },
          { value: "tadalafil_2_5", label: "Tadalafil 2.5/5mg daily" },
          { value: "viagra_connect", label: "Viagra Connect (sildenafil 50mg branded)" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "bp_known", text: "Do you know your blood pressure (rough numbers)?", type: "textarea" },
      { id: "cv_risk", text: "Do you have any of these heart-related conditions?", type: "checkbox_group",
        options: [
          { value: "angina", label: "Angina" },
          { value: "high_bp_treated", label: "High BP — treated" },
          { value: "high_cholesterol", label: "High cholesterol" },
          { value: "irregular_heart", label: "Irregular heartbeat" },
          { value: "diabetes", label: "Diabetes" },
          { value: "none", label: "None of these" },
        ] },
      { id: "alpha_blockers", text: "Do you take alpha-blockers (tamsulosin, doxazosin) for prostate or BP?", type: "radio", options: YN },
      { id: "current_meds", text: "List all medicines you currently take.", type: "textarea", required: true },
    ],
  },
  // ─────────── Premature Ejaculation ────────────────────────────────────
  "premature-ejaculation": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "ssri_now",
        text: "Are you currently taking an SSRI antidepressant (sertraline, fluoxetine, citalopram, paroxetine)?",
        blockingAnswer: "yes",
        blockingMessage: "Dapoxetine cannot be combined with SSRIs. Speak to your GP about alternative options.",
      },
      {
        id: "fainting",
        text: "Have you ever fainted unexpectedly without warning?",
        blockingAnswer: "yes",
        blockingMessage: "Dapoxetine has a syncope risk and is unsuitable. Please see your GP.",
      },
      {
        id: "mania",
        text: "Have you been diagnosed with bipolar disorder or mania?",
        blockingAnswer: "yes",
        blockingMessage: "Dapoxetine is contraindicated in bipolar disorder.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have you had PE symptoms?", type: "radio", required: true,
        options: [
          { value: "lifelong", label: "Lifelong (since first sexual experience)" },
          { value: "acquired", label: "Acquired (developed later in life)" },
        ] },
      { id: "ielt", text: "On average, how long after penetration do you ejaculate?", type: "radio", required: true,
        options: [
          { value: "lt_30s", label: "Less than 30 seconds" },
          { value: "30_60", label: "30–60 seconds" },
          { value: "1_2", label: "1–2 minutes" },
          { value: "2_4", label: "2–4 minutes" },
        ] },
      { id: "preferred_med", text: "Which treatment are you interested in?", type: "radio", required: true,
        options: [
          { value: "priligy_30", label: "Priligy / Dapoxetine 30mg" },
          { value: "priligy_60", label: "Priligy / Dapoxetine 60mg" },
          { value: "emla", label: "EMLA topical anaesthetic cream" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_meds", text: "List any medicines you currently take.", type: "textarea", required: true },
    ],
  },
  // ─────────── Bacterial Vaginosis ──────────────────────────────────────
  "bacterial-vaginosis": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "afab",
        text: "Were you assigned female at birth?",
        blockingAnswer: "no",
        blockingMessage: "BV treatments here are licensed for AFAB anatomy. Please contact our team for tailored advice.",
      },
      {
        id: "fever_pelvic",
        text: "Do you have a fever above 38°C, severe lower abdominal pain or shoulder-tip pain?",
        blockingAnswer: "yes",
        blockingMessage: "These symptoms suggest a more serious infection. Please contact NHS 111 or your GP today.",
      },
    ],
    clinicalQuestions: [
      { id: "discharge", text: "Describe your discharge (colour, odour, amount).", type: "textarea", required: true },
      { id: "fishy_odour", text: "Is there a strong fishy odour, especially after sex?", type: "radio", options: YN, required: true },
      { id: "itch_burning", text: "Do you have itching, burning, or soreness?", type: "radio", options: YN },
      { id: "previous_bv", text: "Have you had BV before? When?", type: "textarea" },
      { id: "previous_treatments", text: "What treatments have you tried?", type: "textarea" },
      { id: "preferred_med", text: "Which treatment do you prefer?", type: "radio", required: true,
        options: [
          { value: "metronidazole_oral", label: "Metronidazole 400mg tablets (5 days)" },
          { value: "metronidazole_gel", label: "Metronidazole 0.75% vaginal gel" },
          { value: "clindamycin_cream", label: "Clindamycin 2% vaginal cream" },
          { value: "lactic_acid", label: "Lactic acid gel (Balance Activ)" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_meds", text: "List any other medicines you take.", type: "textarea" },
      { id: "alcohol_now", text: "Will you be drinking alcohol in the next 5 days? (relevant for metronidazole)", type: "radio", options: YN },
    ],
  },
  // ─────────── Cystitis ────────────────────────────────────────────────
  cystitis: {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "afab",
        text: "Were you assigned female at birth?",
        blockingAnswer: "no",
        blockingMessage: "Online cystitis treatment is for AFAB adults. Please book a GP/sexual health appointment.",
      },
      {
        id: "kidney_signs",
        text: "Do you have flank/loin pain, fever above 38°C, vomiting or rigors?",
        blockingAnswer: "yes",
        blockingMessage: "These symptoms suggest pyelonephritis (kidney infection). Please call NHS 111 or attend urgent care today.",
      },
      {
        id: "pregnancy_now",
        text: "Are you pregnant or could you be pregnant?",
        blockingAnswer: "yes",
        blockingMessage: "Cystitis in pregnancy needs face-to-face GP review for urine culture and tailored antibiotics.",
      },
      {
        id: "recurrent_3plus",
        text: "Have you had 3 or more UTIs in the last 6 months?",
        blockingAnswer: "yes",
        blockingMessage: "Recurrent UTIs need GP investigation. Please book a GP appointment.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have you had symptoms?", type: "radio", required: true,
        options: [
          { value: "lt_48h", label: "Under 48 hours" },
          { value: "2_5d", label: "2–5 days" },
          { value: "gt_5d", label: "Over 5 days" },
        ] },
      { id: "symptoms", text: "Which symptoms do you have?", type: "checkbox_group",
        options: [
          { value: "burning", label: "Burning when passing urine" },
          { value: "frequency", label: "Going more often" },
          { value: "urgency", label: "Sudden urge to go" },
          { value: "cloudy", label: "Cloudy urine" },
          { value: "blood", label: "Blood in urine" },
          { value: "lower_pain", label: "Lower abdominal pain" },
        ] },
      { id: "previous_uti", text: "Have you had a UTI in the last 3 months?", type: "radio", options: YN, required: true },
      { id: "preferred_med", text: "Preferred antibiotic?", type: "radio", required: true,
        options: [
          { value: "nitrofurantoin", label: "Nitrofurantoin 100mg MR (3 days)" },
          { value: "trimethoprim", label: "Trimethoprim 200mg (3 days)" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "allergies", text: "Antibiotic allergies?", type: "textarea" },
    ],
  },
  // ─────────── Emergency Contraception ─────────────────────────────────
  "emergency-contraception": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "over_120h",
        text: "Has it been more than 120 hours (5 days) since the unprotected sex?",
        blockingAnswer: "yes",
        blockingMessage: "Oral emergency contraception is no longer effective after 120h. Please contact a sexual health clinic about a copper IUD.",
      },
    ],
    clinicalQuestions: [
      { id: "hours_since", text: "How many hours have passed since unprotected sex?", type: "radio", required: true,
        options: [
          { value: "lt_24", label: "Under 24 hours" },
          { value: "24_72", label: "24–72 hours" },
          { value: "72_120", label: "72–120 hours" },
        ] },
      { id: "lmp", text: "When did your last period start? (date)", type: "textarea", required: true },
      { id: "regular_cycle", text: "Is your cycle usually regular?", type: "radio", options: YN },
      { id: "weight_kg", text: "What is your current weight in kg?", type: "textarea", required: true },
      { id: "preferred", text: "Preferred medicine?", type: "radio", required: true,
        options: [
          { value: "ellaone", label: "ellaOne (ulipristal acetate) — up to 120h" },
          { value: "levonelle", label: "Levonelle (levonorgestrel) — up to 72h" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_contraception", text: "Are you using any other contraception?", type: "textarea" },
    ],
  },
  // ─────────── Period Delay ────────────────────────────────────────────
  "period-delay": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "vte_personal",
        text: "Have you ever had a blood clot (DVT or pulmonary embolism)?",
        blockingAnswer: "yes",
        blockingMessage: "Norethisterone is unsafe with a personal history of clots.",
      },
      {
        id: "migraine_aura",
        text: "Do you suffer from migraines with aura?",
        blockingAnswer: "yes",
        blockingMessage: "Period delay tablets carry a stroke risk in migraine with aura.",
      },
      NOT_PREG_OR_BF,
    ],
    clinicalQuestions: [
      { id: "next_period", text: "When does your next period start?", type: "textarea", required: true },
      { id: "delay_days", text: "How many days do you wish to delay it?", type: "radio", required: true,
        options: [
          { value: "1_5", label: "1–5 days" },
          { value: "6_10", label: "6–10 days" },
          { value: "11_17", label: "11–17 days (max)" },
        ] },
      { id: "smoker", text: "Do you smoke? If so, how many per day?", type: "textarea" },
      { id: "bmi_known", text: "Roughly what is your BMI? (height & weight if unsure)", type: "textarea" },
      { id: "current_meds", text: "List any medicines you take.", type: "textarea" },
    ],
  },
  // ─────────── Chlamydia ────────────────────────────────────────────────
  chlamydia: {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "test_result",
        text: "Have you had a positive chlamydia test result you can share?",
        blockingAnswer: "no",
        blockingMessage: "We need a positive test result before prescribing. You can get a free NHS test at sh.uk.",
      },
      {
        id: "pelvic_severe",
        text: "Do you have severe pelvic pain or fever above 38°C?",
        blockingAnswer: "yes",
        blockingMessage: "These symptoms may indicate PID. Please attend a sexual health clinic urgently.",
      },
    ],
    clinicalQuestions: [
      { id: "test_date", text: "When was the positive test? (approx date)", type: "textarea", required: true },
      { id: "symptoms", text: "Which symptoms do you have?", type: "checkbox_group",
        options: [
          { value: "discharge", label: "Unusual discharge" },
          { value: "burning", label: "Burning urination" },
          { value: "post_coital_bleeding", label: "Bleeding after sex" },
          { value: "pelvic_discomfort", label: "Pelvic discomfort" },
          { value: "asymptomatic", label: "No symptoms" },
        ] },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "doxycycline", label: "Doxycycline 100mg twice a day for 7 days" },
          { value: "azithromycin", label: "Azithromycin 1g single dose (if doxy not suitable)" },
        ] },
      { id: "partner_notification", text: "Have all sexual partners in the last 6 months been told to test/treat?", type: "radio", options: YN, required: true },
      { id: "allergies", text: "Antibiotic allergies?", type: "textarea" },
      { id: "pregnancy", text: "Could you be pregnant?", type: "radio", options: YN },
    ],
  },
  // ─────────── Genital Herpes ──────────────────────────────────────────
  "genital-herpes": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "first_outbreak_severe",
        text: "Is this your FIRST EVER outbreak with severe pain, urinary retention, or systemic symptoms (fever/headache)?",
        blockingAnswer: "yes",
        blockingMessage: "First severe outbreaks need clinic review. Please attend a sexual health clinic urgently.",
      },
      NOT_PREG_OR_BF,
    ],
    clinicalQuestions: [
      { id: "diagnosed_before", text: "Have you been formally diagnosed with genital herpes before?", type: "radio", options: YN, required: true },
      { id: "treatment_type", text: "What treatment do you need?", type: "radio", required: true,
        options: [
          { value: "episodic", label: "Episodic — short course at outbreak" },
          { value: "suppressive", label: "Suppressive — daily for 6+ outbreaks per year" },
        ] },
      { id: "outbreaks_per_year", text: "How many outbreaks have you had in the last year?", type: "radio",
        options: [
          { value: "0_3", label: "0–3" },
          { value: "4_6", label: "4–6" },
          { value: "7_plus", label: "7 or more" },
        ] },
      { id: "preferred_med", text: "Preferred medicine?", type: "radio", required: true,
        options: [
          { value: "aciclovir_400", label: "Aciclovir 400mg" },
          { value: "valaciclovir", label: "Valaciclovir 500mg" },
          { value: "famciclovir", label: "Famciclovir 250mg" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "kidney_disease", text: "Do you have kidney disease?", type: "radio", options: YN },
    ],
  },
  // ─────────── Genital Warts ───────────────────────────────────────────
  "genital-warts": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "internal",
        text: "Are the warts inside the vagina, anus, or on the cervix?",
        blockingAnswer: "yes",
        blockingMessage: "Internal warts need clinic treatment (cryotherapy/electrocautery). Please book a sexual health appointment.",
      },
      NOT_PREG_OR_BF,
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have the warts been present?", type: "radio", required: true,
        options: [
          { value: "lt_1mo", label: "Under 1 month" },
          { value: "1_6mo", label: "1–6 months" },
          { value: "gt_6mo", label: "Over 6 months" },
        ] },
      { id: "number", text: "How many warts and what size (mm)?", type: "textarea", required: true },
      { id: "location", text: "Where are they located?", type: "checkbox_group",
        options: [
          { value: "penis_shaft", label: "Penis shaft" },
          { value: "glans", label: "Glans / under foreskin" },
          { value: "vulva", label: "Vulva" },
          { value: "perianal", label: "Around anus (external only)" },
          { value: "groin", label: "Groin / pubic area" },
        ] },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "warticon_solution", label: "Warticon solution (podophyllotoxin) — applied with a loop" },
          { value: "warticon_cream", label: "Warticon cream — finger application" },
          { value: "condyline", label: "Condyline solution" },
          { value: "aldara", label: "Aldara cream (imiquimod) — for larger areas" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "previous_treatments", text: "Previous treatments?", type: "textarea" },
    ],
  },
  // ─────────── Arthritis ───────────────────────────────────────────────
  arthritis: {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "red_warm_joint",
        text: "Is the joint hot, red, and severely swollen with you feeling unwell?",
        blockingAnswer: "yes",
        blockingMessage: "This may be septic arthritis. Please attend A&E today.",
      },
      {
        id: "stomach_ulcer",
        text: "Have you had a stomach ulcer or GI bleed in the last year?",
        blockingAnswer: "yes",
        blockingMessage: "Oral NSAIDs are not safe — please see your GP about alternative pain options.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have you had joint pain?", type: "radio", required: true,
        options: [
          { value: "lt_3mo", label: "Under 3 months" },
          { value: "3_12", label: "3–12 months" },
          { value: "gt_1y", label: "Over a year" },
        ] },
      { id: "joints", text: "Which joints are affected?", type: "checkbox_group",
        options: [
          { value: "knee", label: "Knee" },
          { value: "hip", label: "Hip" },
          { value: "hand_finger", label: "Hand / fingers" },
          { value: "shoulder", label: "Shoulder" },
          { value: "back", label: "Back" },
          { value: "foot_ankle", label: "Foot / ankle" },
        ] },
      { id: "diagnosis", text: "Have you been diagnosed with arthritis? Which type?", type: "textarea" },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "voltarol_gel", label: "Voltarol Emulgel (topical diclofenac)" },
          { value: "naproxen_ppi", label: "Naproxen 500mg twice daily + omeprazole 20mg" },
          { value: "ibuprofen_gel", label: "Ibuprofen gel" },
          { value: "capsaicin", label: "Capsaicin cream" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_meds", text: "List medicines (especially blood thinners, BP, diabetes).", type: "textarea", required: true },
    ],
  },
  // ─────────── Migraine ────────────────────────────────────────────────
  migraine: {
    eligibilityQuestions: [
      {
        id: "thunderclap",
        text: "Was the onset sudden — the worst headache of your life within seconds?",
        blockingAnswer: "yes",
        blockingMessage: "Thunderclap headache may be subarachnoid haemorrhage. Call 999 immediately.",
      },
      {
        id: "neuro_signs",
        text: "Do you have weakness, numbness, slurred speech, vision loss or confusion?",
        blockingAnswer: "yes",
        blockingMessage: "These are stroke symptoms. Call 999 immediately.",
      },
      {
        id: "first_migraine",
        text: "Is this your FIRST EVER migraine?",
        blockingAnswer: "yes",
        blockingMessage: "First-ever migraines need GP review before prescription triptans.",
      },
      {
        id: "ihd_stroke",
        text: "Have you had a heart attack, stroke, TIA or angina?",
        blockingAnswer: "yes",
        blockingMessage: "Triptans are contraindicated in cardiovascular disease.",
      },
    ],
    clinicalQuestions: [
      { id: "diagnosis_known", text: "Have you been diagnosed with migraine?", type: "radio", options: YN, required: true },
      { id: "frequency", text: "How many migraine days per month?", type: "radio", required: true,
        options: [
          { value: "lt_4", label: "Under 4" },
          { value: "4_8", label: "4–8" },
          { value: "9_15", label: "9–15" },
          { value: "gt_15", label: "Over 15" },
        ] },
      { id: "aura", text: "Do you experience aura (visual changes, tingling) before the migraine?", type: "radio", options: YN, required: true },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "sumatriptan_50", label: "Sumatriptan 50mg" },
          { value: "sumatriptan_100", label: "Sumatriptan 100mg" },
          { value: "rizatriptan_10", label: "Rizatriptan 10mg" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_meds", text: "List medicines (especially antidepressants).", type: "textarea", required: true },
    ],
  },
  // ─────────── Numbing Cream ───────────────────────────────────────────
  "numbing-cream": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "lidocaine_allergy",
        text: "Are you allergic to lidocaine, prilocaine or other local anaesthetics?",
        blockingAnswer: "yes",
        blockingMessage: "Numbing creams here contain lidocaine — please avoid them.",
      },
      {
        id: "open_wound",
        text: "Do you intend to apply it to broken or open skin or near eyes/mouth?",
        blockingAnswer: "yes",
        blockingMessage: "Topical anaesthetic must only go on intact skin. Please consult a clinician.",
      },
    ],
    clinicalQuestions: [
      { id: "purpose", text: "What is the planned use?", type: "radio", required: true,
        options: [
          { value: "tattoo", label: "Tattoo / piercing" },
          { value: "laser_hair", label: "Laser hair removal" },
          { value: "filler_botox", label: "Cosmetic injections (filler / Botox)" },
          { value: "vaccination", label: "Vaccination / blood test" },
          { value: "minor_skin", label: "Minor skin procedure" },
          { value: "other", label: "Other" },
        ] },
      { id: "area_size", text: "What is the approximate skin area to cover?", type: "radio", required: true,
        options: [
          { value: "lt_palm", label: "Less than a palm" },
          { value: "palm_to_forearm", label: "Palm to forearm" },
          { value: "larger", label: "Larger area" },
        ] },
      { id: "preferred_med", text: "Preferred product?", type: "radio", required: true,
        options: [
          { value: "emla_5g", label: "EMLA 5g cream (lidocaine + prilocaine)" },
          { value: "emla_30g", label: "EMLA 30g tube" },
          { value: "lidocaine_5", label: "Lidocaine 5% cream" },
          { value: "open", label: "Open to recommendation" },
        ] },
    ],
  },
  // ─────────── Hair Loss ───────────────────────────────────────────────
  "hair-loss": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "female",
        text: "Were you assigned female at birth?",
        blockingAnswer: "yes",
        blockingMessage: "Finasteride is unsafe for women of childbearing potential. Topical Regaine (minoxidil) for women is available — please contact our team.",
      },
      {
        id: "prostate_cancer_family",
        text: "Do you have a personal or family history of prostate cancer?",
        blockingAnswer: "yes",
        blockingMessage: "Finasteride alters PSA. Please discuss with your GP/urologist first.",
      },
      {
        id: "sudden_patchy",
        text: "Is the loss sudden, patchy or in clumps?",
        blockingAnswer: "yes",
        blockingMessage: "This pattern may be alopecia areata or another condition needing GP review.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long has the hair thinning been progressing?", type: "radio", required: true,
        options: [
          { value: "lt_6mo", label: "Under 6 months" },
          { value: "6_24", label: "6–24 months" },
          { value: "gt_2y", label: "Over 2 years" },
        ] },
      { id: "pattern", text: "Pattern of loss?", type: "radio", required: true,
        options: [
          { value: "temples", label: "Receding temples" },
          { value: "crown", label: "Crown thinning" },
          { value: "both", label: "Both" },
        ] },
      { id: "previous_treatments", text: "Treatments tried (Regaine, finasteride etc.)?", type: "textarea" },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "finasteride_1", label: "Finasteride 1mg daily tablet" },
          { value: "minoxidil_5", label: "Minoxidil 5% (Regaine) topical" },
          { value: "combo", label: "Both (combination)" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "mood_history", text: "Any history of depression or mood disorders?", type: "textarea" },
    ],
  },
  // ─────────── Nail Infection ──────────────────────────────────────────
  "nail-infection": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "diabetic_foot",
        text: "Do you have diabetes with foot ulcers or numbness?",
        blockingAnswer: "yes",
        blockingMessage: "Diabetic foot infections need urgent GP/podiatry review.",
      },
      {
        id: "matrix",
        text: "Is the lunula (white half-moon at base of nail) affected, or are more than 4 nails involved?",
        blockingAnswer: "yes",
        blockingMessage: "Extensive disease usually needs oral terbinafine which we can arrange via GP.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long has the nail looked abnormal?", type: "radio", required: true,
        options: [
          { value: "lt_6mo", label: "Under 6 months" },
          { value: "6_18", label: "6–18 months" },
          { value: "gt_18", label: "Over 18 months" },
        ] },
      { id: "nails_affected", text: "How many nails are affected?", type: "radio", required: true,
        options: [
          { value: "1", label: "Just one" },
          { value: "2_4", label: "2–4" },
        ] },
      { id: "hand_or_foot", text: "Are these fingernails, toenails, or both?", type: "radio", required: true,
        options: [
          { value: "toe", label: "Toenails" },
          { value: "finger", label: "Fingernails" },
          { value: "both", label: "Both" },
        ] },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "amorolfine", label: "Amorolfine 5% (Curanail) lacquer" },
          { value: "tioconazole", label: "Tioconazole (Trosyl) solution" },
          { value: "open", label: "Open to recommendation" },
        ] },
    ],
  },
  // ─────────── Rosacea ─────────────────────────────────────────────────
  rosacea: {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "ocular_severe",
        text: "Are your eyes severely affected with vision changes?",
        blockingAnswer: "yes",
        blockingMessage: "Ocular rosacea with vision changes needs an eye specialist. Please attend A&E or eye casualty.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have you had rosacea symptoms?", type: "radio", required: true,
        options: [
          { value: "lt_6mo", label: "Under 6 months" },
          { value: "6_24", label: "6–24 months" },
          { value: "gt_2y", label: "Over 2 years" },
        ] },
      { id: "subtype", text: "Which features do you have?", type: "checkbox_group",
        options: [
          { value: "flushing", label: "Flushing & redness" },
          { value: "papules_pustules", label: "Spots and pustules" },
          { value: "telangiectasia", label: "Visible blood vessels" },
          { value: "ocular", label: "Eye irritation / dryness" },
          { value: "rhinophyma", label: "Thickened nose skin" },
        ] },
      { id: "previous_treatments", text: "Treatments tried so far?", type: "textarea" },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "soolantra", label: "Soolantra (ivermectin) cream" },
          { value: "rozex", label: "Rozex (metronidazole) cream/gel" },
          { value: "azelaic_acid", label: "Finacea (azelaic acid) gel" },
          { value: "mirvaso", label: "Mirvaso (brimonidine) gel for redness" },
          { value: "doxy_oral", label: "Oral doxycycline 40mg MR" },
          { value: "open", label: "Open to recommendation" },
        ] },
    ],
  },
  // ─────────── Acid Reflux ─────────────────────────────────────────────
  "acid-reflux": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "alarm_bleed",
        text: "Are you vomiting blood or passing black tarry stools?",
        blockingAnswer: "yes",
        blockingMessage: "These are GI bleed signs. Please call 999 / attend A&E immediately.",
      },
      {
        id: "swallowing",
        text: "Do you have difficulty or pain when swallowing?",
        blockingAnswer: "yes",
        blockingMessage: "Dysphagia needs a 2-week-wait endoscopy referral. Please book a GP appointment now.",
      },
      {
        id: "weight_loss",
        text: "Have you lost weight unintentionally in the last 3 months?",
        blockingAnswer: "yes",
        blockingMessage: "Unexplained weight loss needs urgent GP review for endoscopy.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have you had acid reflux symptoms?", type: "radio", required: true,
        options: [
          { value: "lt_4wk", label: "Under 4 weeks" },
          { value: "1_3mo", label: "1–3 months" },
          { value: "gt_3mo", label: "Over 3 months" },
        ] },
      { id: "symptoms", text: "Which symptoms do you have?", type: "checkbox_group",
        options: [
          { value: "heartburn", label: "Heartburn / burning chest" },
          { value: "regurgitation", label: "Acid regurgitation into mouth" },
          { value: "bloating", label: "Bloating" },
          { value: "cough_at_night", label: "Cough at night / hoarseness" },
        ] },
      { id: "lifestyle", text: "Triggers (foods, alcohol, smoking, weight, late meals)?", type: "textarea" },
      { id: "previous_treatments", text: "Have you tried Gaviscon, ranitidine or PPIs before?", type: "textarea" },
      { id: "preferred_med", text: "Preferred PPI?", type: "radio", required: true,
        options: [
          { value: "omeprazole_20", label: "Omeprazole 20mg" },
          { value: "lansoprazole_30", label: "Lansoprazole 30mg" },
          { value: "esomeprazole_20", label: "Esomeprazole 20mg" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_meds", text: "Current medicines (clopidogrel, methotrexate, warfarin etc.)?", type: "textarea", required: true },
    ],
  },
  // ─────────── IBS ─────────────────────────────────────────────────────
  ibs: {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "rectal_bleed",
        text: "Have you noticed rectal bleeding or blood in your stool?",
        blockingAnswer: "yes",
        blockingMessage: "Rectal bleeding needs GP review — book a 2-week-wait consultation.",
      },
      {
        id: "weight_loss",
        text: "Have you lost weight without trying in the last 3 months?",
        blockingAnswer: "yes",
        blockingMessage: "Unexplained weight loss needs urgent GP investigation.",
      },
      {
        id: "night_diarrhoea",
        text: "Do you have diarrhoea that wakes you from sleep?",
        blockingAnswer: "yes",
        blockingMessage: "Nocturnal diarrhoea suggests inflammatory bowel disease — see your GP.",
      },
    ],
    clinicalQuestions: [
      { id: "subtype", text: "Which IBS pattern?", type: "radio", required: true,
        options: [
          { value: "ibs_d", label: "IBS-D — diarrhoea predominant" },
          { value: "ibs_c", label: "IBS-C — constipation predominant" },
          { value: "ibs_m", label: "IBS-M — mixed" },
        ] },
      { id: "duration", text: "How long have you had these symptoms?", type: "radio", required: true,
        options: [
          { value: "lt_6mo", label: "Under 6 months" },
          { value: "6_24", label: "6–24 months" },
          { value: "gt_2y", label: "Over 2 years" },
        ] },
      { id: "diagnosis", text: "Has a doctor diagnosed IBS before?", type: "radio", options: YN, required: true },
      { id: "diet_fodmap", text: "Have you tried a low-FODMAP diet?", type: "radio", options: YN },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "mebeverine", label: "Mebeverine (Colofac) 135mg TDS" },
          { value: "buscopan", label: "Buscopan (hyoscine) 10mg" },
          { value: "colpermin", label: "Colpermin peppermint oil capsules" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_meds", text: "List current medicines.", type: "textarea" },
    ],
  },
  // ─────────── COVID-19 Tests ──────────────────────────────────────────
  "covid-19-tests": {
    eligibilityQuestions: [
      {
        id: "severe_breathing",
        text: "Do you have severe shortness of breath, chest pain, or blue lips/face?",
        blockingAnswer: "yes",
        blockingMessage: "Call 999 — these are emergency symptoms.",
      },
    ],
    clinicalQuestions: [
      { id: "purpose", text: "What do you need the test for?", type: "radio", required: true,
        options: [
          { value: "symptoms", label: "I have symptoms" },
          { value: "exposure", label: "Possible exposure" },
          { value: "travel", label: "Travel certificate" },
          { value: "work_event", label: "Work or event screening" },
          { value: "peace_of_mind", label: "Peace of mind" },
        ] },
      { id: "kit_type", text: "Which kit?", type: "radio", required: true,
        options: [
          { value: "lft_5", label: "Lateral flow — pack of 5" },
          { value: "lft_25", label: "Lateral flow — bulk pack of 25" },
          { value: "pcr_home", label: "Home PCR test (postal lab)" },
          { value: "pcr_fit_to_fly", label: "Fit-to-fly certified PCR" },
        ] },
      { id: "symptoms_now", text: "Current symptoms?", type: "textarea" },
    ],
  },
  // ─────────── Flu ─────────────────────────────────────────────────────
  flu: {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "over_48h",
        text: "Has it been more than 48 hours since your symptoms started?",
        blockingAnswer: "yes",
        blockingMessage: "Tamiflu is most effective within 48h. We may still be able to help, but please contact our team for tailored advice.",
      },
      {
        id: "severe_signs",
        text: "Do you have severe breathlessness, confusion, or chest pain?",
        blockingAnswer: "yes",
        blockingMessage: "These suggest serious flu complications. Call 111 or 999.",
      },
    ],
    clinicalQuestions: [
      { id: "onset", text: "When did your symptoms start?", type: "textarea", required: true },
      { id: "symptoms", text: "Which symptoms do you have?", type: "checkbox_group",
        options: [
          { value: "fever", label: "Fever / chills" },
          { value: "cough", label: "Cough" },
          { value: "muscle_aches", label: "Muscle aches" },
          { value: "headache", label: "Headache" },
          { value: "fatigue", label: "Severe fatigue" },
          { value: "sore_throat", label: "Sore throat" },
        ] },
      { id: "high_risk", text: "Are you in a clinical risk group (asthma, COPD, heart, diabetes, immunocompromised, pregnant, 65+)?", type: "radio", options: YN, required: true },
      { id: "preferred", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "tamiflu", label: "Oseltamivir (Tamiflu) 75mg twice daily, 5 days" },
          { value: "vaccination", label: "Annual flu vaccination booking" },
        ] },
    ],
  },
  // ─────────── Anti-Malaria ────────────────────────────────────────────
  "anti-malaria": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "kidney",
        text: "Do you have severe kidney disease (eGFR < 30)?",
        blockingAnswer: "yes",
        blockingMessage: "Malarone is contraindicated in severe renal impairment. Please contact our team.",
      },
      NOT_PREG_OR_BF,
    ],
    clinicalQuestions: [
      { id: "destination", text: "Which country/region are you travelling to?", type: "textarea", required: true },
      { id: "departure", text: "Departure date and trip length?", type: "textarea", required: true },
      { id: "previous_malaria", text: "Have you had malaria before?", type: "radio", options: YN },
      { id: "preferred_med", text: "Preferred prophylaxis?", type: "radio", required: true,
        options: [
          { value: "malarone", label: "Malarone (atovaquone/proguanil) — daily" },
          { value: "doxycycline", label: "Doxycycline 100mg — daily" },
          { value: "mefloquine", label: "Lariam (mefloquine) — weekly" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "epilepsy_psych", text: "History of epilepsy, depression, anxiety or other mental-health conditions?", type: "textarea" },
      { id: "vaccinations", text: "Travel vaccinations completed (yellow fever, typhoid, hepatitis A)?", type: "textarea" },
    ],
  },
  // ─────────── Jet Lag ─────────────────────────────────────────────────
  "jet-lag": {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "epilepsy",
        text: "Do you have epilepsy?",
        blockingAnswer: "yes",
        blockingMessage: "Melatonin is unsuitable in epilepsy. Please contact our team.",
      },
      {
        id: "warfarin",
        text: "Are you taking warfarin?",
        blockingAnswer: "yes",
        blockingMessage: "Melatonin can interact with warfarin. Please discuss with your anticoagulation clinic.",
      },
    ],
    clinicalQuestions: [
      { id: "destination", text: "Departure city → destination city?", type: "textarea", required: true },
      { id: "time_zones", text: "How many time zones are you crossing?", type: "radio", required: true,
        options: [
          { value: "lt_5", label: "Under 5 (jet lag treatment usually not needed)" },
          { value: "5_8", label: "5–8 zones" },
          { value: "gt_8", label: "More than 8 zones" },
        ] },
      { id: "direction", text: "Direction of travel?", type: "radio", required: true,
        options: [
          { value: "east", label: "Eastward (worst for jet lag)" },
          { value: "west", label: "Westward" },
        ] },
      { id: "trip_length", text: "How long is the trip?", type: "textarea" },
    ],
  },
  // ─────────── Sleep ──────────────────────────────────────────────────
  sleep: {
    eligibilityQuestions: [
      EMERGENCY,
      {
        id: "alcohol_dep",
        text: "Do you currently drink alcohol heavily or have alcohol dependency?",
        blockingAnswer: "yes",
        blockingMessage: "Sedating sleep aids are not safe with heavy alcohol use. Please see your GP.",
      },
      {
        id: "sleep_apnoea_untreated",
        text: "Do you have untreated sleep apnoea (loud snoring with breathing pauses)?",
        blockingAnswer: "yes",
        blockingMessage: "Sedating tablets are unsafe in untreated sleep apnoea — please see your GP first.",
      },
    ],
    clinicalQuestions: [
      { id: "duration", text: "How long have you had sleep difficulties?", type: "radio", required: true,
        options: [
          { value: "lt_4wk", label: "Under 4 weeks" },
          { value: "1_3mo", label: "1–3 months" },
          { value: "gt_3mo", label: "Over 3 months" },
        ] },
      { id: "type", text: "Which best describes the issue?", type: "radio", required: true,
        options: [
          { value: "fall_asleep", label: "Trouble falling asleep" },
          { value: "stay_asleep", label: "Trouble staying asleep" },
          { value: "early_waking", label: "Waking too early" },
          { value: "shift_work", label: "Shift work / irregular schedule" },
        ] },
      { id: "sleep_hygiene", text: "What sleep-hygiene strategies have you tried?", type: "textarea" },
      { id: "preferred_med", text: "Preferred treatment?", type: "radio", required: true,
        options: [
          { value: "nytol_one_a_night", label: "Nytol One-A-Night (diphenhydramine 50mg)" },
          { value: "phenergan", label: "Phenergan (promethazine 25mg)" },
          { value: "circadin", label: "Circadin (melatonin 2mg PR — ages 55+)" },
          { value: "open", label: "Open to recommendation" },
        ] },
      { id: "current_meds", text: "Other medicines you take.", type: "textarea" },
    ],
  },
};

// Aliases — maps an alias condition id to the canonical questionnaire id.
export const conditionAliases: Record<string, string> = {
  hayfever: "allergic-rhinitis",
  // (acid-reflux already exists separately above; removed dyspepsia alias to avoid two entries)
};

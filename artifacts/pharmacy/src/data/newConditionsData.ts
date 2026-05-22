// DB seed data for new MedExpress / Pharmacy2U-style conditions.
//
// The per-condition questionnaires (and their type definitions + alias map)
// now live in ./conditionQuestions.ts which is the single source of truth.
// This file intentionally retains ONLY the DB seed metadata.

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
  priceGbp: number;
};

export const newConditionDbSeeds: DbConditionSeed[] = [
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
  {
    id: "chlamydia",
    name: "Chlamydia (Doxycycline · Azithromycin)",
    category: "stis",
    description:
      "First-line antibiotic treatment for confirmed chlamydia: doxycycline 100mg BD for 7 days, or azithromycin 1g single dose if doxycycline contraindicated. Includes partner-notification advice.",
    onlineEligible: true,
    requiresPhoto: false,
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

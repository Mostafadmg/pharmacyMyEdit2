// UK formulary — common medications used by independent prescribers (BNF / NICE CKS aligned).
// Used by the pharmacist prescription builder for autocomplete and to suggest sensible
// strength / form / sig defaults. This is a working catalogue, not an exhaustive list.

export type MedicationForm =
  | "tablet"
  | "capsule"
  | "oral solution"
  | "oral suspension"
  | "cream"
  | "ointment"
  | "gel"
  | "lotion"
  | "spray"
  | "drops"
  | "inhaler"
  | "pessary"
  | "injection"
  | "sachet"
  | "patch";

export interface MedicationEntry {
  name: string;             // generic / display name (e.g. "Amoxicillin")
  brand?: string;           // optional brand name to also surface in search
  category: string;         // BNF-ish grouping (e.g. "Antibacterials", "Antihistamines")
  strengths: string[];      // available strengths (free-text, e.g. "500 mg", "5 mg/5 ml")
  forms: MedicationForm[];  // available preparations
  defaultSig: string;       // sample dosage instructions
  defaultDuration?: string; // sample course length
  pomOrP: "POM" | "P" | "GSL"; // legal class
  notes?: string;           // PIP notes — caution, key counselling
}

export const MEDICATIONS: MedicationEntry[] = [
  // ── Antibacterials ─────────────────────────────────────────────
  { name: "Amoxicillin", category: "Antibacterials", strengths: ["250 mg", "500 mg", "125 mg/5 ml", "250 mg/5 ml"], forms: ["capsule", "oral suspension"], defaultSig: "Take ONE capsule THREE times a day", defaultDuration: "5 days", pomOrP: "POM", notes: "Penicillin — confirm no allergy. First-line for otitis media, dental infection." },
  { name: "Phenoxymethylpenicillin", brand: "Penicillin V", category: "Antibacterials", strengths: ["250 mg", "500 mg", "125 mg/5 ml"], forms: ["tablet", "oral solution"], defaultSig: "Take ONE tablet FOUR times a day, at least 30 minutes before food", defaultDuration: "10 days", pomOrP: "POM", notes: "First-line for streptococcal sore throat (FeverPAIN ≥4)." },
  { name: "Clarithromycin", category: "Antibacterials", strengths: ["250 mg", "500 mg", "125 mg/5 ml"], forms: ["tablet", "oral suspension"], defaultSig: "Take ONE tablet TWICE a day", defaultDuration: "5 days", pomOrP: "POM", notes: "Penicillin-allergic alternative. Many drug interactions (statins, warfarin)." },
  { name: "Doxycycline", category: "Antibacterials", strengths: ["100 mg"], forms: ["capsule"], defaultSig: "Take TWO capsules on day 1, then ONE capsule daily", defaultDuration: "7 days", pomOrP: "POM", notes: "Avoid in pregnancy and <12 yrs. Photosensitivity advice." },
  { name: "Nitrofurantoin", category: "Antibacterials", strengths: ["50 mg", "100 mg MR"], forms: ["capsule", "tablet"], defaultSig: "Take ONE tablet/capsule FOUR times a day with food (or ONE MR twice a day)", defaultDuration: "3 days (women) / 7 days (men)", pomOrP: "POM", notes: "First-line lower UTI. Avoid eGFR <45." },
  { name: "Trimethoprim", category: "Antibacterials", strengths: ["100 mg", "200 mg"], forms: ["tablet"], defaultSig: "Take ONE 200 mg tablet TWICE a day", defaultDuration: "3 days", pomOrP: "POM", notes: "Second-line UTI. Avoid in 1st trimester pregnancy." },
  { name: "Cefalexin", category: "Antibacterials", strengths: ["250 mg", "500 mg"], forms: ["capsule", "oral suspension"], defaultSig: "Take ONE capsule FOUR times a day", defaultDuration: "7 days", pomOrP: "POM", notes: "Pyelonephritis option. Cross-reactivity with penicillin <10%." },
  { name: "Flucloxacillin", category: "Antibacterials", strengths: ["250 mg", "500 mg", "125 mg/5 ml"], forms: ["capsule", "oral solution"], defaultSig: "Take ONE capsule FOUR times a day, at least 30 minutes before food", defaultDuration: "5–7 days", pomOrP: "POM", notes: "First-line cellulitis / impetigo. Penicillin." },
  { name: "Erythromycin", category: "Antibacterials", strengths: ["250 mg", "500 mg"], forms: ["tablet", "oral suspension"], defaultSig: "Take ONE tablet FOUR times a day", defaultDuration: "5 days", pomOrP: "POM", notes: "Macrolide alternative in pregnancy." },
  { name: "Metronidazole", category: "Antibacterials", strengths: ["200 mg", "400 mg", "500 mg"], forms: ["tablet"], defaultSig: "Take ONE 400 mg tablet THREE times a day", defaultDuration: "5–7 days", pomOrP: "POM", notes: "Avoid alcohol. BV / dental abscess." },
  { name: "Azithromycin", category: "Antibacterials", strengths: ["250 mg", "500 mg"], forms: ["tablet"], defaultSig: "Take ONE 1 g dose as a single dose", defaultDuration: "1 day", pomOrP: "POM", notes: "Chlamydia treatment — 1 g stat. QT prolongation caution." },
  { name: "Fusidic acid", brand: "Fucidin", category: "Antibacterials (topical)", strengths: ["2%"], forms: ["cream", "ointment"], defaultSig: "Apply a thin layer to the affected area THREE times a day", defaultDuration: "5–7 days", pomOrP: "POM", notes: "Localised impetigo (small lesions)." },
  { name: "Mupirocin", brand: "Bactroban", category: "Antibacterials (topical)", strengths: ["2%"], forms: ["ointment", "cream"], defaultSig: "Apply to lesions THREE times a day", defaultDuration: "5 days", pomOrP: "POM", notes: "Localised impetigo / nasal MRSA decolonisation." },
  { name: "Chloramphenicol", category: "Antibacterials (ophthalmic)", strengths: ["0.5%", "1%"], forms: ["drops", "ointment"], defaultSig: "Apply ONE drop to the affected eye every 2 hours for 48 h, then 4 times a day", defaultDuration: "5 days", pomOrP: "P", notes: "Bacterial conjunctivitis. OTC P-medicine (over 2 yrs)." },

  // ── Antihistamines / allergy ──────────────────────────────────
  { name: "Cetirizine", category: "Antihistamines", strengths: ["10 mg", "5 mg/5 ml"], forms: ["tablet", "oral solution"], defaultSig: "Take ONE tablet ONCE daily", defaultDuration: "as required", pomOrP: "P", notes: "Non-sedating. First-line allergic rhinitis." },
  { name: "Loratadine", category: "Antihistamines", strengths: ["10 mg", "5 mg/5 ml"], forms: ["tablet", "oral solution"], defaultSig: "Take ONE tablet ONCE daily", defaultDuration: "as required", pomOrP: "P", notes: "Non-sedating. Suitable in pregnancy (preferred = loratadine/cetirizine)." },
  { name: "Fexofenadine", category: "Antihistamines", strengths: ["120 mg", "180 mg"], forms: ["tablet"], defaultSig: "Take ONE 120 mg tablet ONCE daily (180 mg for chronic urticaria)", defaultDuration: "as required", pomOrP: "POM", notes: "Up-titrate to 4× licensed dose for chronic urticaria (off-label per BSACI)." },
  { name: "Chlorphenamine", brand: "Piriton", category: "Antihistamines", strengths: ["4 mg", "2 mg/5 ml"], forms: ["tablet", "oral solution"], defaultSig: "Take ONE tablet every 4–6 hours when needed (max 6 in 24 h)", defaultDuration: "short-term", pomOrP: "P", notes: "Sedating. Useful for acute allergic reactions." },
  { name: "Beclometasone nasal", brand: "Beconase", category: "Nasal corticosteroid", strengths: ["50 mcg/spray"], forms: ["spray"], defaultSig: "TWO sprays into each nostril TWICE daily", defaultDuration: "ongoing", pomOrP: "P", notes: "Allergic rhinitis — first-line if antihistamine inadequate." },
  { name: "Mometasone nasal", brand: "Nasonex", category: "Nasal corticosteroid", strengths: ["50 mcg/spray"], forms: ["spray"], defaultSig: "TWO sprays into each nostril ONCE daily", defaultDuration: "ongoing", pomOrP: "POM", notes: "More potent INS for moderate-severe rhinitis." },

  // ── Skin / dermatology ─────────────────────────────────────────
  { name: "Hydrocortisone 1%", category: "Topical corticosteroid (mild)", strengths: ["1%"], forms: ["cream", "ointment"], defaultSig: "Apply a thin layer to the affected area ONCE or TWICE daily", defaultDuration: "7 days", pomOrP: "P", notes: "Mild eczema. Avoid face >7 days." },
  { name: "Clobetasone butyrate", brand: "Eumovate", category: "Topical corticosteroid (moderate)", strengths: ["0.05%"], forms: ["cream", "ointment"], defaultSig: "Apply a thin layer to the affected area ONCE or TWICE daily", defaultDuration: "7–14 days", pomOrP: "POM", notes: "Moderate eczema. Avoid face long-term." },
  { name: "Betamethasone valerate", brand: "Betnovate", category: "Topical corticosteroid (potent)", strengths: ["0.025%", "0.1%"], forms: ["cream", "ointment", "lotion"], defaultSig: "Apply a thin layer to the affected area ONCE or TWICE daily", defaultDuration: "up to 4 weeks", pomOrP: "POM", notes: "Potent — body only, not face/flexures." },
  { name: "Aciclovir cream", category: "Antivirals (topical)", strengths: ["5%"], forms: ["cream"], defaultSig: "Apply to the affected area FIVE times a day at the first sign of recurrence", defaultDuration: "5 days", pomOrP: "P", notes: "Cold sores." },
  { name: "Aciclovir oral", category: "Antivirals (oral)", strengths: ["200 mg", "400 mg", "800 mg"], forms: ["tablet"], defaultSig: "Take ONE 800 mg tablet FIVE times a day", defaultDuration: "7 days", pomOrP: "POM", notes: "Shingles — within 72 h of rash onset; immunocompromised always treat." },
  { name: "Clotrimazole 1%", brand: "Canesten", category: "Antifungals (topical)", strengths: ["1%"], forms: ["cream"], defaultSig: "Apply to the affected area TWO to THREE times a day", defaultDuration: "until 14 days after symptoms resolve", pomOrP: "GSL", notes: "Tinea, candida intertrigo." },
  { name: "Miconazole oral gel", brand: "Daktarin", category: "Antifungals (oral)", strengths: ["20 mg/g"], forms: ["gel"], defaultSig: "Apply 2.5 ml of gel to the affected area FOUR times a day after meals", defaultDuration: "until 7 days after symptoms resolve", pomOrP: "P", notes: "Oral thrush. Interaction with warfarin / statins." },
  { name: "Nystatin oral suspension", category: "Antifungals (oral)", strengths: ["100,000 units/ml"], forms: ["oral suspension"], defaultSig: "1 ml swilled around the mouth FOUR times a day after food", defaultDuration: "7 days", pomOrP: "POM", notes: "Oral thrush — alternative to miconazole, no interactions." },
  { name: "Permethrin 5%", brand: "Lyclear", category: "Antiparasitics", strengths: ["5%"], forms: ["cream"], defaultSig: "Apply to whole body from neck down, leave on for 8–12 h then wash off. Repeat after 7 days.", defaultDuration: "2 applications", pomOrP: "P", notes: "Scabies. Treat all close contacts simultaneously." },
  { name: "Adapalene 0.1%", brand: "Differin", category: "Acne (topical)", strengths: ["0.1%"], forms: ["cream", "gel"], defaultSig: "Apply a thin layer to the affected area ONCE daily at night", defaultDuration: "minimum 12 weeks", pomOrP: "POM", notes: "Topical retinoid. Photosensitivity. Avoid pregnancy." },
  { name: "Benzoyl peroxide", brand: "Acnecide", category: "Acne (topical)", strengths: ["2.5%", "5%"], forms: ["gel"], defaultSig: "Apply a thin layer to the affected area ONCE or TWICE daily", defaultDuration: "12 weeks", pomOrP: "P", notes: "First-line mild–moderate acne. Bleaches fabrics." },
  { name: "Lymecycline", category: "Acne (oral antibiotic)", strengths: ["408 mg"], forms: ["capsule"], defaultSig: "Take ONE capsule ONCE daily", defaultDuration: "8–12 weeks (review)", pomOrP: "POM", notes: "Moderate inflammatory acne. Always combine with topical retinoid/BPO." },

  // ── Pain / fever ───────────────────────────────────────────────
  { name: "Paracetamol", category: "Analgesics", strengths: ["500 mg", "120 mg/5 ml", "250 mg/5 ml"], forms: ["tablet", "oral suspension"], defaultSig: "Take TWO 500 mg tablets up to FOUR times a day (max 4 g in 24 h)", defaultDuration: "as required", pomOrP: "GSL", notes: "First-line analgesic / antipyretic." },
  { name: "Ibuprofen", category: "NSAIDs", strengths: ["200 mg", "400 mg", "100 mg/5 ml"], forms: ["tablet", "oral suspension", "gel"], defaultSig: "Take ONE 400 mg tablet THREE times a day with food", defaultDuration: "as required, lowest effective dose", pomOrP: "P", notes: "Avoid in PUD, severe asthma, 3rd-trim pregnancy, severe renal impairment." },
  { name: "Naproxen", category: "NSAIDs", strengths: ["250 mg", "500 mg"], forms: ["tablet"], defaultSig: "Take ONE 500 mg tablet TWICE a day with food", defaultDuration: "as required", pomOrP: "POM", notes: "Acute gout: 750 mg stat then 250 mg TDS." },
  { name: "Codeine phosphate", category: "Opioid analgesics", strengths: ["15 mg", "30 mg"], forms: ["tablet"], defaultSig: "Take ONE or TWO tablets every 4–6 hours when needed (max 240 mg/day)", defaultDuration: "≤3 days", pomOrP: "POM", notes: "Short course only. Constipation, dependence risk." },

  // ── GI ─────────────────────────────────────────────────────────
  { name: "Omeprazole", category: "PPI", strengths: ["10 mg", "20 mg", "40 mg"], forms: ["capsule"], defaultSig: "Take ONE 20 mg capsule ONCE daily before food", defaultDuration: "4 weeks", pomOrP: "P", notes: "GORD / dyspepsia. Review for long-term need." },
  { name: "Lansoprazole", category: "PPI", strengths: ["15 mg", "30 mg"], forms: ["capsule"], defaultSig: "Take ONE 30 mg capsule ONCE daily before food", defaultDuration: "4–8 weeks", pomOrP: "POM" },
  { name: "Esomeprazole", category: "PPI", strengths: ["20 mg", "40 mg"], forms: ["tablet"], defaultSig: "Take ONE 20 mg tablet ONCE daily", defaultDuration: "4 weeks", pomOrP: "POM" },
  { name: "Ranitidine alternative — Famotidine", brand: "Famotidine", category: "H2 antagonist", strengths: ["20 mg", "40 mg"], forms: ["tablet"], defaultSig: "Take ONE 20 mg tablet TWICE daily", defaultDuration: "4 weeks", pomOrP: "P" },
  { name: "Loperamide", brand: "Imodium", category: "Antimotility", strengths: ["2 mg"], forms: ["capsule", "tablet"], defaultSig: "Take TWO capsules initially, then ONE after each loose stool (max 8/day)", defaultDuration: "≤48 h", pomOrP: "P", notes: "Avoid in bloody diarrhoea or fever (?C.diff)." },
  { name: "Macrogol 3350", brand: "Movicol", category: "Laxative (osmotic)", strengths: ["13.7 g/sachet"], forms: ["sachet"], defaultSig: "Dissolve ONE sachet in 125 ml water — take 1–3 sachets daily", defaultDuration: "until regular soft stools", pomOrP: "P" },
  { name: "Senna", category: "Laxative (stimulant)", strengths: ["7.5 mg"], forms: ["tablet"], defaultSig: "Take TWO tablets at bedtime", defaultDuration: "as required, short courses", pomOrP: "P" },
  { name: "Hyoscine butylbromide", brand: "Buscopan", category: "Antispasmodic", strengths: ["10 mg"], forms: ["tablet"], defaultSig: "Take ONE or TWO tablets up to FOUR times a day", defaultDuration: "as required", pomOrP: "P" },

  // ── Eye / ENT ─────────────────────────────────────────────────
  { name: "Sodium cromoglicate eye drops", category: "Allergic conjunctivitis", strengths: ["2%"], forms: ["drops"], defaultSig: "Apply ONE drop to each eye FOUR times a day", defaultDuration: "throughout pollen season", pomOrP: "P" },
  { name: "Olopatadine eye drops", category: "Allergic conjunctivitis", strengths: ["1 mg/ml"], forms: ["drops"], defaultSig: "Apply ONE drop to each eye TWICE daily", defaultDuration: "as required", pomOrP: "POM" },
  { name: "Otomize ear spray", brand: "Otomize", category: "Otitis externa", strengths: ["dexamethasone 0.1% + neomycin + acetic acid"], forms: ["spray"], defaultSig: "ONE metered spray into the affected ear THREE times a day", defaultDuration: "7–14 days", pomOrP: "POM", notes: "First-line otitis externa with mild/moderate inflammation." },
  { name: "Ibuprofen + paracetamol regimen", category: "Sore throat / viral URTI", strengths: ["combination"], forms: ["tablet"], defaultSig: "Alternate paracetamol 1 g QDS and ibuprofen 400 mg TDS", defaultDuration: "as required", pomOrP: "P", notes: "FeverPAIN 0–1: self-care only." },

  // ── Migraine ───────────────────────────────────────────────────
  { name: "Sumatriptan", category: "Triptan", strengths: ["50 mg", "100 mg"], forms: ["tablet"], defaultSig: "Take ONE 50 mg tablet at onset of migraine; may repeat once after 2 h (max 300 mg/day)", defaultDuration: "as required", pomOrP: "POM", notes: "Avoid in IHD, uncontrolled HTN, hemiplegic migraine." },

  // ── Gout ───────────────────────────────────────────────────────
  { name: "Colchicine", category: "Gout (acute)", strengths: ["500 mcg"], forms: ["tablet"], defaultSig: "Take ONE tablet up to FOUR times a day", defaultDuration: "until symptoms relieved or max 6 mg / course", pomOrP: "POM", notes: "Use if NSAID contraindicated. Stop if diarrhoea." },
  { name: "Allopurinol", category: "Gout (urate-lowering)", strengths: ["100 mg", "300 mg"], forms: ["tablet"], defaultSig: "Take ONE 100 mg tablet ONCE daily, titrate every 4 wks to target urate <360 µmol/L", defaultDuration: "long-term", pomOrP: "POM", notes: "Start 2–4 wks after acute attack settles. Cover with NSAID/colchicine." },

  // ── Contraception (UKMEC 1/2) ──────────────────────────────────
  { name: "Levonorgestrel 1.5 mg", brand: "Levonelle", category: "Emergency contraception", strengths: ["1.5 mg"], forms: ["tablet"], defaultSig: "Take ONE tablet as a single dose ASAP, within 72 h of UPSI", defaultDuration: "single dose", pomOrP: "P", notes: "EHC — earlier the better; double dose if BMI >26 or weight >70 kg." },
  { name: "Ulipristal acetate 30 mg", brand: "ellaOne", category: "Emergency contraception", strengths: ["30 mg"], forms: ["tablet"], defaultSig: "Take ONE tablet as a single dose ASAP, within 120 h of UPSI", defaultDuration: "single dose", pomOrP: "P", notes: "Preferred EHC; do not use with progestogen 7 days before/5 days after." },
  { name: "Desogestrel 75 mcg", brand: "Cerazette", category: "POP", strengths: ["75 mcg"], forms: ["tablet"], defaultSig: "Take ONE tablet at the same time each day, continuous", defaultDuration: "ongoing — review 3 months then yearly", pomOrP: "POM", notes: "12-h late window. UKMEC 1 in most." },
  { name: "Combined OC (Rigevidon)", brand: "Rigevidon", category: "COC", strengths: ["ethinylestradiol 30 mcg + levonorgestrel 150 mcg"], forms: ["tablet"], defaultSig: "Take ONE tablet daily for 21 days, then 7-day pill-free interval", defaultDuration: "ongoing — review 3 months then yearly", pomOrP: "POM", notes: "Check UKMEC; BP, BMI, migraine with aura excludes." },

  // ── Respiratory ────────────────────────────────────────────────
  { name: "Salbutamol", brand: "Ventolin", category: "Bronchodilator (SABA)", strengths: ["100 mcg/actuation"], forms: ["inhaler"], defaultSig: "Inhale ONE or TWO puffs as required for breathlessness or wheeze (max 8 puffs/day)", defaultDuration: "as required", pomOrP: "POM", notes: "SABA reliever — always prescribe spacer for metered-dose inhaler. Advise on technique." },
  { name: "Beclometasone dipropionate inhaled", brand: "Clenil Modulite", category: "ICS (inhaled corticosteroid)", strengths: ["50 mcg/actuation", "100 mcg/actuation", "200 mcg/actuation"], forms: ["inhaler"], defaultSig: "Inhale TWO puffs TWICE daily. Rinse mouth after use.", defaultDuration: "long-term — review 3 monthly", pomOrP: "POM", notes: "Preventer. Non-interchangeable with other ICS — specify brand." },
  { name: "Montelukast", brand: "Singulair", category: "Leukotriene receptor antagonist", strengths: ["4 mg", "5 mg", "10 mg"], forms: ["tablet"], defaultSig: "Take ONE 10 mg tablet at bedtime", defaultDuration: "ongoing", pomOrP: "POM", notes: "Add-on for asthma or allergic rhinitis. Neuropsychiatric ADR warning — counsel patient." },
  { name: "Prednisolone", category: "Systemic corticosteroid", strengths: ["5 mg", "25 mg"], forms: ["tablet"], defaultSig: "Take as directed — typically 30–40 mg ONCE daily in the morning", defaultDuration: "5–7 days (acute exacerbation)", pomOrP: "POM", notes: "Short courses do not require tapering (<3 wks). Blood glucose in diabetics." },

  // ── Antifungals (systemic) ─────────────────────────────────────
  { name: "Fluconazole", brand: "Diflucan", category: "Antifungals (oral)", strengths: ["50 mg", "150 mg", "200 mg"], forms: ["capsule"], defaultSig: "Take ONE 150 mg capsule as a single dose", defaultDuration: "single dose (vaginal candidiasis)", pomOrP: "P", notes: "150 mg single-dose OTC for vaginal thrush. Avoid with warfarin / statins." },
  { name: "Terbinafine", brand: "Lamisil", category: "Antifungals (oral)", strengths: ["250 mg"], forms: ["tablet"], defaultSig: "Take ONE 250 mg tablet ONCE daily", defaultDuration: "6 weeks (fingernail) / 12 weeks (toenail)", pomOrP: "POM", notes: "LFTs at baseline. Tinea unguium." },

  // ── Cardiovascular / metabolic ─────────────────────────────────
  { name: "Metformin", category: "Biguanide (antidiabetic)", strengths: ["500 mg", "850 mg", "1 g"], forms: ["tablet"], defaultSig: "Take ONE 500 mg tablet TWICE daily with meals initially, titrate", defaultDuration: "long-term", pomOrP: "POM", notes: "eGFR ≥30 required. Stop if contrast / surgery. GI SEs improve with dose titration." },
  { name: "Atorvastatin", category: "Statin", strengths: ["10 mg", "20 mg", "40 mg", "80 mg"], forms: ["tablet"], defaultSig: "Take ONE 20 mg tablet ONCE daily in the evening", defaultDuration: "long-term", pomOrP: "POM", notes: "CV risk reduction. Check LFTs at baseline. Myopathy — counsel." },
  { name: "Amlodipine", category: "Calcium channel blocker", strengths: ["5 mg", "10 mg"], forms: ["tablet"], defaultSig: "Take ONE 5 mg tablet ONCE daily", defaultDuration: "long-term — review annually", pomOrP: "POM", notes: "Hypertension / stable angina. Ankle oedema common." },
  { name: "Lisinopril", category: "ACE inhibitor", strengths: ["2.5 mg", "5 mg", "10 mg", "20 mg"], forms: ["tablet"], defaultSig: "Take ONE 5 mg tablet ONCE daily (hypertension starting dose)", defaultDuration: "long-term", pomOrP: "POM", notes: "Monitor K+ and creatinine. Dry cough — switch to ARB. Avoid in pregnancy." },
  { name: "Bisoprolol", category: "Beta-blocker", strengths: ["1.25 mg", "2.5 mg", "5 mg", "10 mg"], forms: ["tablet"], defaultSig: "Take ONE 2.5 mg tablet ONCE daily initially, titrate", defaultDuration: "long-term", pomOrP: "POM", notes: "Do not stop abruptly. Contraindicated in uncontrolled HF, significant bradycardia." },

  // ── Mental health / neurology ─────────────────────────────────
  { name: "Sertraline", category: "SSRI antidepressant", strengths: ["50 mg", "100 mg"], forms: ["tablet"], defaultSig: "Take ONE 50 mg tablet ONCE daily in the morning", defaultDuration: "minimum 6 months after remission", pomOrP: "POM", notes: "Start low. Nausea first 2 weeks. Safety-net for suicidality at initiation." },
  { name: "Fluoxetine", category: "SSRI antidepressant", strengths: ["20 mg", "60 mg"], forms: ["capsule"], defaultSig: "Take ONE 20 mg capsule ONCE daily in the morning", defaultDuration: "minimum 6 months after remission", pomOrP: "POM", notes: "Long half-life — fewer discontinuation symptoms. Drug interactions via CYP2D6." },
  { name: "Citalopram", category: "SSRI antidepressant", strengths: ["10 mg", "20 mg", "40 mg"], forms: ["tablet"], defaultSig: "Take ONE 20 mg tablet ONCE daily", defaultDuration: "minimum 6 months", pomOrP: "POM", notes: "Max 20 mg if >65 yrs or hepatic impairment. QT prolongation." },
  { name: "Propranolol", category: "Beta-blocker (anxiety/tremor)", strengths: ["10 mg", "40 mg", "80 mg"], forms: ["tablet"], defaultSig: "Take ONE 40 mg tablet TWO or THREE times a day", defaultDuration: "as required / regular — review 3 monthly", pomOrP: "POM", notes: "Performance/situational anxiety (10–40 mg PRN). Avoid in asthma." },
  { name: "Zopiclone", category: "Non-benzodiazepine hypnotic", strengths: ["3.75 mg", "7.5 mg"], forms: ["tablet"], defaultSig: "Take ONE 7.5 mg tablet (3.75 mg if elderly) at bedtime when needed", defaultDuration: "≤4 weeks only", pomOrP: "POM", notes: "Short-term insomnia only. Dependence, metallic taste. Avoid regular use." },
  { name: "Melatonin", brand: "Circadin", category: "Sleep (chronobiotic)", strengths: ["2 mg MR"], forms: ["tablet"], defaultSig: "Take ONE 2 mg tablet 1–2 hours before bedtime", defaultDuration: "up to 13 weeks", pomOrP: "POM", notes: "First-line for insomnia in ≥55 yrs. Avoid driving 8 h after." },
  { name: "Prochlorperazine", brand: "Stemetil", category: "Antiemetic / vestibular", strengths: ["3 mg", "5 mg"], forms: ["tablet"], defaultSig: "Dissolve ONE 3 mg buccal tablet in the cheek TWICE daily", defaultDuration: "as required", pomOrP: "P", notes: "Buccal tablets for acute labyrinthitis / vertigo. Avoid in Parkinson's." },

  // ── Urology / men's health ─────────────────────────────────────
  { name: "Tamsulosin", brand: "Flomax", category: "Alpha-blocker (LUTS)", strengths: ["400 mcg MR"], forms: ["capsule"], defaultSig: "Take ONE capsule ONCE daily after the same meal each day", defaultDuration: "ongoing — review 3 monthly", pomOrP: "POM", notes: "LUTS/BPH. Postural hypotension — counsel, esp. cataract surgery (IFIS)." },
  { name: "Sildenafil", brand: "Viagra", category: "PDE5 inhibitor (ED)", strengths: ["25 mg", "50 mg", "100 mg"], forms: ["tablet"], defaultSig: "Take ONE 50 mg tablet about 1 hour before sexual activity", defaultDuration: "as required (max once daily)", pomOrP: "P", notes: "Absolute contraindication with nitrates. Assess CV risk. BP check." },
  { name: "Tadalafil", brand: "Cialis", category: "PDE5 inhibitor (ED)", strengths: ["2.5 mg", "5 mg", "10 mg", "20 mg"], forms: ["tablet"], defaultSig: "Take ONE 10 mg tablet before sexual activity OR 5 mg daily for ongoing use", defaultDuration: "as required / ongoing", pomOrP: "POM", notes: "36-h window. Daily 5 mg for BPH+ED. Check nitrate use." },
  { name: "Finasteride", brand: "Propecia", category: "5-alpha reductase inhibitor", strengths: ["1 mg", "5 mg"], forms: ["tablet"], defaultSig: "Take ONE 1 mg tablet ONCE daily (AGA) or 5 mg for BPH", defaultDuration: "long-term — evaluate at 6 months", pomOrP: "POM", notes: "3–6 months for effect. Teratogenic — women must not handle crushed tablets." },

  // ── Weight management ──────────────────────────────────────────
  { name: "Orlistat", brand: "Xenical", category: "Lipase inhibitor (weight management)", strengths: ["60 mg", "120 mg"], forms: ["capsule"], defaultSig: "Take ONE 120 mg capsule with each main meal (up to THREE daily)", defaultDuration: "ongoing — review 3 monthly", pomOrP: "P", notes: "Fatty/oily stools — low-fat diet essential. Fat-soluble vitamin supplementation." },

  // ── HRT / menopause ───────────────────────────────────────────
  { name: "Estradiol gel", brand: "Oestrogel", category: "HRT (transdermal oestrogen)", strengths: ["0.06% gel (1 mg/pump)"], forms: ["gel"], defaultSig: "Apply ONE pump-press of gel to one arm or thigh ONCE daily (adjust dose)", defaultDuration: "ongoing — annual review", pomOrP: "POM", notes: "Post-menopausal HRT. Pair with progesterone if intact uterus. VTE / breast Ca risk discussion." },
  { name: "Utrogestan 100 mg", brand: "Utrogestan", category: "HRT (progestogen)", strengths: ["100 mg"], forms: ["capsule"], defaultSig: "Take TWO 100 mg capsules at bedtime for 14 days of 28 (sequential) or ONE daily (continuous)", defaultDuration: "ongoing — annual review", pomOrP: "POM", notes: "Micronised progesterone. Associated with lower VTE / breast Ca risk than synthetic progestogens." },
];

export function searchMedications(query: string, limit = 8): MedicationEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MEDICATIONS.filter(m =>
    m.name.toLowerCase().includes(q) ||
    (m.brand?.toLowerCase().includes(q) ?? false) ||
    m.category.toLowerCase().includes(q)
  ).slice(0, limit);
}

export interface PrescriptionItemDraft {
  name: string;
  strength: string;
  form: string;
  quantity: string;
  sig: string;
  duration: string;
  notes?: string;
}

export function formatPrescriptionItem(item: PrescriptionItemDraft): string {
  const parts: string[] = [];
  parts.push(`${item.name}${item.strength ? ` ${item.strength}` : ""}${item.form ? ` ${item.form}` : ""}`);
  if (item.quantity) parts.push(`Quantity: ${item.quantity}`);
  if (item.sig) parts.push(`Sig: ${item.sig}`);
  if (item.duration) parts.push(`Duration: ${item.duration}`);
  if (item.notes) parts.push(`Note: ${item.notes}`);
  return parts.join(" · ");
}

export function formatPrescriptionItems(items: PrescriptionItemDraft[]): string {
  return items.map((it, i) => `${i + 1}. ${formatPrescriptionItem(it)}`).join("\n");
}

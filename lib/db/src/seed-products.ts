import { db } from "./index";
import { productsTable } from "./schema/products";
import { sql } from "drizzle-orm";

type SeedProduct = {
  slug: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  classification: "GSL" | "P" | "POM";
  shortDescription: string;
  longDescription: string;
  ingredients?: string;
  directions?: string;
  warnings?: string;
  imageUrl: string;
  packSize?: string;
  priceGbpPence: number;
  rrpGbpPence?: number;
  stock: number;
  requiresConsultation?: boolean;
  tags?: string[];
};

const PRODUCTS: SeedProduct[] = [
  // ── PAIN RELIEF ──────────────────────────────────────────
  { slug: "paracetamol-500mg-16", name: "Paracetamol 500mg Tablets", brand: "PharmaCare", category: "pain-relief", subcategory: "headache",
    classification: "GSL", shortDescription: "Effective relief from headache, toothache, period pain and fever.",
    longDescription: "Paracetamol 500mg tablets provide fast, effective relief from a wide range of pains including headache, migraine, toothache, period pain, sore throat and aches & pains, as well as reducing fever. Suitable for adults and children over 12.",
    ingredients: "Active: Paracetamol 500mg per tablet.", directions: "Adults & children over 12: 1-2 tablets every 4-6 hours as required. Maximum 8 tablets in 24 hours.",
    warnings: "Do not exceed the stated dose. Keep out of sight and reach of children. If symptoms persist, consult your doctor.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80", packSize: "16 tablets", priceGbpPence: 99, rrpGbpPence: 150, stock: 250, tags: ["headache", "fever", "everyday"] },

  { slug: "ibuprofen-200mg-16", name: "Ibuprofen 200mg Tablets", brand: "PharmaCare", category: "pain-relief", subcategory: "anti-inflammatory",
    classification: "GSL", shortDescription: "Anti-inflammatory pain relief for muscle aches, joint pain and headaches.",
    longDescription: "Ibuprofen 200mg tablets target pain at the source, reducing inflammation as well as relieving pain. Ideal for muscular aches, backache, period pain, headache, dental pain and the symptoms of cold and flu.",
    ingredients: "Active: Ibuprofen 200mg per tablet.", directions: "Adults & children over 12: 1-2 tablets up to 3 times daily, with food.",
    warnings: "Take with food. Do not use if pregnant. Consult doctor if asthma, kidney or stomach problems.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80", packSize: "16 tablets", priceGbpPence: 129, rrpGbpPence: 199, stock: 240, tags: ["pain", "inflammation"] },

  { slug: "nurofen-express-200mg-16", name: "Nurofen Express 200mg Liquid Capsules", brand: "Nurofen", category: "pain-relief", subcategory: "anti-inflammatory",
    classification: "GSL", shortDescription: "Fast-acting liquid capsules for rapid pain relief.",
    longDescription: "Nurofen Express liquid capsules use a unique formulation that gets to work faster than standard ibuprofen tablets, providing relief from headaches, muscular pain and period pain.",
    directions: "Adults & children over 12: 1-2 capsules up to 3 times daily, with water.",
    warnings: "Take with food. Not suitable for children under 12.",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80", packSize: "16 capsules", priceGbpPence: 449, rrpGbpPence: 599, stock: 120, tags: ["fast-acting"] },

  { slug: "aspirin-300mg-32", name: "Aspirin 300mg Tablets", brand: "PharmaCare", category: "pain-relief", subcategory: "headache",
    classification: "GSL", shortDescription: "Trusted pain relief for headaches and period pain.",
    longDescription: "Aspirin 300mg tablets provide effective relief from mild to moderate pain including headache, toothache, period pain and symptoms of cold and flu.",
    directions: "Adults: 1-3 tablets every 4 hours. Maximum 13 tablets in 24 hours.",
    warnings: "Do not give to children under 16. Take after food.",
    imageUrl: "https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=600&q=80", packSize: "32 tablets", priceGbpPence: 199, rrpGbpPence: 249, stock: 180 },

  { slug: "voltarol-12hr-emulgel", name: "Voltarol 12 Hour Emulgel", brand: "Voltarol", category: "pain-relief", subcategory: "topical",
    classification: "P", shortDescription: "Targeted joint and back pain relief gel — twice daily application.",
    longDescription: "Voltarol 12 Hour Emulgel contains diclofenac diethylammonium 2.32% w/w. Provides up to 12 hours of localised pain relief from back pain, joint pain and muscular aches.",
    directions: "Apply 2-4g twice daily to the affected area. Wash hands after use.",
    warnings: "Pharmacy medicine. Avoid contact with eyes and broken skin. Not for under 14s.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80", packSize: "100g", priceGbpPence: 1199, rrpGbpPence: 1499, stock: 95, tags: ["back-pain", "joints"] },

  { slug: "anadin-extra-16", name: "Anadin Extra Tablets", brand: "Anadin", category: "pain-relief", subcategory: "headache",
    classification: "GSL", shortDescription: "Triple-action pain relief with paracetamol, aspirin & caffeine.",
    longDescription: "Anadin Extra combines aspirin, paracetamol and caffeine to deliver fast, effective relief from a range of pains including headaches and migraines.",
    directions: "Adults & children over 16: 1-2 tablets up to 4 times daily.",
    warnings: "Not suitable for under 16s.",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80", packSize: "16 tablets", priceGbpPence: 299, stock: 140 },

  // ── COLD & FLU ──────────────────────────────────────────
  { slug: "lemsip-max-cold-flu-10", name: "Lemsip Max Cold & Flu Lemon Sachets", brand: "Lemsip", category: "cold-flu", subcategory: "hot-drinks",
    classification: "GSL", shortDescription: "Powerful relief from the symptoms of cold and flu.",
    longDescription: "Lemsip Max provides relief from the major symptoms of cold and flu including blocked or runny nose, headache, sore throat, body aches and fever.",
    directions: "Adults & children over 12: 1 sachet every 4 hours, max 4 sachets in 24 hours.",
    warnings: "Contains paracetamol — do not take with other paracetamol products.",
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80", packSize: "10 sachets", priceGbpPence: 549, rrpGbpPence: 699, stock: 200, tags: ["winter", "flu"] },

  { slug: "sudafed-blocked-nose-spray", name: "Sudafed Blocked Nose Spray", brand: "Sudafed", category: "cold-flu", subcategory: "decongestants",
    classification: "P", shortDescription: "Fast-acting nasal spray for blocked sinuses.",
    longDescription: "Sudafed Blocked Nose Spray contains xylometazoline hydrochloride and provides fast and lasting relief from a blocked nose due to colds, allergies or sinusitis.",
    directions: "Adults & children over 12: 1 spray into each nostril, up to 3 times daily.",
    warnings: "Pharmacy medicine. Do not use for more than 7 days.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80", packSize: "15ml", priceGbpPence: 449, stock: 110 },

  { slug: "strepsils-honey-lemon-24", name: "Strepsils Honey & Lemon Lozenges", brand: "Strepsils", category: "cold-flu", subcategory: "sore-throat",
    classification: "GSL", shortDescription: "Soothing antiseptic lozenges for sore throats.",
    longDescription: "Strepsils lozenges contain two antiseptics that help fight the bacteria that can cause a sore throat. Honey & lemon flavour for soothing relief.",
    directions: "Adults & children over 6: dissolve 1 lozenge slowly in the mouth every 2-3 hours.",
    imageUrl: "https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=600&q=80", packSize: "24 lozenges", priceGbpPence: 349, rrpGbpPence: 449, stock: 220 },

  { slug: "vicks-vaporub-100g", name: "Vicks VapoRub", brand: "Vicks", category: "cold-flu", subcategory: "rubs",
    classification: "GSL", shortDescription: "Topical rub for the relief of cough, cold & blocked nose.",
    longDescription: "Vicks VapoRub is a topical chest, back and throat rub for soothing relief of cough, cold and blocked nose symptoms.",
    directions: "Adults & children over 2: rub generously on chest, throat or back.",
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80", packSize: "100g", priceGbpPence: 599, stock: 90 },

  { slug: "covonia-bronchial-150ml", name: "Covonia Bronchial Balsam", brand: "Covonia", category: "cold-flu", subcategory: "cough",
    classification: "P", shortDescription: "Powerful chesty cough mixture.",
    longDescription: "Covonia Bronchial Balsam helps to relieve chesty coughs and catarrh associated with colds.",
    directions: "Adults: two 5ml spoonfuls 4 times a day.",
    warnings: "Pharmacy medicine. Not for children under 12.",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80", packSize: "150ml", priceGbpPence: 599, stock: 75 },

  // ── ALLERGY & HAYFEVER ─────────────────────────────────
  { slug: "loratadine-10mg-30", name: "Loratadine 10mg Tablets", brand: "PharmaCare", category: "allergy", subcategory: "antihistamines",
    classification: "GSL", shortDescription: "Once-a-day non-drowsy hayfever and allergy relief.",
    longDescription: "Loratadine 10mg tablets provide effective, non-drowsy relief from the symptoms of hayfever and other allergies including sneezing, runny nose, itchy eyes and skin rash.",
    directions: "Adults & children over 12: 1 tablet daily.",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80", packSize: "30 tablets", priceGbpPence: 449, rrpGbpPence: 699, stock: 300, tags: ["hayfever", "non-drowsy"] },

  { slug: "cetirizine-10mg-30", name: "Cetirizine 10mg Tablets", brand: "PharmaCare", category: "allergy", subcategory: "antihistamines",
    classification: "GSL", shortDescription: "Daily antihistamine for hayfever and skin allergies.",
    longDescription: "Cetirizine hydrochloride 10mg tablets provide 24-hour relief from hayfever, perennial rhinitis and chronic urticaria.",
    directions: "Adults & children over 6: 1 tablet daily.",
    imageUrl: "https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=600&q=80", packSize: "30 tablets", priceGbpPence: 399, stock: 280 },

  { slug: "piriton-allergy-30", name: "Piriton Allergy Tablets", brand: "Piriton", category: "allergy", subcategory: "antihistamines",
    classification: "P", shortDescription: "Effective allergy relief for hayfever, hives and bites.",
    longDescription: "Piriton tablets contain chlorphenamine maleate and provide rapid relief from a wide range of allergic conditions.",
    directions: "Adults: 1 tablet every 4-6 hours.",
    warnings: "Pharmacy medicine. May cause drowsiness.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80", packSize: "30 tablets", priceGbpPence: 549, stock: 130 },

  { slug: "beconase-hayfever-180", name: "Beconase Hayfever Nasal Spray", brand: "Beconase", category: "allergy", subcategory: "nasal-sprays",
    classification: "P", shortDescription: "Steroid nasal spray for hayfever symptoms.",
    longDescription: "Beconase Hayfever 50 micrograms aqueous nasal spray contains beclometasone dipropionate to prevent and treat the nasal symptoms of hayfever.",
    directions: "Adults: 2 sprays in each nostril twice daily.",
    warnings: "Pharmacy medicine. Not for under 18s.",
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80", packSize: "180 sprays", priceGbpPence: 899, stock: 80 },

  { slug: "optrex-allergy-eye-drops", name: "Optrex Allergy Eye Drops", brand: "Optrex", category: "allergy", subcategory: "eye-drops",
    classification: "P", shortDescription: "Soothing relief for itchy, watery allergy eyes.",
    longDescription: "Optrex Allergy Eye Drops contain sodium cromoglicate to relieve and prevent the symptoms of allergic eye conditions.",
    directions: "1-2 drops in each eye 4 times a day.",
    warnings: "Pharmacy medicine.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80", packSize: "10ml", priceGbpPence: 599, stock: 95 },

  // ── DIGESTIVE HEALTH ───────────────────────────────────
  { slug: "gaviscon-double-action-300ml", name: "Gaviscon Double Action Liquid", brand: "Gaviscon", category: "digestive", subcategory: "heartburn",
    classification: "GSL", shortDescription: "Dual-action relief from heartburn and indigestion.",
    longDescription: "Gaviscon Double Action provides relief from the discomfort of heartburn and indigestion through two actions: neutralising stomach acid and forming a protective barrier.",
    directions: "Adults: 10-20ml after meals and at bedtime.",
    imageUrl: "https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=600&q=80", packSize: "300ml", priceGbpPence: 599, rrpGbpPence: 799, stock: 175 },

  { slug: "rennie-spearmint-72", name: "Rennie Spearmint Tablets", brand: "Rennie", category: "digestive", subcategory: "heartburn",
    classification: "GSL", shortDescription: "Fast-acting antacid tablets for heartburn and indigestion.",
    longDescription: "Rennie tablets contain calcium carbonate and magnesium carbonate to neutralise excess stomach acid quickly.",
    directions: "Adults: 1-2 tablets to be sucked or chewed when needed.",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80", packSize: "72 tablets", priceGbpPence: 449, stock: 200 },

  { slug: "imodium-instants-12", name: "Imodium Instants Tablets", brand: "Imodium", category: "digestive", subcategory: "diarrhoea",
    classification: "P", shortDescription: "Fast-melting tablets for the relief of acute diarrhoea.",
    longDescription: "Imodium Instants contain loperamide hydrochloride and dissolve on the tongue to bring fast relief without the need for water.",
    directions: "Adults: 2 tablets initially then 1 after each loose stool.",
    warnings: "Pharmacy medicine. Drink plenty of fluids.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80", packSize: "12 tablets", priceGbpPence: 549, stock: 110 },

  { slug: "buscopan-cramps-20", name: "Buscopan IBS Relief Tablets", brand: "Buscopan", category: "digestive", subcategory: "ibs",
    classification: "P", shortDescription: "Targeted relief from IBS abdominal pain and cramps.",
    longDescription: "Buscopan IBS Relief tablets contain hyoscine butylbromide which directly targets the source of IBS pain.",
    directions: "Adults: 1 tablet 3 times a day, increasing to 2 tablets 4 times daily if needed.",
    warnings: "Pharmacy medicine. For diagnosed IBS only.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80", packSize: "20 tablets", priceGbpPence: 599, stock: 80 },

  { slug: "senokot-tablets-100", name: "Senokot Tablets", brand: "Senokot", category: "digestive", subcategory: "constipation",
    classification: "GSL", shortDescription: "Natural plant-based laxative for occasional constipation.",
    longDescription: "Senokot tablets contain senna which gently and effectively works overnight to relieve occasional constipation.",
    directions: "Adults: 2 tablets at bedtime.",
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80", packSize: "100 tablets", priceGbpPence: 699, stock: 90 },

  // ── SKIN CARE ──────────────────────────────────────────
  { slug: "hydrocortisone-1-cream-15g", name: "Hydrocortisone 1% Cream", brand: "PharmaCare", category: "skin", subcategory: "rashes",
    classification: "P", shortDescription: "Anti-inflammatory cream for irritant dermatitis, eczema and insect bites.",
    longDescription: "Hydrocortisone 1% cream is a mild steroid that reduces inflammation, itching and redness from a range of skin conditions.",
    directions: "Apply sparingly 1-2 times daily for up to 7 days.",
    warnings: "Pharmacy medicine. Not for use on broken skin or face.",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80", packSize: "15g", priceGbpPence: 549, stock: 100 },

  { slug: "e45-cream-500g", name: "E45 Moisturising Cream", brand: "E45", category: "skin", subcategory: "moisturisers",
    classification: "GSL", shortDescription: "Daily moisturiser for dry, itchy or flaky skin.",
    longDescription: "E45 cream is clinically proven to treat dry, itchy and flaky skin caused by conditions such as eczema, dermatitis and ichthyosis.",
    directions: "Apply liberally 2-3 times daily to affected areas.",
    imageUrl: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600&q=80", packSize: "500g", priceGbpPence: 1099, stock: 80 },

  { slug: "sudocrem-care-protect-125g", name: "Sudocrem Antiseptic Healing Cream", brand: "Sudocrem", category: "skin", subcategory: "nappy-rash",
    classification: "GSL", shortDescription: "Soothing antiseptic cream for nappy rash, cuts & grazes.",
    longDescription: "Sudocrem helps treat and prevent nappy rash and is also useful for cuts, grazes, minor burns and acne.",
    directions: "Apply a thin layer to clean, dry skin.",
    imageUrl: "https://images.unsplash.com/photo-1556228724-4b0c4e6d9c8a?w=600&q=80", packSize: "125g", priceGbpPence: 449, stock: 140 },

  { slug: "bepanthen-nappy-care-100g", name: "Bepanthen Nappy Care Ointment", brand: "Bepanthen", category: "skin", subcategory: "nappy-rash",
    classification: "GSL", shortDescription: "Gentle protective ointment for delicate baby skin.",
    longDescription: "Bepanthen Nappy Care Ointment forms a transparent breathable layer to protect baby's skin from nappy rash.",
    directions: "Apply at every nappy change.",
    imageUrl: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600&q=80", packSize: "100g", priceGbpPence: 699, stock: 95 },

  { slug: "canesten-thrush-cream", name: "Canesten Thrush Cream", brand: "Canesten", category: "womens-health", subcategory: "intimate",
    classification: "P", shortDescription: "External cream for the treatment of vaginal thrush.",
    longDescription: "Canesten Thrush Cream contains clotrimazole 2% to relieve external itching and soreness caused by vaginal thrush.",
    directions: "Apply 2-3 times daily to the affected area.",
    warnings: "Pharmacy medicine.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80", packSize: "20g", priceGbpPence: 699, stock: 70 },

  // ── EYE & EAR CARE ─────────────────────────────────────
  { slug: "optrex-refreshing-drops", name: "Optrex Refreshing Eye Drops", brand: "Optrex", category: "eye-care", subcategory: "drops",
    classification: "GSL", shortDescription: "Soothes and refreshes tired or irritated eyes.",
    longDescription: "Optrex Refreshing Eye Drops contain witch hazel to soothe and refresh tired, dry or irritated eyes.",
    directions: "1-2 drops in each eye as needed.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80", packSize: "10ml", priceGbpPence: 449, stock: 110 },

  { slug: "earex-ear-drops", name: "Earex Ear Drops", brand: "Earex", category: "eye-care", subcategory: "ear",
    classification: "GSL", shortDescription: "Helps soften and remove ear wax.",
    longDescription: "Earex Ear Drops gently soften and loosen earwax for easy removal.",
    directions: "5 drops twice daily for 4 days.",
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80", packSize: "10ml", priceGbpPence: 449, stock: 70 },

  // ── FIRST AID ──────────────────────────────────────────
  { slug: "elastoplast-fabric-plasters-40", name: "Elastoplast Fabric Plasters", brand: "Elastoplast", category: "first-aid", subcategory: "plasters",
    classification: "GSL", shortDescription: "Strong, breathable fabric plasters in assorted sizes.",
    longDescription: "Elastoplast fabric plasters are flexible, breathable and conform comfortably to your skin.",
    directions: "Apply to clean, dry skin.",
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80", packSize: "40 plasters", priceGbpPence: 349, stock: 200 },

  { slug: "savlon-antiseptic-cream-30g", name: "Savlon Antiseptic Cream", brand: "Savlon", category: "first-aid", subcategory: "antiseptic",
    classification: "GSL", shortDescription: "Soothing antiseptic for cuts, grazes and minor burns.",
    longDescription: "Savlon Antiseptic Cream contains chlorhexidine to clean and protect minor wounds, cuts, grazes and burns.",
    directions: "Clean affected area and apply.",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80", packSize: "30g", priceGbpPence: 299, stock: 130 },

  { slug: "germolene-antiseptic-30g", name: "Germolene Antiseptic Cream", brand: "Germolene", category: "first-aid", subcategory: "antiseptic",
    classification: "GSL", shortDescription: "Antiseptic cream with mild local anaesthetic.",
    longDescription: "Germolene cream cleanses and soothes minor wounds while providing pain relief.",
    directions: "Apply to affected area as needed.",
    imageUrl: "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?w=600&q=80", packSize: "30g", priceGbpPence: 349, stock: 110 },

  // ── VITAMINS & SUPPLEMENTS ────────────────────────────
  { slug: "vitamin-d3-1000iu-90", name: "Vitamin D3 1000IU Tablets", brand: "PharmaCare", category: "vitamins", subcategory: "essential",
    classification: "GSL", shortDescription: "Daily vitamin D3 to support bone and immune health.",
    longDescription: "Vitamin D3 (cholecalciferol) 1000IU supports normal immune function, bones and muscles. Recommended in autumn and winter.",
    directions: "1 tablet daily with food.",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80", packSize: "90 tablets", priceGbpPence: 599, rrpGbpPence: 999, stock: 220, tags: ["immunity", "bones"] },

  { slug: "vitamin-c-1000mg-effervescent-20", name: "Vitamin C 1000mg Effervescent", brand: "PharmaCare", category: "vitamins", subcategory: "immunity",
    classification: "GSL", shortDescription: "Immune-supporting vitamin C in a refreshing orange drink.",
    longDescription: "High-strength vitamin C in an effervescent tablet that dissolves in water for easy absorption.",
    directions: "Dissolve 1 tablet in water daily.",
    imageUrl: "https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=600&q=80", packSize: "20 tablets", priceGbpPence: 399, stock: 180 },

  { slug: "berocca-performance-30", name: "Berocca Performance Tablets", brand: "Berocca", category: "vitamins", subcategory: "energy",
    classification: "GSL", shortDescription: "Multivitamin supplement to support mental sharpness and energy.",
    longDescription: "Berocca Performance combines vitamins B and C, magnesium, calcium and zinc to support mental sharpness and reduce tiredness.",
    directions: "1 tablet daily dissolved in water.",
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80", packSize: "30 tablets", priceGbpPence: 1099, rrpGbpPence: 1499, stock: 95 },

  { slug: "centrum-advance-100", name: "Centrum Advance Tablets", brand: "Centrum", category: "vitamins", subcategory: "multivitamin",
    classification: "GSL", shortDescription: "Comprehensive daily multivitamin and mineral.",
    longDescription: "Centrum Advance contains 24 essential vitamins and minerals including iron, calcium and vitamin D.",
    directions: "1 tablet daily with food.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80", packSize: "100 tablets", priceGbpPence: 1899, stock: 70 },

  // ── SLEEP & STRESS ────────────────────────────────────
  { slug: "nytol-original-20", name: "Nytol Original Tablets", brand: "Nytol", category: "sleep", subcategory: "sleep-aid",
    classification: "P", shortDescription: "One-a-night sleep aid for occasional sleeplessness.",
    longDescription: "Nytol Original tablets contain diphenhydramine hydrochloride to help with the temporary relief of sleeplessness.",
    directions: "Adults: 2 tablets 20 minutes before bedtime.",
    warnings: "Pharmacy medicine. Avoid alcohol.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80", packSize: "20 tablets", priceGbpPence: 599, stock: 85 },

  { slug: "kalms-day-200", name: "Kalms Day Tablets", brand: "Kalms", category: "sleep", subcategory: "stress",
    classification: "GSL", shortDescription: "Traditional herbal remedy for relief of mild anxiety.",
    longDescription: "Kalms Day is a traditional herbal medicinal product used for the temporary relief of symptoms of mild anxiety such as stress and irritability.",
    directions: "Adults: 1-2 tablets 3 times daily.",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80", packSize: "200 tablets", priceGbpPence: 999, stock: 60 },

  // ── ORAL & DENTAL ─────────────────────────────────────
  { slug: "corsodyl-mint-mouthwash-300ml", name: "Corsodyl Daily Mint Mouthwash", brand: "Corsodyl", category: "oral", subcategory: "mouthwash",
    classification: "GSL", shortDescription: "Daily mouthwash for healthy gums.",
    longDescription: "Corsodyl Daily Mouthwash helps prevent gum problems by removing the build-up of plaque bacteria.",
    directions: "Rinse with 10ml twice daily for 60 seconds.",
    imageUrl: "https://images.unsplash.com/photo-1626716493137-b67fe9501e76?w=600&q=80", packSize: "300ml", priceGbpPence: 449, stock: 120 },

  { slug: "bonjela-15g", name: "Bonjela Adult Strength Gel", brand: "Bonjela", category: "oral", subcategory: "mouth-ulcers",
    classification: "P", shortDescription: "Targeted relief from mouth ulcers and irritation.",
    longDescription: "Bonjela Adult Strength Gel contains an anaesthetic and antiseptic to soothe and treat mouth ulcers, cold sores and denture irritation.",
    directions: "Apply with clean fingertip up to every 3 hours.",
    warnings: "Pharmacy medicine. Not for under 16s.",
    imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80", packSize: "15g", priceGbpPence: 449, stock: 100 },

  // ── FOOT CARE ─────────────────────────────────────────
  { slug: "scholl-fungal-nail-3-8ml", name: "Scholl Fungal Nail Treatment", brand: "Scholl", category: "foot-care", subcategory: "fungal",
    classification: "GSL", shortDescription: "Effective treatment for mild fungal nail infections.",
    longDescription: "Scholl Fungal Nail Treatment uses a unique 2-in-1 file & treatment system to treat mild cases of fungal nail.",
    directions: "Apply once daily for up to 4 weeks.",
    imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80", packSize: "3.8ml", priceGbpPence: 1599, rrpGbpPence: 1999, stock: 65 },

  { slug: "lamisil-once-4g", name: "Lamisil Once", brand: "Lamisil", category: "foot-care", subcategory: "athletes-foot",
    classification: "P", shortDescription: "Single application treatment for athlete's foot.",
    longDescription: "Lamisil Once provides a single-application solution that forms an invisible film on the skin to deliver terbinafine — clearing athlete's foot.",
    directions: "Apply once to clean, dry feet.",
    warnings: "Pharmacy medicine.",
    imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600&q=80", packSize: "4g", priceGbpPence: 1099, stock: 80 },
];

export async function seedProducts(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    try {
      await db.insert(productsTable).values({
        id: p.slug,
        slug: p.slug,
        name: p.name,
        brand: p.brand ?? null,
        category: p.category,
        subcategory: p.subcategory ?? null,
        classification: p.classification,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        ingredients: p.ingredients ?? null,
        directions: p.directions ?? null,
        warnings: p.warnings ?? null,
        imageUrl: p.imageUrl,
        galleryUrls: [],
        packSize: p.packSize ?? null,
        priceGbp: p.priceGbpPence,
        rrpGbp: p.rrpGbpPence ?? null,
        stock: p.stock,
        active: true,
        requiresConsultation: p.requiresConsultation ?? false,
        tags: p.tags ?? [],
      }).onConflictDoNothing();
      inserted++;
    } catch {
      skipped++;
    }
  }

  return { inserted, skipped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void (async () => {
    const result = await seedProducts();
    console.log(`Products seed complete: ${result.inserted} inserted, ${result.skipped} skipped`);
    await db.execute(sql`SELECT 1`);
    process.exit(0);
  })();
}

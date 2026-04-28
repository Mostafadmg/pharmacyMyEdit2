// MedExpress / Pharmacy2U-style treatments mega-menu structure.
// Each item links to a condition consultation page (/conditions/:id) or a
// dedicated treatments page (e.g. /treatments/weight-loss).

export type TreatmentItem = {
  label: string;
  href: string;
  isNew?: boolean;
};

export type TreatmentColumn = {
  title: string;
  items: TreatmentItem[];
};

export const TREATMENTS_MENU: TreatmentColumn[] = [
  {
    title: "Weight Loss",
    items: [
      { label: "All Weight Loss", href: "/treatments/weight-loss" },
      { label: "Mounjaro (Tirzepatide)", href: "/conditions/weight-loss" },
      { label: "Wegovy (Semaglutide)", href: "/conditions/weight-loss" },
      { label: "Saxenda (Liraglutide)", href: "/conditions/weight-loss" },
      { label: "Orlistat / Xenical", href: "/conditions/weight-loss" },
      { label: "Mysimba", href: "/conditions/weight-loss" },
      { label: "Weight Loss Health Guide", href: "/treatments/weight-loss#guide" },
    ],
  },
  {
    title: "Sexual Performance",
    items: [
      { label: "Erectile Dysfunction", href: "/conditions/erectile-dysfunction" },
      { label: "Premature Ejaculation", href: "/conditions/premature-ejaculation" },
    ],
  },
  {
    title: "Sexual Health",
    items: [
      { label: "Bacterial Vaginosis", href: "/conditions/bacterial-vaginosis" },
      { label: "Cystitis", href: "/conditions/cystitis" },
      { label: "Emergency Contraception", href: "/conditions/emergency-contraception" },
      { label: "Period Delay", href: "/conditions/period-delay" },
      { label: "Thrush (Vaginal)", href: "/conditions/vaginal-thrush" },
      { label: "UTI Treatment", href: "/conditions/uti" },
    ],
  },
  {
    title: "STIs",
    items: [
      { label: "Chlamydia", href: "/conditions/chlamydia" },
      { label: "Genital Herpes", href: "/conditions/genital-herpes" },
      { label: "Genital Warts", href: "/conditions/genital-warts" },
    ],
  },
  {
    title: "Pain Relief",
    items: [
      { label: "Arthritis", href: "/conditions/arthritis" },
      { label: "Back Pain", href: "/conditions/back-pain" },
      { label: "Migraine", href: "/conditions/migraine" },
      { label: "Numbing Cream", href: "/conditions/numbing-cream" },
    ],
  },
  {
    title: "Hair, Skin and Nails",
    items: [
      { label: "Acne", href: "/conditions/acne-vulgaris" },
      { label: "Cold Sores", href: "/conditions/cold-sores" },
      { label: "Eczema / Dry Skin", href: "/conditions/dry-skin" },
      { label: "Hair Loss", href: "/conditions/hair-loss" },
      { label: "Nail Infection", href: "/conditions/nail-infection" },
      { label: "Rosacea", href: "/conditions/rosacea" },
      { label: "Vitamins", href: "/shop?category=vitamins" },
    ],
  },
  {
    title: "Allergies",
    items: [
      { label: "Hay Fever", href: "/conditions/allergic-rhinitis" },
    ],
  },
  {
    title: "Digestive Health",
    items: [
      { label: "Acid Reflux", href: "/conditions/acid-reflux" },
      { label: "IBS", href: "/conditions/ibs" },
      { label: "Threadworm", href: "/conditions/threadworms" },
      { label: "Constipation", href: "/conditions/constipation" },
      { label: "Diarrhoea", href: "/conditions/diarrhoea" },
    ],
  },
  {
    title: "Seasonal Viruses",
    items: [
      { label: "COVID-19 Tests", href: "/conditions/covid-19-tests" },
      { label: "Flu", href: "/conditions/flu" },
      { label: "Sore Throat", href: "/conditions/sore-throat" },
    ],
  },
  {
    title: "Travel Health",
    items: [
      { label: "Anti-Malaria", href: "/conditions/anti-malaria" },
      { label: "Jet Lag", href: "/conditions/jet-lag" },
      { label: "Sleep", href: "/conditions/sleep" },
    ],
  },
  {
    title: "Children & Family",
    items: [
      { label: "Chickenpox", href: "/conditions/chickenpox" },
      { label: "Head Lice", href: "/conditions/head-lice" },
      { label: "Nappy Rash", href: "/conditions/nappy-rash" },
      { label: "Teething", href: "/conditions/teething" },
      { label: "Infantile Colic", href: "/conditions/infantile-colic" },
    ],
  },
  {
    title: "Eye & Mouth",
    items: [
      { label: "Bacterial Conjunctivitis", href: "/conditions/conjunctivitis" },
      { label: "Dry Eye", href: "/conditions/dry-eye" },
      { label: "Mouth Ulcers", href: "/conditions/mouth-ulcers" },
      { label: "Oral Thrush", href: "/conditions/oral-candidiasis" },
    ],
  },
];

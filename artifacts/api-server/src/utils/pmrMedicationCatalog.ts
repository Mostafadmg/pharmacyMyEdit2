/** Demo barcode catalogue — mirrors pharmacist-pmr medicationCatalog for dev verify. */
export type CatalogEntry = {
  barcode: string;
  name: string;
  strength: string;
  form: string;
  matchTokens: string[];
};

export const DEMO_MEDICATION_CATALOG: CatalogEntry[] = [
  {
    barcode: "5060000000001",
    name: "Mounjaro",
    strength: "2.5mg",
    form: "KwikPen",
    matchTokens: ["mounjaro", "tirzepatide", "2.5"],
  },
  {
    barcode: "5060000000002",
    name: "Mounjaro",
    strength: "5mg",
    form: "KwikPen",
    matchTokens: ["mounjaro", "tirzepatide", "5mg"],
  },
  {
    barcode: "5060000000003",
    name: "Mounjaro",
    strength: "7.5mg",
    form: "KwikPen",
    matchTokens: ["mounjaro", "tirzepatide", "7.5"],
  },
  {
    barcode: "5060000000004",
    name: "Mounjaro",
    strength: "10mg",
    form: "KwikPen",
    matchTokens: ["mounjaro", "tirzepatide", "10mg"],
  },
  {
    barcode: "5060000000005",
    name: "Wegovy",
    strength: "0.25mg",
    form: "FlexTouch",
    matchTokens: ["wegovy", "semaglutide", "0.25"],
  },
  {
    barcode: "5060000000006",
    name: "Wegovy",
    strength: "0.5mg",
    form: "FlexTouch",
    matchTokens: ["wegovy", "semaglutide", "0.5"],
  },
  {
    barcode: "5060000000007",
    name: "Wegovy",
    strength: "1mg",
    form: "FlexTouch",
    matchTokens: ["wegovy", "semaglutide", "1mg"],
  },
  {
    barcode: "5060000000008",
    name: "Salbutamol",
    strength: "100mcg",
    form: "Inhaler",
    matchTokens: ["salbutamol", "ventolin", "100"],
  },
  {
    barcode: "5060000000009",
    name: "Omeprazole",
    strength: "20mg",
    form: "Capsules",
    matchTokens: ["omeprazole", "20"],
  },
];

export type PrescriptionLineLike = {
  name: string;
  strength?: string | null;
  form?: string | null;
};

export function catalogMatchesPrescriptionItem(
  entry: CatalogEntry,
  item: PrescriptionLineLike,
): boolean {
  const haystack =
    `${item.name} ${item.strength ?? ""} ${item.form ?? ""}`.toLowerCase();
  return entry.matchTokens.every((token) =>
    haystack.includes(token.toLowerCase()),
  );
}

export function lookupDemoByBarcode(barcode: string): CatalogEntry | null {
  const normalized = barcode.trim();
  if (!normalized) return null;
  return (
    DEMO_MEDICATION_CATALOG.find((e) => e.barcode === normalized) ?? null
  );
}

export type ScannedProduct = {
  name: string;
  strength: string;
  form: string;
  source: "dmd" | "demo";
};

export function productLabel(p: ScannedProduct): string {
  return `${p.name} ${p.strength} ${p.form}`.trim();
}

export function expectedProductLabel(item: PrescriptionLineLike): string {
  return `${item.name} ${item.strength ?? ""} ${item.form ?? ""}`.trim();
}

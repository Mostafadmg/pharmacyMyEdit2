/** Product lookup for scan-verify — dm+d API with local demo fallback. */
import { apiFetch } from "@/lib/api";
import type { PmrScanLookupResponse } from "@workspace/api-client-react";

export type ProductLookup = {
  gtin: string;
  name: string;
  strength: string;
  form: string;
  amppId?: string;
  vmpId?: string | null;
  supplier?: string | null;
  discontinued?: boolean;
  source: "dmd" | "demo";
  matchTokens: string[];
};

export const MEDICATION_CATALOG: Array<
  Omit<ProductLookup, "gtin" | "source"> & { barcode: string }
> = [
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

const demoByBarcode = new Map(
  MEDICATION_CATALOG.map((entry) => [entry.barcode, entry]),
);

function buildMatchTokens(name: string, strength?: string | null, form?: string | null): string[] {
  const tokens = new Set<string>();
  const add = (value: string) => {
    const normalized = value.toLowerCase().trim();
    if (normalized.length >= 2) tokens.add(normalized);
  };

  for (const part of name.split(/[\s,/()-]+/)) add(part);
  if (strength) add(strength);
  if (form) add(form);

  return [...tokens];
}

function toProductLookup(
  gtin: string,
  data: {
    name: string;
    strength?: string | null;
    form?: string | null;
    amppId?: string;
    vmpId?: string | null;
    supplier?: string | null;
    discontinued?: boolean;
    source: "dmd" | "demo";
    matchTokens?: string[];
  },
): ProductLookup {
  return {
    gtin,
    name: data.name,
    strength: data.strength ?? "",
    form: data.form ?? "",
    amppId: data.amppId,
    vmpId: data.vmpId,
    supplier: data.supplier,
    discontinued: data.discontinued,
    source: data.source,
    matchTokens:
      data.matchTokens ??
      buildMatchTokens(data.name, data.strength, data.form),
  };
}

function demoLookup(gtin: string): ProductLookup | null {
  const entry = demoByBarcode.get(gtin);
  if (!entry) return null;
  return toProductLookup(gtin, {
    name: entry.name,
    strength: entry.strength,
    form: entry.form,
    source: "demo",
    matchTokens: entry.matchTokens,
  });
}

export async function lookupProductByGtin(
  gtin: string,
): Promise<{ product: ProductLookup | null; error?: string }> {
  const normalized = gtin.trim();
  if (!normalized) return { product: null, error: "Empty GTIN" };

  try {
    const response = await apiFetch<PmrScanLookupResponse>(
      `/pmr/scan-lookup?gtin=${encodeURIComponent(normalized)}`,
    );
    return {
      product: toProductLookup(response.gtin, {
        name: response.name,
        strength: response.strength,
        form: response.form,
        amppId: response.amppId,
        vmpId: response.vmpId,
        supplier: response.supplier,
        discontinued: response.discontinued,
        source: response.source,
      }),
    };
  } catch (err) {
    const demo = demoLookup(normalized);
    if (demo) return { product: demo };

    const message =
      err instanceof Error ? err.message : "Product lookup failed";
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return { product: null, error: "Unknown barcode — not in dm+d catalogue." };
    }
    return {
      product: null,
      error: `Lookup failed (${message}). Run dm+d sync or use demo barcodes.`,
    };
  }
}

/** @deprecated Use lookupProductByGtin — kept for demo barcode list */
export function lookupByBarcode(barcode: string): ProductLookup | null {
  return demoLookup(barcode.trim());
}

export type PrescriptionLineLike = {
  name: string;
  strength?: string | null;
  form?: string | null;
};

export function productMatchesPrescriptionItem(
  product: ProductLookup,
  item: PrescriptionLineLike,
): boolean {
  const haystack = `${item.name} ${item.strength ?? ""} ${item.form ?? ""}`.toLowerCase();

  if (product.source === "demo") {
    return product.matchTokens.every((token) =>
      haystack.includes(token.toLowerCase()),
    );
  }

  const rxTokens = buildMatchTokens(item.name, item.strength, item.form);
  const productHaystack =
    `${product.name} ${product.strength} ${product.form}`.toLowerCase();

  const rxName = item.name.toLowerCase().trim();
  if (rxName.length >= 3 && productHaystack.includes(rxName)) return true;

  const matched = rxTokens.filter(
    (token) =>
      token.length >= 3 &&
      (haystack.includes(token) ? productHaystack.includes(token) : false),
  );
  if (matched.length >= 2) return true;

  if (product.strength && item.strength) {
    const rxStrength = item.strength.toLowerCase().replace(/\s/g, "");
    const prodStrength = product.strength.toLowerCase().replace(/\s/g, "");
    if (
      rxStrength &&
      prodStrength &&
      productHaystack.includes(rxStrength) &&
      haystack.includes(prodStrength.slice(0, 4))
    ) {
      return true;
    }
  }

  return product.matchTokens.some(
    (token) => token.length >= 4 && haystack.includes(token.toLowerCase()),
  );
}

export function findCatalogEntryForItem(
  item: PrescriptionLineLike,
): ProductLookup | null {
  const match = MEDICATION_CATALOG.find((entry) =>
    productMatchesPrescriptionItem(
      toProductLookup(entry.barcode, {
        name: entry.name,
        strength: entry.strength,
        form: entry.form,
        source: "demo",
        matchTokens: entry.matchTokens,
      }),
      item,
    ),
  );
  if (!match) return null;
  return demoLookup(match.barcode);
}

/** Back-compat alias */
export const catalogMatchesPrescriptionItem = productMatchesPrescriptionItem;
export type CatalogEntry = ProductLookup;

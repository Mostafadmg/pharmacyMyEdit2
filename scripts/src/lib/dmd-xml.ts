import { XMLParser } from "fast-xml-parser";

export type GtinMapping = {
  gtin: string;
  amppId: string;
  discontinued: boolean;
};

export type AmppRecord = {
  amppId: string;
  productName: string;
  vppId?: string;
};

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  isArray: (name) => name === "AMPP" || name === "GTINDATA",
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

/** Parse f_gtin2_*.xml → GTIN → AMPPID mappings. */
export function parseGtinXml(xml: string): GtinMapping[] {
  const doc = parser.parse(xml) as {
    GTIN_DETAILS?: { AMPPS?: { AMPP?: unknown } };
  };
  const out: GtinMapping[] = [];

  for (const ampp of asArray(doc.GTIN_DETAILS?.AMPPS?.AMPP)) {
    const row = ampp as {
      AMPPID?: string;
      GTINDATA?: { GTIN?: string; ENDDT?: string } | { GTIN?: string; ENDDT?: string }[];
    };
    const amppId = textValue(row.AMPPID);
    if (!amppId) continue;

    for (const gtinData of asArray(row.GTINDATA)) {
      const gtin = textValue(gtinData.GTIN);
      if (!gtin) continue;
      out.push({
        gtin: normalizeGtin(gtin),
        amppId,
        discontinued: Boolean(textValue(gtinData.ENDDT)),
      });
    }
  }

  return out;
}

/** Parse f_ampp2_*.xml → AMPPID → product description. */
export function parseAmppXml(xml: string): Map<string, AmppRecord> {
  const doc = parser.parse(xml) as {
    ACTUAL_MEDICINAL_PROD_PACKS?: { AMPP?: unknown };
  };
  const out = new Map<string, AmppRecord>();

  for (const ampp of asArray(doc.ACTUAL_MEDICINAL_PROD_PACKS?.AMPP)) {
    const row = ampp as { APPID?: string; NM?: string; VPPID?: string };
    const amppId = textValue(row.APPID);
    const productName = textValue(row.NM);
    if (!amppId || !productName) continue;
    out.set(amppId, {
      amppId,
      productName,
      vppId: textValue(row.VPPID) || undefined,
    });
  }

  return out;
}

/** Parse f_vmp2_*.xml → VPID → virtual product name (for strength hints). */
export function parseVmpXml(xml: string): Map<string, string> {
  const doc = parser.parse(xml) as {
    VIRTUAL_MED_PRODUCTS?: { VMP?: unknown };
  };
  const out = new Map<string, string>();

  for (const vmp of asArray(doc.VIRTUAL_MED_PRODUCTS?.VMP)) {
    const row = vmp as { VPID?: string; NM?: string };
    const vpid = textValue(row.VPID);
    const name = textValue(row.NM);
    if (vpid && name) out.set(vpid, name);
  }

  return out;
}

/** Parse f_vmpp2_*.xml → VPPID → VPID link. */
export function parseVmppXml(xml: string): Map<string, string> {
  const doc = parser.parse(xml) as {
    VIRTUAL_MED_PROD_PACKS?: { VMPP?: unknown };
  };
  const out = new Map<string, string>();

  for (const vmpp of asArray(doc.VIRTUAL_MED_PROD_PACKS?.VMPP)) {
    const row = vmpp as { VPPID?: string; VPID?: string };
    const vppid = textValue(row.VPPID);
    const vpid = textValue(row.VPID);
    if (vppid && vpid) out.set(vppid, vpid);
  }

  return out;
}

export function normalizeGtin(gtin: string): string {
  const digits = gtin.replace(/\D/g, "");
  if (digits.length === 14) return digits.replace(/^0+/, "") || digits;
  if (digits.length === 13) return digits;
  if (digits.length === 12) return `0${digits}`;
  return digits;
}

const STRENGTH_RE =
  /\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|micrograms?|units?|%)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))?/gi;

const FORM_KEYWORDS = [
  "tablets",
  "capsules",
  "injection",
  "solution",
  "suspension",
  "cream",
  "ointment",
  "gel",
  "inhaler",
  "pessary",
  "suppositories",
  "granules",
  "powder",
  "spray",
  "drops",
  "patch",
  "pen",
  "kwikpen",
  "flextouch",
  "autoinjector",
];

export function extractStrength(text: string): string | null {
  const match = text.match(STRENGTH_RE);
  return match?.[0]?.trim() ?? null;
}

export function extractForm(text: string): string | null {
  const lower = text.toLowerCase();
  for (const keyword of FORM_KEYWORDS) {
    if (lower.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  return null;
}

export function extractSupplier(productName: string): string | null {
  const match = productName.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() ?? null;
}

export type DmdGtinRow = {
  gtin: string;
  amppId: string;
  vmpId: string | null;
  productName: string;
  strength: string | null;
  form: string | null;
  supplier: string | null;
  discontinued: boolean;
};

export function buildGtinRows(
  gtinMappings: GtinMapping[],
  amppById: Map<string, AmppRecord>,
  vppToVmp: Map<string, string>,
  vmpNames: Map<string, string>,
): DmdGtinRow[] {
  const rows: DmdGtinRow[] = [];
  const seen = new Set<string>();

  for (const mapping of gtinMappings) {
    if (seen.has(mapping.gtin)) continue;
    seen.add(mapping.gtin);

    const ampp = amppById.get(mapping.amppId);
    if (!ampp) continue;

    const vmpId = ampp.vppId ? vppToVmp.get(ampp.vppId) ?? null : null;
    const vmpName = vmpId ? vmpNames.get(vmpId) : undefined;
    const strengthSource = vmpName ?? ampp.productName;

    rows.push({
      gtin: mapping.gtin,
      amppId: mapping.amppId,
      vmpId,
      productName: ampp.productName,
      strength: extractStrength(strengthSource),
      form: extractForm(ampp.productName),
      supplier: extractSupplier(ampp.productName),
      discontinued: mapping.discontinued,
    });
  }

  return rows;
}

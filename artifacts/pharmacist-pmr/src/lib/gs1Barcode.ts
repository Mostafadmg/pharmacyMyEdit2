export type ParsedScan = {
  raw: string;
  gtin: string;
  batch?: string;
  expiry?: string;
  serial?: string;
};

const GS = String.fromCharCode(29);

function normalizeGtinDigits(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (clean.length === 14) {
    const trimmed = clean.replace(/^0+/, "");
    return trimmed.length >= 13 ? trimmed : clean;
  }
  if (clean.length === 13) return clean;
  if (clean.length === 12) return `0${clean}`;
  return clean;
}

function parseExpiryYyMmDd(value: string): string | undefined {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 6) return undefined;
  const yy = Number(digits.slice(0, 2));
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  const year = yy >= 70 ? 1900 + yy : 2000 + yy;
  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return `${year}-${mm}-${dd}`;
}

/** Parse GS1 element strings with parentheses, e.g. (01)0505...(17)260630(10)ABC */
function parseParenthesized(raw: string): ParsedScan | null {
  const matches = [...raw.matchAll(/\((\d{2})\)([^()]+)/g)];
  if (matches.length === 0) return null;

  let gtin: string | undefined;
  let batch: string | undefined;
  let expiry: string | undefined;
  let serial: string | undefined;

  for (const match of matches) {
    const ai = match[1]!;
    const value = match[2]!.trim();
    if (ai === "01") gtin = normalizeGtinDigits(value);
    else if (ai === "10") batch = value;
    else if (ai === "17") expiry = parseExpiryYyMmDd(value);
    else if (ai === "21") serial = value;
  }

  if (!gtin) return null;
  return { raw, gtin, batch, expiry, serial };
}

const FIXED_AI_LENGTH: Record<string, number> = {
  "01": 14,
  "17": 6,
};

const VARIABLE_AIS = new Set(["10", "21"]);

/** Parse concatenated GS1 data (Data Matrix / some scanners), e.g. 010505...1726063010BATCH */
function parseConcatenated(raw: string): ParsedScan | null {
  const cleaned = raw.split(GS).join("");
  if (!/^\d{2}/.test(cleaned)) return null;

  let index = 0;
  let gtin: string | undefined;
  let batch: string | undefined;
  let expiry: string | undefined;
  let serial: string | undefined;

  while (index + 2 <= cleaned.length) {
    const ai = cleaned.slice(index, index + 2);
    index += 2;

    if (ai in FIXED_AI_LENGTH) {
      const len = FIXED_AI_LENGTH[ai]!;
      const value = cleaned.slice(index, index + len);
      if (value.length < len) break;
      index += len;
      if (ai === "01") gtin = normalizeGtinDigits(value);
      else if (ai === "17") expiry = parseExpiryYyMmDd(value);
      continue;
    }

    if (VARIABLE_AIS.has(ai)) {
      const nextAi = cleaned.slice(index).search(/\d{2}(?:01|10|17|21)/);
      const end =
        nextAi === -1 ? cleaned.length : index + nextAi;
      const value = cleaned.slice(index, end).trim();
      index = end;
      if (ai === "10") batch = value;
      else if (ai === "21") serial = value;
      continue;
    }

    break;
  }

  if (!gtin) return null;
  return { raw, gtin, batch, expiry, serial };
}

function parseLinearGtin(raw: string): ParsedScan | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 14) return null;
  return { raw, gtin: normalizeGtinDigits(digits) };
}

export function parseGs1Barcode(raw: string): ParsedScan | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.includes("(") && trimmed.includes(")")) {
    const parsed = parseParenthesized(trimmed);
    if (parsed) return parsed;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.startsWith("01") && digitsOnly.length > 14) {
    const parsed = parseConcatenated(trimmed.includes(GS) ? trimmed : digitsOnly);
    if (parsed) return parsed;
  }

  return parseLinearGtin(trimmed);
}

export function isExpired(expiryIso: string, now = new Date()): boolean {
  const expiry = new Date(`${expiryIso}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry < now;
}

export function formatExpiryDisplay(expiryIso: string): string {
  const [y, m, d] = expiryIso.split("-");
  if (!y || !m || !d) return expiryIso;
  return `${d}/${m}/${y}`;
}

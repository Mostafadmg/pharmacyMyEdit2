/** Normalize activity/UI copy to ASCII so separators never render as broken glyphs. */
export function plainActivityText(text: string): string {
  return text
    .replace(/\uFFFD/g, "-")
    .replace(/\u00B7/g, " | ")
    .replace(/\u2013|\u2014/g, " - ")
    .replace(/\u2192/g, " -> ")
    .replace(/\s+\|\s+\|\s+/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const EMPTY_VALUE = "-";

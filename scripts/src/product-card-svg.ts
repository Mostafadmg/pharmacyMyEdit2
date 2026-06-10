import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const GENERATED_DIR = resolve(
  __dirname,
  "../../artifacts/pharmacy/public/products/generated",
);

const CATEGORY_ACCENTS: Record<string, string> = {
  "weight-loss": "#0E5A52",
  "erectile-dysfunction": "#1E4D3B",
  "womens-health": "#B45309",
  migraine: "#5B21B6",
  asthma: "#0369A1",
  acne: "#BE185D",
  skin: "#0F766E",
  "hair-loss": "#4338CA",
  allergy: "#15803D",
  "travel-health": "#0E7490",
  "sexual-health": "#9D174D",
  "eye-care": "#1D4ED8",
  "pain-relief": "#1E3A5F",
  "cold-flu": "#0284C7",
  vitamins: "#CA8A04",
  "stop-smoking": "#64748B",
  "general-health": "#1E4D3B",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    } else {
      current = next;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.slice(0, maxLines);
}

export function productCardSvg(name: string, category: string): string {
  const accent = CATEGORY_ACCENTS[category] ?? CATEGORY_ACCENTS["general-health"];
  const lines = wrapLines(name.replace(/[®™]/g, ""), 22, 3);
  const lineEls = lines
    .map((line, idx) => {
      const y = 200 + idx * 26;
      return `<text x="200" y="${y}" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="18" font-weight="600" fill="${accent}">${escapeXml(line)}</text>`;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FAF7F2"/>
      <stop offset="100%" stop-color="#E8F5F0"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect x="24" y="24" width="352" height="352" rx="20" fill="#FFFFFF" stroke="${accent}" stroke-width="2" opacity="0.95"/>
  <circle cx="200" cy="120" r="48" fill="${accent}" opacity="0.12"/>
  <circle cx="200" cy="120" r="36" fill="${accent}"/>
  <text x="200" y="132" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF">+</text>
  <text x="200" y="168" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="0.12em" fill="${accent}">EVERYDAYMEDS</text>
  ${lineEls}
  <text x="200" y="320" text-anchor="middle" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="12" fill="#6B7280">UK pharmacy product</text>
</svg>`;
}

export function writeProductCardSvg(
  slug: string,
  name: string,
  category: string,
): string {
  if (!existsSync(GENERATED_DIR)) {
    mkdirSync(GENERATED_DIR, { recursive: true });
  }
  const file = `${slug}.svg`;
  const path = resolve(GENERATED_DIR, file);
  writeFileSync(path, productCardSvg(name, category), "utf8");
  return `/products/generated/${file}`;
}

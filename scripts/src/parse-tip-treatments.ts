/**
 * Parse treatments markdown export into JSON for shop seeding.
 * Usage: npx tsx ./src/parse-tip-treatments.ts [input.md] [output.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type ParsedTreatment = {
  name: string;
  altTitle?: string;
  priceGbpPence: number;
  reviewCount?: number;
  slug: string;
  category: string;
  classification: "GSL" | "P" | "POM";
  requiresConsultation: boolean;
};

const __dirname = dirname(fileURLToPath(import.meta.url));

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parsePricePence(line: string): number | null {
  const m = /£\s*([\d,]+(?:\.\d{2})?)/.exec(line);
  if (!m) return null;
  const pounds = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(pounds)) return null;
  return Math.round(pounds * 100);
}

function inferCategory(name: string, alt?: string): string {
  const text = `${name} ${alt ?? ""}`.toLowerCase();
  if (/mounjaro|wegovy|orlistat|saxenda|weight loss|alli\b|xenical/.test(text)) {
    return "weight-loss";
  }
  if (/sildenafil|tadalafil|viagra|cialis|vardenafil|levitra|spedra|erectile|eroxon/.test(text)) {
    return "erectile-dysfunction";
  }
  if (/contracept|levonelle|ellaone|yasmin|rigevidon|microgynon|cerazette|desogestrel|norethisterone|hrt|menopause|evorel|utrogestan|gina\b/.test(text)) {
    return "womens-health";
  }
  if (/sumatriptan|rizatriptan|zolmitriptan|almotriptan|migraine|almogran/.test(text)) {
    return "migraine";
  }
  if (/ventolin|salbutamol|inhaler|clenil|seretide|flixotide|asthma|beclometasone/.test(text)) {
    return "asthma";
  }
  if (/acne|duac|differin|epiduo|treclin|lymecycline|zineryt|skinoren/.test(text)) {
    return "acne";
  }
  if (/eczema|dermatitis|betnovate|eumovate|hydrocortisone|elocon|derm|psoriasis|enstilar/.test(text)) {
    return "skin";
  }
  if (/thrush|canesten|fluconazole|cystitis|nitrofurantoin|trimethoprim|macrobid/.test(text)) {
    return "womens-health";
  }
  if (/hair loss|finasteride|regaine|propecia|minoxidil|avodart/.test(text)) {
    return "hair-loss";
  }
  if (/hay fever|fexofenadine|cetirizine|loratadine|beconase|avamys|dymista|antihistamine/.test(text)) {
    return "allergy";
  }
  if (/malarone|doxycycline|travel|anti-malar/.test(text)) {
    return "travel-health";
  }
  if (/wart|condyline|warticon|herpes|aciclovir|valtrex|genital/.test(text)) {
    return "sexual-health";
  }
  if (/ear|otomize|cetraxal|eye|chloramphenicol|optrex/.test(text)) {
    return "eye-care";
  }
  if (/ibuprofen|paracetamol|naproxen|codeine|solpadeine|pain|co-codamol|tramadol/.test(text)) {
    return "pain-relief";
  }
  if (/vitabiotics|wellman|wellwoman|vitamin|supplement|berocca|centrum|haliborange|seven seas/.test(text)) {
    return "vitamins";
  }
  if (/cold|flu|lemsip|strepsils|decongest|sudafed/.test(text)) {
    return "cold-flu";
  }
  if (/rosacea|soolantra|finacea|metronidazole gel/.test(text)) {
    return "skin";
  }
  if (/fucidin|fucibet|antibiotic|cream|mupirocin|fusidic/.test(text)) {
    return "skin";
  }
  if (/scabies|permethrin|lice|hedrin|malathion/.test(text)) {
    return "skin";
  }
  if (/stop smoking|champix|nicorette|zyban/.test(text)) {
    return "stop-smoking";
  }
  return "general-health";
}

function inferClassification(category: string, name: string): {
  classification: "GSL" | "P" | "POM";
  requiresConsultation: boolean;
} {
  const n = name.toLowerCase();
  if (category === "vitamins") {
    return { classification: "GSL", requiresConsultation: false };
  }
  if (
    category === "weight-loss" ||
    category === "erectile-dysfunction" ||
    category === "womens-health" ||
    category === "migraine" ||
    category === "asthma" ||
    category === "hair-loss" ||
    /injection|pen\b|mg\b/.test(n)
  ) {
    return { classification: "POM", requiresConsultation: false };
  }
  if (/cream|gel|spray|ointment|drops|tablets|capsules/.test(n)) {
    return { classification: "P", requiresConsultation: false };
  }
  return { classification: "POM", requiresConsultation: false };
}

export function parseTreatmentsMarkdown(content: string): ParsedTreatment[] {
  const lines = content.split(/\r?\n/);
  const products: ParsedTreatment[] = [];
  const slugCounts = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("### ")) continue;

    const name = line.slice(4).trim();
    if (!name || name.length < 2) continue;

    let altTitle: string | undefined;
    let reviewCount: number | undefined;
    let priceGbpPence: number | null = null;

    let j = i + 1;
    while (j < lines.length) {
      const row = lines[j].trim();
      if (row.startsWith("### ")) break;

      const reviewsMatch = /^(\d+)\s+reviews/.exec(row);
      if (reviewsMatch) reviewCount = parseInt(reviewsMatch[1], 10);
      if (row.startsWith("£")) {
        const p = parsePricePence(row);
        if (p != null) priceGbpPence = p;
      }
      if (row === "from" && j + 1 < lines.length) {
        const next = lines[j + 1].trim();
        if (next.startsWith("£")) {
          const p = parsePricePence(next);
          if (p != null) priceGbpPence = p;
          j++;
        }
      }
      j++;
    }

    // Trailing alt line after price block (matches TIP card image caption)
    if (j < lines.length) {
      const tail = lines[j].trim();
      if (tail.startsWith("* ") && !tail.startsWith("* [")) {
        const candidate = tail.slice(2).trim();
        if (
          candidate &&
          !candidate.startsWith("Best seller") &&
          candidate.length > 3 &&
          candidate.toLowerCase() !== name.toLowerCase()
        ) {
          altTitle = candidate;
        }
      }
    }

    if (priceGbpPence == null || priceGbpPence < 50) continue;

    let baseSlug = slugify(name);
    if (!baseSlug) continue;
    const count = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, count + 1);
    const slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;

    const category = inferCategory(name, altTitle);
    const { classification, requiresConsultation } = inferClassification(
      category,
      name,
    );

    products.push({
      name,
      altTitle,
      priceGbpPence,
      reviewCount,
      slug,
      category,
      classification,
      requiresConsultation,
    });
  }

  return products;
}

function main() {
  const input =
    process.argv[2] ??
    resolve(__dirname, "../../lib/db/src/data/treatments-0.md");
  const output =
    process.argv[3] ??
    resolve(__dirname, "../../lib/db/src/data/tip-treatments.json");

  const content = readFileSync(input, "utf8");
  const products = parseTreatmentsMarkdown(content);
  writeFileSync(output, JSON.stringify(products, null, 2), "utf8");
  console.log(`Parsed ${products.length} treatments → ${output}`);
}

const isMain =
  process.argv[1]?.includes("parse-tip-treatments") ||
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`;

if (isMain) main();

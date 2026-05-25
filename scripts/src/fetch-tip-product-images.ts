/**
 * Download product pack images from The Independent Pharmacy.
 * 1. tip-product-paths.json (slug → /category/slug)
 * 2. Fetch each product page, pick 1200x1200 sanity hero image
 * 3. Save to artifacts/pharmacy/public/products/tip/{slug}.jpg
 *
 * Usage:
 *   npx tsx ./src/extract-tip-paths.ts
 *   npx tsx ./src/fetch-tip-product-images.ts
 *   npx tsx ./src/fetch-tip-product-images.ts --limit=50
 *   npx tsx ./src/fetch-tip-product-images.ts --slug=fucibet-cream
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveTipPath } from "./resolve-tip-path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG = resolve(__dirname, "../../lib/db/src/data/tip-treatments.json");
const PATHS_FILE = resolve(__dirname, "../../lib/db/src/data/tip-product-paths.json");
const OUT_DIR = resolve(__dirname, "../../artifacts/pharmacy/public/products/tip");
const MAP_FILE = resolve(__dirname, "../../lib/db/src/data/tip-product-images.json");

const BASE = "https://www.theindependentpharmacy.co.uk";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type CatalogItem = { slug: string; name: string; category: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function pickProductImage(html: string): string | null {
  const imgs = [
    ...html.matchAll(
      /https:\/\/cdn\.sanity\.io\/images\/[^"'\s\\]+?\.(?:jpg|jpeg|png|webp)/gi,
    ),
  ].map((m) => m[0]);

  const pack = imgs.filter(
    (u) =>
      u.includes("1200x1200") ||
      u.includes("1000x1000") ||
      u.includes("800x800") ||
      (/\d{3,4}x\d{3,4}/.test(u) &&
        !u.includes("201x90") &&
        !u.includes("193x75") &&
        !u.includes("836x371")),
  );
  if (pack.length > 0) {
    const best = pack.sort((a, b) => {
      const score = (u: string) => {
        if (u.includes("1200x1200")) return 10;
        if (u.includes("1000x1000")) return 9;
        if (u.includes("800x800")) return 8;
        const m = /(\d+)x(\d+)/.exec(u);
        if (m) return parseInt(m[1], 10) * parseInt(m[2], 10);
        return 0;
      };
      return score(b) - score(a);
    })[0];
    return best;
  }

  return (
    imgs.find(
      (u) =>
        !u.includes("logo") &&
        !u.includes("201x90") &&
        !u.includes(".svg") &&
        !u.includes("836x371"),
    ) ?? null
  );
}

async function tryResolveImage(
  item: CatalogItem,
  pathMap: Record<string, string>,
): Promise<{ image: string; path: string } | null> {
  const resolved = resolveTipPath(item.slug, pathMap, item.category);
  if (resolved) {
    const image = await fetchProductImage(resolved);
    if (image) return { image, path: resolved };
  }

  const slugVariants = [
    item.slug,
    item.slug.replace(/-250mg-pain-relief-tablets$/, "-tablets"),
    item.slug.replace(/-pain-relief-tablets$/, "-tablets"),
    item.slug.replace(/-gastro-resistant-tablets$/, "-tablets"),
    item.slug.replace(/-tablets$/, "").replace(/-cream$/, ""),
  ];
  const cats = [
    item.category,
    item.category.replace(/-relief$/, ""),
    "general-health",
  ];
  for (const cat of cats) {
    for (const slug of slugVariants) {
      const path = `/${cat}/${slug}`;
      const image = await fetchProductImage(path);
      if (image) return { image, path };
    }
  }
  return null;
}

async function fetchProductImage(path: string): Promise<string | null> {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    return pickProductImage(html);
  } catch {
    return null;
  }
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: BASE },
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("image") && !url.includes(".jpg")) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 800) return false;
    writeFileSync(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

function extFromUrl(url: string): string {
  const m = /\.(jpg|jpeg|png|webp)/i.exec(url);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit"));
  const limit = limitArg
    ? parseInt(limitArg.replace("--limit=", "").replace("--limit", "") || "0", 10)
    : 0;
  const slugFilter = process.argv
    .find((a) => a.startsWith("--slug="))
    ?.split("=")[1];

  if (!existsSync(PATHS_FILE)) {
    console.error("Run extract-tip-paths.ts first");
    process.exit(1);
  }

  const pathMap = JSON.parse(readFileSync(PATHS_FILE, "utf8")) as Record<
    string,
    string
  >;
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as CatalogItem[];
  let items = catalog;

  if (slugFilter) items = items.filter((i) => i.slug === slugFilter);
  if (limit > 0) items = items.slice(0, limit);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const existing: Record<string, { imageUrl: string; sourceUrl: string; path: string }> =
    existsSync(MAP_FILE)
      ? (JSON.parse(readFileSync(MAP_FILE, "utf8")) as Record<
          string,
          { imageUrl: string; sourceUrl: string; path: string }
        >)
      : {};

  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prev = existing[item.slug];
    const ext = prev?.imageUrl?.match(/\.(\w+)$/)?.[1] ?? "jpg";
    const filePath = resolve(OUT_DIR, `${item.slug}.${ext}`);
    const publicPath = `/products/tip/${item.slug}.${ext}`;

    if (existsSync(filePath) && prev?.sourceUrl) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${items.length}] ${item.slug} `);
    const result = await tryResolveImage(item, pathMap);
    if (!result) {
      console.log("no image");
      fail++;
      await sleep(250);
      continue;
    }
    const { image: remote, path: tipPath } = result;

    const fileExt = extFromUrl(remote);
    const dest = resolve(OUT_DIR, `${item.slug}.${fileExt}`);
    const pub = `/products/tip/${item.slug}.${fileExt}`;
    const saved = await downloadImage(remote, dest);
    existing[item.slug] = {
      imageUrl: saved ? pub : remote,
      sourceUrl: remote,
      path: tipPath,
    };
    if (saved) ok++;
    else ok++;
    console.log(saved ? "saved" : "remote");
    await sleep(280);

    if ((i + 1) % 20 === 0) {
      writeFileSync(MAP_FILE, JSON.stringify(existing, null, 2), "utf8");
    }
  }

  writeFileSync(MAP_FILE, JSON.stringify(existing, null, 2), "utf8");
  console.log(
    `Done: ${ok} fetched, ${skipped} skipped, ${fail} failed. Map → ${MAP_FILE}`,
  );
}

void main();

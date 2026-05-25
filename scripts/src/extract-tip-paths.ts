/**
 * Build slug → TIP path map: nav links + every category listing page.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../../lib/db/src/data/tip-product-paths.json");
const HTML_CACHED = resolve(__dirname, "../tip-treatments.html");
const BASE = "https://www.theindependentpharmacy.co.uk";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function addPath(paths: Record<string, string>, path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length !== 2) return;
  const [cat, slug] = parts;
  if (["guides", "brands", "blog"].includes(cat)) return;
  if (!paths[slug] || path.length < paths[slug].length) {
    paths[slug] = path;
  }
}

function extractPathsFromHtml(html: string, prefix?: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/href="(\/[a-z0-9-]+\/[a-z0-9][a-z0-9-]*)"/gi)) {
    const path = m[1];
    const parts = path.split("/").filter(Boolean);
    if (parts.length !== 2) continue;
    if (prefix && !path.startsWith(prefix + "/")) continue;
    if (path.endsWith("/guides")) continue;
    out.push(path);
  }
  return out;
}

async function main() {
  let html: string;
  if (existsSync(HTML_CACHED)) {
    html = readFileSync(HTML_CACHED, "utf8");
    console.log("Using cached treatments HTML");
  } else {
    const res = await fetch(`${BASE}/treatments`, { headers: { "User-Agent": UA } });
    html = await res.text();
  }

  const paths: Record<string, string> = {};
  for (const path of extractPathsFromHtml(html)) addPath(paths, path);

  const categories = new Set(
    Object.values(paths).map((p) => "/" + p.split("/").filter(Boolean)[0]),
  );

  console.log(`Nav paths: ${Object.keys(paths).length}, categories: ${categories.size}`);

  let i = 0;
  for (const cat of categories) {
    i++;
    process.stdout.write(`[${i}/${categories.size}] ${cat} `);
    try {
      const res = await fetch(`${BASE}${cat}`, {
        headers: { "User-Agent": UA, Accept: "text/html" },
      });
      if (!res.ok) {
        console.log(res.status);
        continue;
      }
      const page = await res.text();
      const before = Object.keys(paths).length;
      for (const path of extractPathsFromHtml(page, cat)) addPath(paths, path);
      console.log(`+${Object.keys(paths).length - before}`);
    } catch (e) {
      console.log("err", e);
    }
    await sleep(200);
  }

  writeFileSync(OUT, JSON.stringify(paths, null, 2), "utf8");
  console.log(`Saved ${Object.keys(paths).length} paths → ${OUT}`);
}

void main();

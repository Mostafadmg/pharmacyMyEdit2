/**
 * One-shot: parse /treatments HTML for slug → path + sanity image URL.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../../lib/db/src/data/tip-product-images.json");
const BASE = "https://www.theindependentpharmacy.co.uk";

type Entry = { slug: string; path: string; imageUrl: string; name?: string };

function slugFromPath(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return parts[parts.length - 1] ?? null;
}

function pickImage(obj: Record<string, unknown>): string | null {
  const candidates = [
    obj.image,
    obj.heroImage,
    obj.productImage,
    obj.thumbnail,
    obj.mainImage,
    obj.packImage,
  ];
  for (const c of candidates) {
    const url = imageFromNode(c);
    if (url) return url;
  }
  if (obj.imageUrl && typeof obj.imageUrl === "string") return obj.imageUrl;
  return null;
}

function imageFromNode(node: unknown): string | null {
  if (!node) return null;
  if (typeof node === "string" && node.includes("cdn.sanity.io")) return node;
  if (typeof node === "object" && node) {
    const o = node as Record<string, unknown>;
    if (typeof o.url === "string") return o.url;
    if (typeof o.src === "string") return o.src;
    if (o.asset && typeof o.asset === "object") {
      const a = o.asset as Record<string, unknown>;
      if (typeof a.url === "string") return a.url;
    }
  }
  return null;
}

async function main() {
  console.log("Fetching treatments page…");
  const res = await fetch(`${BASE}/treatments`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122",
      Accept: "text/html",
    },
  });
  const html = await res.text();
  console.log("status", res.status, "bytes", html.length);

  const bySlug = new Map<string, Entry>();

  // href="/category/product-slug"
  for (const m of html.matchAll(/href="(\/[a-z0-9-]+\/[a-z0-9][a-z0-9-]*)"/gi)) {
    const path = m[1];
    const slug = slugFromPath(path);
    if (!slug || path.split("/").length !== 3) continue;
    if (path.startsWith("/guides/") || path.startsWith("/brands/")) continue;
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { slug, path, imageUrl: "" });
    }
  }

  // Pair slug paths with nearby sanity product images in HTML chunks
  const pathRe =
    /href="(\/[a-z0-9-]+\/[a-z0-9][a-z0-9-]*)"/gi;
  const imgRe =
    /https:\/\/cdn\.sanity\.io\/images\/[^"'\s\\]+?\.(?:jpg|jpeg|png|webp)/gi;

  let lastIndex = 0;
  for (const m of html.matchAll(pathRe)) {
    const path = m[1];
    const slug = slugFromPath(path);
    if (!slug || !bySlug.has(slug)) continue;
    const start = Math.max(0, (m.index ?? 0) - 800);
    const end = Math.min(html.length, (m.index ?? 0) + 2500);
    const chunk = html.slice(start, end);
    const imgs = [...chunk.matchAll(imgRe)].map((x) => x[0]);
    const productImg = imgs.find(
      (u) =>
        !u.includes("-201x90") &&
        !u.includes("-193x75") &&
        !u.includes("-158x49") &&
        !u.includes("-363x79") &&
        !u.includes("836x371") &&
        !u.includes(".svg"),
    );
    if (productImg) {
      const e = bySlug.get(slug)!;
      e.imageUrl = productImg;
      e.path = path;
    }
    lastIndex = m.index ?? lastIndex;
  }

  const next = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (next) {
    const data = JSON.parse(next[1]);
    const visit = (node: unknown): void => {
      if (node == null) return;
      if (Array.isArray(node)) {
        for (const x of node) visit(x);
        return;
      }
      if (typeof node !== "object") return;
      const o = node as Record<string, unknown>;

      const slug =
        (typeof o.slug === "string" && o.slug) ||
        (typeof o.handle === "string" && o.handle) ||
        null;
      const path =
        (typeof o.path === "string" && o.path.startsWith("/") && o.path) ||
        (typeof o.href === "string" && o.href.startsWith("/") && o.href) ||
        null;

      if (slug) {
        const img = pickImage(o);
        const name =
          typeof o.name === "string"
            ? o.name
            : typeof o.title === "string"
              ? o.title
              : undefined;
        if (img || path) {
          const existing = bySlug.get(slug);
          const entry: Entry = {
            slug,
            path: path ?? existing?.path ?? `/${slug}`,
            imageUrl: img ?? existing?.imageUrl ?? "",
            name: name ?? existing?.name,
          };
          if (img || !existing?.imageUrl) bySlug.set(slug, entry);
        }
      }

      for (const v of Object.values(o)) visit(v);
    };
    visit(data);
  }

  const out: Record<string, { imageUrl: string; path: string; name?: string }> =
    {};
  for (const [slug, e] of bySlug) {
    if (e.imageUrl) {
      out[slug] = { imageUrl: e.imageUrl, path: e.path, name: e.name };
    }
  }

  writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(
    `Paths: ${bySlug.size}, with images: ${Object.keys(out).length} → ${OUT}`,
  );
}

void main();

import { writeFileSync } from "node:fs";

const BASE = "https://www.theindependentpharmacy.co.uk";

async function run() {
  const res = await fetch(`${BASE}/treatments`, {
    headers: { "User-Agent": "Mozilla/5.0 Chrome/122" },
  });
  const html = await res.text();
  const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!next) {
    console.log("no __NEXT_DATA__");
    return;
  }
  const data = JSON.parse(next[1]);

  const samples: unknown[] = [];
  const visit = (node: unknown, keyPath = ""): void => {
    if (samples.length >= 15) return;
    if (node == null) return;
    if (typeof node === "object" && !Array.isArray(node)) {
      const o = node as Record<string, unknown>;
      const keys = Object.keys(o);
      const hasSlug = keys.some((k) => /slug|handle/i.test(k));
      const hasImg = keys.some((k) => /image|photo|thumbnail|asset/i.test(k));
      if (hasSlug && hasImg && keys.length < 40) {
        samples.push({ keyPath, keys, o: JSON.stringify(o).slice(0, 500) });
      }
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < Math.min(node.length, 50); i++) {
        visit(node[i], `${keyPath}[${i}]`);
      }
    } else if (typeof node === "object" && node) {
      for (const [k, v] of Object.entries(node as Record<string, unknown>).slice(
        0,
        80,
      )) {
        visit(v, keyPath ? `${keyPath}.${k}` : k);
      }
    }
  };
  visit(data);
  console.log(JSON.stringify(samples, null, 2));

  // find fucibet in raw json string
  const raw = next[1];
  const idx = raw.indexOf("fucibet");
  if (idx >= 0) {
    writeFileSync("tip-fucibet-snippet.json", raw.slice(idx - 200, idx + 800), "utf8");
    console.log("wrote tip-fucibet-snippet.json at", idx);
  }

  const sanityCount = (raw.match(/cdn\.sanity\.io/g) ?? []).length;
  console.log("sanity mentions in __NEXT_DATA__:", sanityCount);
}

void run();

const BASE = "https://www.theindependentpharmacy.co.uk";

async function run() {
  const res = await fetch(`${BASE}/treatments`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122" },
  });
  const html = await res.text();
  console.log("status", res.status, "len", html.length);

  const next = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (next) {
    const data = JSON.parse(next[1]) as Record<string, unknown>;
    const walk = (node: unknown, depth = 0): void => {
      if (depth > 12 || node == null) return;
      if (typeof node === "object" && !Array.isArray(node)) {
        const o = node as Record<string, unknown>;
        if (o.slug && (o.name || o.title) && (o.image || o.heroImage || o.productImage)) {
          console.log("product?", {
            slug: o.slug,
            name: o.name ?? o.title,
            image: o.image ?? o.heroImage ?? o.productImage,
          });
        }
      }
      if (Array.isArray(node)) {
        for (const x of node.slice(0, 5000)) walk(x, depth + 1);
      } else if (typeof node === "object" && node) {
        for (const v of Object.values(node as Record<string, unknown>).slice(0, 200)) {
          walk(v, depth + 1);
        }
      }
    };
    walk(data);
  }

  const hrefs = [...html.matchAll(/href="(\/[^"]+)"/g)].map((m) => m[1]);
  const uniq = [...new Set(hrefs)].filter(
    (u) => u.includes("fucibet") || u.includes("4head") || u.includes("quickstrip"),
  );
  console.log("matching hrefs", uniq.slice(0, 30));

  const sanity = [...new Set([...html.matchAll(/https:\/\/cdn\.sanity\.io\/[^"'\s\\]+/g)].map((m) => m[0]))];
  console.log("sanity count", sanity.length, "sample", sanity.slice(0, 3));
}

void run();

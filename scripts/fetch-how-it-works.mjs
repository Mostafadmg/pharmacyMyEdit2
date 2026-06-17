const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const idx = html.indexOf("How it");
const chunk = html.slice(idx, idx + 15000);
const imgs = [...chunk.matchAll(/9065\/files\/([^"?]+\.(png|svg))/g)].map((m) => m[1]);
console.log([...new Set(imgs)]);

const titles = [...chunk.matchAll(/pf-heading-1-h3[^>]*>([^<]+)</g)].map((m) => m[1]);
console.log("Titles:", titles);

const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const idx = html.indexOf("How it");
const chunk = html.slice(idx, idx + 20000);
const imgs = [...chunk.matchAll(/9065\/files\/([^"?]+\.png)/g)].map((m) => m[1]);
console.log(imgs);

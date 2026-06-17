const html = await fetch("https://everydaymeds.co.uk/pages/about-us", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const imgs = [...html.matchAll(/9065\/files\/([^"?]+\.(png|svg))/g)].map((m) => m[1]);
console.log("images:", [...new Set(imgs)]);

const texts = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
for (const h of ["About us", "Our Mission", "Our Vision", "Our Values", "Our Regulations"]) {
  const i = texts.indexOf(h);
  if (i > -1) console.log("\n---", h, "---\n", texts.slice(i, i + 800).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500));
}

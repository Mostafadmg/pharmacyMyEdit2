const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
}).then((r) => r.text());

const paths = [...html.matchAll(/\/files\/([A-Za-z0-9_\-().% ]+\.(png|svg|jpg|webp))/gi)].map((m) => m[1]);
const uniquePaths = [...new Set(paths)].sort();

// Extract shop id from first cdn url
const shopMatch = html.match(/cdn\.shopify\.com\/s\/files\/(\d+\/\d+\/\d+)/);
const base = shopMatch
  ? `https://cdn.shopify.com/s/files/${shopMatch[1]}/files/`
  : "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/";

console.log("BASE:", base);
console.log("\nFILES:");
for (const p of uniquePaths) {
  console.log(base + p.replace(/ /g, "%20"));
}

const policies = [
  { slug: "refund-policy", url: "https://everydaymeds.co.uk/policies/refund-policy" },
  { slug: "shipping-policy", url: "https://everydaymeds.co.uk/policies/shipping-policy" },
  { slug: "privacy-policy", url: "https://everydaymeds.co.uk/policies/privacy-policy" },
  { slug: "terms-of-service", url: "https://everydaymeds.co.uk/policies/terms-of-service" },
];

for (const p of policies) {
  const html = await fetch(p.url, { headers: { "User-Agent": "Mozilla/5.0" } }).then((r) => r.text());
  const rte = html.match(/class="shopify-policy__body rte"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
  if (rte) {
    const text = rte.replace(/<[^>]+>/g, "\n").replace(/\n+/g, "\n").trim();
    console.log("\n===", p.slug, "len", text.length, "===");
    console.log(text.slice(0, 600));
  } else {
    console.log("\n===", p.slug, "NO RTE ===");
  }
}

// about page text blocks
const aboutHtml = await fetch("https://everydaymeds.co.uk/pages/about-us", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());
const aboutText = aboutHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
const headings = [...aboutText.matchAll(/>(About us|Our Mission|Our Vision|Our Values|Our Regulations)[^<]*</gi)].map((m) => m[1]);
console.log("\nAbout headings:", headings);

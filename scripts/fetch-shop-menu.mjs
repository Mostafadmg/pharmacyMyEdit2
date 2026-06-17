const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

// Find mega menu medicines section
const idx = html.indexOf("Allergy & Hay Fever");
const chunk = html.slice(idx - 2000, idx + 4000);
const links = [...chunk.matchAll(/href="(\/collections\/[^"]+)"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/g)]
  .map((m) => ({ href: m[1], label: m[2].trim() }));

console.log("Links near medicines menu:", links.slice(0, 25));

// Also extract main categories order
const mainIdx = html.indexOf("Medicines &amp; Treatments");
const mainChunk = html.slice(mainIdx - 500, mainIdx + 3000);
const mainLinks = [...mainChunk.matchAll(/href="(\/collections\/[^"]+)"[^>]*>[\s\S]{0,200}?>([^<]+)</g)]
  .map((m) => ({ href: m[1], label: m[2].replace(/&amp;/g, "&").trim() }));
console.log("\nMain categories:", mainLinks);

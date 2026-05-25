const cats = ["/pain", "/migraine", "/skin-infections", "/general-health", "/vitamins-supplements"];

async function run() {
  for (const cat of cats) {
    const res = await fetch(`https://www.theindependentpharmacy.co.uk${cat}`, {
      headers: { "User-Agent": "Mozilla/5.0 Chrome/122" },
    });
    const html = await res.text();
    const links = [...html.matchAll(/href="(\/[a-z0-9-]+\/[a-z0-9][a-z0-9-]*)"/gi)]
      .map((m) => m[1])
      .filter((p) => p.startsWith(cat + "/"));
    const uniq = [...new Set(links)];
    console.log(cat, res.status, "products", uniq.length, uniq.slice(0, 5));
  }
}

void run();

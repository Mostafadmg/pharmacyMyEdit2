const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" },
}).then((r) => r.text());

for (const term of ["header__right", "header-icon", "header__search", "account-icon", "cart-icon", "header-actions", "icon-account"]) {
  const i = html.indexOf(term);
  if (i > -1) console.log(term, html.slice(i, i + 300).replace(/\s+/g, " "));
}

// mobile header row structure - find after navigation closes
const searchIdx = html.indexOf("I'm looking for");
console.log("\nSEARCH AREA:", html.slice(searchIdx - 800, searchIdx + 400).replace(/\s+/g, " "));

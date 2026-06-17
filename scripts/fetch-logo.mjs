const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const logoIdx = html.indexOf("EDM_LOGO");
console.log(html.slice(logoIdx - 500, logoIdx + 800));

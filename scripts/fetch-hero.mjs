const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const idx = html.indexOf("Group_469353");
console.log(html.slice(idx - 2000, idx + 3000));

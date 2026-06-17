const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const i = html.indexOf("Frame_1321316515");
console.log(html.slice(i - 500, i + 1500));

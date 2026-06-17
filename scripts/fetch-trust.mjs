const html = await fetch("https://everydaymeds.co.uk/", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

for (const f of ["Vector_7.svg", "Vector_9.svg", "Vector_10.svg", "Frame_1.svg"]) {
  const i = html.indexOf(f);
  console.log(f, i > -1 ? html.slice(i - 200, i + 300).replace(/\s+/g, " ").slice(0, 400) : "NOT FOUND");
}

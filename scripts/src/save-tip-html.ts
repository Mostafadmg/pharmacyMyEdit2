import { writeFileSync } from "node:fs";

const res = await fetch("https://www.theindependentpharmacy.co.uk/treatments", {
  headers: { "User-Agent": "Mozilla/5.0 Chrome/122" },
});
const html = await res.text();
writeFileSync("tip-treatments.html", html, "utf8");
console.log("saved", html.length);

const idx = html.indexOf("fucibet-cream");
console.log("fucibet idx", idx);
if (idx >= 0) console.log(html.slice(idx - 300, idx + 1200));

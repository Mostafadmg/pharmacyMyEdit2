import { writeFileSync } from "node:fs";

const slug = process.argv[2] ?? "fucibet-cream";
const BASE = "https://www.theindependentpharmacy.co.uk";

async function run() {
  for (const path of [`/${slug}`, `/treatments/${slug}`]) {
    const url = BASE + path;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122" },
    });
    const html = await res.text();
    writeFileSync(`tip-probe-${path.replace(/\//g, "_")}.html`, html, "utf8");
    console.log(path, res.status, html.length);
    const imgs = [...html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi)];
    console.log("sample imgs", imgs.slice(0, 8).map((m) => m[0]));
  }
}

void run();

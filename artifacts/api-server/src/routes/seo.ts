import { Router, type IRouter } from "express";
import { db, conditionsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const STATIC_URLS: Array<{ path: string; changefreq: string; priority: number }> = [
  { path: "/", changefreq: "weekly", priority: 1.0 },
  { path: "/conditions", changefreq: "weekly", priority: 0.9 },
  { path: "/shop", changefreq: "daily", priority: 0.9 },
  { path: "/health-hub", changefreq: "weekly", priority: 0.9 },
  { path: "/treatments/weight-loss", changefreq: "weekly", priority: 0.9 },
  { path: "/treatments/erectile-dysfunction", changefreq: "weekly", priority: 0.9 },
  { path: "/treatments/hair-loss", changefreq: "weekly", priority: 0.8 },
  { path: "/treatments/hayfever", changefreq: "weekly", priority: 0.8 },
  { path: "/about/our-service", changefreq: "monthly", priority: 0.5 },
  { path: "/about/regulatory", changefreq: "monthly", priority: 0.5 },
  { path: "/about/safeguarding", changefreq: "monthly", priority: 0.5 },
  { path: "/contact", changefreq: "monthly", priority: 0.4 },
  { path: "/feedback", changefreq: "monthly", priority: 0.3 },
  { path: "/legal/terms", changefreq: "yearly", priority: 0.3 },
  { path: "/legal/privacy", changefreq: "yearly", priority: 0.3 },
  { path: "/legal/cookies", changefreq: "yearly", priority: 0.2 },
];

const HEALTH_HUB_SLUGS = [
  "mounjaro-vs-wegovy-uk-2026",
  "do-glp1-injections-cause-muscle-loss",
  "hayfever-uk-pollen-2026",
  "acne-vs-rosacea-tell-difference",
  "ed-treatment-uk-options",
  "uti-women-when-to-treat",
  "sleep-hygiene-melatonin-uk",
  "creatine-vitamin-d-uk-deficiency",
];

const escapeXml = (raw: string) =>
  raw.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] ?? c));

// Resolve the public-facing origin for canonical sitemap URLs.
// Prefers REPLIT_DOMAINS (production), then forwarded host, then the request host.
const resolvePublicOrigin = (req: { protocol: string; get: (h: string) => string | undefined }): string => {
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const first = replitDomains.split(",")[0]?.trim();
    if (first) return `https://${first}`;
  }
  const proto = (req.get("x-forwarded-proto") ?? req.protocol ?? "https").split(",")[0]!.trim();
  const host = req.get("x-forwarded-host") ?? req.get("host") ?? "localhost";
  return `${proto}://${host}`;
};

router.get("/sitemap.xml", async (req, res): Promise<void> => {
  try {
    const baseUrl = resolvePublicOrigin(req);
    const today = new Date().toISOString().split("T")[0];

    const [conditions, products] = await Promise.all([
      db.select({ id: conditionsTable.id }).from(conditionsTable).where(eq(conditionsTable.active, true)),
      db.select({ slug: productsTable.slug }).from(productsTable).where(eq(productsTable.active, true)),
    ]);

    const urls: string[] = [];
    for (const u of STATIC_URLS) {
      urls.push(
        `<url><loc>${escapeXml(baseUrl + u.path)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority.toFixed(1)}</priority><lastmod>${today}</lastmod></url>`,
      );
    }
    for (const c of conditions) {
      urls.push(
        `<url><loc>${escapeXml(`${baseUrl}/conditions/${c.id}`)}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
      );
    }
    for (const p of products) {
      urls.push(
        `<url><loc>${escapeXml(`${baseUrl}/product/${p.slug}`)}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
      );
    }
    for (const slug of HEALTH_HUB_SLUGS) {
      urls.push(
        `<url><loc>${escapeXml(`${baseUrl}/health-hub/${slug}`)}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    req.log.error({ err }, "Failed to build sitemap");
    res.status(500).send("<?xml version=\"1.0\"?><error/>");
  }
});

export default router;

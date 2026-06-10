import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const SITE_NAME = "EveryDayMeds";
const DEFAULT_DESCRIPTION =
  "EveryDayMeds is a UK-registered online pharmacy. Get private prescriptions and pharmacy products with free next-day delivery, reviewed by GPhC-registered pharmacist independent prescribers.";

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const removeJsonLd = () => {
  document.head.querySelectorAll('script[data-managed="seo-jsonld"]').forEach((n) => n.remove());
};

export function useSeo(opts: SeoOptions): void {
  useEffect(() => {
    const fullTitle = opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const desc = opts.description ?? DEFAULT_DESCRIPTION;
    upsertMeta('meta[name="description"]', { name: "description", content: desc });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: desc });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: desc });

    if (opts.ogImage) {
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: opts.ogImage });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: opts.ogImage });
    }

    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: opts.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    });

    if (opts.canonicalPath) {
      const origin = window.location.origin;
      upsertLink("canonical", `${origin}${opts.canonicalPath}`);
    }

    removeJsonLd();
    if (opts.jsonLd) {
      const list = Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd];
      for (const blob of list) {
        const script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        script.setAttribute("data-managed", "seo-jsonld");
        script.textContent = JSON.stringify(blob);
        document.head.appendChild(script);
      }
    }
    return () => {
      removeJsonLd();
    };
  }, [opts.title, opts.description, opts.canonicalPath, opts.ogImage, opts.noindex, JSON.stringify(opts.jsonLd ?? null)]);
}

import React from "react";
import { useParams } from "wouter";
import NotFound from "@/pages/not-found";
import EverydayMedsTreatmentPage from "@/components/marketing/EverydayMedsTreatmentPage";
import { getTreatmentPage } from "@/data/treatmentPages";
import { HAIR_LOSS_PAGE } from "@/data/everydaymedsSite";
import { useSeo } from "@/hooks/useSeo";

export default function TreatmentLanding() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? getTreatmentPage(slug) : undefined;

  useSeo(
    page
      ? {
          title: page.metaTitle,
          description: page.metaDescription,
          canonicalPath: `/treatments/${page.slug}`,
        }
      : { title: "Treatment not found", noindex: true },
  );

  if (slug === "hair-loss") {
    return (
      <EverydayMedsTreatmentPage
        title={HAIR_LOSS_PAGE.title}
        subtitle={HAIR_LOSS_PAGE.subtitle}
        bullets={[...HAIR_LOSS_PAGE.bullets]}
        ctaHref={HAIR_LOSS_PAGE.ctaHref}
        ctaSubtext="Takes less than 3 minutes to complete, 100% online"
        aboutTitle={HAIR_LOSS_PAGE.aboutTitle}
        aboutParagraphs={[...HAIR_LOSS_PAGE.aboutParagraphs]}
        products={[...HAIR_LOSS_PAGE.products]}
        faqs={[...HAIR_LOSS_PAGE.faqs]}
      />
    );
  }

  if (!page) return <NotFound />;

  return (
    <EverydayMedsTreatmentPage
      title={page.hero.title}
      subtitle={page.hero.subtitle}
      bullets={page.options.slice(0, 3).map((o) => o.blurb)}
      ctaHref={`/conditions/${page.conditionId}`}
      ctaLabel={page.hero.primaryCta}
      aboutTitle={`About ${page.hero.title}`}
      aboutParagraphs={[page.intro]}
      products={page.options.map((o) => ({
        name: o.name,
        priceFrom: o.pricePerMonth,
        href: `/conditions/${page.conditionId}`,
      }))}
      faqs={page.faq}
    />
  );
}

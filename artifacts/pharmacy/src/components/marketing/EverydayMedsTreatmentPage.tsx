import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, Check } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";
import GphcTrustSection from "@/components/marketing/GphcTrustSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type TreatmentProductCard = {
  name: string;
  priceFrom: string;
  href?: string;
};

export type TreatmentFaq = { q: string; a: string };

type EverydayMedsTreatmentPageProps = {
  title: string;
  subtitle: string;
  bullets: string[];
  ctaHref: string;
  ctaLabel?: string;
  ctaSubtext?: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  productsTitle?: string;
  products: TreatmentProductCard[];
  faqs: TreatmentFaq[];
  faqHeading?: string;
  showTrustSections?: boolean;
  extraSections?: React.ReactNode;
};

export default function EverydayMedsTreatmentPage({
  title,
  subtitle,
  bullets,
  ctaHref,
  ctaLabel = "Start your free consultation",
  ctaSubtext = "Takes less than 2 minutes to complete, 100% online",
  aboutTitle,
  aboutParagraphs,
  productsTitle = "Available Treatments",
  products,
  faqs,
  faqHeading = "Frequently asked questions",
  showTrustSections = true,
  extraSections,
}: EverydayMedsTreatmentPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <SiteLayout className="min-h-screen flex flex-col bg-white font-sans">
      <main className="flex-1">
        <section className="border-b border-border/50 bg-gradient-to-b from-muted/20 to-white py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-secondary leading-tight">{title}</h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">{subtitle}</p>
            <ul className="mt-8 space-y-2 text-left max-w-xl mx-auto">
              {bullets.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm md:text-base text-foreground/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button asChild size="lg" className="rounded-full bg-primary px-8 font-bold hover:bg-primary/90">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">{ctaSubtext}</p>
            </div>
          </div>
        </section>

        {extraSections}

        <section className="py-14 bg-muted/20 border-y border-border/40">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-secondary mb-6">{aboutTitle}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {aboutParagraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-secondary text-center mb-3">{productsTitle}</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
              Choose from a wide range of clinically-proven, safe, and effective treatments.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.name} className="border-border/70 hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-secondary">{product.name}</h3>
                    <p className="mt-2 text-xl font-extrabold text-primary">{product.priceFrom}</p>
                    <Button asChild variant="outline" className="mt-auto rounded-full border-primary text-primary hover:bg-primary/5">
                      <Link href={product.href ?? ctaHref}>Start consultation</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {showTrustSections ? (
          <>
            <HowItWorksSection />
            <section className="bg-primary py-14 text-primary-foreground">
              <div className="mx-auto max-w-3xl px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3">Start your journey to better health today.</h2>
                <p className="text-primary-foreground/85 mb-8">
                  Once you complete a short online assessment, you&apos;ll be able to choose your preferred treatment from safe, medically approved options tailored to you.
                </p>
                <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-bold">
                  <Link href={ctaHref}>{ctaLabel}</Link>
                </Button>
                <p className="mt-4 text-sm text-primary-foreground/75">
                  Returning customer?{" "}
                  <Link href="/my-account/login" className="underline font-semibold hover:text-white">
                    Log in to Your Account
                  </Link>
                </p>
              </div>
            </section>
          </>
        ) : null}

        <section className="py-14 bg-muted/20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-secondary">{faqHeading}</h2>
              <p className="mt-2 text-muted-foreground">Everything you need to know about this clinic</p>
            </div>
            <div className="space-y-3">
              {faqs.map((f, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={f.q} className={`rounded-2xl border border-border bg-white overflow-hidden ${isOpen ? "shadow-md" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/30"
                    >
                      <span className="font-semibold text-secondary">{f.q}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
                    </button>
                    {isOpen ? (
                      <div className="border-t border-border/50 px-6 pb-6 pt-4 text-muted-foreground leading-relaxed">{f.a}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {showTrustSections ? <GphcTrustSection /> : null}
      </main>
    </SiteLayout>
  );
}

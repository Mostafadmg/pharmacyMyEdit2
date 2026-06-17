import React, { useState } from "react";
import { Link } from "wouter";
import EverydayMedsTreatmentPage from "@/components/marketing/EverydayMedsTreatmentPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PROMO_COPY, WEIGHT_LOSS_PAGE } from "@/data/everydaymedsSite";

function WeightLossPricingSection() {
  const [activeTab, setActiveTab] = useState<"mounjaro" | "wegovy">("mounjaro");

  return (
    <section className="py-14 bg-white border-y border-border/40">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Live Pricing</p>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-secondary mb-3">Our Pricing</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Pricing Disclaimer: Prices on some pages may not be up to date. The live pricing table below and the pricing shown during your consultation are our official current prices and take precedence over any other figures displayed on the site.
        </p>

        <div className="flex gap-2 mb-6">
          {(["mounjaro", "wegovy"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-secondary hover:bg-muted/80"
              }`}
            >
              {tab === "mounjaro" ? "Mounjaro (Tirzepatide)" : "Wegovy (Semaglutide)"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {["Single Pen", "2 Pen Bundle", "3 Pen Bundle"].map((label, i) => (
            <Card key={label} className="border-border/70">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-secondary">{label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {i === 0 ? "1 pen • 4 Week" : i === 1 ? "2 pens • 8 Week" : "3 pens • 12 Week"}
                </p>
                <p className="mt-4 text-lg font-extrabold text-primary">
                  {activeTab === "mounjaro" ? "See consultation" : "See consultation"}
                </p>
                <Button asChild variant="outline" className="mt-4 rounded-full w-full border-primary text-primary">
                  <Link href="/treatments/weight-loss/choose">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-bold text-secondary mb-2">EveryDayClub membership</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Free for a limited time — includes £25 OFF EVERY DOSE, priority approval, and free next-day delivery.
              </p>
              <Button asChild className="mt-4 rounded-full bg-primary">
                <Link href="/treatments/weight-loss/choose">Join now</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <h3 className="font-bold text-secondary mb-2">£30 OFF Your FIRST Order</h3>
              <p className="text-sm text-muted-foreground">
                Use code <strong className="font-mono text-amber-800">{PROMO_COPY.couponCode}</strong> at checkout.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default function WeightLoss() {
  return (
    <EverydayMedsTreatmentPage
      title={WEIGHT_LOSS_PAGE.title}
      subtitle={WEIGHT_LOSS_PAGE.subtitle}
      bullets={[...WEIGHT_LOSS_PAGE.bullets]}
      ctaHref={WEIGHT_LOSS_PAGE.ctaHref}
      ctaSubtext="Takes less than 2 minutes to complete, 100% online"
      aboutTitle={WEIGHT_LOSS_PAGE.aboutTitle}
      aboutParagraphs={[...WEIGHT_LOSS_PAGE.aboutParagraphs]}
      products={[...WEIGHT_LOSS_PAGE.products]}
      faqs={[...WEIGHT_LOSS_PAGE.faqs]}
      extraSections={<WeightLossPricingSection />}
    />
  );
}

import React, { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, CheckCircle2, ShieldCheck, Stethoscope, Truck, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NotFound from "@/pages/not-found";
import { getTreatmentPage } from "@/data/treatmentPages";
import { useSeo } from "@/hooks/useSeo";

export default function TreatmentLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const page = slug ? getTreatmentPage(slug) : undefined;

  useSeo(page ? {
    title: page.metaTitle,
    description: page.metaDescription,
    canonicalPath: `/treatments/${page.slug}`,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        name: page.metaTitle,
        description: page.metaDescription,
        about: { "@type": "MedicalCondition", name: page.hero.title },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  } : { title: "Treatment not found", noindex: true });

  if (!page) return <NotFound />;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary via-[#0E5A52] to-primary text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 25% 25%, white 0, transparent 40%), radial-gradient(circle at 75% 75%, white 0, transparent 40%)" }}
        />
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-semibold mb-5">
              <ShieldCheck className="w-4 h-4" /> {page.hero.eyebrow}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-5" data-testid="treatment-hero-title">
              {page.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">{page.hero.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate(`/conditions/${page.conditionId}`)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-full px-7 h-12 shadow-lg"
                data-testid="treatment-hero-cta"
              >
                {page.hero.primaryCta} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-full px-7 h-12"
              >
                <a href="#options">Compare options</a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Free tracked next-day delivery</span>
              <span className="flex items-center gap-1.5"><Stethoscope className="w-4 h-4" /> GPhC-registered prescribers</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Reviewed in hours</span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-lg md:text-xl text-foreground/85 leading-relaxed">{page.intro}</p>
        </div>
      </section>

      {/* Options */}
      <section id="options" className="bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Compare your options</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All treatments below are licensed in the UK and prescribed by our pharmacist team. The right one for
              you will be confirmed in your consultation.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {page.options.map((o, i) => (
              <motion.div
                key={o.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="h-full rounded-3xl border-border hover:shadow-lg hover:border-primary/40 transition-all bg-white">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-secondary">{o.name}</h3>
                        {o.generic && <p className="text-sm text-muted-foreground">{o.generic}</p>}
                      </div>
                      {o.badge && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${o.badgeTone ?? "bg-primary/10 text-primary"}`}>
                          {o.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-extrabold text-primary mb-3">{o.pricePerMonth}</p>
                    <p className="text-sm text-foreground/80 mb-4 flex-1">{o.blurb}</p>
                    <ul className="space-y-1.5 mb-5">
                      {o.bullets.map((b) => (
                        <li key={b} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => navigate(`/conditions/${page.conditionId}`)}
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                      data-testid={`treatment-option-cta-${o.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                    >
                      Start consultation <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Why patients choose PharmaCare</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {page.benefits.map((b) => (
              <div key={b.title} className="bg-muted/30 rounded-2xl border border-border p-6">
                <div className="text-4xl mb-3">{b.emoji}</div>
                <h3 className="font-bold text-secondary mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Frequently asked</h2>
          </div>
          <div className="space-y-3">
            {page.faq.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`border border-border rounded-2xl overflow-hidden bg-white transition-shadow ${isOpen ? "shadow-md" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-muted/30 transition-colors"
                    data-testid={`treatment-faq-toggle-${i}`}
                  >
                    <span className="font-semibold text-secondary text-lg">{f.q}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-muted-foreground leading-relaxed border-t border-border/50 pt-4">{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-secondary text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Start your consultation today</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            10 minutes online, reviewed by a UK pharmacist independent prescriber, dispatched same-day with free
            next-day delivery.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(`/conditions/${page.conditionId}`)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 h-14 font-bold"
          >
            {page.hero.primaryCta} <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

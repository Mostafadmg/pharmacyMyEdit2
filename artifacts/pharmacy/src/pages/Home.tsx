import React from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PromoBanner from "@/components/PromoBanner";
import CategoryCardGrid from "@/components/marketing/CategoryCardGrid";
import GphcTrustSection from "@/components/marketing/GphcTrustSection";
import HowItWorksSection from "@/components/marketing/HowItWorksSection";
import HomeFAQ from "@/components/HomeFAQ";
import { Button } from "@/components/ui/button";
import {
  SHOP_CATEGORY_CARDS,
  TREATMENT_GOAL_CARDS,
} from "@/data/everydaymedsSite";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <PromoBanner />
      <Header />

      <main className="flex-1 w-full">
        <section className="border-b border-border/50 bg-gradient-to-b from-white to-muted/20 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-secondary mb-4">
              How can we assist you today?
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground leading-relaxed">
              Discover all your healthcare essentials, conveniently organised into categories for easy browsing and shopping.
            </p>
          </div>
        </section>

        <section className="py-14 md:py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <CategoryCardGrid
              items={TREATMENT_GOAL_CARDS}
              columns={4}
              showTagline
              testIdPrefix="home-treatment"
            />
          </div>
        </section>

        <section className="py-14 md:py-16 bg-muted/20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif font-bold text-secondary">
                Explore treatments for your health goals
              </h2>
            </div>
            <CategoryCardGrid
              items={SHOP_CATEGORY_CARDS}
              columns={3}
              testIdPrefix="home-shop"
            />
          </div>
        </section>

        <GphcTrustSection />
        <HowItWorksSection />

        <HomeFAQ variant="live" />

        <section className="bg-secondary py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-serif font-bold text-white mb-4">
              Start your free consultation
            </h2>
            <p className="text-white/80 mb-8">
              Takes less than 2 minutes to complete, 100% online.
            </p>
            <Button
              size="lg"
              className="rounded-full bg-accent px-10 text-accent-foreground hover:bg-accent/90 font-bold"
              asChild
              data-testid="home-start-consultation"
            >
              <Link href="/conditions">Start consultation</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

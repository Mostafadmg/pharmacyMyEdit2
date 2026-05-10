import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Search, Clock, BookOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HEALTH_ARTICLES, HEALTH_CATEGORIES } from "@/data/healthHub";
import { useSeo } from "@/hooks/useSeo";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function HealthHub() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useSeo({
    title: "Health Hub — pharmacist-written guides & advice",
    description:
      "Evidence-based UK pharmacy guides on weight loss, sexual health, skin, allergies and everyday wellbeing — written and reviewed by GPhC-registered pharmacists.",
    canonicalPath: "/health-hub",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "PharmaCare Health Hub",
      description: "Pharmacist-written guides to UK private prescriptions and everyday medicines.",
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HEALTH_ARTICLES.filter((a) => {
      if (activeCategory && a.category !== activeCategory) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-secondary via-[#0E5A52] to-primary text-white py-20">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-sm font-semibold mb-5">
              <BookOpen className="w-4 h-4" /> Health Hub
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-5 tracking-tight">
              Honest, pharmacist-written guides
            </h1>
            <p className="text-lg text-white/85 max-w-2xl mx-auto mb-8 leading-relaxed">
              Plain-English articles on every condition we treat — from weight loss and ED, to hayfever and adult acne.
              Written and reviewed by our GPhC-registered pharmacist team.
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles… e.g. mounjaro, hayfever, melatonin"
                className="pl-12 h-14 rounded-full bg-white text-foreground border-0 shadow-lg"
                data-testid="input-health-hub-search"
              />
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-10 -mx-1 px-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all ${
                activeCategory === null
                  ? "bg-secondary border-secondary text-white shadow-sm"
                  : "bg-white border-border text-foreground hover:border-secondary/40"
              }`}
              data-testid="health-hub-category-all"
            >
              All topics
            </button>
            {HEALTH_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all ${
                  activeCategory === c
                    ? "bg-secondary border-secondary text-white shadow-sm"
                    : "bg-white border-border text-foreground hover:border-secondary/40"
                }`}
                data-testid={`health-hub-category-${c.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {c}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-border">
              <p className="text-muted-foreground mb-4">No articles match your search.</p>
              <Button onClick={() => { setQuery(""); setActiveCategory(null); }} variant="outline" className="rounded-full">
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              {featured && (
                <Link href={`/health-hub/${featured.slug}`}>
                  <motion.article
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group cursor-pointer mb-12 bg-white rounded-3xl border border-border overflow-hidden hover:shadow-xl transition-all grid md:grid-cols-2 gap-0"
                    data-testid={`featured-article-${featured.slug}`}
                  >
                    <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/15 flex items-center justify-center p-12 text-9xl">
                      {featured.heroEmoji}
                    </div>
                    <div className="p-8 md:p-10 flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                        Featured · {featured.category}
                      </span>
                      <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-4 group-hover:text-primary transition-colors leading-tight">
                        {featured.title}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed mb-6 flex-1">{featured.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/60">
                        <div>
                          <span className="font-semibold text-secondary">{featured.author}</span>
                          <span className="hidden sm:inline"> · {featured.authorRole}</span>
                        </div>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {featured.readMins} min</span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((a, i) => (
                  <Link key={a.slug} href={`/health-hub/${a.slug}`}>
                    <motion.article
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group cursor-pointer h-full bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
                      data-testid={`article-card-${a.slug}`}
                    >
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center text-7xl">
                        {a.heroEmoji}
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2.5">{a.category}</span>
                        <h3 className="font-bold text-secondary text-lg leading-snug mb-2.5 group-hover:text-primary transition-colors">
                          {a.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3 mb-4">{a.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
                          <span>{formatDate(a.publishedAt)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {a.readMins} min</span>
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <section className="bg-secondary text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-3">Got a question we haven't covered?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Send us a topic suggestion and our pharmacist team will write a response within two weeks.
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full">
              <Link href="/contact">Suggest a topic <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

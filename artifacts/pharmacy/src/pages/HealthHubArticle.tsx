import React from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock, ShieldCheck, Info, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import { getArticle, getRelatedArticles } from "@/data/healthHub";
import { useSeo } from "@/hooks/useSeo";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const calloutStyles: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  info: { bg: "bg-blue-50", border: "border-blue-200", icon: Info, iconColor: "text-blue-600" },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, iconColor: "text-amber-600" },
  tip: { bg: "bg-emerald-50", border: "border-emerald-200", icon: Lightbulb, iconColor: "text-emerald-600" },
};

export default function HealthHubArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticle(slug) : undefined;

  useSeo(article ? {
    title: article.title,
    description: article.excerpt,
    canonicalPath: `/health-hub/${article.slug}`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.excerpt,
      author: { "@type": "Person", name: article.author, jobTitle: article.authorRole },
      publisher: { "@type": "Organization", name: "EveryDayMeds", logo: { "@type": "ImageObject", url: "/logo.png" } },
      datePublished: article.publishedAt,
      mainEntityOfPage: { "@type": "WebPage", "@id": `/health-hub/${article.slug}` },
    },
  } : { title: "Article not found", noindex: true });

  if (!article) return <NotFound />;
  const related = getRelatedArticles(article.slug);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-white to-accent/10 py-12 md:py-16 border-b border-border">
          <div className="max-w-3xl mx-auto px-6">
            <Link href="/health-hub" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Health Hub
            </Link>
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-4">
              {article.category}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-secondary leading-tight mb-5" data-testid="article-title">
              {article.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">{article.excerpt}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground border-t border-border pt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {article.author.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-secondary">{article.author}</div>
                  <div className="text-xs">{article.authorRole}</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {article.readMins} min read</span>
              <span>Published {formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <div className="text-9xl text-center mb-12 select-none">{article.heroEmoji}</div>
          <div className="prose prose-lg prose-headings:font-serif prose-headings:text-secondary prose-h2:text-3xl prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-foreground/80 prose-li:text-foreground/80 max-w-none">
            {article.body.map((block, i) => {
              if (block.type === "p") return <p key={i}>{block.text}</p>;
              if (block.type === "h2") return <h2 key={i}>{block.text}</h2>;
              if (block.type === "h3") return <h3 key={i}>{block.text}</h3>;
              if (block.type === "ul") return (
                <ul key={i}>
                  {block.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              );
              if (block.type === "callout") {
                const s = calloutStyles[block.tone];
                const Icon = s.icon;
                return (
                  <div key={i} className={`not-prose flex items-start gap-3 my-6 p-5 rounded-2xl border ${s.bg} ${s.border}`}>
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${s.iconColor}`} />
                    <p className="text-sm font-medium text-foreground/90 leading-relaxed m-0">{block.text}</p>
                  </div>
                );
              }
              if (block.type === "quote") return (
                <blockquote key={i}>
                  {block.text}
                  {block.cite && <cite className="block mt-2 text-sm text-muted-foreground not-italic">— {block.cite}</cite>}
                </blockquote>
              );
              return null;
            })}
          </div>

          <div className="mt-12 p-6 rounded-2xl border border-border bg-muted/40 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-secondary mb-1">Medically reviewed</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This article was written and reviewed by GPhC-registered UK pharmacists. It is for general
                information and is not a substitute for personalised medical advice. If you are unwell, please
                consult a clinician.
              </p>
            </div>
          </div>

          {(article.relatedConditionId || article.relatedTreatmentSlug) && (
            <div className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-primary to-secondary text-white text-center">
              <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3">Ready to start treatment?</h2>
              <p className="text-white/85 mb-6 max-w-xl mx-auto">
                Our pharmacist independent prescribers can review your case and dispatch your medicine
                with free next-day delivery.
              </p>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full">
                <Link href={article.relatedTreatmentSlug ? `/treatments/${article.relatedTreatmentSlug}` : `/conditions/${article.relatedConditionId}`}>
                  Start consultation <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="bg-muted/30 border-t border-border py-16">
            <div className="max-w-5xl mx-auto px-6">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-secondary mb-8">Keep reading</h2>
              <div className="grid md:grid-cols-3 gap-5">
                {related.map((r) => (
                  <Link key={r.slug} href={`/health-hub/${r.slug}`}>
                    <article className="group cursor-pointer h-full bg-white rounded-2xl border border-border overflow-hidden hover:shadow-md transition-all flex flex-col">
                      <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-6xl">{r.heroEmoji}</div>
                      <div className="p-5 flex-1 flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-2">{r.category}</span>
                        <h3 className="font-bold text-secondary leading-snug group-hover:text-primary transition-colors mb-2">{r.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{r.excerpt}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

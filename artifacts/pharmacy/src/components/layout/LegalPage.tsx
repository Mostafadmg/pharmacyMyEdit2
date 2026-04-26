import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { ShieldCheck } from "lucide-react";

interface LegalPageProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, subtitle, lastUpdated = "April 2026", children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-br from-secondary to-secondary/80 text-white py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4" /> GPhC-aligned policy
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">{title}</h1>
            {subtitle && <p className="text-lg text-white/80 max-w-2xl">{subtitle}</p>}
            <p className="text-sm text-white/60 mt-6">Last updated: {lastUpdated}</p>
          </div>
        </div>

        {/* Content */}
        <article className="max-w-4xl mx-auto py-14 px-6 prose prose-slate max-w-none
          prose-headings:font-serif prose-headings:text-secondary
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-5 prose-h2:font-bold
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:font-bold
          prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-base
          prose-li:text-slate-700 prose-li:leading-relaxed
          prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
          prose-strong:text-secondary prose-strong:font-bold">
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}

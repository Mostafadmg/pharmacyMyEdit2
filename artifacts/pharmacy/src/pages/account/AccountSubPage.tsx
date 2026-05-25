import React from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * Reusable shell for account sub-pages so each page only declares its title
 * + body. Keeps breadcrumbs, layout and chrome consistent everywhere.
 */
export function AccountSubPage({
  parents,
  title,
  intro,
  children,
}: {
  parents: Array<{ label: string; href: string }>;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-6 py-8 md:py-12">
        <nav className="flex items-center text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/" className="hover:text-primary">Home</Link>
          {parents.map((p, i) => (
            <React.Fragment key={p.href}>
              <span className="mx-2">/</span>
              <Link href={p.href} className="hover:text-primary inline-flex items-center gap-1">
                {i === parents.length - 1 && <ChevronLeft className="w-4 h-4" />}
                {p.label}
              </Link>
            </React.Fragment>
          ))}
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">{title}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary">{title}</h1>
        {intro && <p className="text-muted-foreground mt-1 max-w-2xl">{intro}</p>}

        <div className="mt-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

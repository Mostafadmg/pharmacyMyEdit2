import React, { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";

const STORAGE_KEY = "pharmacare:cookie-consent:v1";

type Choice = "all" | "essential" | null;

export default function CookieBanner() {
  const [choice, setChoice] = useState<Choice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Choice;
      if (stored === "all" || stored === "essential") {
        setChoice(stored);
      }
    } catch {
      // ignore — sandboxed iframes may block storage
    }
  }, []);

  const accept = (c: Exclude<Choice, null>) => {
    setChoice(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignore
    }
  };

  if (!mounted || choice !== null) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-6 pb-3 sm:pb-6 pr-3 sm:pr-24 pointer-events-none"
      role="region"
      aria-label="Cookie consent"
      data-testid="cookie-banner"
    >
      <div className="max-w-5xl mx-auto bg-secondary text-secondary-foreground rounded-2xl shadow-2xl border border-secondary-foreground/10 pointer-events-auto overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start gap-5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-base mb-1">We value your privacy</h3>
              <p className="text-secondary-foreground/80 text-sm leading-relaxed">
                We use essential cookies to keep PharmaCare secure, and optional analytics cookies to improve our service.
                See our{" "}
                <Link href="/legal/cookies" className="text-primary hover:underline font-medium">
                  Cookie Policy
                </Link>{" "}
                for details. You can change your choice any time.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => accept("essential")}
              className="px-4 py-2.5 rounded-full text-sm font-semibold border border-secondary-foreground/30 text-white hover:bg-white/5 transition-colors"
              data-testid="cookie-essential"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => accept("all")}
              className="px-5 py-2.5 rounded-full text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-md"
              data-testid="cookie-accept-all"
            >
              Accept all
            </button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => accept("essential")}
              className="hidden md:inline-flex w-8 h-8 items-center justify-center text-secondary-foreground/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

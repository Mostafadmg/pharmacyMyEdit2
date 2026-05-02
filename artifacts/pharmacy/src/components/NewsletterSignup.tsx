import React, { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || email.length < 6) {
      setStatus("error");
      return;
    }
    // Frontend-only stub — would post to /api/newsletter in production
    setStatus("success");
    setEmail("");
  };

  return (
    <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Health Tips Newsletter</h3>
      </div>
      <p className="text-secondary-foreground/75 text-sm mb-4 leading-relaxed">
        Practical, evidence-based health advice from our UK pharmacists. One email a month, never more. Unsubscribe any
        time.
      </p>

      {status === "success" ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/15 border border-primary/30 text-white text-sm"
          data-testid="newsletter-success"
        >
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Thanks — you're subscribed. Check your inbox to confirm.
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2" data-testid="newsletter-form">
          <input
            type="email"
            value={email}
            required
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder="you@example.com"
            aria-label="Email address"
            className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-white/5 border border-secondary-foreground/20 text-white placeholder:text-secondary-foreground/40 focus:outline-none focus:border-primary text-sm"
            data-testid="newsletter-email"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shrink-0"
            data-testid="newsletter-submit"
          >
            Subscribe
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="text-red-300 text-xs mt-2" role="alert">
          Please enter a valid email address.
        </p>
      )}
      <p className="text-secondary-foreground/55 text-[11px] mt-3 leading-relaxed">
        By subscribing you agree to our{" "}
        <a href="/legal/privacy" className="underline hover:text-primary">
          Privacy Policy
        </a>
        . We will never sell your data.
      </p>
    </div>
  );
}

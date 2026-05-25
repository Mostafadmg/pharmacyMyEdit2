import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || email.length < 6) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <p
        className="flex items-center gap-2 text-sm text-white/90"
        data-testid="newsletter-success"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
        Subscribed — check your inbox to confirm.
      </p>
    );
  }

  if (compact) {
    return (
      <form
        onSubmit={submit}
        className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-center"
        data-testid="newsletter-form"
      >
        <label className="sr-only" htmlFor="newsletter-email">
          Email for newsletter
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          required
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Email for health tips"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          data-testid="newsletter-email"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          data-testid="newsletter-submit"
        >
          Subscribe
        </button>
        {status === "error" ? (
          <p className="text-xs text-red-300 sm:absolute sm:mt-12" role="alert">
            Enter a valid email.
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-white/75 leading-relaxed">
        Monthly health tips from our pharmacists. Unsubscribe anytime.
      </p>
      <form
        onSubmit={submit}
        className="flex flex-col gap-2 sm:flex-row"
        data-testid="newsletter-form"
      >
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
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
          data-testid="newsletter-email"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          data-testid="newsletter-submit"
        >
          Subscribe
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-red-300" role="alert">
          Please enter a valid email address.
        </p>
      )}
      <p className="mt-2 text-[11px] text-white/45">
        See our{" "}
        <a href="/legal/privacy" className="underline hover:text-primary">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

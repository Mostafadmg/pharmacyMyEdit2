import React from "react";
import { ShieldCheck } from "lucide-react";

export default function GphcTrustSection() {
  return (
    <section className="bg-muted/30 py-16" data-testid="gphc-trust-section">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Safe and Secure</p>
        <h2 className="mt-2 text-3xl font-serif font-bold text-secondary">General Pharmaceutical Council</h2>
        <p className="mt-3 text-lg font-semibold text-secondary">GPhC Registered Pharmacy: 9012878</p>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          The GPhC is the official body that regulates and inspects all pharmacies in the UK.
          They ensure we prioritise your safety and meet the highest standards.
        </p>
      </div>
    </section>
  );
}

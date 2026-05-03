import React from "react";
import { ShieldCheck, Award, Stethoscope, Lock, Building2, BadgeCheck } from "lucide-react";

const accreditations = [
  { icon: ShieldCheck, label: "GPhC", sub: "Registered pharmacy" },
  { icon: BadgeCheck, label: "MHRA", sub: "Medicines compliant" },
  { icon: Stethoscope, label: "CQC", sub: "Regulated provider" },
  { icon: Lock, label: "ICO", sub: "Data controller" },
  { icon: Award, label: "RPS", sub: "Faculty members" },
  { icon: Building2, label: "NHS BSA", sub: "Recognised supplier" },
];

export default function PressStrip() {
  return (
    <section className="py-12 bg-white border-y border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-7">
          Regulated, accredited &amp; trusted
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {accreditations.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-border/70 bg-white hover:border-primary/40 hover:shadow-sm transition-all min-h-[68px]"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="font-bold text-secondary text-sm tracking-wide truncate">{label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

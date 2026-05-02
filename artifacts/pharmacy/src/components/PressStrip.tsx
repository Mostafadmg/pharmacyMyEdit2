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
        <div className="flex flex-wrap items-stretch justify-center gap-x-8 gap-y-5">
          {accreditations.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/70 bg-muted/20"
            >
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <div className="leading-tight">
                <div className="font-bold text-secondary text-sm tracking-wide">{label}</div>
                <div className="text-[11px] text-muted-foreground">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

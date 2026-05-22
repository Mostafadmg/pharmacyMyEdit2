import React from "react";
import { Link } from "wouter";
import {
  Clock,
  ShieldCheck,
  Star,
  Smartphone,
  ArrowRight,
  Copy,
  Lock,
  BadgeCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InjectableWeightLoss() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col">
      <Header />

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-5 pt-12 pb-6 w-full">
        <div className="flex items-center justify-center gap-2">
          <span className="rounded-full bg-white border px-3 py-1 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            209 People Viewing Now
          </span>
          <span className="rounded-full bg-white border px-3 py-1 text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Limited Stock
          </span>
        </div>
        <h1
          className="font-serif text-5xl font-bold text-secondary text-center mt-6"
          data-testid="injectable-wl-heading"
        >
          Weight Loss Consultation
        </h1>
      </section>

      {/* Pill cards */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-8 px-5 w-full">
        <Card className="rounded-2xl bg-white border p-4 text-center flex flex-col items-center gap-1">
          <Clock className="w-5 h-5 text-secondary" />
          <div className="text-2xl font-bold text-secondary">3 mins</div>
          <div className="text-xs text-muted-foreground">To Complete</div>
        </Card>
        <Card className="rounded-2xl bg-[#D4EFE2] border p-4 text-center flex flex-col items-center gap-1">
          <Clock className="w-5 h-5 text-[#0E3D2D]" />
          <div className="text-2xl font-bold text-[#0E3D2D]">Fast</div>
          <div className="text-xs text-[#0E3D2D]/70">Approval</div>
        </Card>
      </div>

      {/* Voucher cards */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mt-3 px-5 w-full">
        <Card className="rounded-2xl bg-white border p-4 flex flex-col">
          <div className="text-xs font-semibold text-emerald-600">New here?</div>
          <div className="text-3xl font-extrabold text-secondary mt-1">£30 OFF</div>
          <div className="text-xs text-muted-foreground">Your Consultation</div>
          <button className="bg-[#E84B3C] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 mt-3">
            <Copy className="h-3.5 w-3.5" /> Use Code FIRST30
          </button>
        </Card>
        <Card className="rounded-2xl bg-white border p-4 flex flex-col">
          <div className="text-xs font-semibold text-emerald-600">Already a customer?</div>
          <div className="text-3xl font-extrabold text-secondary mt-1">£25 OFF</div>
          <div className="text-xs text-muted-foreground">Your Consultation</div>
          <button className="bg-[#E84B3C] text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 mt-3">
            <Copy className="h-3.5 w-3.5" /> Use Code DOSE25
          </button>
        </Card>
      </div>

      {/* Gliptrackr banner */}
      <div className="max-w-2xl mx-auto mt-6 px-5 w-full">
        <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider bg-white/20 inline-block px-2 py-0.5 rounded-full">
              Founding Day 1 Gift
            </div>
            <div className="text-xs mt-2 opacity-90">Our partner Gliptrackr</div>
            <div className="text-xl font-bold mt-1 leading-snug">
              Track Your Weight Loss Journey with AI
            </div>
            <p className="text-sm opacity-90 mt-1">
              We're proud to partner with Gliptrackr — 50% OFF for founding members.
            </p>
          </div>
          <button className="shrink-0 bg-white text-violet-700 rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" /> Join the GLPTrackr Waitlist
          </button>
        </div>
      </div>

      {/* Real Transformations */}
      <section className="max-w-2xl mx-auto mt-12 text-center px-5 w-full">
        <h2 className="font-serif text-3xl text-secondary">Real Transformations</h2>
        <p className="text-sm text-muted-foreground mt-1">Verified patient results</p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[
            { name: "James, 34", desc: "Lost 2 stone on Mounjaro in 5 months" },
            { name: "Sarah, 41", desc: "Lost 2.5 stone Wegovy in 6 months" },
          ].map((p) => (
            <div key={p.name}>
              <div className="grid grid-cols-2 gap-1">
                <div className="relative h-44 bg-gradient-to-br from-stone-200 to-stone-300 rounded-xl">
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B5DA37] text-[#0E3D2D]">
                    BEFORE
                  </span>
                </div>
                <div className="relative h-44 bg-gradient-to-br from-stone-200 to-stone-300 rounded-xl">
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B5DA37] text-[#0E3D2D]">
                    AFTER
                  </span>
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-secondary">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted & Certified */}
      <div className="max-w-2xl mx-auto mt-10 px-5 w-full">
        <Card className="rounded-2xl bg-white border p-6">
          <h3 className="text-center font-serif text-xl text-secondary">Trusted & Certified</h3>
          <div className="flex items-start gap-3 mt-4">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-secondary">GPhC Registered Pharmacy</div>
              <div className="text-xs text-muted-foreground">GPhC Registration: 9011419</div>
              <div className="text-xs text-muted-foreground">
                Superintendent Pharmacist: M Zunaid Patel — M Pharm
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-[#FBEAE7] px-3 py-2 text-xs font-semibold text-secondary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Eli Lilly — Authorised Supplier
            </div>
            <div className="rounded-xl bg-[#E7EEF5] px-3 py-2 text-xs font-semibold text-secondary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Novo Nordisk — Authorised Supplier
            </div>
          </div>
        </Card>
      </div>

      {/* Why Patients Choose Us */}
      <section className="max-w-2xl mx-auto mt-12 text-center px-5 w-full">
        <h2 className="font-serif text-2xl text-secondary">Why Patients Choose Us</h2>
        <div className="space-y-3 mt-4">
          {[
            {
              quote:
                "Customer service was excellent. Emailed to say there was a problem with my order due to the delivery. This was in no way EveryMeds fault, but still organised for a full order to be sent again soon. Excellent company that I will be using in the future.",
              name: "Dave",
            },
            {
              quote:
                "Very happy with this company and my order, best thing was actually being able to speak to someone in person about the process!",
              name: "Marison",
            },
          ].map((r) => (
            <Card key={r.name} className="rounded-2xl bg-white border p-5 text-left">
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground/80">{r.quote}</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-secondary">
                  {r.name[0]}
                </div>
                <div className="text-sm font-semibold text-secondary">{r.name}</div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Verified purchase
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <div className="max-w-2xl mx-auto mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground px-5 w-full flex-wrap">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> GPhC Regulated
        </span>
        <span>·</span>
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> 256-bit encryption
        </span>
        <span>·</span>
        <span>Your data stays private</span>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto mt-6 mb-16 px-5 w-full">
        <Link href="/consultation/weight-loss-injectable">
          <Button
            className="w-full h-14 rounded-2xl bg-[#0E3D2D] hover:bg-[#0a2e22] text-white text-base font-semibold flex items-center justify-center gap-2"
            data-testid="cta-start-consultation"
          >
            Start Free Consultation <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Free consultation · No obligation · Prescribed by UK pharmacists
        </p>
      </div>

      <Footer />
    </div>
  );
}

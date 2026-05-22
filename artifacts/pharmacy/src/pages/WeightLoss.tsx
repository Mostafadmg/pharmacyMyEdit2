import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Stethoscope, Truck, Syringe, Pill,
  CheckCircle2, AlertTriangle, Clock, Users, Calculator, ChevronRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const treatments = [
  {
    id: "mounjaro",
    name: "Mounjaro",
    generic: "Tirzepatide",
    pricePerMonth: "from £149",
    badge: "Most effective",
    badgeTone: "bg-accent text-accent-foreground",
    blurb:
      "Weekly self-injection that targets two appetite hormones (GLP-1 + GIP). The newest and most effective UK weight-loss medicine, with average 20.9% weight loss over 72 weeks in clinical trials.",
    bullets: [
      "1 injection per week",
      "Up to 20.9% body weight reduction (SURMOUNT-1)",
      "Includes pen, needles & pharmacist support",
    ],
  },
  {
    id: "wegovy",
    name: "Wegovy",
    generic: "Semaglutide",
    pricePerMonth: "from £159",
    badge: "Most prescribed",
    badgeTone: "bg-primary text-primary-foreground",
    blurb:
      "GLP-1 weekly injection from Novo Nordisk. Suppresses appetite and slows stomach emptying. Average 14.9% weight loss over 68 weeks (STEP-1).",
    bullets: [
      "1 injection per week",
      "5 dose strengths — gradual titration",
      "Includes pen, needles & 24/7 pharmacist messaging",
    ],
  },
  {
    id: "saxenda",
    name: "Saxenda",
    generic: "Liraglutide",
    pricePerMonth: "from £179",
    badge: "Daily dosing",
    badgeTone: "bg-secondary text-secondary-foreground",
    blurb:
      "Daily GLP-1 injection. Useful when patients prefer a smaller dose adjustment per day, or while waiting for Wegovy supply.",
    bullets: [
      "1 injection per day",
      "Average 5–10% weight reduction",
      "Pen lasts ~17 days at maintenance dose",
    ],
  },
  {
    id: "orlistat",
    name: "Orlistat / Xenical",
    generic: "Orlistat 120 mg",
    pricePerMonth: "from £49",
    badge: "Tablet · No injection",
    badgeTone: "bg-emerald-100 text-emerald-700",
    blurb:
      "Capsule taken with meals that blocks ~30% of fat absorption. A non-injectable starting point for patients with a BMI ≥ 28.",
    bullets: [
      "3 capsules a day with meals",
      "Average 5% weight loss with diet",
      "Available as Xenical (brand) or generic",
    ],
  },
  {
    id: "mysimba",
    name: "Mysimba",
    generic: "Naltrexone / Bupropion",
    pricePerMonth: "from £89",
    badge: "Tablet",
    badgeTone: "bg-violet-100 text-violet-700",
    blurb:
      "Combination tablet acting on appetite and reward pathways in the brain. Best for emotional eaters with BMI ≥ 30 (or ≥ 27 with risk factors).",
    bullets: [
      "Up to 4 tablets a day (titrated)",
      "Average 5–7% weight loss",
      "Avoid in seizure history & uncontrolled BP",
    ],
  },
];

const CONDITION_ID = "weight-loss";

function classifyBmi(bmi: number) {
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  if (bmi < 18.5) return { label: "Underweight", tone: "text-amber-700 bg-amber-50 border-amber-200", eligible: false, msg: "Weight-loss medicines are not appropriate. Speak to your GP about underweight support." };
  if (bmi < 25) return { label: "Healthy weight", tone: "text-emerald-700 bg-emerald-50 border-emerald-200", eligible: false, msg: "You are within the healthy BMI range. Weight-loss medicines are not indicated." };
  if (bmi < 27) return { label: "Overweight", tone: "text-yellow-700 bg-yellow-50 border-yellow-200", eligible: false, msg: "Lifestyle support is the first step at this BMI. Prescription options begin at BMI 27 with risk factors." };
  if (bmi < 30) return { label: "Overweight", tone: "text-orange-700 bg-orange-50 border-orange-200", eligible: true, msg: "You may be eligible for treatment if you have a weight-related condition (type 2 diabetes, prediabetes, high BP, sleep apnoea, PCOS, etc.)." };
  if (bmi < 35) return { label: "Obese (Class I)", tone: "text-rose-700 bg-rose-50 border-rose-200", eligible: true, msg: "You are eligible for prescription weight-loss treatment." };
  if (bmi < 40) return { label: "Obese (Class II)", tone: "text-rose-700 bg-rose-50 border-rose-200", eligible: true, msg: "You are eligible for prescription weight-loss treatment, including Mounjaro and Wegovy." };
  return { label: "Severe obesity (Class III)", tone: "text-red-700 bg-red-50 border-red-200", eligible: true, msg: "You are eligible for prescription weight-loss treatment. We recommend the GLP-1 family." };
}

export default function WeightLoss() {
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  const bmi = useMemo(() => {
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    if (!h || !w) return null;
    return w / (h * h);
  }, [heightCm, weightKg]);

  const verdict = bmi !== null ? classifyBmi(bmi) : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0f5e58] via-[#168A7B] to-[#1ba898] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0, transparent 40%), radial-gradient(circle at 70% 80%, white 0, transparent 40%)" }} />
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-semibold mb-5">
                <ShieldCheck className="w-4 h-4" />
                UK-registered pharmacy · GPhC 9011677
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-5" data-testid="weight-loss-heading">
                Weight-loss treatment that actually works
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg">
                Mounjaro, Wegovy, Saxenda, Orlistat and Mysimba — prescribed by UK pharmacist independent prescribers, with discreet next-day delivery and ongoing support.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-full px-7 h-12 shadow-lg"
                >
                  <Link href={`/conditions/${CONDITION_ID}`} data-testid="hero-start-consultation">
                    Start consultation <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-full px-7 h-12"
                >
                  <a href="#bmi-calculator">Check your BMI</a>
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-white/80">
                <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Free tracked next-day delivery</span>
                <span className="flex items-center gap-1.5"><Stethoscope className="w-4 h-4" /> Pharmacist-led care</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 90,000+ patients treated</span>
              </div>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20 max-w-md shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center">
                    <Syringe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Most popular</p>
                    <h3 className="text-xl font-bold">Mounjaro · Tirzepatide</h3>
                  </div>
                </div>
                <p className="text-white/90 mb-4">
                  Weekly injection · 20.9% average weight loss in 72 weeks.
                </p>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold">£149<span className="text-base text-white/70">/mo</span></p>
                    <p className="text-xs text-white/70">starting dose · all-inclusive</p>
                  </div>
                  <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 rounded-full">
                    <Link href={`/conditions/${CONDITION_ID}`}>Start →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Let's get started — Injectable vs Oral */}
      <section className="bg-[#fdf7ec] border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">
              Let's get started
            </h2>
            <p className="text-muted-foreground">
              Choose the type of weight-loss treatment you're looking for.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/treatments/weight-loss/injectable" data-testid="get-started-injectable">
              <Card className="h-full rounded-3xl border-secondary/30 bg-secondary text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
                <CardContent className="p-7 flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                    <Syringe className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold">Injectable Pens</h3>
                  <p className="text-white/85">I want to take an injectable to lose weight.</p>
                  <span className="mt-3 inline-flex items-center justify-center gap-1.5 self-start bg-accent text-accent-foreground rounded-full px-5 h-10 font-semibold text-sm">
                    Start treatment <ChevronRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/conditions/${CONDITION_ID}`} data-testid="get-started-oral">
              <Card className="h-full rounded-3xl border-secondary/30 bg-secondary text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
                <CardContent className="p-7 flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                    <Pill className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold">Oral Tablets</h3>
                  <p className="text-white/85">I want to take a tablet to lose weight.</p>
                  <span className="mt-3 inline-flex items-center justify-center gap-1.5 self-start bg-accent text-accent-foreground rounded-full px-5 h-10 font-semibold text-sm">
                    Start treatment <ChevronRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* BMI Calculator */}
      <section id="bmi-calculator" className="bg-muted/40 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
              <Calculator className="w-4 h-4" /> BMI Calculator
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-2">
              Am I eligible for treatment?
            </h2>
            <p className="text-muted-foreground">
              Enter your height and weight — our pharmacist still confirms eligibility in your consultation.
            </p>
          </div>
          <Card className="rounded-3xl border-border shadow-md">
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-5 items-end">
                <div>
                  <Label htmlFor="bmi-height" className="mb-2 block font-semibold">Height (cm)</Label>
                  <Input
                    id="bmi-height"
                    type="number"
                    inputMode="decimal"
                    placeholder="170"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="h-12 rounded-xl text-lg"
                    data-testid="input-bmi-height"
                  />
                </div>
                <div>
                  <Label htmlFor="bmi-weight" className="mb-2 block font-semibold">Weight (kg)</Label>
                  <Input
                    id="bmi-weight"
                    type="number"
                    inputMode="decimal"
                    placeholder="85"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="h-12 rounded-xl text-lg"
                    data-testid="input-bmi-weight"
                  />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Your BMI</p>
                  <p className="text-4xl font-bold text-secondary tabular-nums" data-testid="bmi-result">
                    {bmi !== null ? bmi.toFixed(1) : "—"}
                  </p>
                </div>
              </div>

              {verdict && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 rounded-2xl border p-5 ${verdict.tone}`}
                  data-testid="bmi-verdict"
                >
                  <div className="flex items-start gap-3">
                    {verdict.eligible ? (
                      <CheckCircle2 className="w-6 h-6 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-lg">{verdict.label}</p>
                      <p className="text-sm mt-1">{verdict.msg}</p>
                    </div>
                  </div>
                  {verdict.eligible && (
                    <div className="mt-4 flex justify-end">
                      <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full">
                        <Link href={`/conditions/${CONDITION_ID}`} data-testid="bmi-cta">
                          Start your consultation <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                BMI is one indicator of weight-related health risk and isn't suitable for athletes, pregnancy, or people of South Asian / Black ethnicity (where lower thresholds apply). Our pharmacist will use BMI alongside your full medical history.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Subscription / one-off comparison */}
      <section className="bg-gradient-to-br from-primary/5 via-white to-accent/5 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-3">
              New · Repeat & save
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">
              Subscribe and save <em className="text-primary italic">10%</em> on every dose
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose subscription at checkout — your pharmacist re-reviews you at every cycle and you can pause or
              cancel any time from your account.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-border p-6 relative" data-testid="oneoff-card">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">One-off order</div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-secondary">£149</span>
                <span className="text-muted-foreground text-sm">/ first month</span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Single-month supply</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Free tracked next-day delivery</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Pharmacist messaging during treatment</li>
              </ul>
            </div>
            <div className="bg-secondary text-white rounded-2xl border-2 border-primary p-6 relative shadow-xl shadow-primary/10" data-testid="subscription-card">
              <span className="absolute -top-3 right-5 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Save 10%
              </span>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Subscription · Auto-renew</div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold">£134</span>
                <span className="text-white/70 text-sm line-through">£149</span>
                <span className="text-white/70 text-sm">/ month</span>
              </div>
              <ul className="space-y-1.5 text-sm text-white/80">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Auto-shipped before you run out</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> 10% off eligible repeat refills</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Free dose-titration check-ins</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /> Pause or cancel any time</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-5 max-w-2xl mx-auto">
            Subscription pricing shown is illustrative for maintenance doses, applies to eligible repeat refills, and is
            subject to clinical suitability and pharmacist re-review at every cycle. Prices may change with notice.
          </p>
        </div>
      </section>

      {/* Treatment Cards */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">
              Compare prescription weight-loss medicines
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All 5 first-line UK weight-loss medicines, prescribed by our team. Choose your preferred option in the consultation — we'll confirm what's safe for you.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {treatments.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="h-full rounded-3xl border-border hover:shadow-lg hover:border-primary/40 transition-all">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-secondary">{t.name}</h3>
                        <p className="text-sm text-muted-foreground">{t.generic}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.badgeTone}`}>{t.badge}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-primary mb-3">{t.pricePerMonth}</p>
                    <p className="text-sm text-foreground/80 mb-4 flex-1">{t.blurb}</p>
                    <ul className="space-y-1.5 mb-5">
                      {t.bullets.map((b) => (
                        <li key={b} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
                    >
                      <Link href={`/conditions/${CONDITION_ID}`} data-testid={`treatment-cta-${t.id}`}>
                        Start consultation <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-muted/30 to-white border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">
              How it works
            </h2>
            <p className="text-muted-foreground">From consultation to your front door in 3 steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Stethoscope,
                title: "1. Confidential consultation",
                body: "10-minute online questionnaire reviewed by a UK pharmacist independent prescriber. We'll ask about your weight history, medical conditions and current medicines.",
              },
              {
                icon: Pill,
                title: "2. Tailored prescription",
                body: "Your pharmacist confirms the safest medicine and dose for you — Mounjaro, Wegovy, Saxenda, Orlistat or Mysimba — and answers any questions in chat.",
              },
              {
                icon: Truck,
                title: "3. Free next-day delivery",
                body: "Cold-chain courier for GLP-1 injections, discreet packaging, with ongoing pharmacist support and monthly check-ins.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="h-full rounded-3xl border-border">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-2">{step.title}</h3>
                    <p className="text-sm text-foreground/80">{step.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety + FAQ-lite */}
      <section className="bg-white border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-2xl font-bold text-secondary mb-4 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" /> Who can be treated
              </h3>
              <ul className="space-y-2.5 text-sm">
                {[
                  "Adults aged 18 to 75",
                  "BMI ≥ 30, or BMI ≥ 27 with a weight-related condition",
                  "Not pregnant, not trying to conceive, not breastfeeding",
                  "No personal/family history of medullary thyroid cancer or MEN2",
                  "No history of pancreatitis or active eating disorder",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-secondary mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" /> What happens after I order
              </h3>
              <ol className="space-y-2.5 text-sm">
                {[
                  "Your consultation is reviewed within 4 working hours.",
                  "If approved, your pen is dispensed the same day from our UK pharmacy.",
                  "Cold-chain delivery in plain packaging the next working day (free).",
                  "Your pharmacist messages monthly to titrate the dose and check side-effects.",
                ].map((b, i) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5 shrink-0">{i + 1}</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-secondary text-white">
        <div className="max-w-5xl mx-auto px-6 py-12 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-3">
            Ready to start your weight-loss journey?
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            10-minute consultation · UK pharmacist review · Free next-day delivery.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-full px-8 h-13 shadow-lg"
          >
            <Link href={`/conditions/${CONDITION_ID}`} data-testid="bottom-cta">
              Start consultation <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import React from "react";
import { Link } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, Stethoscope, Truck, FileCheck2, ListChecks,
  UserCheck, MessagesSquare, Building2, ExternalLink,
} from "lucide-react";

export default function OurService() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-secondary to-secondary/80 text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4" /> About our service
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-5">
              A UK pharmacy you can trust
            </h1>
            <p className="text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
              We provide private, prescriber-led pharmacy services entirely online. Every consultation
              is reviewed by a GPhC-registered pharmacist independent prescriber based in the UK.
            </p>
          </div>
        </section>

        {/* Who we are */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Who we are</h2>
              <div className="space-y-4 text-slate-700 leading-relaxed">
                <p>
                  EveryDayMeds Pharmacy Ltd is a registered pharmacy in Great Britain. The pharmacy is
                  registered with the <strong>General Pharmaceutical Council (GPhC)</strong>, the
                  regulator for pharmacists, pharmacy technicians and registered pharmacies in
                  England, Scotland and Wales.
                </p>
                <p>
                  Our medicines are prepared, assembled, dispensed and labelled at our registered
                  premises in London. All clinical reviews and prescribing decisions are made by
                  pharmacist independent prescribers (PIPs) based in the UK and registered with the
                  GPhC.
                </p>
                <p>
                  You can verify our registration status, and the registration of any individual
                  pharmacist, on the GPhC's public register.
                </p>
                <a
                  href="https://www.pharmacyregulation.org/registers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                >
                  Verify on the GPhC register <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <Card className="rounded-3xl border-border/60 shadow-lg overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-accent" />
              <CardContent className="p-7 space-y-5">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-secondary text-sm">Registered pharmacy</p>
                    <p className="text-sm text-slate-600">EveryDayMeds Pharmacy Ltd<br/>14 Harley Street, London W1G 9PB</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-4 border-t border-border/40">
                  <UserCheck className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-secondary text-sm">Superintendent Pharmacist</p>
                    <p className="text-sm text-slate-600">Dr Aisha Patel MPharm IP<br/>GPhC 2098765</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-4 border-t border-border/40">
                  <ShieldCheck className="w-5 h-5 text-primary mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-secondary text-sm">Premises registration</p>
                    <p className="text-sm text-slate-600 font-mono">GPhC 9012345</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">How our service works</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">A clear, prescriber-led pathway from consultation to delivery.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: ListChecks, title: "1. Online consultation", body: "You complete a clinical questionnaire about your symptoms, medical history and medication." },
                { icon: UserCheck, title: "2. Identity verification", body: "We confirm your identity using a verification step before any prescription medicine can be supplied." },
                { icon: Stethoscope, title: "3. Pharmacist review", body: "A UK pharmacist independent prescriber reviews everything and may approve, request more information, or refer you elsewhere." },
                { icon: MessagesSquare, title: "4. Two-way communication", body: "If anything is unclear we contact you directly — you also have a portal to ask questions." },
                { icon: FileCheck2, title: "5. Dispense &amp; check", body: "An accuracy check is performed by a second pharmacist before your medicine is released." },
                { icon: Truck, title: "6. Tracked delivery", body: "We dispatch your medicine in tamper-evident, temperature-controlled packaging using a tracked carrier." },
              ].map((s, i) => (
                <Card key={i} className="rounded-2xl border-border/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <s.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-secondary mb-2" dangerouslySetInnerHTML={{ __html: s.title }} />
                    <p className="text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Indemnity */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif font-bold text-secondary mb-4">Indemnity arrangements</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our pharmacy and our pharmacist independent prescribers carry full professional indemnity
              insurance. The pharmacy holds policies that cover both the pharmacy services we provide
              and the prescribing services associated with them.
            </p>
            <p className="text-slate-700 leading-relaxed">
              All of our prescribers are based in the UK and are personally registered with the GPhC.
              We do not currently work with prescribers based outside the UK.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full border-2 font-semibold">
                <Link href="/about/regulatory">Regulatory information</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-2 font-semibold">
                <Link href="/about/safeguarding">Safe prescribing standards</Link>
              </Button>
              <Button asChild className="rounded-full font-semibold bg-primary">
                <Link href="/conditions">Browse conditions we treat</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

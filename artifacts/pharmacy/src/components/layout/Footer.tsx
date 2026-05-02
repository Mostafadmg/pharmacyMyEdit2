import React from "react";
import { Link } from "wouter";
import { ShieldCheck, Building2, Mail, Phone, ExternalLink } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-14 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top section: Brand + statutory pharmacy info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-secondary-foreground/15">
          {/* Brand column */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">+</span>
              </div>
              <span className="text-2xl font-bold text-white">PharmaCare</span>
            </div>
            <p className="text-secondary-foreground/75 max-w-sm leading-relaxed text-sm mb-6">
              A UK-registered distance-selling pharmacy. All consultations and prescribing decisions are
              made by qualified GPhC-registered pharmacist independent prescribers in line with national
              clinical guidelines.
            </p>

            {/* Statutory display info — GPhC Principle 3.2a */}
            <div className="bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-xl p-4 space-y-2 text-xs text-secondary-foreground/85">
              <div className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                <div>
                  <div className="font-semibold text-white">PharmaCare Pharmacy Ltd</div>
                  <div>14 Harley Street, London W1G 9PB, United Kingdom</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>0800 020 9090</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>care@pharmacare.example.uk</span>
              </div>
              <div className="pt-2 mt-2 border-t border-secondary-foreground/10 grid grid-cols-1 gap-1">
                <div><span className="text-secondary-foreground/60">GPhC Premises Reg:</span> <span className="font-mono font-semibold text-white">9012345</span></div>
                <div><span className="text-secondary-foreground/60">Superintendent Pharmacist:</span> <span className="text-white">Dr Aisha Patel MPharm IP (GPhC 2098765)</span></div>
                <div><span className="text-secondary-foreground/60">Owner:</span> <span className="text-white">PharmaCare Pharmacy Ltd</span></div>
              </div>
              <a
                href="https://www.pharmacyregulation.org/registers/pharmacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline pt-1 font-semibold"
              >
                Verify on the GPhC register <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Services column */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-base mb-4 text-white">Services</h3>
            <ul className="space-y-2.5 text-secondary-foreground/80 text-sm">
              <li><Link href="/conditions" className="hover:text-primary transition-colors">All Conditions</Link></li>
              <li><Link href="/track" className="hover:text-primary transition-colors">Track Consultation</Link></li>
              <li><Link href="/my-consultations" className="hover:text-primary transition-colors">Patient Portal</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* About / regulatory column */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-base mb-4 text-white">About</h3>
            <ul className="space-y-2.5 text-secondary-foreground/80 text-sm">
              <li><Link href="/about/our-service" className="hover:text-primary transition-colors">About Our Service</Link></li>
              <li><Link href="/about/regulatory" className="hover:text-primary transition-colors">Regulatory Info</Link></li>
              <li><Link href="/about/safeguarding" className="hover:text-primary transition-colors">Safe Prescribing</Link></li>
              <li><Link href="/feedback" className="hover:text-primary transition-colors">Feedback &amp; Concerns</Link></li>
            </ul>
          </div>

          {/* Legal column */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-base mb-4 text-white">Legal &amp; Policies</h3>
            <ul className="space-y-2.5 text-secondary-foreground/80 text-sm">
              <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy &amp; Data Policy</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
              <li><Link href="/legal/complaints" className="hover:text-primary transition-colors">Complaints Procedure</Link></li>
              <li><Link href="/legal/safeguarding" className="hover:text-primary transition-colors">Safeguarding Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-8 border-b border-secondary-foreground/15">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-7 md:pr-6">
              <NewsletterSignup />
            </div>
            <div className="md:col-span-5 flex items-center text-sm text-secondary-foreground/70 leading-relaxed">
              <p>
                Want to talk to a real human? Our team is on{" "}
                <a href="tel:08000209090" className="text-primary font-semibold hover:underline">0800 020 9090</a>{" "}
                Monday to Friday 8am – 8pm and Saturday 9am – 5pm.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-3 py-6 text-xs text-secondary-foreground/70">
          <div className="flex items-center gap-1.5 bg-secondary-foreground/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> GPhC-registered pharmacy
          </div>
          <div className="flex items-center gap-1.5 bg-secondary-foreground/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> CQC-regulated prescribing service
          </div>
          <div className="flex items-center gap-1.5 bg-secondary-foreground/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> ICO data controller (ZA1234567)
          </div>
          <div className="flex items-center gap-1.5 bg-secondary-foreground/10 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> PCI DSS compliant payments
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-secondary-foreground/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-foreground/60">
          <p>&copy; {new Date().getFullYear()} PharmaCare Pharmacy Ltd. All rights reserved.</p>
          <p>
            Regulated by the General Pharmaceutical Council (GPhC) — the regulator for pharmacists, pharmacy technicians and registered pharmacies in Great Britain.
          </p>
        </div>
      </div>
    </footer>
  );
}

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LIVE_SITE_FAQS } from "@/data/everydaymedsSite";

const defaultFaqs = [
  {
    q: "Is EveryDayMeds a real UK pharmacy?",
    a: "Yes. EveryDayMeds Pharmacy Ltd is registered with the General Pharmaceutical Council (GPhC Premises Reg 9012345). Our Superintendent Pharmacist is Dr Aisha Patel MPharm IP. You can verify us on the official GPhC register at any time.",
  },
  {
    q: "How quickly will I get my treatment?",
    a: "Consultations submitted before 4pm on a working day are typically reviewed within hours. Approved prescriptions are dispatched same-day with free tracked next-day delivery on orders over £25.",
  },
  {
    q: "Do I need to upload a paper prescription?",
    a: "No. Our pharmacist independent prescribers can prescribe directly after reviewing your online consultation. If you already have a private paper prescription you would like dispensing, get in touch and we can arrange that too.",
  },
  {
    q: "What if the pharmacist decides the treatment isn't right for me?",
    a: "Patient safety comes first. If our prescriber feels a medicine is not suitable, we will explain why, refund any charges, and where appropriate signpost you to your GP, NHS 111, or another suitable service. You are never charged for a consultation that is declined.",
  },
  {
    q: "Is my information kept private?",
    a: "Yes. We are an ICO-registered data controller (ZA1234567). All consultations are encrypted in transit and at rest, and are only seen by GPhC-registered clinicians. We will never share your data with anyone outside your direct care without your consent.",
  },
  {
    q: "Can I get repeat prescriptions automatically?",
    a: "Yes — for chronic medicines (such as weight loss, hayfever, contraception or asthma maintenance) you can subscribe to a recurring supply. The pharmacist re-reviews your file at every cycle and you can cancel any time from your account.",
  },
  {
    q: "Do you accept NHS prescriptions?",
    a: "We are a private prescribing service, so we do not dispense NHS prescriptions. However our private consultation fees are often comparable to a single NHS prescription charge, especially when you factor in the time saved.",
  },
  {
    q: "What if I have a question after my medicine arrives?",
    a: "Every patient has 24/7 secure messaging with the clinical team. Just open your consultation and click 'Reply' — we aim to respond within 4 working hours, often much faster.",
  },
];

type HomeFAQProps = {
  variant?: "default" | "live";
};

export default function HomeFAQ({ variant = "default" }: HomeFAQProps) {
  const faqs = variant === "live" ? [...LIVE_SITE_FAQS] : defaultFaqs;
  const [open, setOpen] = useState<number | null>(0);
  const isLive = variant === "live";

  return (
    <section className="py-16 bg-muted/20" data-testid="home-faq">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          {!isLive ? (
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-4">
              Frequently asked
            </span>
          ) : null}
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">
            {isLive ? "FAQs" : (
              <>The things people <em className="text-primary italic">really</em> want to know</>
            )}
          </h2>
          <p className="text-muted-foreground">
            {isLive
              ? "Everything you need to know about the product and billing."
              : <>Can't find what you're looking for? <a href="/contact" className="text-primary font-semibold hover:underline">Talk to our team</a>.</>}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`border border-border rounded-2xl overflow-hidden bg-white transition-shadow ${
                  isOpen ? "shadow-md" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-muted/30 transition-colors"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="font-semibold text-secondary text-base md:text-lg">{f.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 -mt-1 text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

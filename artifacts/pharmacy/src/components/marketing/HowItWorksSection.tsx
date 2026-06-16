import React from "react";
import { HOW_IT_WORKS_STEPS } from "@/data/everydaymedsSite";

export default function HowItWorksSection() {
  return (
    <section className="bg-white py-16" data-testid="how-it-works-section">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-serif font-bold text-secondary mb-12">How it Works?</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {index + 1}
              </div>
              <h3 className="text-lg font-bold text-secondary mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

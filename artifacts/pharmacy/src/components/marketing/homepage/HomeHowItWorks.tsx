import React from "react";
import { EDM_ASSETS } from "@/data/everydaymedsAssets";

const STEPS = [
  {
    n: 1,
    title: "Choose your treatment",
    image: EDM_ASSETS.howItWorksStep1,
  },
  {
    n: 2,
    title: "Answer quick questions",
    image: EDM_ASSETS.howItWorksStep2,
  },
  {
    n: 3,
    title: "Get it delivered fast",
    image: EDM_ASSETS.howItWorksStep3,
  },
];

export default function HomeHowItWorks() {
  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#314a40] mb-8 sm:mb-10">
          How it
          <br className="sm:hidden" />
          {" "}Works?
        </h2>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="relative rounded-[24px] bg-[#fdf3f1] overflow-hidden border border-[#f5e4e0]"
            >
              <span className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#314a40] text-white text-sm font-bold">
                {step.n}
              </span>
              <div className="aspect-[4/3] bg-[#fdf3f1] overflow-hidden">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-[#314a40]">{step.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

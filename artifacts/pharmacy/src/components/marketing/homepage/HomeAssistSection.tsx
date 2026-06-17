import React from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { EDM_ASSETS } from "@/data/everydaymedsAssets";
import { TREATMENT_GOAL_CARDS } from "@/data/everydaymedsSite";

const CARD_IMAGES = [
  EDM_ASSETS.treatmentWeightLoss,
  EDM_ASSETS.treatmentHairLoss,
  EDM_ASSETS.treatmentMensHealth,
  EDM_ASSETS.treatmentWomensHealth,
];

export default function HomeAssistSection() {
  return (
    <section className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[1400px] mx-auto edm-section-dark rounded-[20px] px-5 sm:px-8 py-10 sm:py-12 text-white">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">How can we assist you today?</h2>
          <p className="mt-3 text-sm sm:text-base text-[#cfe8d6] max-w-2xl mx-auto leading-relaxed">
            Discover all your healthcare essentials, conveniently organised into
            <br className="hidden sm:inline" />
            {" "}categories for easy browsing and shopping.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {TREATMENT_GOAL_CARDS.map((card, index) => (
            <div
              key={card.title}
              className="rounded-[22px] bg-[#fff7f5] text-[#314a40] overflow-hidden flex flex-col min-h-[360px]"
            >
              <div className="p-5 pb-2 flex-1">
                {card.tagline && (
                  <p className="text-sm sm:text-base font-semibold text-[#314a40]/80 mb-1">{card.tagline}</p>
                )}
                <h3 className="text-xl sm:text-2xl font-bold leading-tight">{card.title}</h3>
                <Link
                  href={card.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eaf5ef] pl-1.5 pr-4 py-1.5 text-sm font-semibold text-[#314a40] hover:bg-[#d9ede3] transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#314a40] text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  See Treatment
                </Link>
              </div>
              <div className="mt-auto h-44 sm:h-52 overflow-hidden bg-[#fff7f5]">
                <img
                  src={CARD_IMAGES[index]}
                  alt={card.title}
                  className="w-full h-full object-cover object-bottom"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/conditions"
            className="inline-flex items-center justify-center rounded-full bg-[#b8dcc8] px-8 py-3 text-sm font-bold text-[#314a40] hover:bg-[#cfe8d6] transition-colors"
          >
            See all treatments
          </Link>
        </div>
      </div>
    </section>
  );
}

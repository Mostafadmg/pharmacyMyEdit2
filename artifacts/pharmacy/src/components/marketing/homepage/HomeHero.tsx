import React from "react";
import { EDM_ASSETS } from "@/data/everydaymedsAssets";

export default function HomeHero() {
  return (
    <section className="px-4 sm:px-6 pt-6 pb-2">
      <div className="max-w-[1400px] mx-auto">
        <div className="edm-hero-gradient rounded-[20px] overflow-hidden px-5 sm:px-10 py-8 sm:py-10 grid lg:grid-cols-2 gap-6 lg:gap-10 items-center min-h-[300px] sm:min-h-[360px]">
          <div className="flex flex-col items-start justify-center gap-4 sm:gap-5 order-2 lg:order-1">
            <img
              src={EDM_ASSETS.heroBannerText}
              alt="Meet glptrackr — Track Your Weight Loss Journey with AI"
              className="hidden md:block w-full max-w-[520px] h-auto"
            />
            <img
              src={EDM_ASSETS.heroBannerTextMobile}
              alt="Meet glptrackr — Track Your Weight Loss Journey with AI"
              className="md:hidden w-full max-w-[340px] h-auto"
            />
            <img
              src={EDM_ASSETS.heroBannerSub}
              alt="We're proud to partner with glptrackr. 50% OFF for founding members."
              className="hidden sm:block w-full max-w-[460px] h-auto"
            />
            <img
              src={EDM_ASSETS.heroBannerSubMobile}
              alt="We're proud to partner with glptrackr. 50% OFF for founding members."
              className="sm:hidden w-full max-w-[300px] h-auto"
            />
            <button
              type="button"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#2b0f55] hover:bg-white/90 transition-colors"
            >
              Download Now
            </button>
            <img
              src={EDM_ASSETS.heroAppBadges}
              alt="Download on App Store and Google Play"
              className="h-10 sm:h-11 w-auto"
            />
          </div>

          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <img
              src={EDM_ASSETS.heroPhones}
              alt="glptrackr app on mobile phones"
              className="w-full max-w-[520px] h-auto object-contain"
              fetchPriority="high"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

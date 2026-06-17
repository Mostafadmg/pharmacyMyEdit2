import React from "react";
import { EDM_ASSETS } from "@/data/everydaymedsAssets";
import { COMPANY } from "@/data/everydaymedsSite";

export default function HomeSafeSecure() {
  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-[1400px] mx-auto rounded-[28px] bg-[#eceae6] p-6 sm:p-10 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#314a40] mb-6">Safe and Secure</h2>
          <img
            src={EDM_ASSETS.safeSecureIllustration}
            alt="Registered UK Pharmacy, Fully Licensed and Regulated Service, Approved UK-sourced treatments"
            className="w-full max-w-md h-auto"
            loading="lazy"
          />
        </div>

        <div className="rounded-[24px] bg-white p-6 sm:p-10 text-center shadow-sm border border-gray-100">
          <img
            src={EDM_ASSETS.gphcLogo}
            alt="General Pharmaceutical Council"
            className="mx-auto mb-4 h-16 sm:h-20 w-auto object-contain"
            loading="lazy"
          />
          <h3 className="text-xl font-bold text-[#314a40]">General Pharmaceutical Council</h3>
          <p className="mt-3 text-base sm:text-lg font-semibold text-[#314a40]">
            GPhC Registered Pharmacy : {COMPANY.gphcNumber}
          </p>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            The GPhC is the official body that regulates and inspects all pharmacies in the UK.
            They ensure we prioritise your safety and meet the highest standards.
          </p>
        </div>
      </div>
    </section>
  );
}

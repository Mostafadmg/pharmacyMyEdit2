import React from "react";
import SiteLayout from "@/components/layout/SiteLayout";
import { EDM_ASSETS } from "@/data/everydaymedsAssets";
import { COMPANY } from "@/data/everydaymedsSite";

export default function OurService() {
  return (
    <SiteLayout className="min-h-screen flex flex-col bg-[#faf6f3] edm-site">
      <main className="flex-1">
        <section className="px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-4xl mx-auto rounded-[24px] bg-white px-6 sm:px-10 py-10 sm:py-12 shadow-sm border border-gray-100">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#314a40] text-center mb-6">About us</h1>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              <p>
                EveryDayMeds is a UK-based, GPhC-registered online pharmacy and private prescribing service designed to make access to safe, effective treatments simple and discreet. We offer a wide range of clinically approved treatments for everyday health concerns, including weight management, erectile dysfunction, hair loss, contraception, skin conditions, and more — all from the comfort of your home.
              </p>
              <p>
                Our platform connects patients with UK-registered healthcare professionals who review all consultation requests. Medicines are dispensed from our regulated pharmacy premises and delivered directly to your door in secure, discreet packaging. Our commitment is to offer a safe, convenient, and patient-focused service that puts your health and privacy first.
              </p>
            </div>
          </div>
        </section>

        <section className="edm-section-dark px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Our Mission",
                body: "To provide fast, safe, and discreet access to trusted healthcare treatments through a secure, patient-centred online platform — improving accessibility and outcomes for patients across the UK.",
                icon: EDM_ASSETS.aboutMission,
              },
              {
                title: "Our Vision",
                body: "To become a leading provider of remote healthcare and online pharmacy services in the UK by maintaining the highest standards of clinical governance, digital innovation, and customer service.",
                icon: EDM_ASSETS.aboutVision,
              },
              {
                title: "Our Values",
                body: "At EveryDayMeds, our values are built around patient safety, trust, and accessibility. We are committed to delivering care that is safe, transparent, and clinically responsible.",
                icon: EDM_ASSETS.aboutValues,
              },
            ].map((block) => (
              <div
                key={block.title}
                className="rounded-[20px] bg-white px-6 py-8 text-center flex flex-col items-center"
              >
                <img src={block.icon} alt="" className="h-24 w-auto mb-5" aria-hidden />
                <h2 className="text-lg font-bold text-[#314a40] mb-3">{block.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{block.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 sm:py-16 bg-[#f5f5f4]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#314a40] text-center mb-8">Our Regulations</h2>
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <div className="rounded-[20px] bg-white border border-gray-200 p-6 sm:p-8 text-sm text-gray-700 leading-relaxed space-y-2">
                <p>
                  Registered with the General Pharmaceutical Council:{" "}
                  <strong className="text-[#314a40]">{COMPANY.gphcNumber}</strong>
                </p>
                <p>
                  Registered with the Information Commissioner&apos;s Office (ICO):{" "}
                  <strong className="text-[#314a40]">{COMPANY.icoNumber}</strong>
                </p>
              </div>
              <div className="rounded-[20px] bg-white border border-gray-200 p-6 sm:p-8 text-sm text-gray-700 leading-relaxed space-y-2">
                <p>
                  Superintendent Pharmacist: {COMPANY.superintendent} (GPhC No. {COMPANY.superintendentGphc})
                </p>
                <p>
                  Pharmacy GPhC Number: <strong className="text-[#314a40]">{COMPANY.gphcNumber}</strong>
                </p>
              </div>
            </div>
            <div className="max-w-xl mx-auto text-sm text-gray-600 leading-relaxed space-y-2 text-center">
              <p>
                Phone Number:{" "}
                <a href={COMPANY.phoneHref} className="text-[#314a40] font-semibold hover:underline">
                  {COMPANY.phoneDisplay}
                </a>
              </p>
              <p>
                Email:{" "}
                <a href={`mailto:${COMPANY.email}`} className="text-[#314a40] font-semibold hover:underline">
                  {COMPANY.email}
                </a>
              </p>
              <p>Registered Address: {COMPANY.registeredAddress}</p>
              <p>Premises Address: {COMPANY.premisesAddress}</p>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

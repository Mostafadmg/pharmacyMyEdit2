import { Link } from "wouter";

import { Facebook, Instagram } from "lucide-react";

import { COMPANY } from "@/data/everydaymedsSite";

import {

  EDM_ASSETS,

  FOOTER_COMPANY_LINKS,

  INDEPENDENT_PRESCRIBERS,

} from "@/data/everydaymedsAssets";



function TikTokIcon({ className }: { className?: string }) {

  return (

    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>

      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />

    </svg>

  );

}



export default function Footer() {

  const year = new Date().getFullYear();



  return (

    <footer className="mt-auto edm-section-dark text-white rounded-t-[28px]">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 sm:py-14">

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr_1fr]">

          <div>

            <Link href="/" className="inline-flex items-center gap-3">

              <img src={EDM_ASSETS.logo} alt="EveryDayMeds" className="h-10 w-auto brightness-0 invert" />

            </Link>

            <div className="mt-6 space-y-3 text-sm text-white/75 leading-relaxed max-w-sm">

              <p className="font-semibold text-white">

                {COMPANY.legalName} (trading as {COMPANY.brandName} © {year})

              </p>

              <p>

                <span className="font-semibold text-white/90">Registered Address:</span>

                <br />

                109 Coleman Road, Leicester, LE5 4LE, United Kingdom

              </p>

              <p>

                <span className="font-semibold text-white/90">Support:</span>{" "}

                <a href={`mailto:${COMPANY.email}`} className="hover:text-white underline-offset-2 hover:underline">

                  {COMPANY.email}

                </a>

                {" | "}

                <span className="font-semibold text-white/90">Tel:</span>{" "}

                <a href={COMPANY.phoneHref} className="hover:text-white underline-offset-2 hover:underline">

                  {COMPANY.phoneDisplay}

                </a>

              </p>

            </div>



            <div className="mt-6">

              <p className="text-sm font-bold text-white mb-3">Our Independent Prescribers</p>

              <ul className="space-y-2 text-sm text-white/75">

                {INDEPENDENT_PRESCRIBERS.map((p) => (

                  <li key={p.gphc}>

                    {p.name}

                    <br />

                    {p.gphc}

                  </li>

                ))}

              </ul>

            </div>

          </div>



          <div className="lg:col-span-2">

            <h3 className="text-sm font-bold mb-4">Company</h3>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-white/75">

              {FOOTER_COMPANY_LINKS.map((link) => (

                <li key={link.href + link.label}>

                  <Link href={link.href} className="hover:text-white transition-colors">

                    {link.label}

                  </Link>

                </li>

              ))}

            </ul>

          </div>

        </div>



        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-5">

          <p className="text-xs text-white/50 order-3 lg:order-1">

            © {year} {COMPANY.brandName}. All rights reserved.

          </p>



          <div className="flex items-center gap-4 text-white/70 order-1 lg:order-2">

            <a href="https://www.tiktok.com" aria-label="TikTok" className="hover:text-white transition-colors">

              <TikTokIcon className="h-5 w-5" />

            </a>

            <a href="https://instagram.com" aria-label="Instagram" className="hover:text-white transition-colors">

              <Instagram className="h-5 w-5" />

            </a>

            <a href="https://facebook.com" aria-label="Facebook" className="hover:text-white transition-colors">

              <Facebook className="h-5 w-5" />

            </a>

          </div>



          <img

            src={EDM_ASSETS.payments}

            alt="Accepted payment methods"

            className="h-7 sm:h-8 w-auto order-2 lg:order-3 brightness-0 invert opacity-80"

            loading="lazy"

          />

        </div>

      </div>

    </footer>

  );

}


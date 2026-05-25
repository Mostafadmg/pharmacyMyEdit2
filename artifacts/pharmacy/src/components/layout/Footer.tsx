import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import NewsletterSignup from "@/components/NewsletterSignup";

const LINK_GROUPS = [
  {
    title: "Shop & care",
    links: [
      { href: "/shop", label: "Pharmacy shop" },
      { href: "/conditions", label: "Treatments" },
      { href: "/my-consultations", label: "My consultations" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about/our-service", label: "Our service" },
      { href: "/about/regulatory", label: "Regulatory info" },
      { href: "/about/safeguarding", label: "Safe prescribing" },
      { href: "/feedback", label: "Feedback" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/cookies", label: "Cookies" },
      { href: "/legal/complaints", label: "Complaints" },
    ],
  },
] as const;

const TRUST_ITEMS = [
  "GPhC registered",
  "Secure payments",
  "Discreet delivery",
] as const;

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/90">
        {title}
      </h3>
      <ul className="space-y-2 text-sm text-white/65">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4 lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                +
              </span>
              <span className="font-serif text-xl font-bold text-white">
                PharmaCare
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              UK-registered pharmacy. Online consultations reviewed by GPhC
              pharmacist independent prescribers.
            </p>
            <dl className="mt-4 space-y-1.5 text-sm text-white/55">
              <div>
                <dt className="sr-only">Address</dt>
                <dd>14 Harley Street, London W1G 9PB</dd>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <dd>
                  <a
                    href="tel:08000209090"
                    className="hover:text-white transition-colors"
                  >
                    0800 020 9090
                  </a>
                </dd>
                <span className="text-white/30" aria-hidden>
                  ·
                </span>
                <dd>
                  <a
                    href="mailto:care@pharmacare.example.uk"
                    className="hover:text-white transition-colors"
                  >
                    care@pharmacare.example.uk
                  </a>
                </dd>
              </div>
              <div className="text-xs text-white/45">
                GPhC premises 9012345 · Superintendent: Dr Aisha Patel MPharm
                IP (2098765)
              </div>
            </dl>
            <a
              href="https://www.pharmacyregulation.org/registers/pharmacy"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-white transition-colors"
            >
              Verify on GPhC register
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 lg:col-span-7">
            {LINK_GROUPS.map((group) => (
              <FooterLinkGroup key={group.title} {...group} />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 lg:max-w-md">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/80">
              Newsletter
            </p>
            <NewsletterSignup compact />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/55 lg:text-right">
            <span className="font-medium text-white/80">Need help?</span>{" "}
            Mon–Fri 8am–8pm, Sat 9am–5pm on{" "}
            <a
              href="tel:08000209090"
              className="font-medium text-primary hover:text-white"
            >
              0800 020 9090
            </a>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
          {TRUST_ITEMS.map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/55"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-2 text-[11px] leading-relaxed text-white/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p>© {year} PharmaCare Pharmacy Ltd. All rights reserved.</p>
          <p className="sm:max-w-md sm:text-right">
            Regulated by the General Pharmaceutical Council (GPhC).
          </p>
        </div>
      </div>
    </footer>
  );
}

import React from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import type { SiteCategoryCard } from "@/data/everydaymedsSite";
import { COLLECTION_IMAGES } from "@/data/everydaymedsAssets";

type CategoryCardGridProps = {
  items: SiteCategoryCard[];
  columns?: 2 | 3 | 4 | 5;
  showTagline?: boolean;
  showDescription?: boolean;
  showImages?: boolean;
  testIdPrefix?: string;
};

function slugFromHref(href: string): string | null {
  const m = /\/collections\/([^/?#]+)/.exec(href);
  return m?.[1] ?? null;
}

export default function CategoryCardGrid({
  items,
  columns = 4,
  showTagline = false,
  showDescription = false,
  showImages = false,
  testIdPrefix = "category",
}: CategoryCardGridProps) {
  const gridClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : columns === 5
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  if (showImages) {
    return (
      <div className={`grid ${gridClass} gap-4 sm:gap-5`}>
        {items.map((item) => {
          const slug = slugFromHref(item.href);
          const image = item.image ?? (slug ? COLLECTION_IMAGES[slug] : undefined);
          return (
            <Link key={item.title + item.href} href={item.href} className="group">
              <div
                className="rounded-[20px] overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full"
                data-testid={`${testIdPrefix}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  {image ? (
                    <img
                      src={image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#d9ede3] to-[#314a40]/20" />
                  )}
                </div>
                <p className="p-3 sm:p-4 text-center text-xs sm:text-sm font-semibold text-[#314a40] leading-snug min-h-[3.5rem] flex items-center justify-center">
                  {item.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  const CARD_THEMES = [
    "from-emerald-700 to-emerald-900",
    "from-slate-700 to-slate-900",
    "from-teal-700 to-teal-900",
    "from-rose-700 to-rose-900",
    "from-amber-700 to-amber-900",
    "from-violet-700 to-violet-900",
    "from-cyan-700 to-cyan-900",
    "from-orange-700 to-orange-900",
    "from-indigo-700 to-indigo-900",
  ];

  return (
    <div className={`grid ${gridClass} gap-5`}>
      {items.map((item, index) => {
        const theme = CARD_THEMES[index % CARD_THEMES.length];
        const isTreatmentGoal = showTagline;

        return (
          <Link key={item.title + item.href} href={item.href}>
            {isTreatmentGoal ? (
              <div
                className={`group h-full min-h-[220px] overflow-hidden rounded-[20px] border-0 bg-gradient-to-br ${theme} text-white shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg`}
                data-testid={`${testIdPrefix}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <div className="flex h-full flex-col justify-end p-6">
                  {item.tagline ? <p className="text-sm text-white/75">{item.tagline}</p> : null}
                  <h3 className="text-2xl font-bold">{item.title}</h3>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                    Explore <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="group h-full overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                data-testid={`${testIdPrefix}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              >
                <div className="flex h-full flex-col p-6">
                  <div className={`mb-4 h-2 w-12 rounded-full bg-gradient-to-r ${theme}`} />
                  <h3 className="text-lg font-bold text-[#314a40] group-hover:text-[#2a4038] transition-colors">{item.title}</h3>
                  {showDescription && item.description ? (
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{item.description}</p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#314a40]">
                    Explore
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

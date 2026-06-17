import React from "react";
import { Link } from "wouter";
import { EXPLORE_CATEGORIES } from "@/data/everydaymedsAssets";

export default function HomeExploreRow() {
  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14 bg-[#faf6f3]">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-[#314a40] mb-8 sm:mb-10">
          Explore treatments for your health goals
        </h2>

        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible">
          {EXPLORE_CATEGORIES.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group shrink-0 w-[68vw] sm:w-auto snap-start"
            >
              <div className="rounded-[20px] overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full">
                <div className="aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <p className="p-3 sm:p-4 text-center text-xs sm:text-sm font-semibold text-[#314a40] leading-snug min-h-[3.5rem] flex items-center justify-center">
                  {item.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

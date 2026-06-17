import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MEDICINE_SUBCATEGORIES_LEFT,
  MEDICINE_SUBCATEGORIES_RIGHT,
  SHOP_MAIN_CATEGORIES,
  type ShopMenuItem,
} from "@/data/shopMenu";

type ShopMegaMenuProps = {
  onNavigate?: () => void;
};

function SubcategoryColumn({
  items,
  onNavigate,
}: {
  items: ShopMenuItem[];
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.slug + item.label}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-[#2a4038] hover:bg-white/50 transition-colors"
          >
            <span>{item.label}</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-35 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ShopMegaMenu({ onNavigate }: ShopMegaMenuProps) {
  const [activeSlug, setActiveSlug] = useState("medicines-treatments");
  const activeMain = SHOP_MAIN_CATEGORIES.find((c) => c.slug === activeSlug);

  return (
    <div className="absolute left-1/2 top-full z-50 w-[min(1030px,calc(100vw-2rem))] -translate-x-1/2 pt-2">
      <div className="overflow-hidden rounded-2xl border border-[#b8dcc8]/70 bg-[#d9ede3] shadow-xl">
        <div
          className={cn(
            "grid min-h-[380px]",
            activeSlug === "medicines-treatments"
              ? "grid-cols-[minmax(240px,280px)_1fr_1fr]"
              : "grid-cols-[minmax(240px,280px)_1fr]",
          )}
        >
          {/* Left — main shop categories (live site order) */}
          <div className="border-r border-[#b8dcc8]/60 bg-[#cfe8d6]/40 p-3 md:p-4">
            <ul className="space-y-0.5">
              {SHOP_MAIN_CATEGORIES.map((item) => {
                const active = activeSlug === item.slug;
                return (
                  <li key={item.slug}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setActiveSlug(item.slug)}
                      onFocus={() => setActiveSlug(item.slug)}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        active
                          ? "bg-[#b8f0c8] text-[#1f3d32]"
                          : "text-[#2a4038] hover:bg-[#c8e8d4]",
                      )}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-45 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {activeSlug === "medicines-treatments" ? (
            <>
              <div className="border-r border-[#b8dcc8]/40 bg-[#e4f2ea] p-3 md:p-4">
                <SubcategoryColumn items={MEDICINE_SUBCATEGORIES_LEFT} onNavigate={onNavigate} />
              </div>
              <div className="bg-[#e4f2ea] p-3 md:p-4">
                <SubcategoryColumn items={MEDICINE_SUBCATEGORIES_RIGHT} onNavigate={onNavigate} />
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center bg-[#e4f2ea] p-6 md:p-8">
              <p className="text-sm text-[#2a4038]/80 mb-4">
                Browse {activeMain?.label ?? "products"}.
              </p>
              <Link
                href={activeMain?.href ?? "/shop"}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#314a40] hover:underline w-fit"
              >
                View {activeMain?.label}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

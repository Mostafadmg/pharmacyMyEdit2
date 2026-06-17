import React from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MEDICINE_SUBCATEGORIES_LEFT,
  MEDICINE_SUBCATEGORIES_RIGHT,
  SHOP_MAIN_CATEGORIES,
} from "@/data/shopMenu";

export type MobileShopPanel = "closed" | "main" | "medicines";

type MobileShopNavProps = {
  panel: MobileShopPanel;
  setPanel: (panel: MobileShopPanel) => void;
  onClose: () => void;
};

export default function MobileShopNav({ panel, setPanel, onClose }: MobileShopNavProps) {
  if (panel === "closed") return null;

  if (panel === "medicines") {
    return (
      <div className="pb-2">
        <button
          type="button"
          onClick={() => setPanel("main")}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#314a40] hover:bg-[#f5faf7] mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Medicines & Treatments
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 pl-1">
          <ul className="space-y-0.5">
            {MEDICINE_SUBCATEGORIES_LEFT.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-gray-800 hover:bg-[#f5faf7]"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                </Link>
              </li>
            ))}
          </ul>
          <ul className="space-y-0.5">
            {MEDICINE_SUBCATEGORIES_RIGHT.map((item) => (
              <li key={item.slug + item.label}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-gray-800 hover:bg-[#f5faf7]"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={() => setPanel("closed")}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#314a40] hover:bg-[#f5faf7] mb-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Shop
      </button>
      <ul className="space-y-0.5">
        {SHOP_MAIN_CATEGORIES.map((item) =>
          item.slug === "medicines-treatments" ? (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => setPanel("medicines")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-[#f5faf7]"
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </button>
            </li>
          ) : (
            <li key={item.slug}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-[#f5faf7]"
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function MobileNavLink({
  href,
  label,
  highlight,
  active,
  onClick,
}: {
  href: string;
  label: string;
  highlight?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "block rounded-lg px-3 py-3 text-sm font-medium hover:bg-[#f5faf7]",
        highlight && "text-[#3d9a8b] font-semibold",
        active && !highlight && "text-[#314a40] font-semibold bg-[#f5faf7]",
        !highlight && !active && "text-gray-800",
      )}
    >
      {label}
    </Link>
  );
}

import React from "react";
import { Link } from "wouter";
import { Copy } from "lucide-react";
import { PROMO_COPY } from "@/data/everydaymedsSite";
import { toast } from "sonner";

function CouponBox({ code, label }: { code: string; label: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.message(code);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-md border border-dashed border-white/35 bg-white/10 px-2.5 py-1 hover:bg-white/15 transition-colors"
      title={`Copy code ${code}`}
    >
      <span className="font-bold tracking-wide">{code}</span>
      <span className="text-white/75 normal-case">{label}</span>
      <Copy className="h-3 w-3 opacity-70" />
    </button>
  );
}

export default function PromoBanner() {
  return (
    <div className="edm-section-dark text-white text-xs sm:text-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">{PROMO_COPY.headline}</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CouponBox code={PROMO_COPY.couponCode} label="New Customers" />
          <CouponBox code={PROMO_COPY.repeatCode} label="Returning" />
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { PROMO_COPY } from "@/data/everydaymedsSite";
import { toast } from "sonner";

export default function PromoBanner() {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_COPY.couponCode);
      setCopied(true);
      toast.success("Coupon code copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy code");
    }
  };

  return (
    <div className="bg-primary text-primary-foreground text-center text-sm sm:text-base py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span className="font-medium">{PROMO_COPY.headline}</span>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 text-xs sm:text-sm font-semibold transition-colors"
          data-testid="btn-copy-promo-code"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          Code: {PROMO_COPY.couponCode}
        </button>
      </div>
    </div>
  );
}

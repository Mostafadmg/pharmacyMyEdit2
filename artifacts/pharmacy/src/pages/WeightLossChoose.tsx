import React from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import SiteLayout from "@/components/layout/SiteLayout";

/** Injectable vs oral picker — consultation flows unchanged. */
export default function WeightLossChoose() {
  return (
    <SiteLayout className="min-h-screen bg-[#FAF6F0] flex flex-col">
      <section className="max-w-5xl mx-auto w-full px-6 py-16 flex-1">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-secondary" data-testid="weight-loss-heading">
            Let&apos;s get started
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose the type of weight loss treatment you&apos;re looking for
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="rounded-3xl bg-[#0E3D2D] text-white p-8 min-h-[280px] flex flex-col">
            <h2 className="text-4xl font-serif font-bold mb-4">Injectable Pens</h2>
            <p className="text-xl mb-auto opacity-95">I want to take an injectable to lose weight</p>
            <Link
              href="/consultation/weight-loss-injectable"
              className="rounded-full bg-[#B5DA37] text-[#0E3D2D] hover:bg-[#A8CC2E] px-5 py-2 inline-flex items-center gap-1.5 text-sm font-semibold w-fit mt-6"
              data-testid="get-started-injectable"
            >
              Start Treatment <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-[#0E3D2D] text-white p-8 min-h-[280px] flex flex-col">
            <h2 className="text-4xl font-serif font-bold mb-4">Oral Tablets</h2>
            <p className="text-xl mb-auto opacity-95">I want to take a tablet to lose weight</p>
            <Link
              href="/consultation/weight-loss-oral"
              className="rounded-full bg-[#B5DA37] text-[#0E3D2D] hover:bg-[#A8CC2E] px-5 py-2 inline-flex items-center gap-1.5 text-sm font-semibold w-fit mt-6"
              data-testid="get-started-oral"
            >
              Start Treatment <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

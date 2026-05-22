import React from "react";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function WeightLoss() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col">
      <Header />
      <section className="max-w-5xl mx-auto w-full px-6 py-16 pt-24 flex-1">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-secondary" data-testid="weight-loss-heading">
            Let's get started
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose the type of weight loss treatment you're looking for
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="rounded-3xl bg-[#0E3D2D] text-white p-8 min-h-[280px] flex flex-col">
            <h2 className="text-4xl font-serif font-bold mb-4">Injectable Pens</h2>
            <p className="text-xl mb-auto opacity-95">
              I Want to take an injectable to lose weight
            </p>
            <Link
              href="/injectable-weight-loss"
              className="rounded-full bg-[#B5DA37] text-[#0E3D2D] hover:bg-[#A8CC2E] px-5 py-2 inline-flex items-center gap-1.5 text-sm font-semibold w-fit mt-6"
              data-testid="get-started-injectable"
            >
              Start Treatment <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-[#0E3D2D] text-white p-8 min-h-[280px] flex flex-col">
            <h2 className="text-4xl font-serif font-bold mb-4">Oral Tablets</h2>
            <p className="text-xl mb-auto opacity-95">
              I Want to take a tablet to lose weight
            </p>
            <Link
              href="/treatments/orlistat"
              className="rounded-full bg-[#B5DA37] text-[#0E3D2D] hover:bg-[#A8CC2E] px-5 py-2 inline-flex items-center gap-1.5 text-sm font-semibold w-fit mt-6"
              data-testid="get-started-oral"
            >
              Start Treatment <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

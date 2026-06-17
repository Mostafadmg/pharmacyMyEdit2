import React from "react";
import SiteLayout from "@/components/layout/SiteLayout";

interface LegalPageProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, subtitle, lastUpdated = "May 2025", children }: LegalPageProps) {
  return (
    <SiteLayout className="min-h-screen flex flex-col bg-white edm-site">
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#314a40] mb-2">{title}</h1>
          {subtitle ? <p className="text-gray-600 mb-2">{subtitle}</p> : null}
          <p className="text-xs text-gray-400 mb-8">Last updated: {lastUpdated}</p>
          <article className="space-y-6 text-[15px] leading-relaxed text-gray-700 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#314a40] [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-[#314a40] [&_a]:underline">
            {children}
          </article>
        </div>
      </main>
    </SiteLayout>
  );
}

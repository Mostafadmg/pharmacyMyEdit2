import React from "react";
import SiteLayout from "@/components/layout/SiteLayout";

type EdmPolicyPageProps = {
  title: string;
  children: React.ReactNode;
};

/** Shopify-style policy page shell matching everydaymeds.co.uk */
export default function EdmPolicyPage({ title, children }: EdmPolicyPageProps) {
  return (
    <SiteLayout className="min-h-screen flex flex-col bg-white edm-site">
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#314a40] mb-8">{title}</h1>
          <article className="space-y-6 text-[15px] leading-relaxed text-gray-700 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#314a40] [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:text-[#314a40] [&_a]:underline">
            {children}
          </article>
        </div>
      </main>
    </SiteLayout>
  );
}

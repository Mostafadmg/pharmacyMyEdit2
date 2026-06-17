import React from "react";
import SiteLayout from "@/components/layout/SiteLayout";
import HomeHero from "@/components/marketing/homepage/HomeHero";
import HomeTrustBar from "@/components/marketing/homepage/HomeTrustBar";
import HomeAssistSection from "@/components/marketing/homepage/HomeAssistSection";
import HomeExploreRow from "@/components/marketing/homepage/HomeExploreRow";
import HomeSafeSecure from "@/components/marketing/homepage/HomeSafeSecure";
import HomeHowItWorks from "@/components/marketing/homepage/HomeHowItWorks";
import HomeFAQ from "@/components/HomeFAQ";

export default function Home() {
  return (
    <SiteLayout className="min-h-screen flex flex-col bg-[#faf6f3] edm-site">
      <main className="flex-1 w-full">
        <HomeHero />
        <HomeTrustBar />
        <HomeAssistSection />
        <HomeExploreRow />
        <HomeSafeSecure />
        <HomeHowItWorks />
        <HomeFAQ variant="live" />
      </main>
    </SiteLayout>
  );
}

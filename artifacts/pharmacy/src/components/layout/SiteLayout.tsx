import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PromoBanner from "@/components/PromoBanner";

type SiteLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SiteLayout({ children, className = "min-h-screen flex flex-col bg-background font-sans" }: SiteLayoutProps) {
  return (
    <div className={className}>
      <PromoBanner />
      <Header />
      {children}
      <Footer />
    </div>
  );
}

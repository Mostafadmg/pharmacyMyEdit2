import React, { useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PatientMessageInbox from "@/components/PatientMessageInbox";

export default function PatientMessages() {
  const [location, navigate] = useLocation();

  const consultationFromUrl = useMemo(() => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    return params.get("consultation") || params.get("order") || null;
  }, [location]);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 md:py-10">
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link
            href="/account"
            className="inline-flex items-center gap-1 font-medium hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Your account
          </Link>
        </nav>

        <header className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-secondary md:text-3xl">
            Messages
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One conversation with your pharmacy team. Replies usually within one working day.
          </p>
        </header>

        <PatientMessageInbox
          className="min-h-[520px]"
          initialConsultationId={consultationFromUrl}
        />

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Delivery or billing questions?{" "}
          <Link href="/account/customer-service" className="font-medium text-primary hover:underline">
            Customer service
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

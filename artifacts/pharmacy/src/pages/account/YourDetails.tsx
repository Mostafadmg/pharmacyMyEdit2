import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { CreditCard, KeyRound, Stethoscope, ChevronRight, ChevronLeft, LogOut, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

function DetailCard({
  href, icon: Icon, title, description, "data-testid": testId,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  "data-testid"?: string;
}) {
  return (
    <Link href={href} data-testid={testId}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group bg-white rounded-2xl border border-border/40 hover:border-primary/40 hover:shadow-md transition-all p-5 md:p-6 flex items-center gap-4 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-secondary">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
      </motion.div>
    </Link>
  );
}

export default function YourDetails() {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!localStorage.getItem("patient_token")) navigate("/my-account/login");
  }, [navigate]);

  function logout() {
    ["patient_token", "patient_name", "patient_email", "patient_id"].forEach(k => localStorage.removeItem(k));
    navigate("/");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F1EC]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-6 py-8 md:py-12">
        <nav className="flex items-center text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/account" className="hover:text-primary inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Your account
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Your details</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary">Your details</h1>
        <p className="text-muted-foreground mt-1">Manage your personal, payment and GP details.</p>

        <div className="mt-8 space-y-3">
          <DetailCard
            href="/account/details/payments"
            icon={CreditCard}
            title="My payments"
            description="Securely save your debit or credit card details to save time at checkout"
            data-testid="card-payments"
          />
          <DetailCard
            href="/account/details/password"
            icon={KeyRound}
            title="Change password"
            description="Keep your account secure by regularly updating your password"
            data-testid="card-password"
          />
          <DetailCard
            href="/account/details/gp"
            icon={Stethoscope}
            title="GP details"
            description="Add or update your GP information at any time"
            data-testid="card-gp"
          />
        </div>

        <div className="mt-8 bg-white border border-emerald-100 rounded-2xl p-5 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-secondary">Your data is encrypted</p>
            <p className="text-sm text-muted-foreground">
              Card details are tokenised by our payment provider — we never store the full number on our servers.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={logout}
            variant="outline"
            className="rounded-full px-8 border-2 border-primary text-primary hover:bg-primary/5 font-semibold"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

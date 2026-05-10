import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Package, CreditCard, Repeat, Gift, LifeBuoy, LogOut, ChevronRight,
  Stethoscope, Bell, ChevronLeft, Pill, Settings, ShieldCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type Counts = { ordersTotal: number; ordersOpen: number; consultsOpen: number; unreadMessages: number; unreadNotifications: number; rxCount: number; creditsPence: number };

function AccountCard({
  href, icon: Icon, title, description, badge, image, "data-testid": testId,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  image?: string;
  "data-testid"?: string;
}) {
  return (
    <Link href={href} data-testid={testId}>
      <motion.div
        whileHover={{ y: -2 }}
        className="group bg-white rounded-2xl border border-border/40 hover:border-primary/40 hover:shadow-md transition-all p-5 md:p-6 flex items-center gap-4 cursor-pointer mt-[10px] mb-[10px]"
      >
        {image ? (
          <img src={image} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg md:text-xl font-bold text-secondary">{title}</h3>
            {badge && (
              <span className="inline-flex items-center text-xs font-semibold bg-accent/15 text-accent rounded-full px-2 py-0.5">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
      </motion.div>
    </Link>
  );
}

export default function AccountHub() {
  const [, navigate] = useLocation();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({ ordersTotal: 0, ordersOpen: 0, consultsOpen: 0, unreadMessages: 0, unreadNotifications: 0, rxCount: 0, creditsPence: 0 });

  useEffect(() => {
    const token = localStorage.getItem("patient_token");
    if (!token) {
      navigate("/my-account/login");
      return;
    }
    setName(localStorage.getItem("patient_name"));
    setEmail(localStorage.getItem("patient_email"));

    // Pull lightweight stats so cards can show live counts. Failures fall back silently.
    Promise.allSettled([
      apiFetch<{ orders: Array<{ status: string }> }>("/api/orders", { auth: "patient" }),
      apiFetch<{ consultations: Array<{ status: string }> }>("/api/patient/consultations", { auth: "patient" }).catch(() => ({ consultations: [] })),
      apiFetch<{ unreadCount: number }>("/api/notifications?unreadOnly=true&limit=1", { auth: "patient" }).catch(() => ({ unreadCount: 0 })),
      apiFetch<{ prescriptions: Array<unknown> }>("/api/patient/prescriptions", { auth: "patient" }).catch(() => ({ prescriptions: [] })),
      apiFetch<{ balancePence: number }>("/api/patient/referral", { auth: "patient" }).catch(() => ({ balancePence: 0 })),
    ]).then(([oRes, cRes, nRes, rxRes, refRes]) => {
      const orders = oRes.status === "fulfilled" ? oRes.value.orders : [];
      const consults = cRes.status === "fulfilled" ? (cRes.value as { consultations: Array<{ status: string }> }).consultations : [];
      const unread = nRes.status === "fulfilled" ? (nRes.value as { unreadCount: number }).unreadCount : 0;
      const rx = rxRes.status === "fulfilled" ? (rxRes.value as { prescriptions: Array<unknown> }).prescriptions.length : 0;
      const credits = refRes.status === "fulfilled" ? (refRes.value as { balancePence: number }).balancePence : 0;
      setCounts({
        ordersTotal: orders.length,
        ordersOpen: orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length,
        consultsOpen: consults.filter(c => ["pending", "in_review"].includes(c.status)).length,
        unreadMessages: 0,
        unreadNotifications: unread,
        rxCount: rx,
        creditsPence: credits,
      });
    });
  }, [navigate]);

  function logout() {
    ["patient_token", "patient_name", "patient_email", "patient_id"].forEach(k => localStorage.removeItem(k));
    navigate("/");
  }

  const firstName = name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F1EC]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-6 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Your account</span>
        </nav>

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary">
            Welcome back, {firstName}
          </h1>
          {email && <p className="text-muted-foreground mt-1">Signed in as {email}</p>}
        </motion.div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 mb-8">
          <div className="bg-white rounded-2xl border border-border/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Open orders</p>
            <p className="text-2xl font-bold text-primary mt-1">{counts.ordersOpen}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total orders</p>
            <p className="text-2xl font-bold text-secondary mt-1">{counts.ordersTotal}</p>
          </div>
          <div className="bg-white rounded-2xl border border-border/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Consults in review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{counts.consultsOpen}</p>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-6 md:space-y-8">
          <AccountCard
            href="/my-orders"
            icon={Package}
            title="Order history"
            description="View all orders, track deliveries and quickly reorder treatments"
            badge={counts.ordersOpen > 0 ? `${counts.ordersOpen} open` : undefined}
            data-testid="card-order-history"
          />
          <AccountCard
            href="/my-consultations"
            icon={Stethoscope}
            title="My consultations"
            description="Review your clinical history and follow up on outcomes"
            badge={counts.consultsOpen > 0 ? `${counts.consultsOpen} in review` : undefined}
            data-testid="card-consultations"
          />
          <AccountCard
            href="/account/subscriptions"
            icon={Repeat}
            title="My subscriptions"
            description="View and manage your repeat treatment subscriptions"
            data-testid="card-subscriptions"
          />
          <AccountCard
            href="/account/details"
            icon={CreditCard}
            title="Your details"
            description="Manage your personal, payment and GP details"
            data-testid="card-details"
          />
          <AccountCard
            href="/account/notifications"
            icon={Bell}
            title="Notifications"
            description="Replies from your prescriber, dispatch updates and account alerts"
            badge={counts.unreadNotifications > 0 ? `${counts.unreadNotifications} unread` : undefined}
            data-testid="card-notifications"
          />
          <AccountCard
            href="/account/prescriptions"
            icon={Pill}
            title="My prescriptions"
            description="Download signed PDFs and request repeats from your prescriber"
            badge={counts.rxCount > 0 ? `${counts.rxCount}` : undefined}
            data-testid="card-prescriptions"
          />
          <AccountCard
            href="/account/refer"
            icon={Gift}
            title="£25 off for you and your friends"
            description="Refer a friend and you'll both get £25 credit"
            badge={counts.creditsPence > 0 ? `£${(counts.creditsPence / 100).toFixed(2)} balance` : undefined}
            data-testid="card-refer"
          />
          <AccountCard
            href="/account/preferences"
            icon={Settings}
            title="Communication preferences"
            description="Choose which emails, SMS and offers you receive"
            data-testid="card-preferences"
          />
          <AccountCard
            href="/account/data-and-privacy"
            icon={ShieldCheck}
            title="Data & privacy"
            description="Download your data or close your account (UK GDPR)"
            data-testid="card-data-privacy"
          />
          <AccountCard
            href="/account/customer-service"
            icon={LifeBuoy}
            title="Customer service"
            description="Message your prescriber, contact our team or browse FAQs"
            data-testid="card-support"
          />
        </div>

        {/* Log out */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            onClick={logout}
            variant="outline"
            className="rounded-full px-8 border-2 border-primary text-primary hover:bg-primary/5 font-semibold"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
          <p className="text-xs text-muted-foreground">
            Tip: enable notifications in your browser to hear back from your prescriber faster.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

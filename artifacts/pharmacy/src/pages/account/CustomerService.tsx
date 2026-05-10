import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, HelpCircle, Phone, Mail, AlertTriangle, ChevronRight } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";

const PARENTS = [{ label: "Your account", href: "/account" }];

function ServiceTile({
  href, icon: Icon, title, description, external, "data-testid": testId,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  external?: boolean;
  "data-testid"?: string;
}) {
  const inner = (
    <div className="group bg-white rounded-2xl border border-border/40 hover:border-primary/40 hover:shadow-md transition-all p-5 md:p-6 h-full flex items-start gap-4 cursor-pointer">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-secondary">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
    </div>
  );
  if (external) {
    return <a href={href} data-testid={testId}>{inner}</a>;
  }
  return <Link href={href} data-testid={testId}>{inner}</Link>;
}

export default function CustomerService() {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!localStorage.getItem("patient_token")) navigate("/my-account/login");
  }, [navigate]);

  return (
    <AccountSubPage
      parents={PARENTS}
      title="Customer service"
      intro="We're here to help. Message your prescriber about a consultation, get in touch with our customer care team, or browse our FAQs."
    >
      <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
        <ServiceTile
          href="/my-consultations"
          icon={MessageSquare}
          title="Message your prescriber"
          description="Reply to questions about a consultation or ask a clinical follow-up."
          data-testid="card-message-prescriber"
        />
        <ServiceTile
          href="/contact"
          icon={HelpCircle}
          title="Contact customer care"
          description="Order, delivery and account queries — we usually reply within 1 working hour."
          data-testid="card-contact"
        />
        <ServiceTile
          href="tel:08001234567"
          icon={Phone}
          title="Call us"
          description="Mon–Fri 8am–8pm · Sat–Sun 9am–5pm · 0800 123 4567"
          external
          data-testid="card-call"
        />
        <ServiceTile
          href="mailto:care@pharmacare.co.uk"
          icon={Mail}
          title="Email us"
          description="care@pharmacare.co.uk — for non-urgent enquiries."
          external
          data-testid="card-email"
        />
      </div>

      <div className="mt-8 max-w-3xl bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-rose-900">In a medical emergency, call 999.</p>
          <p className="text-sm text-rose-800 mt-0.5">
            For urgent but non-life-threatening advice, call NHS 111 or visit{" "}
            <a href="https://111.nhs.uk" target="_blank" rel="noopener noreferrer" className="underline font-semibold">111.nhs.uk</a>.
            We are an online pharmacy — we cannot provide emergency care.
          </p>
        </div>
      </div>
    </AccountSubPage>
  );
}

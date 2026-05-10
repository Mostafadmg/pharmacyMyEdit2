import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CreditCard, Plus, Lock } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";

const PARENTS = [
  { label: "Your account", href: "/account" },
  { label: "Your details", href: "/account/details" },
];

export default function MyPayments() {
  const [, navigate] = useLocation();
  const [cards] = useState<Array<{ id: string; last4: string; brand: string; expMonth: number; expYear: number }>>([]);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) navigate("/my-account/login");
  }, [navigate]);

  return (
    <AccountSubPage
      parents={PARENTS}
      title="My payments"
      intro="Securely save your debit or credit card details to save time at checkout."
    >
      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-secondary">You have no saved cards yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Add a card to make checkout faster next time. We use Stripe to tokenise your details, so your card number
            never touches our servers.
          </p>
          <Button
            disabled
            className="rounded-full mt-6 bg-primary hover:bg-primary/90"
            data-testid="button-add-card"
            title="Card management coming soon"
          >
            <Plus className="w-4 h-4 mr-2" /> Add a card
          </Button>
          <p className="text-xs text-muted-foreground mt-3 inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> Coming soon — for now, cards are saved at checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-border/40 p-5 flex items-center gap-4">
              <CreditCard className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <p className="font-bold capitalize">{c.brand} •••• {c.last4}</p>
                <p className="text-sm text-muted-foreground">Expires {String(c.expMonth).padStart(2, "0")}/{c.expYear}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full">Remove</Button>
            </div>
          ))}
        </div>
      )}
    </AccountSubPage>
  );
}

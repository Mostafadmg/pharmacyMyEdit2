import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Repeat, ShoppingBag } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";

const PARENTS = [{ label: "Your account", href: "/account" }];

export default function MySubscriptions() {
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!localStorage.getItem("patient_token")) navigate("/my-account/login");
  }, [navigate]);

  return (
    <AccountSubPage parents={PARENTS} title="My subscriptions" intro="View and manage your repeat treatment subscriptions.">
      <div className="bg-white rounded-2xl border border-dashed border-border/60 p-10 text-center max-w-2xl">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Repeat className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-secondary">No active subscriptions</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Subscriptions let you save up to 10% on selected treatments and have them delivered automatically. Browse the
          shop to start one, or request a follow-up consultation from your last order.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/shop"><ShoppingBag className="w-4 h-4 mr-2" /> Browse the shop</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/my-orders">View past orders</Link>
          </Button>
        </div>
      </div>
    </AccountSubPage>
  );
}

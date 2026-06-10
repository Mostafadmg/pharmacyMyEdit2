import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Gift, Copy, Mail, Share2, Wallet, Loader2 } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

const PARENTS = [{ label: "Your account", href: "/account" }];

type Credit = {
  id: string;
  amountPence: number;
  sourceType: string;
  description: string | null;
  createdAt: string;
};
type ReferralData = { code: string; balancePence: number; history: Credit[] };

const SOURCE_LABEL: Record<string, string> = {
  referral_signup: "Friend signup bonus",
  referral_first_order: "Friend's first order",
  checkout_apply: "Applied at checkout",
  manual_adjustment: "Adjustment",
};

export default function ReferFriend() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
      return;
    }
    apiFetch<ReferralData>("/api/patient/referral", { auth: "patient" })
      .then(setData)
      .catch(err => toast.error(err instanceof Error ? err.message : "Couldn't load your referral info."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const code = data?.code ?? "";
  const link = typeof window !== "undefined" && code ? `${window.location.origin}/?ref=${code}` : "";

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied.`),
      () => toast.error("Copy failed — please copy manually."),
    );
  }

  function shareNative() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      navigator.share({
        title: "EveryDayMeds — £25 off",
        text: `I trust EveryDayMeds for my UK pharmacy needs. Use my code ${code} for £25 off your first order.`,
        url: link,
      }).catch(() => { /* user cancelled */ });
    } else {
      copy(link, "Link");
    }
  }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="Refer a friend"
      intro="When a friend orders for the first time using your code, you'll both get £25 off."
    >
      {loading ? (
        <div className="space-y-3 max-w-3xl">
          <div className="h-48 bg-white border border-border/40 rounded-2xl animate-pulse" />
          <div className="h-32 bg-white border border-border/40 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Credit balance */}
          <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6 md:p-7 max-w-3xl mb-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <p className="text-sm uppercase tracking-wider opacity-80 font-semibold">Your credit balance</p>
              <p className="text-3xl md:text-4xl font-extrabold mt-1">£{((data?.balancePence ?? 0) / 100).toFixed(2)}</p>
              <p className="text-xs opacity-80 mt-1">Auto-applied at checkout — no code needed.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
            <div className="md:col-span-2 bg-white rounded-2xl border border-border/40 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-bold text-secondary text-lg">Your referral code</p>
                  <p className="text-sm text-muted-foreground">Share this with friends and family.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={code} readOnly className="font-mono text-lg font-bold tracking-widest text-center sm:text-left" data-testid="input-referral-code" />
                <Button
                  type="button"
                  onClick={() => copy(code, "Code")}
                  className="rounded-full bg-primary hover:bg-primary/90"
                  data-testid="button-copy-code"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy code
                </Button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Input value={link} readOnly className="text-sm" data-testid="input-referral-link" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copy(link, "Link")}
                  className="rounded-full"
                  data-testid="button-copy-link"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy link
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <Button type="button" variant="outline" className="rounded-full" onClick={shareNative} data-testid="button-share">
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
                <Button asChild type="button" variant="outline" className="rounded-full">
                  <a href={`mailto:?subject=£25%20off%20your%20first%20EveryDayMeds%20order&body=Use%20my%20code%20${encodeURIComponent(code)}%20at%20${encodeURIComponent(link)}%20—%20we%20both%20get%20£25%20off.`} data-testid="button-share-email">
                    <Mail className="w-4 h-4 mr-2" /> Email a friend
                  </a>
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl border border-border/40 p-6">
              <h3 className="font-bold text-secondary">How it works</h3>
              <ol className="mt-3 space-y-3 text-sm">
                <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span> Share your code with a friend.</li>
                <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span> They get £25 off their first order.</li>
                <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span> You get £25 credit when their order ships.</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">Codes are single-use per friend and exclude prescription-only products.</p>
            </div>
          </div>

          {/* Credit history */}
          {(data?.history?.length ?? 0) > 0 && (
            <div className="mt-6 max-w-3xl bg-white rounded-2xl border border-border/40 p-6">
              <h3 className="font-bold text-secondary mb-3">Credit history</h3>
              <ul className="divide-y divide-border/40">
                {data!.history.map(h => (
                  <li key={h.id} className="flex items-center justify-between py-3 text-sm" data-testid={`credit-${h.id}`}>
                    <div>
                      <p className="font-medium">{SOURCE_LABEL[h.sourceType] ?? h.sourceType}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {h.description ? ` · ${h.description}` : ""}
                      </p>
                    </div>
                    <span className={`font-bold ${h.amountPence >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {h.amountPence >= 0 ? "+" : "−"}£{Math.abs(h.amountPence / 100).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </AccountSubPage>
  );
}

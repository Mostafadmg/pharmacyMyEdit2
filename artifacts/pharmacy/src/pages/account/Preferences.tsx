import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Mail, MessageSquare, Megaphone, ShieldCheck } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const PARENTS = [{ label: "Your account", href: "/account" }];

type Prefs = { commsEmail: boolean; commsSms: boolean; marketingOptIn: boolean };

const DEFAULTS: Prefs = { commsEmail: true, commsSms: false, marketingOptIn: false };

function Row({
  icon: Icon, title, description, value, onChange, locked, "data-testid": testId,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  "data-testid"?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border/40 p-5 md:p-6 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-secondary">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        {locked && (
          <p className="text-xs text-amber-700 mt-1.5 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Required for clinical safety — can't be turned off.
          </p>
        )}
      </div>
      <Switch checked={value} onCheckedChange={onChange} disabled={locked} data-testid={testId} />
    </div>
  );
}

export default function Preferences() {
  const [, navigate] = useLocation();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
      return;
    }
    apiFetch<Prefs>("/api/patient/preferences", { auth: "patient" })
      .then(p => setPrefs(p))
      .catch(() => { /* defaults */ })
      .finally(() => setLoading(false));
  }, [navigate]);

  function update(patch: Partial<Prefs>) {
    setPrefs(p => ({ ...p, ...patch }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await apiFetch<Prefs>("/api/patient/preferences", {
        method: "PUT",
        auth: "patient",
        body: JSON.stringify(prefs),
      });
      setPrefs(updated);
      setDirty(false);
      toast.success("Preferences saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="Communication preferences"
      intro="Choose how you'd like to hear from us. Clinical and order updates can't be turned off — they're part of the safe-prescribing service."
    >
      {loading ? (
        <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-24 bg-white border border-border/40 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <>
          <div className="space-y-3 max-w-2xl">
            <Row
              icon={Mail}
              title="Clinical & order email"
              description="Consultation outcomes, prescription receipts, dispatch and delivery updates."
              value={true}
              onChange={() => { /* locked */ }}
              locked
            />
            <Row
              icon={Mail}
              title="Account email"
              description="Password resets, security alerts, and replies from your prescriber."
              value={prefs.commsEmail}
              onChange={v => update({ commsEmail: v })}
              data-testid="switch-comms-email"
            />
            <Row
              icon={MessageSquare}
              title="SMS notifications"
              description="Optional text-message alerts when your order is out for delivery."
              value={prefs.commsSms}
              onChange={v => update({ commsSms: v })}
              data-testid="switch-comms-sms"
            />
            <Row
              icon={Megaphone}
              title="Marketing & offers"
              description="Health tips, new treatments and the occasional discount. We'll never share your address."
              value={prefs.marketingOptIn}
              onChange={v => update({ marketingOptIn: v })}
              data-testid="switch-marketing"
            />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 font-semibold"
              data-testid="button-save-preferences"
            >
              {saving ? "Saving…" : dirty ? "Save preferences" : "Saved"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Withdraw consent any time. See our <a className="underline" href="/legal/privacy">privacy policy</a>.
            </p>
          </div>
        </>
      )}
    </AccountSubPage>
  );
}

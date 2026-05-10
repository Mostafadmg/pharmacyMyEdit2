import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

const PARENTS = [
  { label: "Your account", href: "/account" },
  { label: "Your details", href: "/account/details" },
];

export default function ChangePassword() {
  const [, navigate] = useLocation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) navigate("/my-account/login");
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (next !== confirm) { toast.error("New password and confirmation don't match."); return; }
    setSubmitting(true);
    try {
      await apiFetch("/api/patient/password", {
        method: "POST",
        auth: "patient",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      toast.success("Password updated.");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      // The endpoint may not exist yet — surface the error cleanly.
      toast.error(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="Change password"
      intro="Keep your account secure by regularly updating your password."
    >
      <form onSubmit={submit} className="bg-white rounded-2xl border border-border/40 p-6 md:p-8 max-w-xl space-y-5">
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1.5"
            data-testid="input-current-password"
          />
        </div>
        <div>
          <Label htmlFor="next">New password</Label>
          <div className="relative mt-1.5">
            <Input
              id="next"
              type={showNext ? "text" : "password"}
              value={next}
              onChange={e => setNext(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              data-testid="input-new-password"
            />
            <button
              type="button"
              onClick={() => setShowNext(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showNext ? "Hide password" : "Show password"}
            >
              {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">At least 8 characters. Mix letters, numbers and symbols for the strongest password.</p>
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            className="mt-1.5"
            data-testid="input-confirm-password"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2">
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full px-8 bg-primary hover:bg-primary/90 font-semibold"
            data-testid="button-save-password"
          >
            {submitting ? "Saving…" : "Save new password"}
          </Button>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> We'll sign you out of all other devices.
          </p>
        </div>
      </form>
    </AccountSubPage>
  );
}

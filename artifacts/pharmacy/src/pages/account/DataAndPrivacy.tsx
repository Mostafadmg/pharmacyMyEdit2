import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Download, ShieldAlert, ShieldCheck, Loader2, RotateCcw, Calendar } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import { apiFetch, apiUrl } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const PARENTS = [{ label: "Your account", href: "/account" }];

export default function DataAndPrivacy() {
  const [, navigate] = useLocation();
  const [downloading, setDownloading] = useState(false);
  const [requestedAt, setRequestedAt] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
      return;
    }
    setLoadingProfile(false);
  }, [navigate]);

  async function downloadData() {
    setDownloading(true);
    const token = localStorage.getItem("patient_token") ?? "";
    try {
      const res = await fetch(apiUrl("/api/patient/data-export"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pharmacare-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Your data export has been downloaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not download your data.");
    } finally {
      setDownloading(false);
    }
  }

  async function requestDeletion() {
    setWorking(true);
    try {
      const r = await apiFetch<{ deletionRequestedAt: string | null }>("/api/patient/account-deletion", {
        method: "POST",
        auth: "patient",
      });
      setRequestedAt(r.deletionRequestedAt);
      setConfirming(false);
      toast.success("Account deletion requested. We'll be in touch within 30 days.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request deletion.");
    } finally {
      setWorking(false);
    }
  }

  async function cancelDeletion() {
    setWorking(true);
    try {
      await apiFetch("/api/patient/account-deletion", { method: "DELETE", auth: "patient" });
      setRequestedAt(null);
      toast.success("Deletion request cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel deletion.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="Data & privacy"
      intro="Download a copy of your personal data, or close your EveryDayMeds account. We follow UK GDPR — your records are kept only as long as the law requires for safe prescribing."
    >
      <div className="space-y-4 max-w-2xl">
        {/* Download */}
        <div className="bg-white rounded-2xl border border-border/40 p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-secondary">Download my data</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your account, orders, consultations, messages and notification history as a single JSON file.
              </p>
              <Button
                onClick={downloadData}
                disabled={downloading}
                className="rounded-full mt-4 bg-primary hover:bg-primary/90"
                data-testid="button-download-data"
              >
                {downloading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing…</>
                  : <><Download className="w-4 h-4 mr-2" /> Download (.json)</>}
              </Button>
            </div>
          </div>
        </div>

        {/* Delete */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-secondary">Close my account</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                We'll deactivate your account immediately and erase personal data after 30 days.
                Clinical records that we are required to keep by GPhC and CQC rules will be retained for the statutory period (10 years).
              </p>
              {requestedAt ? (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">Deletion requested {new Date(requestedAt).toLocaleDateString("en-GB")}</p>
                    <p className="text-xs text-amber-800 mt-0.5">Your account will close on {new Date(new Date(requestedAt).getTime() + 30 * 86400000).toLocaleDateString("en-GB")}. You can cancel any time before then.</p>
                    <Button
                      onClick={cancelDeletion}
                      disabled={working}
                      variant="outline"
                      className="rounded-full mt-3 border-amber-300 text-amber-900 hover:bg-amber-100"
                      data-testid="button-cancel-deletion"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Keep my account
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setConfirming(true)}
                  disabled={loadingProfile}
                  variant="outline"
                  className="rounded-full mt-4 border-rose-300 text-rose-700 hover:bg-rose-50"
                  data-testid="button-request-deletion"
                >
                  Request account closure
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Reassurance */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-secondary">Your data is encrypted at rest</p>
            <p className="text-sm text-muted-foreground">
              We never sell or share your data. Stored in UK/EU data centres, accessed only by our prescribing team and engineers under strict audit logging.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to close your account?</DialogTitle>
            <DialogDescription>
              We'll deactivate access immediately. You won't be able to place new orders or read past messages.
              You can cancel this request within 30 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)} className="rounded-full">Keep my account</Button>
            <Button
              onClick={requestDeletion}
              disabled={working}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white"
              data-testid="button-confirm-deletion"
            >
              {working ? "Submitting…" : "Yes, close my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccountSubPage>
  );
}

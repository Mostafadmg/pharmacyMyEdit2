import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import DevTestCredentialsHint from "@/components/dev/DevTestCredentialsHint";
import type { DevCredential } from "@/lib/devTestCredentials";

type SignInModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function SignInModal({ open, onClose }: SignInModalProps) {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function useTestAccount(account: DevCredential) {
    setEmail(account.username);
    setPassword(account.password);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const json = await apiFetch<{
        token: string;
        patientId: string;
        name: string;
        email: string;
      }>("/api/auth/patient-login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      localStorage.setItem("patient_token", json.token);
      localStorage.setItem("patient_name", json.name);
      localStorage.setItem("patient_email", json.email);
      localStorage.setItem("patient_id", json.patientId);

      toast.success(`Welcome back, ${json.name.split(" ")[0]}!`);
      onClose();
      navigate("/pages/my-orders");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close sign in"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-8 pt-10 pb-8">
          <h2 id="sign-in-title" className="text-2xl font-bold text-gray-900 text-center">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-500 text-center">
            Please enter your details below to sign in.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="modal-email">Your email*</Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 rounded-xl border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-password">Password*</Label>
              <div className="relative">
                <Input
                  id="modal-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-gray-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link href="/my-account/login" className="text-sm text-[#314a40] hover:underline" onClick={onClose}>
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#314a40] hover:bg-[#2a4038] text-white font-semibold"
            >
              {loading ? "Signing in…" : "Login"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-gray-900 text-gray-900 font-semibold hover:bg-gray-50"
              asChild
            >
              <Link href="/my-account/register" onClick={onClose}>
                Create Account
              </Link>
            </Button>
          </form>

          <DevTestCredentialsHint
            role="patient"
            variant="light"
            className="mt-6"
            onUseAccount={useTestAccount}
            compact
          />
        </div>
      </div>
    </div>
  );
}

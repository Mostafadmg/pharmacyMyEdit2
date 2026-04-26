import React, { useState } from "react";
import { useLocation } from "wouter";
import { pharmacistLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Plus, Shield, Lock, User } from "lucide-react";

export default function PharmacistLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: "Required", description: "Please enter your username and password.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const resp = await pharmacistLogin({ data: { username: username.trim(), password } });
      localStorage.setItem("pharmacist_token", resp.token);
      localStorage.setItem("pharmacist_name", resp.pharmacistName);
      localStorage.setItem("pharmacist_role", resp.role);
      toast({ title: "Welcome back", description: `Signed in as ${resp.pharmacistName}` });
      navigate("/dashboard");
    } catch {
      toast({ title: "Login failed", description: "Invalid username or password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
            <Plus className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              <span className="text-slate-800">Pharma</span>
              <span className="text-teal-600">Care</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Pharmacist Portal</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-slate-800 mb-1">Sign in to your account</h1>
          <p className="text-sm text-slate-500 mb-6">GPhC-regulated prescriber access only</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. pharmacist"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="pl-10 h-12 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-base mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              Demo: username <span className="font-bold text-slate-700">pharmacist</span> / password <span className="font-bold text-slate-700">pharmacare2024</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure encrypted connection  •  GPhC Registered Pharmacy</span>
        </div>
      </div>
    </div>
  );
}

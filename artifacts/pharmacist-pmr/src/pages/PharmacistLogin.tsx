import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { pharmacistLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Leaf, Lock, User } from "lucide-react";
import { patientAppUrl, rxPortalUrl } from "@/lib/portalLinks";
import { getPharmacistToken } from "@/lib/pharmacistSession";

export function PharmacistLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getPharmacistToken()) navigate("/");
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Required",
        description: "Enter your username and password.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const resp = await pharmacistLogin({
        username: username.trim(),
        password,
      });
      localStorage.setItem("pharmacist_token", resp.token);
      localStorage.setItem("pharmacist_name", resp.pharmacistName);
      localStorage.setItem("pharmacist_role", resp.role);
      toast({
        title: "Welcome back",
        description: `Signed in as ${resp.pharmacistName}`,
      });
      navigate("/");
    } catch {
      toast({
        title: "Login failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: `linear-gradient(135deg, var(--edm-cream) 0%, var(--edm-mint) 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--edm-dark)] text-[var(--edm-mint)] mb-4">
            <Leaf className="h-7 w-7" />
          </div>
          <div className="font-serif text-2xl font-bold text-primary">
            EveryDayMeds PMR
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dispensing system — label, check, and dispense
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          <h1 className="text-xl font-bold mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Use your pharmacist credentials (same as Rx portal)
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="pharmacist"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in to PMR"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <a href={rxPortalUrl()} className="hover:text-primary underline-offset-2 hover:underline">
            Rx Portal
          </a>
          {" · "}
          <a href={patientAppUrl()} className="hover:text-primary underline-offset-2 hover:underline">
            Patient website
          </a>
        </p>
      </div>
    </div>
  );
}

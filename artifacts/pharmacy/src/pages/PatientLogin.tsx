import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Plus, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import DevTestCredentialsHint from "@/components/dev/DevTestCredentialsHint";
import type { DevCredential } from "@/lib/devTestCredentials";

const schema = z.object({
  email: z.string().email("Valid email address required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function PatientLogin() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function useTestAccount(account: DevCredential) {
    setValue("email", account.username, { shouldValidate: true });
    setValue("password", account.password, { shouldValidate: true });
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const json = await apiFetch<{
        token: string;
        patientId: string;
        name: string;
        email: string;
      }>("/api/auth/patient-login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      localStorage.setItem("patient_token", json.token);
      localStorage.setItem("patient_name", json.name);
      localStorage.setItem("patient_email", json.email);
      localStorage.setItem("patient_id", json.patientId);

      toast.success(`Welcome back, ${json.name.split(" ")[0]}!`);
      navigate("/my-consultations");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F3460] via-[#0A2A4A] to-[#061A30] flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
            <span className="text-2xl font-bold text-white">Pharma<span className="text-[#0A7EA4]">Care</span></span>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Patient Portal</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-white/60 text-sm">Sign in to access your consultations and orders</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label className="text-white/80 text-sm font-medium mb-1.5 block">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="jane@example.com"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#0A7EA4] focus:ring-[#0A7EA4]/20 rounded-xl h-12"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <Label className="text-white/80 text-sm font-medium mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#0A7EA4] focus:ring-[#0A7EA4]/20 rounded-xl h-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0A7EA4] hover:bg-[#0A7EA4]/90 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-[#0A7EA4]/20 group"
            >
              {loading ? "Signing in..." : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Don't have an account?{" "}
            <Link href="/my-account/register" className="text-[#0A7EA4] hover:text-[#0A7EA4]/80 font-medium">
              Create one free
            </Link>
          </p>

          <DevTestCredentialsHint
            role="patient"
            variant="dark"
            className="mt-6"
            onUseAccount={useTestAccount}
          />
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          Registered with the General Pharmaceutical Council (GPhC)
        </p>
      </motion.div>
    </div>
  );
}

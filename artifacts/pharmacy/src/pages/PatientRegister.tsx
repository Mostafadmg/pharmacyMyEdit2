import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Plus, User, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email address required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function PatientRegister() {
  const [, navigate] = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/auth/patient-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");

      localStorage.setItem("patient_token", json.token);
      localStorage.setItem("patient_name", json.name);
      localStorage.setItem("patient_email", json.email);
      localStorage.setItem("patient_id", json.patientId);

      toast.success("Account created! Welcome to EveryDayMeds.");
      navigate("/my-consultations");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    "Track all your consultations in one place",
    "Receive prescription status updates",
    "Access your complete medical history",
    "Secure & NHS-compliant",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F3460] via-[#0A2A4A] to-[#061A30] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </div>
          <span className="text-2xl font-bold text-white">Pharma<span className="text-[#0A7EA4]">Care</span></span>
        </div>
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
          Your health,<br />
          <span className="text-[#0A7EA4]">your portal.</span>
        </h1>
        <p className="text-white/70 text-lg leading-relaxed mb-12">
          Create your free patient account and manage all your consultations, prescriptions and orders in one secure place.
        </p>
        <div className="space-y-4">
          {perks.map((perk, i) => (
            <motion.div
              key={perk}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-[#0A7EA4]/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#0A7EA4]" />
              </div>
              <span className="text-white/80 text-sm">{perk}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold text-white">Pharma<span className="text-[#0A7EA4]">Care</span></span>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
              <p className="text-white/60 text-sm">Join thousands of patients using EveryDayMeds</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label className="text-white/80 text-sm font-medium mb-1.5 block">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    {...register("name")}
                    placeholder="Jane Smith"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#0A7EA4] focus:ring-[#0A7EA4]/20 rounded-xl h-12"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
              </div>

              <div>
                <Label className="text-white/80 text-sm font-medium mb-1.5 block">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="jane@example.com"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#0A7EA4] focus:ring-[#0A7EA4]/20 rounded-xl h-12"
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
                    placeholder="At least 8 characters"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#0A7EA4] focus:ring-[#0A7EA4]/20 rounded-xl h-12"
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

              <div>
                <Label className="text-white/80 text-sm font-medium mb-1.5 block">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="Repeat your password"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-[#0A7EA4] focus:ring-[#0A7EA4]/20 rounded-xl h-12"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0A7EA4] hover:bg-[#0A7EA4]/90 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-[#0A7EA4]/20 group"
              >
                {loading ? "Creating account..." : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-center text-white/50 text-sm mt-6">
              Already have an account?{" "}
              <Link href="/my-account/login" className="text-[#0A7EA4] hover:text-[#0A7EA4]/80 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-white/30 text-xs mt-6 leading-relaxed">
            By creating an account you agree to our Terms of Service.<br />
            Registered with the General Pharmaceutical Council.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

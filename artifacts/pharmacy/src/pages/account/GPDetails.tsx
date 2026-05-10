import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PARENTS = [
  { label: "Your account", href: "/account" },
  { label: "Your details", href: "/account/details" },
];

const KEY = "pharmacare:gp-details:v1";

type GP = { surgeryName: string; doctorName: string; phone: string; addressLine1: string; postcode: string };

export default function GPDetails() {
  const [, navigate] = useLocation();
  const [gp, setGp] = useState<GP>({ surgeryName: "", doctorName: "", phone: "", addressLine1: "", postcode: "" });

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) navigate("/my-account/login");
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setGp({ ...gp, ...(JSON.parse(raw) as Partial<GP>) });
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem(KEY, JSON.stringify(gp));
    toast.success("GP details saved.");
  }

  function update<K extends keyof GP>(k: K, v: GP[K]) { setGp(prev => ({ ...prev, [k]: v })); }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="GP details"
      intro="We share these details with your prescriber and your GP when needed (with your consent). Adding them now makes future consultations faster."
    >
      <form onSubmit={save} className="bg-white rounded-2xl border border-border/40 p-6 md:p-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <p className="font-semibold text-secondary">Your registered GP</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="surgery">Surgery name</Label>
            <Input id="surgery" value={gp.surgeryName} onChange={e => update("surgeryName", e.target.value)} className="mt-1.5" data-testid="input-surgery" />
          </div>
          <div>
            <Label htmlFor="doctor">Doctor's name</Label>
            <Input id="doctor" value={gp.doctorName} onChange={e => update("doctorName", e.target.value)} className="mt-1.5" data-testid="input-doctor" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={gp.phone} onChange={e => update("phone", e.target.value)} className="mt-1.5" data-testid="input-phone" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addr">Address</Label>
            <Input id="addr" value={gp.addressLine1} onChange={e => update("addressLine1", e.target.value)} className="mt-1.5" data-testid="input-address" />
          </div>
          <div>
            <Label htmlFor="postcode">Postcode</Label>
            <Input id="postcode" value={gp.postcode} onChange={e => update("postcode", e.target.value)} className="mt-1.5 uppercase" data-testid="input-postcode" />
          </div>
        </div>
        <Button type="submit" className="rounded-full mt-6 px-8 bg-primary hover:bg-primary/90 font-semibold" data-testid="button-save-gp">
          Save GP details
        </Button>
      </form>
    </AccountSubPage>
  );
}

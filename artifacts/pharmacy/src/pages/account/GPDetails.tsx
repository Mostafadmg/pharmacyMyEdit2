import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import {
  GpPracticeForm,
  type GpDetailsForm,
} from "@/components/account/GpPracticeForm";

const PARENTS = [
  { label: "Your account", href: "/account" },
  { label: "Your details", href: "/account/details" },
];

const KEY = "pharmacare:gp-details:v1";

const emptyGp = (): GpDetailsForm => ({
  surgeryName: "",
  doctorName: "",
  phone: "",
  addressLine1: "",
  postcode: "",
  odsCode: "",
});

export default function GPDetails() {
  const [, navigate] = useLocation();
  const [gp, setGp] = useState<GpDetailsForm>(emptyGp);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) navigate("/my-account/login");
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setGp({ ...emptyGp(), ...(JSON.parse(raw) as Partial<GpDetailsForm>) });
    } catch {
      /* ignore */
    }
  }, [navigate]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!gp.surgeryName.trim()) {
      toast.error("Please enter your GP surgery name.");
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(gp));
    toast.success("GP details saved.");
  }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="GP details"
      intro="We share these details with your prescriber and your GP when needed (with your consent). Adding them now makes future consultations faster."
    >
      <form
        onSubmit={save}
        className="bg-white rounded-2xl border border-border/40 p-6 md:p-8 max-w-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <p className="font-semibold text-secondary">Your registered GP</p>
        </div>

        <GpPracticeForm value={gp} onChange={(patch) => setGp((prev) => ({ ...prev, ...patch }))} />

        <Button
          type="submit"
          className="rounded-full mt-6 px-8 bg-primary hover:bg-primary/90 font-semibold"
          data-testid="button-save-gp"
        >
          Save GP details
        </Button>
      </form>
    </AccountSubPage>
  );
}

import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RxPageTitle, RxShell } from "@/components/rx";
import { ShieldCheck, Award, Mail, Phone, MapPin, LogOut } from "lucide-react";
import { clearPharmacistSession, getPharmacistName } from "@/lib/pharmacistSession";

export function Profile() {
  const [, navigate] = useLocation();
  const name = getPharmacistName();
  const role =
    (typeof window !== "undefined" && localStorage.getItem("pharmacist_role")) ||
    "Pharmacist Prescriber";

  function signOut() {
    clearPharmacistSession();
    navigate("/login");
  }

  return (
    <RxShell className="max-w-[900px]">
      <RxPageTitle
        title="My Profile"
        subtitle="Your prescriber identity, registrations, and contact details."
        action={
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        }
      />
      <Card className="p-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-primary/15 text-primary flex items-center justify-center text-2xl font-semibold font-serif">
            {name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="rx-display">{name}</h2>
            <p className="rx-meta">{role}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                <ShieldCheck className="h-3 w-3" /> GPhC registered
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Award className="h-3 w-3" /> Independent Prescriber
              </Badge>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Field icon={Mail} label="Email" value="sarah.mitchell@pharmacare.co.uk" />
          <Field icon={Phone} label="Phone" value="0800 123 4567" />
          <Field icon={MapPin} label="Branch" value="Manchester Dispensary HQ" />
          <Field icon={Award} label="Specialisms" value="Women's health, weight management" />
        </div>
      </Card>
    </RxShell>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/40/50">
      <Icon className="h-4 w-4 text-emerald-800 mt-0.5" />
      <div className="min-w-0">
        <div className="rx-label-caps">{label}</div>
        <div className="rx-meta-strong truncate">{value}</div>
      </div>
    </div>
  );
}

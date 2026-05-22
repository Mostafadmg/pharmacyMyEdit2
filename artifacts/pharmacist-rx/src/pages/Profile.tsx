import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award, Mail, Phone, MapPin } from "lucide-react";

export function Profile() {
  const name =
    (typeof window !== "undefined" && localStorage.getItem("pharmacist_name")) ||
    "Pharmacist";
  const role =
    (typeof window !== "undefined" && localStorage.getItem("pharmacist_role")) ||
    "Pharmacist Prescriber";

  return (
    <div className="p-4 md:p-8 max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your prescriber identity, registrations, and contact details.
        </p>
      </div>
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
            <h2 className="text-xl font-serif font-semibold">{name}</h2>
            <p className="text-sm text-muted-foreground">{role}</p>
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
    </div>
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
    <div className="flex items-start gap-3 p-3 rounded-md border border-border">
      <Icon className="h-4 w-4 text-primary mt-0.5" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

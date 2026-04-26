import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { useListConsultations } from "@workspace/api-client-react";
import {
  Users,
  Search,
  Mail,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PharmacistLayout from "@/components/layout/PharmacistLayout";

type Consultation = {
  id: string;
  patientName: string;
  patientEmail: string;
  patientAge: number;
  patientSex: string;
  conditionName: string;
  status: string;
  riskCategory?: string | null;
  hasRedFlag?: boolean | null;
  createdAt: string;
};

type PatientRow = {
  email: string;
  name: string;
  age: number;
  sex: string;
  consultationCount: number;
  pending: number;
  approved: number;
  redFlags: number;
  highRisk: number;
  lastConditionName: string;
  lastConsultationId: string;
  lastSubmittedAt: string;
};

function aggregatePatients(consultations: Consultation[]): PatientRow[] {
  const map = new Map<string, PatientRow>();

  for (const c of consultations) {
    const key = c.patientEmail.toLowerCase();
    const existing = map.get(key);
    const submittedAt = c.createdAt;

    if (!existing) {
      map.set(key, {
        email: c.patientEmail,
        name: c.patientName,
        age: c.patientAge,
        sex: c.patientSex,
        consultationCount: 1,
        pending: c.status === "pending" ? 1 : 0,
        approved: c.status === "approved" ? 1 : 0,
        redFlags: c.hasRedFlag ? 1 : 0,
        highRisk: c.riskCategory === "high" ? 1 : 0,
        lastConditionName: c.conditionName,
        lastConsultationId: c.id,
        lastSubmittedAt: submittedAt,
      });
    } else {
      existing.consultationCount += 1;
      if (c.status === "pending") existing.pending += 1;
      if (c.status === "approved") existing.approved += 1;
      if (c.hasRedFlag) existing.redFlags += 1;
      if (c.riskCategory === "high") existing.highRisk += 1;
      if (new Date(submittedAt) > new Date(existing.lastSubmittedAt)) {
        existing.lastSubmittedAt = submittedAt;
        existing.lastConditionName = c.conditionName;
        existing.lastConsultationId = c.id;
        existing.name = c.patientName;
        existing.age = c.patientAge;
        existing.sex = c.patientSex;
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastSubmittedAt).getTime() - new Date(a.lastSubmittedAt).getTime(),
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default function PharmacistPatients() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListConsultations({ limit: 200 });
  const consultations = (data as { consultations?: Consultation[] } | undefined)?.consultations ?? [];

  const patients = useMemo(() => aggregatePatients(consultations as Consultation[]), [consultations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.lastConditionName.toLowerCase().includes(q),
    );
  }, [patients, search]);

  const totals = useMemo(
    () => ({
      total: patients.length,
      withPending: patients.filter((p) => p.pending > 0).length,
      withRedFlag: patients.filter((p) => p.redFlags > 0).length,
      highRisk: patients.filter((p) => p.highRisk > 0).length,
    }),
    [patients],
  );

  return (
    <PharmacistLayout current="patients">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-secondary tracking-tight">
            Patients
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Every patient who has used PharmaCare, with their consultation history.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or condition..."
            className="pl-10 h-11 rounded-full bg-white"
            data-testid="input-patient-search"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Total Patients"
          value={totals.total}
          tone="bg-teal-50 text-teal-700"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="With Pending"
          value={totals.withPending}
          tone="bg-amber-50 text-amber-700"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="High Risk"
          value={totals.highRisk}
          tone="bg-orange-50 text-orange-700"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Red Flags"
          value={totals.withRedFlag}
          tone="bg-red-50 text-red-700"
        />
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-secondary">
                {search ? "No patients match your search." : "No patients yet."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Patients appear here as soon as they submit their first consultation.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Patient
                    </th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Latest condition
                    </th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Consultations
                    </th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Last activity
                    </th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.email}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      data-testid={`row-patient-${p.email}`}
                    >
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/patients/${encodeURIComponent(p.email)}`}>
                          <a
                            className="flex items-center gap-3 group"
                            data-testid={`link-patient-${p.email}`}
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                              {getInitials(p.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-secondary truncate group-hover:text-primary transition-colors">
                                {p.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {p.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.age} yrs · {p.sex}
                              </p>
                            </div>
                          </a>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-secondary">{p.lastConditionName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="font-semibold">
                            <Activity className="w-3 h-3 mr-1" /> {p.consultationCount}
                          </Badge>
                          {p.pending > 0 && (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">
                              <Clock className="w-3 h-3 mr-1" /> {p.pending}
                            </Badge>
                          )}
                          {p.approved > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {p.approved}
                            </Badge>
                          )}
                          {p.redFlags > 0 && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">
                              <AlertTriangle className="w-3 h-3 mr-1" /> {p.redFlags}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div>{formatDistanceToNow(new Date(p.lastSubmittedAt), { addSuffix: true })}</div>
                        <div className="text-xs">{format(new Date(p.lastSubmittedAt), "PPp")}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`/dashboard/patients/${encodeURIComponent(p.email)}`}>
                            <a
                              className="inline-flex items-center gap-1 text-secondary font-semibold hover:underline"
                              data-testid={`link-view-patient-${p.email}`}
                            >
                              View patient
                            </a>
                          </Link>
                          <Link href={`/dashboard/consultation/${p.lastConsultationId}`}>
                            <a
                              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                              data-testid={`link-open-latest-${p.email}`}
                            >
                              Open latest <ArrowRight className="w-4 h-4" />
                            </a>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PharmacistLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card className="rounded-2xl border-none shadow-sm">
      <CardContent className="p-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone}`}>{icon}</div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
        <p className="text-3xl font-bold text-secondary mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

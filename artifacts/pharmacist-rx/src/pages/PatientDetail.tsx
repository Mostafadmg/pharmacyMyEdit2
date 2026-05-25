import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Mail,
  Phone,
  ShoppingBag,
  Stethoscope,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { RxShell } from "@/components/rx";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  consultationOrderRef,
  consultationStatusTimestamp,
  formatOrderDateTime,
  statusPillForConsultation,
} from "@/lib/orderPatientUi";
import type { Consultation } from "@workspace/api-client-react";

type ProfileResponse = {
  profile: {
    email: string;
    name: string | null;
    pmrNumber?: string | null;
    dateOfBirth?: string | null;
    totalConsultations: number;
    approvedCount: number;
    pendingCount: number;
    totalOrders: number;
    totalSpendPence: number;
    topConditions: { name: string; count: number }[];
    registered: boolean;
    firstSeenAt: string | null;
    lastSeenAt: string | null;
  };
  consultations: Consultation[];
};

function formatLastDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function PatientDetail({ email }: { email: string }) {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    void apiFetch<ProfileResponse>(
      `/api/pharmacist/patients/${encodeURIComponent(email)}/profile`,
    )
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load patient"),
      )
      .finally(() => setLoading(false));
  }, [email]);

  const profile = data?.profile;
  const consultations = data?.consultations ?? [];
  const displayName = profile?.name ?? email;
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <RxShell className="max-w-[1200px]">
      <Link
        href="/patients"
        className="rx-back mb-5 inline-flex"
        data-testid="link-back-patients"
      >
        <ArrowLeft className="h-4 w-4" />
        All patients
      </Link>

      {loading ? (
        <Card className="px-6 py-14 text-center text-sm text-muted-foreground">
          Loading patient record…
        </Card>
      ) : error || !profile ? (
        <Card className="px-6 py-14 text-center text-sm text-destructive">
          {error ?? "Patient not found"}
        </Card>
      ) : (
        <>
          <section className="rx-hero mb-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-serif text-xl font-bold text-primary-foreground shadow-sm ring-2 ring-primary/10">
                  {initials || <User className="h-8 w-8" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="rx-label-caps mb-1">Patient record</p>
                  <h1 className="rx-display truncate">{displayName}</h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-primary/80" />
                    <span className="truncate">{profile.email}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.pmrNumber ? (
                      <span className="rounded-lg border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                        PMR {profile.pmrNumber}
                      </span>
                    ) : null}
                    {profile.dateOfBirth ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        DOB {formatLastDate(profile.dateOfBirth)}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-semibold",
                        profile.registered
                          ? "border-primary/25 bg-accent/50 text-primary"
                          : "border-border bg-muted/50 text-muted-foreground",
                      )}
                    >
                      {profile.registered ? "Registered account" : "Guest checkout"}
                    </span>
                  </div>
                </div>
              </div>
              {consultations[0] ? (
                <Link
                  href={`/orders/${consultations[0].id}?queue=all`}
                  className="rx-btn-outline shrink-0 self-start"
                >
                  Open latest order
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </section>

          <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Consultations",
                value: String(profile.totalConsultations),
                hint: `${profile.pendingCount} pending`,
                icon: Stethoscope,
              },
              {
                label: "Approved",
                value: String(profile.approvedCount),
                hint: "Prescriptions issued",
                icon: Stethoscope,
              },
              {
                label: "Shop orders",
                value: String(profile.totalOrders),
                hint: "Non-Rx purchases",
                icon: ShoppingBag,
              },
              {
                label: "Lifetime spend",
                value: formatGbp(profile.totalSpendPence),
                hint: "All channels",
                icon: ShoppingBag,
              },
            ].map((stat) => (
              <Card key={stat.label} className="rx-stat-cell">
                <div className="rx-label-caps">{stat.label}</div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <span className="text-2xl font-bold tabular-nums text-foreground">
                      {stat.value}
                    </span>
                    <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {stat.hint}
                    </p>
                  </div>
                  <stat.icon className="h-5 w-5 shrink-0 text-muted-foreground/80" />
                </div>
              </Card>
            ))}
          </section>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="rx-patient-section !rounded-2xl !bg-card shadow-sm">
              <h2 className="rx-patient-section-title">Account timeline</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="rx-label-caps">First seen</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatOrderDateTime(profile.firstSeenAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="rx-label-caps">Last activity</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {formatOrderDateTime(profile.lastSeenAt)}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card className="rx-patient-section !rounded-2xl !bg-card shadow-sm">
              <h2 className="rx-patient-section-title">Contact</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="break-all text-foreground">{profile.email}</span>
                </li>
                <li className="flex items-start gap-2.5 text-muted-foreground">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="italic text-xs">
                    Phone on individual orders — open a consultation to view or edit.
                  </span>
                </li>
              </ul>
            </Card>
          </div>

          {profile.topConditions.length > 0 ? (
            <Card className="mb-6 p-5 shadow-sm">
              <h2 className="font-serif text-base font-bold text-secondary">
                Conditions treated
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Most frequent consultation types for this patient
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.topConditions.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-full border border-border bg-accent/40 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {c.name}
                    <span className="ml-1.5 tabular-nums text-muted-foreground">
                      ×{c.count}
                    </span>
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden shadow-sm">
            <header className="border-b border-border bg-muted/30 px-5 py-4">
              <h2 className="font-serif text-lg font-bold text-secondary">
                Consultation history
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {consultations.length} order
                {consultations.length === 1 ? "" : "s"} on record — newest first
              </p>
            </header>
            {consultations.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                No consultations on record.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {consultations.map((c) => {
                  const pill = statusPillForConsultation(c.status);
                  const statusWhen = consultationStatusTimestamp(c);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/orders/${c.id}?queue=all`}
                        className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-accent/20 sm:flex-row sm:items-center sm:justify-between"
                        data-testid={`link-consultation-${c.id}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {c.conditionName}
                          </p>
                          <p className="mt-1 font-mono text-xs font-bold text-primary">
                            Order {consultationOrderRef(c)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Placed {formatOrderDateTime(c.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 sm:min-w-[11rem] sm:justify-end">
                          <div className="flex flex-col items-end gap-1">
                            <span className={cn("rx-status-pill", pill.cls)}>
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  pill.dotCls,
                                )}
                              />
                              {pill.label}
                            </span>
                            {statusWhen ? (
                              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                                {statusWhen}
                              </span>
                            ) : null}
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-primary/70" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </RxShell>
  );
}

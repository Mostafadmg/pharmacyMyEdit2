import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  ShoppingBag,
  Stethoscope,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { RxShell } from "@/components/rx";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { statusPillForConsultation } from "@/lib/orderPatientUi";
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
  return d.toLocaleDateString("en-GB");
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

  return (
    <RxShell className="max-w-[1200px]">
      <Link
        href="/patients"
        className="rx-back mb-4 inline-flex"
        data-testid="link-back-patients"
      >
        <ArrowLeft className="h-4 w-4" />
        All patients
      </Link>

      {loading ? (
        <Card className="px-5 py-12 text-center text-sm text-muted-foreground">
          Loading patient record…
        </Card>
      ) : error || !profile ? (
        <Card className="px-5 py-12 text-center text-sm text-destructive">
          {error ?? "Patient not found"}
        </Card>
      ) : (
        <>
          <section className="rx-hero mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-primary ring-1 ring-accent/40">
                  <User className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <h1 className="rx-display truncate">{profile.name ?? email}</h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {profile.pmrNumber ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono font-semibold text-foreground">
                        {profile.pmrNumber}
                      </span>
                    ) : null}
                    {profile.dateOfBirth ? (
                      <span>DOB {formatLastDate(profile.dateOfBirth)}</span>
                    ) : null}
                    <span>
                      {profile.registered ? "Registered account" : "Guest checkout only"}
                    </span>
                  </div>
                </div>
              </div>
              {consultations[0] ? (
                <Link
                  href={`/orders/${consultations[0].id}`}
                  className="rx-btn-outline shrink-0"
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
                icon: Stethoscope,
              },
              {
                label: "Approved",
                value: String(profile.approvedCount),
                icon: Stethoscope,
              },
              {
                label: "Shop orders",
                value: String(profile.totalOrders),
                icon: ShoppingBag,
              },
              {
                label: "Total spend",
                value: formatGbp(profile.totalSpendPence),
                icon: ShoppingBag,
              },
            ].map((stat) => (
              <Card key={stat.label} className="rx-stat-cell">
                <div className="rx-label-caps">{stat.label}</div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {stat.value}
                  </span>
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </section>

          {profile.topConditions.length > 0 ? (
            <Card className="mb-6 p-4">
              <h2 className="text-sm font-semibold text-foreground">Top conditions</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.topConditions.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {c.name} · {c.count}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <header className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Consultation history
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                First seen {formatLastDate(profile.firstSeenAt)} · Last activity{" "}
                {formatLastDate(profile.lastSeenAt)}
              </p>
            </header>
            {consultations.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                No consultations on record.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {consultations.map((c) => {
                  const pill = statusPillForConsultation(c.status);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/orders/${c.id}`}
                        className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                        data-testid={`link-consultation-${c.id}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {c.conditionName}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Submitted {formatLastDate(c.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={cn("rx-status-pill", pill.cls)}>
                            <span
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                pill.dotCls,
                              )}
                            />
                            {pill.label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
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


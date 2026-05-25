import { Link } from "wouter";
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  useGetDashboardStats,
  useListConsultations,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RxPageTitle, RxShell } from "@/components/rx";

export function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: pending } = useListConsultations({ status: "pending", limit: 6 });
  const { data: responded } = useListConsultations({
    status: "patient_responded",
    limit: 4,
  });

  const tiles = [
    {
      label: "Awaiting Review",
      value: stats?.pendingReview ?? 0,
      icon: ClipboardList,
      tone: "bg-primary/10 text-primary",
      to: "/queue",
    },
    {
      label: "Patient Responded",
      value: pending && responded ? responded.consultations?.length ?? 0 : 0,
      icon: MessageSquare,
      tone: "bg-accent/20 text-accent-foreground",
      to: "/messages",
    },
    {
      label: "Approved Today",
      value: stats?.approvedToday ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-100 text-emerald-700",
      to: "/prescriptions",
    },
    {
      label: "Red Flags",
      value: stats?.redFlagsToday ?? 0,
      icon: AlertTriangle,
      tone: "bg-destructive/10 text-destructive",
      to: "/queue",
    },
  ];

  return (
    <RxShell>
      <RxPageTitle
        title="Good day, Dr. Mitchell"
        subtitle="Here's what's waiting on your prescriber attention today."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.label} href={t.to}>
              <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      {t.label}
                    </div>
                    <div className="rx-ref-sm text-3xl mt-2">{t.value}</div>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${t.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="rx-display-sm text-lg">Awaiting your review</h2>
              <p className="text-xs text-muted-foreground">
                Oldest submissions first · auto-refreshes every 30s
              </p>
            </div>
            <Link
              href="/queue"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              See full queue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(pending?.consultations ?? []).length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nothing waiting. Nice work.
              </div>
            )}
            {(pending?.consultations ?? []).map((c) => (
              <Link key={c.id} href={`/orders/${c.id}`}>
                <div
                  className="py-3 flex items-center gap-3 hover:bg-muted/40 -mx-2 px-2 rounded cursor-pointer"
                  data-testid={`row-pending-${c.id}`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                    {c.patientName
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="rx-display-sm truncate">{c.patientName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.conditionName} · {c.patientAge} {c.patientSex[0].toUpperCase()}
                    </div>
                  </div>
                  {c.hasRedFlag && (
                    <Badge variant="destructive" className="text-[10px]">
                      Red flag
                    </Badge>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(c.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="rx-display-sm text-lg">Patient replies</h2>
          </div>
          {(responded?.consultations ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No new patient responses waiting.
            </p>
          )}
          <div className="space-y-3">
            {(responded?.consultations ?? []).map((c) => (
              <Link key={c.id} href={`/orders/${c.id}`}>
                <div className="p-3 rounded-xl border border-border hover:border-emerald-400 cursor-pointer transition-colors bg-card/80">
                  <div className="rx-display-sm truncate text-sm">{c.patientName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.conditionName}
                  </div>
                  <div className="text-[11px] text-primary mt-1">
                    Responded — review thread
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </RxShell>
  );
}

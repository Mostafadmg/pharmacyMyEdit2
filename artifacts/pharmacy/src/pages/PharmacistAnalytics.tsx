import { useEffect, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Clock, PoundSterling, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { apiFetch } from "@/lib/api";

type Analytics = {
  consultations7d: number;
  consultations7dPrev: number;
  pendingNow: number;
  avgApprovalSecs: number | null;
  approvalSplit: Record<string, number>;
  revenue30dPence: number;
  revenueByDay: Array<{ day: string; totalPence: number }>;
  topConditions: Array<{ name: string; count: number }>;
  perPharmacist: Array<{ actor: string; approve: number; reject: number; refer: number; more_info: number; total: number }>;
};

function fmtMoney(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}
function fmtMins(secs: number | null): string {
  if (!secs) return "—";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
function deltaPct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function PharmacistAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Analytics>("/api/pharmacist/analytics", { auth: "pharmacist" })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PharmacistLayout current="reports">
      <div className="p-6 max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-secondary">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live performance, throughput and revenue across the last 30 days
          </p>
        </header>

        {loading || !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiTile
                icon={Activity}
                label="Consultations · last 7 days"
                value={data.consultations7d.toString()}
                delta={deltaPct(data.consultations7d, data.consultations7dPrev)}
                accent="text-primary"
              />
              <KpiTile
                icon={Clock}
                label="Pending right now"
                value={data.pendingNow.toString()}
                accent={data.pendingNow > 10 ? "text-rose-600" : "text-emerald-600"}
              />
              <KpiTile
                icon={CheckCircle2}
                label="Avg time-to-decision"
                value={fmtMins(data.avgApprovalSecs)}
                accent="text-sky-600"
              />
              <KpiTile
                icon={PoundSterling}
                label="Revenue · last 30 days"
                value={fmtMoney(data.revenue30dPence)}
                accent="text-emerald-700"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card className="p-5 lg:col-span-2 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-secondary">Daily revenue · 30 days</h2>
                  <span className="text-xs text-muted-foreground">£ per day, paid orders only</span>
                </div>
                <RevenueChart data={data.revenueByDay} />
              </Card>

              <Card className="p-5 rounded-2xl">
                <h2 className="font-bold text-secondary mb-4">Decision split (30d)</h2>
                <DecisionSplit split={data.approvalSplit} />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-5 rounded-2xl">
                <h2 className="font-bold text-secondary mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Top conditions (30d)
                </h2>
                {data.topConditions.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">No data yet</div>
                ) : (
                  <ul className="space-y-2">
                    {data.topConditions.map((c) => {
                      const max = Math.max(...data.topConditions.map((x) => x.count));
                      const pct = Math.round((c.count / max) * 100);
                      return (
                        <li key={c.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-secondary">{c.name}</span>
                            <span className="text-muted-foreground">{c.count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card className="p-5 rounded-2xl">
                <h2 className="font-bold text-secondary mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-500" /> Per pharmacist (30d)
                </h2>
                {data.perPharmacist.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">No reviewed consultations yet</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b">
                        <th className="text-left py-2">Prescriber</th>
                        <th className="text-right py-2">Approve</th>
                        <th className="text-right py-2">Reject</th>
                        <th className="text-right py-2">Refer</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.perPharmacist.map((p) => (
                        <tr key={p.actor} className="border-b last:border-0">
                          <td className="py-2 font-medium">{p.actor}</td>
                          <td className="text-right py-2 text-emerald-700 font-semibold">{p.approve}</td>
                          <td className="text-right py-2 text-rose-700 font-semibold">{p.reject}</td>
                          <td className="text-right py-2 text-violet-700 font-semibold">{p.refer}</td>
                          <td className="text-right py-2 font-bold">{p.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </PharmacistLayout>
  );
}

function KpiTile({
  icon: Icon, label, value, delta, accent,
}: {
  icon: typeof Activity; label: string; value: string; delta?: number | null; accent?: string;
}) {
  return (
    <Card className="p-5 rounded-2xl bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center ${accent ?? "text-primary"}`}>
          <Icon className="w-5 h-5" />
        </div>
        {delta !== undefined && delta !== null && (
          <span
            className={`text-xs font-bold inline-flex items-center gap-0.5 ${
              delta >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-secondary">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </Card>
  );
}

function RevenueChart({ data }: { data: Array<{ day: string; totalPence: number }> }) {
  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground py-8 text-center">No revenue in the last 30 days</div>;
  }
  const max = Math.max(...data.map((d) => d.totalPence), 1);
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.totalPence / max) * 100));
        return (
          <div key={d.day} className="flex-1 group relative flex flex-col items-center justify-end">
            <div
              className="w-full bg-primary/70 rounded-t hover:bg-primary transition-colors"
              style={{ height: `${h}%` }}
              title={`${d.day}: £${(d.totalPence / 100).toFixed(0)}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function DecisionSplit({ split }: { split: Record<string, number> }) {
  const order: Array<{ key: string; label: string; color: string }> = [
    { key: "approved", label: "Approved", color: "bg-emerald-500" },
    { key: "rejected", label: "Rejected", color: "bg-rose-500" },
    { key: "referred", label: "Referred", color: "bg-violet-500" },
    { key: "more_info_needed", label: "More info", color: "bg-sky-500" },
    { key: "patient_responded", label: "Awaiting", color: "bg-orange-500" },
    { key: "pending", label: "Pending", color: "bg-amber-500" },
  ];
  const total = Object.values(split).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="text-sm text-muted-foreground py-4">No decisions yet</div>;
  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {order.map((s) => {
          const v = split[s.key] ?? 0;
          if (v === 0) return null;
          const pct = (v / total) * 100;
          return <div key={s.key} className={s.color} style={{ width: `${pct}%` }} />;
        })}
      </div>
      <ul className="space-y-1.5">
        {order.map((s) => {
          const v = split[s.key] ?? 0;
          const pct = total === 0 ? 0 : Math.round((v / total) * 100);
          return (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              <span className={`w-3 h-3 rounded-sm ${s.color}`} />
              <span className="flex-1 text-secondary">{s.label}</span>
              <span className="text-muted-foreground font-semibold">{v}</span>
              <span className="text-muted-foreground text-xs w-10 text-right">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

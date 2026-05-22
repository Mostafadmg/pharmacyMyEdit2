import { useMemo, useState } from "react";
import { Search, User } from "lucide-react";
import { useListConsultations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";

export function Patients() {
  const [q, setQ] = useState("");
  const { data } = useListConsultations({ limit: 200 });

  const patients = useMemo(() => {
    const map = new Map<
      string,
      { email: string; name: string; count: number; lastAt: string }
    >();
    for (const c of data?.consultations ?? []) {
      const k = c.patientEmail.toLowerCase();
      const prev = map.get(k);
      if (prev) {
        prev.count += 1;
        if (c.createdAt > prev.lastAt) prev.lastAt = c.createdAt;
      } else {
        map.set(k, {
          email: c.patientEmail,
          name: c.patientName,
          count: 1,
          lastAt: c.createdAt,
        });
      }
    }
    return [...map.values()]
      .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
      .filter((p) =>
        q
          ? (p.name + " " + p.email).toLowerCase().includes(q.toLowerCase())
          : true,
      );
  }, [data, q]);

  return (
    <div className="p-4 md:p-8 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          Patients
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          All patients with consultations on file.
        </p>
      </div>
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2 bg-muted/60 rounded-md px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patients…"
            className="bg-transparent outline-none text-sm flex-1"
            data-testid="input-patient-search"
          />
        </div>
      </Card>
      <Card className="divide-y divide-border">
        {patients.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No patients yet.
          </div>
        )}
        {patients.map((p) => (
          <div
            key={p.email}
            className="px-5 py-4 flex items-center gap-4"
            data-testid={`row-patient-${p.email}`}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.email}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{p.count}</div>
              <div className="text-[11px] text-muted-foreground">consultations</div>
            </div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              Last: {new Date(p.lastAt).toLocaleDateString("en-GB")}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

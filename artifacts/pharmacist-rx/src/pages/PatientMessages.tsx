import { Link } from "wouter";
import { MessageSquare } from "lucide-react";
import { useListConsultations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PatientMessages() {
  const { data, isLoading } = useListConsultations({
    status: "patient_responded",
    limit: 100,
  });
  const rows = data?.consultations ?? [];

  return (
    <div className="p-4 md:p-8 max-w-[1100px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          Patient Messages
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Threads with a patient reply waiting for your attention.
        </p>
      </div>
      <Card className="divide-y divide-border">
        {isLoading && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Loading threads…
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="px-5 py-12 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No patient replies waiting. You're all caught up.
            </p>
          </div>
        )}
        {rows.map((c) => (
          <Link key={c.id} href={`/orders/${c.id}?tab=messages`}>
            <div
              className="px-5 py-4 flex items-center gap-4 hover:bg-muted/40 cursor-pointer"
              data-testid={`row-message-${c.id}`}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {c.patientName
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">{c.patientName}</div>
                  <Badge className="bg-accent text-accent-foreground text-[10px]">
                    Replied
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.conditionName} · {new Date(c.updatedAt).toLocaleString("en-GB")}
                </div>
              </div>
              <span className="text-sm text-primary">Open thread →</span>
            </div>
          </Link>
        ))}
      </Card>
    </div>
  );
}

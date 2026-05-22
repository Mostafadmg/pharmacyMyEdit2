import { useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  MessageSquare,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import {
  useListConsultations,
  type Consultation,
  type ListConsultationsParams,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = NonNullable<ListConsultationsParams["status"]> | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Awaiting Review" },
  { id: "patient_responded", label: "Patient Responded" },
  { id: "more_info_needed", label: "More Info Sent" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Declined" },
  { id: "referred", label: "Referred" },
  { id: "all", label: "All" },
];

export function Queue() {
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useListConsultations(
    tab === "all" ? { limit: 100 } : { status: tab, limit: 100 },
  );

  const rows = (data?.consultations ?? []).filter((c) =>
    search
      ? `${c.patientName} ${c.patientEmail} ${c.conditionName} ${c.id}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight">
          Prescription Queue
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Triage and prescribe. Oldest submissions first.
        </p>
      </div>

      <Card className="p-3 md:p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-muted/60 rounded-md px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, condition…"
              className="bg-transparent outline-none text-sm flex-1"
              data-testid="input-queue-search"
            />
          </div>
          <button className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border hover:bg-muted/40">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto mt-4 -mx-1 px-1 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full whitespace-nowrap font-medium transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground/70 hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.6fr] gap-4 px-5 py-3 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
          <div>Patient</div>
          <div>Condition</div>
          <div>Submitted</div>
          <div>Flags</div>
          <div className="text-right">Status</div>
        </div>
        <div className="divide-y divide-border">
          {isLoading && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Loading consultations…
            </div>
          )}
          {!isLoading && rows.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nothing in this bucket.
            </div>
          )}
          {rows.map((c) => (
            <QueueRow key={c.id} c={c} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function QueueRow({ c }: { c: Consultation }) {
  const submitted = new Date(c.createdAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Link href={`/orders/${c.id}`}>
      <div
        className="grid md:grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.6fr] gap-4 px-5 py-4 hover:bg-muted/40 cursor-pointer items-center"
        data-testid={`row-consultation-${c.id}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {c.patientName
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{c.patientName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {c.patientAge}y · {c.patientSex} · {c.patientEmail}
            </div>
          </div>
        </div>
        <div className="text-sm truncate">{c.conditionName}</div>
        <div className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {submitted}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.hasRedFlag && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <AlertTriangle className="h-3 w-3" /> Red flag
            </Badge>
          )}
          {c.hasPhoto && (
            <Badge variant="outline" className="text-[10px]">
              Photo
            </Badge>
          )}
          {c.previousConsultationId && (
            <Badge variant="secondary" className="text-[10px]">
              Repeat
            </Badge>
          )}
          {c.status === "patient_responded" && (
            <Badge className="bg-accent text-accent-foreground text-[10px] gap-1">
              <MessageSquare className="h-3 w-3" /> Replied
            </Badge>
          )}
        </div>
        <div className="text-right text-xs">
          <StatusPill status={c.status} />
        </div>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: Consultation["status"] }) {
  const map: Record<Consultation["status"], string> = {
    pending: "bg-primary/15 text-primary",
    patient_responded: "bg-accent/30 text-accent-foreground",
    more_info_needed: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-destructive/15 text-destructive",
    referred: "bg-violet-100 text-violet-700",
    red_flag: "bg-destructive/15 text-destructive",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
        map[status],
      )}
    >
      {label}
    </span>
  );
}

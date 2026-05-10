import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListConsultations } from "@workspace/api-client-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Search, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  patient_responded: "bg-orange-100 text-orange-800 border-orange-200",
  more_info_needed: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-slate-100 text-slate-700 border-slate-200",
  referred: "bg-purple-100 text-purple-800 border-purple-200",
  red_flag: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  patient_responded: "Patient replied",
  more_info_needed: "Awaiting reply",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  referred: "Referred",
  red_flag: "Urgent",
};

const PRIORITY_ORDER: Record<string, number> = {
  patient_responded: 0,
  red_flag: 1,
  more_info_needed: 2,
  pending: 3,
  approved: 4,
  referred: 5,
  rejected: 6,
};

type FilterKey = "all" | "unread" | "awaiting";

export default function PharmacistMessages() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data, isLoading } = useListConsultations(
    { limit: 200 },
    { query: { refetchInterval: 30000 } as never },
  );

  const threads = useMemo(() => {
    const all = (data?.consultations ?? []).filter(
      (c) =>
        c.status === "patient_responded" ||
        c.status === "more_info_needed" ||
        c.status === "pending" ||
        c.status === "approved" ||
        c.status === "red_flag" ||
        c.status === "referred",
    );

    const filtered = all.filter((c) => {
      if (filter === "unread") return c.status === "patient_responded";
      if (filter === "awaiting") return c.status === "more_info_needed";
      return true;
    });

    const searched = search.trim()
      ? filtered.filter(
          (c) =>
            c.patientName.toLowerCase().includes(search.toLowerCase()) ||
            c.patientEmail.toLowerCase().includes(search.toLowerCase()) ||
            c.conditionName.toLowerCase().includes(search.toLowerCase()),
        )
      : filtered;

    return searched.sort((a, b) => {
      const pA = PRIORITY_ORDER[a.status] ?? 9;
      const pB = PRIORITY_ORDER[b.status] ?? 9;
      if (pA !== pB) return pA - pB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [data, search, filter]);

  const unreadCount = (data?.consultations ?? []).filter(
    (c) => c.status === "patient_responded",
  ).length;

  const awaitingCount = (data?.consultations ?? []).filter(
    (c) => c.status === "more_info_needed",
  ).length;

  const filters: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all", label: "All threads" },
    { key: "unread", label: "Patient replied", count: unreadCount },
    { key: "awaiting", label: "Awaiting reply", count: awaitingCount },
  ];

  return (
    <PharmacistLayout current="messages">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-serif font-bold text-secondary">Messages</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-muted-foreground ml-10">
            Patient conversation threads. Click any row to open the full thread in the consultation.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, email or condition…"
              className="pl-9 rounded-xl h-11"
              data-testid="input-messages-search"
            />
          </div>
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  filter === f.key
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-border text-secondary hover:bg-muted/50"
                }`}
                data-testid={`filter-${f.key}`}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${filter === f.key ? "bg-white/25 text-white" : "bg-orange-100 text-orange-700"}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-border">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-secondary mb-1">No threads found</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Try a different search term" : "Message threads appear here when patients submit consultations"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((c, i) => {
              const initials = c.patientName
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const isUnread = c.status === "patient_responded";
              const isUrgent = c.status === "red_flag";

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={`/dashboard/consultation/${c.id}`}>
                    <div
                      className={`flex items-center gap-4 p-4 bg-white rounded-2xl border transition-all hover:shadow-md cursor-pointer ${
                        isUnread
                          ? "border-orange-200 ring-1 ring-orange-100"
                          : isUrgent
                          ? "border-red-200 ring-1 ring-red-100"
                          : "border-border hover:border-primary/30"
                      }`}
                      data-testid={`thread-${c.id}`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white ${
                            isUrgent ? "bg-red-500" : "bg-primary"
                          }`}
                        >
                          {initials}
                        </div>
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`font-bold text-sm ${isUnread ? "text-orange-900" : "text-secondary"}`}>
                            {c.patientName}
                          </span>
                          <Badge
                            className={`text-[10px] font-semibold border ${STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {STATUS_LABELS[c.status] ?? c.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.conditionName}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{c.patientEmail}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                          Open thread
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PharmacistLayout>
  );
}

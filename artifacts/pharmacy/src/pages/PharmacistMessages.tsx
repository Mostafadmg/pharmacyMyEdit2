import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "wouter";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Search, ArrowRight, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const authHeaders = (): Record<string, string> => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("pharmacist_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

type Thread = {
  id: string;
  patientName: string;
  patientEmail: string;
  conditionName: string;
  consultationStatus: string;
  createdAt: string;
  lastMsgBody: string | null;
  lastMsgAt: string | null;
  lastMsgRole: string | null;
  lastMsgSender: string | null;
  unreadCount: number;
  totalMessages: number;
};

type FilterKey = "all" | "unread" | "awaiting";

export default function PharmacistMessages() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pharmacist/message-threads", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setThreads(json.threads ?? []);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = useMemo(() => threads.filter((t) => Number(t.unreadCount) > 0).length, [threads]);
  const awaitingCount = useMemo(
    () => threads.filter((t) => t.consultationStatus === "more_info_needed").length,
    [threads],
  );

  const filtered = useMemo(() => {
    let list = threads;
    if (filter === "unread") list = list.filter((t) => Number(t.unreadCount) > 0);
    if (filter === "awaiting") list = list.filter((t) => t.consultationStatus === "more_info_needed");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.patientName.toLowerCase().includes(q) ||
          t.patientEmail.toLowerCase().includes(q) ||
          t.conditionName.toLowerCase().includes(q) ||
          (t.lastMsgBody ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [threads, filter, search]);

  const filters: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all", label: "All threads", count: threads.length },
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
            Patient conversation threads, sorted by most recent reply.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient, condition or message content…"
              className="pl-9 rounded-xl h-11"
              data-testid="input-messages-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
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
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      filter === f.key ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-border">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-secondary mb-1">No threads found</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Try a different search term"
                : threads.length === 0
                ? "Threads appear here when patients and pharmacists exchange messages"
                : "No consultations match this filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t, i) => {
              const isUnread = Number(t.unreadCount) > 0;
              const isUrgent = t.consultationStatus === "red_flag";
              const initials = t.patientName
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const preview = t.lastMsgBody
                ? t.lastMsgBody.length > 100
                  ? t.lastMsgBody.slice(0, 100) + "…"
                  : t.lastMsgBody
                : null;
              const timeLabel = t.lastMsgAt
                ? formatDistanceToNow(new Date(t.lastMsgAt), { addSuffix: true })
                : formatDistanceToNow(new Date(t.createdAt), { addSuffix: true });

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                >
                  <Link href={`/dashboard/messages/${t.id}`}>
                    <div
                      className={`flex items-start gap-4 p-4 bg-white rounded-2xl border transition-all hover:shadow-md cursor-pointer ${
                        isUnread
                          ? "border-orange-200 ring-1 ring-orange-100 bg-orange-50/30"
                          : isUrgent
                          ? "border-red-200 ring-1 ring-red-100"
                          : "border-border hover:border-primary/30"
                      }`}
                      data-testid={`thread-${t.id}`}
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
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span
                            className={`font-bold text-sm ${
                              isUnread ? "text-orange-900" : "text-secondary"
                            }`}
                          >
                            {t.patientName}
                          </span>
                          <Badge
                            className={`text-[10px] font-semibold border ${
                              STATUS_COLORS[t.consultationStatus] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {STATUS_LABELS[t.consultationStatus] ?? t.consultationStatus}
                          </Badge>
                          {isUnread && (
                            <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full">
                              {t.unreadCount} unread
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mb-1.5">{t.conditionName}</p>

                        {preview && (
                          <p
                            className={`text-xs truncate ${
                              isUnread ? "font-semibold text-orange-900" : "text-muted-foreground"
                            }`}
                          >
                            {t.lastMsgRole === "patient" ? (
                              <User className="inline w-3 h-3 mr-1 text-orange-500" />
                            ) : (
                              <span className="text-muted-foreground/60 mr-1">You:</span>
                            )}
                            {preview}
                          </p>
                        )}

                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {timeLabel}
                          <span className="ml-2 text-muted-foreground/50">·</span>
                          <span className="text-muted-foreground/70">
                            {Number(t.totalMessages)} message{Number(t.totalMessages) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-1 text-primary text-xs font-semibold mt-1">
                        Open
                        <ArrowRight className="w-3.5 h-3.5" />
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

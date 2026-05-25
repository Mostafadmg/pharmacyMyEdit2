import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Send,
  Paperclip,
  X,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  medicationLabelFromOrder,
  orderRefFromConsultationId,
  type PatientOrderMeta,
} from "@/lib/patientOrderContext";

type Message = {
  id: string;
  consultationId: string;
  senderRole: string;
  senderName: string;
  body: string;
  kind: string;
  meta?: string | null;
  createdAt: string;
};

type Action = {
  id: string;
  consultationId: string;
  action: string;
  actorName: string;
  createdAt: string;
};

const SYSTEM_LABELS: Record<string, string> = {
  document_upload: "Document uploaded",
  document_rejected: "Document rejected",
  document_verified: "Document verified",
  approve: "Consultation approved",
  reject: "Consultation declined",
  more_info: "More information requested",
  refer: "Referred to your GP",
};

function initials(name: string): string {
  const parts = name.trim().replace(/^Dr\.?\s+/i, "").split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayLabel(d: Date): string {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMMM yyyy");
}

function orderCaption(order: PatientOrderMeta): string {
  return `Re: ${orderRefFromConsultationId(order.id)} · ${medicationLabelFromOrder(order)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Read failed"));
    };
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

export default function PatientMessageInbox({
  className,
  initialConsultationId = null,
}: {
  className?: string;
  initialConsultationId?: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [consultations, setConsultations] = useState<PatientOrderMeta[]>([]);
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(
    initialConsultationId,
  );
  const [body, setBody] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const orderById = useMemo(
    () => Object.fromEntries(consultations.map((c) => [c.id, c])),
    [consultations],
  );

  const activeOrders = useMemo(
    () => consultations.filter((c) => c.status !== "cancelled"),
    [consultations],
  );

  const showOrderSelect = activeOrders.length > 1;

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{
        messages: Message[];
        actions: Action[];
        consultations: PatientOrderMeta[];
        targetConsultationId: string | null;
      }>("/api/patient/messages", { auth: "patient" });
      setMessages(data.messages);
      setActions(data.actions);
      setConsultations(data.consultations);
      setActiveConsultationId((prev) => {
        if (prev && data.consultations.some((c) => c.id === prev)) return prev;
        if (initialConsultationId && data.consultations.some((c) => c.id === initialConsultationId)) {
          return initialConsultationId;
        }
        return data.targetConsultationId ?? data.consultations[0]?.id ?? null;
      });
    } catch {
      /* polling */
    } finally {
      setLoading(false);
    }
  }, [initialConsultationId]);

  useEffect(() => {
    setActiveConsultationId(initialConsultationId);
  }, [initialConsultationId]);

  useEffect(() => {
    if (activeOrders.length === 1) {
      setActiveConsultationId(activeOrders[0]!.id);
    }
  }, [activeOrders]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 10_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, actions.length, loading]);

  type FeedItem =
    | { type: "msg"; at: string; key: string; msg: Message }
    | { type: "sys"; at: string; key: string; label: string; actor: string; consultationId: string };

  const feed = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [];
    for (const m of messages) {
      items.push({ type: "msg", at: m.createdAt, key: `m-${m.id}`, msg: m });
    }
    for (const a of actions) {
      if (a.action === "patient_reply") continue;
      items.push({
        type: "sys",
        at: a.createdAt,
        key: `a-${a.id}`,
        label: SYSTEM_LABELS[a.action] ?? a.action.replace(/_/g, " "),
        actor: a.actorName,
        consultationId: a.consultationId,
      });
    }
    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return items;
  }, [messages, actions]);

  const teamName = useMemo(() => {
    const fromPharmacist = [...messages].reverse().find((m) => m.senderRole === "pharmacist");
    return fromPharmacist?.senderName ?? "PharmaCare Clinical Team";
  }, [messages]);

  async function handleSend() {
    const text = body.trim();
    if ((!text && !pendingFile) || sending) return;

    if (!activeConsultationId && activeOrders.length > 0) {
      toast.error("Please choose which order this message is about.");
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        body: text,
        consultationId: activeConsultationId ?? undefined,
      };
      if (pendingFile) {
        if (pendingFile.size > 4 * 1024 * 1024) {
          toast.error("File must be under 4 MB.");
          return;
        }
        payload.attachment = {
          dataUrl: await readFileAsDataUrl(pendingFile),
          filename: pendingFile.name,
          docId: "supporting-evidence",
        };
      }
      await apiFetch("/api/patient/messages", {
        method: "POST",
        auth: "patient",
        body: JSON.stringify(payload),
      });
      setBody("");
      setPendingFile(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  const canSend = Boolean(body.trim() || pendingFile) && !sending;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {/* Header — one team, one thread */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initials(teamName)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-secondary">{teamName}</p>
            <p className="text-xs text-muted-foreground">PharmaCare · GPhC-registered pharmacy</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
          <Lock className="h-3.5 w-3.5 text-primary" />
          Secure
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="min-h-[420px] max-h-[min(60vh,520px)] flex-1 overflow-y-auto bg-muted/30 px-4 py-5 sm:px-5"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Loading messages…</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-medium text-secondary">No messages yet</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
              Write below — your pharmacist will reply here. Typical response within one working
              day.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {feed.map((item, i) => {
              const prev = feed[i - 1];
              const showDay =
                !prev || !isSameDay(new Date(prev.at), new Date(item.at));

              if (item.type === "sys") {
                const order = orderById[item.consultationId];
                return (
                  <React.Fragment key={item.key}>
                    {showDay && (
                      <p className="py-4 text-center text-[11px] font-medium text-muted-foreground">
                        {dayLabel(new Date(item.at))}
                      </p>
                    )}
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{item.label}</span>
                      {order && showOrderSelect ? (
                        <span className="block mt-0.5 text-[11px]">{orderCaption(order)}</span>
                      ) : null}
                      <span className="text-muted-foreground">
                        {" "}
                        · {item.actor} · {formatTime(item.at)}
                      </span>
                    </p>
                  </React.Fragment>
                );
              }

              const m = item.msg;
              const mine = m.senderRole === "patient";
              const fromTeam = m.senderRole === "pharmacist";
              const order = orderById[m.consultationId];
              const isDocReject = m.kind === "document_rejected";
              const kindLabel =
                m.kind !== "message" ? SYSTEM_LABELS[m.kind] ?? m.kind : null;

              return (
                <React.Fragment key={item.key}>
                  {showDay && (
                    <p className="py-4 text-center text-[11px] font-medium text-muted-foreground">
                      {dayLabel(new Date(item.at))}
                    </p>
                  )}
                  <div
                    className={cn(
                      "flex py-1.5",
                      mine ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] sm:max-w-[28rem]",
                        mine ? "items-end" : "items-start",
                        "flex flex-col",
                      )}
                    >
                      {order && showOrderSelect && (
                        <p
                          className={cn(
                            "mb-1 px-1 text-[11px] text-muted-foreground",
                            mine && "text-right",
                          )}
                        >
                          {orderCaption(order)}
                        </p>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                          isDocReject && fromTeam
                            ? "border border-amber-200 bg-amber-50 text-foreground"
                            : mine
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-card text-foreground shadow-sm",
                        )}
                      >
                        {kindLabel && (
                          <p
                            className={cn(
                              "mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide",
                              isDocReject ? "text-amber-800" : mine ? "text-primary-foreground/90" : "text-primary",
                            )}
                          >
                            {isDocReject && <AlertCircle className="h-3.5 w-3.5" />}
                            {kindLabel}
                          </p>
                        )}
                        <p>{m.body}</p>
                        {isDocReject && (() => {
                          let docId: string | undefined;
                          try {
                            const meta = m.meta ? JSON.parse(m.meta) : {};
                            docId = typeof meta.docId === "string" ? meta.docId : undefined;
                          } catch {
                            docId = undefined;
                          }
                          if (!docId) return null;
                          return (
                            <Link
                              href={`/upload-documents/${m.consultationId}?slot=${encodeURIComponent(docId)}`}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              Upload again
                            </Link>
                          );
                        })()}
                      </div>
                      <p
                        className={cn(
                          "mt-1 px-1 text-[11px] text-muted-foreground",
                          mine && "text-right",
                        )}
                      >
                        {mine ? "You" : m.senderName || teamName} · {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card px-4 py-4 sm:px-5">
        {showOrderSelect && (
          <div className="mb-3">
            <label
              htmlFor="message-order-select"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              This message is about
            </label>
            <select
              id="message-order-select"
              value={activeConsultationId ?? ""}
              onChange={(e) => setActiveConsultationId(e.target.value || null)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {activeOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {orderRefFromConsultationId(o.id)} — {medicationLabelFromOrder(o)} (
                  {o.conditionName.split("—")[0]?.trim() || "Treatment"})
                </option>
              ))}
            </select>
          </div>
        )}

        {pendingFile && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate">{pendingFile.name}</span>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove attachment"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) setPendingFile(f);
          }}
        />

        <div className="flex gap-2">
          <button
            type="button"
            disabled={sending}
            onClick={() => fileRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type your message…"
            rows={2}
            className="min-h-11 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            disabled={!canSend}
            onClick={() => void handleSend()}
            aria-label="Send"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
              canSend
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground",
            )}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for new line · Max 4 MB attachments
        </p>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Send, Sparkles, MessageSquare, X, Check, CheckCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { format, isToday, isYesterday, isSameDay } from "date-fns";

type Audience = "patient" | "pharmacist";

type Message = {
  id: string;
  consultationId: string;
  patientEmail: string;
  senderRole: string;
  senderName: string;
  body: string;
  kind: string;
  readByPatient: boolean;
  readByPharmacist: boolean;
  createdAt: string;
};

type Action = {
  id: string;
  consultationId: string;
  action: string;
  actorRole: string;
  actorName: string;
  details: Record<string, unknown>;
  note: string | null;
  createdAt: string;
};

const KIND_LABELS: Record<string, string> = {
  message: "",
  approve: "Approved",
  reject: "Decision: not suitable",
  more_info: "Information requested",
  refer: "Referred",
};

const QUICK_REPLIES: Record<Audience, string[]> = {
  patient: [
    "Thanks, here's the additional info you requested.",
    "I'd prefer to speak with a pharmacist by phone.",
    "Could you clarify what you need?",
  ],
  pharmacist: [
    "Thanks for the additional info — reviewing now.",
    "Could you upload a clearer photo?",
    "Please confirm you've read the patient leaflet.",
  ],
};

interface Props {
  consultationId: string;
  audience: Audience;
  className?: string;
  onClose?: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().replace(/^Dr\.?\s+/i, "").split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getFirstName(name: string): string {
  if (!name) return "";
  return name.trim().replace(/^Dr\.?\s+/i, "").split(/\s+/)[0];
}

// Stable avatar color per name (so the same person always gets the same color)
const AVATAR_PALETTE = [
  { bg: "bg-emerald-500", ring: "ring-emerald-200" },
  { bg: "bg-sky-500",     ring: "ring-sky-200" },
  { bg: "bg-violet-500",  ring: "ring-violet-200" },
  { bg: "bg-amber-500",   ring: "ring-amber-200" },
  { bg: "bg-rose-500",    ring: "ring-rose-200" },
  { bg: "bg-teal-500",    ring: "ring-teal-200" },
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function dayLabel(d: Date): string {
  if (isToday(d)) return "TODAY";
  if (isYesterday(d)) return "YESTERDAY";
  return format(d, "d MMMM yyyy").toUpperCase();
}

// ── Avatar bubble ────────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const c = avatarColor(name);
  const dim = size === "lg" ? "w-10 h-10 text-sm" : size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${dim} ${c.bg} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

export default function ConsultationChat({ consultationId, audience, className, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ messages: Message[]; actions: Action[] }>(
        `/api/consultations/${encodeURIComponent(consultationId)}/messages`,
        { auth: audience }
      );
      setMessages(data.messages);
      setActions(data.actions);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [consultationId, audience]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, actions.length]);

  async function handleSend(text?: string) {
    const value = (text ?? body).trim();
    if (!value || sending) return;
    setSending(true);
    try {
      await apiFetch(`/api/consultations/${encodeURIComponent(consultationId)}/messages`, {
        method: "POST",
        auth: audience,
        body: JSON.stringify({ body: value }),
      });
      setBody("");
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  // Derive header — name of the OTHER party + a subtitle role line
  const otherParty = useMemo(() => {
    const otherRole = audience === "patient" ? "pharmacist" : "patient";
    const fromMessages = [...messages].reverse().find(m => m.senderRole === otherRole);
    const fromActions = [...actions].reverse().find(a => a.actorRole === otherRole);
    const name = fromMessages?.senderName || fromActions?.actorName ||
      (otherRole === "pharmacist" ? "Your pharmacist" : "Patient");
    return {
      name,
      subtitle: otherRole === "pharmacist" ? "PharmaCare Prescriber · GPhC registered" : "Patient",
    };
  }, [messages, actions, audience]);

  // Build chronological feed (messages + non-reply actions)
  type FeedItem =
    | { kind: "msg"; at: string; key: string; msg: Message }
    | { kind: "action"; at: string; key: string; action: Action };

  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [];
    for (const m of messages) items.push({ kind: "msg", at: m.createdAt, key: `m-${m.id}`, msg: m });
    for (const a of actions) {
      if (a.action === "patient_reply") continue;
      items.push({ kind: "action", at: a.createdAt, key: `a-${a.id}`, action: a });
    }
    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return items;
  }, [messages, actions]);

  // WhatsApp-style subtle dotted background
  const chatBgStyle: React.CSSProperties = {
    backgroundColor: "#ECE5DD",
    backgroundImage:
      "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.045) 1px, transparent 0)",
    backgroundSize: "22px 22px",
  };

  return (
    <div className={`flex flex-col rounded-2xl border border-border/60 overflow-hidden bg-white ${className ?? ""}`}>
      {/* Header — WhatsApp style */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white">
        <Avatar name={otherParty.name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{otherParty.name}</p>
          <p className="text-[11px] text-white/75 truncate">{otherParty.subtitle}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversation"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-5 max-h-[460px] min-h-[280px]"
        style={chatBgStyle}
      >
        {loading && (
          <p className="text-center text-xs text-muted-foreground py-8 bg-white/70 rounded-full inline-block px-4 mx-auto">
            Loading conversation…
          </p>
        )}
        {!loading && feed.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-12 space-y-2">
            <div className="inline-flex flex-col items-center gap-2 bg-white/85 rounded-2xl px-5 py-4 shadow-sm">
              <MessageSquare className="w-6 h-6 opacity-50" />
              <p>No messages yet — start the conversation below.</p>
            </div>
          </div>
        )}

        {feed.map((item, i) => {
          const prev = feed[i - 1];
          const showDay = !prev || !isSameDay(new Date(prev.at), new Date(item.at));

          if (item.kind === "action") {
            const a = item.action;
            return (
              <React.Fragment key={item.key}>
                {showDay && <DaySeparator date={new Date(item.at)} />}
                <div className="flex justify-center mb-3">
                  <div className="text-[11px] text-secondary/80 bg-white/90 rounded-md px-3 py-1.5 shadow-sm">
                    <span className="font-semibold">{KIND_LABELS[a.action] ?? a.action}</span>
                    <span className="mx-1.5 opacity-50">·</span>
                    {a.actorName}
                    <span className="mx-1.5 opacity-50">·</span>
                    {format(new Date(a.createdAt), "HH:mm")}
                  </div>
                </div>
              </React.Fragment>
            );
          }

          const m = item.msg;
          const mine = m.senderRole === audience;
          // Group consecutive messages from same sender — only show avatar on the LAST of a run
          const next = feed[i + 1];
          const isLastInRun =
            !next || next.kind !== "msg" || next.msg.senderRole !== m.senderRole ||
            !isSameDay(new Date(next.at), new Date(item.at));
          const isFirstInRun =
            !prev || prev.kind !== "msg" || prev.msg.senderRole !== m.senderRole ||
            !isSameDay(new Date(prev.at), new Date(item.at));
          const wasRead = mine && (audience === "patient" ? m.readByPharmacist : m.readByPatient);

          return (
            <React.Fragment key={item.key}>
              {showDay && <DaySeparator date={new Date(item.at)} />}
              <div className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${isLastInRun ? "mb-3" : "mb-0.5"}`}>
                {!mine && (
                  <div className="w-8 flex-shrink-0">
                    {isLastInRun ? <Avatar name={m.senderName} /> : null}
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3 py-2 text-sm shadow-sm ${
                    mine
                      ? `bg-[#DCF8C6] text-secondary rounded-2xl ${isLastInRun ? "rounded-br-sm" : ""}`
                      : `bg-white text-secondary rounded-2xl ${isLastInRun ? "rounded-bl-sm" : ""}`
                  }`}
                >
                  {!mine && isFirstInRun && (
                    <p className="text-[11px] font-bold text-primary mb-0.5">
                      {getFirstName(m.senderName) || m.senderName}
                      {KIND_LABELS[m.kind] && (
                        <span className="ml-1.5 text-secondary/60 font-semibold">· {KIND_LABELS[m.kind]}</span>
                      )}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed text-secondary">{m.body}</p>
                  <p className="text-[10px] mt-0.5 text-secondary/50 inline-flex items-center gap-1 float-right ml-3">
                    {format(new Date(m.createdAt), "HH:mm")}
                    {mine && (wasRead ? <CheckCheck className="w-3 h-3 text-sky-500" /> : <Check className="w-3 h-3" />)}
                  </p>
                  <span className="block clear-both" />
                </div>
                {mine && (
                  <div className="w-8 flex-shrink-0">
                    {isLastInRun ? <Avatar name={m.senderName} /> : null}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Composer */}
      <div className="px-3 py-3 bg-[#F4EFE7] border-t border-border/60">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_REPLIES[audience].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              disabled={sending}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-primary/10 hover:text-primary text-secondary/80 border border-border/40 inline-flex items-center gap-1 transition-colors shadow-sm"
            >
              <Sparkles className="w-3 h-3" /> {q}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border/40 bg-white px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-32"
          />
          <button
            type="button"
            disabled={sending || !body.trim()}
            onClick={() => handleSend()}
            aria-label="Send message"
            className="w-11 h-11 rounded-full bg-primary text-white inline-flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Day separator ────────────────────────────────────────────────────────────
function DaySeparator({ date }: { date: Date }) {
  return (
    <div className="flex justify-center my-3">
      <div className="text-[10px] font-bold tracking-wider text-secondary/70 bg-white/90 rounded-md px-3 py-1 shadow-sm">
        {dayLabel(date)}
      </div>
    </div>
  );
}

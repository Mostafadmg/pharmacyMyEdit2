import React, { useEffect, useRef, useState, useCallback } from "react";
import { Send, Sparkles, MessageSquare, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { format } from "date-fns";

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

  // Combine messages and significant actions into a chronological feed
  const feed: Array<{ at: string; node: React.ReactNode; key: string }> = [];
  for (const m of messages) {
    const mine = m.senderRole === audience;
    feed.push({
      at: m.createdAt,
      key: `m-${m.id}`,
      node: (
        <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-3`}>
          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
            mine
              ? "bg-primary text-white rounded-br-sm"
              : "bg-white border border-border/60 text-secondary rounded-bl-sm shadow-sm"
          }`}>
            {!mine && (
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                {m.senderRole === "pharmacist" ? `${m.senderName}` : m.senderName}
                {KIND_LABELS[m.kind] && ` · ${KIND_LABELS[m.kind]}`}
              </p>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
            <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>
              {format(new Date(m.createdAt), "d MMM, HH:mm")}
            </p>
          </div>
        </div>
      ),
    });
  }
  for (const a of actions) {
    if (a.action === "patient_reply") continue; // already represented as message
    feed.push({
      at: a.createdAt,
      key: `a-${a.id}`,
      node: (
        <div className="flex justify-center mb-3">
          <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-full px-3 py-1">
            {format(new Date(a.createdAt), "d MMM, HH:mm")} · {a.actorName} · {KIND_LABELS[a.action] ?? a.action}
          </div>
        </div>
      ),
    });
  }
  feed.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className={`flex flex-col bg-slate-50 rounded-2xl border border-border/60 overflow-hidden ${className ?? ""}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <p className="text-sm font-bold text-secondary">Conversation with {audience === "patient" ? "your pharmacist" : "patient"}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-muted/30">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 max-h-[420px] min-h-[260px]">
        {loading && <p className="text-center text-xs text-muted-foreground py-8">Loading conversation…</p>}
        {!loading && feed.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-12 space-y-2">
            <MessageSquare className="w-6 h-6 mx-auto opacity-40" />
            <p>No messages yet — start the conversation below.</p>
          </div>
        )}
        {feed.map(item => <React.Fragment key={item.key}>{item.node}</React.Fragment>)}
      </div>

      <div className="px-3 py-2 bg-white border-t border-border/60">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_REPLIES[audience].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              disabled={sending}
              className="text-[11px] px-2.5 py-1 rounded-full bg-muted/30 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/40 inline-flex items-center gap-1 transition-colors"
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
            placeholder="Type your message… (Cmd/Ctrl + Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-white px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            disabled={sending || !body.trim()}
            onClick={() => handleSend()}
            className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-primary/90"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  Send,
  Sparkles,
  MessageSquare,
  X,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { PRESCRIPTION_EVIDENCE_SLOTS } from "@/lib/prescriptionEvidenceSlots";
import { apiFetch } from "@/lib/api";
import { buildConsultationDocumentFocusPath } from "@/lib/consultationDocumentFocus";
import ClinicalReplyPicker from "@/components/pharmacist/ClinicalReplyPicker";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

type Audience = "patient" | "pharmacist";

type Message = {
  id: string;
  consultationId: string;
  patientEmail: string;
  senderRole: string;
  senderName: string;
  body: string;
  kind: string;
  meta?: string | null;
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
  document_upload: "Document uploaded",
  document_rejected: "Document rejected",
  document_verified: "Document verified",
  document_upload_requested: "Upload requested",
  approve: "Approved",
  reject: "Decision: not suitable",
  more_info: "Information requested",
  refer: "Referred",
};

const QUICK_REPLIES: Record<Audience, string[]> = {
  patient: [],
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
  conditionId?: string | null;
  consultationStatus?: string | null;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().replace(/^Dr\.?\s+/i, "").split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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

// Known prescriber portraits — keyed by normalised name (lowercase, no "Dr.").
// When a sender's name matches, we render their photo instead of the initials.
// Add new pharmacists here as they're onboarded.
const PRESCRIBER_PHOTOS: Record<string, string> = {
  "sarah mitchell":
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=faces",
};
function normaliseName(name: string): string {
  return name.trim().replace(/^Dr\.?\s+/i, "").toLowerCase();
}
function photoFor(name: string): string | undefined {
  return PRESCRIBER_PHOTOS[normaliseName(name)];
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
  const photo = photoFor(name);
  const [broken, setBroken] = useState(false);

  if (photo && !broken) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setBroken(true)}
        className={`${dim} rounded-full object-cover flex-shrink-0 shadow-sm bg-muted`}
      />
    );
  }
  return (
    <div className={`${dim} ${c.bg} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

export default function ConsultationChat({ consultationId, audience, className, onClose, conditionId, consultationStatus }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachSlot, setAttachSlot] = useState("weight-scale-video");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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

  async function handleAttach(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File must be under 4 MB.");
      return;
    }
    setSending(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") throw new Error("Read failed");
        const slotTitle =
          PRESCRIPTION_EVIDENCE_SLOTS.find((s) => s.id === attachSlot)?.title ??
          "document";
        await apiFetch(
          `/api/consultations/${encodeURIComponent(consultationId)}/patient-documents`,
          {
            method: "POST",
            auth: audience,
            body: JSON.stringify({
              docId: attachSlot,
              dataUrl,
              messageBody:
                body.trim() ||
                `Uploaded ${slotTitle}${audience === "patient" ? "" : " (via pharmacist)"}.`,
            }),
          },
        );
        setBody("");
        await load();
        toast.success("Document uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setSending(false);
      }
    };
    reader.readAsDataURL(file);
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
      subtitle: otherRole === "pharmacist" ? "EveryDayMeds Prescriber · GPhC registered" : "Patient",
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

  return (
    <div className={cn("flex flex-col rounded-2xl border border-stone-200/90 overflow-hidden bg-white shadow-sm", className)}>
      <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-800 text-white">
        <Avatar name={otherParty.name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{otherParty.name}</p>
          <p className="text-[11px] text-white/80 truncate">{otherParty.subtitle}</p>
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

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 max-h-[460px] min-h-[280px] bg-stone-100/60"
      >
        {loading && (
          <p className="text-center text-xs text-stone-500 py-8">Loading conversation…</p>
        )}
        {!loading && feed.length === 0 && (
          <div className="text-center text-xs text-stone-500 py-12">
            <div className="inline-flex flex-col items-center gap-2 bg-white rounded-2xl px-6 py-5 shadow-sm border border-stone-200/80">
              <MessageSquare className="w-6 h-6 opacity-40" />
              <p>No messages yet — start the conversation below.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {feed.map((item, i) => {
            const prev = feed[i - 1];
            const showDay = !prev || !isSameDay(new Date(prev.at), new Date(item.at));

            if (item.kind === "action") {
              const a = item.action;
              return (
                <React.Fragment key={item.key}>
                  {showDay && <DaySeparator date={new Date(item.at)} />}
                  <div className="flex justify-center">
                    <div className="text-[11px] text-stone-600 bg-white rounded-lg px-3 py-1.5 border border-stone-200/80 shadow-sm">
                      <span className="font-semibold">{KIND_LABELS[a.action] ?? a.action}</span>
                      <span className="mx-1.5 opacity-50">·</span>
                      {a.actorName}
                      <span className="mx-1.5 opacity-50">·</span>
                      {formatMessageTime(a.createdAt)}
                    </div>
                  </div>
                </React.Fragment>
              );
            }

            const m = item.msg;
            const mine = m.senderRole === audience;
            const fromPharmacist = m.senderRole === "pharmacist";
            const senderLabel =
              m.senderRole === "pharmacist"
                ? "Pharmacist"
                : m.senderName || "Patient";

            return (
              <React.Fragment key={item.key}>
                {showDay && <DaySeparator date={new Date(item.at)} />}
                <div
                  className={cn(
                    "flex flex-col max-w-[88%]",
                    mine ? "ml-auto items-end" : "mr-auto items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                      fromPharmacist
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-stone-800 border border-stone-200",
                      mine ? "rounded-br-md" : "rounded-bl-md",
                    )}
                  >
                    {KIND_LABELS[m.kind] ? (
                      <p className="text-[10px] font-bold uppercase tracking-wide opacity-80 mb-1">
                        {KIND_LABELS[m.kind]}
                      </p>
                    ) : null}
                    <p>{m.body}</p>
                    {audience === "patient" &&
                      (m.kind === "document_rejected" ||
                        m.kind === "document_upload_requested" ||
                        m.kind === "more_info_request") && (
                        <div className="mt-2">
                          {(() => {
                            let docId: string | undefined;
                            try {
                              const meta = m.meta ? JSON.parse(m.meta) : {};
                              docId =
                                typeof meta.docId === "string" ? meta.docId : undefined;
                            } catch {
                              docId = undefined;
                            }
                            if (
                              (m.kind === "document_rejected" ||
                                m.kind === "document_upload_requested") &&
                              docId
                            ) {
                              return (
                                <Link
                                  href={buildConsultationDocumentFocusPath(consultationId, docId)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5"
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                  Upload document again
                                </Link>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                  </div>
                  <p className="mt-1.5 px-1 text-xs font-medium text-stone-500">
                    {senderLabel} · {formatMessageTime(m.createdAt)}
                  </p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-3 bg-[#F4EFE7] border-t border-stone-200/80">
        {audience === "pharmacist" && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {QUICK_REPLIES.pharmacist.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              disabled={sending}
              className="text-[11px] px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 border border-stone-200 inline-flex items-center gap-1 transition-colors shadow-sm"
            >
              <Sparkles className="w-3 h-3 shrink-0" /> {q}
            </button>
            ))}
            <ClinicalReplyPicker
              conditionId={conditionId ?? null}
              statusContext={consultationStatus ?? null}
              onPick={(picked) => setBody((prev) => (prev.trim() ? `${prev}\n\n${picked}` : picked))}
            />
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
            if (f) void handleAttach(f);
          }}
        />
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 max-h-32"
          />
          <button
            type="button"
            disabled={sending || !body.trim()}
            onClick={() => handleSend()}
            aria-label="Send message"
            className="w-11 h-11 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center disabled:opacity-50 disabled:bg-stone-200 disabled:text-stone-400 hover:bg-emerald-700 transition-colors flex-shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DaySeparator({ date }: { date: Date }) {
  return (
    <div className="flex justify-center my-2">
      <div className="text-[10px] font-bold tracking-wider text-stone-500 bg-white rounded-md px-3 py-1 border border-stone-200/80">
        {dayLabel(date)}
      </div>
    </div>
  );
}

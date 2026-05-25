import { useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  Send,
  User,
} from "lucide-react";
import { PRESCRIPTION_EVIDENCE_SLOTS } from "@/lib/prescriptionEvidenceSlots";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_KIND_STYLES,
  activityEventBorderClass,
  formatActivityTime,
  type PatientCommunication,
} from "@/lib/orderActivity";

const PREVIEW_CHARS = 180;

function formatMessageWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "UNKNOWN DATE";
  return d
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function previewText(text: string): string {
  const t = text.trim();
  if (t.length <= PREVIEW_CHARS) return t;
  return `${t.slice(0, PREVIEW_CHARS).trim()}…`;
}

function groupByDate(comms: PatientCommunication[]) {
  const sorted = [...comms].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  const map = new Map<string, PatientCommunication[]>();
  for (const c of sorted) {
    const date = formatDateGroup(c.at);
    const list = map.get(date) ?? [];
    list.push(c);
    map.set(date, list);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export function MessagesTab({
  consultationId,
  patientName,
  communications,
  onCompose,
  unreadCount = 0,
}: {
  consultationId: string;
  patientName: string;
  communications: PatientCommunication[];
  onCompose?: (message: string) => void;
  unreadCount?: number;
}) {
  const { toast } = useToast();
  const [threadOpen, setThreadOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [attachSlot, setAttachSlot] = useState(PRESCRIPTION_EVIDENCE_SLOTS[2]!.id);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const orderedAsc = useMemo(
    () =>
      [...communications].sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
      ),
    [communications],
  );

  const dayGroups = useMemo(
    () => groupByDate(communications),
    [communications],
  );

  const focusComm = orderedAsc.find((c) => c.id === focusId) ?? null;

  const openThread = (comm: PatientCommunication) => {
    setFocusId(comm.id);
    setThreadOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              Messages
            </h3>
            {unreadCount > 0 ? (
              <span className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Every message to and from {patientName}. Click a card to open the
            full thread. Patient replies you have not opened are highlighted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["message_out", "message_in"] as const).map((kind) => {
            const style = ACTIVITY_KIND_STYLES[kind];
            return (
              <span
                key={kind}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                  style.badge,
                  kind === "message_out"
                    ? "border-rx-hold-border"
                    : "border-rx-approve-border",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", style.legendDot)} />
                {style.label}
              </span>
            );
          })}
        </div>
      </div>

      {orderedAsc.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/40/80 px-6 py-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium text-foreground">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the floating Message patient button or compose below.
          </p>
        </div>
      ) : (
        dayGroups.map((day) => (
          <div key={day.date}>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-muted" />
              <span className="bg-card px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {day.date}
              </span>
              <div className="h-px flex-1 bg-muted" />
            </div>
            <ul className="space-y-2.5">
              {day.items.map((comm) => {
                const isOut = comm.direction === "outgoing";
                const kind = isOut ? "message_out" : "message_in";
                const style = ACTIVITY_KIND_STYLES[kind];
                const needsTruncation = comm.message.trim().length > PREVIEW_CHARS;
                const initials = comm.actor
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <li key={comm.id}>
                    <button
                      type="button"
                      onClick={() => openThread(comm)}
                      className={cn(
                        "w-full rounded-2xl border border-l-4 p-4 text-left transition-colors hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        style.card,
                        activityEventBorderClass(kind),
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2",
                            style.icon,
                          )}
                        >
                          {isOut ? (
                            <Send className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                  style.badge,
                                )}
                              >
                                {style.label}
                              </span>
                              <p className="text-[13px] font-semibold text-foreground">
                                {isOut
                                  ? `Message sent to ${patientName}`
                                  : `${patientName} replied`}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                                style.time,
                              )}
                            >
                              {formatActivityTime(comm.at)}
                            </span>
                          </div>
                          <p className="mt-2 break-words text-[12px] leading-relaxed text-muted-foreground">
                            {previewText(comm.message)}
                          </p>
                          {needsTruncation ? (
                            <span
                              className={cn(
                                "mt-2 inline-block text-[11px] font-semibold",
                                isOut ? "text-rx-hold" : "text-primary",
                              )}
                            >
                              View full message →
                            </span>
                          ) : null}
                          <div
                            className={cn(
                              "mt-2 flex items-center gap-1.5 border-t pt-2.5",
                              isOut
                                ? "border-rx-hold-border/50"
                                : "border-rx-approve-border/50",
                            )}
                          >
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-[9px] font-bold text-muted-foreground">
                              {initials}
                            </div>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {comm.actor} · {formatMessageWhen(comm.at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}

      {onCompose ? (
        <div className="rounded-2xl border border-border bg-muted/40/50 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Compose message
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${patientName}…`}
            className="mt-2 min-h-[5rem] w-full resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 4 * 1024 * 1024) {
                toast({
                  title: "File too large",
                  description: "Maximum 4 MB.",
                  variant: "destructive",
                });
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result;
                if (typeof dataUrl !== "string") return;
                setUploading(true);
                void apiFetch(
                  `/api/consultations/${consultationId}/patient-documents`,
                  {
                    method: "POST",
                    body: JSON.stringify({
                      docId: attachSlot,
                      dataUrl,
                      messageBody:
                        draft.trim() ||
                        `Uploaded ${PRESCRIPTION_EVIDENCE_SLOTS.find((s) => s.id === attachSlot)?.title ?? "document"}.`,
                    }),
                  },
                )
                  .then(() => {
                    const msg =
                      draft.trim() ||
                      `Uploaded ${PRESCRIPTION_EVIDENCE_SLOTS.find((s) => s.id === attachSlot)?.title ?? "a document"} for your review.`;
                    onCompose(msg);
                    setDraft("");
                    toast({ title: "Document attached in thread" });
                  })
                  .catch((err) => {
                    toast({
                      title: "Upload failed",
                      description:
                        err instanceof Error ? err.message : "Try again.",
                      variant: "destructive",
                    });
                  })
                  .finally(() => setUploading(false));
              };
              reader.readAsDataURL(file);
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={attachSlot}
              onChange={(e) =>
                setAttachSlot(e.target.value as typeof attachSlot)
              }
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs font-medium text-foreground"
            >
              {PRESCRIPTION_EVIDENCE_SLOTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 disabled:opacity-50"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {uploading ? "Uploading…" : "Attach document"}
            </button>
            <button
              type="button"
              disabled={!draft.trim() || uploading}
              onClick={() => {
                if (draft.trim()) {
                  onCompose(draft.trim());
                  setDraft("");
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
            >
              <Send className="h-4 w-4" /> Send message
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Attach uploads a file into the patient record and logs it in this
            thread. Patients can attach files when they reply in their portal.
          </p>
        </div>
      ) : null}

      <Dialog open={threadOpen} onOpenChange={setThreadOpen}>
        <DialogContent className="max-w-[min(96vw,720px)] max-h-[min(88vh,720px)] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <DialogTitle className="text-base font-semibold">
              Message thread
            </DialogTitle>
            <DialogDescription>
              {patientName} · {orderedAsc.length} message
              {orderedAsc.length === 1 ? "" : "s"} on this order
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/60 px-4 py-4 sm:px-5">
            <div className="space-y-3 pb-1">
              {orderedAsc.map((comm) => {
                const fromPrescriber = comm.direction === "outgoing";
                const highlighted = comm.id === focusId;
                return (
                  <div
                    key={comm.id}
                    className={cn(
                      "flex min-w-0 max-w-[92%] flex-col",
                      fromPrescriber
                        ? "ml-auto items-end"
                        : "mr-auto items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rx-safe-text max-w-full rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm ring-2 ring-offset-2 ring-offset-background",
                        fromPrescriber
                          ? "rounded-br-md border border-rx-hold-border bg-rx-hold text-white"
                          : "rounded-bl-md border border-rx-approve-border bg-rx-approve-surface text-foreground",
                        highlighted
                          ? fromPrescriber
                            ? "ring-rx-hold-border"
                            : "ring-rx-approve-border"
                          : "ring-transparent",
                      )}
                    >
                      {comm.message}
                    </div>
                    <div className="mt-1 flex max-w-full flex-wrap items-center gap-2 px-1 text-[11px] font-medium text-muted-foreground">
                      <span className="break-words">{comm.actor}</span>
                      <span>·</span>
                      <span>{formatMessageWhen(comm.at)}</span>
                      {comm.status === "patient_responded" && !fromPrescriber ? (
                        <span className="inline-flex items-center gap-0.5 text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Patient reply
                        </span>
                      ) : fromPrescriber ? (
                        <span className="inline-flex items-center gap-0.5 text-rx-hold">
                          <Clock className="h-3 w-3" /> Sent
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {focusComm ? (
            <div className="shrink-0 border-t border-border bg-card px-5 py-3 text-xs text-muted-foreground">
              Selected: {focusComm.actor} · {formatMessageWhen(focusComm.at)}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

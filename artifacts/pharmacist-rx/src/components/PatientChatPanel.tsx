import type { CSSProperties } from "react";
import { MessageSquare, Send, X, XCircle } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PatientCommunication } from "@/lib/orderActivity";

/** Clearance above the fixed “Message patient” FAB (bottom-4 + button height + gap). */
const FAB_CLEARANCE = "7.25rem";

function formatCommTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PatientChatPanel({
  open,
  onOpenChange,
  patientName,
  communications,
  messageDraft,
  onMessageDraftChange,
  chatClosed,
  onToggleChatClosed,
  onSend,
  sendDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  communications: PatientCommunication[];
  messageDraft: string;
  onMessageDraftChange: (value: string) => void;
  chatClosed: boolean;
  onToggleChatClosed: () => void;
  onSend: () => void;
  sendDisabled?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        hideCloseButton
        hideOverlay
        onInteractOutside={(event) => {
          const target = event.target;
          if (
            target instanceof HTMLElement &&
            target.closest('[data-testid="button-message-patient"]')
          ) {
            event.preventDefault();
          }
        }}
        style={
          {
            "--rx-chat-fab-clearance": FAB_CLEARANCE,
          } as CSSProperties
        }
        className={cn(
          "fixed z-[70] flex flex-col p-0 gap-0 overflow-hidden",
          "left-auto top-auto translate-x-0 translate-y-0",
          "right-4 sm:right-6",
          "bottom-[var(--rx-chat-fab-clearance)]",
          "w-[min(calc(100vw-2rem),28rem)] sm:w-[min(calc(100vw-3rem),32rem)]",
          "max-h-[min(72vh,calc(100dvh-var(--rx-chat-fab-clearance)-1.25rem))]",
          "rounded-2xl border border-border/90 bg-card shadow-[0_20px_60px_-12px_rgba(0,0,0,0.35)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:slide-out-to-right-4",
          "data-[state=open]:slide-in-from-bottom-4 data-[state=open]:slide-in-from-right-4",
          "data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
          "duration-200",
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-linear-to-r from-muted/40 to-rx-approve-surface/30 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md sm:h-12 sm:w-12">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Patient communications
            </DialogTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium text-muted-foreground sm:text-base">
                {patientName}
              </span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:text-xs",
                  chatClosed
                    ? "bg-muted text-muted-foreground"
                    : "bg-rx-approve-surface text-primary",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    chatClosed ? "bg-muted-foreground/50" : "bg-primary",
                  )}
                />
                {chatClosed ? "Closed" : "Open"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleChatClosed}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
                chatClosed
                  ? "border-border bg-rx-approve-surface text-primary hover:bg-rx-approve-surface/80"
                  : "border-rx-decline-border bg-card text-rx-decline hover:bg-rx-decline-surface",
              )}
            >
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only sm:not-sr-only">
                {chatClosed ? "Start chat" : "End chat"}
              </span>
            </button>
            <DialogClose
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:h-11 sm:w-11"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </div>

        <DialogDescription className="sr-only">
          Patient communication thread anchored to the message patient control.
        </DialogDescription>

        <div className="flex min-h-0 flex-1 flex-col bg-muted/60">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
            <div className="space-y-4 pb-1">
              {communications.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground sm:py-12 sm:text-base">
                  No messages yet. Send the first message below.
                </p>
              ) : (
                communications.map((comm) => {
                  const fromPrescriber = comm.direction === "outgoing";
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
                          "rx-safe-text max-w-full rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm sm:px-5 sm:py-3.5 sm:text-base",
                          fromPrescriber
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border border-border bg-card text-foreground",
                        )}
                      >
                        {comm.message}
                      </div>
                      <div className="mt-1.5 max-w-full px-1 text-xs font-medium text-muted-foreground sm:text-sm">
                        <span className="break-words">{comm.actor}</span>
                        <span> · {formatCommTime(comm.at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {chatClosed ? (
            <div className="shrink-0 border-t border-border bg-rx-cs-surface/80 px-4 py-3 sm:px-5 sm:py-3.5">
              <p className="text-sm text-rx-cs sm:text-base">
                Chat is closed. Use <strong>Start chat</strong> or send a message
                to reopen.
              </p>
            </div>
          ) : null}

          <div className="shrink-0 border-t border-border bg-card px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-end gap-2.5 sm:gap-3">
              <Textarea
                value={messageDraft}
                onChange={(event) => onMessageDraftChange(event.target.value)}
                placeholder="Message the patient…"
                className="min-h-[4rem] flex-1 resize-none rounded-xl border-border bg-muted/40 px-3.5 py-2.5 text-sm leading-relaxed focus-visible:ring-primary/30 sm:min-h-[4.5rem] sm:px-4 sm:py-3 sm:text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    onSend();
                  }
                }}
              />
              <button
                type="button"
                disabled={sendDisabled}
                onClick={onSend}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground hover:bg-primary/90 sm:h-12 sm:w-12"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground sm:mt-2.5 sm:text-sm">
              Messages are logged to Activity for audit. Ctrl+Enter to send.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

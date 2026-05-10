import { useEffect, useState } from "react";
import { Sparkles, ChevronDown, X, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";

export type ClinicalReply = {
  id: string;
  title: string;
  body: string;
  conditionId: string | null;
  statusContext: string | null;
  category: "general" | "safety" | "admin" | "follow_up";
};

interface Props {
  conditionId?: string | null;
  statusContext?: string | null;
  onPick: (body: string) => void;
}

const CATEGORY_BADGE: Record<ClinicalReply["category"], string> = {
  general: "bg-slate-100 text-slate-700",
  safety: "bg-rose-100 text-rose-700",
  admin: "bg-sky-100 text-sky-700",
  follow_up: "bg-emerald-100 text-emerald-700",
};

export default function ClinicalReplyPicker({ conditionId, statusContext, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ClinicalReply[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams();
    if (conditionId) params.set("conditionId", conditionId);
    if (statusContext) params.set("statusContext", statusContext);
    const qs = params.toString();
    apiFetch<{ replies: ClinicalReply[] }>(`/api/pharmacist/clinical-replies${qs ? `?${qs}` : ""}`, {
      auth: "pharmacist",
    })
      .then((j) => setReplies(j.replies ?? []))
      .catch(() => setReplies([]));
  }, [open, conditionId, statusContext]);

  function pick(reply: ClinicalReply) {
    onPick(reply.body);
    apiFetch(`/api/pharmacist/clinical-replies/${reply.id}/use`, {
      method: "POST",
      auth: "pharmacist",
    }).catch(() => {});
    setOpen(false);
  }

  const filtered = filter
    ? replies.filter(
        (r) =>
          r.title.toLowerCase().includes(filter.toLowerCase()) ||
          r.body.toLowerCase().includes(filter.toLowerCase()),
      )
    : replies;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] px-2.5 py-1 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold inline-flex items-center gap-1 transition-colors shadow-sm"
        data-testid="button-smart-replies"
      >
        <Sparkles className="w-3 h-3" /> Smart replies
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[150] bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-border max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-secondary">Smart clinical replies</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-2 border-b border-border bg-muted/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter templates…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-white outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No templates found</div>
              ) : (
                filtered.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => pick(r)}
                    className="w-full text-left p-3 rounded-xl hover:bg-violet-50 border border-transparent hover:border-violet-200 transition-colors mb-1.5"
                    data-testid={`reply-template-${r.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-secondary">{r.title}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${CATEGORY_BADGE[r.category]}`}>
                        {r.category.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.body}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

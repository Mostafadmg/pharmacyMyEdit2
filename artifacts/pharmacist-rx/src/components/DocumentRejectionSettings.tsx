import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PRESCRIPTION_EVIDENCE_SLOTS } from "@/lib/prescriptionEvidenceSlots";
import {
  fetchDocumentRejectionTemplates,
  saveDocumentRejectionTemplates,
  type DocumentRejectionTemplate,
} from "@/lib/documentRejectionTemplates";

function emptyTemplate(): DocumentRejectionTemplate {
  return {
    id: `tpl-${Date.now()}`,
    title: "",
    docSlotIds: [],
    emailSubject: "Please re-upload your document",
    emailBody: "",
  };
}

export function DocumentRejectionSettings() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DocumentRejectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchDocumentRejectionTemplates();
      setTemplates(list);
    } catch (err) {
      toast({
        title: "Could not load templates",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateTemplate = (
    index: number,
    patch: Partial<DocumentRejectionTemplate>,
  ) => {
    setTemplates((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  };

  const toggleSlot = (index: number, slotId: string) => {
    setTemplates((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        let docSlotIds = [...t.docSlotIds];
        if (docSlotIds.length === 0) {
          docSlotIds = [slotId];
        } else if (docSlotIds.includes(slotId)) {
          docSlotIds = docSlotIds.filter((s) => s !== slotId);
        } else {
          docSlotIds.push(slotId);
        }
        return { ...t, docSlotIds };
      }),
    );
  };

  const save = async () => {
    const invalid = templates.find(
      (t) => !t.title.trim() || !t.emailBody.trim() || !t.emailSubject.trim(),
    );
    if (invalid) {
      toast({
        title: "Complete all templates",
        description: "Each template needs a title, subject, and email body.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const saved = await saveDocumentRejectionTemplates(templates);
      setTemplates(saved);
      toast({ title: "Document email templates saved" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">Loading templates…</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-rx-cs-surface/60 p-4 text-sm text-amber-950 leading-relaxed">
        <div className="flex items-start gap-2 font-semibold">
          <Mail className="h-4 w-4 shrink-0 mt-0.5" />
          Automatic rejection emails
        </div>
        <p className="mt-2 text-amber-900/90">
          Create reasons (e.g. &quot;Invalid photo&quot;) with the email text
          sent when you reject a document. Pharmacists pick a reason when
          rejecting — the message fills in automatically and appears in
          Messages and Activity.
        </p>
      </div>

      <div className="space-y-4 max-h-[min(60vh,520px)] overflow-y-auto pr-1">
        {templates.map((tpl, index) => (
          <div
            key={tpl.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <label className="flex-1 block">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason title
                </span>
                <input
                  value={tpl.title}
                  onChange={(e) =>
                    updateTemplate(index, { title: e.target.value })
                  }
                  placeholder="e.g. Invalid photo — scale not readable"
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm font-semibold"
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-rose-600 hover:text-rose-700 hover:bg-rx-decline-surface"
                disabled={templates.length <= 1}
                onClick={() =>
                  setTemplates((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Applies to documents
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESCRIPTION_EVIDENCE_SLOTS.map((slot) => {
                  const appliesToAll = tpl.docSlotIds.length === 0;
                  const selected =
                    appliesToAll || tpl.docSlotIds.includes(slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleSlot(index, slot.id)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        selected && !appliesToAll
                          ? "border-rx-approve-border bg-rx-approve-surface text-primary"
                          : appliesToAll
                            ? "border-border bg-muted text-foreground"
                            : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      {slot.title}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Select specific types, or leave none selected to show for all
                documents.
              </p>
            </div>

            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Email subject
              </span>
              <input
                value={tpl.emailSubject}
                onChange={(e) =>
                  updateTemplate(index, { emailSubject: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Email &amp; patient message content
              </span>
              <textarea
                value={tpl.emailBody}
                onChange={(e) =>
                  updateTemplate(index, { emailBody: e.target.value })
                }
                rows={4}
                placeholder="Explain what was wrong and what you need the patient to upload…"
                className="mt-1 w-full resize-y rounded-xl border border-border px-3 py-2 text-sm leading-relaxed"
              />
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setTemplates((prev) => [...prev, emptyTemplate()])}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add template
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white ml-auto"
          onClick={() => void save()}
        >
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? "Saving…" : "Save templates"}
        </Button>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Tag } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetConsultationQueryKey } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { getPharmacistName } from "@/lib/pharmacistSession";
import { useCustomOrderTags } from "@/context/CustomOrderTagsContext";
import { HoldOrderTagPicker } from "@/components/HoldOrderTagPicker";
import {
  buildOrderTagsBatchAddBody,
  buildOrderTagsBatchRemoveBody,
} from "@/lib/orderTagApi";
import {
  getActiveOrderTags,
  resolveOrderTagLabel,
  type OrderTagRecord,
} from "@/lib/orderTags";

export type OrderTagActivityPayload =
  | {
      action: "add" | "remove";
      label: string;
      tagId: string;
      note?: string;
    }
  | {
      action: "add_batch";
      labels: string[];
      tagIds: string[];
      note?: string;
    }
  | {
      action: "remove_batch";
      labels: string[];
      tagIds: string[];
      note?: string;
    };

export function OrderTagsManageDialog({
  consultation,
  open,
  onOpenChange,
  onTagActivity,
}: {
  consultation: Consultation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagActivity?: (payload: OrderTagActivityPayload) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { customTags } = useCustomOrderTags();
  const [saving, setSaving] = useState(false);
  const [addNote, setAddNote] = useState("");
  const [removeNote, setRemoveNote] = useState("");
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedForAdd, setSelectedForAdd] = useState<Set<string>>(
    () => new Set(),
  );

  const active = useMemo(
    () => getActiveOrderTags(consultation),
    [consultation],
  );

  const activeIds = useMemo(
    () => new Set(active.map((t) => t.tagId)),
    [active],
  );

  const resetRemovalDraft = () => {
    setSelectedForRemoval(new Set());
    setRemoveNote("");
  };

  const resetAddDraft = () => {
    setSelectedForAdd(new Set());
    setAddNote("");
  };

  const toggleRemoval = (tagId: string, checked: boolean) => {
    setSelectedForRemoval((prev) => {
      const next = new Set(prev);
      if (checked) next.add(tagId);
      else next.delete(tagId);
      return next;
    });
  };

  const toggleAdd = (tagId: string) => {
    setSelectedForAdd((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  async function saveAdds() {
    const tagIds = [...selectedForAdd].filter((id) => !activeIds.has(id));
    if (tagIds.length === 0) return;

    setSaving(true);
    try {
      await apiFetch(`/api/consultations/${consultation.id}/order-tags`, {
        method: "PATCH",
        body: JSON.stringify(
          buildOrderTagsBatchAddBody(
            {
              tagIds,
              pharmacistName: getPharmacistName(),
              note: addNote.trim() || undefined,
            },
            customTags,
          ),
        ),
      });

      await queryClient.invalidateQueries({
        queryKey: getGetConsultationQueryKey(consultation.id),
      });

      const labels = tagIds.map((id) => resolveOrderTagLabel(id, customTags));
      const trimmed = addNote.trim() || undefined;

      if (tagIds.length === 1) {
        onTagActivity?.({
          action: "add",
          tagId: tagIds[0]!,
          label: labels[0]!,
          note: trimmed,
        });
      } else {
        onTagActivity?.({
          action: "add_batch",
          tagIds,
          labels,
          note: trimmed,
        });
      }

      toast({
        title:
          tagIds.length === 1 ? "Tag added" : `${tagIds.length} tags added`,
        description: labels.join(", "),
      });

      resetAddDraft();
    } catch (err) {
      toast({
        title: "Could not add tags",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function saveRemovals() {
    const tagIds = [...selectedForRemoval];
    if (tagIds.length === 0) return;

    setSaving(true);
    try {
      await apiFetch(`/api/consultations/${consultation.id}/order-tags`, {
        method: "PATCH",
        body: JSON.stringify(
          buildOrderTagsBatchRemoveBody({
            tagIds,
            pharmacistName: getPharmacistName(),
            note: removeNote.trim() || undefined,
          }),
        ),
      });

      await queryClient.invalidateQueries({
        queryKey: getGetConsultationQueryKey(consultation.id),
      });

      const labels = tagIds.map((id) => resolveOrderTagLabel(id, customTags));
      const trimmed = removeNote.trim() || undefined;

      if (tagIds.length === 1) {
        onTagActivity?.({
          action: "remove",
          tagId: tagIds[0]!,
          label: labels[0]!,
          note: trimmed,
        });
      } else {
        onTagActivity?.({
          action: "remove_batch",
          tagIds,
          labels,
          note: trimmed,
        });
      }

      toast({
        title:
          tagIds.length === 1 ? "Tag removed" : `${tagIds.length} tags removed`,
        description: labels.join(", "),
      });

      resetRemovalDraft();
    } catch (err) {
      toast({
        title: "Could not remove tags",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const removalCount = selectedForRemoval.size;
  const addCount = selectedForAdd.size;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!saving) {
          if (!o) {
            resetAddDraft();
            resetRemovalDraft();
          }
          onOpenChange(o);
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[min(92vh,820px)] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Tag className="h-4 w-4 text-primary" />
            Manage order tags
          </DialogTitle>
          <DialogDescription className="text-sm">
            Select tags to add or remove, then save once. Changes appear in the
            order header and a single activity entry per save.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Active on this order
            </h3>
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No active tags. Add one below or use CS / prescriber hold to
                tag when placing on hold.
              </p>
            ) : (
              <ul className="space-y-2">
                {active.map((t: OrderTagRecord) => {
                  const checked = selectedForRemoval.has(t.tagId);
                  return (
                    <li
                      key={`${t.tagId}-${t.addedAt}`}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 transition-colors",
                        checked
                          ? "border-rose-300/70 bg-rose-50/50 dark:bg-rose-950/20"
                          : "border-border bg-muted/30",
                      )}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          disabled={saving}
                          onCheckedChange={(v) =>
                            toggleRemoval(t.tagId, v === true)
                          }
                          className="mt-0.5"
                          aria-label={`Select ${t.label} for removal`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground">
                            {t.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Added by {t.addedBy} ·{" "}
                            {new Date(t.addedAt).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          {t.addedNote ? (
                            <p className="text-[11px] text-foreground/80 mt-1 italic">
                              {t.addedNote}
                            </p>
                          ) : null}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            {removalCount > 0 ? (
              <div className="mt-4 space-y-2 rounded-xl border border-rose-200/80 bg-rose-50/30 p-3 dark:bg-rose-950/10">
                <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">
                  {removalCount} tag{removalCount === 1 ? "" : "s"} selected for
                  removal
                </p>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Note when removing{" "}
                  <span className="font-normal">(optional)</span>
                </label>
                <Textarea
                  value={removeNote}
                  onChange={(e) => setRemoveNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={saving}
                  placeholder="Why are these tags being removed?"
                  className="text-sm min-h-[3.5rem] resize-none bg-card"
                />
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Add a tag
            </h3>
            <HoldOrderTagPicker
              consultation={consultation}
              selectedIds={selectedForAdd}
              onToggle={toggleAdd}
              variant="prescriber"
              className={cn(removalCount > 0 && "pointer-events-none opacity-50")}
            />
            {addCount > 0 ? (
              <div className="mt-4 space-y-2 rounded-xl border border-primary/25 bg-primary/5 p-3 dark:bg-primary/10">
                <p className="text-xs font-semibold text-foreground">
                  {addCount} tag{addCount === 1 ? "" : "s"} selected to add
                </p>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Note when adding{" "}
                  <span className="font-normal">(optional, applies to all)</span>
                </label>
                <Textarea
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={saving || removalCount > 0}
                  placeholder="Context for other prescribers…"
                  className="text-sm min-h-[3.5rem] resize-none bg-card"
                />
              </div>
            ) : null}
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3 gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={saving || (removalCount === 0 && addCount === 0)}
            onClick={() => {
              resetRemovalDraft();
              resetAddDraft();
            }}
            className="text-muted-foreground"
          >
            Clear selection
          </Button>
          <div className="flex gap-2">
            {addCount > 0 && removalCount === 0 ? (
              <Button
                type="button"
                disabled={saving}
                onClick={() => void saveAdds()}
              >
                Add {addCount} tag{addCount === 1 ? "" : "s"}
              </Button>
            ) : null}
            {removalCount > 0 && addCount === 0 ? (
              <Button
                type="button"
                disabled={saving}
                onClick={() => void saveRemovals()}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Remove {removalCount} tag{removalCount === 1 ? "" : "s"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCustomOrderTags } from "@/context/CustomOrderTagsContext";
import {
  CUSTOM_TAG_LABEL_MAX,
  CUSTOM_TAG_MAX_COUNT,
} from "@/lib/customOrderTags";

export function CustomOrderTagsSettings() {
  const { toast } = useToast();
  const { customTags, addCustomTag, removeCustomTag, renameCustomTag } =
    useCustomOrderTags();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const addTag = () => {
    const result = addCustomTag(draft);
    if (!result.ok) {
      toast({
        title: "Could not add tag",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    setDraft("");
    toast({ title: "Custom tag saved", description: result.label });
  };

  const saveEdit = () => {
    if (!editingId) return;
    const result = renameCustomTag(editingId, editDraft);
    if (!result.ok) {
      toast({
        title: "Could not update tag",
        description: result.error,
        variant: "destructive",
      });
      return;
    }
    setEditingId(null);
    setEditDraft("");
    toast({ title: "Tag updated", description: result.label });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-rx-approve-surface/50 p-4 text-sm leading-relaxed">
        <div className="flex items-start gap-2 font-semibold text-foreground">
          <Tag className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          Custom order tags
        </div>
        <p className="mt-2 text-muted-foreground">
          Create your own hold and order tags (e.g. &quot;Awaiting GP letter&quot;).
          They appear alongside the standard catalogue when placing holds or editing
          tags on an order. Stored on this device for your prescriber account.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex-1 block min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            New tag name
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            maxLength={CUSTOM_TAG_LABEL_MAX}
            placeholder="e.g. Awaiting GP letter"
            className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold"
            data-testid="input-custom-order-tag"
          />
        </label>
        <Button
          type="button"
          size="sm"
          className="rounded-xl shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={!draft.trim() || customTags.length >= CUSTOM_TAG_MAX_COUNT}
          onClick={addTag}
          data-testid="button-add-custom-order-tag"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add tag
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {customTags.length} / {CUSTOM_TAG_MAX_COUNT} tags · names trimmed, no
        duplicates
      </p>

      {customTags.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4 text-center rounded-xl border border-dashed border-border">
          No custom tags yet. Add one above to use it on holds and order headers.
        </p>
      ) : (
        <ul className="space-y-2 max-h-[min(40vh,280px)] overflow-y-auto pr-1">
          {customTags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              {editingId === tag.id ? (
                <>
                  <input
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    maxLength={CUSTOM_TAG_LABEL_MAX}
                    className="flex-1 min-w-0 rounded-lg border border-border px-2 py-1 text-sm font-semibold"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    onClick={() => {
                      setEditingId(null);
                      setEditDraft("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs shrink-0 bg-primary text-primary-foreground"
                    onClick={saveEdit}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">
                    {tag.label}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                    aria-label={`Edit ${tag.label}`}
                    onClick={() => {
                      setEditingId(tag.id);
                      setEditDraft(tag.label);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-rose-600 hover:bg-rx-decline-surface"
                    aria-label={`Delete ${tag.label}`}
                    onClick={() => {
                      removeCustomTag(tag.id);
                      toast({ title: "Tag removed", description: tag.label });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

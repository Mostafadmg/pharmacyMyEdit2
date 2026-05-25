import { Check, Plus, Tag } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useCustomOrderTags } from "@/context/CustomOrderTagsContext";
import {
  buildPickerOrderTagDefs,
  getActiveOrderTags,
} from "@/lib/orderTags";

export function HoldOrderTagPicker({
  consultation,
  selectedIds,
  onToggle,
  variant = "cs",
  className,
}: {
  consultation: Consultation;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  variant?: "cs" | "prescriber";
  className?: string;
}) {
  const { customTags } = useCustomOrderTags();
  const activeIds = new Set(getActiveOrderTags(consultation).map((t) => t.tagId));
  const allDefs = buildPickerOrderTagDefs(customTags);
  const available = allDefs.filter((d) => !activeIds.has(d.id));
  const selectedCount = available.filter((d) => selectedIds.has(d.id)).length;
  const accentSelected =
    variant === "cs"
      ? "border-rx-cs bg-rx-cs text-white ring-1 ring-rx-cs/40"
      : "border-primary bg-primary text-primary-foreground ring-1 ring-primary/35";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col rounded-xl border",
        variant === "cs"
          ? "border-rx-cs-border/80 bg-rx-cs-surface/30"
          : "border-rx-hold-border/80 bg-rx-hold-surface/30",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Tag
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              variant === "cs" ? "text-rx-cs" : "text-primary",
            )}
          />
          <p className="text-sm font-semibold text-foreground">Order tags</p>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            · select all that apply
          </span>
        </div>
        {selectedCount > 0 ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
              variant === "cs"
                ? "bg-rx-cs text-white"
                : "bg-primary text-primary-foreground",
            )}
          >
            {selectedCount}
          </span>
        ) : null}
      </div>

      {available.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted-foreground italic">
          All available tags are already on this order.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((def) => {
              const on = selectedIds.has(def.id);
              return (
                <button
                  key={def.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onToggle(def.id)}
                  className={cn(
                    "inline-flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold leading-snug transition-colors",
                    on
                      ? accentSelected
                      : "border-border/80 bg-card text-foreground hover:border-primary/30 hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      on
                        ? "border-white/40 bg-white/15"
                        : "border-border bg-muted/30 text-muted-foreground",
                    )}
                  >
                    {on ? (
                      <Check className="h-3 w-3" strokeWidth={3} />
                    ) : (
                      <Plus className="h-3 w-3" strokeWidth={2.5} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    {def.label}
                    {def.isCustom ? (
                      <span className="ml-1 font-normal opacity-70">(custom)</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


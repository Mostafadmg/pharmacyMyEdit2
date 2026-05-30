import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { getGetConsultationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RxOptionPicker } from "@/components/RxOptionPicker";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { RX } from "@/lib/orderTheme";
import {
  getConsultationRxItems,
  type RxItem,
} from "@/lib/consultationPrescriptionItems";
import {
  bundleLinesEqual,
  bundleLinesToRxItems,
  bundleTotalPence,
  formatBundleTriggerSummary,
  formatGbpFromPence,
  formatLinePriceLabel,
  newBundleLine,
  rxItemsToBundleLines,
  WL_BUNDLE_PRESETS,
  type BundleLine,
} from "@/lib/prescriptionBundle";
import {
  getPrescribableOptions,
  optionToRxItems,
  type PrescribableOption,
} from "@/lib/prescribableCatalog";

function optionPickerOptions(options: PrescribableOption[]) {
  return options.map((o) => ({
    value: o.catalogId,
    label: `${o.name} ${o.strength}`,
    hint: o.priceLabel,
  }));
}

export function OrderHeaderMedicationSelect({
  consultation,
  onMedicationChanged,
}: {
  consultation: Consultation;
  onMedicationChanged?: (payload: { fromLabel: string; toLabel: string }) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const options = useMemo(
    () => getPrescribableOptions(consultation),
    [consultation],
  );
  const savedItems = useMemo(
    () => getConsultationRxItems(consultation),
    [consultation],
  );
  const defaultCatalogId = options[0]?.catalogId ?? "";

  const [draftLines, setDraftLines] = useState<BundleLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const syncDraftFromSaved = () => {
    setDraftLines(
      rxItemsToBundleLines(savedItems, options, defaultCatalogId),
    );
  };

  useEffect(() => {
    if (open) syncDraftFromSaved();
  }, [consultation.id, open, savedItems, options, defaultCatalogId]);

  const savedSummary = useMemo(
    () => formatBundleTriggerSummary(savedItems, options),
    [savedItems, options],
  );

  const draftTotalPence = useMemo(
    () => bundleTotalPence(draftLines, options),
    [draftLines, options],
  );

  const savedLines = useMemo(
    () => rxItemsToBundleLines(savedItems, options, defaultCatalogId),
    [savedItems, options, defaultCatalogId],
  );

  const savedTotalPence = useMemo(
    () => bundleTotalPence(savedLines, options),
    [savedLines, options],
  );

  const draftDirty = !bundleLinesEqual(draftLines, savedLines, options);

  const persistItems = async (
    items: RxItem[],
    fromLabel: string,
    toLabel: string,
  ) => {
    setSaving(true);
    try {
      await apiFetch(
        `/api/consultations/${consultation.id}/prescription-items`,
        {
          method: "PATCH",
          body: JSON.stringify({ prescriptionItems: items }),
        },
      );
      await queryClient.invalidateQueries({
        queryKey: getGetConsultationQueryKey(consultation.id),
      });
      onMedicationChanged?.({ fromLabel, toLabel });
      toast({ title: "Prescribed medication updated" });
      setOpen(false);
    } catch (err) {
      toast({
        title: "Could not update medication",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveBundle = () => {
    const items = bundleLinesToRxItems(draftLines, options);
    if (items.length === 0) {
      toast({
        title: "Add at least one line",
        variant: "destructive",
      });
      return;
    }
    const fromLabel = savedSummary.title;
    const toLabel = formatBundleTriggerSummary(items, options).title;
    void persistItems(items, fromLabel, toLabel);
  };

  const pickSingleOption = (option: PrescribableOption) => {
    const fromLabel = savedSummary.title;
    const toLabel = `${option.name} ${option.strength}`;
    void persistItems(optionToRxItems(option), fromLabel, toLabel);
  };

  const updateLine = (id: string, patch: Partial<BundleLine>) => {
    setDraftLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  };

  const adjustQty = (id: string, delta: number) => {
    setDraftLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = Math.min(99, Math.max(1, l.quantity + delta));
        return { ...l, quantity: next };
      }),
    );
  };

  const addLine = (catalogId?: string) => {
    const used = new Set(draftLines.map((l) => l.catalogId));
    const nextOpt =
      options.find((o) => !used.has(o.catalogId)) ?? options[0];
    if (!nextOpt) return;
    setDraftLines((prev) => [
      ...prev,
      newBundleLine(catalogId ?? nextOpt.catalogId, 1),
    ]);
  };

  const removeLine = (id: string) => {
    setDraftLines((prev) => {
      const next = prev.filter((l) => l.id !== id);
      return next.length > 0 ? next : [newBundleLine(defaultCatalogId, 1)];
    });
  };

  const applyPreset = (
    presetLines: Array<{ catalogId: string; quantity: number }>,
  ) => {
    if (presetLines.length === 0) {
      const first = draftLines[0]?.catalogId ?? defaultCatalogId;
      setDraftLines([newBundleLine(first, 3)]);
      return;
    }
    setDraftLines(
      presetLines.map((p) => newBundleLine(p.catalogId, p.quantity)),
    );
  };

  const isWeightLoss = consultation.conditionId === "weight-loss";
  const showPresets = isWeightLoss && options.some((o) => o.catalogId.startsWith("mounjaro"));

  if (!options.length) return null;

  return (
    <div className="mt-2.5 max-w-2xl">
      <p className={RX.pickerLabel}>Prescribed medication</p>

      <Popover
        open={open}
        onOpenChange={(next) => {
          if (saving) return;
          if (!next) syncDraftFromSaved();
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={saving}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "mt-1.5 flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-[border-color,box-shadow]",
              RX.pickerTrigger,
              open && RX.pickerTriggerOpen,
              saving && "pointer-events-none opacity-70",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {savedSummary.title}
              </span>
              <span className="mt-0.5 block truncate text-xs font-medium text-primary">
                {savedSummary.subtitle}
              </span>
            </span>
            {savedTotalPence != null ? (
              <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatGbpFromPence(savedTotalPence)}
              </span>
            ) : null}
            {saving ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            ) : (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180 text-primary",
                )}
              />
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className={cn(
            "w-[min(100vw-2rem,28rem)] p-0",
            RX.pickerMenu,
          )}
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Bundle builder
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add strengths and quantities — saved as prescription lines.
            </p>
          </div>

          <div className="max-h-[min(50vh,20rem)] overflow-y-auto px-2 py-2 space-y-2">
            {draftLines.map((line, index) => {
              const option =
                options.find((o) => o.catalogId === line.catalogId) ??
                options[0]!;
              return (
                <div
                  key={line.id}
                  className="rounded-xl border border-border bg-muted/20 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Line {index + 1}
                    </span>
                    {draftLines.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <RxOptionPicker
                    value={line.catalogId}
                    onChange={(catalogId) =>
                      updateLine(line.id, { catalogId })
                    }
                    options={optionPickerOptions(options)}
                    placeholder="Select strength"
                    menuLabel="Product & price"
                    className="mt-1.5"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-primary/30 bg-card">
                      <button
                        type="button"
                        onClick={() => adjustQty(line.id, -1)}
                        disabled={line.quantity <= 1}
                        className="px-2.5 py-1.5 text-primary disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums text-foreground">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustQty(line.id, 1)}
                        disabled={line.quantity >= 99}
                        className="px-2.5 py-1.5 text-primary disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-medium text-primary tabular-nums">
                      {formatLinePriceLabel(option, line.quantity)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border px-2 py-2 space-y-2">
            <button
              type="button"
              onClick={() => addLine()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/35 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another strength
            </button>

            {showPresets ? (
              <div className="flex flex-wrap gap-1.5">
                {WL_BUNDLE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.lines)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary/30 hover:bg-primary/5"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bundle total
              </span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {draftTotalPence != null
                  ? formatGbpFromPence(draftTotalPence)
                  : "—"}
              </span>
            </div>

            <button
              type="button"
              disabled={saving || !draftDirty}
              onClick={() => saveBundle()}
              className={cn(
                "w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                draftDirty
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-default",
              )}
            >
              {saving ? "Saving…" : draftDirty ? "Save bundle" : "Saved"}
            </button>
          </div>

          <div className="border-t border-border px-1 pb-1 pt-1">
            <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Quick select (single item)
            </p>
            <ul className="max-h-40 overflow-y-auto px-1 pb-1">
              {options.map((option) => (
                <li key={option.catalogId}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => pickSingleOption(option)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                      RX.pickerOptionIdle,
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-foreground">
                        {option.name} {option.strength}
                      </span>
                      <span className="mt-0.5 block text-xs tabular-nums text-primary">
                        {option.priceLabel}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

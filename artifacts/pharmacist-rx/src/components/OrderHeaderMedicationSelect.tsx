import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { getGetConsultationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { RX } from "@/lib/orderTheme";
import {
  findSelectedCatalogId,
  getPrescribableOptions,
  getPrimaryRxItem,
  optionToRxItems,
  type PrescribableOption,
} from "@/lib/prescribableCatalog";

function optionTitle(option: PrescribableOption): string {
  const qty =
    option.quantity && option.quantity !== "1"
      ? ` · Qty ${option.quantity}`
      : "";
  return `${option.name} ${option.strength}${qty}`;
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
  const current = useMemo(
    () => getPrimaryRxItem(consultation),
    [consultation],
  );
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSelectedId(findSelectedCatalogId(options, current));
  }, [consultation.id, options, current]);

  const selected = options.find((o) => o.catalogId === selectedId) ?? options[0];

  const saveOption = async (
    option: PrescribableOption,
    previous: PrescribableOption,
  ) => {
    const fromLabel = optionTitle(previous);
    const toLabel = optionTitle(option);
    setSaving(true);
    try {
      await apiFetch(
        `/api/consultations/${consultation.id}/prescription-items`,
        {
          method: "PATCH",
          body: JSON.stringify({
            prescriptionItems: optionToRxItems(option),
          }),
        },
      );
      await queryClient.invalidateQueries({
        queryKey: getGetConsultationQueryKey(consultation.id),
      });
      onMedicationChanged?.({ fromLabel, toLabel });
      toast({ title: "Prescribed medication updated" });
    } catch (err) {
      toast({
        title: "Could not update medication",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
      setSelectedId(findSelectedCatalogId(options, current));
    } finally {
      setSaving(false);
    }
  };

  const pickOption = (option: PrescribableOption) => {
    if (option.catalogId === selectedId) {
      setOpen(false);
      return;
    }
    const previous = selected;
    setSelectedId(option.catalogId);
    setOpen(false);
    void saveOption(option, previous);
  };

  if (!options.length || !selected) return null;

  return (
    <div className="mt-2.5 max-w-2xl">
      <p className={RX.pickerLabel}>Prescribed medication</p>

      <Popover open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={saving}
            aria-haspopup="listbox"
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
                {optionTitle(selected)}
              </span>
              <span className="mt-0.5 block truncate text-xs font-medium text-primary">
                {selected.priceLabel}
              </span>
            </span>
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
            "w-(--radix-popover-trigger-width) p-0",
            RX.pickerMenu,
          )}
        >
          <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Select product & price
          </p>
          <ul
            role="listbox"
            aria-label="Prescribed medication"
            className="max-h-64 overflow-y-auto px-1 pb-1"
          >
            {options.map((option) => {
              const isSelected = option.catalogId === selectedId;
              return (
                <li key={option.catalogId} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => pickOption(option)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      isSelected ? RX.pickerOptionSelected : RX.pickerOptionIdle,
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-semibold leading-snug",
                          isSelected ? "text-primary-foreground" : "text-foreground",
                        )}
                      >
                        {optionTitle(option)}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 block text-xs tabular-nums",
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-primary",
                        )}
                      >
                        {option.priceLabel}
                      </span>
                    </span>
                    {isSelected ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>

      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {selected.form} · {selected.sig}
      </p>
    </div>
  );
}

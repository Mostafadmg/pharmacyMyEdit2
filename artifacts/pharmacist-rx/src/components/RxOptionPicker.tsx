import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RX } from "@/lib/orderTheme";

export type RxOption<T extends string = string> = {
  value: T;
  label: string;
  /** Optional second line (e.g. price) */
  hint?: string;
};

export function RxOptionPicker<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  menuLabel,
  disabled = false,
  className,
  allowEmpty = false,
  emptyValue = "" as T,
}: {
  value: T;
  onChange: (value: T) => void;
  options: RxOption<T>[];
  placeholder: string;
  menuLabel?: string;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyValue?: T;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const showPlaceholder = allowEmpty && (value === emptyValue || !selected);

  const pick = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-[border-color,box-shadow]",
            RX.pickerTrigger,
            open && RX.pickerTriggerOpen,
            disabled && "pointer-events-none opacity-60",
            className,
          )}
        >
          <span className="min-w-0 flex-1">
            {showPlaceholder ? (
              <span className="block truncate text-sm font-medium text-muted-foreground">
                {placeholder}
              </span>
            ) : (
              <>
                <span className="block truncate text-sm font-semibold text-foreground">
                  {selected?.label}
                </span>
                {selected?.hint ? (
                  <span className="mt-0.5 block truncate text-xs font-medium text-primary">
                    {selected.hint}
                  </span>
                ) : null}
              </>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180 text-primary",
            )}
          />
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
        {menuLabel ? (
          <p className="px-2.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {menuLabel}
          </p>
        ) : null}
        <ul
          role="listbox"
          className="max-h-64 overflow-y-auto px-1 pb-1"
        >
          {allowEmpty ? (
            <li role="option" aria-selected={showPlaceholder}>
              <button
                type="button"
                onClick={() => pick(emptyValue)}
                className={cn(
                  "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  showPlaceholder
                    ? RX.pickerOptionSelected
                    : RX.pickerOptionIdle,
                  showPlaceholder && "text-primary-foreground",
                )}
              >
                {placeholder}
              </button>
            </li>
          ) : null}
          {options.map((option) => {
            const isSelected = option.value === value && !showPlaceholder;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  onClick={() => pick(option.value)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isSelected ? RX.pickerOptionSelected : RX.pickerOptionIdle,
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-semibold leading-snug",
                        isSelected
                          ? "text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {option.label}
                    </span>
                    {option.hint ? (
                      <span
                        className={cn(
                          "mt-0.5 block text-xs tabular-nums",
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-primary",
                        )}
                      >
                        {option.hint}
                      </span>
                    ) : null}
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
  );
}

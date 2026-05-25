import { useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  CalendarDropdown,
  clampDate,
  isoToDisplay,
  parseIsoDate,
  parseTypedDate,
  toIsoDate,
} from "@workspace/date-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max?: string;
  min?: string;
  hint?: string;
  error?: string;
  className?: string;
  placeholder?: string;
  /** Compact styling for modals / dense forms */
  compact?: boolean;
}

export function DateField({
  label,
  value,
  onChange,
  max,
  min,
  hint,
  error,
  className,
  placeholder = "DD/MM/YYYY",
  compact = false,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => isoToDisplay(value));
  const [focused, setFocused] = useState(false);

  const selected = useMemo(() => parseIsoDate(value), [value]);
  const minDate = useMemo(() => (min ? parseIsoDate(min) : undefined), [min]);
  const maxDate = useMemo(() => (max ? parseIsoDate(max) : undefined), [max]);

  const fromYear = minDate?.getFullYear() ?? 1920;
  const toYear = maxDate?.getFullYear() ?? new Date().getFullYear();

  const defaultViewMonth = useMemo(() => {
    if (selected) return selected;
    return new Date(toYear - 30, 0, 1);
  }, [selected, toYear]);

  const [viewMonth, setViewMonth] = useState<Date>(defaultViewMonth);

  useEffect(() => {
    if (!focused) setText(isoToDisplay(value));
  }, [value, focused]);

  useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [selected]);

  const commitText = (raw: string) => {
    if (!raw.trim()) {
      onChange("");
      setText("");
      return;
    }
    const parsed = parseTypedDate(raw);
    if (!parsed) return;
    const date = parseIsoDate(parsed);
    if (!date) return;
    const clamped = clampDate(date, minDate, maxDate);
    const iso = toIsoDate(clamped);
    onChange(iso);
    setText(isoToDisplay(iso));
    setViewMonth(clamped);
  };

  const pickDate = (date: Date) => {
    const clamped = clampDate(date, minDate, maxDate);
    const iso = toIsoDate(clamped);
    onChange(iso);
    setText(isoToDisplay(iso));
    setViewMonth(clamped);
    setOpen(false);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-[11px] uppercase tracking-wider text-muted-foreground" : "text-sm",
          )}
        >
          {label}
        </span>
      ) : null}

      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          value={text}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commitText(text);
          }}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            const parsed = parseTypedDate(next);
            if (parsed) {
              const date = parseIsoDate(parsed);
              if (date) onChange(toIsoDate(clampDate(date, minDate, maxDate)));
            } else if (!next.trim()) {
              onChange("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitText(text);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={cn(
            "rounded-xl border bg-card pr-11 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-emerald-500/30",
            compact ? "h-10 text-sm" : "h-12 text-base",
            error
              ? "border-rx-decline-border focus-visible:ring-rose-300/30"
              : "border-border focus-visible:border-emerald-400",
          )}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open calendar"
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 rounded-lg text-emerald-800 hover:bg-rx-approve-surface",
                compact ? "h-8 w-8" : "h-9 w-9",
              )}
            >
              <CalendarIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-2xl border border-slate-200 bg-card p-0 shadow-xl"
            align="start"
            sideOffset={6}
          >
            <CalendarDropdown
              selected={selected}
              onSelect={pickDate}
              min={minDate}
              max={maxDate}
              month={viewMonth}
              onMonthChange={setViewMonth}
              fromYear={fromYear}
              toYear={toYear}
            />

            <div className="flex justify-end border-t border-slate-100 px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-semibold text-muted-foreground hover:text-rose-600"
                onClick={() => {
                  onChange("");
                  setText("");
                  setOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

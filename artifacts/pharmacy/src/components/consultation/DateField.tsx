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

    const midYear = Math.floor((fromYear + toYear) / 2);

    return new Date(midYear, 0, 1);

  }, [selected, fromYear, toYear]);



  const [viewMonth, setViewMonth] = useState<Date>(defaultViewMonth);



  useEffect(() => {

    if (!focused) {

      setText(isoToDisplay(value));

    }

  }, [value, focused]);



  useEffect(() => {

    if (selected) {

      setViewMonth(selected);

    }

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

    <div className={cn("flex flex-col gap-2", className)}>

      <span className="text-sm font-semibold text-secondary">{label}</span>



      <div className="relative">

        <Input

          type="text"

          inputMode="numeric"

          autoComplete="bday"

          data-testid="input-dob"

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

              if (date) {

                const clamped = clampDate(date, minDate, maxDate);

                onChange(toIsoDate(clamped));

              }

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

            "h-14 rounded-xl border bg-white pr-14 text-base shadow-sm transition-all placeholder:text-muted-foreground focus-visible:ring-4 focus-visible:ring-emerald-500/15",

            error

              ? "border-destructive focus-visible:border-destructive"

              : open

                ? "border-emerald-600"

                : "border-border focus-visible:border-emerald-600",

          )}

        />



        <Popover open={open} onOpenChange={setOpen}>

          <PopoverTrigger asChild>

            <Button

              type="button"

              variant="ghost"

              size="icon"

              aria-label="Open calendar"

              className="absolute right-2 top-1/2 h-10 w-10 -translate-y-1/2 rounded-lg text-emerald-800 hover:bg-emerald-50"

            >

              <CalendarIcon className="h-5 w-5" />

            </Button>

          </PopoverTrigger>

          <PopoverContent

            className="w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"

            align="end"

            sideOffset={8}

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



            <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5">
              <p className="text-[11px] text-slate-500">
                Type <span className="font-semibold text-slate-700">DD/MM/YYYY</span> or pick a day
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive"
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

        <p className="text-xs font-medium text-destructive">{error}</p>

      ) : hint ? (

        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>

      ) : null}

    </div>

  );

}



export default DateField;



import { useId } from "react";
import { cn } from "@/lib/utils";

interface UnitOption {
  value: string;
  label: string;
}

interface NumberFieldProps {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  unit?: string;
  unitOptions?: UnitOption[];
  unitValue?: string;
  onUnitChange?: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  hint?: string;
  error?: string;
  className?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  unitOptions,
  unitValue,
  onUnitChange,
  min,
  max,
  placeholder,
  hint,
  error,
  className,
}: NumberFieldProps) {
  const id = useId();
  const handle = (raw: string) => {
    if (raw === "") {
      onChange("");
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(n);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {unitOptions && unitOptions.length > 0 && (
        <div
          role="tablist"
          className="inline-flex w-fit rounded-full border border-border bg-muted p-1"
        >
          {unitOptions.map((opt) => {
            const active = unitValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onUnitChange?.(opt.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => handle(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          aria-invalid={!!error}
          className={cn(
            "h-12 w-full rounded-2xl border bg-card px-4 text-base text-foreground transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            error ? "border-destructive" : "border-border",
            unit && "pr-16",
          )}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default NumberField;

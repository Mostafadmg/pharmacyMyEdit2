import { CheckboxRow } from "./CheckboxRow";
import { cn } from "@/lib/utils";

export interface CheckboxOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface CheckboxGridProps {
  options: CheckboxOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  noneValue?: string;
  className?: string;
}

export function CheckboxGrid({
  options,
  selected,
  onChange,
  noneValue = "none",
  className,
}: CheckboxGridProps) {
  const toggle = (value: string) => {
    const isNone = value === noneValue;
    const has = selected.includes(value);

    if (isNone) {
      onChange(has ? [] : [noneValue]);
      return;
    }

    const without = selected.filter((v) => v !== value && v !== noneValue);
    onChange(has ? without : [...without, value]);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {options.map((opt) => (
        <CheckboxRow
          key={opt.value}
          checked={selected.includes(opt.value)}
          onToggle={() => toggle(opt.value)}
          title={opt.label}
          subtitle={opt.subtitle}
        />
      ))}
    </div>
  );
}

export default CheckboxGrid;

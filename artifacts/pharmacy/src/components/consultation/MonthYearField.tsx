import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function parseMonthYearValue(
  value: string,
): { year: number; month: number } | null {
  const trimmed = value.trim();
  const monthYear = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (monthYear) {
    const year = Number(monthYear[1]);
    const month = Number(monthYear[2]);
    if (month >= 1 && month <= 12) return { year, month };
    return null;
  }
  const fullDate = /^(\d{4})-(\d{2})-\d{2}$/.exec(trimmed);
  if (fullDate) {
    const year = Number(fullDate[1]);
    const month = Number(fullDate[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  return null;
}

export function toMonthYearValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatMonthYearDisplay(value: string): string {
  const parsed = parseMonthYearValue(value);
  if (!parsed) return value.trim() || "—";
  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
}

type MonthYearFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  testIdPrefix?: string;
  className?: string;
};

export function MonthYearField({
  label,
  value,
  onChange,
  minYear = 1980,
  maxYear = new Date().getFullYear(),
  testIdPrefix = "month-year",
  className,
}: MonthYearFieldProps) {
  const parsed = parseMonthYearValue(value);
  const selectedMonth = parsed ? String(parsed.month) : "";
  const selectedYear = parsed ? String(parsed.year) : "";

  const years = useMemo(
    () =>
      Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => maxYear - i,
      ),
    [minYear, maxYear],
  );

  const selectClass =
    "h-12 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-foreground shadow-sm focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15";

  const commit = (month: string, year: string) => {
    if (!month || !year) {
      onChange("");
      return;
    }
    onChange(toMonthYearValue(Number(year), Number(month)));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label className="font-semibold text-secondary">{label}</Label>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <select
          aria-label="Month"
          value={selectedMonth}
          data-testid={`${testIdPrefix}-month`}
          className={selectClass}
          onChange={(e) => commit(e.target.value, selectedYear)}
        >
          <option value="">Month</option>
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={String(index + 1)}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          value={selectedYear}
          data-testid={`${testIdPrefix}-year`}
          className={selectClass}
          onChange={(e) => commit(selectedMonth, e.target.value)}
        >
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

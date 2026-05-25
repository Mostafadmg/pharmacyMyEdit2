import { useMemo } from "react";
import "./calendar.css";
import { isSameDay, startOfDay } from "./dateUtils";

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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export type CalendarDropdownProps = {
  selected?: Date;
  onSelect: (date: Date) => void;
  min?: Date;
  max?: Date;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  className?: string;
  fromYear?: number;
  toYear?: number;
};

function isDisabled(date: Date, min?: Date, max?: Date): boolean {
  const d = startOfDay(date);
  if (min && d < startOfDay(min)) return true;
  if (max && d > startOfDay(max)) return true;
  return false;
}

export function CalendarDropdown({
  selected,
  onSelect,
  min,
  max,
  month: controlledMonth,
  onMonthChange,
  className,
  fromYear,
  toYear,
}: CalendarDropdownProps) {
  const today = useMemo(() => startOfDay(new Date()), []);

  const viewMonth =
    controlledMonth ??
    (selected
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewMonth.getFullYear();
  const monthIndex = viewMonth.getMonth();
  const monthLabel = `${MONTH_NAMES[monthIndex]} ${year}`;

  const showYearJump =
    fromYear != null && toYear != null && toYear - fromYear > 24;

  const years = useMemo(() => {
    if (!showYearJump || fromYear == null || toYear == null) return [];
    return Array.from({ length: toYear - fromYear + 1 }, (_, i) => toYear - i);
  }, [showYearJump, fromYear, toYear]);

  const setViewMonth = (next: Date) => {
    onMonthChange?.(next);
  };

  const cells = useMemo(() => {
    const first = new Date(year, monthIndex, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const result: Array<{ key: string; day: number | null; date?: Date }> = [];

    for (let i = 0; i < startOffset; i++) {
      result.push({ key: `empty-${i}`, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({
        key: `day-${d}`,
        day: d,
        date: new Date(year, monthIndex, d),
      });
    }
    return result;
  }, [year, monthIndex]);

  const goMonth = (delta: number) => {
    setViewMonth(new Date(year, monthIndex + delta, 1));
  };

  const rootClass = ["calendar-dropdown", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div className="calendar-header">
        <button
          type="button"
          className="nav-btn"
          aria-label="Previous month"
          onClick={() => goMonth(-1)}
        >
          &lt;
        </button>

        {showYearJump ? (
          <div className="month-year-selects">
            <select
              className="month-year-select"
              aria-label="Month"
              value={monthIndex}
              onChange={(e) =>
                setViewMonth(new Date(year, Number(e.target.value), 1))
              }
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="month-year-select"
              aria-label="Year"
              value={year}
              onChange={(e) =>
                setViewMonth(new Date(Number(e.target.value), monthIndex, 1))
              }
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="month-year-display">{monthLabel}</div>
        )}

        <button
          type="button"
          className="nav-btn"
          aria-label="Next month"
          onClick={() => goMonth(1)}
        >
          &gt;
        </button>
      </div>

      <div className="weekdays">
        {WEEKDAYS.map((label) => (
          <div key={label} className="weekday">
            {label}
          </div>
        ))}
      </div>

      <div className="days-grid">
        {cells.map((cell) => {
          if (cell.day == null || !cell.date) {
            return <div key={cell.key} className="day empty" aria-hidden />;
          }

          const disabled = isDisabled(cell.date, min, max);
          const isToday = isSameDay(cell.date, today);
          const isSelected = selected && isSameDay(cell.date, selected);

          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(cell.date!)}
              className={[
                "day",
                isToday ? "today" : "",
                isSelected ? "selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

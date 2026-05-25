import { cn } from "@/lib/utils";

export type ClinicalQaRowData = {
  question: string;
  value: string;
};

export type ClinicalQaGroupData = {
  rows: ClinicalQaRowData[];
};

export type ClinicalQaBundleData = {
  title: string;
  groups: ClinicalQaGroupData[];
};

function AnswerValue({ value }: { value: string }) {
  const lower = value.trim().toLowerCase();
  const isYes = lower === "yes";
  const isNo = lower === "no";

  if (!isYes && !isNo) {
    return (
      <span className="max-w-[20rem] text-right text-[15px] font-semibold leading-snug text-foreground wrap-anywhere">
        {value || "—"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-bold leading-none whitespace-nowrap",
        isYes
          ? "border-primary/25 bg-primary/8 text-primary"
          : "border-rx-decline-border bg-rx-decline-surface text-rx-decline",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isYes ? "bg-primary" : "bg-rx-decline-surface0",
        )}
      />
      {isYes ? "YES" : "NO"}
    </span>
  );
}

export function ClinicalQaRow({
  question,
  value,
  isLast = false,
}: ClinicalQaRowData & { isLast?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-stretch justify-between gap-5 bg-card",
        !isLast && "border-b border-border/80",
      )}
    >
      <div className="min-w-0 flex-1 px-5 py-4">
        <p className="text-[15px] font-medium leading-relaxed text-foreground wrap-anywhere">
          {question}
        </p>
      </div>
      <div className="flex shrink-0 items-center border-l border-border/60 px-5 py-4">
        <AnswerValue value={value} />
      </div>
    </div>
  );
}

export function ClinicalQaGroup({
  rows,
  isLastGroup = false,
}: ClinicalQaGroupData & { isLastGroup?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <>
      {rows.map((row, i) => (
        <ClinicalQaRow
          key={`${row.question}-${i}`}
          {...row}
          isLast={isLastGroup && i === rows.length - 1}
        />
      ))}
    </>
  );
}

export function ClinicalQaBundle({
  title,
  groups,
  showTitle = true,
}: ClinicalQaBundleData & { showTitle?: boolean }) {
  const nonEmpty = groups.filter((g) => g.rows.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="space-y-3">
      {showTitle ? (
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-secondary">
          {title}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border border-l-4 border-l-secondary bg-card shadow-sm">
        {nonEmpty.map((group, groupIndex) => (
          <div
            key={`${title}-group-${groupIndex}`}
            className={cn(groupIndex > 0 && "border-t border-border")}
          >
            <ClinicalQaGroup
              rows={group.rows}
              isLastGroup={groupIndex === nonEmpty.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClinicalQaList({
  rows,
  title,
}: {
  rows: ClinicalQaRowData[];
  title?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      {title ? (
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-secondary">
          {title}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border border-l-4 border-l-secondary bg-card shadow-sm">
        {rows.map((row, i) => (
          <ClinicalQaRow
            key={`${row.question}-${i}`}
            {...row}
            isLast={i === rows.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

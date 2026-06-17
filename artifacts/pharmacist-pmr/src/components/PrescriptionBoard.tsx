import { useMemo, useState, useEffect } from "react";
import { Check, Eye, EyeOff, Inbox, ClipboardList, Tag, Package, PauseCircle, MoreHorizontal, RefreshCw } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { usePatientsContext } from "@/context/PatientsContext";
import {
  BOARD_COLUMNS,
  BOARD_COLUMN_LABELS,
  BOARD_COLUMN_BORDER,
  BOARD_COLUMN_ICON,
  isToday,
  statusToBoardColumn,
  type BoardColumn,
} from "@/lib/pmrStatus";
import {
  EmptyBoardSlot,
  PrescriptionBoardCard,
} from "@/components/PrescriptionBoardCard";
import { PrescriptionBoardDrawer } from "@/components/PrescriptionBoardDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ColumnTimeFilter = "all" | "waiting" | "today";

const TIME_FILTER_OPTIONS: { id: ColumnTimeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting" },
  { id: "today", label: "Today" },
];

const COLUMN_SUBLABEL: Partial<Record<BoardColumn, string>> = {
  inbox: "Unallocated",
};

const TIME_FILTER_COLUMNS = new Set<BoardColumn>(["pick", "label"]);

const COL_CLASS =
  "flex min-h-0 w-[220px] shrink-0 snap-start flex-col sm:w-[240px] xl:min-w-[200px] xl:flex-1";

function filterByTime(items: Consultation[], filter: ColumnTimeFilter) {
  if (filter === "all") return items;
  if (filter === "waiting") return items.filter((c) => !isToday(c.reviewedAt));
  return items.filter((c) => isToday(c.reviewedAt));
}

const COLUMN_ICONS: Record<BoardColumn, typeof Inbox> = {
  inbox: Inbox,
  parked: PauseCircle,
  pick: ClipboardList,
  label: Tag,
  pack: Package,
  completed: Check,
};

function ColumnHeader({
  column,
  count,
  hidden,
  timeFilter,
  onTimeFilterChange,
  onToggleVisibility,
}: {
  column: BoardColumn;
  count: number;
  hidden: boolean;
  timeFilter: ColumnTimeFilter;
  onTimeFilterChange: (filter: ColumnTimeFilter) => void;
  onToggleVisibility: () => void;
}) {
  const staticSub = COLUMN_SUBLABEL[column];
  const timeFilterSub = TIME_FILTER_COLUMNS.has(column)
    ? TIME_FILTER_OPTIONS.find((o) => o.id === timeFilter)?.label
    : undefined;
  const sub = staticSub ?? timeFilterSub;
  const ColIcon = COLUMN_ICONS[column];
  const borderAccent = BOARD_COLUMN_BORDER[column];
  const iconAccent = BOARD_COLUMN_ICON[column];

  return (
    <div
      className={cn(
        "pmr-board-column-header border-l-[3px] shrink-0 h-[52px] px-3 py-2 flex flex-col justify-between",
        borderAccent,
        hidden && "opacity-60",
      )}
      data-testid={`board-column-header-${column}`}
    >
      <div className="flex items-center gap-2 min-w-0 h-5">
        <ColIcon className={cn("h-3.5 w-3.5 shrink-0", iconAccent)} />
        <h3 className="flex-1 min-w-0 text-[13px] font-bold text-primary truncate dark:text-[#9ec5ff]">
          {BOARD_COLUMN_LABELS[column]}
        </h3>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted/80 px-1.5 text-[10px] font-bold text-muted-foreground tabular-nums dark:bg-white/10 dark:text-white/60">
          {count}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground shrink-0 rounded-md hover:bg-muted/50 transition-colors dark:text-white/35 dark:hover:text-white/70"
              aria-label={`${BOARD_COLUMN_LABELS[column]} options`}
              data-testid={`board-column-menu-${column}`}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[9rem]">
            {TIME_FILTER_COLUMNS.has(column) && (
              <>
                <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Show
                </p>
                {TIME_FILTER_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onSelect={() => onTimeFilterChange(option.id)}
                    className="text-xs justify-between gap-3"
                  >
                    {option.label}
                    {timeFilter === option.id && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={onToggleVisibility} className="text-xs">
              {hidden ? "Show column" : "Hide column"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={onToggleVisibility}
          className={cn(
            "p-1 shrink-0 rounded-md transition-colors hover:bg-muted/50",
            hidden
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground dark:text-white/35 dark:hover:text-white/70",
          )}
          aria-label={
            hidden
              ? `Show ${BOARD_COLUMN_LABELS[column]} cards`
              : `Hide ${BOARD_COLUMN_LABELS[column]} cards`
          }
          aria-pressed={hidden}
          data-testid={`board-column-eye-${column}`}
        >
          {hidden ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <p className="h-[15px] leading-[15px] text-[10px] text-muted-foreground font-normal truncate dark:text-white/45">
        {sub ? (
          <>
            {sub}
            {hidden && count > 0 && (
              <span className="text-muted-foreground/70"> · {count} hidden</span>
            )}
          </>
        ) : (
          "\u00a0"
        )}
      </p>
    </div>
  );
}

function ColumnHiddenPlaceholder({
  count,
  columnLabel,
  onShow,
}: {
  count: number;
  columnLabel: string;
  onShow: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onShow}
      className="w-full rounded-xl border-2 border-dashed border-border bg-transparent px-3 py-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/20 dark:border-white/25 dark:hover:border-white/40"
      data-testid="board-column-hidden-placeholder"
    >
      {count > 0 ? (
        <>
          <p className="text-[12px] font-semibold text-foreground">
            {count} prescription{count === 1 ? "" : "s"} hidden
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {columnLabel} column · click to show
          </p>
        </>
      ) : (
        <>
          <p className="text-[12px] font-medium text-muted-foreground">
            {columnLabel} hidden
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Click to show
          </p>
        </>
      )}
    </button>
  );
}

function BoardColumnBody({
  column,
  items,
  selectedId,
  timeFilter,
  onOpenCard,
  hidden,
  onShow,
}: {
  column: BoardColumn;
  items: Consultation[];
  selectedId: string | null;
  timeFilter: ColumnTimeFilter;
  onOpenCard: (id: string) => void;
  hidden: boolean;
  onShow: () => void;
}) {
  const isInbox = column === "inbox";
  const isParked = column === "parked";
  const usesTimeFilter = TIME_FILTER_COLUMNS.has(column);
  const visibleItems = usesTimeFilter ? filterByTime(items, timeFilter) : items;

  const cardProps = (c: Consultation) => ({
    consultation: c,
    column,
    variant: "full" as const,
    selected: selectedId === c.id,
    onOpen: () => onOpenCard(c.id),
  });

  if (hidden) {
    return (
      <div
        className="flex flex-col min-w-0 flex-1 min-h-0 overflow-y-auto pt-1.5 pb-4"
        data-testid={`board-column-${column}`}
        data-column-hidden="true"
      >
        <ColumnHiddenPlaceholder
          count={items.length}
          columnLabel={BOARD_COLUMN_LABELS[column]}
          onShow={onShow}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-w-0 flex-1 min-h-0 overflow-y-auto pt-1.5 pb-4"
      data-testid={`board-column-${column}`}
    >
      <div className="space-y-1.5">
        {isInbox && (
          <>
            {visibleItems.length === 0 ? (
              <>
                <EmptyBoardSlot />
                <EmptyBoardSlot />
              </>
            ) : (
              visibleItems.map((c) => (
                <PrescriptionBoardCard key={c.id} {...cardProps(c)} />
              ))
            )}
          </>
        )}

        {isParked && (
          <>
            {visibleItems.length === 0 ? (
              <>
                <EmptyBoardSlot />
                <EmptyBoardSlot />
                <EmptyBoardSlot />
              </>
            ) : (
              visibleItems.map((c) => (
                <PrescriptionBoardCard key={c.id} {...cardProps(c)} />
              ))
            )}
          </>
        )}

        {!isInbox && !isParked && (
          <>
            {visibleItems.length === 0 ? (
              <EmptyBoardSlot />
            ) : (
              visibleItems.map((c) => (
                <PrescriptionBoardCard key={c.id} {...cardProps(c)} />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function PrescriptionBoard() {
  const { approved, approvedLoading, getStatus, refreshApproved } =
    usePatientsContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Record<BoardColumn, boolean>>({
    inbox: false,
    parked: false,
    pick: false,
    label: false,
    pack: false,
    completed: false,
  });
  const [columnTimeFilters, setColumnTimeFilters] = useState<
    Record<BoardColumn, ColumnTimeFilter>
  >({
    inbox: "all",
    parked: "all",
    pick: "all",
    label: "all",
    pack: "all",
    completed: "all",
  });

  function toggleColumnVisibility(column: BoardColumn) {
    setHiddenColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  }

  function showColumn(column: BoardColumn) {
    setHiddenColumns((prev) => ({ ...prev, [column]: false }));
  }

  const selectedConsultation = useMemo(
    () => approved.find((c) => c.id === selectedId) ?? null,
    [approved, selectedId],
  );

  const selectedStatus = selectedConsultation
    ? getStatus(selectedConsultation)
    : null;

  const byColumn = useMemo(() => {
    const map: Record<BoardColumn, Consultation[]> = {
      inbox: [],
      parked: [],
      pick: [],
      label: [],
      pack: [],
      completed: [],
    };
    for (const c of approved) {
      const col = statusToBoardColumn(getStatus(c));
      if (col) map[col].push(c);
    }
    for (const col of BOARD_COLUMNS) {
      map[col].sort((a, b) => {
        const ta = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
        const tb = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
        return tb - ta;
      });
    }
    return map;
  }, [approved, getStatus]);

  const total = BOARD_COLUMNS.reduce((n, col) => n + byColumn[col].length, 0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const selectId = new URLSearchParams(window.location.search).get("select");
    if (!selectId || approvedLoading) return;
    const found = approved.find((c) => c.id === selectId);
    if (found) {
      setSelectedId(selectId);
      const url = new URL(window.location.href);
      url.searchParams.delete("select");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [approved, approvedLoading]);

  return (
    <>
      <div className="pmr-board flex h-full min-h-0 flex-col text-foreground px-5 md:px-8 py-4">
        <div className="flex shrink-0 items-center justify-end gap-3 mb-4">
          <span className="text-[11px] text-muted-foreground mr-auto">
            {total} prescription{total === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => refreshApproved()}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {approvedLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading prescriptions…
          </p>
        ) : total === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground max-w-md mx-auto">
            Board is empty. Approve a consultation in the Rx portal to see it here.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-4">
            {BOARD_COLUMNS.map((col) => (
              <div key={col} className={COL_CLASS}>
                <ColumnHeader
                  column={col}
                  count={byColumn[col].length}
                  hidden={hiddenColumns[col]}
                  timeFilter={columnTimeFilters[col]}
                  onTimeFilterChange={(filter) =>
                    setColumnTimeFilters((prev) => ({ ...prev, [col]: filter }))
                  }
                  onToggleVisibility={() => toggleColumnVisibility(col)}
                />
                <BoardColumnBody
                  column={col}
                  items={byColumn[col]}
                  selectedId={selectedId}
                  timeFilter={columnTimeFilters[col]}
                  onOpenCard={setSelectedId}
                  hidden={hiddenColumns[col]}
                  onShow={() => showColumn(col)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <PrescriptionBoardDrawer
        consultation={selectedConsultation}
        status={selectedStatus}
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

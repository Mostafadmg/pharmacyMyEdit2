import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import {
  buildConsultationQaRows,
  type ConsultationQaRow,
} from "@/lib/consultationAnswersDisplay";
import { cn } from "@/lib/utils";

type ConsultationDetail = {
  id: string;
  conditionId?: string;
  conditionName?: string;
  answers?: Record<string, unknown>;
};

function AnswerValue({ value }: { value: string }) {
  const lower = value.trim().toLowerCase();
  const isYes = lower === "yes";
  const isNo = lower === "no";

  if (!isYes && !isNo) {
    return (
      <span className="max-w-[55%] text-right text-sm font-semibold leading-snug text-foreground break-words">
        {value}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wide",
        isYes
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-destructive/20 bg-destructive/5 text-destructive",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isYes ? "bg-primary" : "bg-destructive/60",
        )}
      />
      {isYes ? "Yes" : "No"}
    </span>
  );
}

function QaList({ rows }: { rows: ConsultationQaRow[] }) {
  return (
    <dl className="divide-y divide-border/60 rounded-xl border border-border/50 bg-muted/15">
      {rows.map((row, i) => (
        <div
          key={`${row.question}-${i}`}
          className="flex items-baseline justify-between gap-4 px-4 py-3.5"
        >
          <dt className="flex-1 text-sm text-muted-foreground leading-relaxed">
            {row.question}
          </dt>
          <dd className="shrink-0">
            <AnswerValue value={row.answer} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ConsultationAnswersModal({
  consultationId,
  conditionName,
  conditionId: initialConditionId,
  initialAnswers,
  open,
  onOpenChange,
}: {
  consultationId: string;
  conditionName: string;
  conditionId?: string | null;
  initialAnswers?: Record<string, unknown> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConsultationDetail | null>(null);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    const cachedAnswers =
      initialAnswers && Object.keys(initialAnswers).length > 0
        ? initialAnswers
        : null;

    if (cachedAnswers) {
      setDetail({
        id: consultationId,
        conditionId: initialConditionId ?? undefined,
        conditionName,
        answers: cachedAnswers,
      });
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void apiFetch<ConsultationDetail>(
      `/api/consultations/${encodeURIComponent(consultationId)}`,
      { auth: "patient" },
    )
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load your consultation answers.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    consultationId,
    conditionName,
    initialConditionId,
    initialAnswers,
  ]);

  const rows = useMemo(
    () =>
      buildConsultationQaRows(
        detail?.answers,
        detail?.conditionId ?? initialConditionId,
      ),
    [detail, initialConditionId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(88vh,40rem)] w-[min(96vw,36rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-primary/5 px-5 py-4">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-extrabold text-secondary">
                Your consultation answers
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                {conditionName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading your answers…
            </p>
          ) : error ? (
            <p className="py-6 text-sm text-destructive">{error}</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No questionnaire answers were recorded for this consultation.
            </p>
          ) : (
            <QaList rows={rows} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

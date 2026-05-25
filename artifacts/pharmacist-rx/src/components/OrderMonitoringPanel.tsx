import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  Pill,
  Scale,
  TrendingDown,
} from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { useListConsultations } from "@workspace/api-client-react";
import { RxOptionPicker } from "@/components/RxOptionPicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  buildMeasurementLog,
  overallWeightLossPct,
  type MeasurementLogEntry,
} from "@/lib/measurementHistory";
import {
  ADHERENCE_OPTIONS,
  hasMonitoringLog,
  readOrderMonitoringLog,
  SIDE_EFFECTS_OPTIONS,
  writeOrderMonitoringLog,
  type OrderMonitoringLog,
} from "@/lib/orderMonitoringLog";
import {
  hasRepeatSafetyResponses,
  repeatSafetyFromAnswers,
} from "@/lib/repeatSafetyAnswers";
import { evaluateWeightChangeMonitoring } from "@/lib/weightChangeMonitoring";

const CURRENT_PHARMACIST_NAME =
  (typeof localStorage !== "undefined" &&
    localStorage.getItem("pharmacist_name")) ||
  "Pharmacist";

const MONITORING_PANEL =
  "overflow-hidden rounded-2xl border border-border border-l-4 border-l-secondary bg-card shadow-sm";

function formatWeightChange(change: number | null, isBaseline: boolean): string {
  if (isBaseline) return "Starting weight";
  if (change == null) return "—";
  if (change === 0) return "No change";
  const abs = Math.abs(change).toFixed(1);
  return change < 0 ? `↓ ${abs} kg` : `↑ ${abs} kg`;
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        highlight
          ? "border-primary/30 bg-primary text-primary-foreground"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "rx-label-caps mb-2",
          highlight ? "text-primary-foreground/75" : undefined,
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-3xl",
          !highlight && "text-foreground",
        )}
      >
        {value}
      </div>
      {sub ? (
        <div
          className={cn(
            "mt-2 text-xs leading-relaxed",
            highlight ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function OrderMonitoringLogForm({
  entry,
  showPatientRepeatSafety,
  repeatSafetySummary,
  onSaved,
}: {
  entry: MeasurementLogEntry;
  showPatientRepeatSafety: boolean;
  repeatSafetySummary: string | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<OrderMonitoringLog>(() =>
    readOrderMonitoringLog(entry.id),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(readOrderMonitoringLog(entry.id));
  }, [entry.id]);

  const save = () => {
    setSaving(true);
    const next: OrderMonitoringLog = {
      ...draft,
      updatedAt: new Date().toISOString(),
      updatedBy: CURRENT_PHARMACIST_NAME,
    };
    writeOrderMonitoringLog(entry.id, next);
    setDraft(next);
    setSaving(false);
    onSaved();
    toast({ title: `Monitoring log saved for order #${entry.orderIndex}` });
  };

  return (
    <div className="border-t border-border bg-muted/20">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
        <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Clinical monitoring log
          </h5>
          <p className="text-xs text-muted-foreground">
            Side effects, adherence, and notes for this order
          </p>
        </div>
      </div>

      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">
        {showPatientRepeatSafety && repeatSafetySummary ? (
          <div className="rounded-xl border border-border border-l-4 border-l-secondary bg-card px-4 py-3 text-sm leading-relaxed shadow-sm">
            <p className="rx-label-caps mb-1.5">Patient questionnaire</p>
            <p className="text-muted-foreground">{repeatSafetySummary}</p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-foreground">
              Side effects level
            </span>
            <RxOptionPicker
              value={draft.sideEffectsLevel}
              onChange={(sideEffectsLevel) =>
                setDraft((d) => ({ ...d, sideEffectsLevel }))
              }
              options={SIDE_EFFECTS_OPTIONS}
              placeholder="Select level…"
              menuLabel="Side effects level"
              allowEmpty
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-medium text-foreground">
              Adherence
            </span>
            <RxOptionPicker
              value={draft.adherence}
              onChange={(adherence) => setDraft((d) => ({ ...d, adherence }))}
              options={ADHERENCE_OPTIONS}
              placeholder="Select…"
              menuLabel="Adherence"
              allowEmpty
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-medium text-foreground">
            Side effect details
          </span>
          <Textarea
            value={draft.sideEffectsNotes}
            onChange={(e) =>
              setDraft((d) => ({ ...d, sideEffectsNotes: e.target.value }))
            }
            placeholder="Nausea, injection site, GI symptoms, hospitalisation…"
            className="min-h-[5.5rem] rounded-xl border-border bg-card text-sm shadow-sm"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-medium text-foreground">
            Monitoring notes
          </span>
          <Textarea
            value={draft.clinicalNotes}
            onChange={(e) =>
              setDraft((d) => ({ ...d, clinicalNotes: e.target.value }))
            }
            placeholder="Weight trajectory, dose appropriateness, follow-up actions…"
            className="min-h-[6.5rem] rounded-xl border-border bg-card text-sm shadow-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3 sm:px-5">
        {draft.updatedAt ? (
          <p className="text-xs text-muted-foreground">
            Last saved by{" "}
            <span className="font-medium text-foreground">
              {draft.updatedBy ?? "Pharmacist"}
            </span>{" "}
            ·{" "}
            {new Date(draft.updatedAt).toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Not logged yet</p>
        )}
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={save}
          className="rounded-full px-5 shadow-sm"
        >
          Save monitoring log
        </Button>
      </div>
    </div>
  );
}

function OrderBadge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "current" | "logged";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone === "current" && "bg-primary/10 text-primary",
        tone === "logged" &&
          "border border-primary/20 bg-primary/5 text-primary normal-case tracking-normal",
        tone === "muted" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function OrderTimelineRow({
  entry,
  isLast,
  expanded,
  onToggle,
  showPatientRepeatSafety,
  repeatSafetySummary,
  logRevision,
  onSaved,
}: {
  entry: MeasurementLogEntry;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  showPatientRepeatSafety: boolean;
  repeatSafetySummary: string | null;
  logRevision: number;
  onSaved: () => void;
}) {
  const gained = entry.weightChangeKg != null && entry.weightChangeKg > 0;
  const lost =
    entry.weightChangeKg != null &&
    entry.weightChangeKg < 0 &&
    !entry.isBaseline;
  const savedLog = useMemo(
    () => readOrderMonitoringLog(entry.id),
    [entry.id, logRevision],
  );
  const logged = hasMonitoringLog(savedLog);

  return (
    <div className="relative pl-8 sm:pl-10">
      <div className="absolute left-[11px] top-0 flex h-full flex-col items-center sm:left-[13px]">
        <div
          className={cn(
            "z-10 mt-5 h-3 w-3 shrink-0 rounded-full border-2 border-card",
            entry.isBaseline
              ? "bg-muted-foreground"
              : entry.isCurrent
                ? "bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
                : gained
                  ? "bg-destructive"
                  : "bg-primary/60",
          )}
        />
        {!isLast ? (
          <div className="mt-1 w-0.5 flex-1 rounded-full bg-border" />
        ) : null}
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-2xl border transition-all",
          entry.isCurrent
            ? "border-primary/35 bg-card shadow-sm ring-1 ring-primary/10"
            : "border-border bg-card/90",
          expanded && "shadow-md",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex w-full items-stretch gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/25 sm:gap-4 sm:px-5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-sm font-semibold text-foreground">
                Order #{entry.orderIndex}
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.dateLabel}
              </span>
              {entry.isBaseline ? (
                <OrderBadge tone="muted">First order</OrderBadge>
              ) : null}
              {entry.isCurrent ? (
                <OrderBadge tone="current">Current</OrderBadge>
              ) : null}
              {logged ? (
                <OrderBadge tone="logged">
                  <ClipboardList className="h-3 w-3" />
                  Logged
                </OrderBadge>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-1 text-xs font-semibold text-primary">
                <Pill className="h-3.5 w-3.5 shrink-0 opacity-80" />
                {entry.medication} {entry.doseDisplay}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Scale className="h-3.5 w-3.5 shrink-0 opacity-70" />
                BMI {entry.bmi.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <div className="min-w-[5.5rem] rounded-xl border border-border bg-muted/50 px-3 py-2 text-right">
              <div className="text-lg font-bold leading-none tabular-nums text-foreground sm:text-xl">
                {entry.weightKg.toFixed(1)}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  kg
                </span>
              </div>
              <div
                className={cn(
                  "mt-1 text-[11px] font-semibold leading-tight",
                  entry.isBaseline
                    ? "text-muted-foreground"
                    : gained
                      ? "text-destructive"
                      : lost
                        ? "text-primary"
                        : "text-muted-foreground",
                )}
              >
                {formatWeightChange(entry.weightChangeKg, entry.isBaseline)}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </div>
        </button>

        {expanded ? (
          <OrderMonitoringLogForm
            entry={entry}
            showPatientRepeatSafety={showPatientRepeatSafety}
            repeatSafetySummary={repeatSafetySummary}
            onSaved={onSaved}
          />
        ) : null}
      </div>
    </div>
  );
}

export function OrderMonitoringPanel({
  consultation,
}: {
  consultation: Consultation;
}) {
  const { data } = useListConsultations({ limit: 100 });
  const log = useMemo(
    () => buildMeasurementLog(consultation, data?.consultations ?? []),
    [consultation, data?.consultations],
  );

  const current =
    log.find((e) => e.isCurrent) ?? log[log.length - 1] ?? null;
  const baseline = log[0] ?? null;
  const totalLost =
    baseline && current
      ? +(baseline.weightKg - current.weightKg).toFixed(1)
      : null;
  const pctLost = overallWeightLossPct(log);
  const answers = (consultation.answers ?? {}) as Record<string, unknown>;
  const repeatSafety = repeatSafetyFromAnswers(
    answers,
    consultation.previousConsultationId,
  );
  const weightAlert = useMemo(
    () =>
      evaluateWeightChangeMonitoring(consultation, data?.consultations ?? []),
    [consultation, data?.consultations],
  );

  const [expandedId, setExpandedId] = useState<string | null>(
    () => current?.id ?? null,
  );
  const [logRevision, setLogRevision] = useState(0);

  useEffect(() => {
    if (current?.id) setExpandedId(current.id);
  }, [current?.id]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const repeatSafetySummary = useMemo(() => {
    if (!repeatSafety.isRepeat || !hasRepeatSafetyResponses(repeatSafety)) {
      return null;
    }
    const parts: string[] = [];
    if (repeatSafety.changesSinceLast) {
      parts.push(`Changes: ${repeatSafety.changesSinceLast}`);
    }
    const scr = repeatSafety.screening;
    const scrParts = [
      scr.newMedicines ? `New meds: ${scr.newMedicines}` : null,
      scr.healthChanges ? `Health change: ${scr.healthChanges}` : null,
      scr.newSideEffects ? `New SE: ${scr.newSideEffects}` : null,
    ].filter(Boolean);
    if (scrParts.length) parts.push(scrParts.join(" · "));
    const se = repeatSafety.sideEffects;
    const seParts = [
      se.any ? `Any SE: ${se.any}` : null,
      se.hospitalisation ? `Hospital: ${se.hospitalisation}` : null,
      se.vomitingDiarrhoea ? `GI: ${se.vomitingDiarrhoea}` : null,
      se.injectionSite ? `Injection site: ${se.injectionSite}` : null,
    ].filter(Boolean);
    if (seParts.length) parts.push(seParts.join(" · "));
    if (repeatSafety.monitoring.highRiskMedsYes.length) {
      parts.push(`High-risk: ${repeatSafety.monitoring.highRiskMedsYes.join(", ")}`);
    }
    return parts.join(" — ") || null;
  }, [repeatSafety]);

  if (!current) {
    return (
      <p className={cn(MONITORING_PANEL, "p-4 text-sm text-muted-foreground")}>
        No height or weight recorded for this order yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {weightAlert && (
        <div
          role="alert"
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm shadow-sm",
            weightAlert.kind === "medication_switch"
              ? "border-violet-500/40 bg-violet-500/10 text-foreground"
              : weightAlert.pctChange != null && weightAlert.pctChange > 0
                ? "border-rx-decline-border bg-rx-decline-surface text-foreground"
                : "border-rx-cs-border bg-rx-cs-surface text-foreground",
          )}
        >
          <p className="flex items-center gap-2 rx-label-caps">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            Weight change monitoring
          </p>
          <p className="mt-1.5 font-semibold text-foreground">
            {weightAlert.headline}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {weightAlert.detail}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          highlight
          label="Current weight"
          value={
            <>
              {current.weightKg.toFixed(1)}{" "}
              <span className="text-lg font-normal opacity-80">kg</span>
            </>
          }
          sub={
            <>
              BMI {current.bmi.toFixed(1)} · {current.bmiBand}
            </>
          }
        />
        <StatCard
          label="Total lost"
          value={
            <>
              {totalLost != null && totalLost > 0 ? `−${totalLost}` : "—"}{" "}
              <span className="text-base font-normal text-muted-foreground">
                kg
              </span>
            </>
          }
          sub={
            pctLost != null && pctLost > 0 ? (
              <span className="inline-flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
                {pctLost}% since first order
              </span>
            ) : (
              "Since first order"
            )
          }
        />
        <StatCard
          label="Weight-loss order"
          value={`#${current.orderIndex}`}
          sub={`Order ${current.orderIndex} of ${log.length} · ${current.medication} ${current.doseDisplay}`}
        />
      </div>

      <section className={MONITORING_PANEL}>
        <div className="border-b border-border bg-muted/30 px-4 py-4 sm:px-5">
          <h4 className="font-serif text-lg font-semibold text-secondary">
            Order history & monitoring
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            One entry per order — expand any row to log side effects, adherence,
            and clinical notes.
          </p>
        </div>

        <div className="space-y-3 px-3 py-4 sm:px-4 sm:py-5">
          {log.map((entry, i) => (
            <OrderTimelineRow
              key={entry.id}
              entry={entry}
              isLast={i === log.length - 1}
              expanded={expandedId === entry.id}
              onToggle={() => toggleExpanded(entry.id)}
              showPatientRepeatSafety={
                entry.isCurrent &&
                repeatSafety.isRepeat &&
                Boolean(repeatSafetySummary)
              }
              repeatSafetySummary={repeatSafetySummary}
              logRevision={logRevision}
              onSaved={() => setLogRevision((n) => n + 1)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

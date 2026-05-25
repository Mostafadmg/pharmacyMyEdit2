import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { useListConsultations } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { evaluateWeightChangeMonitoring } from "@/lib/weightChangeMonitoring";
import { OrderHeaderMedicationSelect } from "@/components/OrderHeaderMedicationSelect";
import {
  bmiBandShort,
  bmiHighlightClass,
  formatEthnicityLabel,
  formatWeightAllUnits,
  getPatientJourneyType,
  JOURNEY_BADGE,
  resolveConsultationBmi,
  resolveConsultationWeightKg,
  statusPillForConsultation,
} from "@/lib/orderPatientUi";
import { getActiveWaitTags, WAIT_TAG_META } from "@/lib/orderWaitingTags";

function orderRefFromId(id: string, consultationNumber?: string | null): string {
  if (consultationNumber?.trim()) return consultationNumber.trim();
  return "#" + id.replace(/-/g, "").toUpperCase().slice(-5);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderPatientHeader({
  c,
  onMedicationChanged,
}: {
  c: Consultation;
  onMedicationChanged?: (payload: { fromLabel: string; toLabel: string }) => void;
}) {
  const { data: consultList } = useListConsultations({ limit: 200 });
  const weightAlert = useMemo(
    () =>
      evaluateWeightChangeMonitoring(c, consultList?.consultations ?? []),
    [c, consultList?.consultations],
  );

  const pill = statusPillForConsultation(c.status);
  const journeyMeta = JOURNEY_BADGE[getPatientJourneyType(c)];
  const headerBmi = resolveConsultationBmi(c);
  const headerWeightKg = resolveConsultationWeightKg(c);
  const headerEthnicity = formatEthnicityLabel(
    (c.answers as Record<string, unknown>)?.ethnicity,
  );
  const waitTags = useMemo(() => getActiveWaitTags(c), [c]);

  return (
    <>
      {weightAlert && (
        <div
          role="alert"
          className={cn(
            "mb-3 flex flex-col gap-2 rounded-2xl border px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between",
            weightAlert.kind === "gain_7"
              ? "border-rx-decline-border bg-rx-decline-surface ring-1 ring-rx-decline-border/60"
              : "border-rx-cs-border bg-rx-cs-surface ring-1 ring-rx-cs-border/60",
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                weightAlert.kind === "gain_7"
                  ? "bg-rose-600 text-white"
                  : "bg-amber-600 text-white",
              )}
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
                    weightAlert.kind === "gain_7" ? "bg-rose-700" : "bg-amber-700",
                  )}
                >
                  Complex patient
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Weight change monitoring
                </span>
              </div>
              <p
                className={cn(
                  "mt-1 text-sm font-bold",
                  weightAlert.kind === "gain_7"
                    ? "text-rx-decline"
                    : "text-rx-cs",
                )}
              >
                {weightAlert.headline}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {weightAlert.detail}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-right tabular-nums",
              weightAlert.kind === "gain_7"
                ? "border-rx-decline-border bg-card/80"
                : "border-rx-cs-border bg-card/80",
            )}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              vs last order
            </div>
            <div
              className={cn(
                "text-lg font-bold",
                weightAlert.kind === "gain_7" ? "text-rx-decline" : "text-rx-cs",
              )}
            >
              {weightAlert.pctChange > 0 ? "+" : ""}
              {weightAlert.pctChange}%
            </div>
            <div className="text-[11px] text-muted-foreground">
              {weightAlert.previousOrderDate}
            </div>
          </div>
        </div>
      )}

      <div className="rx-hero">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {headerEthnicity ? (
              <span className="rx-badge-ethnicity mb-2 inline-flex">
                {headerEthnicity}
              </span>
            ) : null}

            <h1 className="rx-display">{c.patientName}</h1>

            <OrderHeaderMedicationSelect
              consultation={c}
              onMedicationChanged={onMedicationChanged}
            />

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="rx-meta tabular-nums font-medium text-foreground">
                {formatWeightAllUnits(headerWeightKg)}
              </p>
              <span
                className="hidden sm:inline h-4 w-px bg-border shrink-0"
                aria-hidden
              />
              <span
                className={cn(
                  "rx-badge-bmi shrink-0",
                  headerBmi == null &&
                    "border-border bg-muted text-muted-foreground",
                )}
              >
                <span className="uppercase tracking-wide text-[10px] text-muted-foreground">
                  BMI
                </span>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    headerBmi != null
                      ? bmiHighlightClass(headerBmi)
                      : "text-muted-foreground",
                  )}
                >
                  {headerBmi != null ? headerBmi.toFixed(1) : "—"}
                </span>
                {headerBmi != null ? (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {bmiBandShort(headerBmi)}
                  </span>
                ) : null}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {weightAlert && (
                <span
                  className={cn(
                    "rx-status-pill border font-bold",
                    weightAlert.kind === "gain_7"
                      ? "bg-rx-decline-surface text-rx-decline border-rx-decline-border"
                      : "bg-rx-cs-surface text-rx-cs border-rx-cs-border",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      weightAlert.kind === "gain_7" ? "bg-rose-600" : "bg-amber-600",
                    )}
                  />
                  Complex patient
                </span>
              )}
              <span className={cn("rx-status-pill", pill.cls)}>
                <span
                  className={cn("h-1.5 w-1.5 rounded-full shrink-0", pill.dotCls)}
                />
                {pill.label}
              </span>
              <span className={cn("rx-status-pill", journeyMeta.className)}>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    journeyMeta.dotClassName,
                  )}
                />
                {journeyMeta.label}
              </span>
              {waitTags.map((tag) => (
                <span
                  key={tag.id}
                  title={tag.detail}
                  className={cn(
                    "rx-status-pill border font-semibold",
                    WAIT_TAG_META[tag.kind].queueCls,
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
            <div className="rx-submitted">
              <div className="rx-label-caps">Submitted</div>
              <div className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                {formatDateTime(c.createdAt)}
              </div>
            </div>
            <div>
              <div className="rx-label-caps">Order</div>
              <div className="rx-ref mt-0.5 text-2xl sm:text-3xl leading-none">
                {orderRefFromId(c.id, (c as { consultationNumber?: string | null }).consultationNumber)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

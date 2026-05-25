import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Tag } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import {
  useListConsultations,
  getGetConsultationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { primaryAutoComplexAlert } from "@/lib/autoComplexPatient";
import { OrderHeaderMedicationSelect } from "@/components/OrderHeaderMedicationSelect";
import {
  statusPillForConsultation,
} from "@/lib/orderPatientUi";
import {
  getOrderJourneyTags,
  getPrescriberOrderTags,
  weightMonitoringTagId,
} from "@/lib/orderTags";
import {
  OrderTagsManageDialog,
  type OrderTagActivityPayload,
} from "@/components/OrderTagsManageDialog";
import { apiFetch } from "@/lib/api";
import { getPharmacistName } from "@/lib/pharmacistSession";

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
  onTagActivity,
}: {
  c: Consultation;
  onMedicationChanged?: (payload: { fromLabel: string; toLabel: string }) => void;
  onTagActivity?: (payload: OrderTagActivityPayload) => void;
}) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: consultList } = useListConsultations({ limit: 200 });
  const complexAlert = useMemo(
    () =>
      primaryAutoComplexAlert(c, consultList?.consultations ?? []),
    [c, consultList?.consultations],
  );

  const pill = statusPillForConsultation(c.status);
  const relatedConsultations = consultList?.consultations ?? [];
  const journeyTags = useMemo(
    () => getOrderJourneyTags(c, relatedConsultations),
    [c, relatedConsultations],
  );
  const prescriberTags = useMemo(
    () =>
      getPrescriberOrderTags(
        c,
        journeyTags.map((t) => t.label),
      ),
    [c, journeyTags],
  );

  const weightTagId = useMemo(
    () => weightMonitoringTagId(c, consultList?.consultations ?? []),
    [c, consultList?.consultations],
  );

  useEffect(() => {
    const pharmacistName = getPharmacistName();
    void apiFetch(`/api/consultations/${c.id}/order-tags`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "sync_documents",
        pharmacistName,
      }),
    })
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: getGetConsultationQueryKey(c.id),
        }),
      )
      .catch(() => {
        /* non-blocking auto-tag */
      });
  }, [c.id, queryClient]);

  useEffect(() => {
    if (!weightTagId) return;
    void apiFetch(`/api/consultations/${c.id}/order-tags`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "sync_weight",
        tagId: weightTagId,
        pharmacistName: getPharmacistName(),
      }),
    })
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: getGetConsultationQueryKey(c.id),
        }),
      )
      .catch(() => {
        /* non-blocking auto-tag */
      });
  }, [c.id, weightTagId, queryClient]);

  return (
    <>
      {complexAlert && (
        <div
          role="alert"
          className={cn(
            "mb-3 flex flex-col gap-2 rounded-2xl border px-4 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between",
            complexAlert.kind === "medication_switch"
              ? "border-violet-500/40 bg-violet-500/10 ring-1 ring-violet-500/30"
              : complexAlert.pctChange != null && complexAlert.pctChange > 0
                ? "border-rx-decline-border bg-rx-decline-surface ring-1 ring-rx-decline-border/60"
                : "border-rx-cs-border bg-rx-cs-surface ring-1 ring-rx-cs-border/60",
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                complexAlert.kind === "medication_switch"
                  ? "bg-violet-700 text-white"
                  : complexAlert.pctChange != null && complexAlert.pctChange > 0
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
                    complexAlert.kind === "medication_switch"
                      ? "bg-violet-800"
                      : complexAlert.pctChange != null && complexAlert.pctChange > 0
                        ? "bg-rose-700"
                        : "bg-amber-700",
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
                  complexAlert.kind === "medication_switch"
                    ? "text-violet-900 dark:text-violet-100"
                    : complexAlert.pctChange != null && complexAlert.pctChange > 0
                      ? "text-rx-decline"
                      : "text-rx-cs",
                )}
              >
                {complexAlert.headline}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                {complexAlert.detail}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-right tabular-nums",
              complexAlert.kind === "medication_switch"
                ? "border-violet-500/30 bg-card/80"
                : complexAlert.pctChange != null && complexAlert.pctChange > 0
                  ? "border-rx-decline-border bg-card/80"
                  : "border-rx-cs-border bg-card/80",
            )}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {complexAlert.kind === "medication_switch" ? "Switch" : "vs last order"}
            </div>
            <div
              className={cn(
                "text-lg font-bold",
                complexAlert.kind === "medication_switch"
                  ? "text-violet-800 dark:text-violet-200"
                  : complexAlert.pctChange != null && complexAlert.pctChange > 0
                    ? "text-rx-decline"
                    : "text-rx-cs",
              )}
            >
              {complexAlert.kind === "medication_switch" && complexAlert.fromMedicine && complexAlert.toMedicine
                ? `${complexAlert.fromMedicine} → ${complexAlert.toMedicine}`
                : complexAlert.pctChange != null
                  ? `${complexAlert.pctChange > 0 ? "+" : ""}${complexAlert.pctChange}%`
                  : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {complexAlert.previousOrderDate ?? "—"}
            </div>
          </div>
        </div>
      )}

      <div className="rx-hero">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="rx-display">{c.patientName}</h1>

            <div className="mt-2 space-y-2">
              {journeyTags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className="rx-label-caps shrink-0 text-muted-foreground">
                    Order
                  </span>
                  {journeyTags.map((tag) => (
                    <span
                      key={tag.key}
                      title={tag.detail}
                      className={cn(
                        "rx-status-pill shrink-0 border font-semibold",
                        tag.pillCls,
                      )}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="rx-label-caps shrink-0 text-muted-foreground">
                  Tags
                </span>
                {prescriberTags.map((tag) => (
                  <span
                    key={tag.key}
                    title={tag.detail}
                    className={cn(
                      "rx-status-pill shrink-0 border font-semibold",
                      tag.pillCls,
                    )}
                  >
                    {tag.label}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setTagsOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-rose-800 transition-colors hover:bg-rose-600/10 dark:text-rose-200"
                >
                  <Tag className="h-3 w-3 shrink-0" />
                  Edit tags
                </button>
              </div>
            </div>

            <OrderHeaderMedicationSelect
              consultation={c}
              onMedicationChanged={onMedicationChanged}
            />

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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn("rx-status-pill", pill.cls)}>
            <span
              className={cn("h-1.5 w-1.5 rounded-full shrink-0", pill.dotCls)}
            />
            {pill.label}
          </span>
        </div>
      </div>

      <OrderTagsManageDialog
        consultation={c}
        open={tagsOpen}
        onOpenChange={setTagsOpen}
        onTagActivity={onTagActivity}
      />
    </>
  );
}

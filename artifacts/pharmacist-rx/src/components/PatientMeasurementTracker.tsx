import { useMemo } from "react";

import {

  Activity,

  HeartPulse,

  History,

  Pill,

  Ruler,

  Scale,

  ShieldCheck,

  TrendingDown,

} from "lucide-react";

import type { Consultation } from "@workspace/api-client-react";

import { useListConsultations } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";

import { ClinicalReviewSection } from "@/components/rx/ClinicalReviewSection";

import { CLINICAL_PANEL } from "@/components/rx/ClinicalReviewPanels";

import { cn } from "@/lib/utils";

import {

  buildMeasurementLog,

  doseBadgeClass,

  overallWeightLossPct,

  type MeasurementLogEntry,

} from "@/lib/measurementHistory";



const PLAIN_CARD =
  "rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6";



function PlainSectionTitle({

  icon: Icon,

  iconClassName,

  title,

  description,

  badge,

}: {

  icon: typeof HeartPulse;

  iconClassName: string;

  title: string;

  description: string;

  badge?: string;

}) {

  return (

    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

      <div>

        <h3 className="flex items-center gap-2.5 text-base font-bold text-foreground sm:text-lg">

          <span

            className={cn(

              "flex h-9 w-9 items-center justify-center rounded-xl",

              iconClassName,

            )}

          >

            <Icon className="h-5 w-5" />

          </span>

          {title}

        </h3>

        <p className="mt-1 text-sm text-muted-foreground sm:ml-11">{description}</p>

      </div>

      {badge ? (

        <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/60 px-3.5 py-1.5 text-xs font-semibold text-foreground">

          {badge}

        </span>

      ) : null}

    </div>

  );

}



function formatWeightChange(change: number | null, isBaseline: boolean): string {

  if (isBaseline) return "Starting weight";

  if (change == null) return "—";

  if (change === 0) return "No change";

  const abs = Math.abs(change).toFixed(1);

  return change < 0 ? `↓ ${abs} kg loss` : `↑ ${abs} kg gain`;

}



function WeightChangeSub({ entry }: { entry: MeasurementLogEntry }) {

  const text = formatWeightChange(entry.weightChangeKg, entry.isBaseline);

  const positive = entry.weightChangeKg != null && entry.weightChangeKg > 0;

  const negative = entry.weightChangeKg != null && entry.weightChangeKg < 0;

  return (

    <span

      className={cn(

        "mt-0.5 block text-xs font-medium",

        entry.isBaseline && "text-muted-foreground",

        negative && "text-primary",

        positive && "text-rose-600",

        !entry.isBaseline && entry.weightChangeKg === 0 && "text-muted-foreground",

      )}

    >

      {text}

    </span>

  );

}



function CurrentVitalsBody({

  current,

  pctLost,

}: {

  current: MeasurementLogEntry;

  pctLost: number | null;

}) {

  return (

    <>

      <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">

        <span className="text-lg font-bold text-foreground">

          {current.dateLabel}

        </span>

        <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground shadow-sm">

          Current order

        </span>

        <span className="ml-auto flex items-center gap-1.5 text-sm font-medium text-primary">

          <ShieldCheck className="h-4 w-4" />

          Clinician verified

        </span>

      </div>



      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {[

          {

            icon: Ruler,

            label: "Height",

            value: `${current.heightCm} cm`,

            extra: null,

          },

          {

            icon: Scale,

            label: "Weight",

            value: `${current.weightKg.toFixed(1)} kg`,

            extra:

              pctLost != null && pctLost > 0 ? (

                <span className="mt-1.5 inline-flex items-center gap-0.5 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-primary">

                  <TrendingDown className="h-3 w-3" />

                  {pctLost}% overall

                </span>

              ) : null,

          },

          {

            icon: Activity,

            label: "BMI",

            value: current.bmi.toFixed(1),

            extra: (

              <span className="mt-1.5 inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">

                {current.bmiBand}

              </span>

            ),

          },

          {

            icon: Pill,

            label: "Current dose",

            value: null,

            dose: true,

          },

        ].map((m) => (

          <div

            key={m.label}

            className={cn(

              "rounded-xl border p-4",

              m.dose

                ? "col-span-2 border-violet-500/25 bg-violet-500/10 lg:col-span-1"

                : "border-border bg-muted/40/80",

            )}

          >

            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">

              <m.icon className="h-3.5 w-3.5" />

              {m.label}

            </div>

            {m.dose ? (

              <>

                <span

                  className={cn(

                    "mt-2 inline-flex rounded-lg border px-3 py-1.5 text-sm font-bold",

                    doseBadgeClass(current.doseMg),

                  )}

                >

                  {current.doseDisplay}

                </span>

                <span className="mt-1 block text-[11px] text-muted-foreground">

                  {current.medication}

                </span>

              </>

            ) : (

              <>

                <div className="mt-2 text-2xl font-bold text-foreground">

                  {m.value}

                </div>

                {m.extra}

              </>

            )}

          </div>

        ))}

      </div>

    </>

  );

}



function TitrationLogBody({ log }: { log: MeasurementLogEntry[] }) {

  return (

    <div className="overflow-x-auto rounded-xl border border-border">

      <table className="w-full min-w-[640px] border-collapse text-left text-sm">

        <thead>

          <tr className="border-b border-border bg-muted/50">

            {[

              "Order date",

              "Medication dose",

              "Height",

              "Weight change",

              "Calculated BMI",

            ].map((h) => (

              <th

                key={h}

                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"

              >

                {h}

              </th>

            ))}

          </tr>

        </thead>

        <tbody>

          {[...log].reverse().map((entry) => (

            <tr

              key={entry.id}

              className={cn(

                "border-b border-border transition-colors last:border-0",

                entry.isCurrent
                  ? "bg-muted/70 ring-1 ring-inset ring-border"
                  : "hover:bg-muted/30",

              )}

            >

              <td className="px-4 py-4">

                <span className="font-semibold text-foreground">

                  {entry.dateLabel}

                </span>

                <span className="mt-0.5 block text-xs text-muted-foreground">

                  {entry.monthLabel}

                </span>

                {entry.isCurrent ? (

                  <span className="mt-2 inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground shadow-sm">

                    Current order

                  </span>

                ) : null}

              </td>

              <td className="px-4 py-4">

                <span

                  className={cn(

                    "inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold",

                    doseBadgeClass(entry.doseMg),

                  )}

                >

                  {entry.doseDisplay}

                </span>

                <span className="mt-1 block text-[11px] text-muted-foreground">

                  {entry.medication}

                </span>

              </td>

              <td className="px-4 py-4 font-medium text-foreground">

                {entry.heightCm} cm

              </td>

              <td className="px-4 py-4">

                <span className="font-semibold text-foreground">

                  {entry.weightKg.toFixed(1)} kg

                </span>

                <WeightChangeSub entry={entry} />

              </td>

              <td className="px-4 py-4">

                <span className="font-semibold text-foreground">

                  {entry.bmi.toFixed(1)}

                </span>

                <span className="mt-0.5 block text-xs text-muted-foreground">

                  {entry.bmiBand}

                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}



export function ClinicalReviewBmiHistory({

  consultation,

}: {

  consultation: Consultation;

}) {

  const { data } = useListConsultations({ limit: 100 });

  const log = useMemo(() => {

    const related = data?.consultations ?? [];

    return buildMeasurementLog(consultation, related);

  }, [consultation, data?.consultations]);



  return (

    <section className={CLINICAL_PANEL} id="cr-history">

      <div className="border-b border-border bg-muted/30 px-5 py-4">

        <h3 className="font-serif text-lg font-semibold text-secondary">

          BMI history

        </h3>

        <p className="mt-0.5 text-sm text-muted-foreground">

          Height, weight and BMI across previous weight-loss orders.

        </p>

      </div>

      <div className="p-4 sm:p-5">

        {log.length === 0 ? (

          <p className="text-sm text-muted-foreground">

            No height or weight recorded for this patient yet.

          </p>

        ) : (

          <TitrationLogBody log={log} />

        )}

      </div>

    </section>

  );

}



export function PatientMeasurementTracker({

  consultation,

  onOpenScr,

  numbered = false,

}: {

  consultation: Consultation;

  onOpenScr: () => void;

  numbered?: boolean;

}) {

  const { data } = useListConsultations({ limit: 100 });

  const log = useMemo(() => {

    const related = data?.consultations ?? [];

    return buildMeasurementLog(consultation, related);

  }, [consultation, data?.consultations]);



  const current =

    log.find((e) => e.isCurrent) ?? log[log.length - 1] ?? null;

  const pctLost = overallWeightLossPct(log);



  if (!current) {

    return (

      <p className="rounded-2xl border border-border bg-muted/40/50 p-4 text-sm text-muted-foreground">

        No height or weight recorded for this order yet.

      </p>

    );

  }



  if (numbered) {

    return (

      <div className="space-y-8">

        <ClinicalReviewSection

          step={2}

          theme="rose"

          id="cr-vitals"

          icon={HeartPulse}

          eyebrow="Step 2 · Vitals"

          title="Current measurement status"

          description="Check height, weight, BMI and dose for this order before reviewing history."

          badge={`Order #${current.orderIndex} of ${log.length}`}

        >

          <CurrentVitalsBody current={current} pctLost={pctLost} />

        </ClinicalReviewSection>



        <ClinicalReviewSection

          step={3}

          theme="sky"

          id="cr-history"

          icon={History}

          eyebrow="Step 3 · Progress"

          title="Titration & weight log"

          description="Compare measurements across previous orders since treatment started."

          badge={`${log.length} total logs`}

          bodyClassName="p-0 sm:p-0"

        >

          <div className="px-4 py-4 sm:px-5 sm:py-5">

            <TitrationLogBody log={log} />

          </div>

        </ClinicalReviewSection>



        <ClinicalReviewSection

          step={4}

          theme="amber"

          id="cr-scr"

          icon={ShieldCheck}

          eyebrow="Step 4 · External records"

          title="NHS Summary Care Record"

          description="Open SCR to confirm medicines, allergies and contraindications."

        >

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-muted-foreground">

              Required before marking clinical review complete — verify prescribed

              medicines and allergies match the consultation.

            </p>

            <Button

              type="button"

              size="sm"

              onClick={onOpenScr}

              className="w-full shrink-0 rounded-xl bg-amber-700 text-white shadow-sm hover:bg-amber-800 sm:w-auto"

            >

              Go to NHS SCR

            </Button>

          </div>

        </ClinicalReviewSection>

      </div>

    );

  }



  return (

    <div className="space-y-5">

      <div className={PLAIN_CARD}>

        <PlainSectionTitle

          icon={HeartPulse}

          iconClassName="bg-muted text-primary"

          title="Current measurement status"

          description="Most recent verified snapshot from this order cycle."

          badge={`Order #${current.orderIndex} of ${log.length}`}

        />

        <CurrentVitalsBody current={current} pctLost={pctLost} />

      </div>



      <div className={PLAIN_CARD}>

        <PlainSectionTitle

          icon={History}

          iconClassName="bg-sky-500/10 text-sky-700 dark:text-sky-200"

          title="Titration & weight log"

          description="Order-by-order measurements since starting treatment."

          badge={`${log.length} total logs`}

        />

        <TitrationLogBody log={log} />

      </div>



      <div

        className={cn(

          PLAIN_CARD,

          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",

        )}

      >

        <div className="flex items-center gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm">

            <ShieldCheck className="h-5 w-5" />

          </div>

          <div>

            <div className="font-semibold text-foreground">

              NHS Summary Care Record

            </div>

            <p className="mt-0.5 text-sm text-muted-foreground">

              Prescribed medicines, allergies, and NHS clinical parameters.

            </p>

          </div>

        </div>

        <Button

          type="button"

          size="sm"

          onClick={onOpenScr}

          className="w-full shrink-0 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 sm:w-auto"

        >

          Go to NHS SCR

        </Button>

      </div>

    </div>

  );

}



import React, { useMemo } from "react";
import { Truck, Calendar, Clock, MapPin } from "lucide-react";

const UK_POSTCODE = /^\s*([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\s*$/i;
const SCOTTISH_HIGHLAND_PREFIXES = ["AB", "IV", "KW", "PA", "PH", "HS", "ZE"];
const NI_PREFIX = "BT";

function nextWorkingDay(from: Date, addDays: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < addDays) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

function formatDay(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/**
 * UK delivery-promise widget. Shows a live cutoff time, dispatch ETA and
 * estimated delivery window based on the entered postcode prefix.
 * Frontend-only — all logic is local; no API call needed.
 */
export function DeliveryPromise({ postcode }: { postcode: string }) {
  const promise = useMemo(() => {
    const cleaned = (postcode || "").trim().toUpperCase();
    const match = cleaned.match(UK_POSTCODE);
    const valid = !!match;
    const prefix = match?.[1] ?? "";
    const isHighlands = SCOTTISH_HIGHLAND_PREFIXES.some(p => prefix.startsWith(p));
    const isNi = prefix.startsWith(NI_PREFIX);

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(15, 0, 0, 0);
    const beforeCutoff = now < cutoff && now.getDay() >= 1 && now.getDay() <= 5;
    const dispatchDate = beforeCutoff ? now : nextWorkingDay(now, 1);
    const minDays = isHighlands || isNi ? 2 : 1;
    const maxDays = isHighlands || isNi ? 4 : 2;
    const earliest = nextWorkingDay(dispatchDate, minDays);
    const latest = nextWorkingDay(dispatchDate, maxDays);

    return { valid, beforeCutoff, dispatchDate, earliest, latest, region: isNi ? "Northern Ireland" : isHighlands ? "Scottish Highlands & Islands" : "UK Mainland" };
  }, [postcode]);

  if (!promise.valid) {
    return (
      <div className="rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 p-3 text-xs text-muted-foreground flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5" />
        Enter your full UK postcode to see your delivery date.
      </div>
    );
  }

  const sameWindow = promise.earliest.toDateString() === promise.latest.toDateString();
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 space-y-2" data-testid="delivery-promise">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
        <Truck className="w-4 h-4" />
        {sameWindow ? "Estimated delivery: " : "Estimated delivery between "}
        <span className="text-emerald-700">
          {sameWindow ? formatDay(promise.earliest) : `${formatDay(promise.earliest)} – ${formatDay(promise.latest)}`}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-800">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {promise.beforeCutoff
            ? "Order before 3pm — dispatched today"
            : `Dispatched ${formatDay(promise.dispatchDate)}`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Royal Mail Tracked 24
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {promise.region}
        </span>
      </div>
    </div>
  );
}

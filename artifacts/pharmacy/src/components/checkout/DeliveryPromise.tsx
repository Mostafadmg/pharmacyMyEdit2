import React, { useEffect, useMemo, useState } from "react";
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

function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function DeliveryPromise({ postcode }: { postcode: string }) {
  const now = useNow(1000);

  const promise = useMemo(() => {
    const cleaned = (postcode || "").trim().toUpperCase();
    const match = cleaned.match(UK_POSTCODE);
    const valid = !!match;
    const prefix = match?.[1] ?? "";
    const isHighlands = SCOTTISH_HIGHLAND_PREFIXES.some(p => prefix.startsWith(p));
    const isNi = prefix.startsWith(NI_PREFIX);

    const cutoff = new Date(now);
    cutoff.setHours(15, 0, 0, 0);
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const beforeCutoff = isWeekday && now < cutoff;
    const dispatchDate = beforeCutoff ? now : nextWorkingDay(now, 1);
    const minDays = isHighlands || isNi ? 2 : 1;
    const maxDays = isHighlands || isNi ? 4 : 2;
    const earliest = nextWorkingDay(dispatchDate, minDays);
    const latest = nextWorkingDay(dispatchDate, maxDays);

    let countdown: { h: number; m: number; s: number } | null = null;
    if (beforeCutoff) {
      const diff = Math.max(0, cutoff.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      countdown = { h, m, s };
    }

    return {
      valid, beforeCutoff, dispatchDate, earliest, latest, countdown,
      region: isNi ? "Northern Ireland" : isHighlands ? "Scottish Highlands & Islands" : "UK Mainland",
    };
  }, [postcode, now]);

  if (!promise.valid) {
    return (
      <div className="rounded-xl bg-muted/30 border border-dashed border-muted-foreground/20 p-3 text-xs text-muted-foreground flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5" />
        Enter your full UK postcode to see your delivery date.
      </div>
    );
  }

  const sameWindow = promise.earliest.toDateString() === promise.latest.toDateString();
  const c = promise.countdown;
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 space-y-2" data-testid="delivery-promise">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
        <Truck className="w-4 h-4" />
        {sameWindow ? "Estimated delivery: " : "Estimated delivery between "}
        <span className="text-emerald-700">
          {sameWindow ? formatDay(promise.earliest) : `${formatDay(promise.earliest)} – ${formatDay(promise.latest)}`}
        </span>
      </div>
      {c && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold px-3 py-1"
          data-testid="delivery-countdown"
          aria-live="polite"
        >
          <Clock className="w-3 h-3" />
          Order in {c.h}h {String(c.m).padStart(2, "0")}m {String(c.s).padStart(2, "0")}s for same-day dispatch
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-800">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {promise.beforeCutoff
            ? "3pm cutoff today"
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

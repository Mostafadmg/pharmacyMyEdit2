export type SideEffectsLevel = "none" | "mild" | "moderate" | "severe" | "";
export type AdherenceLevel = "good" | "missed_doses" | "stopped" | "";

export type OrderMonitoringLog = {
  sideEffectsLevel: SideEffectsLevel;
  sideEffectsNotes: string;
  adherence: AdherenceLevel;
  clinicalNotes: string;
  updatedAt?: string;
  updatedBy?: string;
};

const STORAGE_PREFIX = "pharmacare:rx-order-monitoring:";

export function monitoringLogKey(consultationId: string): string {
  return `${STORAGE_PREFIX}${consultationId}`;
}

export function readOrderMonitoringLog(
  consultationId: string,
): OrderMonitoringLog {
  if (typeof window === "undefined") return emptyMonitoringLog();
  try {
    const raw = window.localStorage.getItem(monitoringLogKey(consultationId));
    if (!raw) return emptyMonitoringLog();
    const parsed = JSON.parse(raw) as Partial<OrderMonitoringLog>;
    return { ...emptyMonitoringLog(), ...parsed };
  } catch {
    return emptyMonitoringLog();
  }
}

export function writeOrderMonitoringLog(
  consultationId: string,
  log: OrderMonitoringLog,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      monitoringLogKey(consultationId),
      JSON.stringify(log),
    );
  } catch {
    /* ignore */
  }
}

export function emptyMonitoringLog(): OrderMonitoringLog {
  return {
    sideEffectsLevel: "",
    sideEffectsNotes: "",
    adherence: "",
    clinicalNotes: "",
  };
}

export function hasMonitoringLog(log: OrderMonitoringLog): boolean {
  return Boolean(
    log.sideEffectsLevel ||
      log.sideEffectsNotes.trim() ||
      log.adherence ||
      log.clinicalNotes.trim(),
  );
}

export const SIDE_EFFECTS_OPTIONS: {
  value: SideEffectsLevel;
  label: string;
}[] = [
  { value: "none", label: "None reported" },
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

export const ADHERENCE_OPTIONS: {
  value: AdherenceLevel;
  label: string;
}[] = [
  { value: "good", label: "Good — taking as prescribed" },
  { value: "missed_doses", label: "Missed doses" },
  { value: "stopped", label: "Stopped temporarily" },
];

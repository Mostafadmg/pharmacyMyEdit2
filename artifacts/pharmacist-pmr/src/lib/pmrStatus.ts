import type { Consultation } from "@workspace/api-client-react";
export type BoardColumn =
  | "inbox"
  | "parked"
  | "pick"
  | "label"
  | "pack"
  | "completed";

export type PmrWorkflowStatus =
  | "awaiting_check"
  | "inbox"
  | "parked"
  | "pick"
  | "label"
  | "pack"
  | "completed";

const STORAGE_KEY = "everydaymeds:pmr-status-v3";

const LEGACY_STATUS: Record<string, PmrWorkflowStatus> = {
  checked: "inbox",
  labelled: "label",
  dispensed: "pick",
  awaiting_check: "awaiting_check",
  inbox: "inbox",
  pick: "pick",
  parked: "parked",
  label: "label",
  pack: "pack",
  dispatched: "completed",
  completed: "completed",
  check: "awaiting_check",
};

export const BOARD_COLUMNS: BoardColumn[] = [
  "inbox",
  "parked",
  "pick",
  "label",
  "pack",
  "completed",
];

export const BOARD_COLUMN_LABELS: Record<BoardColumn, string> = {
  inbox: "Inbox",
  parked: "Parked",
  pick: "Pick",
  label: "Label",
  pack: "Pack",
  completed: "Completed",
};

export const PMR_STATUS_LABELS: Record<PmrWorkflowStatus, string> = {
  awaiting_check: "Awaiting check",
  inbox: "Inbox",
  parked: "Parked",
  pick: "Pick",
  label: "Label",
  pack: "Pack",
  completed: "Completed",
};

/** @deprecated use BOARD_COLUMNS */
export const DISPENSING_COLUMNS = ["inbox", "pick", "parked"] as const;
export type DispensingColumn = "inbox" | "pick" | "parked";
export const DISPENSING_COLUMN_LABELS: Record<DispensingColumn, string> = {
  inbox: "Inbox",
  pick: "Pick",
  parked: "Parked",
};

function normalizeStatus(raw: string): PmrWorkflowStatus {
  return LEGACY_STATUS[raw] ?? (raw as PmrWorkflowStatus);
}

function readStore(): Record<string, PmrWorkflowStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      const normalized: Record<string, PmrWorkflowStatus> = {};
      for (const [id, s] of Object.entries(parsed)) {
        normalized[id] = normalizeStatus(s);
      }
      return normalized;
    }
    const legacyV2 = localStorage.getItem("everydaymeds:pmr-status-v2");
    if (legacyV2) {
      const old = JSON.parse(legacyV2) as Record<string, string>;
      const migrated: Record<string, PmrWorkflowStatus> = {};
      for (const [id, s] of Object.entries(old)) {
        migrated[id] = normalizeStatus(s);
      }
      writeStore(migrated);
      return migrated;
    }
    const legacy = localStorage.getItem("everydaymeds:pmr-status");
    if (legacy) {
      const old = JSON.parse(legacy) as Record<string, string>;
      const migrated: Record<string, PmrWorkflowStatus> = {};
      for (const [id, s] of Object.entries(old)) {
        migrated[id] = normalizeStatus(s);
      }
      writeStore(migrated);
      return migrated;
    }
    return {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, PmrWorkflowStatus>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function getStoredPmrStatus(
  consultationId: string,
): PmrWorkflowStatus | null {
  const s = readStore()[consultationId];
  if (!s) return null;
  return normalizeStatus(s);
}

export function setPmrStatus(
  consultationId: string,
  status: PmrWorkflowStatus,
): void {
  const store = readStore();
  store[consultationId] = status;
  writeStore(store);
  window.dispatchEvent(
    new CustomEvent("pmr:status-changed", {
      detail: { consultationId, status },
    }),
  );
}

/** Approved Rx from portal → server pmrWorkflowStatus, with localStorage offline cache. */
export function resolvePmrStatus(
  consultation: Consultation,
): PmrWorkflowStatus {
  if (
    consultation.dispatchedAt ||
    consultation.pmrWorkflowStatus === "dispatched"
  ) {
    return "completed";
  }

  const server = consultation.pmrWorkflowStatus;
  if (server) {
    return serverStatusToUi(server);
  }

  const stored = getStoredPmrStatus(consultation.id);
  if (stored) return stored;

  if (consultation.rxClinicalCheckComplete) return "pick";
  return "awaiting_check";
}

export function serverStatusToUi(
  status: NonNullable<Consultation["pmrWorkflowStatus"]>,
): PmrWorkflowStatus {
  switch (status) {
    case "inbox":
      return "awaiting_check";
    case "pick":
      return "pick";
    case "parked":
      return "parked";
    case "labelling":
      return "label";
    case "pack":
      return "pack";
    case "dispatched":
      return "completed";
    default:
      return "awaiting_check";
  }
}

export function uiStatusToServer(
  status: PmrWorkflowStatus,
): NonNullable<Consultation["pmrWorkflowStatus"]> {
  switch (status) {
    case "awaiting_check":
    case "inbox":
      return "inbox";
    case "pick":
      return "pick";
    case "parked":
      return "parked";
    case "label":
      return "labelling";
    case "pack":
      return "pack";
    case "completed":
      return "dispatched";
    default:
      return "inbox";
  }
}

export function isRxClinicallyPreChecked(consultation: Consultation): boolean {
  return consultation.rxClinicalCheckComplete === true;
}

export function statusToBoardColumn(
  status: PmrWorkflowStatus,
): BoardColumn | null {
  switch (status) {
    case "awaiting_check":
    case "inbox":
      return "inbox";
    case "parked":
      return "parked";
    case "pick":
      return "pick";
    case "label":
      return "label";
    case "pack":
      return "pack";
    case "completed":
      return "completed";
    default:
      return null;
  }
}

export function boardColumnToStatus(column: BoardColumn): PmrWorkflowStatus {
  return column === "completed" ? "completed" : column;
}

export function moveToBoardColumn(
  consultationId: string,
  column: BoardColumn,
): void {
  setPmrStatus(consultationId, boardColumnToStatus(column));
}

/** @deprecated Server is source of truth — call refreshApproved() after API success. */
export function completeClinicalCheck(consultationId: string): void {
  setPmrStatus(consultationId, "pick");
}

/** @deprecated Server is source of truth — call refreshApproved() after API success. */
export function markLabelPrinted(consultationId: string): void {
  setPmrStatus(consultationId, "label");
}

/** @deprecated Server is source of truth — call refreshApproved() after API success. */
export function markPacked(consultationId: string): void {
  setPmrStatus(consultationId, "pack");
}

/** @deprecated Server is source of truth — call refreshApproved() after API success. */
export function markCompleted(consultationId: string): void {
  setPmrStatus(consultationId, "completed");
}

/** @deprecated use markCompleted */
export function markDispatched(consultationId: string): void {
  markCompleted(consultationId);
}

export function moveToDispensingColumn(
  consultationId: string,
  column: DispensingColumn,
): void {
  setPmrStatus(consultationId, column);
}

export function isClinicalQueue(status: PmrWorkflowStatus): boolean {
  return status === "awaiting_check";
}

export function isDispensingBoard(status: PmrWorkflowStatus): boolean {
  return status !== "completed";
}

export function getDispensingColumn(
  status: PmrWorkflowStatus,
): DispensingColumn | null {
  if (status === "inbox" || status === "pick" || status === "parked") {
    return status;
  }
  return null;
}

export function pmrStatusTone(status: PmrWorkflowStatus): string {
  switch (status) {
    case "awaiting_check":
      return "border-sky-400/50 bg-sky-950/40 text-sky-200";
    case "inbox":
      return "border-white/20 bg-white/5 text-white/80";
    case "pick":
      return "border-violet-400/50 bg-violet-950/40 text-violet-200";
    case "parked":
      return "border-orange-400/50 bg-orange-950/40 text-orange-200";
    case "label":
      return "border-teal-400/50 bg-teal-950/40 text-teal-200";
    case "pack":
      return "border-indigo-400/50 bg-indigo-950/40 text-indigo-200";
    case "completed":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function formatBoardTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} (${hh}:${min})`;
}

/** Relative time for board cards, e.g. "12 min ago". */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatBoardTimestamp(iso);
}

/** Medication line with strength and quantity for board cards. */
export function medicationPickLine(
  c: Consultation,
): string | undefined {
  const item = c.prescriptionItems?.[0];
  if (!item) return undefined;
  const parts = [item.name, item.strength].filter((p) => p?.trim());
  const qty = item.quantity?.trim();
  const base = parts.join(" ");
  const extra =
    (c.prescriptionItems?.length ?? 0) > 1
      ? ` +${c.prescriptionItems!.length - 1}`
      : "";
  if (!base) return undefined;
  return qty ? `${base} · Qty ${qty}${extra}` : `${base}${extra}`;
}

export const BOARD_COLUMN_ACCENT: Record<BoardColumn, string> = {
  inbox: "bg-amber-500",
  parked: "bg-orange-500",
  pick: "bg-emerald-500",
  label: "bg-teal-500",
  pack: "bg-indigo-500",
  completed: "bg-slate-400 dark:bg-slate-500",
};

export const BOARD_COLUMN_BORDER: Record<BoardColumn, string> = {
  inbox: "border-l-amber-500",
  parked: "border-l-orange-500",
  pick: "border-l-emerald-500",
  label: "border-l-teal-500",
  pack: "border-l-indigo-500",
  completed: "border-l-slate-400 dark:border-l-slate-500",
};

export const BOARD_COLUMN_ICON: Record<BoardColumn, string> = {
  inbox: "text-amber-600 dark:text-amber-400",
  parked: "text-orange-600 dark:text-orange-400",
  pick: "text-emerald-600 dark:text-emerald-400",
  label: "text-teal-600 dark:text-teal-400",
  pack: "text-indigo-600 dark:text-indigo-400",
  completed: "text-slate-500 dark:text-slate-400",
};

const EMPTY_DISPLAY_VALUES = new Set([
  "n/a",
  "na",
  "unknown",
  "not recorded",
  "not known",
  "address not recorded",
]);

/** True when a string is worth showing in the UI (not blank or a placeholder). */
export function hasDisplayValue(value?: string | null): boolean {
  if (!value?.trim()) return false;
  return !EMPTY_DISPLAY_VALUES.has(value.trim().toLowerCase());
}

export function patientAddressLine(c: Consultation): string {
  const parts = [
    c.deliveryAddressLine1,
    c.deliveryAddressLine2,
    c.deliveryAddress,
  ].filter(Boolean);
  return parts[0] ?? "Address not recorded";
}

/** Patient address when recorded; otherwise undefined (hide in UI). */
export function patientAddressOrUndefined(c: Consultation): string | undefined {
  const line = patientAddressLine(c);
  return hasDisplayValue(line) ? line : undefined;
}

/** Compact label for the first prescribed item on board cards. */
export function primaryMedicationLabel(c: Consultation): string | undefined {
  const item = c.prescriptionItems?.[0];
  if (!item) return undefined;
  const parts = [item.name, item.strength].filter((p) => p?.trim());
  const base = parts.join(" ");
  const extra = (c.prescriptionItems?.length ?? 0) > 1 ? ` +${c.prescriptionItems!.length - 1}` : "";
  return base ? `${base}${extra}` : undefined;
}

export function prescriptionSourceCode(c: Consultation): string {
  const n = c.consultationNumber?.toUpperCase();
  if (n?.startsWith("PP") || n?.startsWith("EPS")) return "Eps R2";
  if (n?.startsWith("RX")) return "RX";
  return "2DRX";
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDrawerLongDate(iso: string | Date | null | undefined): string {
  const d = toDate(iso);
  if (!d) return "n/a";
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${weekday} ${dd}/${mm}/${yyyy}`;
}

export function dispensingPeriodLabel(c: Consultation): string {
  const startDate = toDate(c.reviewedAt ?? c.createdAt);
  if (!startDate) return "n/a";
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 28);
  return `${formatDrawerLongDate(startDate)} - ${formatDrawerLongDate(endDate)}`;
}

export function treatmentTypeLabel(c: Consultation): string {
  const cond = c.conditionName?.toLowerCase() ?? "";
  if (
    cond.includes("repeat") ||
    cond.includes("maintenance") ||
    c.previousConsultationId
  ) {
    return "Repeat";
  }
  if (cond.includes("acute") || cond.includes("infection") || cond.includes("exacerbation")) {
    return "Acute";
  }
  return "Acute";
}

export function prescriptionTypeLabel(c: Consultation): string {
  if (c.gpName || c.gpSurgery) {
    return `General Practitioner Prescribing — GP`;
  }
  return c.conditionName || "Private prescription";
}

export function isInboxStatus(status: PmrWorkflowStatus): boolean {
  return status === "awaiting_check" || status === "inbox";
}

export function buildPrescriptionTags(c: Consultation): Array<{
  label: string;
  variant: "red" | "blue" | "purple" | "orange";
}> {
  const tags: Array<{ label: string; variant: "red" | "blue" | "purple" | "orange" }> = [];
  const cond = c.conditionName?.toLowerCase() ?? "";
  if (cond.includes("acute") || cond.includes("infection")) {
    tags.push({ label: "Acute", variant: "red" });
  }
  if (c.hasRedFlag) tags.push({ label: "Urgent", variant: "red" });
  if (isControlledDrug(c)) tags.push({ label: "Controlled drug", variant: "purple" });
  const addr = patientAddressLine(c).toLowerCase();
  if (addr.includes("care home") || addr.includes("nursing")) {
    tags.push({ label: "Care home", variant: "blue" });
  }
  return tags;
}

export function footerStatusMessage(status: PmrWorkflowStatus): string | null {
  switch (status) {
    case "pick":
      return "Ready to dispense";
    case "label":
      return "Ready to label";
    case "pack":
      return "Ready to package";
    case "awaiting_check":
    case "inbox":
      return "Awaiting clinical check";
    case "parked":
      return "Parked";
    default:
      return null;
  }
}

export function isControlledDrug(c: Consultation): boolean {
  const items = c.prescriptionItems ?? [];
  return items.some((it) => {
    const name = `${it.name} ${it.strength}`.toLowerCase();
    return (
      name.includes("mounjaro") ||
      name.includes("wegovy") ||
      name.includes("ozempic") ||
      name.includes("morphine") ||
      name.includes("tramadol") ||
      name.includes("codeine")
    );
  });
}

export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

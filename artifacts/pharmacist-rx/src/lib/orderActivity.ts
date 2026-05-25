import type { Consultation } from "@workspace/api-client-react";
import { EMPTY_VALUE } from "./plainText";
import {
  EVIDENCE_SLOT_META,
  type DocumentRequirementChange,
  rxVisibleSlots,
} from "@workspace/evidence-slots";
import { getPatientDocumentUrls } from "@/lib/prescriptionEvidenceSlots";
import { parseOrderMedication, shortConditionName } from "@/lib/orderPatientUi";
import {
  deriveWaitTagsFromConsultation,
  type CustomerWaitTag,
} from "@/lib/orderWaitingTags";
import {
  formatOrderTagActivityCopy,
  formatOrderTagsBatchAddActivityCopy,
  formatOrderTagsBatchRemoveActivityCopy,
  orderTagActivityEvents,
} from "@/lib/orderTags";

/** Semantic activity type — each maps to a unique colour in the Activity tab. */
export type ActivityKind =
  | "order_started"
  | "system"
  | "message_out"
  | "message_in"
  | "cs_hold"
  | "prescriber_hold"
  | "approved"
  | "declined"
  | "urgent"
  | "tab_verified"
  | "document_verified"
  | "document_rejected"
  | "profile_edit"
  | "medication_change"
  | "pending_customer_response"
  | "pending_document_upload"
  | "tag_added"
  | "tag_removed";

export type ActivityEvent = {
  atIso: string;
  time: string;
  title: string;
  body: string;
  expandableBody?: string;
  actor?: string;
  kind: ActivityKind;
  /** Order tag display label — tag_added / tag_removed cards only. */
  tagLabel?: string;
  /** Links the event to a specific consultation / order episode. */
  consultationId?: string;
};

export type OrderActivityStatusTone =
  | "pending"
  | "approved"
  | "declined"
  | "info"
  | "neutral";

export type OrderActivitySummary = {
  orderRef: string;
  consultationName: string;
  medicationLabel: string;
  placedAtLabel: string;
  statusLabel: string;
  statusTone: OrderActivityStatusTone;
  isRepeat: boolean;
};

export type ActivityOrderSection = {
  consultationId: string;
  orderRef: string;
  placedAtIso: string;
  placedAtLabel: string;
  isCurrent: boolean;
  isRepeat: boolean;
  summary: OrderActivitySummary;
  events: ActivityEvent[];
};

export type ActivityKindStyle = {
  label: string;
  icon: string;
  card: string;
  time: string;
  badge: string;
  /** Bullet on legend chips — must contrast with `badge` background. */
  legendDot: string;
};

/** Activity colours — same semantic palette as prescriber actions (primary / hold / CS / decline). */
export const ACTIVITY_KIND_STYLES: Record<ActivityKind, ActivityKindStyle> = {
  order_started: {
    label: "New order",
    icon: "bg-primary ring-primary/30",
    card: "border-rx-approve-border bg-rx-approve-surface",
    time: "bg-muted text-primary border-border",
    badge: "bg-primary text-primary-foreground",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  system: {
    label: "System",
    icon: "bg-muted-foreground ring-border",
    card: "border-border bg-muted/70",
    time: "bg-muted text-muted-foreground border-border",
    badge: "bg-muted text-foreground border border-border",
    legendDot: "bg-muted-foreground",
  },
  message_out: {
    label: "Message sent",
    icon: "bg-rx-hold ring-rx-hold-border",
    card: "border-rx-hold-border bg-rx-hold-surface",
    time: "bg-rx-hold-surface text-rx-hold border-rx-hold-border",
    badge: "bg-rx-hold text-white",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  message_in: {
    label: "Patient reply",
    icon: "bg-primary ring-primary/30",
    card: "border-rx-approve-border bg-rx-approve-surface",
    time: "bg-rx-approve-surface text-primary border-rx-approve-border",
    badge: "bg-primary/12 text-primary border border-primary/25 font-semibold",
    legendDot: "bg-primary",
  },
  cs_hold: {
    label: "CS hold",
    icon: "bg-rx-cs ring-rx-cs-border",
    card: "border-rx-cs-border bg-rx-cs-surface",
    time: "bg-rx-cs-surface text-rx-cs border-rx-cs-border",
    badge: "bg-rx-cs text-white",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  prescriber_hold: {
    label: "Prescriber hold",
    icon: "bg-rx-hold ring-rx-hold-border",
    card: "border-rx-hold-border bg-rx-hold-surface",
    time: "bg-rx-hold-surface text-rx-hold border-rx-hold-border",
    badge: "bg-rx-hold/90 text-white",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  approved: {
    label: "Approved",
    icon: "bg-primary ring-primary/30",
    card: "border-primary/25 bg-rx-approve-surface",
    time: "bg-muted text-primary border-border",
    badge: "bg-primary/15 text-primary border border-primary/20",
    legendDot: "bg-primary",
  },
  declined: {
    label: "Declined",
    icon: "bg-destructive ring-destructive/25",
    card: "border-destructive/25 bg-rx-decline-surface",
    time: "bg-rx-decline-surface text-destructive border-rx-decline-border",
    badge: "bg-destructive text-destructive-foreground",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  urgent: {
    label: "Urgent",
    icon: "bg-highlight ring-highlight/30",
    card: "border-rx-cs-border bg-rx-cs-surface",
    time: "bg-rx-cs-surface text-highlight border-rx-cs-border",
    badge: "bg-highlight text-highlight-foreground",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  tab_verified: {
    label: "Section verified",
    icon: "bg-primary/90 ring-primary/25",
    card: "border-primary/20 bg-rx-approve-surface/80",
    time: "bg-muted text-primary border-border",
    badge: "bg-primary/12 text-primary border border-primary/20",
    legendDot: "bg-primary",
  },
  document_verified: {
    label: "Doc verified",
    icon: "bg-primary ring-primary/30",
    card: "border-border bg-accent/50",
    time: "bg-accent/80 text-accent-foreground border-border",
    badge: "bg-primary text-primary-foreground",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  document_rejected: {
    label: "Doc rejected",
    icon: "bg-destructive ring-destructive/25",
    card: "border-destructive/30 bg-rx-decline-surface",
    time: "bg-rx-decline-surface text-destructive border-rx-decline-border",
    badge: "bg-destructive/90 text-destructive-foreground",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  profile_edit: {
    label: "Record edit",
    icon: "bg-secondary ring-border",
    card: "border-border bg-muted/50",
    time: "bg-muted text-secondary border-border",
    badge: "bg-secondary text-secondary-foreground",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  medication_change: {
    label: "Medication",
    icon: "bg-primary ring-primary/30",
    card: "border-rx-approve-border bg-rx-approve-surface",
    time: "bg-muted text-primary border-border",
    badge: "bg-primary/15 text-primary border border-primary/20",
    legendDot: "bg-primary",
  },
  pending_customer_response: {
    label: "Awaiting reply",
    icon: "bg-rx-hold ring-rx-hold-border",
    card: "border-rx-hold-border bg-rx-hold-surface",
    time: "bg-rx-hold-surface text-rx-hold border-rx-hold-border",
    badge: "bg-rx-hold text-white",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  pending_document_upload: {
    label: "Awaiting upload",
    icon: "bg-rx-cs ring-rx-cs-border",
    card: "border-rx-cs-border bg-rx-cs-surface",
    time: "bg-rx-cs-surface text-rx-cs border-rx-cs-border",
    badge: "bg-rx-cs text-white",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  tag_added: {
    label: "Tag added",
    icon: "bg-violet-600 ring-violet-300",
    card: "border-violet-200 bg-violet-50",
    time: "bg-violet-50 text-violet-900 border-violet-200",
    badge: "bg-violet-700 text-white",
    legendDot: "bg-card ring-1 ring-card/40",
  },
  tag_removed: {
    label: "Tag removed",
    icon: "bg-muted-foreground ring-border",
    card: "border-border bg-muted/60",
    time: "bg-muted text-muted-foreground border-border",
    badge: "bg-muted text-foreground border border-border",
    legendDot: "bg-muted-foreground",
  },
};

/** Left accent stripe — darker shade of each activity theme colour. */
export function activityEventBorderClass(kind: ActivityKind): string {
  const map: Partial<Record<ActivityKind, string>> = {
    order_started: "border-l-rx-approve-stripe",
    system: "border-l-muted-foreground",
    message_out: "border-l-rx-hold-stripe",
    message_in: "border-l-rx-approve-stripe",
    cs_hold: "border-l-rx-cs-stripe",
    prescriber_hold: "border-l-rx-hold-stripe",
    approved: "border-l-rx-approve-stripe",
    declined: "border-l-rx-decline-stripe",
    urgent: "border-l-rx-urgent-stripe",
    tab_verified: "border-l-rx-approve-stripe",
    document_verified: "border-l-rx-approve-stripe",
    document_rejected: "border-l-rx-decline-stripe",
    pending_customer_response: "border-l-rx-hold-stripe",
    pending_document_upload: "border-l-rx-cs-stripe",
    tag_added: "border-l-violet-500",
    tag_removed: "border-l-muted-foreground",
    profile_edit: "border-l-secondary",
    medication_change: "border-l-rx-approve-stripe",
  };
  return map[kind] ?? "border-l-border";
}

export const ACTIVITY_LEGEND_KINDS: ActivityKind[] = [
  "order_started",
  "system",
  "message_out",
  "message_in",
  "tab_verified",
  "document_verified",
  "document_rejected",
  "cs_hold",
  "prescriber_hold",
  "approved",
  "declined",
  "urgent",
  "profile_edit",
  "medication_change",
  "pending_customer_response",
  "pending_document_upload",
];

export type PatientCommunication = {
  id: string;
  direction: "outgoing" | "incoming";
  status: "awaiting_response" | "patient_responded";
  title: string;
  preview: string;
  message: string;
  at: string;
  actor: string;
  /** consultation_messages.kind — used to separate uploads from real replies */
  messageKind?: string;
};

/** Uploads / document actions are logged as system activity, not patient replies. */
export function isPatientReplyCommunication(
  comm: PatientCommunication,
): boolean {
  if (comm.messageKind === "document_upload") return false;
  return true;
}

const TAB_LABELS: Record<string, string> = {
  clinical: "Clinical Review",
  consultation: "Consultation",
  documents: "Documents",
  history: "Order History",
  counselling: "Patient Counselling",
  monitoring: "Monitoring",
};

function inferKindFromLegacy(raw: Record<string, unknown>): ActivityKind {
  const title = String(raw.title ?? "").toLowerCase();
  if (title.includes("message sent") || title.includes("sent a message")) {
    return "message_out";
  }
  if (title.includes("replied")) return "message_in";
  if (title.includes("cs hold")) return "cs_hold";
  if (title.includes("prescriber hold")) return "prescriber_hold";
  if (title.includes("declined") || title.includes("refund")) return "declined";
  if (title.includes("prescription approved")) return "approved";
  if (title.includes("urgent")) return "urgent";
  if (title.includes("marked complete")) return "tab_verified";
  if (title.includes("document verified")) return "document_verified";
  if (title.includes("document rejected")) return "document_rejected";
  if (title.includes("patient record") || title.includes("field")) {
    return "profile_edit";
  }
  if (title.includes("prescribed medication")) {
    return "medication_change";
  }
  if (title.includes("pending customer response") || title.includes("awaiting patient reply")) {
    return "pending_customer_response";
  }
  if (title.includes("pending document upload") || title.includes("awaiting document")) {
    return "pending_document_upload";
  }
  if (
    title.includes("submitted") ||
    title.includes("uploaded") ||
    title.includes("payment captured")
  ) {
    return "system";
  }
  return "system";
}

function normalizeActivityEvent(raw: Record<string, unknown>): ActivityEvent {
  const atIso = String(raw.atIso ?? new Date().toISOString());
  const kind =
    (raw.kind as ActivityKind | undefined) ??
    inferKindFromLegacy(raw);
  return {
    atIso,
    time: String(raw.time ?? formatActivityTime(atIso)),
    title: String(raw.title ?? "Activity"),
    body: String(raw.body ?? ""),
    expandableBody:
      typeof raw.expandableBody === "string" ? raw.expandableBody : undefined,
    actor: typeof raw.actor === "string" ? raw.actor : undefined,
    tagLabel: typeof raw.tagLabel === "string" ? raw.tagLabel : undefined,
    kind,
    consultationId:
      typeof raw.consultationId === "string" ? raw.consultationId : undefined,
  };
}

/** Short order reference shown in the Activity tab (e.g. #A1B2C). */
export function orderRefFromConsultationId(id: string): string {
  return "#" + id.replace(/-/g, "").toUpperCase().slice(-5);
}

export function formatOrderPlacedLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY_VALUE;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function consultationStatusDisplay(c: Consultation): {
  label: string;
  tone: OrderActivityStatusTone;
} {
  const note = (c.pharmacistNote ?? "").toLowerCase();
  switch (c.status) {
    case "approved":
      return { label: "Accepted", tone: "approved" };
    case "rejected":
      if (note.includes("refund")) {
        return { label: "Refunded", tone: "declined" };
      }
      return { label: "Rejected", tone: "declined" };
    case "more_info_needed":
      return { label: "More information requested", tone: "info" };
    case "patient_responded":
      return { label: "Patient responded", tone: "info" };
    default:
      return { label: "Pending review", tone: "pending" };
  }
}

export function formatOrderMedicationLabel(c: Consultation): string {
  const med = parseOrderMedication(c);
  if (med.doseLabel) {
    return `${med.title} · ${med.doseLabel}`;
  }
  return med.title;
}

export function buildOrderActivitySummary(c: Consultation): OrderActivitySummary {
  const status = consultationStatusDisplay(c);
  return {
    orderRef: orderRefFromConsultationId(c.id),
    consultationName: shortConditionName(c.conditionName),
    medicationLabel: formatOrderMedicationLabel(c),
    placedAtLabel: formatOrderPlacedLabel(c.createdAt),
    statusLabel: status.label,
    statusTone: status.tone,
    isRepeat: Boolean(c.previousConsultationId),
  };
}

/** First timeline event inside an expanded order — system order placement. */
export function activityOrderGeneratedEvent(c: Consultation): ActivityEvent {
  const summary = buildOrderActivitySummary(c);
  const med = parseOrderMedication(c);
  const lines = [
    `Order reference: ${summary.orderRef}`,
    `Consultation: ${summary.consultationName}`,
    `Medication: ${summary.medicationLabel}`,
    `Quantity: ${med.qty}`,
    `Status: ${summary.statusLabel}`,
    `Submitted: ${summary.placedAtLabel}`,
    summary.isRepeat ? "Order type: Repeat supply" : "Order type: New consultation",
    `Patient: ${c.patientName}`,
  ];

  return createActivityEvent({
    atIso: c.createdAt,
    kind: "system",
    consultationId: c.id,
    title: "Order generated",
    body: `${summary.orderRef} · ${summary.consultationName} · ${summary.medicationLabel} · ${summary.statusLabel} · ${summary.placedAtLabel}`,
    expandableBody: lines.join("\n"),
    actor: "System",
  });
}

export function orderStatusBadgeClass(tone: OrderActivityStatusTone): string {
  switch (tone) {
    case "approved":
      return "bg-rx-approve-surface text-primary border-rx-approve-border";
    case "declined":
      return "bg-rx-decline-surface text-destructive border-rx-decline-border";
    case "pending":
      return "bg-rx-cs-surface text-rx-cs border-rx-cs-border";
    case "info":
      return "bg-rx-hold-surface text-rx-hold border-rx-hold-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

type ConsultationMessageRow = {
  id: string;
  senderRole: string;
  senderName: string;
  body: string;
  createdAt: string;
  kind?: string;
};

export function communicationsFromConsultationMessages(
  messages: ConsultationMessageRow[],
  patientName: string,
): PatientCommunication[] {
  const docKinds = new Set([
    "message",
    "more_info_request",
    "document_rejected",
    "document_verified",
    "document_upload",
    "document_upload_requested",
  ]);

  return messages
    .filter((m) => docKinds.has(m.kind))
    .map((m) => {
      const fromPatient = m.senderRole === "patient";
      let title = fromPatient
        ? `${patientName} replied`
        : `${m.senderName} sent a message`;
      if (m.kind === "document_rejected") {
        title = fromPatient
          ? `${patientName} - document rejected`
          : `${m.senderName} - document rejected`;
      } else if (m.kind === "document_verified") {
        title = `${m.senderName} - document verified`;
      } else if (m.kind === "document_upload_requested") {
        title = `${m.senderName} - upload requested`;
      } else if (m.kind === "document_upload") {
        title = fromPatient
          ? `${patientName} uploaded a document`
          : `${m.senderName} uploaded a document`;
      }
      return {
        id: m.id,
        direction: fromPatient ? "incoming" : "outgoing",
        status: fromPatient ? "patient_responded" : "awaiting_response",
        title,
        preview:
          m.body.length > 96 ? `${m.body.slice(0, 93)}…` : m.body,
        message: m.body,
        at: m.createdAt,
        actor: fromPatient ? patientName : m.senderName,
        messageKind: m.kind,
      } satisfies PatientCommunication;
    });
}

export function activityStorageKey(consultationId: string): string {
  return `pharmacare:rx-activity:${consultationId}`;
}

export function readSessionActivity(consultationId: string): ActivityEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(activityStorageKey(consultationId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      normalizeActivityEvent(item as Record<string, unknown>),
    );
  } catch {
    return [];
  }
}

export function writeSessionActivity(
  consultationId: string,
  events: ActivityEvent[],
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      activityStorageKey(consultationId),
      JSON.stringify(events),
    );
  } catch {
    /* ignore */
  }
}

export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY_VALUE;
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Date and time for activity / message cards (en-GB). */
export function formatActivityDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return EMPTY_VALUE;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivityDateGroup(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "UNKNOWN DATE";
  return d
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

export function createActivityEvent(
  partial: Omit<ActivityEvent, "atIso" | "time"> & { atIso?: string },
): ActivityEvent {
  const atIso = partial.atIso ?? new Date().toISOString();
  return {
    ...partial,
    atIso,
    time: formatActivityDateTime(atIso),
  };
}

function normalizeActivityBodyForDedup(body: string): string {
  return body
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Collapse duplicate hold / wait-state rows (session log + DB-backed seed). */
function activityDedupKey(ev: ActivityEvent): string {
  const t = new Date(ev.atIso).getTime();
  const minuteBucket = Number.isNaN(t)
    ? ev.atIso
    : String(Math.floor(t / 60_000));

  const oncePerMinuteKinds: ActivityKind[] = [
    "cs_hold",
    "prescriber_hold",
    "declined",
    "approved",
    "pending_customer_response",
    "pending_document_upload",
  ];

  if (oncePerMinuteKinds.includes(ev.kind)) {
    const bodyKey = normalizeActivityBodyForDedup(ev.body).slice(0, 96);
    return `${ev.consultationId ?? ""}|${minuteBucket}|${ev.kind}|${ev.title}|${bodyKey}`;
  }

  return `${ev.consultationId ?? ""}|${ev.atIso}|${ev.kind}|${ev.title}|${ev.body.slice(0, 40)}`;
}

export function mergeActivityEvents(
  seed: ActivityEvent[],
  session: ActivityEvent[],
): ActivityEvent[] {
  const seen = new Set<string>();
  const all = [...session, ...seed];
  const out: ActivityEvent[] = [];
  for (const ev of all) {
    const key = activityDedupKey(ev);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }
  return out;
}

function tagEventsForOrder(
  events: ActivityEvent[],
  consultationId: string,
): ActivityEvent[] {
  return events.map((ev) =>
    ev.consultationId ? ev : { ...ev, consultationId },
  );
}

function eventsForConsultation(
  c: Consultation,
  communications: PatientCommunication[],
  session: ActivityEvent[],
): ActivityEvent[] {
  const orderPlacedMs = new Date(c.createdAt).getTime();
  const seed = buildConsultationActivitySeed(c, communications);
  const merged = mergeActivityEvents(seed, session).filter(
    (ev) =>
      !(
        ev.kind === "system" &&
        ev.title.toLowerCase() === "order generated"
      ),
  );
  const orderGenerated = activityOrderGeneratedEvent(c);
  return [orderGenerated, ...merged]
    .filter(
      (ev) =>
        ev.kind !== "order_started" &&
        !(
          ev.kind === "system" &&
          ev.title.toLowerCase().includes("consultation submitted")
        ),
    )
    .filter((ev) => {
      const t = new Date(ev.atIso).getTime();
      if (Number.isNaN(t)) return false;
      return t >= orderPlacedMs;
    })
    .sort(
      (a, b) => new Date(b.atIso).getTime() - new Date(a.atIso).getTime(),
    );
}

/** Groups activity by order (newest placed first). Viewed order is flagged isCurrent but not reordered. */
export function buildMultiOrderActivityTimeline(opts: {
  currentConsultationId: string;
  consultations: Consultation[];
  communicationsByConsultationId: Record<string, PatientCommunication[]>;
  sessionByConsultationId: Record<string, ActivityEvent[]>;
}): ActivityOrderSection[] {
  const {
    currentConsultationId,
    consultations,
    communicationsByConsultationId,
    sessionByConsultationId,
  } = opts;

  const byNewest = [...consultations].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return byNewest.map((c) => {
    const comms = communicationsByConsultationId[c.id] ?? [];
    const session = sessionByConsultationId[c.id] ?? [];
    const summary = buildOrderActivitySummary(c);
    const events = tagEventsForOrder(
      eventsForConsultation(c, comms, session),
      c.id,
    );

    return {
      consultationId: c.id,
      orderRef: summary.orderRef,
      placedAtIso: c.createdAt,
      placedAtLabel: summary.placedAtLabel,
      isCurrent: c.id === currentConsultationId,
      isRepeat: summary.isRepeat,
      summary,
      events,
    };
  });
}

/** Newest activity first within each day; newest days first. */
export function groupActivityEvents(
  events: ActivityEvent[],
): { date: string; events: ActivityEvent[] }[] {
  const byNewest = [...events].sort(
    (a, b) => new Date(b.atIso).getTime() - new Date(a.atIso).getTime(),
  );
  const map = new Map<string, ActivityEvent[]>();
  for (const ev of byNewest) {
    const date = formatActivityDateGroup(ev.atIso);
    const list = map.get(date) ?? [];
    list.push(ev);
    map.set(date, list);
  }
  return Array.from(map.entries())
    .map(([date, dayEvents]) => ({
      date,
      events: dayEvents,
      newestMs: Math.max(
        ...dayEvents.map((ev) => new Date(ev.atIso).getTime()),
      ),
    }))
    .sort((a, b) => b.newestMs - a.newestMs)
    .map(({ date, events: dayEvents }) => ({ date, events: dayEvents }));
}

export function buildConsultationActivitySeed(
  c: Consultation,
  communications: PatientCommunication[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const uploadedAt = (answers.patient_documents_uploaded_at ?? {}) as Record<
    string,
    string
  >;
  const patientDocs = getPatientDocumentUrls(c);
  type ReviewMeta = {
    status: string;
    reviewedBy?: string;
    reviewedAt?: string;
    uploadEmailSentAt?: string;
    rejectionNote?: string;
    rejectionTemplateTitle?: string;
  };
  const reviews = (answers.document_reviews ?? {}) as Record<string, ReviewMeta>;

  const requirementHistory = (answers.document_requirement_history ??
    []) as DocumentRequirementChange[];
  for (const change of requirementHistory) {
    if (
      change.slotId !== "previous-prescription" &&
      change.slotId !== "previous-bmi-verification"
    ) {
      continue;
    }
    const slotLabel =
      change.slotId === "previous-bmi-verification"
        ? "Previous BMI verification"
        : "Previous prescription";
    const title =
      change.to === "required"
        ? `${slotLabel} requirement changed to required`
        : `${slotLabel} requirement changed to not required`;
    events.push(
      createActivityEvent({
        atIso: change.at,
        kind: "system",
        consultationId: c.id,
        title,
        body: title,
        actor: change.by,
      }),
    );
  }

  for (const slotId of rxVisibleSlots(answers)) {
    const slot = {
      id: slotId,
      title: EVIDENCE_SLOT_META[slotId].title,
    };
    const url = patientDocs[slot.id];
    const uploadIso = uploadedAt[slot.id];
    const rev = reviews[slot.id];

    if (url && uploadIso) {
      const isReupload = Boolean(
        rev?.uploadEmailSentAt &&
          new Date(uploadIso).getTime() >
            new Date(rev.uploadEmailSentAt).getTime(),
      );
      if (!isReupload) {
        events.push(
          createActivityEvent({
            atIso: uploadIso,
            kind: "system",
            consultationId: c.id,
            title: "Patient uploaded document",
            body: `${slot.title} uploaded via patient questionnaire.`,
            actor: c.patientName,
          }),
        );
      } else {
        events.push(
          createActivityEvent({
            atIso: uploadIso,
            kind: "system",
            consultationId: c.id,
            title: `Patient re-uploaded ${slot.title}`,
            body: "New file received - pending pharmacist review.",
            actor: c.patientName,
          }),
        );
      }
    }

    if (rev?.reviewedAt && rev.status === "verified") {
      events.push(
        createActivityEvent({
          atIso: rev.reviewedAt,
          kind: "document_verified",
          consultationId: c.id,
          title: `${slot.title} verified`,
          body: "Document approved by prescriber.",
          actor: rev.reviewedBy ?? "Prescriber",
        }),
      );
    }
    if (rev?.reviewedAt && rev.status === "rejected") {
      const reason = rev.rejectionTemplateTitle
        ? ` (${rev.rejectionTemplateTitle})`
        : "";
      const emailLine = rev.uploadEmailSentAt
        ? "Document upload requested (email sent)."
        : "Awaiting patient re-upload.";
      events.push(
        createActivityEvent({
          atIso: rev.reviewedAt,
          kind: "document_rejected",
          consultationId: c.id,
          title: `Rejected ${slot.title}${reason}`,
          body: emailLine,
          expandableBody: rev.rejectionNote,
          actor: rev.reviewedBy ?? "Prescriber",
        }),
      );
    }
  }

  if (c.reviewedAt && c.status === "approved") {
    events.push(
      createActivityEvent({
        atIso: c.reviewedAt,
        kind: "system",
        consultationId: c.id,
        title: "Payment captured",
        body: "Order payment confirmed and prescription approved for dispensing.",
      }),
    );
  }

  const note = c.pharmacistNote ?? "";
  const reviewedAt =
    c.reviewedAt ?? (c as { updatedAt?: string }).updatedAt ?? c.createdAt;

  if (note.startsWith("[CS_HOLD]")) {
    const msg = note.replace(/^\[CS_HOLD\]\s*/i, "").trim();
    events.push(
      createActivityEvent({
        atIso: reviewedAt,
        kind: "cs_hold",
        consultationId: c.id,
        title: "Placed on CS Hold",
        body: msg || "Order placed on clinical support hold.",
        expandableBody: msg,
        actor: c.reviewedBy ?? "Staff",
      }),
    );
  }
  if (note.startsWith("[PRESCRIBER_HOLD]")) {
    const msg = note.replace(/^\[PRESCRIBER_HOLD\]\s*/i, "").trim();
    events.push(
      createActivityEvent({
        atIso: reviewedAt,
        kind: "prescriber_hold",
        consultationId: c.id,
        title: "Placed on Prescriber Hold",
        body: msg || "Order placed on prescriber hold.",
        expandableBody: msg,
        actor: c.reviewedBy ?? "Prescriber",
      }),
    );
  }

  if (c.status === "rejected" && c.reviewedAt) {
    events.push(
      createActivityEvent({
        atIso: c.reviewedAt,
        kind: "declined",
        consultationId: c.id,
        title: "Prescription declined",
        body: note || "Order rejected and refund initiated.",
        expandableBody: note || undefined,
        actor: c.reviewedBy ?? "Prescriber",
      }),
    );
  }

  for (const comm of communications) {
    if (!isPatientReplyCommunication(comm)) continue;

    const isOut = comm.direction === "outgoing";
    events.push(
      createActivityEvent({
        atIso: comm.at,
        kind: isOut ? "message_out" : "message_in",
        consultationId: c.id,
        title: isOut ? `Message sent to ${c.patientName}` : comm.title,
        body: comm.preview,
        expandableBody: comm.message,
        actor: comm.actor,
      }),
    );
  }

  for (const tag of deriveWaitTagsFromConsultation(c)) {
    if (tag.source === "message") continue;
    events.push(activityForWaitTag(tag, c.reviewedBy ?? "Staff"));
  }

  for (const te of orderTagActivityEvents(c)) {
    events.push(
      createActivityEvent({
        atIso: te.atIso,
        kind: te.kind,
        consultationId: c.id,
        title: te.title,
        body: te.body,
        tagLabel: te.tagLabel,
        expandableBody: te.note,
      }),
    );
  }

  return events;
}

export function activityForTabVerified(
  tabId: string,
  verifiedAt: string,
  pharmacistName: string,
): ActivityEvent {
  return createActivityEvent({
    atIso: verifiedAt,
    kind: "tab_verified",
    title: `${TAB_LABELS[tabId] ?? tabId} marked complete`,
    body: `Review section verified and signed off.`,
    actor: pharmacistName,
  });
}

export function formatPrescriptionItemLabel(item: {
  name?: string;
  strength?: string;
  quantity?: string | number;
}): string {
  const name = (item.name ?? "").trim();
  const strength = (item.strength ?? "").trim();
  const qty = String(item.quantity ?? "1").trim();
  const qtySuffix = qty && qty !== "1" ? ` | Qty ${qty}` : "";
  if (!name && !strength) return EMPTY_VALUE;
  return `${name}${strength ? ` ${strength}` : ""}${qtySuffix}`.trim();
}

export function diffPrescriptionItemChanges(
  before: Record<string, string | undefined>,
  after: Record<string, string | undefined>,
): Array<{ field: string; from: string; to: string }> {
  const fields: Array<{ key: string; label: string }> = [
    { key: "name", label: "Product" },
    { key: "strength", label: "Strength" },
    { key: "form", label: "Form" },
    { key: "quantity", label: "Quantity" },
    { key: "sig", label: "Directions" },
    { key: "duration", label: "Duration" },
  ];
  return fields
    .map(({ key, label }) => ({
      field: label,
      from: String(before[key] ?? "").trim(),
      to: String(after[key] ?? "").trim(),
    }))
    .filter((ch) => ch.from !== ch.to);
}

export function activityForMedicationChange(
  input:
    | { fromLabel: string; toLabel: string }
    | { changes: Array<{ field: string; from: string; to: string }> },
  pharmacistName: string,
): ActivityEvent {
  if ("fromLabel" in input) {
    return createActivityEvent({
      kind: "medication_change",
      title: "Prescribed medication changed",
      body: `"${input.fromLabel || EMPTY_VALUE}" -> "${input.toLabel || EMPTY_VALUE}"`,
      actor: pharmacistName,
    });
  }

  const lines = input.changes.map(
    (ch) => `- ${ch.field}: "${ch.from || EMPTY_VALUE}" -> "${ch.to || EMPTY_VALUE}"`,
  );
  return createActivityEvent({
    kind: "medication_change",
    title: "Prescribed medication updated",
    body: `${input.changes.length} field${input.changes.length === 1 ? "" : "s"} changed on the prescription item.`,
    expandableBody: lines.join("\n"),
    actor: pharmacistName,
  });
}

export function activityForProfileEdits(
  changes: Array<{ field: string; from: string; to: string }>,
  editedBy: string,
): ActivityEvent {
  const lines = changes.map(
    (ch) => `- ${ch.field}: "${ch.from || EMPTY_VALUE}" -> "${ch.to || EMPTY_VALUE}"`,
  );
  return createActivityEvent({
    kind: "profile_edit",
    title: "Patient record updated",
    body: `${changes.length} field${changes.length === 1 ? "" : "s"} changed on the patient profile.`,
    expandableBody: lines.join("\n"),
    actor: editedBy,
  });
}

export function activityForDocumentRequirementChange(
  requirement: "required" | "not_required",
  pharmacistName: string,
): ActivityEvent {
  const title =
    requirement === "required"
      ? "Previous prescription requirement changed to required"
      : "Previous prescription requirement changed to not required";
  return createActivityEvent({
    kind: "system",
    title,
    body: title,
    actor: pharmacistName,
  });
}

export function activityForDocumentReview(
  docTitle: string,
  status: "verified" | "rejected",
  pharmacistName: string,
  opts?: {
    emailSent?: boolean;
    note?: string;
    templateTitle?: string;
  },
): ActivityEvent {
  if (status === "verified") {
    return createActivityEvent({
      kind: "document_verified",
      title: "Document verified",
      body: `${docTitle} approved by prescriber.`,
      actor: pharmacistName,
    });
  }
  const reason = opts?.templateTitle ? ` (${opts.templateTitle})` : "";
  const emailLine = opts?.emailSent
    ? "Document upload requested (email sent)."
    : "Awaiting patient re-upload.";
  return createActivityEvent({
    kind: "document_rejected",
    title: `Rejected ${docTitle}${reason}`,
    body: emailLine,
    expandableBody: opts?.note,
    actor: pharmacistName,
  });
}

export function activityForWaitTag(
  tag: CustomerWaitTag,
  actor?: string,
): ActivityEvent {
  return createActivityEvent({
    atIso: tag.createdAt,
    kind: tag.kind,
    title: tag.label,
    body: tag.detail,
    expandableBody: tag.detail,
    actor,
  });
}

export function activityForUploadLinkSent(
  docTitle: string,
  pharmacistName: string,
  emailSent?: boolean,
  note?: string,
): ActivityEvent {
  const detail = `${docTitle} — ${emailSent ? "document upload requested (email sent)" : "document upload requested, awaiting patient upload"}.`;
  return createActivityEvent({
    kind: "pending_document_upload",
    title: "Pending document upload",
    body: detail,
    expandableBody: note?.trim() || detail,
    actor: pharmacistName,
  });
}

export function activityForPrescriptionApproved(
  pharmacistName: string,
  note?: string,
): ActivityEvent {
  return createActivityEvent({
    kind: "approved",
    title: "Prescription approved",
    body: note?.trim() || "Approved after completing the full clinical checklist.",
    expandableBody: note?.trim() || undefined,
    actor: pharmacistName,
  });
}

/** Readable one-line copy for tag_added / tag_removed activity cards. */
export function resolveTagActivitySentence(ev: ActivityEvent): {
  label: string;
  actionPhrase: "tag removed" | "tag added";
  actorPhrase: string;
  note?: string;
} | null {
  if (ev.kind !== "tag_added" && ev.kind !== "tag_removed") return null;

  const actionPhrase =
    ev.kind === "tag_removed" ? ("tag removed" as const) : ("tag added" as const);

  const note =
    ev.expandableBody?.trim() ||
    ev.body.match(/(?:^|\s·\s*)Note:\s*(.+)$/i)?.[1]?.trim() ||
    undefined;

  if (ev.tagLabel) {
    const actorFromBody = ev.body.match(
      /\btag (?:removed|added) by (.+?)(?:\s*·\s*Note:|$)/i,
    );
    const actor = actorFromBody?.[1]?.trim() || ev.actor || "Staff";
    return {
      label: ev.tagLabel,
      actionPhrase,
      actorPhrase: `by ${actor}`,
      note,
    };
  }

  if (ev.kind === "tag_removed") {
    const label =
      ev.title.replace(/\s+tag was removed\s*$/i, "").trim() || ev.title;
    const actor =
      ev.body
        .replace(/^by\s+/i, "")
        .split(/\s*·\s*/)[0]
        ?.trim() ||
      ev.actor ||
      "Staff";
    return { label, actionPhrase, actorPhrase: `by ${actor}`, note };
  }

  const label = ev.title.replace(/^Tag added:\s*/i, "").trim() || ev.title;
  const actor =
    ev.body
      .replace(/^Added by\s+/i, "")
      .split(/\s*·\s*/)[0]
      ?.trim() ||
    ev.actor ||
    "Staff";
  return { label, actionPhrase, actorPhrase: `by ${actor}`, note };
}

export function activityForOrderTagsBatchAdd(
  labels: string[],
  pharmacistName: string,
  note?: string,
): ActivityEvent {
  const copy = formatOrderTagsBatchAddActivityCopy(
    labels,
    pharmacistName,
    note,
  );
  return createActivityEvent({
    kind: "tag_added",
    title: copy.title,
    body: copy.body,
    tagLabel: copy.tagLabel,
    expandableBody: copy.note,
    actor: pharmacistName,
  });
}

export function activityForOrderTagsBatchRemove(
  labels: string[],
  pharmacistName: string,
  note?: string,
): ActivityEvent {
  const copy = formatOrderTagsBatchRemoveActivityCopy(
    labels,
    pharmacistName,
    note,
  );
  return createActivityEvent({
    kind: "tag_removed",
    title: copy.title,
    body: copy.body,
    tagLabel: copy.tagLabel,
    expandableBody: copy.note,
    actor: pharmacistName,
  });
}

export function activityForOrderTagChange(
  action: "add" | "remove",
  label: string,
  pharmacistName: string,
  note?: string,
): ActivityEvent {
  const copy = formatOrderTagActivityCopy(action, label, pharmacistName, note);
  return createActivityEvent({
    kind: action === "remove" ? "tag_removed" : "tag_added",
    title: copy.title,
    body: copy.body,
    tagLabel: copy.tagLabel,
    expandableBody: copy.note,
  });
}

export function activityForUrgent(
  pharmacistName: string,
  removed = false,
): ActivityEvent {
  return createActivityEvent({
    kind: "urgent",
    title: removed ? "Urgent flag removed" : "Marked as urgent",
    body: removed
      ? "Order returned to normal priority - urgent flag cleared."
      : "Order flagged as urgent and moved to the top of the review queue.",
    actor: pharmacistName,
  });
}

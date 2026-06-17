import type { Consultation, PrescriptionItem } from "@workspace/api-client-react";
import {
  getStoredPmrStatus,
  setPmrStatus,
  uiStatusToServer,
  type PmrWorkflowStatus,
} from "@/lib/pmrStatus";

/** Client-only demo Rx synced from Rx portal shape — dev board testing */
export type BoardDemoConsultation = Consultation & {
  consultationNumber: string;
};

const DEMO_SEED_KEY = "everydaymeds:pmr-demo-board-v3";
const API_INBOX_SEED_KEY = "everydaymeds:pmr-api-inbox-v2";

/** Approved DB consultation IDs seeded with pmrWorkflowStatus=inbox (PDF via API). */
export const API_SEED_INBOX_IDS = [
  "mostafa-mj-clinical-check",
  "mostafa-mj-inbox-today",
  "mostafa-mj-inbox-wegovy",
  "pmr-inbox-shore-diabetes",
  "pmr-inbox-foster-mounjaro",
  "pmr-inbox-mensah-wegovy",
] as const;


function isoAt(daysAgo: number, hour = 10, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function items(
  lines: Array<{
    name: string;
    strength: string;
    form: string;
    quantity: string;
    sig: string;
    duration?: string;
  }>,
): PrescriptionItem[] {
  return lines.map((line) => ({
    name: line.name,
    strength: line.strength,
    form: line.form,
    quantity: line.quantity,
    sig: line.sig,
    duration: line.duration ?? "28 days",
    notes: null,
  }));
}

function baseConsultation(
  partial: Omit<
    BoardDemoConsultation,
    | "status"
    | "answers"
    | "hasRedFlag"
    | "hasPhoto"
    | "createdAt"
    | "updatedAt"
  > & {
    status?: Consultation["status"];
    answers?: Consultation["answers"];
    hasRedFlag?: boolean;
    hasPhoto?: boolean;
    createdAt?: string;
    updatedAt?: string;
  },
): BoardDemoConsultation {
  const reviewedAt = partial.reviewedAt ?? isoAt(1, 14, 0);
  return {
    answers: {},
    status: "approved",
    hasRedFlag: false,
    hasPhoto: true,
    photoUrls: [],
    pharmacistNote: null,
    prescription: null,
    referralInfo: null,
    gpName: "Dr Sarah Mitchell",
    gpSurgery: "Leicester City Health Centre",
    gpAddress: "12 Granby Street, Leicester LE1 6FD",
    gpPhone: "0116 123 4567",
    hasRegularGp: true,
    consentShareWithGp: true,
    consentToTreatment: true,
    consentToDelivery: true,
    consentDataProcessing: true,
    identityVerificationMethod: "video",
    identityVerificationRef: "IDV-DEMO",
    allergies: null,
    currentMedications: null,
    medicalHistory: null,
    isPregnant: false,
    reviewedBy: "Pharmacist Sarah Wells",
    clinicalDecisionRationale: "Approved following clinical review in Rx portal.",
    createdAt: reviewedAt,
    updatedAt: reviewedAt,
    ...partial,
  };
}

/** Demo prescriptions — one batch per board column (+ extras for Waiting/Today) */
export const BOARD_DEMO_CONSULTATIONS: BoardDemoConsultation[] = [
  // —— Check ——
  baseConsultation({
    id: "demo-board-check-1",
    consultationNumber: "CON-20260617-0001",
    patientName: "Mr Mostafa Damghani",
    patientEmail: "mostafa.damghani.md@gmail.com",
    patientAge: 34,
    patientSex: "male",
    conditionId: "weight-loss",
    conditionName: "Mounjaro (Tirzepatide) — Weight Management",
    reviewedAt: isoAt(0, 9, 15),
    deliveryAddressLine1: "109 Coleman Road",
    deliveryCity: "Leicester",
    deliveryPostcode: "LE5 4LE",
    deliveryAddress: "109 Coleman Road, Leicester LE5 4LE",
    preferredDeliveryMethod: "tracked_48",
    prescriptionItems: items([
      {
        name: "Mounjaro",
        strength: "2.5mg",
        form: "injection",
        quantity: "1",
        sig: "Inject 2.5mg subcutaneously once weekly",
      },
    ]),
    pharmacistNote: "First supply — counsel on injection technique.",
  }),
  baseConsultation({
    id: "demo-board-check-2",
    consultationNumber: "CON-20260610-0014",
    patientName: "Mrs Grace Mensah",
    patientEmail: "grace.mensah.demo@everydaymeds.test",
    patientAge: 41,
    patientSex: "female",
    conditionId: "weight-loss",
    conditionName: "Wegovy (Semaglutide) — Weight Management",
    reviewedAt: isoAt(3, 11, 40),
    deliveryAddressLine1: "22 Narborough Road",
    deliveryCity: "Leicester",
    deliveryPostcode: "LE3 0BQ",
    deliveryAddress: "22 Narborough Road, Leicester LE3 0BQ",
    prescriptionItems: items([
      {
        name: "Wegovy",
        strength: "0.25mg",
        form: "injection",
        quantity: "1",
        sig: "Inject 0.25mg subcutaneously once weekly",
      },
    ]),
    hasRedFlag: true,
    pharmacistNote: "Urgent — patient travelling Friday.",
  }),

  // Inbox column uses real DB seeds (seed-pmr-inbox / seed-mostafa-scenarios) for PDF preview.

  // —— Parked ——
  baseConsultation({
    id: "demo-board-parked-1",
    consultationNumber: "CON-20260612-0040",
    patientName: "Mrs Janelle Tregilgas",
    patientEmail: "janelle.tregilgas.demo@everydaymeds.test",
    patientAge: 52,
    patientSex: "female",
    conditionId: "nutrition",
    conditionName: "Nutritional supplements — oncology support",
    reviewedAt: isoAt(5, 13, 0),
    deliveryAddressLine1: "14 Belgrave Gate",
    deliveryCity: "Leicester",
    deliveryPostcode: "LE1 3XL",
    deliveryAddress: "14 Belgrave Gate, Leicester LE1 3XL",
    prescriptionItems: items([
      {
        name: "Forticreme Complete dessert",
        strength: "",
        form: "sachets",
        quantity: "7000 gram",
        sig: "Two to be eaten daily",
        duration: "28 days",
      },
      {
        name: "DuoResp Spiromax",
        strength: "160/4.5mcg",
        form: "inhaler",
        quantity: "1",
        sig: "Inhale one puff twice daily",
      },
    ]),
    pharmacistNote: "Parked — awaiting patient callback re delivery slot.",
  }),
  baseConsultation({
    id: "demo-board-parked-2",
    consultationNumber: "CON-20260608-0048",
    patientName: "Mr Layne Awan",
    patientEmail: "layne.awan.demo@everydaymeds.test",
    patientAge: 45,
    patientSex: "male",
    conditionId: "respiratory",
    conditionName: "Acute asthma exacerbation",
    reviewedAt: isoAt(9, 10, 25),
    deliveryAddressLine1: "3 Meridian Business Park",
    deliveryCity: "Leicester",
    deliveryPostcode: "LE19 1RJ",
    deliveryAddress: "3 Meridian Business Park, Leicester LE19 1RJ",
    prescriptionItems: items([
      {
        name: "Prednisolone",
        strength: "5mg",
        form: "tablets",
        quantity: "28",
        sig: "Take six tablets once daily for 5 days",
        duration: "5 days",
      },
    ]),
  }),

  // —— Pick ——
  baseConsultation({
    id: "demo-board-pick-1",
    consultationNumber: "CON-20260614-0055",
    patientName: "Mrs Priya Sharma",
    patientEmail: "priya.sharma.demo@everydaymeds.test",
    patientAge: 36,
    patientSex: "female",
    conditionId: "weight-loss",
    conditionName: "Mounjaro (Tirzepatide) — Weight Management",
    reviewedAt: isoAt(2, 15, 45),
    deliveryAddressLine1: "67 London Road",
    deliveryCity: "Leicester",
    deliveryPostcode: "LE2 0QP",
    deliveryAddress: "67 London Road, Leicester LE2 0QP",
    prescriptionItems: items([
      {
        name: "Mounjaro",
        strength: "10mg",
        form: "injection",
        quantity: "1",
        sig: "Inject 10mg subcutaneously once weekly",
      },
    ]),
  }),
  baseConsultation({
    id: "demo-board-pick-2",
    consultationNumber: "CON-20260613-0062",
    patientName: "Mr Daniel Okonkwo",
    patientEmail: "daniel.okonkwo.demo@everydaymeds.test",
    patientAge: 48,
    patientSex: "male",
    conditionId: "pain_minor_illness",
    conditionName: "Acute lower back pain",
    reviewedAt: isoAt(0, 11, 30),
    deliveryAddressLine1: "101 Welford Road",
    deliveryCity: "Leicester",
    deliveryPostcode: "LE2 6BL",
    deliveryAddress: "101 Welford Road, Leicester LE2 6BL",
    prescriptionItems: items([
      {
        name: "Naproxen",
        strength: "250mg",
        form: "tablets",
        quantity: "28",
        sig: "Take one tablet twice daily after food",
      },
      {
        name: "Omeprazole",
        strength: "20mg",
        form: "capsules",
        quantity: "28",
        sig: "Take one capsule each morning",
      },
    ]),
  }),
];

const DEMO_BOARD_STATUS: Record<string, PmrWorkflowStatus> = {
  "demo-board-check-1": "awaiting_check",
  "demo-board-check-2": "awaiting_check",
  "demo-board-parked-1": "parked",
  "demo-board-parked-2": "parked",
  "demo-board-pick-1": "pick",
  "demo-board-pick-2": "pick",
};

export function isBoardDemoEnabled(): boolean {
  if (import.meta.env.VITE_PMR_DEMO_BOARD === "false") return false;
  return import.meta.env.DEV || import.meta.env.VITE_PMR_DEMO_BOARD === "true";
}

export function getBoardDemoConsultations(): BoardDemoConsultation[] {
  if (!isBoardDemoEnabled()) return [];
  return BOARD_DEMO_CONSULTATIONS;
}

/** Place demo Rx on each board column (runs once per browser). */
export function ensureBoardDemoStatuses(): void {
  if (!isBoardDemoEnabled() || typeof window === "undefined") return;
  try {
    if (localStorage.getItem(DEMO_SEED_KEY) === "1") return;
    for (const [id, status] of Object.entries(DEMO_BOARD_STATUS)) {
      setPmrStatus(id, status);
    }
    localStorage.setItem(DEMO_SEED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function mergeApprovedWithBoardDemos(
  apiConsultations: Consultation[],
): Consultation[] {
  const demos = getBoardDemoConsultations();
  if (demos.length === 0) return apiConsultations;
  const seen = new Set(apiConsultations.map((c) => c.id));
  const extra = demos
    .filter((d) => !seen.has(d.id))
    .map((d) => {
      const uiStatus = DEMO_BOARD_STATUS[d.id] ?? getStoredPmrStatus(d.id);
      if (!uiStatus) return d;
      return {
        ...d,
        pmrWorkflowStatus: uiStatusToServer(uiStatus),
        rxClinicalCheckComplete:
          uiStatus === "pick" && d.id === "demo-board-pick-1",
      };
    });
  return [...apiConsultations, ...extra];
}

/**
 * Fallback when DB rows lack pmrWorkflowStatus — place seeded API Rx in Inbox once.
 * Skips IDs the user has already moved on the board.
 */
export function ensureApiSeedInboxStatuses(approved: Consultation[]): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(API_INBOX_SEED_KEY) === "1") return;
    const approvedIds = new Set(approved.map((c) => c.id));
    for (const id of API_SEED_INBOX_IDS) {
      if (!approvedIds.has(id) || getStoredPmrStatus(id)) continue;
      const row = approved.find((c) => c.id === id);
      if (row?.pmrWorkflowStatus) continue;
      setPmrStatus(id, "awaiting_check");
    }
    localStorage.setItem(API_INBOX_SEED_KEY, "1");
  } catch {
    /* ignore */
  }
}

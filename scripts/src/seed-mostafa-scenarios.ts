/**
 * Wipes all consultations/orders, then seeds GLP-1 scenario orders for Mostafa Damghani only.
 *
 *   pnpm --filter @workspace/scripts run sync-db-schema
 *   pnpm --filter @workspace/scripts run seed-mostafa-scenarios
 */
import {
  db,
  pool,
  consultationsTable,
  consultationMessagesTable,
  consultationActionsTable,
  notificationsTable,
  ordersTable,
  orderItemsTable,
  deliveriesTable,
  patientAccountsTable,
  pharmacistNotesTable,
  commsLogTable,
  complaintsTable,
} from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

const PATIENT_EMAIL = "mostafa.damghani.md@gmail.com";
const PATIENT_NAME = "Mostafa Damghani";
const PATIENT_AGE = 34;
const PATIENT_SEX = "male";
const PATIENT_DOB = "1991-06-15";
const PASSWORD = "Pharmacy1!";
const ID_PREFIX = "mostafa-mj-";
const HEIGHT_CM = 178;
const REVIEWER = "Pharmacist Sarah Wells";

const CONDITION_MOUNJARO = {
  id: "weight-loss",
  name: "Mounjaro (Tirzepatide) — Weight Management",
  medication: "Mounjaro" as const,
};
const CONDITION_WEGOVY = {
  id: "weight-loss",
  name: "Wegovy (Semaglutide) — Weight Management",
  medication: "Wegovy" as const,
};

const SLOT_IDS = [
  "government-id",
  "full-body-video",
  "weight-scale-video",
  "previous-prescription",
  "supporting-evidence",
] as const;

type OrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "more_info_needed"
  | "patient_responded"
  | "red_flag";

type CustomerType = "new_start" | "transfer" | "simple_repeat";

type ScenarioOrder = {
  id: string;
  daysAgo: number;
  hoursAgo?: number;
  dose: string;
  med: "Mounjaro" | "Wegovy";
  status: OrderStatus;
  customerType: CustomerType;
  previousId?: string;
  weightKg: number;
  pharmacistNote?: string;
  hasRedFlag?: boolean;
  dispatched?: boolean;
  docMode: "all_verified" | "rejected_scale" | "uploaded_pending_review";
  previousProvider?: string;
};

const DEMO_DOC = (label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect fill="#ecfdf5" width="480" height="360"/><text x="240" y="180" text-anchor="middle" font-size="16" fill="#047857">${label}</text></svg>`,
  )}`;

function ts(daysAgo: number, hoursAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d;
}

function bmiFor(weightKg: number): number {
  const h = HEIGHT_CM / 100;
  return Math.round(weightKg / (h * h));
}

function glpAnswers(opts: {
  med: "Mounjaro" | "Wegovy";
  customerType: CustomerType;
  dose: string;
  weightKg: number;
  repeatCount: number;
  previousProvider?: string;
}) {
  return {
    sex_at_birth: "Male",
    aged_18_to_75: "Yes",
    pregnant_breastfeeding: "No",
    glp1_allergy: "No",
    thyroid_cancer_men2_history: "No",
    eating_disorder_history: "No",
    contraindicated_conditions: "No",
    type2_diabetes_other_meds: "No",
    current_medications_other: "No",
    previous_health_conditions: "No",
    oral_contraceptive: "No",
    new_to_injectable: opts.customerType === "new_start" ? "Yes" : "No",
    consent_confirm: "Yes",
    consent_gp_share: "Yes",
    gp_name: "North London Medical Centre",
    gp_address: "42 Holloway Road, London N7 8JG",
    requested_medication: opts.med,
    consultation_type: opts.customerType,
    current_dose: `${opts.med} ${opts.dose}`,
    previous_provider: opts.previousProvider ?? null,
    height_cm: HEIGHT_CM,
    weight_kg: opts.weightKg,
    bmi: bmiFor(opts.weightKg),
    weight_loss_goal: "Reach a healthier weight with pharmacist support",
    prior_mounjaro_supply_count:
      opts.repeatCount > 0 ? opts.repeatCount : undefined,
  };
}

function documentBundle(
  createdAt: Date,
  mode: ScenarioOrder["docMode"],
): Record<string, unknown> {
  const uploadIso = new Date(createdAt.getTime() + 12 * 60 * 1000).toISOString();
  const reviewIso = new Date(createdAt.getTime() + 3 * 60 * 60 * 1000).toISOString();
  const patient_documents: Record<string, string> = {};
  const patient_documents_uploaded_at: Record<string, string> = {};
  const document_reviews: Record<string, Record<string, string>> = {};

  for (const slot of SLOT_IDS) {
    patient_documents[slot] = DEMO_DOC(slot);
    patient_documents_uploaded_at[slot] = uploadIso;

    if (mode === "all_verified") {
      document_reviews[slot] = {
        status: "verified",
        reviewedBy: REVIEWER,
        reviewedAt: reviewIso,
      };
    } else if (mode === "rejected_scale" && slot === "weight-scale-video") {
      document_reviews[slot] = {
        status: "rejected",
        reviewedBy: REVIEWER,
        reviewedAt: reviewIso,
        rejectionNote: "Scale reading not visible — please re-record with feet on scales.",
        rejectionTemplateTitle: "Weight video unclear",
        uploadEmailSentAt: reviewIso,
      };
    } else if (mode === "uploaded_pending_review") {
      /* no document_reviews entry — awaiting pharmacist verify */
    } else {
      document_reviews[slot] = {
        status: "verified",
        reviewedBy: REVIEWER,
        reviewedAt: reviewIso,
      };
    }
  }

  return {
    patient_documents,
    patient_documents_uploaded_at,
    document_reviews,
    photoUrls: SLOT_IDS.map((s) => DEMO_DOC(s)),
  };
}

function prescriptionItems(med: string, dose: string) {
  return [
    {
      name: med === "Wegovy" ? "Semaglutide (Wegovy)" : "Tirzepatide (Mounjaro)",
      strength: dose,
      form: "Solution for injection in pre-filled pen",
      quantity: "4 pens",
      sig: "Inject ONE pen subcutaneously once weekly.",
      duration: "4 weeks",
    },
  ];
}

/** All scenario rows — priors first so FK previousConsultationId resolves. */
const ORDERS: ScenarioOrder[] = [
  // —— Weight loss ≥10% chain (100 kg → 88 kg over ~30 days) ——
  {
    id: `${ID_PREFIX}wt-loss-prior`,
    daysAgo: 32,
    dose: "2.5mg",
    med: "Mounjaro",
    status: "approved",
    customerType: "new_start",
    weightKg: 100,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}wt-loss-current`,
    daysAgo: 2,
    hoursAgo: 4,
    dose: "5mg",
    med: "Mounjaro",
    status: "pending",
    customerType: "simple_repeat",
    previousId: `${ID_PREFIX}wt-loss-prior`,
    weightKg: 88,
    docMode: "all_verified",
  },
  // —— Weight gain ≥7% chain (90 kg → 97 kg) ——
  {
    id: `${ID_PREFIX}wt-gain-prior`,
    daysAgo: 31,
    dose: "5mg",
    med: "Mounjaro",
    status: "approved",
    customerType: "simple_repeat",
    weightKg: 90,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}wt-gain-current`,
    daysAgo: 3,
    dose: "7.5mg",
    med: "Mounjaro",
    status: "pending",
    customerType: "simple_repeat",
    previousId: `${ID_PREFIX}wt-gain-prior`,
    weightKg: 97,
    docMode: "all_verified",
  },
  // —— Transfer (prior approved + transfer hold) ——
  {
    id: `${ID_PREFIX}transfer-prior`,
    daysAgo: 90,
    dose: "5mg",
    med: "Mounjaro",
    status: "approved",
    customerType: "simple_repeat",
    weightKg: 94,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}transfer-current`,
    daysAgo: 5,
    dose: "7.5mg",
    med: "Mounjaro",
    status: "more_info_needed",
    customerType: "transfer",
    previousId: `${ID_PREFIX}transfer-prior`,
    weightKg: 91,
    previousProvider: "LloydsOnlineDoctor",
    pharmacistNote:
      "Transfer from Lloyds — please confirm last dispensed pen label matches 7.5mg before we authorise.",
    docMode: "all_verified",
  },
  // —— Single-order scenarios ——
  {
    id: `${ID_PREFIX}new-starter-all-docs`,
    daysAgo: 1,
    hoursAgo: 2,
    dose: "2.5mg",
    med: "Mounjaro",
    status: "pending",
    customerType: "new_start",
    weightKg: 102,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}repeat-pending`,
    daysAgo: 8,
    dose: "5mg",
    med: "Mounjaro",
    status: "pending",
    customerType: "simple_repeat",
    previousId: `${ID_PREFIX}wt-loss-prior`,
    weightKg: 92,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}prescriber-hold`,
    daysAgo: 6,
    dose: "5mg",
    med: "Mounjaro",
    status: "more_info_needed",
    customerType: "simple_repeat",
    previousId: `${ID_PREFIX}wt-gain-prior`,
    weightKg: 93,
    pharmacistNote:
      "[PRESCRIBER_HOLD] Please confirm no new cardiovascular symptoms since your last supply.",
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}cs-hold`,
    daysAgo: 7,
    dose: "2.5mg",
    med: "Mounjaro",
    status: "more_info_needed",
    customerType: "new_start",
    weightKg: 99,
    pharmacistNote:
      "[CS_HOLD] Customer service — awaiting patient reply about delivery address change.",
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}doc-rejected`,
    daysAgo: 4,
    hoursAgo: 6,
    dose: "2.5mg",
    med: "Mounjaro",
    status: "pending",
    customerType: "new_start",
    weightKg: 101,
    docMode: "rejected_scale",
  },
  {
    id: `${ID_PREFIX}re-review`,
    daysAgo: 9,
    dose: "5mg",
    med: "Mounjaro",
    status: "patient_responded",
    customerType: "transfer",
    previousId: `${ID_PREFIX}transfer-prior`,
    weightKg: 90,
    previousProvider: "Boots Online",
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}urgent-red-flag`,
    daysAgo: 12,
    dose: "10mg",
    med: "Mounjaro",
    status: "red_flag",
    customerType: "simple_repeat",
    previousId: `${ID_PREFIX}transfer-prior`,
    weightKg: 88,
    hasRedFlag: true,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}wegovy-new`,
    daysAgo: 2,
    hoursAgo: 8,
    dose: "0.25mg",
    med: "Wegovy",
    status: "pending",
    customerType: "new_start",
    weightKg: 96,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}clinical-check`,
    daysAgo: 14,
    dose: "5mg",
    med: "Mounjaro",
    status: "approved",
    customerType: "simple_repeat",
    previousId: `${ID_PREFIX}transfer-prior`,
    weightKg: 89,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}urgent-dispatch`,
    daysAgo: 16,
    dose: "2.5mg",
    med: "Mounjaro",
    status: "approved",
    customerType: "new_start",
    weightKg: 98,
    dispatched: true,
    docMode: "all_verified",
  },
  {
    id: `${ID_PREFIX}more-info-docs`,
    daysAgo: 10,
    dose: "7.5mg",
    med: "Mounjaro",
    status: "more_info_needed",
    customerType: "simple_repeat",
    previousId: `${ID_PREFIX}wt-loss-prior`,
    weightKg: 87,
    pharmacistNote: "Please upload a clearer full-body photo in daylight.",
    docMode: "uploaded_pending_review",
  },
];

async function wipeDatabase() {
  console.log("Wiping all consultations, orders, and related data…");
  await db.delete(consultationMessagesTable);
  await db.delete(consultationActionsTable);
  await db.delete(notificationsTable);
  await db.delete(deliveriesTable);
  await db.delete(orderItemsTable);
  await db.delete(ordersTable);
  await db.delete(consultationsTable);
  await db.delete(pharmacistNotesTable);
  await db.delete(commsLogTable);
  await db.delete(complaintsTable);
  await db.delete(patientAccountsTable).where(
    ne(patientAccountsTable.email, PATIENT_EMAIL.toLowerCase()),
  );
  console.log("Database cleared (only Mostafa patient account retained).");
}

async function ensureMostafaAccount() {
  const email = PATIENT_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [existing] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.email, email));

  if (existing) {
    await db
      .update(patientAccountsTable)
      .set({
        name: PATIENT_NAME,
        dateOfBirth: PATIENT_DOB,
        sex: PATIENT_SEX,
        phone: "07700900123",
        addressLine1: "42 Harley Street",
        city: "London",
        postcode: "W1G 9PB",
      })
      .where(eq(patientAccountsTable.email, email));
    console.log(`Updated patient account: ${email}`);
    return;
  }

  await db.insert(patientAccountsTable).values({
    id: "patient-mostafa",
    name: PATIENT_NAME,
    email,
    passwordHash,
    dateOfBirth: PATIENT_DOB,
    sex: PATIENT_SEX,
    phone: "07700900123",
    addressLine1: "42 Harley Street",
    city: "London",
    postcode: "W1G 9PB",
  });
  console.log(`Created patient account: ${email} (password: ${PASSWORD})`);
}

async function seedOrder(order: ScenarioOrder, repeatIndex: number) {
  const cond =
    order.med === "Wegovy" ? CONDITION_WEGOVY : CONDITION_MOUNJARO;
  const createdAt = ts(order.daysAgo, order.hoursAgo ?? 0);
  const reviewedAt =
    order.status === "approved" ||
    order.status === "rejected" ||
    order.status === "more_info_needed"
      ? new Date(createdAt.getTime() + 20 * 60 * 60 * 1000)
      : null;
  const docs = documentBundle(createdAt, order.docMode);
  const dispatchedAt = order.dispatched
    ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000)
    : null;

  await db.insert(consultationsTable).values({
    id: order.id,
    patientName: PATIENT_NAME,
    patientEmail: PATIENT_EMAIL.toLowerCase(),
    patientAge: PATIENT_AGE,
    patientSex: PATIENT_SEX,
    patientDateOfBirth: PATIENT_DOB,
    conditionId: cond.id,
    conditionName: cond.name,
    status: order.status,
    answers: {
      ...glpAnswers({
        med: order.med,
        customerType: order.customerType,
        dose: order.dose,
        weightKg: order.weightKg,
        repeatCount: repeatIndex,
        previousProvider: order.previousProvider,
      }),
      ...docs,
    },
    hasRedFlag: order.hasRedFlag ?? order.status === "red_flag",
    hasPhoto: true,
    photoUrls: docs.photoUrls as string[],
    pharmacistNote: order.pharmacistNote ?? null,
    prescription:
      order.status === "approved"
        ? `${order.med} ${order.dose} — once weekly for 4 weeks`
        : null,
    prescriptionItems:
      order.status === "approved"
        ? prescriptionItems(order.med, order.dose)
        : [],
    allergies: "None known",
    currentMedications: "None",
    medicalHistory: "Injectable weight management",
    riskCategory: order.hasRedFlag ? "high" : "low",
    verifiedHeightCm: HEIGHT_CM,
    verifiedWeightKg: order.weightKg,
    bmi: bmiFor(order.weightKg),
    reviewedBy: reviewedAt ? REVIEWER : null,
    previousConsultationId: order.previousId ?? null,
    consentToTreatment: true,
    consentToDelivery: true,
    consentDataProcessing: true,
    hasRegularGp: true,
    dispatchedAt,
    deliveryCarrier: order.dispatched ? "royal_mail" : null,
    deliveryTrackingNumber: order.dispatched ? "RM987654321GB" : null,
    createdAt,
    reviewedAt,
  } as never);

  await db.insert(consultationMessagesTable).values({
    id: `${order.id}-msg-1`,
    consultationId: order.id,
    patientEmail: PATIENT_EMAIL.toLowerCase(),
    senderRole: "pharmacist",
    senderName: REVIEWER,
    body: `Hi Mostafa — we've received your ${order.med} ${order.dose} order.`,
    kind: "message",
    readByPatient: false,
    readByPharmacist: true,
    createdAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
  } as never);
}

async function main() {
  await wipeDatabase();
  await ensureMostafaAccount();

  let repeatIndex = 0;
  for (const order of ORDERS) {
    if (order.customerType === "new_start" && !order.previousId) repeatIndex = 0;
    else if (order.previousId) repeatIndex += 1;
    await seedOrder(order, repeatIndex);
  }

  const count = await db
    .select({ id: consultationsTable.id })
    .from(consultationsTable)
    .where(eq(consultationsTable.patientEmail, PATIENT_EMAIL.toLowerCase()));

  console.log(
    `\nSeeded ${count.length} consultations for ${PATIENT_NAME} (${PATIENT_EMAIL}).`,
  );
  console.log("Rx portal queue: filter by patient email or open Orders tab.");
  console.log(`Patient portal login: ${PATIENT_EMAIL} / ${PASSWORD}`);
  console.log("\nScenario IDs:");
  for (const o of ORDERS) {
    console.log(`  • ${o.id} — ${o.med} ${o.dose} (${o.status})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());

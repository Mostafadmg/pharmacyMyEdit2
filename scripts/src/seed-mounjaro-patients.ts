/**
 * Five Mounjaro patients with three orders each (15 consultations), full uploads.
 * Run: pnpm --filter @workspace/scripts run seed-mounjaro-patients
 */
import {
  db,
  pool,
  consultationsTable,
  consultationMessagesTable,
  patientAccountsTable,
} from "@workspace/db";
import { eq, inArray, like } from "drizzle-orm";
import bcrypt from "bcryptjs";

const ID_PREFIX = "demo-mj-";
const PASSWORD = "Pharmacy1!";
const CONDITION_ID = "weight-loss";
const CONDITION_NAME = "Mounjaro (Tirzepatide) — Weight Management";

const DEMO_DOC = (label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect fill="#ecfdf5" width="480" height="360"/><text x="240" y="170" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#047857">${label}</text></svg>`,
  )}`;

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
  | "patient_responded";

type PatientSeed = {
  slug: string;
  name: string;
  email: string;
  sex: "male" | "female";
  age: number;
  orders: Array<{
    suffix: string;
    daysAgo: number;
    hoursAgo?: number;
    dose: string;
    status: OrderStatus;
    previousSuffix?: string;
    pharmacistNote?: string;
    reviewedBy?: string;
  }>;
};

const PATIENTS: PatientSeed[] = [
  {
    slug: "sarah-mitchell",
    name: "Sarah Mitchell",
    email: "sarah.mitchell.mounjaro@example.com",
    sex: "female",
    age: 44,
    orders: [
      { suffix: "o1", daysAgo: 118, dose: "2.5mg", status: "approved", reviewedBy: "Pharmacist Sarah Wells" },
      { suffix: "o2", daysAgo: 58, dose: "5mg", status: "approved", previousSuffix: "o1", reviewedBy: "Pharmacist Sarah Wells" },
      { suffix: "o3", daysAgo: 4, hoursAgo: 3, dose: "7.5mg", status: "pending", previousSuffix: "o2" },
    ],
  },
  {
    slug: "james-cooper",
    name: "James Cooper",
    email: "james.cooper.mounjaro@example.com",
    sex: "male",
    age: 39,
    orders: [
      { suffix: "o1", daysAgo: 105, dose: "2.5mg", status: "approved", reviewedBy: "Pharmacist Aisha Patel" },
      { suffix: "o2", daysAgo: 52, dose: "5mg", status: "approved", previousSuffix: "o1", reviewedBy: "Pharmacist Aisha Patel" },
      { suffix: "o3", daysAgo: 6, dose: "7.5mg", status: "patient_responded", previousSuffix: "o2" },
    ],
  },
  {
    slug: "fatima-hassan",
    name: "Fatima Hassan",
    email: "fatima.hassan.mounjaro@example.com",
    sex: "female",
    age: 36,
    orders: [
      { suffix: "o1", daysAgo: 95, dose: "2.5mg", status: "approved", reviewedBy: "Pharmacist Sarah Wells" },
      { suffix: "o2", daysAgo: 48, dose: "5mg", status: "rejected", previousSuffix: "o1", pharmacistNote: "Refund initiated — BMI documentation unclear on transfer.", reviewedBy: "Pharmacist Aisha Patel" },
      { suffix: "o3", daysAgo: 8, dose: "2.5mg", status: "pending", previousSuffix: "o2" },
    ],
  },
  {
    slug: "oliver-reed",
    name: "Oliver Reed",
    email: "oliver.reed.mounjaro@example.com",
    sex: "male",
    age: 51,
    orders: [
      { suffix: "o1", daysAgo: 140, dose: "2.5mg", status: "approved", reviewedBy: "Pharmacist Sarah Wells" },
      { suffix: "o2", daysAgo: 70, dose: "5mg", status: "approved", previousSuffix: "o1", reviewedBy: "Pharmacist Sarah Wells" },
      { suffix: "o3", daysAgo: 12, dose: "10mg", status: "approved", previousSuffix: "o2", reviewedBy: "Pharmacist Aisha Patel" },
    ],
  },
  {
    slug: "priya-singh",
    name: "Priya Singh",
    email: "priya.singh.mounjaro@example.com",
    sex: "female",
    age: 33,
    orders: [
      { suffix: "o1", daysAgo: 88, dose: "2.5mg", status: "approved", reviewedBy: "Pharmacist Aisha Patel" },
      { suffix: "o2", daysAgo: 44, dose: "5mg", status: "approved", previousSuffix: "o1", reviewedBy: "Pharmacist Aisha Patel" },
      { suffix: "o3", daysAgo: 2, hoursAgo: 5, dose: "7.5mg", status: "more_info_needed", previousSuffix: "o2" },
    ],
  },
];

function ts(daysAgo: number, hoursAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d;
}

function consultationId(patientSlug: string, orderSuffix: string): string {
  return `${ID_PREFIX}${patientSlug}-${orderSuffix}`;
}

function glpAnswers(
  dose: string,
  repeatCount: number,
  sex: "male" | "female",
) {
  return {
    sex_at_birth: sex === "female" ? "Female" : "Male",
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
    new_to_injectable: repeatCount === 0 ? "Yes" : "No",
    consent_confirm: "Yes",
    consent_gp_share: "Yes",
    gp_name: "North London Medical Centre",
    gp_address: "42 Holloway Road, London N7 8JG",
    requested_medication: "Mounjaro",
    consultation_type: repeatCount === 0 ? "new_start" : "simple_repeat",
    current_dose: `Mounjaro ${dose}`,
    height_cm: 168,
    weight_kg: 92 - repeatCount * 3,
    bmi: 32.6 - repeatCount * 0.4,
    weight_loss_goal: "Sustainable weight loss",
    prior_mounjaro_supply_count: repeatCount > 0 ? repeatCount : undefined,
  };
}

function fullDocumentBundle(createdAt: Date, reviewedBy: string) {
  const uploadIso = new Date(createdAt.getTime() + 8 * 60 * 1000).toISOString();
  const reviewIso = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const patient_documents: Record<string, string> = {};
  const patient_documents_uploaded_at: Record<string, string> = {};
  const document_reviews: Record<
    string,
    { status: string; reviewedBy: string; reviewedAt: string }
  > = {};

  for (const slot of SLOT_IDS) {
    patient_documents[slot] = DEMO_DOC(slot);
    patient_documents_uploaded_at[slot] = uploadIso;
    document_reviews[slot] = {
      status: "verified",
      reviewedBy,
      reviewedAt: reviewIso,
    };
  }

  return {
    patient_documents,
    patient_documents_uploaded_at,
    document_reviews,
    photoUrls: SLOT_IDS.map((s) => DEMO_DOC(s)),
  };
}

function prescriptionItems(dose: string) {
  return [
    {
      name: "Tirzepatide (Mounjaro)",
      strength: dose,
      form: "Solution for injection in pre-filled pen",
      quantity: "4 pens",
      sig: "Inject ONE pen subcutaneously once weekly.",
      duration: "4 weeks",
    },
  ];
}

async function wipe() {
  const rows = await db
    .select({ id: consultationsTable.id })
    .from(consultationsTable)
    .where(like(consultationsTable.id, `${ID_PREFIX}%`));

  if (rows.length === 0) {
    console.log("No Mounjaro demo consultations to remove.");
    return;
  }

  const ids = rows.map((r) => r.id);
  await db
    .delete(consultationMessagesTable)
    .where(inArray(consultationMessagesTable.consultationId, ids));
  await db.delete(consultationsTable).where(inArray(consultationsTable.id, ids));
  console.log(`Removed ${ids.length} consultations (${ID_PREFIX}*).`);
}

async function ensurePatientAccount(p: PatientSeed) {
  const email = p.email.toLowerCase();
  const [existing] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.email, email));

  if (existing) return;

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await db.insert(patientAccountsTable).values({
    id: `${ID_PREFIX}account-${p.slug}`,
    name: p.name,
    email,
    passwordHash,
    dateOfBirth: `${2026 - p.age}-06-15`,
    sex: p.sex,
    phone: "07700900" + String(100 + PATIENTS.indexOf(p)).slice(-3),
    addressLine1: "14 Harley Street",
    city: "London",
    postcode: "W1G 9PB",
  });
  console.log(`Created account ${email} (password: ${PASSWORD})`);
}

async function seed() {
  await wipe();

  let consultationCount = 0;
  let messageCount = 0;

  for (const patient of PATIENTS) {
    await ensurePatientAccount(patient);
    const firstName = patient.name.split(" ")[0]!;

    for (let oi = 0; oi < patient.orders.length; oi++) {
      const order = patient.orders[oi]!;
      const id = consultationId(patient.slug, order.suffix);
      const createdAt = ts(order.daysAgo, order.hoursAgo ?? 0);
      const reviewedAt =
        order.status === "approved" || order.status === "rejected"
          ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
          : null;
      const reviewer = order.reviewedBy ?? "Pharmacist Sarah Wells";
      const docs = fullDocumentBundle(createdAt, reviewer);
      const repeatIndex = oi;

      await db.insert(consultationsTable).values({
        id,
        patientName: patient.name,
        patientEmail: patient.email.toLowerCase(),
        patientAge: patient.age,
        patientSex: patient.sex,
        conditionId: CONDITION_ID,
        conditionName: CONDITION_NAME,
        status: order.status,
        answers: {
          ...glpAnswers(order.dose, repeatIndex, patient.sex),
          ...docs,
        },
        hasRedFlag: false,
        hasPhoto: true,
        photoUrls: docs.photoUrls,
        pharmacistNote: order.pharmacistNote ?? null,
        prescription:
          order.status === "approved"
            ? `Mounjaro ${order.dose} — inject once weekly for 4 weeks`
            : null,
        prescriptionItems:
          order.status === "approved" ? prescriptionItems(order.dose) : [],
        allergies: "None known",
        currentMedications: "None",
        medicalHistory: "Weight management",
        riskCategory: "low",
        verifiedHeightCm: 168,
        verifiedWeightKg: 92 - repeatIndex * 3,
        bmi: Math.round(32.6 - repeatIndex * 0.4),
        reviewedBy: reviewedAt ? reviewer : null,
        previousConsultationId: order.previousSuffix
          ? consultationId(patient.slug, order.previousSuffix)
          : null,
        consentToTreatment: true,
        consentToDelivery: true,
        consentDataProcessing: true,
        hasRegularGp: true,
        createdAt,
        reviewedAt,
      } as never);

      consultationCount++;

      const messages: Array<{ from: "patient" | "pharmacist"; body: string; hoursAfter: number }> = [
        {
          from: "pharmacist",
          body: `Hi ${firstName} — we've received your Mounjaro ${order.dose} order. All verification photos and ID are on file.`,
          hoursAfter: 1,
        },
        {
          from: "patient",
          body: `Thanks — happy to proceed with ${order.dose}. No new medicines or symptoms since my last order.`,
          hoursAfter: 3,
        },
      ];

      if (order.status === "more_info_needed") {
        messages.push({
          from: "pharmacist",
          body: "Please confirm your current weight reading matches the scale video uploaded this week.",
          hoursAfter: 6,
        });
      }

      for (let mi = 0; mi < messages.length; mi++) {
        const m = messages[mi]!;
        const msgAt = new Date(createdAt.getTime() + m.hoursAfter * 60 * 60 * 1000);
        await db.insert(consultationMessagesTable).values({
          id: `${id}-msg-${mi + 1}`,
          consultationId: id,
          patientEmail: patient.email.toLowerCase(),
          senderRole: m.from,
          senderName: m.from === "patient" ? patient.name : reviewer,
          body: m.body,
          kind: "message",
          readByPatient: m.from === "patient",
          readByPharmacist: m.from === "pharmacist",
          createdAt: msgAt,
        } as never);
        messageCount++;
      }

      for (let si = 0; si < SLOT_IDS.length; si++) {
        const slot = SLOT_IDS[si]!;
        const uploadAt = new Date(createdAt.getTime() + (10 + si) * 60 * 1000);
        await db.insert(consultationMessagesTable).values({
          id: `${id}-doc-${si + 1}`,
          consultationId: id,
          patientEmail: patient.email.toLowerCase(),
          senderRole: "patient",
          senderName: patient.name,
          body: `Uploaded ${slot.replace(/-/g, " ")} for clinical review.`,
          kind: "document_upload",
          readByPatient: true,
          readByPharmacist: false,
          createdAt: uploadAt,
        } as never);
        messageCount++;
      }
    }
  }

  console.log(
    `Seeded ${consultationCount} Mounjaro consultations and ${messageCount} messages for ${PATIENTS.length} patients.`,
  );
  console.log(
    "Open any patient’s latest order in the Rx portal Activity tab to review the timeline.",
  );
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());

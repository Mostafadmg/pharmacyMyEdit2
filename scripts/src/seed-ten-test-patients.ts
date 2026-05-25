/**
 * Ten GLP-1 test patients × 4 orders each (40 consultations) + portal accounts.
 * Does not remove Mostafa or other seeds — only replaces demo-tp10-* rows.
 *
 *   pnpm --filter @workspace/scripts run sync-db-schema
 *   pnpm --filter @workspace/scripts run seed-ten-test-patients
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

const ID_PREFIX = "demo-tp10-";
const PASSWORD = "Pharmacy1!";
const CONDITION_ID = "weight-loss";
const CONDITION_MOUNJARO = "Mounjaro (Tirzepatide) — Weight Management";
const CONDITION_WEGOVY = "Wegovy (Semaglutide) — Weight Management";
const REVIEWER_A = "Pharmacist Sarah Wells";
const REVIEWER_B = "Pharmacist Aisha Patel";

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

type CustomerType = "new_start" | "transfer" | "simple_repeat";

type OrderSeed = {
  suffix: string;
  daysAgo: number;
  hoursAgo?: number;
  dose: string;
  med: "Mounjaro" | "Wegovy";
  status: OrderStatus;
  previousSuffix?: string;
  customerType: CustomerType;
  pharmacistNote?: string;
  reviewedBy?: string;
  weightKg: number;
  docMode?: "verified" | "rejected_scale";
};

type PatientSeed = {
  slug: string;
  name: string;
  email: string;
  sex: "male" | "female";
  age: number;
  heightCm: number;
  orders: OrderSeed[];
};

const DEMO_DOC = (label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect fill="#ecfdf5" width="480" height="360"/><text x="240" y="170" text-anchor="middle" font-size="16" fill="#047857">${label}</text></svg>`,
  )}`;

function fourOrderChain(opts: {
  slug: string;
  med?: "Mounjaro" | "Wegovy";
  doses: [string, string, string, string];
  statuses: [OrderStatus, OrderStatus, OrderStatus, OrderStatus];
  weights: [number, number, number, number];
  latestType?: CustomerType;
  latestNote?: string;
}): OrderSeed[] {
  const med = opts.med ?? "Mounjaro";
  return [
    {
      suffix: "o1",
      daysAgo: 125,
      dose: opts.doses[0],
      med,
      status: opts.statuses[0],
      customerType: "new_start",
      weightKg: opts.weights[0],
      reviewedBy: REVIEWER_A,
    },
    {
      suffix: "o2",
      daysAgo: 62,
      dose: opts.doses[1],
      med,
      status: opts.statuses[1],
      previousSuffix: "o1",
      customerType: "simple_repeat",
      weightKg: opts.weights[1],
      reviewedBy: REVIEWER_A,
    },
    {
      suffix: "o3",
      daysAgo: 31,
      dose: opts.doses[2],
      med,
      status: opts.statuses[2],
      previousSuffix: "o2",
      customerType: "simple_repeat",
      weightKg: opts.weights[2],
      reviewedBy: REVIEWER_B,
    },
    {
      suffix: "o4",
      daysAgo: 5,
      hoursAgo: 2,
      dose: opts.doses[3],
      med,
      status: opts.statuses[3],
      previousSuffix: "o3",
      customerType: opts.latestType ?? "simple_repeat",
      weightKg: opts.weights[3],
      pharmacistNote: opts.latestNote,
    },
  ];
}

const PATIENTS: PatientSeed[] = [
  {
    slug: "emma-walsh",
    name: "Emma Walsh",
    email: "emma.walsh.tp10@example.com",
    sex: "female",
    age: 42,
    heightCm: 165,
    orders: fourOrderChain({
      slug: "emma-walsh",
      doses: ["2.5mg", "5mg", "5mg", "7.5mg"],
      statuses: ["approved", "approved", "approved", "pending"],
      weights: [98, 94, 91, 89],
    }),
  },
  {
    slug: "liam-brooks",
    name: "Liam Brooks",
    email: "liam.brooks.tp10@example.com",
    sex: "male",
    age: 38,
    heightCm: 182,
    orders: fourOrderChain({
      doses: ["2.5mg", "5mg", "7.5mg", "7.5mg"],
      statuses: ["approved", "approved", "approved", "patient_responded"],
      weights: [108, 102, 98, 96],
      latestNote: "Thanks for the update — reviewing your reply now.",
    }),
  },
  {
    slug: "zara-ahmed",
    name: "Zara Ahmed",
    email: "zara.ahmed.tp10@example.com",
    sex: "female",
    age: 35,
    heightCm: 160,
    orders: fourOrderChain({
      doses: ["2.5mg", "5mg", "5mg", "10mg"],
      statuses: ["approved", "approved", "approved", "more_info_needed"],
      weights: [88, 84, 82, 80],
      latestNote:
        "[PRESCRIBER_HOLD] Confirm no new medicines since your last Mounjaro supply.",
      latestType: "simple_repeat",
    }),
  },
  {
    slug: "noah-clarke",
    name: "Noah Clarke",
    email: "noah.clarke.tp10@example.com",
    sex: "male",
    age: 47,
    heightCm: 178,
    orders: fourOrderChain({
      doses: ["2.5mg", "5mg", "7.5mg", "7.5mg"],
      statuses: ["approved", "approved", "approved", "more_info_needed"],
      weights: [112, 108, 105, 104],
      latestNote:
        "[CS_HOLD] Customer service — waiting for delivery address confirmation.",
      latestType: "simple_repeat",
    }),
  },
  {
    slug: "mia-foster",
    name: "Mia Foster",
    email: "mia.foster.tp10@example.com",
    sex: "female",
    age: 29,
    heightCm: 168,
    orders: [
      {
        suffix: "o1",
        daysAgo: 110,
        dose: "2.5mg",
        med: "Mounjaro",
        status: "approved",
        customerType: "new_start",
        weightKg: 86,
        reviewedBy: REVIEWER_A,
      },
      {
        suffix: "o2",
        daysAgo: 58,
        dose: "5mg",
        med: "Mounjaro",
        status: "approved",
        previousSuffix: "o1",
        customerType: "simple_repeat",
        weightKg: 82,
        reviewedBy: REVIEWER_A,
      },
      {
        suffix: "o3",
        daysAgo: 29,
        dose: "5mg",
        med: "Mounjaro",
        status: "approved",
        previousSuffix: "o2",
        customerType: "simple_repeat",
        weightKg: 79,
        reviewedBy: REVIEWER_B,
      },
      {
        suffix: "o4",
        daysAgo: 3,
        hoursAgo: 4,
        dose: "2.5mg",
        med: "Mounjaro",
        status: "pending",
        previousSuffix: "o3",
        customerType: "simple_repeat",
        weightKg: 78,
        docMode: "rejected_scale",
      },
    ],
  },
  {
    slug: "ethan-patel",
    name: "Ethan Patel",
    email: "ethan.patel.tp10@example.com",
    sex: "male",
    age: 41,
    heightCm: 175,
    orders: [
      {
        suffix: "o1",
        daysAgo: 100,
        dose: "5mg",
        med: "Mounjaro",
        status: "approved",
        customerType: "transfer",
        weightKg: 96,
        reviewedBy: REVIEWER_B,
      },
      {
        suffix: "o2",
        daysAgo: 45,
        dose: "7.5mg",
        med: "Mounjaro",
        status: "approved",
        previousSuffix: "o1",
        customerType: "simple_repeat",
        weightKg: 92,
        reviewedBy: REVIEWER_B,
      },
      {
        suffix: "o3",
        daysAgo: 14,
        dose: "10mg",
        med: "Mounjaro",
        status: "more_info_needed",
        previousSuffix: "o2",
        customerType: "transfer",
        weightKg: 90,
        pharmacistNote:
          "Transfer from Superdrug Online — upload last pen label to confirm dose step-up.",
      },
      {
        suffix: "o4",
        daysAgo: 2,
        dose: "10mg",
        med: "Mounjaro",
        status: "pending",
        previousSuffix: "o3",
        customerType: "transfer",
        weightKg: 89,
      },
    ],
  },
  {
    slug: "grace-mensah",
    name: "Grace Mensah",
    email: "grace.mensah.tp10@example.com",
    sex: "female",
    age: 36,
    heightCm: 170,
    orders: fourOrderChain({
      doses: ["2.5mg", "5mg", "5mg", "7.5mg"],
      statuses: ["approved", "approved", "approved", "pending"],
      weights: [95, 85, 82, 80],
    }),
  },
  {
    slug: "oscar-reed",
    name: "Oscar Reed",
    email: "oscar.reed.tp10@example.com",
    sex: "male",
    age: 52,
    heightCm: 180,
    orders: fourOrderChain({
      doses: ["2.5mg", "5mg", "7.5mg", "10mg"],
      statuses: ["approved", "approved", "rejected", "pending"],
      weights: [118, 110, 106, 104],
      latestNote: "Previous order rejected — new clinical review required.",
    }),
  },
  {
    slug: "lily-nakamura",
    name: "Lily Nakamura",
    email: "lily.nakamura.tp10@example.com",
    sex: "female",
    age: 31,
    heightCm: 163,
    orders: [
      {
        suffix: "o1",
        daysAgo: 90,
        dose: "0.25mg",
        med: "Wegovy",
        status: "approved",
        customerType: "new_start",
        weightKg: 84,
        reviewedBy: REVIEWER_A,
      },
      {
        suffix: "o2",
        daysAgo: 55,
        dose: "0.5mg",
        med: "Wegovy",
        status: "approved",
        previousSuffix: "o1",
        customerType: "simple_repeat",
        weightKg: 80,
        reviewedBy: REVIEWER_A,
      },
      {
        suffix: "o3",
        daysAgo: 28,
        dose: "1mg",
        med: "Wegovy",
        status: "approved",
        previousSuffix: "o2",
        customerType: "simple_repeat",
        weightKg: 77,
        reviewedBy: REVIEWER_B,
      },
      {
        suffix: "o4",
        daysAgo: 1,
        hoursAgo: 6,
        dose: "1.7mg",
        med: "Wegovy",
        status: "pending",
        previousSuffix: "o3",
        customerType: "simple_repeat",
        weightKg: 75,
      },
    ],
  },
  {
    slug: "harvey-thornton",
    name: "Harvey Thornton",
    email: "harvey.thornton.tp10@example.com",
    sex: "male",
    age: 45,
    heightCm: 176,
    orders: fourOrderChain({
      doses: ["2.5mg", "5mg", "7.5mg", "12.5mg"],
      statuses: ["approved", "approved", "approved", "pending"],
      weights: [102, 98, 94, 100],
    }),
  },
];

function ts(daysAgo: number, hoursAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d;
}

function bmiFor(heightCm: number, weightKg: number): number {
  const h = heightCm / 100;
  return Math.round(weightKg / (h * h));
}

function consultationId(slug: string, suffix: string): string {
  return `${ID_PREFIX}${slug}-${suffix}`;
}

function glpAnswers(
  order: OrderSeed,
  sex: "male" | "female",
  heightCm: number,
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
    new_to_injectable: order.customerType === "new_start" ? "Yes" : "No",
    consent_confirm: "Yes",
    consent_gp_share: "Yes",
    gp_name: "Islington Central Practice",
    gp_address: "15 Upper Street, London N1 0PQ",
    requested_medication: order.med,
    consultation_type: order.customerType,
    current_dose: `${order.med} ${order.dose}`,
    previous_provider:
      order.customerType === "transfer" ? "LloydsOnlineDoctor" : null,
    height_cm: heightCm,
    weight_kg: order.weightKg,
    bmi: bmiFor(heightCm, order.weightKg),
    weight_loss_goal: "Sustainable weight loss with pharmacist support",
  };
}

function documentBundle(
  createdAt: Date,
  reviewedBy: string,
  mode: "verified" | "rejected_scale" = "verified",
) {
  const uploadIso = new Date(createdAt.getTime() + 10 * 60 * 1000).toISOString();
  const reviewIso = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const patient_documents: Record<string, string> = {};
  const patient_documents_uploaded_at: Record<string, string> = {};
  const document_reviews: Record<string, Record<string, string>> = {};

  for (const slot of SLOT_IDS) {
    patient_documents[slot] = DEMO_DOC(slot);
    patient_documents_uploaded_at[slot] = uploadIso;
    if (mode === "rejected_scale" && slot === "weight-scale-video") {
      document_reviews[slot] = {
        status: "rejected",
        reviewedBy,
        reviewedAt: reviewIso,
        rejectionNote: "Scale display not readable — please re-upload.",
        rejectionTemplateTitle: "Weight video unclear",
        uploadEmailSentAt: reviewIso,
      };
    } else if (mode === "verified") {
      document_reviews[slot] = {
        status: "verified",
        reviewedBy,
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
  const isWegovy = med === "Wegovy";
  return [
    {
      name: isWegovy ? "Semaglutide (Wegovy)" : "Tirzepatide (Mounjaro)",
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

  if (rows.length === 0) return;

  const ids = rows.map((r) => r.id);
  await db
    .delete(consultationMessagesTable)
    .where(inArray(consultationMessagesTable.consultationId, ids));
  await db.delete(consultationsTable).where(inArray(consultationsTable.id, ids));
  console.log(`Removed ${ids.length} prior demo-tp10 consultations.`);
}

async function ensurePatientAccount(p: PatientSeed, index: number) {
  const email = p.email.toLowerCase();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const pmr = `PMR-${String(10001 + index).padStart(5, "0")}`;

  await db
    .insert(patientAccountsTable)
    .values({
      id: `${ID_PREFIX}acct-${p.slug}`,
      name: p.name,
      email,
      passwordHash,
      dateOfBirth: `${2026 - p.age}-03-20`,
      sex: p.sex,
      phone: `07700${String(900300 + index).slice(-6)}`,
      addressLine1: `${20 + index} Test Patient Lane`,
      city: "London",
      postcode: "N1 9GU",
      pmrNumber: pmr,
    } as never)
    .onConflictDoUpdate({
      target: patientAccountsTable.email,
      set: {
        name: p.name,
        passwordHash,
        dateOfBirth: `${2026 - p.age}-03-20`,
        sex: p.sex,
        phone: `07700${String(900300 + index).slice(-6)}`,
        addressLine1: `${20 + index} Test Patient Lane`,
        city: "London",
        postcode: "N1 9GU",
        pmrNumber: pmr,
      },
    });

  console.log(`  Account: ${email}  PMR ${pmr}  password: ${PASSWORD}`);
}

async function seed() {
  await wipe();

  let consultations = 0;
  let messages = 0;

  console.log(`\nSeeding ${PATIENTS.length} test patients (4 orders each)…\n`);

  for (let pi = 0; pi < PATIENTS.length; pi++) {
    const patient = PATIENTS[pi]!;
    await ensurePatientAccount(patient, pi);
    const firstName = patient.name.split(" ")[0]!;

    for (const order of patient.orders) {
      const id = consultationId(patient.slug, order.suffix);
      const createdAt = ts(order.daysAgo, order.hoursAgo ?? 0);
      const reviewer = order.reviewedBy ?? REVIEWER_A;
      const reviewedAt =
        order.status === "approved" || order.status === "rejected"
          ? new Date(createdAt.getTime() + 18 * 60 * 60 * 1000)
          : order.status === "more_info_needed"
            ? new Date(createdAt.getTime() + 6 * 60 * 60 * 1000)
            : null;
      const docMode = order.docMode ?? "verified";
      const docs = documentBundle(createdAt, reviewer, docMode);
      const conditionName =
        order.med === "Wegovy" ? CONDITION_WEGOVY : CONDITION_MOUNJARO;

      await db.insert(consultationsTable).values({
        id,
        patientName: patient.name,
        patientEmail: patient.email.toLowerCase(),
        patientAge: patient.age,
        patientSex: patient.sex,
        patientDateOfBirth: `${2026 - patient.age}-03-20`,
        conditionId: CONDITION_ID,
        conditionName,
        status: order.status,
        answers: { ...glpAnswers(order, patient.sex, patient.heightCm), ...docs },
        hasRedFlag: false,
        hasPhoto: true,
        photoUrls: docs.photoUrls,
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
        medicalHistory: "Weight management programme",
        riskCategory: "low",
        verifiedHeightCm: patient.heightCm,
        verifiedWeightKg: order.weightKg,
        bmi: bmiFor(patient.heightCm, order.weightKg),
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
      consultations++;

      const thread = [
        {
          from: "pharmacist" as const,
          body: `Hi ${firstName} — your ${order.med} ${order.dose} order is on file with verification documents.`,
          hours: 1,
        },
        {
          from: "patient" as const,
          body: `Thank you. No new medicines since my last order — weight today is ${order.weightKg} kg.`,
          hours: 3,
        },
      ];

      for (let mi = 0; mi < thread.length; mi++) {
        const m = thread[mi]!;
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
          createdAt: new Date(createdAt.getTime() + m.hours * 60 * 60 * 1000),
        } as never);
        messages++;
      }
    }
  }

  console.log(
    `\nDone: ${consultations} consultations, ${messages} messages for ${PATIENTS.length} patients.`,
  );
  console.log("Rx queue: http://localhost:5174/queue");
  console.log("Pharmacist patients: http://localhost:5173/dashboard/patients");
  console.log(`All portal logins use password: ${PASSWORD}\n`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());

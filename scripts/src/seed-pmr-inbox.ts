/**
 * Seeds approved consultations in PMR inbox with Rx-portal-shaped prescription data.
 * PDFs are generated on demand via GET /api/consultations/:id/prescription.pdf
 *
 *   pnpm --filter @workspace/scripts run sync-db-schema
 *   pnpm --filter @workspace/scripts run seed-pmr-inbox
 *
 * Safe to re-run — upserts by consultation id.
 */
import {
  db,
  pool,
  consultationsTable,
  patientAccountsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const PASSWORD = "Pharmacy1!";
const REVIEWER = "Pharmacist Sarah Wells";

type GlpMed = "Mounjaro" | "Wegovy";

type InboxPatient = {
  id: string;
  name: string;
  email: string;
  age: number;
  sex: "male" | "female";
  dob: string;
  phone: string;
  addressLine1: string;
  city: string;
  postcode: string;
};

type InboxRx = {
  id: string;
  patientId: string;
  consultationNumber: string;
  med: GlpMed;
  dose: string;
  conditionName: string;
  daysAgo: number;
  hoursAgo?: number;
  pharmacistNote?: string;
  hasRedFlag?: boolean;
  prescriptionItems: Array<{
    name: string;
    strength: string;
    form: string;
    quantity: string;
    sig: string;
    duration: string;
  }>;
};

const PATIENTS: InboxPatient[] = [
  {
    id: "pmr-patient-shore",
    name: "Mr Test Patient Two",
    email: "test.patient.two@example.com",
    age: 59,
    sex: "male",
    dob: "1967-01-01",
    phone: "07700900111",
    addressLine1: "2 Fictional Close",
    city: "Testville",
    postcode: "ZZ99 3AB",
  },
  {
    id: "pmr-patient-foster",
    name: "Miss Test Patient Three",
    email: "test.patient.three@example.com",
    age: 28,
    sex: "female",
    dob: "1998-01-01",
    phone: "07700900112",
    addressLine1: "3 Fictional Close",
    city: "Testville",
    postcode: "ZZ99 3AC",
  },
  {
    id: "pmr-patient-mensah",
    name: "Mrs Test Patient Four",
    email: "test.patient.four@example.com",
    age: 41,
    sex: "female",
    dob: "1985-01-01",
    phone: "07700900113",
    addressLine1: "4 Fictional Close",
    city: "Testville",
    postcode: "ZZ99 3AD",
  },
];

const INBOX_RX: InboxRx[] = [
  {
    id: "pmr-inbox-shore-diabetes",
    patientId: "pmr-patient-shore",
    consultationNumber: "CON-20260616-0022",
    med: "Mounjaro",
    dose: "5mg",
    conditionName: "Type 2 Diabetes — GLP-1 support",
    daysAgo: 1,
    hoursAgo: 4,
    prescriptionItems: [
      {
        name: "Metformin",
        strength: "500mg",
        form: "tablets",
        quantity: "112 tablets",
        sig: "Take ONE tablet twice daily with meals",
        duration: "28 days",
      },
      {
        name: "Tirzepatide (Mounjaro)",
        strength: "5mg",
        form: "Solution for injection in pre-filled pen",
        quantity: "4 pens",
        sig: "Inject ONE pen subcutaneously once weekly on the same day each week.",
        duration: "4 weeks",
      },
    ],
  },
  {
    id: "pmr-inbox-foster-mounjaro",
    patientId: "pmr-patient-foster",
    consultationNumber: "CON-20260615-0031",
    med: "Mounjaro",
    dose: "7.5mg",
    conditionName: "Mounjaro (Tirzepatide) — Weight Management",
    daysAgo: 0,
    hoursAgo: 6,
    pharmacistNote: "Care home delivery — confirm signed-for receipt.",
    prescriptionItems: [
      {
        name: "Tirzepatide (Mounjaro)",
        strength: "7.5mg",
        form: "Solution for injection in pre-filled pen",
        quantity: "4 pens",
        sig: "Inject ONE pen subcutaneously once weekly on the same day each week.",
        duration: "4 weeks",
      },
    ],
  },
  {
    id: "pmr-inbox-mensah-wegovy",
    patientId: "pmr-patient-mensah",
    consultationNumber: "CON-20260610-0014",
    med: "Wegovy",
    dose: "0.25mg",
    conditionName: "Wegovy (Semaglutide) — Weight Management",
    daysAgo: 0,
    hoursAgo: 9,
    hasRedFlag: true,
    pharmacistNote: "Urgent — patient travelling Friday.",
    prescriptionItems: [
      {
        name: "Semaglutide (Wegovy)",
        strength: "0.25mg",
        form: "Solution for injection in pre-filled pen",
        quantity: "4 pens",
        sig: "Inject ONE pen subcutaneously once weekly on the same day each week.",
        duration: "4 weeks",
      },
    ],
  },
];

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

async function ensurePatient(p: InboxPatient) {
  const email = p.email.toLowerCase();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const [existing] = await db
    .select({ id: patientAccountsTable.id })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.email, email));

  const row = {
    id: p.id,
    name: p.name,
    email,
    passwordHash,
    dateOfBirth: p.dob,
    sex: p.sex,
    phone: p.phone,
    addressLine1: p.addressLine1,
    city: p.city,
    postcode: p.postcode,
  };

  if (existing) {
    await db
      .update(patientAccountsTable)
      .set(row)
      .where(eq(patientAccountsTable.email, email));
    return;
  }

  await db.insert(patientAccountsTable).values(row);
}

async function upsertInboxRx(rx: InboxRx) {
  const patient = PATIENTS.find((p) => p.id === rx.patientId);
  if (!patient) throw new Error(`Unknown patient ${rx.patientId}`);

  const createdAt = ts(rx.daysAgo, rx.hoursAgo ?? 0);
  const reviewedAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
  const deliveryAddress = `${patient.addressLine1}, ${patient.city} ${patient.postcode}`;
  const prescription = `${rx.med} ${rx.dose} — inject once weekly for 4 weeks`;

  const values = {
    id: rx.id,
    consultationNumber: rx.consultationNumber,
    patientName: patient.name,
    patientEmail: patient.email.toLowerCase(),
    patientAge: patient.age,
    patientSex: patient.sex,
    patientDateOfBirth: patient.dob,
    conditionId: rx.med === "Wegovy" ? "weight-loss" : "diabetes",
    conditionName: rx.conditionName,
    status: "approved" as const,
    answers: {
      requested_medication: rx.med,
      current_dose: `${rx.med} ${rx.dose}`,
      patient_documents: {
        "weight-scale-video": DEMO_DOC("weight-scale-video"),
        "government-id": DEMO_DOC("government-id"),
      },
    },
    hasRedFlag: rx.hasRedFlag ?? false,
    hasPhoto: true,
    photoUrls: [DEMO_DOC("weight-scale-video"), DEMO_DOC("government-id")],
    pharmacistNote: rx.pharmacistNote ?? null,
    prescription,
    prescriptionItems: rx.prescriptionItems,
    allergies: "None known",
    currentMedications: rx.id.includes("shore") ? "Metformin 500mg BD" : "None",
    medicalHistory: rx.id.includes("shore")
      ? "Type 2 diabetes mellitus"
      : "Weight management",
    riskCategory: rx.hasRedFlag ? "high" : "low",
    verifiedHeightCm: patient.sex === "male" ? 178 : 165,
    verifiedWeightKg: patient.sex === "male" ? 98 : 84,
    bmi: patient.sex === "male" ? 31 : 31,
    reviewedBy: REVIEWER,
    clinicalDecisionRationale:
      "Approved following clinical review in Rx portal.",
    consentToTreatment: true,
    consentToDelivery: true,
    consentDataProcessing: true,
    hasRegularGp: true,
    consentShareWithGp: true,
    gpName: "Dr Sarah Mitchell",
    gpSurgery: "Testville Medical Centre",
    gpAddress: "1 Fictional Road, Testville ZZ99 3WZ",
    gpPhone: "0116 123 4567",
    identityVerificationMethod: "video",
    identityVerificationRef: `IDV-${rx.id.slice(-6).toUpperCase()}`,
    preferredDeliveryMethod: "tracked_48",
    deliveryAddress,
    rxClinicalCheckComplete: false,
    pmrWorkflowStatus: "inbox",
    pmrWorkflowUpdatedAt: reviewedAt,
    createdAt,
    reviewedAt,
    updatedAt: reviewedAt,
  };

  await db
    .insert(consultationsTable)
    .values(values as never)
    .onConflictDoUpdate({
      target: consultationsTable.id,
      set: values as never,
    });
}

async function main() {
  console.log("Seeding PMR inbox prescriptions (approved + pmrWorkflowStatus=inbox)…");

  for (const p of PATIENTS) {
    await ensurePatient(p);
    console.log(`  Patient: ${p.name} <${p.email}>`);
  }

  for (const rx of INBOX_RX) {
    await upsertInboxRx(rx);
    console.log(`  Rx inbox: ${rx.id} — ${rx.consultationNumber}`);
  }

  console.log("\nDone. PMR login: pharmacist / pharmacare2024");
  console.log("Inbox consultation IDs:");
  for (const rx of INBOX_RX) {
    console.log(`  • ${rx.id}`);
  }
  console.log(
    "\nPDF preview: GET /api/consultations/<id>/prescription.pdf?token=<pharmacist_token>",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => pool.end());

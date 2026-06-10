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
} from "@workspace/db";
import { sql, inArray, or, ilike, and, not, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// ─────────────────────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────────────────────
type DemoMessage = {
  from: "patient" | "pharmacist";
  body: string;
  daysAgo?: number;
};
type DemoAction = {
  action: string;
  actor?: string;
  note?: string;
  details?: Record<string, unknown>;
};
type CustomerType = "new_start" | "transfer" | "simple_repeat";
type GlpMedication = "Mounjaro" | "Wegovy";

const DEMO_PATIENT_PASSWORD = "Pharmacy1!";

const MOUNJARO_DOSES = ["2.5mg", "5mg", "7.5mg", "10mg", "12.5mg", "15mg"] as const;
const WEGOVY_DOSES = ["0.25mg", "0.5mg", "1mg", "1.7mg", "2.4mg"] as const;

/** Placeholder weight-verification image for demo Rx document review */
const DEMO_WEIGHT_PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><rect fill="#ecfdf5" width="480" height="360"/><text x="240" y="165" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="#047857">Weight verification photo</text><text x="240" y="195" text-anchor="middle" font-size="13" fill="#64748b">Demo patient upload</text></svg>',
)}`;

type Demo = {
  id: string;
  name: string;
  email: string;
  age: number;
  sex: "male" | "female";
  conditionId: string;
  conditionName: string;
  status:
    | "pending"
    | "more_info_needed"
    | "patient_responded"
    | "approved"
    | "rejected";
  daysAgo: number;
  hoursAgo?: number;
  customerType: CustomerType;
  medication: GlpMedication;
  dose: string;
  previousConsultationId?: string;
  priorDose?: string;
  repeatOrderCount?: number;
  answers?: Record<string, unknown>;
  hasRedFlag?: boolean;
  allergies?: string;
  currentMedications?: string;
  medicalHistory?: string;
  riskCategory?: "low" | "medium" | "high";
  pharmacistNote?: string;
  prescription?: string;
  prescriptionItems?: Array<{
    name: string;
    strength: string;
    form: string;
    quantity: string;
    sig: string;
    duration: string;
    notes?: string;
  }>;
  reviewedBy?: string;
  clinicalDecisionRationale?: string;
  bmi?: number;
  verifiedHeightCm?: number;
  verifiedWeightKg?: number;
  messages: DemoMessage[];
  actions?: DemoAction[];
};

const FIRST_NAMES_F = [
  "Sarah",
  "Fatima",
  "Amelia",
  "Zara",
  "Nadia",
  "Leila",
  "Isabelle",
  "Grace",
  "Chloe",
  "Elena",
  "Priya",
  "Hannah",
  "Yasmin",
  "Olivia",
  "Megan",
];
const FIRST_NAMES_M = [
  "James",
  "Thomas",
  "Benjamin",
  "Christopher",
  "Ryan",
  "David",
  "Aaron",
  "Michael",
  "Kwame",
  "Daniel",
  "Oliver",
  "Marcus",
  "Samuel",
  "Ethan",
  "Noah",
];
const LAST_NAMES = [
  "Mitchell",
  "Okafor",
  "Keenan",
  "Foster",
  "Ahmed",
  "Bell",
  "Hassan",
  "Fitzgerald",
  "Mansouri",
  "Okonkwo",
  "Garnier",
  "Mensah",
  "Thornton",
  "Driscoll",
  "Nakamura",
  "Asante",
  "Walsh",
  "Clarke",
  "Patel",
  "Brooks",
  "Singh",
  "Cooper",
  "Reed",
  "Hayes",
  "Morgan",
];

const GP_SURGERIES = [
  ["North London Medical Centre", "42 Holloway Road, London N7 8JG"],
  ["Islington Central Practice", "15 Upper Street, London N1 0PQ"],
  ["Hackney Road Surgery", "220 Hackney Road, London E2 7SJ"],
  ["Camden Town Medical Centre", "110 Camden High Street, London NW1 0LU"],
  ["Finsbury Park Practice", "8 Stroud Green Road, London N4 2DQ"],
  ["Bethnal Green Health Centre", "50 Nelson Gardens, London E2 6QA"],
  ["Brixton Health Centre", "36 Acre Lane, London SW2 5SE"],
  ["Peckham Road Group Practice", "144 Peckham Road, London SE5 8QA"],
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function glp1Answers(opts: {
  medication: GlpMedication;
  consultationType: CustomerType;
  currentDose?: string;
  previousProvider?: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  sex: "Male" | "Female";
  pregnant?: boolean;
  oralContraceptive?: boolean;
  t2dm?: boolean;
  gpName: string;
  gpAddress: string;
  sideEffects?: string;
  weightLossSinceStart?: string;
  goal?: string;
  repeatOrderCount?: number;
}) {
  return {
    sex_at_birth: opts.sex,
    aged_18_to_75: "Yes",
    pregnant_breastfeeding: opts.pregnant ? "Yes" : "No",
    glp1_allergy: "No",
    thyroid_cancer_men2_history: "No",
    eating_disorder_history: "No",
    contraindicated_conditions: "No",
    type2_diabetes_other_meds: opts.t2dm ? "Yes — Metformin only" : "No",
    current_medications_other: "No",
    previous_health_conditions: "No",
    oral_contraceptive: opts.oralContraceptive ? "Yes" : "No",
    new_to_injectable: opts.consultationType === "new_start" ? "Yes" : "No",
    consent_confirm: "Yes",
    consent_gp_share: "Yes",
    gp_name: opts.gpName,
    gp_address: opts.gpAddress,
    requested_medication: opts.medication,
    consultation_type: opts.consultationType,
    current_dose: opts.currentDose ?? null,
    previous_provider: opts.previousProvider ?? null,
    height_cm: opts.heightCm,
    weight_kg: opts.weightKg,
    bmi: opts.bmi,
    weight_loss_goal: opts.goal ?? null,
    side_effects: opts.sideEffects ?? null,
    weight_loss_since_start: opts.weightLossSinceStart ?? null,
    prior_mounjaro_supply_count: opts.repeatOrderCount ?? null,
  };
}

function ts(daysAgo: number, hoursAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d;
}

function conditionName(med: GlpMedication): string {
  return med === "Mounjaro"
    ? "Mounjaro (Tirzepatide) — Weight Management"
    : "Wegovy (Semaglutide) — Weight Management";
}

function doseLabel(med: GlpMedication, dose: string): string {
  return `${med} ${dose}`;
}

function defaultMessages(
  firstName: string,
  customerType: CustomerType,
  med: GlpMedication,
  dose: string,
): DemoMessage[] {
  const openers: Record<CustomerType, string> = {
    new_start: `Hi ${firstName} — thank you for your first ${med} consultation with EveryDayMeds. You're starting at ${dose}. I've reviewed your questionnaire; please confirm you've read the starter leaflet and are happy with weekly injections.`,
    transfer: `Hi ${firstName} — welcome to EveryDayMeds. This is your first order with us for ${med} ${dose} (transfer from another provider). Please upload your last dispensed pen label or GP summary so I can verify dose continuity before we dispatch.`,
    simple_repeat: `Hi ${firstName} — thanks for your repeat request for ${med} ${dose}. You've been on treatment with us for a while — any new symptoms, pregnancy, or medicines to declare since your last supply?`,
  };
  const replies: Record<CustomerType, string> = {
    new_start: `Hi — yes, I've read the leaflet and I'm ready to start ${dose} this week. No new health issues.`,
    transfer: `Hi — I've attached photos of my last two pen labels from my previous pharmacy and a GP letter. Happy to proceed at ${dose}.`,
    simple_repeat: `No new issues — please send my usual ${dose}. Weight still trending down and side effects are manageable.`,
  };
  return [
    { from: "pharmacist", body: openers[customerType], daysAgo: 2 },
    { from: "patient", body: replies[customerType], daysAgo: 1 },
  ];
}

function prescriptionFor(med: GlpMedication, dose: string) {
  const drug =
    med === "Mounjaro" ? "Tirzepatide (Mounjaro)" : "Semaglutide (Wegovy)";
  return {
    prescription: `${med} ${dose} — inject once weekly for 4 weeks`,
    prescriptionItems: [
      {
        name: drug,
        strength: `${dose}`,
        form: "Solution for injection in pre-filled pen",
        quantity: "4 pens",
        sig: "Inject ONE pen subcutaneously once weekly on the same day each week.",
        duration: "4 weeks",
      },
    ],
  };
}

function statusForType(
  customerType: CustomerType,
  variant: number,
): Demo["status"] {
  if (customerType === "new_start") {
    return (["pending", "pending", "approved", "more_info_needed", "patient_responded"] as const)[
      variant % 5
    ];
  }
  if (customerType === "transfer") {
    return (["more_info_needed", "patient_responded", "pending", "approved"] as const)[
      variant % 4
    ];
  }
  return (["pending", "approved", "approved", "patient_responded", "more_info_needed"] as const)[
    variant % 5
  ];
}

function buildDemoFromSlot(
  slot: {
    id: string;
    customerType: CustomerType;
    medication: GlpMedication;
    dose: string;
    status?: Demo["status"];
    daysAgo?: number;
    hoursAgo?: number;
    repeatOrderCount?: number;
    hasRedFlag?: boolean;
    extraMessages?: DemoMessage[];
  },
  index: number,
): Demo {
  const female = index % 2 === 0;
  const firstName = female
    ? FIRST_NAMES_F[index % FIRST_NAMES_F.length]!
    : FIRST_NAMES_M[index % FIRST_NAMES_M.length]!;
  const lastName = LAST_NAMES[index % LAST_NAMES.length]!;
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.demo${String(index + 1).padStart(3, "0")}@example.com`;
  const [gpName, gpAddress] = GP_SURGERIES[index % GP_SURGERIES.length]!;
  const heightCm = female ? 162 + (index % 12) : 175 + (index % 10);
  const weightKg = 82 + (index % 28);
  const bmi = Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
  const med = slot.medication;
  const dose = slot.dose;
  const customerType = slot.customerType;
  const status = slot.status ?? statusForType(customerType, index);
  const currentDose = doseLabel(med, dose);
  const previousConsultationId =
    customerType === "new_start" ? undefined : `${slot.id}-prior`;

  const repeatCount = slot.repeatOrderCount ?? (customerType === "simple_repeat" ? 6 + (index % 8) : 0);

  const answers = glp1Answers({
    medication: med,
    consultationType: customerType,
    currentDose,
    previousProvider:
      customerType === "transfer"
        ? ["Superdrug Online Doctor", "Manual Pharmacy", "Livi Online GP", "Pharmacy2U"][
            index % 4
          ]
        : undefined,
    heightCm,
    weightKg,
    bmi,
    sex: female ? "Female" : "Male",
    gpName,
    gpAddress,
    goal: "Sustainable weight loss with pharmacist support",
    weightLossSinceStart:
      customerType === "new_start"
        ? undefined
        : `${(3 + (index % 12)).toFixed(1)}kg since starting GLP-1`,
    sideEffects:
      index % 7 === 0 ? "Mild nausea day after injection — settling" : "None currently",
    repeatOrderCount: repeatCount > 0 ? repeatCount : undefined,
    t2dm: index % 9 === 0,
  });

  const messages = [
    ...defaultMessages(firstName, customerType, med, dose),
    ...(slot.extraMessages ?? []),
  ];

  const approved = status === "approved";
  const rx = approved ? prescriptionFor(med, dose) : {};

  return {
    id: slot.id,
    name,
    email,
    age: 28 + (index % 35),
    sex: female ? "female" : "male",
    conditionId: "weight-loss",
    conditionName: conditionName(med),
    status,
    daysAgo: slot.daysAgo ?? index % 8,
    hoursAgo: slot.hoursAgo,
    customerType,
    medication: med,
    dose,
    previousConsultationId,
    priorDose:
      customerType !== "new_start"
        ? med === "Mounjaro"
          ? MOUNJARO_DOSES[Math.max(0, MOUNJARO_DOSES.indexOf(dose as (typeof MOUNJARO_DOSES)[number]) - 1)] ??
            "2.5mg"
          : WEGOVY_DOSES[0]
        : undefined,
    repeatOrderCount: repeatCount,
    answers,
    verifiedHeightCm: heightCm,
    verifiedWeightKg: weightKg,
    bmi: Math.round(bmi),
    allergies: index % 11 === 0 ? "Penicillin (rash)" : "None known",
    currentMedications: `${currentDose} weekly`,
    medicalHistory:
      customerType === "simple_repeat"
        ? `${repeatCount} prior Mounjaro/Wegovy orders with EveryDayMeds; good adherence and weight response`
        : customerType === "transfer"
          ? `Transferring ${currentDose} from another UK provider — first purchase with EveryDayMeds`
          : "First GLP-1 treatment — no prior injectable weight-loss medicines",
    riskCategory: slot.hasRedFlag ? "high" : index % 13 === 0 ? "medium" : "low",
    hasRedFlag: slot.hasRedFlag ?? false,
    messages,
    pharmacistNote: approved
      ? `${customerType.replace("_", " ")} — ${currentDose} approved after message review.`
      : undefined,
    reviewedBy: approved ? "Pharmacist Sarah Wells" : undefined,
    clinicalDecisionRationale: approved
      ? `Clinical review complete for ${customerType} patient at ${currentDose}.`
      : undefined,
    ...rx,
    actions: approved
      ? [
          {
            action: "approve",
            actor: "Pharmacist Sarah Wells",
            note: `${med} ${dose} — ${customerType}`,
          },
        ]
      : status === "more_info_needed"
        ? [
            {
              action: "more_info",
              actor: "Pharmacist Ahmed Khan",
              note: `Awaiting patient reply — ${customerType} ${dose}`,
            },
          ]
        : undefined,
  };
}

/** 50 GLP-1 demo patients: doses, customer types, all with messages. */
function generateDemos(): Demo[] {
  const slots: Array<Parameters<typeof buildDemoFromSlot>[0]> = [];

  // ── Featured: 2 new starters · Mounjaro 2.5mg (first time) ──
  slots.push(
    {
      id: "demo-001",
      customerType: "new_start",
      medication: "Mounjaro",
      dose: "2.5mg",
      status: "pending",
      daysAgo: 0,
      hoursAgo: 1,
    },
    {
      id: "demo-002",
      customerType: "new_start",
      medication: "Mounjaro",
      dose: "2.5mg",
      status: "patient_responded",
      daysAgo: 1,
    },
  );

  // ── Featured: 2 transfer · Mounjaro 10mg (first order with us) ──
  slots.push(
    {
      id: "demo-003",
      customerType: "transfer",
      medication: "Mounjaro",
      dose: "10mg",
      status: "more_info_needed",
      daysAgo: 1,
    },
    {
      id: "demo-004",
      customerType: "transfer",
      medication: "Mounjaro",
      dose: "10mg",
      status: "patient_responded",
      daysAgo: 2,
    },
  );

  // ── Featured: 2 simple repeat · long Mounjaro history ──
  slots.push(
    {
      id: "demo-005",
      customerType: "simple_repeat",
      medication: "Mounjaro",
      dose: "12.5mg",
      status: "pending",
      repeatOrderCount: 14,
      daysAgo: 0,
      hoursAgo: 3,
    },
    {
      id: "demo-006",
      customerType: "simple_repeat",
      medication: "Mounjaro",
      dose: "15mg",
      status: "approved",
      repeatOrderCount: 18,
      daysAgo: 4,
    },
  );

  // ── Dose ladder: 10 patients (3×2.5mg new start + one per other dose / type) ──
  slots.push(
    {
      id: "demo-007",
      customerType: "new_start",
      medication: "Mounjaro",
      dose: "2.5mg",
      status: "approved",
    },
    {
      id: "demo-008",
      customerType: "new_start",
      medication: "Mounjaro",
      dose: "5mg",
      status: "pending",
    },
    {
      id: "demo-009",
      customerType: "transfer",
      medication: "Mounjaro",
      dose: "7.5mg",
      status: "patient_responded",
    },
    {
      id: "demo-010",
      customerType: "transfer",
      medication: "Mounjaro",
      dose: "5mg",
      status: "more_info_needed",
    },
    {
      id: "demo-011",
      customerType: "simple_repeat",
      medication: "Mounjaro",
      dose: "2.5mg",
      repeatOrderCount: 2,
    },
    {
      id: "demo-012",
      customerType: "simple_repeat",
      medication: "Mounjaro",
      dose: "5mg",
      repeatOrderCount: 4,
    },
    {
      id: "demo-013",
      customerType: "simple_repeat",
      medication: "Mounjaro",
      dose: "7.5mg",
      repeatOrderCount: 6,
    },
    {
      id: "demo-014",
      customerType: "transfer",
      medication: "Mounjaro",
      dose: "12.5mg",
      status: "pending",
    },
    {
      id: "demo-015",
      customerType: "new_start",
      medication: "Mounjaro",
      dose: "7.5mg",
      status: "more_info_needed",
    },
    {
      id: "demo-016",
      customerType: "simple_repeat",
      medication: "Mounjaro",
      dose: "15mg",
      repeatOrderCount: 10,
      status: "approved",
    },
  );

  // ── Fill demo-017 … demo-050 with mixed types & doses ──
  let n = 17;
  const typeCycle: CustomerType[] = [
    "new_start",
    "transfer",
    "simple_repeat",
    "new_start",
    "transfer",
    "simple_repeat",
  ];
  let doseIdx = 0;
  while (n <= 50) {
    const customerType = typeCycle[(n - 17) % typeCycle.length]!;
    const medication: GlpMedication = n % 5 === 0 ? "Wegovy" : "Mounjaro";
    const dose =
      medication === "Mounjaro"
        ? MOUNJARO_DOSES[doseIdx % MOUNJARO_DOSES.length]!
        : WEGOVY_DOSES[doseIdx % WEGOVY_DOSES.length]!;
    doseIdx++;
    slots.push({
      id: `demo-${String(n).padStart(3, "0")}`,
      customerType,
      medication,
      dose,
      repeatOrderCount:
        customerType === "simple_repeat" ? 3 + (n % 12) : undefined,
    });
    n++;
  }

  return slots.map((slot, i) => buildDemoFromSlot(slot, i));
}

// ─────────────────────────────────────────────────────────────────────────────
// Wipe
// ─────────────────────────────────────────────────────────────────────────────
async function wipeDemoConsultations() {
  const targetConsults = await db
    .select({ id: consultationsTable.id })
    .from(consultationsTable)
    .where(
      or(
        ilike(consultationsTable.patientName, "%mostafa%"),
        ilike(consultationsTable.patientName, "%mustafa%"),
        ilike(consultationsTable.patientEmail, "%mostafa%"),
        ilike(consultationsTable.patientEmail, "%mustafa%"),
        ilike(consultationsTable.patientEmail, "phototest%"),
        ilike(consultationsTable.patientEmail, "%compliance-%test%"),
        ilike(consultationsTable.patientEmail, "e2e-test%"),
        ilike(consultationsTable.patientEmail, "alice+%"),
        ilike(consultationsTable.patientEmail, "jane.test%"),
        ilike(consultationsTable.id, "demo-%"),
      ),
    );

  if (targetConsults.length === 0) {
    console.log("No demo consultations to wipe.");
    return;
  }
  const ids = targetConsults.map((c) => c.id);
  console.log(`Deleting ${ids.length} demo consultations + related rows...`);

  await db
    .delete(consultationMessagesTable)
    .where(inArray(consultationMessagesTable.consultationId, ids));
  await db
    .delete(consultationActionsTable)
    .where(inArray(consultationActionsTable.consultationId, ids));
  await db
    .delete(notificationsTable)
    .where(inArray(notificationsTable.consultationId, ids));
  await db
    .update(ordersTable)
    .set({ consultationId: null })
    .where(inArray(ordersTable.consultationId, ids));
  await db
    .delete(consultationsTable)
    .where(inArray(consultationsTable.id, ids));
}

async function wipeNonGlpConsultations() {
  const nonGlp = await db
    .select({ id: consultationsTable.id })
    .from(consultationsTable)
    .where(
      and(
        not(ilike(consultationsTable.id, "demo-%")),
        not(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          or(
            ilike(consultationsTable.conditionName, "%mounjaro%"),
            ilike(consultationsTable.conditionName, "%wegovy%"),
            ilike(consultationsTable.conditionName, "%tirzepatide%"),
            ilike(consultationsTable.conditionName, "%semaglutide%"),
            eq(consultationsTable.conditionId, "weight-loss"),
          )!,
        ),
      ),
    );

  if (nonGlp.length === 0) return;
  const ids = nonGlp.map((r) => r.id);
  console.log(`Removing ${ids.length} non–Mounjaro/Wegovy consultations...`);
  await db
    .delete(consultationMessagesTable)
    .where(inArray(consultationMessagesTable.consultationId, ids));
  await db
    .delete(consultationActionsTable)
    .where(inArray(consultationActionsTable.consultationId, ids));
  await db
    .delete(notificationsTable)
    .where(inArray(notificationsTable.consultationId, ids));
  await db
    .update(ordersTable)
    .set({ consultationId: null })
    .where(inArray(ordersTable.consultationId, ids));
  await db.delete(consultationsTable).where(inArray(consultationsTable.id, ids));
}

async function wipeNonGlpShopOrders() {
  const allOrders = await db
    .select({ id: ordersTable.id })
    .from(ordersTable);

  const toDelete: string[] = [];
  for (const order of allOrders) {
    const items = await db
      .select({
        productName: orderItemsTable.productName,
        productSlug: orderItemsTable.productSlug,
      })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    if (items.length === 0) {
      toDelete.push(order.id);
      continue;
    }
    const allGlp = items.every((item) => {
      const hay = `${item.productName} ${item.productSlug}`.toLowerCase();
      return /mounjaro|wegovy|tirzepatide|semaglutide|weight.?loss|glp-?1/.test(
        hay,
      );
    });
    if (!allGlp) toDelete.push(order.id);
  }

  if (toDelete.length === 0) {
    console.log("No non–GLP-1 shop orders to remove.");
    return;
  }

  console.log(`Removing ${toDelete.length} shop orders (not Mounjaro/Wegovy)...`);
  await db
    .delete(deliveriesTable)
    .where(inArray(deliveriesTable.orderId, toDelete));
  await db
    .delete(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, toDelete));
  await db.delete(ordersTable).where(inArray(ordersTable.id, toDelete));
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────────────────────
async function seedPriorConsultation(c: Demo) {
  if (!c.previousConsultationId) return;
  const priorId = c.previousConsultationId;
  const priorDose = c.priorDose ?? "2.5mg";
  const createdAt = ts((c.daysAgo ?? 0) + 120);

  await db
    .insert(consultationsTable)
    .values({
      id: priorId,
      patientName: c.name,
      patientEmail: c.email,
      patientAge: c.age,
      patientSex: c.sex,
      conditionId: "weight-loss",
      conditionName: conditionName(c.medication),
      status: "approved",
      answers: glp1Answers({
        medication: c.medication,
        consultationType: "simple_repeat",
        currentDose: doseLabel(c.medication, priorDose),
        heightCm: c.verifiedHeightCm ?? 170,
        weightKg: (c.verifiedWeightKg ?? 90) + 8,
        bmi: (c.bmi ?? 32) + 2,
        sex: c.sex === "female" ? "Female" : "Male",
        gpName: "Prior GP record",
        gpAddress: "On file",
        repeatOrderCount: Math.max(1, (c.repeatOrderCount ?? 4) - 1),
      }),
      prescription: `${c.medication} ${priorDose} — prior supply`,
      prescriptionItems: prescriptionFor(c.medication, priorDose).prescriptionItems,
      riskCategory: "low",
      verifiedHeightCm: c.verifiedHeightCm,
      verifiedWeightKg: (c.verifiedWeightKg ?? 90) + 8,
      bmi: c.bmi,
      consentToTreatment: true,
      consentToDelivery: true,
      consentDataProcessing: true,
      hasRegularGp: true,
      reviewedBy: "Pharmacist Sarah Wells",
      createdAt,
      reviewedAt: createdAt,
    } as never)
    .onConflictDoNothing();
}

async function seed() {
  const DEMOS = generateDemos();
  console.log(`Seeding ${DEMOS.length} GLP-1 demo consultations...`);

  for (const c of DEMOS) {
    await seedPriorConsultation(c);

    const createdAt = ts(c.daysAgo, c.hoursAgo ?? 0);
    const reviewedAt =
      c.status === "approved" || c.status === "rejected"
        ? ts(Math.max(0, c.daysAgo - 1))
        : null;

    await db
      .insert(consultationsTable)
      .values({
        id: c.id,
        patientName: c.name,
        patientEmail: c.email,
        patientAge: c.age,
        patientSex: c.sex,
        conditionId: c.conditionId,
        conditionName: c.conditionName,
        status: c.status,
        answers: {
          ...(c.answers ?? {}),
          patient_documents: {
            "weight-scale-video": DEMO_WEIGHT_PHOTO,
            ...((c.answers as { patient_documents?: Record<string, string> } | undefined)
              ?.patient_documents ?? {}),
          },
        },
        hasRedFlag: c.hasRedFlag ?? false,
        hasPhoto: true,
        photoUrls: [DEMO_WEIGHT_PHOTO],
        pharmacistNote: c.pharmacistNote ?? null,
        prescription: c.prescription ?? null,
        prescriptionItems: c.prescriptionItems ?? [],
        allergies: c.allergies ?? null,
        currentMedications: c.currentMedications ?? null,
        medicalHistory: c.medicalHistory ?? null,
        riskCategory: c.riskCategory ?? "low",
        verifiedHeightCm: c.verifiedHeightCm ?? null,
        verifiedWeightKg: c.verifiedWeightKg ?? null,
        bmi: c.bmi ?? null,
        reviewedBy: c.reviewedBy ?? null,
        clinicalDecisionRationale: c.clinicalDecisionRationale ?? null,
        previousConsultationId: c.previousConsultationId ?? null,
        consentToTreatment: true,
        consentToDelivery: true,
        consentDataProcessing: true,
        hasRegularGp: true,
        createdAt,
        reviewedAt,
      } as never)
      .onConflictDoNothing();

    for (let i = 0; i < c.messages.length; i++) {
      const m = c.messages[i]!;
      await db
        .insert(consultationMessagesTable)
        .values({
          id: `${c.id}-msg-${i + 1}`,
          consultationId: c.id,
          patientEmail: c.email,
          senderRole: m.from,
          senderName: m.from === "patient" ? c.name : "Pharmacist",
          body: m.body,
          kind: "message",
          readByPatient: m.from === "patient",
          readByPharmacist: m.from === "pharmacist",
          createdAt: ts(m.daysAgo ?? 0),
        } as never)
        .onConflictDoNothing();
    }

    if (c.actions) {
      for (let i = 0; i < c.actions.length; i++) {
        const a = c.actions[i]!;
        await db
          .insert(consultationActionsTable)
          .values({
            id: `${c.id}-act-${i + 1}`,
            consultationId: c.id,
            action: a.action,
            actorRole: "pharmacist",
            actorName: a.actor ?? "Pharmacist",
            details: a.details ?? {},
            note: a.note ?? null,
            createdAt: reviewedAt ?? createdAt,
          } as never)
          .onConflictDoNothing();
      }
    }
  }

  const r = await db.execute<{ c: string }>(
    sql`select count(*)::text as c from consultations where id like 'demo-%'`,
  );
  const m = await db.execute<{ c: string }>(
    sql`select count(*)::text as c from consultation_messages where consultation_id like 'demo-%'`,
  );
  console.log(
    `Done: ${r.rows[0]?.c} demo consultations, ${m.rows[0]?.c} messages.`,
  );
}

/** Shop orders linked to demo patients (customerEmail) for prescriber portal Patients ↔ Orders. */
async function seedDemoShopOrders(demos: Demo[]) {
  const seen = new Set<string>();
  const patients: Demo[] = [];
  for (const d of demos) {
    const key = d.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    patients.push(d);
    if (patients.length >= 12) break;
  }

  const statuses = ["paid", "preparing", "shipped", "delivered"] as const;
  let orderNum = 100_100;
  let created = 0;

  for (let i = 0; i < patients.length; i++) {
    const d = patients[i]!;
    const id = `ord_demo_shop_${String(i + 1).padStart(3, "0")}`;
    const orderNumber = `PC-${orderNum++}`;
    const status = statuses[i % statuses.length]!;
    const unitPence = 12_900;
    const qty = 1;

    await db
      .insert(ordersTable)
      .values({
        id,
        orderNumber,
        customerEmail: d.email.toLowerCase(),
        customerName: d.name,
        customerPhone: `07700${String(900_200 + i).slice(-6)}`,
        shippingAddress: {
          line1: `${12 + i} Demo Street`,
          city: "London",
          postcode: "SW1A 1AA",
        },
        itemsTotalGbp: unitPence * qty,
        shippingGbp: 0,
        totalGbp: unitPence * qty,
        status,
        paymentStatus: "paid_demo",
        paymentProvider: "demo",
        notes: "Seeded shop order for prescriber portal demo",
        internalNotes: [],
        prescriptionItems: [],
        createdAt: ts(Math.max(1, 14 - i)),
      } as never)
      .onConflictDoNothing();

    await db
      .insert(orderItemsTable)
      .values({
        id: `${id}-item-1`,
        orderId: id,
        productId: "prod_demo_mounjaro",
        productName: `${d.medication} ${d.dose} — Weight loss`,
        productSlug: "mounjaro-weight-loss",
        imageUrl: null,
        unitPriceGbp: unitPence,
        quantity: qty,
        lineTotalGbp: unitPence * qty,
      } as never)
      .onConflictDoNothing();

    if (status === "shipped" || status === "delivered") {
      await db
        .insert(deliveriesTable)
        .values({
          id: `del_${id}`,
          orderId: id,
          carrier: "royal_mail",
          trackingNumber: `RM${String(900_000_000 + i)}GB`,
          trackingUrl: `https://www.royalmail.com/track-your-item#/tracking-results/RM${String(900_000_000 + i)}GB`,
          status: status === "delivered" ? "delivered" : "shipped",
          events: [],
        } as never)
        .onConflictDoNothing();
    }
    created += 1;
  }

  console.log(`Seeded ${created} demo shop orders linked to patient emails.`);
}

/** Login accounts so demo patients can use the patient portal (My Consultations). */
async function ensureDemoPatientAccounts(demos: Demo[]) {
  const passwordHash = await bcrypt.hash(DEMO_PATIENT_PASSWORD, 12);
  const seen = new Set<string>();
  let linked = 0;

  for (const d of demos) {
    const email = d.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);

    await db
      .insert(patientAccountsTable)
      .values({
        id: `patient-${d.id}`,
        name: d.name,
        email,
        passwordHash,
        sex: d.sex,
        dateOfBirth: `${2026 - d.age}-06-15`,
        phone: `07700${String(900100 + linked).slice(-6)}`,
        addressLine1: `${10 + (linked % 90)} Demo Street`,
        city: "London",
        postcode: "SW1A 1AA",
      } as never)
      .onConflictDoNothing();
    linked += 1;
  }

  console.log(
    `Linked ${linked} patient portal accounts (password: ${DEMO_PATIENT_PASSWORD}).`,
  );
}

async function main() {
  await wipeDemoConsultations();
  await wipeNonGlpConsultations();
  await wipeNonGlpShopOrders();
  const DEMOS = generateDemos();
  await seed();
  await ensureDemoPatientAccounts(DEMOS);
  await seedDemoShopOrders(DEMOS);
  await pool.end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await pool.end().catch(() => {});
  process.exit(1);
});

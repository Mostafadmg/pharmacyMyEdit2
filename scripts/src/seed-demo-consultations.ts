import {
  db,
  consultationsTable,
  consultationMessagesTable,
  consultationActionsTable,
  notificationsTable,
  ordersTable,
} from "@workspace/db";
import { sql, inArray, or, ilike } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Wipe test/demo data (Mostafa, Mustafa, and obvious automated test rows)
// ─────────────────────────────────────────────────────────────────────────────
async function wipe() {
  const targetConsults = await db
    .select({ id: consultationsTable.id, email: consultationsTable.patientEmail })
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
      ),
    );

  if (targetConsults.length === 0) {
    console.log("Nothing to wipe.");
    return;
  }
  const ids = targetConsults.map((c) => c.id);
  console.log(`Deleting ${ids.length} test consultations + related rows...`);

  await db.delete(consultationMessagesTable).where(inArray(consultationMessagesTable.consultationId, ids));
  await db.delete(consultationActionsTable).where(inArray(consultationActionsTable.consultationId, ids));
  await db.delete(notificationsTable).where(inArray(notificationsTable.consultationId, ids));
  // unlink orders rather than deleting them — preserve order history
  await db
    .update(ordersTable)
    .set({ consultationId: null })
    .where(inArray(ordersTable.consultationId, ids));
  await db.delete(consultationsTable).where(inArray(consultationsTable.id, ids));
  console.log("Wipe complete.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Seed 15 demo consultations covering every workflow scenario
// ─────────────────────────────────────────────────────────────────────────────
type DemoMessage = { from: "patient" | "pharmacist"; body: string; daysAgo?: number };
type DemoAction = { action: string; actor?: string; note?: string; details?: Record<string, unknown> };
type Demo = {
  id: string;
  name: string;
  email: string;
  age: number;
  sex: "male" | "female";
  conditionId: string;
  conditionName: string;
  status: "pending" | "more_info_needed" | "patient_responded" | "approved" | "rejected";
  daysAgo: number; // when created
  hoursAgo?: number;
  answers?: Record<string, unknown>;
  hasRedFlag?: boolean;
  hasPhoto?: boolean;
  allergies?: string;
  currentMedications?: string;
  medicalHistory?: string;
  isPregnant?: boolean;
  riskCategory?: "low" | "medium" | "high";
  pharmacistNote?: string;
  prescription?: string;
  prescriptionItems?: Array<{ name: string; dose: string; quantity: string; instructions: string }>;
  reviewedBy?: string;
  clinicalDecisionRationale?: string;
  referralInfo?: string;
  bmi?: number;
  verifiedHeightCm?: number;
  verifiedWeightKg?: number;
  messages?: DemoMessage[];
  actions?: DemoAction[];
};

const DEMOS: Demo[] = [
  // ── 1. NEW PENDING — waiting clinical check (recent, simple) ──
  {
    id: "demo-001",
    name: "Charlotte Ainsworth",
    email: "charlotte.ainsworth@example.com",
    age: 34,
    sex: "female",
    conditionId: "cystitis",
    conditionName: "Cystitis / UTI (Trimethoprim · Nitrofurantoin · MacroBID)",
    status: "pending",
    daysAgo: 0,
    hoursAgo: 1,
    answers: {
      symptoms: ["Burning when passing urine", "Needing to go more often", "Lower tummy pain"],
      duration: "2 days",
      first_episode: "No, I've had this once before about a year ago",
      blood_in_urine: "No",
      fever: "No",
    },
    allergies: "None known",
    currentMedications: "None",
    medicalHistory: "Otherwise well",
    riskCategory: "low",
  },

  // ── 2. PENDING — red-flag flagged for urgent review ──
  {
    id: "demo-002",
    name: "Daniel Whitfield",
    email: "daniel.whitfield@example.com",
    age: 58,
    sex: "male",
    conditionId: "back-pain",
    conditionName: "Back Pain",
    status: "pending",
    daysAgo: 0,
    hoursAgo: 3,
    hasRedFlag: true,
    answers: {
      pain_location: "Lower back, radiating down right leg",
      duration: "3 weeks",
      numbness: "Slight tingling in right foot",
      bladder_or_bowel_changes: "No",
      recent_injury: "No specific injury",
      pain_score: 7,
    },
    allergies: "Penicillin — rash",
    currentMedications: "Atorvastatin 20mg nightly",
    medicalHistory: "High cholesterol, well-controlled",
    riskCategory: "medium",
  },

  // ── 3. PENDING — weight loss with BMI calc, photo evidence ──
  {
    id: "demo-003",
    name: "Olivia Marsh",
    email: "olivia.marsh@example.com",
    age: 41,
    sex: "female",
    conditionId: "weight-loss",
    conditionName: "Weight Loss (Mounjaro · Wegovy · Saxenda · Orlistat · Mysimba)",
    status: "pending",
    daysAgo: 0,
    hoursAgo: 6,
    hasPhoto: true,
    verifiedHeightCm: 168,
    verifiedWeightKg: 96,
    bmi: 34,
    answers: {
      goal: "Lose around 15kg over 12 months",
      tried_before: "Slimming World for 6 months, lost 4kg then plateaued",
      diabetes: "No, but my dad is type 2",
      thyroid: "No",
      eating_disorder_history: "No",
    },
    allergies: "None",
    currentMedications: "Vitamin D 1000 IU daily",
    medicalHistory: "Well otherwise",
    riskCategory: "low",
  },

  // ── 4. PENDING — repeat consultation (linked to previous) ──
  {
    id: "demo-004",
    name: "Hannah Reid",
    email: "hannah.reid@example.com",
    age: 29,
    sex: "female",
    conditionId: "acne-vulgaris",
    conditionName: "Acne Vulgaris",
    status: "pending",
    daysAgo: 0,
    hoursAgo: 12,
    hasPhoto: true,
    answers: {
      areas_affected: ["Face", "Upper back"],
      severity: "Moderate — about 15 spots, some inflamed",
      tried_otc: "Salicylic acid wash for 8 weeks, mild improvement only",
      previous_treatment: "Used Differin gel previously, helped but symptoms returned",
      pregnancy_planning: "No",
    },
    allergies: "None known",
    currentMedications: "Microgynon 30",
    medicalHistory: "Mild PCOS",
    riskCategory: "low",
  },

  // ── 5. MORE INFO NEEDED — pharmacist asked for clearer photo ──
  {
    id: "demo-005",
    name: "Sophie Bennett",
    email: "sophie.bennett@example.com",
    age: 27,
    sex: "female",
    conditionId: "ringworm",
    conditionName: "Ringworm / Tinea / Intertrigo",
    status: "more_info_needed",
    daysAgo: 1,
    hasPhoto: true,
    answers: {
      area: "Inner thigh, both sides",
      duration: "About 10 days",
      itchy: "Yes, especially at night",
      tried_anything: "Hydrocortisone cream — made it worse",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Eczema as a child",
    riskCategory: "low",
    messages: [
      {
        from: "pharmacist",
        body: "Hi Sophie — thanks for your consultation. The photo is a little blurred. Could you please upload a clearer image in good daylight, ideally including a coin or ruler for scale? That will help me confirm whether this is tinea or something else.",
        daysAgo: 1,
      },
    ],
    actions: [
      { action: "more_info", actor: "Pharmacist Ahmed Khan", note: "Photo too blurred to assess scale; requested daylight image with reference object." },
    ],
  },

  // ── 6. MORE INFO NEEDED — needs BP reading before prescribing ──
  {
    id: "demo-006",
    name: "James Holloway",
    email: "james.holloway@example.com",
    age: 52,
    sex: "male",
    conditionId: "erectile-dysfunction",
    conditionName: "Erectile Dysfunction (Sildenafil · Tadalafil · Viagra · Cialis)",
    status: "more_info_needed",
    daysAgo: 2,
    answers: {
      duration: "About 8 months, gradually worse",
      morning_erections: "Occasional",
      stress: "Moderate — recently changed jobs",
      heart_problems: "No",
      chest_pain_on_exertion: "No",
      nitrates: "No",
    },
    allergies: "None",
    currentMedications: "Lisinopril 10mg, Atorvastatin 20mg",
    medicalHistory: "High blood pressure (well controlled), high cholesterol",
    riskCategory: "medium",
    messages: [
      {
        from: "pharmacist",
        body: "Hi James — before I prescribe sildenafil safely with your blood pressure medication I need a recent BP reading (within the last 6 months). You can take this at any pharmacy or with a home monitor. Please reply with the systolic / diastolic values.",
        daysAgo: 2,
      },
    ],
    actions: [{ action: "more_info", actor: "Pharmacist Sarah Wells", note: "Awaiting recent BP reading (on antihypertensive)." }],
  },

  // ── 7. PATIENT RESPONDED — info supplied, back in queue ──
  {
    id: "demo-007",
    name: "Rachel Goodwin",
    email: "rachel.goodwin@example.com",
    age: 36,
    sex: "female",
    conditionId: "migraine",
    conditionName: "Migraine (Sumatriptan · Rizatriptan)",
    status: "patient_responded",
    daysAgo: 3,
    answers: {
      frequency: "About 2 attacks per month",
      aura: "Yes, visual zig-zags before headache",
      duration_per_attack: "Around 8 hours without treatment",
      tried_otc: "Paracetamol and ibuprofen — limited relief",
      pregnancy: "No",
      heart_problems: "No",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Migraine since age 22",
    riskCategory: "low",
    messages: [
      {
        from: "pharmacist",
        body: "Hi Rachel — could you confirm whether you have ever had a stroke, mini-stroke (TIA), or any heart rhythm issues? Triptans are not safe in those cases, so I need to rule it out.",
        daysAgo: 3,
      },
      {
        from: "patient",
        body: "Hi — no, nothing like that. I've never had any heart or stroke issues, and my GP checked my heart last year and everything was fine.",
        daysAgo: 1,
      },
    ],
    actions: [{ action: "more_info", actor: "Pharmacist Sarah Wells", note: "Cardiovascular safety check before triptan." }],
  },

  // ── 8. PATIENT RESPONDED — supplied photo as requested ──
  {
    id: "demo-008",
    name: "Marcus Doyle",
    email: "marcus.doyle@example.com",
    age: 44,
    sex: "male",
    conditionId: "athletes-foot",
    conditionName: "Athlete's Foot",
    status: "patient_responded",
    daysAgo: 4,
    hasPhoto: true,
    answers: {
      area: "Between toes, both feet",
      duration: "About 3 weeks",
      itchy_or_painful: "Itchy and a bit smelly",
      tried_anything: "Daktarin spray for 1 week, slight improvement",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Type 2 diabetes — diet controlled",
    riskCategory: "medium",
    messages: [
      { from: "pharmacist", body: "Thanks Marcus — could you upload a clearer photo of the affected area between the toes? Given your diabetes I want to be careful to rule out any cracking or infection.", daysAgo: 4 },
      { from: "patient", body: "No problem, I've added two new photos just now.", daysAgo: 1 },
    ],
    actions: [{ action: "more_info", actor: "Pharmacist Ahmed Khan", note: "Diabetic — need clearer photo to rule out cellulitis." }],
  },

  // ── 9. APPROVED — clean approval, dispatched ──
  {
    id: "demo-009",
    name: "Emily Carrington",
    email: "emily.carrington@example.com",
    age: 31,
    sex: "female",
    conditionId: "cystitis",
    conditionName: "Cystitis / UTI (Trimethoprim · Nitrofurantoin · MacroBID)",
    status: "approved",
    daysAgo: 5,
    answers: {
      symptoms: ["Burning when passing urine", "Frequency", "Cloudy urine"],
      duration: "1 day",
      first_episode: "No — third episode this year",
      blood_in_urine: "No",
      fever: "No",
      pregnancy: "No",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Recurrent UTI — about 3 per year",
    riskCategory: "low",
    pharmacistNote: "Classic uncomplicated lower UTI. No red flags. Safe to prescribe nitrofurantoin 100mg MR BD x 3 days per NICE NG109.",
    prescription: "Nitrofurantoin 100mg MR — one capsule twice daily for 3 days",
    prescriptionItems: [
      { name: "Nitrofurantoin 100mg MR capsules", dose: "100mg", quantity: "6 capsules", instructions: "Take ONE capsule TWICE a day for 3 days, with food" },
    ],
    reviewedBy: "Pharmacist Sarah Wells",
    clinicalDecisionRationale: "Uncomplicated lower UTI in a non-pregnant adult female; no red flags; eGFR assumed normal at age 31 with no history of renal impairment.",
    actions: [{ action: "approve", actor: "Pharmacist Sarah Wells", note: "Approved per NICE NG109." }],
  },

  // ── 10. APPROVED + active messaging thread (post-dispense follow-up) ──
  {
    id: "demo-010",
    name: "Naveen Kapoor",
    email: "naveen.kapoor@example.com",
    age: 47,
    sex: "male",
    conditionId: "erectile-dysfunction",
    conditionName: "Erectile Dysfunction (Sildenafil · Tadalafil · Viagra · Cialis)",
    status: "approved",
    daysAgo: 7,
    answers: {
      duration: "Around a year",
      heart_problems: "No",
      chest_pain_on_exertion: "No",
      nitrates: "No",
      blood_pressure_recent: "128/82 — measured at Boots last week",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Generally well",
    riskCategory: "low",
    pharmacistNote: "Healthy 47y male, BP normal, no contraindications. Starting low dose sildenafil.",
    prescription: "Sildenafil 50mg — take one tablet 30–60 min before activity",
    prescriptionItems: [
      { name: "Sildenafil 50mg tablets", dose: "50mg", quantity: "8 tablets", instructions: "Take ONE tablet 30 to 60 minutes before sexual activity. Maximum one dose per 24 hours." },
    ],
    reviewedBy: "Pharmacist Ahmed Khan",
    clinicalDecisionRationale: "No cardiovascular risk factors, BP within normal range, no nitrate use.",
    messages: [
      { from: "pharmacist", body: "Hi Naveen — your prescription has been approved and dispatched today via Royal Mail Tracked. You should receive it within 2 working days. Any questions, just reply here.", daysAgo: 7 },
      { from: "patient", body: "Thanks. Just received it. Quick question — is it OK to take with a glass of wine?", daysAgo: 4 },
      { from: "pharmacist", body: "A small amount of alcohol is fine, but heavier drinking can reduce the effect and increase side effects (flushing, headache). Best to keep it to one or two units when using sildenafil.", daysAgo: 4 },
      { from: "patient", body: "Perfect, thank you — that's really helpful.", daysAgo: 3 },
    ],
    actions: [{ action: "approve", actor: "Pharmacist Ahmed Khan", note: "Approved. Standard counselling included." }],
  },

  // ── 11. APPROVED — chronic condition repeat ──
  {
    id: "demo-011",
    name: "Catherine Lawson",
    email: "catherine.lawson@example.com",
    age: 39,
    sex: "female",
    conditionId: "allergic-rhinitis",
    conditionName: "Allergic Rhinitis",
    status: "approved",
    daysAgo: 9,
    answers: {
      symptoms: ["Sneezing", "Runny nose", "Itchy eyes"],
      duration: "Every spring/summer for 10+ years",
      tried_otc: "Loratadine works well, just want a 3-month supply",
      pregnancy: "No",
    },
    allergies: "Grass pollen",
    currentMedications: "Loratadine 10mg as needed",
    medicalHistory: "Mild asthma — well controlled with salbutamol",
    riskCategory: "low",
    pharmacistNote: "Long-standing seasonal allergic rhinitis, well controlled with loratadine.",
    prescription: "Loratadine 10mg — one tablet daily as needed during pollen season",
    prescriptionItems: [
      { name: "Loratadine 10mg tablets", dose: "10mg", quantity: "84 tablets", instructions: "Take ONE tablet daily when symptoms are present" },
    ],
    reviewedBy: "Pharmacist Sarah Wells",
    actions: [{ action: "approve", actor: "Pharmacist Sarah Wells" }],
  },

  // ── 12. APPROVED — antimalarial travel prescription ──
  {
    id: "demo-012",
    name: "Thomas Pritchard",
    email: "thomas.pritchard@example.com",
    age: 33,
    sex: "male",
    conditionId: "anti-malaria",
    conditionName: "Anti-Malaria (Malarone · Doxycycline · Lariam)",
    status: "approved",
    daysAgo: 10,
    answers: {
      destination: "Tanzania — Serengeti and Zanzibar",
      travel_dates: "Departing 14 June, returning 4 July (3 weeks)",
      previous_antimalarial: "Took Malarone for Kenya 4 years ago — no problems",
      mental_health_history: "No",
      epilepsy: "No",
      pregnancy: "No",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Fit and well",
    riskCategory: "low",
    pharmacistNote: "Suitable for Malarone — high-risk falciparum area, prior tolerance, no contraindications.",
    prescription: "Atovaquone/Proguanil 250/100mg (Malarone) — one tablet daily with food",
    prescriptionItems: [
      { name: "Malarone 250/100mg tablets", dose: "250/100mg", quantity: "31 tablets", instructions: "Take ONE tablet daily with food, starting 1–2 days before travel and continuing for 7 days after leaving the malaria area." },
    ],
    reviewedBy: "Pharmacist Ahmed Khan",
    actions: [{ action: "approve", actor: "Pharmacist Ahmed Khan" }],
  },

  // ── 13. REJECTED — unsuitable, referred to GP politely ──
  {
    id: "demo-013",
    name: "Robert Eastwood",
    email: "robert.eastwood@example.com",
    age: 67,
    sex: "male",
    conditionId: "dyspepsia",
    conditionName: "Dyspepsia (Indigestion)",
    status: "rejected",
    daysAgo: 6,
    hasRedFlag: true,
    answers: {
      symptoms: ["Indigestion", "Unintentional weight loss", "Difficulty swallowing"],
      duration: "About 6 weeks",
      weight_loss_kg: "Around 4kg without trying",
      pain_at_night: "Yes, wakes me up",
      tried_otc: "Gaviscon — limited help",
    },
    allergies: "None",
    currentMedications: "Aspirin 75mg daily",
    medicalHistory: "Atrial fibrillation",
    riskCategory: "high",
    pharmacistNote: "RED FLAGS: weight loss + dysphagia + age >55 + new dyspepsia. Requires urgent 2-week-wait referral per NICE NG12. Not appropriate for online treatment.",
    referralInfo: "Urgent same-week GP appointment recommended for 2-week-wait suspected upper GI cancer pathway.",
    reviewedBy: "Pharmacist Sarah Wells",
    clinicalDecisionRationale: "ALARMS criteria positive: Anaemia not assessed, Loss of weight, Anorexia, Recent onset progressive symptoms, Melaena/haematemesis to rule out, Swallowing difficulty. NICE NG12 mandates urgent 2WW referral.",
    messages: [
      {
        from: "pharmacist",
        body: "Hi Robert — thank you for your consultation. After careful review I do not feel it would be safe to manage these symptoms online. The combination of unintentional weight loss, difficulty swallowing, and your age means you need an in-person assessment with your GP within the next few days. Please contact your GP today and let them know what you have told me here. If your GP cannot see you quickly, please call NHS 111. I'm sorry I can't help further on this occasion.",
        daysAgo: 6,
      },
    ],
    actions: [
      { action: "refer", actor: "Pharmacist Sarah Wells", note: "2WW upper GI pathway", details: { recipient: "GP", urgency: "urgent" } },
      { action: "reject", actor: "Pharmacist Sarah Wells", note: "Not safe for online management — urgent GP referral required." },
    ],
  },

  // ── 14. REJECTED — politely declined, self-care advised ──
  {
    id: "demo-014",
    name: "Megan Whitaker",
    email: "megan.whitaker@example.com",
    age: 24,
    sex: "female",
    conditionId: "dry-skin",
    conditionName: "Dry Skin / Eczema / Dermatitis",
    status: "rejected",
    daysAgo: 8,
    hasPhoto: true,
    answers: {
      area: "Hands, mostly knuckles",
      duration: "Started 4 days ago after switching washing-up liquid",
      tried_anything: "Nothing yet",
      severity: "Mild — slight redness and tightness",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Otherwise well",
    riskCategory: "low",
    pharmacistNote: "Likely irritant contact dermatitis — very mild, recent onset, no infection signs. Self-care first-line per NICE CKS.",
    reviewedBy: "Pharmacist Ahmed Khan",
    messages: [
      {
        from: "pharmacist",
        body: "Hi Megan — thanks for the photo. This looks like very mild irritant dermatitis from the new washing-up liquid. Most cases settle within a week with self-care, so a prescription isn't needed yet. Please switch back to your old detergent (or use gloves), apply a fragrance-free moisturiser like E45 or Cetraben several times a day, and avoid harsh soaps. If it hasn't improved in 7 days, or if it spreads or becomes painful, please restart your consultation and we'll reassess.",
        daysAgo: 8,
      },
    ],
    actions: [{ action: "reject", actor: "Pharmacist Ahmed Khan", note: "Self-care first-line; restart consultation if no improvement in 7 days." }],
  },

  // ── 15. APPROVED — paediatric (head lice) ──
  {
    id: "demo-015",
    name: "Laura Kennedy",
    email: "laura.kennedy@example.com",
    age: 38,
    sex: "female",
    conditionId: "head-lice",
    conditionName: "Head Lice",
    status: "approved",
    daysAgo: 12,
    answers: {
      who: "My daughter, age 7",
      duration: "Spotted live lice this morning",
      tried_anything: "Wet combing only",
      siblings: "One sibling, age 4 — being checked",
      pregnant_or_breastfeeding: "No (treating child)",
    },
    allergies: "None",
    currentMedications: "None",
    medicalHistory: "Healthy",
    riskCategory: "low",
    pharmacistNote: "Confirmed live lice in child age 7. Dimeticone 4% lotion appropriate first-line.",
    prescription: "Dimeticone 4% lotion — apply to dry hair, leave 8 hours, repeat after 7 days",
    prescriptionItems: [
      { name: "Hedrin 4% Lotion (dimeticone)", dose: "4%", quantity: "150ml bottle", instructions: "Apply enough to coat dry hair and scalp. Leave on for at least 8 hours (overnight is fine). Wash out and comb. Repeat after 7 days to catch newly hatched lice." },
    ],
    reviewedBy: "Pharmacist Sarah Wells",
    actions: [{ action: "approve", actor: "Pharmacist Sarah Wells" }],
  },
];

function ts(daysAgo: number, hoursAgo = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d;
}

async function seed() {
  for (const c of DEMOS) {
    const createdAt = ts(c.daysAgo, c.hoursAgo ?? 0);
    const reviewedAt = c.status === "approved" || c.status === "rejected" ? ts(Math.max(0, c.daysAgo - 1)) : null;

    await db.insert(consultationsTable).values({
      id: c.id,
      patientName: c.name,
      patientEmail: c.email,
      patientAge: c.age,
      patientSex: c.sex,
      conditionId: c.conditionId,
      conditionName: c.conditionName,
      status: c.status,
      answers: c.answers ?? {},
      hasRedFlag: c.hasRedFlag ?? false,
      hasPhoto: c.hasPhoto ?? false,
      pharmacistNote: c.pharmacistNote ?? null,
      prescription: c.prescription ?? null,
      prescriptionItems: c.prescriptionItems ?? [],
      referralInfo: c.referralInfo ?? null,
      allergies: c.allergies ?? null,
      currentMedications: c.currentMedications ?? null,
      medicalHistory: c.medicalHistory ?? null,
      isPregnant: c.isPregnant ?? null,
      riskCategory: c.riskCategory ?? "low",
      verifiedHeightCm: c.verifiedHeightCm ?? null,
      verifiedWeightKg: c.verifiedWeightKg ?? null,
      bmi: c.bmi ?? null,
      reviewedBy: c.reviewedBy ?? null,
      clinicalDecisionRationale: c.clinicalDecisionRationale ?? null,
      consentToTreatment: true,
      consentToDelivery: true,
      consentDataProcessing: true,
      hasRegularGp: true,
      createdAt,
      reviewedAt,
    } as never).onConflictDoNothing();

    // Messages
    if (c.messages) {
      for (let i = 0; i < c.messages.length; i++) {
        const m = c.messages[i]!;
        await db.insert(consultationMessagesTable).values({
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
        } as never).onConflictDoNothing();
      }
    }

    // Actions
    if (c.actions) {
      for (let i = 0; i < c.actions.length; i++) {
        const a = c.actions[i]!;
        await db.insert(consultationActionsTable).values({
          id: `${c.id}-act-${i + 1}`,
          consultationId: c.id,
          action: a.action,
          actorRole: "pharmacist",
          actorName: a.actor ?? "Pharmacist",
          details: a.details ?? {},
          note: a.note ?? null,
          createdAt: reviewedAt ?? createdAt,
        } as never).onConflictDoNothing();
      }
    }
  }

  const r = await db.execute<{ c: string }>(sql`select count(*)::text as c from consultations where id like 'demo-%'`);
  console.log(`Seeded ${r.rows[0]?.c} demo consultations.`);
}

async function main() {
  await wipe();
  await seed();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

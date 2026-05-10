import { db, drugInteractionsTable, clinicalRepliesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const INTERACTIONS = [
  { id: "warfarin-ibuprofen", drugA: "Warfarin", drugB: "Ibuprofen", severity: "major", mechanism: "Additive bleeding risk + GI ulceration", advice: "Avoid concomitant NSAID; offer paracetamol instead." },
  { id: "warfarin-aspirin", drugA: "Warfarin", drugB: "Aspirin", severity: "major", mechanism: "Increased bleeding risk", advice: "Avoid unless cardioprotective dose authorised by anticoagulation clinic." },
  { id: "warfarin-clarithromycin", drugA: "Warfarin", drugB: "Clarithromycin", severity: "major", mechanism: "Inhibits CYP3A4 — raises INR", advice: "Choose alternative macrolide or monitor INR within 3-5 days." },
  { id: "warfarin-fluconazole", drugA: "Warfarin", drugB: "Fluconazole", severity: "major", mechanism: "Potentiates anticoagulant effect", advice: "Reduce warfarin dose 25–50% and monitor INR." },
  { id: "warfarin-miconazole", drugA: "Warfarin", drugB: "Miconazole", severity: "contraindicated", mechanism: "Severe INR elevation, bleeding", advice: "Do not co-prescribe — choose nystatin or topical alternative." },
  { id: "ssri-tramadol", drugA: "Sertraline", drugB: "Tramadol", severity: "major", mechanism: "Serotonin syndrome risk", advice: "Avoid combination; use paracetamol/codeine if analgesia needed." },
  { id: "ssri-triptan", drugA: "Sertraline", drugB: "Sumatriptan", severity: "moderate", mechanism: "Serotonin syndrome (uncommon)", advice: "Counsel patient on symptoms; lowest effective triptan dose." },
  { id: "fluoxetine-tramadol", drugA: "Fluoxetine", drugB: "Tramadol", severity: "major", mechanism: "Serotonin syndrome risk", advice: "Avoid combination." },
  { id: "simvastatin-clarithromycin", drugA: "Simvastatin", drugB: "Clarithromycin", severity: "contraindicated", mechanism: "Rhabdomyolysis risk via CYP3A4 inhibition", advice: "Hold simvastatin during course or choose azithromycin." },
  { id: "simvastatin-amiodarone", drugA: "Simvastatin", drugB: "Amiodarone", severity: "major", mechanism: "Increased myopathy risk", advice: "Do not exceed simvastatin 20 mg daily." },
  { id: "metformin-contrast", drugA: "Metformin", drugB: "Iodinated Contrast", severity: "major", mechanism: "Lactic acidosis risk if AKI", advice: "Withhold metformin 48h around contrast study." },
  { id: "ace-potassium", drugA: "Ramipril", drugB: "Spironolactone", severity: "major", mechanism: "Hyperkalaemia risk", advice: "Monitor U&Es within 1 week, hold if K+ >5.5." },
  { id: "ace-nsaid", drugA: "Ramipril", drugB: "Ibuprofen", severity: "moderate", mechanism: "Reduced antihypertensive effect + AKI risk", advice: "Use shortest course; check renal function in elderly." },
  { id: "sildenafil-nitrate", drugA: "Sildenafil", drugB: "Glyceryl Trinitrate", severity: "contraindicated", mechanism: "Severe hypotension", advice: "Absolute contraindication." },
  { id: "tadalafil-nitrate", drugA: "Tadalafil", drugB: "Glyceryl Trinitrate", severity: "contraindicated", mechanism: "Severe hypotension", advice: "Absolute contraindication." },
  { id: "doxycycline-antacid", drugA: "Doxycycline", drugB: "Calcium Carbonate", severity: "moderate", mechanism: "Chelation reduces absorption", advice: "Separate by 2 hours." },
  { id: "ciprofloxacin-tizanidine", drugA: "Ciprofloxacin", drugB: "Tizanidine", severity: "contraindicated", mechanism: "Marked hypotension and sedation", advice: "Do not co-prescribe." },
  { id: "amiodarone-warfarin", drugA: "Amiodarone", drugB: "Warfarin", severity: "major", mechanism: "Potentiates anticoagulation", advice: "Reduce warfarin dose 30–50% and monitor INR closely." },
  { id: "ssri-warfarin", drugA: "Sertraline", drugB: "Warfarin", severity: "major", mechanism: "Increased bleeding risk", advice: "Counsel on bleeding signs; consider INR check." },
  { id: "azithromycin-warfarin", drugA: "Azithromycin", drugB: "Warfarin", severity: "moderate", mechanism: "Mild INR increase", advice: "Check INR mid-course." },
  { id: "trimethoprim-methotrexate", drugA: "Trimethoprim", drugB: "Methotrexate", severity: "contraindicated", mechanism: "Bone-marrow suppression — pancytopenia", advice: "Choose alternative antibiotic." },
  { id: "lithium-nsaid", drugA: "Lithium", drugB: "Ibuprofen", severity: "major", mechanism: "Reduced renal clearance — toxicity", advice: "Avoid; use paracetamol." },
  { id: "lithium-ace", drugA: "Lithium", drugB: "Ramipril", severity: "major", mechanism: "Lithium toxicity", advice: "Monitor lithium level within 5 days." },
  { id: "digoxin-amiodarone", drugA: "Digoxin", drugB: "Amiodarone", severity: "major", mechanism: "Digoxin levels rise 70%", advice: "Halve digoxin dose, monitor levels." },
  { id: "clopidogrel-omeprazole", drugA: "Clopidogrel", drugB: "Omeprazole", severity: "moderate", mechanism: "Reduced clopidogrel activation via CYP2C19", advice: "Switch to pantoprazole or lansoprazole." },
];

const REPLIES = [
  { id: "rep-await-photo", title: "Awaiting clearer photo", body: "Thanks for your consultation. To make a safe clinical decision I need a clearer photograph of the affected area in good daylight — please ensure it is in focus and includes a 1cm reference (e.g. a coin) for scale.", category: "more_info", statusContext: "more_info_needed", conditionId: null },
  { id: "rep-bp-reading", title: "Need recent BP reading", body: "Before I can issue this medication I need a blood pressure reading from the last 6 months. Please measure at home or at any pharmacy and reply with the systolic and diastolic values.", category: "more_info", statusContext: "more_info_needed", conditionId: null },
  { id: "rep-gp-shared", title: "Shared with your GP", body: "I have shared this consultation with your GP surgery for their records. There is nothing further you need to do, and your medication will be dispatched today.", category: "approve_followup", statusContext: "approved", conditionId: null },
  { id: "rep-not-suitable", title: "Not suitable for online care", body: "After careful review I do not feel it would be safe to manage this presentation through an online consultation. I'd recommend an in-person assessment with your GP or NHS 111 if symptoms are progressing.", category: "decline", statusContext: "rejected", conditionId: null },
  { id: "rep-red-flag-111", title: "Refer to NHS 111", body: "Some of the symptoms you describe are red-flag and need same-day assessment. Please contact NHS 111 (or 999 if you feel unwell quickly) and let them know what you have told me here.", category: "decline", statusContext: "rejected", conditionId: null },
  { id: "rep-wait-7days", title: "Self-care first 7 days", body: "Most cases improve with self-care. Please try over-the-counter relief, rest and hydration for 7 days. If symptoms persist or worsen, restart your consultation and we will reassess.", category: "decline", statusContext: "rejected", conditionId: null },
  { id: "rep-allergy-check", title: "Confirm allergy details", body: "Before prescribing I need to confirm exactly what reaction you had previously and to which medication. Please reply with as much detail as possible (rash, swelling, breathing difficulty etc.).", category: "more_info", statusContext: "more_info_needed", conditionId: null },
  { id: "rep-pregnancy", title: "Confirm pregnancy/breastfeeding", body: "This medication has specific guidance in pregnancy and breastfeeding. Please confirm whether either applies to you (or could apply) before I can prescribe.", category: "more_info", statusContext: "more_info_needed", conditionId: null },
  { id: "rep-dispatch-today", title: "Order dispatched today", body: "Good news — your prescription has been approved and your order will be dispatched today via Royal Mail Tracked. You will receive a tracking link by email shortly.", category: "approve_followup", statusContext: "approved", conditionId: null },
  { id: "rep-take-with-food", title: "Take with food reminder", body: "A quick safety reminder — please take this medication with food to reduce the chance of stomach upset, and complete the full course even if you feel better.", category: "approve_followup", statusContext: "approved", conditionId: null },
];

async function main() {
  for (const i of INTERACTIONS) {
    await db
      .insert(drugInteractionsTable)
      .values(i)
      .onConflictDoUpdate({
        target: drugInteractionsTable.id,
        set: { drugA: i.drugA, drugB: i.drugB, severity: i.severity, mechanism: i.mechanism, advice: i.advice },
      });
  }
  for (const r of REPLIES) {
    await db
      .insert(clinicalRepliesTable)
      .values({ ...r, createdBy: "system" })
      .onConflictDoUpdate({
        target: clinicalRepliesTable.id,
        set: { title: r.title, body: r.body, category: r.category, statusContext: r.statusContext, conditionId: r.conditionId },
      });
  }
  const ic = (await db.execute<{ c: string }>(sql`select count(*)::text as c from drug_interactions`)).rows[0]?.c;
  const rc = (await db.execute<{ c: string }>(sql`select count(*)::text as c from clinical_replies`)).rows[0]?.c;
  console.log(`Seeded: ${ic} drug interactions, ${rc} clinical replies.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

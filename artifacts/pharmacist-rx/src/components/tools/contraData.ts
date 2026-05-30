/* ============================================================================
   Contraindications reference dataset (SOP Appendix 24 + extensions).
   Top categories → sub-categories → conditions / sections / rationale,
   plus a flat Knowledge Base list view.
   ============================================================================ */

export type ContraStatus = "reject" | "follow_sop" | "escalate" | "prescribe";

export type ContraSection = {
  title: string;
  items?: string[];
  subSections?: { title: string; items: string[] }[];
};

export type ContraSubTab = {
  id: string;
  label: string;
  icon: string;
  title?: string;
  action?: string;
  actionNote?: string;
  actionStyle?: "reject" | "hold" | "info";
  actionNoteStyle?: "warn" | "neutral";
  alsoKnownAs?: string;
  safeIf?: string;
  rationale?: string;
  note?: string;
  exclusion?: string;
  questionToAsk?: string;
  ifNeeded?: string;
  conditions?: string[];
  conditionsLabel?: string;
  conditionsLabelStyle?: "warn" | "info" | "neutral";
  rejectIf?: string | string[];
  prescribeIf?: string | string[];
  specialConsideration?: { label: string; body: string };
  sections?: ContraSection[];
};

export type ContraKbItem = {
  cat: string;
  name: string;
  status: ContraStatus;
  desc: string;
  note?: string;
};

export type ContraTopTab = {
  id: string;
  label: string;
  icon: string;
  color: string;
  colorDark: string;
  colorBorder: string;
  colorShadow: string;
  view?: "list";
  subTabs: ContraSubTab[];
  categories?: string[];
  conditions?: ContraKbItem[];
};

export const MG_CONTRA_DATA: { topTabs: ContraTopTab[] } = {
  topTabs: [
    {
      id: "absolute",
      label: "Absolute Contraindications",
      icon: "⛔",
      color: "#ef4444",
      colorDark: "#dc2626",
      colorBorder: "#b91c1c",
      colorShadow: "rgba(220,38,38,0.35)",
      subTabs: [
        {
          id: "pancreatitis",
          label: "Pancreatitis",
          icon: "🔴",
          action: "REJECT IMMEDIATELY",
          conditionsLabel: "Includes:",
          conditions: ["Pancreatitis", "Acute pancreatic insufficiency", "Chronic pancreatic insufficiency"],
          rationale: "GLP-1s have a black box warning for increased risk of pancreatitis.",
        },
        {
          id: "eating",
          label: "Eating Disorders",
          icon: "🟣",
          action: "REJECT IMMEDIATELY",
          conditions: ["Anorexia nervosa", "Bulimia nervosa", "Binge Eating Disorder (BED)", "Avoidant/Restrictive Food Intake Disorder (ARFID)"],
          rationale: "GLP-1s suppress appetite and can worsen eating disorder pathology.",
        },
        {
          id: "t1d",
          label: "Type 1 Diabetes",
          icon: "💉",
          action: "REJECT IMMEDIATELY",
          alsoKnownAs: "Insulin-dependent diabetes mellitus (IDDM)",
          rationale: "GLP-1s are not licensed for Type 1 diabetes treatment. Risk of diabetic ketoacidosis.",
        },
        {
          id: "liver",
          label: "Liver Conditions",
          icon: "🫀",
          action: "REJECT IMMEDIATELY",
          conditions: ["Liver cirrhosis", "Liver transplant", "Severe hepatic impairment"],
          rationale: "Severe liver impairment affects drug metabolism and safety.",
          note: "For Nevolat prescriptions: any liver disease (any severity) is also an absolute contraindication.",
        },
        {
          id: "endocrine",
          label: "Endocrine Disorders",
          icon: "⚡",
          action: "REJECT IMMEDIATELY",
          conditions: [
            "Acromegaly (Growth hormone disorder)",
            "Cushing's syndrome",
            "Addison's disease (Adrenal insufficiency)",
            "Congenital Adrenal Hyperplasia",
            "Overactive thyroid awaiting radioactive iodine or surgery",
          ],
          rationale: "These hormonal disorders can cause secondary obesity requiring specialist management.",
        },
        {
          id: "gi",
          label: "GI Conditions",
          icon: "🔵",
          action: "REJECT IMMEDIATELY",
          conditions: ["Ulcerative Colitis", "Crohn's disease", "Gastroparesis (delayed gastric emptying)", "Chronic malabsorption syndrome"],
          rationale: "GLP-1s delay gastric emptying which can worsen these conditions.",
        },
        {
          id: "thyroid",
          label: "Thyroid & Cancer",
          icon: "🎗️",
          action: "REJECT IMMEDIATELY",
          conditions: [
            "Multiple Endocrine Neoplasia type 2 (MEN2)",
            "Medullary Thyroid cancer (personal or family history)",
            "Thyroid disease — for Nevolat prescriptions ONLY",
            "Any form of cancer currently being treated by specialist",
          ],
          rationale: "GLP-1s have a black box warning against use with medullary thyroid cancer or MEN2.",
          note: "Calcitonin >100 ng/L is an absolute contraindication for Nevolat.",
        },
        {
          id: "medications",
          label: "Medications",
          icon: "💊",
          action: "REJECT IF ON REPEAT MEDICATION LIST",
          sections: [
            { title: "INSULIN", items: ["Any insulin on repeat medication list"] },
            { title: "ORAL DIABETIC — Sulfonylureas", items: ["Diamicron (gliclazide)", "Daonil (glibenclamide)", "Rastin (tolbutamide)"] },
            { title: "ORAL DIABETIC — DPP-4 inhibitors", items: ["Januvia (sitagliptin)", "Galvus (vildagliptin)", "Trajenta (linagliptin)"] },
            { title: "ORAL DIABETIC — SGLT2 inhibitors", items: ["Jardiance (empagliflozin)", "Forxiga (dapagliflozin)", "Invokana (canagliflozin)"] },
            { title: "ORAL DIABETIC — Thiazolidinediones", items: ["Actos (pioglitazone)"] },
            { title: "NARROW THERAPEUTIC INDEX", items: ["Amiodarone", "Carbamazepine", "Ciclosporin", "Clozapine", "Digoxin", "Fenfluramine", "Lithium", "Mycophenolate mofetil", "Oral methotrexate", "Phenobarbital", "Phenytoin", "Somatrogon", "Tacrolimus", "Theophylline", "Warfarin"] },
          ],
          rationale: "These medications have significant interactions or indicate conditions incompatible with GLP-1 treatment.",
        },
        {
          id: "kidney",
          label: "Kidney Disease",
          icon: "🫘",
          action: "REJECT IMMEDIATELY",
          conditions: ["Chronic kidney disease with eGFR less than 30 ml/min (severe / Stage 4–5)"],
          rationale: "Severe renal impairment affects drug clearance and increases risk of adverse effects.",
          ifNeeded: "Request a recent eGFR result before approving.",
        },
        {
          id: "cardiac",
          label: "Cardiac Conditions",
          icon: "❤️",
          action: "REJECT IMMEDIATELY",
          conditions: ["Heart failure with shortness of breath at rest (Stage IV)", "Active retinopathy"],
          rationale: "Severe heart failure increases risk of adverse cardiovascular events.",
          ifNeeded: "Request a recent cardiology clinic letter before approving.",
        },
      ],
    },
    {
      id: "timesensitive",
      label: "Time-Sensitive Conditions",
      icon: "⏱️",
      color: "#fbbf24",
      colorDark: "#f59e0b",
      colorBorder: "#b45309",
      colorShadow: "rgba(245,158,11,0.35)",
      subTabs: [
        {
          id: "bariatric",
          label: "Bariatric Surgery",
          icon: "🩻",
          action: "REJECT",
          actionNote: "if <12 months post-surgery",
          safeIf: "If surgery was ≥12 months ago (1 year or more)",
          conditionsLabel: "Surgery Types:",
          conditionsLabelStyle: "info",
          conditions: [
            "Roux-en-Y Gastric Bypass (RYGB)",
            "Sleeve Gastrectomy",
            "Adjustable Gastric Band (Lap-Band)",
            "Biliopancreatic Diversion with Duodenal Switch (BPD/DS)",
            "Mini Gastric Bypass (OAGB)",
            "Endoscopic Bariatric Procedures (gastric balloon)",
          ],
          ifNeeded: "If timing is unknown, email the patient to confirm the date before approving.",
        },
        {
          id: "gallbladder",
          label: "Gallbladder Removal",
          icon: "🟪",
          action: "REJECT",
          actionNote: "if cholecystectomy <3 months",
          safeIf: "If ≥3 months post-cholecystectomy with no ongoing symptoms",
          conditionsLabel: "Includes:",
          conditionsLabelStyle: "info",
          conditions: ["Cholecystectomy within last 3 months", "Active gallstones (symptomatic)", "Acute biliary colic in last 6 months"],
          rationale: "GLP-1s can increase risk of gallbladder events. Allow recovery time before initiating.",
          ifNeeded: "If timing is unknown, email the patient to confirm the date before approving.",
        },
        {
          id: "diabetic_meds",
          label: "Diabetic Medications",
          icon: "💊",
          action: "REJECT",
          actionNote: "if EITHER condition applies",
          conditions: ["Prescribed within last 3 months as acute", "OR present on repeat medication list"],
          sections: [
            {
              title: "ORAL DIABETIC MEDICATIONS:",
              subSections: [
                { title: "Sulfonylureas:", items: ["Diamicron (gliclazide)", "Daonil (glibenclamide)", "Rastin (tolbutamide)"] },
                { title: "DPP-4 inhibitors:", items: ["Januvia (sitagliptin)", "Galvus (vildagliptin)", "Trajenta (linagliptin)"] },
                { title: "SGLT2 inhibitors:", items: ["Jardiance (empagliflozin)", "Forxiga (dapagliflozin)", "Invokana (canagliflozin)"] },
                { title: "Thiazolidinediones:", items: ["Actos (pioglitazone)"] },
              ],
            },
            { title: "INSULIN:", items: ["Any insulin on repeat medication list"] },
          ],
          rationale: "Concurrent diabetic medications cause unsafe hypoglycaemia risk with GLP-1s.",
        },
        {
          id: "nti_meds",
          label: "NTI Medications",
          icon: "⚠️",
          action: "REJECT",
          actionNote: "if EITHER condition applies",
          conditions: ["Prescribed within last 3 months as acute", "OR present on repeat medication list"],
          sections: [
            {
              title: "NTI MEDICATIONS LIST:",
              items: ["Amiodarone", "Oral methotrexate", "Carbamazepine", "Phenobarbital", "Ciclosporin", "Phenytoin", "Clozapine", "Somatrogon", "Digoxin", "Tacrolimus", "Fenfluramine", "Theophylline", "Lithium", "Warfarin", "Mycophenolate mofetil"],
            },
          ],
          rationale: "GLP-1s delay gastric emptying, which can affect absorption and blood levels of these medications.",
        },
        {
          id: "orlistat",
          label: "Orlistat",
          icon: "🟠",
          action: "REJECT",
          actionNote: "if EITHER condition applies",
          conditions: ["Prescribed within last 3 months as acute", "OR present on repeat medication list"],
          rationale: "Orlistat affects fat absorption and may interfere with GLP-1 efficacy. Must be stopped before starting treatment.",
        },
      ],
    },
    {
      id: "clinical",
      label: "Clinical Details Required",
      icon: "📋",
      color: "#60a5fa",
      colorDark: "#3b82f6",
      colorBorder: "#1d4ed8",
      colorShadow: "rgba(59,130,246,0.35)",
      subTabs: [
        {
          id: "gallstones",
          label: "Gallstones",
          icon: "🟪",
          action: "HOLD ORDER",
          actionStyle: "hold",
          actionNote: "if no evidence of cholecystectomy → Hold order",
          title: "Cholelithiasis (Gallstones) or Cholecystitis",
          questionToAsk: "Have you had your gallbladder removed? If yes, when?",
          rejectIf: "Patient confirms NO cholecystectomy (gallbladder still present)",
          prescribeIf: "Cholecystectomy confirmed by patient (even if not visible on SCR)",
        },
        {
          id: "heart_failure",
          label: "Heart Failure",
          icon: "❤️",
          action: "IF NO INFORMATION ON STAGE → EMAIL PATIENT",
          actionStyle: "info",
          title: "Heart Failure (HF)",
          rejectIf: "Patient confirms Stage IV heart failure (shortness of breath at rest)",
          prescribeIf: "Stage I, II, or III confirmed",
        },
        {
          id: "ckd",
          label: "Chronic Kidney Disease",
          icon: "🫘",
          action: "IF NO EGFR INFORMATION → EMAIL PATIENT",
          actionStyle: "info",
          title: "Chronic Kidney Disease (CKD)",
          rejectIf: "eGFR <30 ml/min (Stage 4-5 / Severe CKD)",
          prescribeIf: "eGFR ≥30 ml/min (Stage 1-3)",
        },
        {
          id: "retinopathy",
          label: "Retinopathy",
          icon: "👁️",
          action: "DETERMINE TYPE OF RETINOPATHY BEFORE DECISION",
          actionStyle: "info",
          title: "Retinopathy - Type Matters!",
          rejectIf: "Active diabetic retinopathy under regular eye clinic care",
          prescribeIf: "Non-diabetic causes (hypertensive, toxoplasma chorioretinitis, etc.)",
        },
      ],
    },
    {
      id: "assessment",
      label: "Patient Assessment Required",
      icon: "🧑‍⚕️",
      color: "#a78bfa",
      colorDark: "#8b5cf6",
      colorBorder: "#6d28d9",
      colorShadow: "rgba(139,92,246,0.35)",
      subTabs: [
        {
          id: "cancer",
          label: "Cancer",
          icon: "🎗️",
          title: "Cancer Diagnosis",
          exclusion: "Medullary thyroid cancer and MEN2 are absolute contraindications",
          conditionsLabel: "Information needed:",
          conditionsLabelStyle: "info",
          conditions: [
            "Treatment status (active, in remission, cured)",
            "Remission status and duration",
            "Oncology team discharge status",
            "For breast cancer: Whether on hormone therapy only (e.g., tamoxifen, Zoladex)",
          ],
          specialConsideration: {
            label: "🌷 Breast Cancer - Special Consideration",
            body: "Breast cancer history requires clarification, not automatic rejection. Email patient to confirm current cancer status before making decision.",
          },
          rejectIf: [
            "Currently under oncology care",
            "Receiving active cancer treatment (chemotherapy, radiotherapy, targeted therapy)",
            "Recent recurrence or spread of cancer",
          ],
          prescribeIf: [
            "Cancer in remission and discharged from oncology team",
            "On long-term hormone therapy only (tamoxifen/Zoladex) with no active treatment",
            "No recent recurrence or current oncology involvement",
          ],
        },
        {
          id: "pregnancy_a",
          label: "Pregnancy",
          icon: "🤰",
          title: "Pregnancy, Breastfeeding & Conception",
          action: "EMAIL PATIENT",
          actionStyle: "info",
          rejectIf: ["Currently pregnant", "Breastfeeding", "Planning pregnancy within 3 months"],
          prescribeIf: "Patient confirms none of the above apply",
        },
        {
          id: "dementia",
          label: "Dementia",
          icon: "🧠",
          title: "Dementia / Cognitive Impairment",
          action: "EMAIL PATIENT",
          actionStyle: "info",
          rejectIf: "Patient unable to safely self-administer medication or lacks adequate support",
          prescribeIf: "Patient has adequate support and can safely use medication",
        },
        {
          id: "malabsorption",
          label: "Malabsorption",
          icon: "🍽️",
          title: "Chronic Malabsorption",
          action: "EMAIL PATIENT",
          actionStyle: "info",
          rejectIf: "Patient provides evidence of formal chronic malabsorption syndrome diagnosis",
          prescribeIf: "No formal diagnosis confirmed (may be historical/resolved)",
        },
        {
          id: "mental_health",
          label: "Mental Health",
          icon: "💭",
          title: "Depression or Anxiety",
          action: "EMAIL PATIENT",
          actionStyle: "info",
          rejectIf: ["Acutely unwell <3 months", "Started new antidepressant recently", "Active thoughts of self-harm or suicide"],
        },
        {
          id: "suicidal",
          label: "Suicidal Ideation",
          icon: "⚠️",
          title: "Active Suicidal Ideation",
          action: "REJECT IMMEDIATELY",
          actionNote: "if mentioned in last 12 months",
          actionNoteStyle: "warn",
        },
        {
          id: "alcohol",
          label: "Alcohol",
          icon: "🍺",
          title: "Alcohol Abuse or Dependence",
          action: "EMAIL PATIENT",
          actionStyle: "info",
          rejectIf: ["Current alcohol abuse or dependence", "Alcohol abuse mentioned in last 12 months", "In treatment/rehabilitation"],
          prescribeIf: "Historical alcohol issues (>12 months ago) and currently stable",
        },
      ],
    },
    {
      id: "knowledge",
      label: "Knowledge Base",
      icon: "📚",
      color: "#10b981",
      colorDark: "#059669",
      colorBorder: "#047857",
      colorShadow: "rgba(16,185,129,0.35)",
      view: "list",
      subTabs: [],
      categories: ["GIT", "Cardiology", "Endocrine", "Mental Health", "Neurology", "Renal", "Bariatric", "Cancer", "Other"],
      conditions: [
        { cat: "GIT", name: "Pancreatitis (acute or chronic)", status: "reject", desc: "Any diagnosis of this at any time is an exclusion. Request hospital discharge letter for suspected/confirmed acute pancreatitis." },
        { cat: "GIT", name: "Liver Cirrhosis", status: "reject", desc: "Any diagnosis of this at any time is an exclusion." },
        { cat: "GIT", name: "Primary Biliary Cholangitis", status: "reject", desc: "Any diagnosis of this at any time is an exclusion." },
        { cat: "GIT", name: "Ulcerative Colitis", status: "reject", desc: "Any diagnosis of this at any time is an exclusion." },
        { cat: "GIT", name: "Crohn's Disease", status: "reject", desc: "Any diagnosis of this at any time is an exclusion." },
        { cat: "GIT", name: "Ileostomy or Colostomy stoma", status: "reject", desc: "This is an exclusion." },
        { cat: "GIT", name: "End Stage Liver Failure", status: "reject", desc: "Do not prescribe, regardless if asymptomatic or not." },
        { cat: "GIT", name: "Gallstones (no GB removal)", status: "reject", desc: "Do not prescribe, regardless if asymptomatic or not." },
        { cat: "GIT", name: "Cholecystitis (no GB removal)", status: "reject", desc: "Reject." },
        { cat: "GIT", name: "Cholecystectomy", status: "follow_sop", desc: "Reject if <12 months, prescribe if surgery was more than a year ago. Refer to SCR Screening SOP." },
        { cat: "GIT", name: "Viral Hepatitis", status: "escalate", desc: "Acute/Active disease is an exclusion. Chronic/carrier status may be okay if no end-stage liver disease or cirrhosis. Clinic letter from specialist may be beneficial." },
        { cat: "GIT", name: "Autoimmune Hepatitis", status: "escalate", desc: "Will need further information including if under a specialist and on treatment. Recent clinic letter and/or letter of support from specialist needed." },
        { cat: "GIT", name: "Bile Acid Malabsorption", status: "escalate", desc: "Gather more information about cause and symptoms. REJECT if symptomatic and under consultant. OK if symptom free and not under secondary care." },
        { cat: "GIT", name: "Infective or Ischaemic Colitis", status: "escalate", desc: "Gather more info: blood tests, stools tests, colonoscopy results, symptoms. May be safe if all symptoms resolved; letter from specialist beneficial." },
        { cat: "GIT", name: "Deranged LFTs", status: "escalate", desc: "Confirm pt does not suffer from viral hepatitis. Recent bloods and liver scan may be helpful. Otherwise, usually safe to prescribe." },
        { cat: "GIT", name: "IBS", status: "escalate", desc: "Safe to prescribe if tolerating other SE. If SE intolerable, review dose & consider reducing. If IBS flared up, pause GLP1 until reduced." },
        { cat: "GIT", name: "Splenectomy", status: "escalate", desc: "Check why they had splenectomy. Most cases after trauma = OK. Other causes discuss case by case." },
        { cat: "GIT", name: "Gallbladder Polyp", status: "escalate", desc: "If benign polyp and no gallstones, no prev cholecystitis then OK to use." },
        { cat: "GIT", name: "Coeliac Disease", status: "prescribe", desc: "If well controlled OK to prescribe." },
        { cat: "GIT", name: "Gilbert Syndrome", status: "prescribe", desc: "Safe to prescribe." },
        { cat: "GIT", name: "Hiatus Hernia", status: "prescribe", desc: "Ok to prescribe, but 20% chance of reflux as side effect of GLP1." },
        { cat: "GIT", name: "Diverticular Disease", status: "prescribe", desc: "As long as not had any bowel removed - safe to prescribe." },
        { cat: "Cardiology", name: "Heart Failure Stage 4", status: "reject", desc: "Any diagnosis of this (SOBAR — shortness of breath at rest) at any time is an exclusion." },
        { cat: "Cardiology", name: "Long QT Syndrome", status: "reject", desc: "Effects of GLP1 Rx not known on this condition and we cannot monitor — this is an exclusion." },
        { cat: "Cardiology", name: "POTS", status: "escalate", desc: "If symptomatic (dizziness, fainting, palpitations, SOB, chest pain triggered by standing) REJECT. If asymptomatic, may be eligible." },
        { cat: "Cardiology", name: "Cardiomyopathy", status: "escalate", desc: "Get more info: diagnosis/symptoms. Specialist letter and recent echo may be beneficial." },
        { cat: "Cardiology", name: "Heart Block / Pacemaker", status: "escalate", desc: "Need further info — if controlled/stable, asymptomatic, no comorbidity (e.g. Heart Failure), should be okay. Letter from specialist beneficial." },
        { cat: "Cardiology", name: "Ischaemic Heart Disease", status: "escalate", desc: "Specialist clinic letter beneficial. If stable, asymptomatic, no recent (<8 weeks) cardiac event, should be okay." },
        { cat: "Cardiology", name: "Congenital Heart Disease", status: "escalate", desc: "If surgically corrected, no longer under specialist care and no symptoms may be able to prescribe." },
        { cat: "Cardiology", name: "Atrial Fibrillation", status: "escalate", desc: "If well controlled with medication (non-NTI drugs) and no comorbidity (e.g. Stage 4 HF or cardiomyopathy) OK to use." },
        { cat: "Cardiology", name: "SVT", status: "escalate", desc: "If asymptomatic/controlled on meds and not under specialist, safe to prescribe. If under specialist, may need letter of support." },
        { cat: "Cardiology", name: "Heart Failure Stages 1-3", status: "prescribe", desc: "Safe to prescribe as long as pt is not NYHA stage 4 (symptomatic at rest)." },
        { cat: "Endocrine", name: "Type 1 Diabetes", status: "reject", desc: "Reject (as per SCR Screening SOP)." },
        { cat: "Endocrine", name: "LADA", status: "reject", desc: "These patients are essentially 'type 1' diabetic phenotype — excluded from GLP1 treatment." },
        { cat: "Endocrine", name: "Hypoglycaemia", status: "reject", desc: "We do not have capacity to monitor these patients — this is an exclusion." },
        { cat: "Endocrine", name: "Acromegaly", status: "reject", desc: "Reject (as per SCR Screening SOP)." },
        { cat: "Endocrine", name: "Cushing's Syndrome", status: "reject", desc: "Reject (as per SCR Screening SOP)." },
        { cat: "Endocrine", name: "Addison's Disease", status: "reject", desc: "Reject (as per SCR Screening SOP)." },
        { cat: "Endocrine", name: "Congenital Adrenal Hyperplasia", status: "reject", desc: "Reject (as per SCR Screening SOP)." },
        { cat: "Endocrine", name: "Gastroparesis", status: "reject", desc: "Reject (as per SCR Screening SOP)." },
        { cat: "Endocrine", name: "MEN2", status: "reject", desc: "Reject now." },
        { cat: "Endocrine", name: "Raised Triglycerides", status: "escalate", desc: "If fasting TG >4.5 do not prescribe (pancreatitis risk). Check if test was fasted; if not ask to repeat fasted." },
        { cat: "Endocrine", name: "Hypopituitarism / Prolactinoma", status: "escalate", desc: "Need more info — check with endocrinologist before starting. May be safe if benefits outweigh risks." },
        { cat: "Endocrine", name: "Thyroid Nodules (U3+)", status: "escalate", desc: "Obtain more info; if U3 or above — ask about biopsy and if under investigation. Exception: Nevolat where no Thyroid disease patients should have Rx." },
        { cat: "Endocrine", name: "Thyroid Nodules (U2)", status: "prescribe", desc: "These are benign and OK to use GLP1. Exception: Nevolat where no Thyroid disease patients should have Rx." },
        { cat: "Endocrine", name: "Hypothyroidism / Hashimoto's", status: "prescribe", desc: "Okay to prescribe (unless secondary to thyroid cancer treatment). Exception: Nevolat — no Thyroid disease patients." },
        { cat: "Endocrine", name: "Hyperthyroidism / Graves", status: "prescribe", desc: "Should be safe — check patient feels well and no treatment changes in last 6m. Exception: Nevolat — no Thyroid disease patients." },
        { cat: "Endocrine", name: "Thyroidectomy / Thyroid Removal", status: "prescribe", desc: "Thyroidectomy is NOT a contraindication to GLP-1 therapy. Patient will be on levothyroxine replacement which does not interact with GLP-1s. Safe to prescribe provided thyroid levels are stable. Exception: If thyroidectomy was for Medullary Thyroid Cancer — REJECT (MTC is absolute contraindication)." },
        { cat: "Mental Health", name: "Anorexia", status: "reject", desc: "Any diagnosis of this at any time is an exclusion." },
        { cat: "Mental Health", name: "Bulimia", status: "reject", desc: "Any diagnosis of this at any time is an exclusion." },
        { cat: "Mental Health", name: "ARFID", status: "reject", desc: "Reject (as per SCR Screening SOP)." },
        { cat: "Mental Health", name: "Current Suicidal Thoughts", status: "reject", desc: "This is an exclusion but must contact pt to check they're getting help." },
        { cat: "Mental Health", name: "Binge Eating Disorder", status: "escalate", desc: "Formal diagnosis is exclusion. However, if reports binge eating but never diagnosed or seen specialist, may be eligible (70% of obese people binge eat but most don't have disorder)." },
        { cat: "Mental Health", name: "Binge Eating (no diagnosis)", status: "prescribe", desc: "OK to prescribe in absence of 'Binge Eating Disorder' diagnosis." },
        { cat: "Mental Health", name: "Depression / Bipolar", status: "escalate", desc: "Do not prescribe if acutely mentally unwell. Enquire if any medication changes in last 3 months." },
        { cat: "Mental Health", name: "Previous Suicidal Thoughts", status: "escalate", desc: "Needs more info to check no current concerns." },
        { cat: "Neurology", name: "Ischaemic Stroke", status: "prescribe", desc: "Ischaemic stroke is considered safe to have GLP-1 treatment." },
        { cat: "Neurology", name: "Haemorrhagic Stroke", status: "escalate", desc: "Need to gather more information: when diagnosed, how treated, current condition." },
        { cat: "Neurology", name: "CVA", status: "escalate", desc: "If ischaemic (not haemorrhagic) CVA can prescribe." },
        { cat: "Neurology", name: "TIA", status: "escalate", desc: "If ischaemic (not haemorrhagic) TIA can prescribe." },
        { cat: "Neurology", name: "Epilepsy", status: "escalate", desc: "If under a neurologist, they need to be aware." },
        { cat: "Neurology", name: "Idiopathic Intracranial Hypertension", status: "prescribe", desc: "Safe to prescribe." },
        { cat: "Renal", name: "CKD", status: "escalate", desc: "Can treat if eGFR >30." },
        { cat: "Renal", name: "Kidney Stones", status: "prescribe", desc: "Safe to prescribe if eGFR >30. Extra advice about hydration beneficial." },
        { cat: "Renal", name: "One Kidney", status: "escalate", desc: "If evidence of eGFR >30 in last 6 months OK to use." },
        { cat: "Renal", name: "Kidney Cysts", status: "escalate", desc: "If not due to Polycystic Kidney disease, and eGFR >30, safe to prescribe." },
        { cat: "Bariatric", name: "Gastric Bypass (RYGB)", status: "follow_sop", desc: "Reject if <12 months, prescribe if surgery was more than a year ago. Refer to SCR Screening SOP." },
        { cat: "Bariatric", name: "Sleeve Gastrectomy", status: "follow_sop", desc: "Reject if <12 months, prescribe if surgery was more than a year ago. Refer to SCR Screening SOP." },
        { cat: "Bariatric", name: "Gastric Band (Lap-Band)", status: "follow_sop", desc: "Reject if <12 months, prescribe if surgery was more than a year ago. Refer to SCR Screening SOP." },
        { cat: "Bariatric", name: "Mini Gastric Bypass (OAGB)", status: "follow_sop", desc: "Reject if <12 months, prescribe if surgery was more than a year ago. Refer to SCR Screening SOP." },
        { cat: "Bariatric", name: "BPD/DS", status: "follow_sop", desc: "Reject if <12 months, prescribe if surgery was more than a year ago. Refer to SCR Screening SOP." },
        { cat: "Bariatric", name: "Gastric Balloon", status: "follow_sop", desc: "Reject if <12 months, prescribe if surgery was more than a year ago. Refer to SCR Screening SOP." },
        { cat: "Cancer", name: "Medullary Thyroid Cancer", status: "reject", desc: "Reject now." },
        { cat: "Cancer", name: "Active Cancer (on treatment)", status: "reject", desc: "If having treatment for active cancer from oncology team, that is an exclusion." },
        { cat: "Cancer", name: "Cancer (in remission)", status: "escalate", desc: "If discharged from oncology team or in remission/maintenance Rx/surveillance only, then eligible. Request discharge or recent oncology letter." },
        { cat: "Cancer", name: "Papillary/Follicular Thyroid Cancer", status: "follow_sop", desc: "As long as 'Cancer' conditions are met (see above), safe to prescribe." },
        { cat: "Cancer", name: "Basal Cell Carcinoma", status: "prescribe", desc: "Accept — local wart-like cancer only, does not metastasise/cause mortality." },
        { cat: "Other", name: "NAION", status: "reject", desc: "Any diagnosis of this at any time is an exclusion." },
        { cat: "Other", name: "Maculopathy", status: "reject", desc: "Reject now." },
        { cat: "Other", name: "Diabetic Retinopathy (Active / Under Eye Clinic)", status: "reject", desc: "If under regular care of eye clinic for ACTIVE diabetic retinopathy — this is an exclusion due to 'early worsening phenomenon' where rapid HbA1c reduction can worsen retinopathy.", note: "SUSTAIN-6 showed semaglutide associated with more diabetic retinopathy complications in patients with pre-existing disease and high baseline HbA1c." },
        { cat: "Other", name: "Diabetic Retinopathy (Background / Stable)", status: "escalate", desc: "If having regular screening but NOT under active eye clinic care, may be suitable. Request confirmation of last retinal screening result and whether stable. Advise patient to report any vision changes immediately.", note: "Early worsening risk is highest in patients with pre-existing retinopathy + rapid glycaemic improvement. Lower risk if stable background changes only." },
        { cat: "Other", name: "Non-Diabetic Retinopathy", status: "prescribe", desc: "Retinopathy NOT related to diabetes (e.g., hypertensive, toxoplasma chorioretinitis, retinal vein occlusion) is NOT a contraindication. The 'early worsening phenomenon' is specific to diabetic retinopathy and rapid HbA1c changes.", note: "GLP-1s have no direct retinal toxicity. Risk is metabolic (rapid glucose normalisation), not pharmacological." },
        { cat: "Other", name: "Hypertensive Retinopathy", status: "prescribe", desc: "Ok to prescribe. Not related to the diabetic retinopathy early worsening mechanism." },
        { cat: "Other", name: "Toxoplasma Chorioretinitis", status: "prescribe", desc: "Safe to prescribe. This is an ocular infection, not related to diabetes or GLP-1 mechanisms. GLP-1s are not immunosuppressive and do not increase reactivation risk.", note: "If active infection currently being treated, consider waiting until resolved as clinical prudence." },
        { cat: "Other", name: "HIV", status: "escalate", desc: "If patient stable, no acute complications or advanced disease, okay to prescribe. Patient to inform specialist; clinic letter helpful." },
        { cat: "Other", name: "New Mothers (not breastfeeding)", status: "prescribe", desc: "Remind pt of nausea SE & advise use of contraception. Otherwise, safe to prescribe." },
        { cat: "Other", name: "Planning to Conceive", status: "follow_sop", desc: "See SOP." },
        { cat: "Other", name: "Autoimmune Disorder (Lupus, RA)", status: "escalate", desc: "Gather more info incl recent bloods. If under specialist, letter of support beneficial. Likely safe if stable for 6m and not on steroids/NTI meds." },
        { cat: "Other", name: "Anaemia", status: "escalate", desc: "Depends on cause — if not malignant, being treated, and not symptomatic, safe to prescribe." },
        { cat: "Other", name: "G6PD Deficiency", status: "prescribe", desc: "Ok to prescribe." },
        { cat: "Other", name: "DMARDs for Rheumatology", status: "escalate", desc: "If condition stable and rheumatology team aware, should be OK. Recent clinic letter from specialist recommended." },
        { cat: "Other", name: "Antiemetics", status: "escalate", desc: "More info needed. If taking for GLP1 side effects — check if dose needs adjusting or change in GLP1 medication." },
        { cat: "Other", name: "Medicines (diuretics, ACEi, NSAIDs)", status: "prescribe", desc: "Safe to prescribe, remind pt of importance of remaining hydrated." },
        { cat: "Other", name: "Oral Steroids", status: "prescribe", desc: "Oral steroids are not a contraindication to GLPs. Do not hold order." },
      ],
    },
  ],
};

export const CONTRA_STATUS_META: Record<
  ContraStatus,
  { label: string; icon: string }
> = {
  reject: { label: "REJECT", icon: "⛔" },
  follow_sop: { label: "FOLLOW SOP", icon: "📋" },
  escalate: { label: "ESCALATE", icon: "⚠️" },
  prescribe: { label: "PRESCRIBE", icon: "✅" },
};

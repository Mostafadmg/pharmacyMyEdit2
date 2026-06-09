# Orlistat consultation — complete developer specification

Build the oral weight-loss consultation (Orlistat / Mysimba) so that **every question below behaves exactly as described**. This document is the handoff spec: what to show, what each answer means for eligibility, and how to wire it in code.

**Related:** [INJECTABLE-CONSULTATION-RULES.md](INJECTABLE-CONSULTATION-RULES.md) — Mounjaro / Wegovy injectable flow (hard stops, BMI bands, treatment-gap dosing).

---

## Legend (use throughout)

| Symbol | Meaning |
|--------|---------|
| **PASS** | Does not add an ineligibility flag |
| **FLAG** | Adds an internal red flag → patient routed to step 98 after step 10 |
| **BMI+** | Helps BMI eligibility (new patients only, BMI 27.6–29.9) — see step 7 |
| **COLLECT** | Stored for clinical review; no automatic flag |
| **GATE** | Yes/No that unlocks a checklist |
| **REQ** | Required to continue the step |

**Critical UX rule:** The patient must **never** see “eligible”, “ineligible”, amber warnings, or which rule failed **during** steps 1–10. BMI shows as a **number only**. All rules run **after step 10** via `collectOralDeferredRedFlags()`.

---

## How eligibility works (implement this)

```
Patient completes steps 1–10
        ↓
collectOralDeferredRedFlags(state)  →  array of internal flags
        ↓
flags.length > 0  ?  step 98 (neutral thank-you)  :  step 11+
```

**Step 98 patient copy (same whether eligible or not from their perspective if flagged):**

- Heading: *“Thank you for completing your consultation”*
- Body: *“Our clinical team will review your answers and let you know whether oral weight-loss treatment is suitable for you.”*
- No list of failed rules. No “Review my answers” button.

**Pharmacist/prescriber:** persist flags with `oralDeferredRedFlagsToAnswers(flags)` — patient never sees this.

---

## Code map

| What | File |
|------|------|
| Flow UI | `artifacts/pharmacy/src/pages/OralWeightLossConsultation.tsx` |
| All flag rules | `artifacts/pharmacy/src/lib/oralRedFlags.ts` → `collectOralDeferredRedFlags()` |
| New-patient BMI | `lib/evidence-slots/src/wlOralBmiEligibility.ts` |
| Step 7 catalogue | `lib/evidence-slots/src/wlOralMedicalHistory.ts` |
| Step 8 catalogue | `lib/evidence-slots/src/wlOralExcludedMedications.ts` |
| Step 9 catalogue | `lib/evidence-slots/src/wlOralExcludingConditions.ts` |
| Step 6 health copy | `artifacts/pharmacy/src/lib/oralHealthQuestionnaire.ts` |

**Constants (BMI):**

| Constant | Value |
|----------|-------|
| `ORAL_NEW_PATIENT_BMI_INELIGIBLE_AT_OR_BELOW` | 27.5 |
| `ORAL_NEW_PATIENT_BMI_STANDARD_THRESHOLD` | 30 |
| `ORAL_NEW_PATIENT_BMI_COMORBIDITY_THRESHOLD` | 28 *(documented reference; code uses >27.5 and <30 + comorbidity)* |

---

## Step-by-step: every question and eligibility effect

### Step 1 — Intro

| UI | Eligibility |
|----|-------------|
| “Start consultation” button | **COLLECT** — no flag |

Logged-in patients skip step 2 on start.

---

### Step 2 — Contact *(guests only)*

| Question | Answer | Eligibility |
|----------|--------|-------------|
| Full name | any valid | **COLLECT** |
| Email | any valid | **COLLECT** |
| Phone | any valid | **COLLECT** |

---

### Step 3 — Journey

**Question:** *“Where are you in your weight loss journey?”*

| Answer | Value | Eligibility |
|--------|-------|-------------|
| New Patient — Starting Treatment | `new` | **COLLECT** — **BMI rules apply** (step 5 + 7) |
| Existing Patient — Reorder | `existing` | **COLLECT** — BMI auto-rules **not applied yet** |
| Transferring — From Another Provider | `transferring` | **COLLECT** — BMI auto-rules **not applied yet** |

---

### Step 4 — Ethnicity

**Question:** *“Ethnicity”* (single choice)

| Answer | Eligibility |
|--------|-------------|
| Asian or Asian British | **COLLECT** — no auto-flag *(oral BMI rules do not use ethnicity yet)* |
| Black, African, Caribbean or Black British | **COLLECT** |
| Middle Eastern | **COLLECT** |
| Mixed or multiple ethnicities | **COLLECT** |
| White | **COLLECT** |
| Other ethnic group | **COLLECT** |
| Prefer not to say | **COLLECT** |

---

### Step 5 — BMI (DOB, height, weight)

| Question | Answer | Eligibility |
|----------|--------|-------------|
| Date of birth | valid date | **COLLECT** *(hint: 18–75; no auto-flag yet)* |
| Height | cm or ft/in | **COLLECT** — used to calculate BMI |
| Weight | kg or st/lbs | **COLLECT** — used to calculate BMI |
| **Your BMI** (calculated readout) | e.g. `28.4` | **Show number only — never “eligible/not eligible”** |

**BMI flag rule** *(evaluated after step 10; only if step 3 = `new`)*:

| BMI | Step 7 comorbidity? | Result |
|-----|---------------------|--------|
| ≤ 27.5 | any | **FLAG** |
| > 27.5 and < 30 | Yes (≥1 step 7 condition) | **PASS** |
| > 27.5 and < 30 | No | **FLAG** |
| ≥ 30 | any | **PASS** |

BMI flag is **deferred** until step 7 comorbidity data exists (evaluation at end, not on step 5).

**Examples (new patient):**

| BMI | Comorbidity on step 7 | Flag? |
|-----|----------------------|-------|
| 27.5 | No | Yes |
| 28.0 | Yes (e.g. hypertension) | No |
| 28.0 | No | Yes |
| 29.9 | No | Yes |
| 30.0 | No | No |

Function: `oralNewPatientMeetsBmiEligibility()` in `wlOralBmiEligibility.ts`  
Flag helper: `oralBmiRedFlags()` in `oralRedFlags.ts`

---

### Step 6 — Your health

#### 6a. Assigned sex at birth *(REQ)*

**Question:** *“What sex were you assigned at birth?”*

| Answer | Eligibility | Notes |
|--------|-------------|-------|
| Male | **PASS** | Skips pregnancy/OCP questions |
| Female | **PASS** | Shows 6b, 6c |
| Prefer not to say | **PASS** | Shows 6b, 6c |

#### 6b. Pregnancy *(female / prefer-not-to-say only, REQ)*

**Question:** *“Are you currently pregnant, breastfeeding, or planning to become pregnant or breastfeed while using this medication?”*

| Answer | Eligibility |
|--------|-------------|
| **Yes** | **FLAG** |
| No | **PASS** |

#### 6c. Oral contraceptive *(female / prefer-not-to-say only, REQ)*

**Question:** *“Are you taking an oral contraceptive?”*

| Answer | Eligibility | Notes |
|--------|-------------|-------|
| Yes | **PASS** | Must show Orlistat/OCP counselling + require acknowledgement checkbox to continue |
| No | **PASS** | |

**If OCP = Yes** — counselling block *(REQ to continue, not a flag)*:

- Show SPC counselling text (Orlistat + diarrhoea + backup contraception)
- Checkbox: *“I have read and understand this advice…”* — must be ticked to continue

#### 6d. Orlistat allergy *(all patients, REQ)*

**Question:** *“Have you ever had an allergic reaction or hypersensitivity to Orlistat (including Xenical or Alli)?”*

| Answer | Eligibility |
|--------|-------------|
| **Yes** | **FLAG** |
| No | **PASS** |

Function: `oralYourHealthRedFlags()` in `oralRedFlags.ts`

---

### Step 7 — Medical history (comorbidities)

**Intro:** *“Weight loss treatment can significantly improve weight-related comorbidity.”*

**GATE *(REQ)*:** *“Have you ever been diagnosed with any of the following?”*

| Gate answer | Eligibility |
|-------------|-------------|
| No | **PASS** — no comorbidity for BMI pathway |
| Yes | Must select ≥1 checkbox; each selected condition may ask medication follow-up |

**Checkboxes** *(if gate = Yes)* — each row:

| ID | Condition label | Direct flag? | BMI role (new patients) |
|----|-----------------|--------------|-------------------------|
| `prediabetes` | Prediabetes | **PASS** | **BMI+** if selected |
| `type2_diabetes` | Type 2 diabetes mellitus (diet controlled) | **PASS** | **BMI+** |
| `hypertension` | Hypertension | **PASS** | **BMI+** |
| `dyslipidaemia` | Dyslipidaemia | **PASS** | **BMI+** |
| `cardiovascular_disease` | Cardiovascular disease (MI, stroke, TIA, IHD, PAD, heart failure) | **PASS** | **BMI+** |
| `obstructive_sleep_apnoea` | Obstructive sleep apnoea | **PASS** | **BMI+** |
| `masld` | MASLD / NAFLD | **PASS** | **BMI+** |
| `pcos_metabolic` | PCOS with metabolic features | **PASS** | **BMI+** |

**Important:** Step 7 conditions **never FLAG alone**. They only:

1. **BMI+** — allow BMI 27.6–29.9 to pass for **new** patients  
2. **COLLECT** — medication follow-up details for prescriber  

Comorbidity = `selectedOralMedicalHistoryConditions(oralHealth).length > 0`

**Step 9 conditions do NOT count for BMI.**

---

### Step 8 — Medications

#### 8a. Excluded medicines — GATE *(REQ)*

**Question:** *“Are you currently taking any of the following medicines?”*

| Gate answer | Eligibility |
|-------------|-------------|
| No | **PASS** for this list → show “stopped past 3 months?” question |
| Yes | Must tick ≥1 checkbox below — **each ticked item = FLAG** |

#### 8a-i. Checkboxes *(only if gate = Yes)* — **each selected = FLAG**

| ID | Medicine | If selected |
|----|----------|-------------|
| `sulfonylureas` | Sulfonylureas for diabetes (gliclazide, glibenclamide, glipizide) | **FLAG** |
| `oral_anticoagulants` | Oral anticoagulants (warfarin, acenocoumarol) | **FLAG** |
| `ciclosporin` | Ciclosporin (immunosuppressant) | **FLAG** |
| `tacrolimus` | Tacrolimus (immunosuppressant) | **FLAG** |
| `levothyroxine` | Levothyroxine (thyroid medication) | **FLAG** |
| `amiodarone` | Amiodarone (heart rhythm medication) | **FLAG** |
| `acarbose` | Acarbose (diabetes medication) | **FLAG** |
| `hiv_medication` | HIV medication (antiretrovirals) | **FLAG** |
| `iodine_salts` | Iodine salts or iodine-containing medications | **FLAG** |
| `anticonvulsants` | Anti-convulsant / anti-epileptic drugs | **FLAG** |
| `antidepressants_weight_gain` | Antidepressants associated with weight gain | **FLAG** |
| `antipsychotics` | Antipsychotic medication | **FLAG** |
| `lithium` | Lithium | **FLAG** |
| `other_anti_obesity_drugs` | Other anti-obesity or weight-loss drugs or injections (Mounjaro, Wegovy) | **FLAG** |

#### 8b. Stopped past 3 months *(only if gate 8a = No, REQ)*

**Question:** *“Have you been on any of these medications and stopped them in the past three months?”*

| Answer | Eligibility |
|--------|-------------|
| Yes | **PASS** — no auto-flag |
| No | **PASS** |

#### 8c. Other meds not listed *(REQ)*

**Question:** *“Are you currently taking any other prescription medication, over-the-counter medicine, supplement, or herbal remedy not listed above?”*

| Answer | Eligibility | Notes |
|--------|-------------|-------|
| No | **PASS** | |
| Yes — please list below | **PASS** | Free-text required to continue; **no auto-flag** |

Function: `oralExcludedMedRedFlags()` — flags only when `excludedMedsTaken === "yes"` and items in `excludedMedsSelected`.

---

### Step 9 — Medical conditions

**GATE *(REQ)*:** *“Have you been diagnosed with or had surgery for any of the following?”*

| Gate answer | Eligibility |
|-------------|-------------|
| No | **PASS** |
| Yes | Must tick ≥1 checkbox — **each ticked item = FLAG** |

**Checkboxes** *(if gate = Yes)* — **each selected = FLAG**

| ID | Condition | If selected |
|----|-----------|-------------|
| `cholestasis` | Cholestasis | **FLAG** |
| `chronic_malabsorption` | Chronic malabsorption syndrome | **FLAG** |
| `inflammatory_bowel_disease` | IBD, ulcerative colitis, or Crohn's disease | **FLAG** |
| `chronic_kidney_disease` | Chronic kidney disease | **FLAG** |
| `calcium_oxalate_kidney_stones` | History of calcium oxalate kidney stones | **FLAG** |
| `acute_hepatitis_liver_cirrhosis` | Acute hepatitis or liver cirrhosis | **FLAG** |
| `weight_gain_hormonal_or_medical` | Weight gain may be hormonal/medical or medication-related | **FLAG** |
| `cholecystectomy` | Gallbladder removed (cholecystectomy) | **FLAG** *(timing follow-up: more/less than 12 months — still FLAG)* |
| `eating_disorder` | Eating disorder (anorexia or bulimia nervosa) | **FLAG** |

Function: `oralExcludingConditionsRedFlags()` in `oralRedFlags.ts`

---

### Step 10 — Clinical team notes

| Question | Answer | Eligibility |
|----------|--------|-------------|
| Optional free text for prescribing team | empty or any text | **COLLECT** — no flag |

After continue on step 10 → run full flag evaluation.

---

### Step 98 — Completion *(internal flags present)*

| UI | Eligibility |
|----|-------------|
| Neutral thank-you message | Patient told team will review — **not told they failed** |
| “Back to treatments” button | End |

---

### Step 11+ — Not built yet

Placeholder only. Patients with **zero flags** reach step 11 today.

---

## Master summary: what causes ineligibility (internal flags)

| Source | Trigger | Flag ID pattern |
|--------|---------|-----------------|
| **BMI** | New patient + BMI fails decision table (see step 5) | `bmi:new_patient_threshold` |
| **Step 6** | Orlistat allergy = Yes | `your_health:orlistat_allergy` |
| **Step 6** | Pregnancy/breastfeeding/planning = Yes *(if asked)* | `your_health:pregnant` |
| **Step 8** | Currently taking any listed medicine (each one) | `excluded_med:{id}` |
| **Step 9** | Any medical condition selected (each one) | `excluding_condition:{id}` |

**One flag is enough** to route to step 98.

**Does NOT flag:** steps 1–4, step 7 alone, step 8 stopped-in-3-months, step 8 other meds, step 10 notes, OCP counselling, ethnicity, journey (except BMI interaction for `new`).

---

## `collectOralDeferredRedFlags()` — inputs required

Pass all of this when evaluating after step 10:

```ts
{
  journeyStage: "new" | "existing" | "transferring" | null,
  bmi: number | null,
  oralHealth: OralHealthFormSlice,           // step 7
  assignedSex: "male" | "female" | "prefer-not-to-say" | null,
  pregnant: "yes" | "no" | null,
  orlistatAllergy: "yes" | "no" | null,
  asksFemaleHealthQuestions: (sex) => boolean,
  excludedMeds: OralExcludedMedsSlice,       // step 8
  oralExcludingConditions: OralExcludingConditionsSlice,  // step 9
}
```

Returns: `OralRedFlag[]` — merge of `oralBmiRedFlags` + `oralYourHealthRedFlags` + `oralExcludedMedRedFlags` + `oralExcludingConditionsRedFlags`.

---

## Routing logic (copy into consultation)

```ts
const LAST_IMPLEMENTED_STEP = 10;
const DEFERRED_REJECTION_STEP = 98;

// On continue from step 10:
if (step === LAST_IMPLEMENTED_STEP) {
  if (deferredRedFlags.length > 0) {
    go(DEFERRED_REJECTION_STEP);
  } else {
    go(LAST_IMPLEMENTED_STEP + 1); // step 11
  }
}
```

---

## Patient UI rules (must enforce)

- [ ] No “eligible” / “ineligible” / “not suitable” text on steps 1–10  
- [ ] BMI readout: numeric value only  
- [ ] No amber `DeferredRedFlagNotice` during the flow  
- [ ] Step 98: neutral copy only; no flag list; no review-answers button  
- [ ] Persist `oral_deferred_red_flags` + `oral_deferred_red_flag_details` for Rx app  

---

## Not implemented yet (do not assume these flag)

- BMI rules for **existing** or **transferring** patients  
- Age 18–75 enforcement (DOB hint only today)  
- Ethnicity-specific BMI thresholds (injectable uses BAME 27; oral new-patient rules are universal)  
- Auto-flag: stopped excluded meds in past 3 months  
- Auto-flag: free-text other medications  
- Steps 11–14 (product, payment, evidence upload, submit)  

---

## Quick reference flowchart

```
1 Intro → 2 Contact* → 3 Journey → 4 Ethnicity → 5 BMI#
      → 6 Health† → 7 Comorbidities‡ → 8 Meds§ → 9 Conditions§
      → 10 Notes → EVAL → 98✗ or 11✓

* skipped if logged in
# BMI flag if new patient (uses step 7 data at eval time)
† allergy Yes or pregnancy Yes → FLAG
‡ selections → BMI+ only (no direct FLAG)
§ any checkbox when gate Yes → FLAG each item
✗ any FLAG → step 98 (neutral message)
✓ zero flags → continue
```

---

*Spec matches codebase: oral consultation steps 1–10, deferred evaluation, step 98 completion.*

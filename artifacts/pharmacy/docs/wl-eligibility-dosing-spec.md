# Weight-Management Onboarding — Eligibility, Screening & Dosing Spec

This document is the source of truth for the **injectable weight-loss** onboarding
rules in the patient app (`artifacts/pharmacy`). It is written so it can be pasted
back into Cursor as a prompt to re-implement, audit, or extend the logic.

- **Products handled:** Mounjaro (tirzepatide) and Wegovy (semaglutide) only.
  The "Nevolat" column from the reference image is intentionally **ignored**.
- **Core logic module:** `artifacts/pharmacy/src/lib/wlEligibilityDosing.ts`
  (pure, well-typed, unit-testable — no React/DOM).
- **Shared BMI thresholds & ethnicity helpers:** `@workspace/evidence-slots`
  (`lib/evidence-slots/src/wlBmiEligibility.ts`) — keeps the patient app and the
  pharmacist (Rx) app in lock-step.
- **UI wiring:** `artifacts/pharmacy/src/pages/InjectableWeightLossConsultation.tsx`
  and its `PlanSelector` sub-component. No visual redesign — reuses existing
  components (`StepShell`, `SectionCard`, `RadioRow`, `PlanSelector`,
  `TransferWeightLossMedicationPicker`, `SimpleRepeatQuestionnaire`, ineligible screen).

---

## Inputs collected by the questionnaire

| Field | Where collected | Used for |
|---|---|---|
| `journey` (new / existing / transferring) | Step 3 | Branch selection |
| `ethnicity` | Step 4 | White vs BAME BMI threshold |
| `bmi` (from height + weight) | Step 5 | All band logic |
| comorbidity (`excludingConditions === "yes"`) | Step 8 | 27.5 comorbidity threshold |
| clinical hard-stops (age, pregnancy, GLP-1 allergy, MTC/MEN2, eating disorder) | Step 7 | Absolute exclusion |
| previous product + last tolerated strength + last injection date | Step 9 (transfer/restart picker) | Gap dosing |

**Ethnicity → BAME:** `asian`, `black`, `middle-eastern`, `mixed`, `other` are BAME.
`white` is White. `prefer-not-to-say` contributes no ethnicity threshold (falls back
to the default 30 obesity threshold).

**BMI thresholds** (from `@workspace/evidence-slots`):
`BMI_THRESHOLD_WHITE = 30`, `BMI_THRESHOLD_COMORBIDITY = 27.5`, `BMI_THRESHOLD_BAME = 27`.

---

## A. NEW STARTERS (no previous Mounjaro/Wegovy history)

Principle: **lowest threshold wins** — a patient is eligible if their BMI meets
*any* applicable threshold.

Applicable thresholds:
- White (not BAME) → **30**
- ≥1 comorbidity → **27.5**
- BAME → **27**

`eligibleThreshold = min(applicable thresholds)` (default **30** if none apply).

### Outcome
- **BMI ≥ eligibleThreshold → ELIGIBLE.**
  Offer the **starter pen ONLY**: Mounjaro **2.5 mg** or Wegovy **0.25 mg**.
  No other strengths are selectable; the plan picker is forced to a single starter pen.
- **BMI in [25, eligibleThreshold) → PROMPT.**
  Show, verbatim:
  > Not eligible as a new starter. Have you taken Mounjaro or Wegovy before?
  > (We will ask you to provide proof of previous prescription and previous BMI
  > verification to proceed)
  - **No →** reject with the clear message **"Not suitable."**
  - **Yes →** route into the existing **restart/transfer** questionnaire
    (`journey = "transferring"`): product, last tolerated dose, last injection date,
    continuation safety — then gap dosing (Section B). No new questionnaire is built.
- **BMI < 25 → REJECT immediately** (clear user-facing message, ineligible screen).

> Examples: White BMI 32 (no comorbidity) → eligible (≥30). White BMI 28 →
> prompt (28 < 30, ≥25). Comorbid BMI 28 → eligible (≥27.5). BAME BMI 27 →
> eligible (≥27). BAME BMI 26 → prompt. Anyone BMI 24 → reject.

Clinical hard-stops (age outside 18–75, pregnancy, GLP-1 allergy, MTC/MEN2,
eating disorder) **always** reject regardless of BMI/journey.

`classifyNewStarterEligibility({ bmi, ethnicity, hasComorbidity })`
→ `status: "eligible" | "prompt_previous_use" | "reject_low_bmi" | "incomplete"`.

---

## B. EXISTING / RESTARTING PATIENTS — gap dosing (Mounjaro & Wegovy)

After confirming previous treatment, product, **last tolerated dose**, and **last
injection date**, compute the gap (whole weeks) from last injection to today and apply:

| Gap | Action | Max restart dose (cap) |
|---|---|---|
| **≤ 8 weeks** | May titrate **up to the next** dose level, or pick lower. Recommend the next normal progression strength. | N/A (normal progression) |
| **> 8 to ≤ 12 weeks** | Continue last tolerated dose | **Wegovy 1 mg / Mounjaro 10 mg** |
| **> 12 to ≤ 24 weeks** | Restart **one dose lower** than last tolerated | **Wegovy 1 mg / Mounjaro 5 mg** |
| **> 24 weeks (≤ 12 months)** | Restart at the **lowest** dose | Wegovy 0.25 mg / Mounjaro 2.5 mg — **only if BMI ≥ 25** |
| **> 12 months** | Restart at the lowest dose **and** must meet full **new-patient criteria** | Starter doses only |

Caps are **hard maximums** (clamp). The patient may always choose a **lower** dose
than the computed target. The recommended strength is highlighted in the picker.

### Dose ladders (mg)
- **Mounjaro:** 2.5, 5, 7.5, 10, 12.5, 15
- **Wegovy:** 0.25, 0.5, 1, 1.7, 2.4
  (the Wegovy 7.2 mg high-dose pen is excluded from restart titration)

"Next dose up" and "one dose lower" reference these ladders. If the last tolerated
dose is not on the ladder, the nearest dose at or below it is used.

`computeRestartDosing({ product, lastToleratedDoseMg, gapWeeks, bmi })`
→ `{ category, allowedDosesMg, recommendedDoseMg, maxDoseMg, restartAtLowest,
mustMeetNewPatientCriteria, requiresMinBmi25, blocked, note }`.

- `> 24 weeks` with BMI < 25 → `blocked` (restart not allowed online; clear notice,
  cannot proceed).
- The purchasable pens are the intersection of `allowedDosesMg` with the catalogue
  (`PEN_OPTIONS`); the recommended pen is the closest purchasable strength ≤ the
  recommendation.

---

## Flow integration summary

```
Step 3 journey ─┬─ new ──────────────► A. new-starter bands (evaluated after step 8)
                │                         eligible → starter pen only (step 13)
                │                         prompt   → step 98 → No: reject / Yes: ↓
                │                         <25      → reject (step 99)
                ├─ transferring ───────► B. restart picker (step 9) → gap dosing (step 13)
                └─ existing (repeat) ──► prior plan reused (picker skipped)
```

- **Step 98** — new-starter "have you taken before?" prompt (reuses `RadioRow`).
- **Step 99** — ineligible screen; shows the custom rejection message when set.
- **Step 13 `PlanSelector`** — accepts `starterOnly` (new starters) and
  `restriction` (restart gap dosing): filters selectable pens, locks the product,
  shows a "Recommended" badge and a plain-language note, and renders a blocking
  notice when a restart is not permitted.

---

## Assumptions / notes
1. **Dose ladders** are taken from the existing `TRANSFER_WL_PEN_OPTIONS`
   catalogue; the purchasable plan catalogue (`PEN_OPTIONS`) is narrower
   (Mounjaro 2.5/5/7.5, Wegovy 0.25/0.5/1.0), so caps above those strengths clamp
   to the highest purchasable pen.
2. **Comorbidity** = answering "Yes" to the existing excluding/diagnosed-conditions
   question (Step 8). No new comorbidity question was added.
3. **BAME/ethnicity** uses the existing Step 4 ethnicity question — no new question
   added.
4. **"prefer not to say"** falls back to the conservative 30 threshold.
5. The **restart gap-dosing** rules are enforced on the **transfer/restart** journey
   (which has the product + dose + last-injection picker and the plan picker). The
   pure `simple_repeat` "existing" journey reuses the prior order's plan and is left
   unchanged.
6. `> 12 months` restart is set to starter-only with a note that full new-patient
   criteria must be met; a full automated re-run of new-patient eligibility for that
   sub-path is left to pharmacist review.
7. "12 months" is treated as 52 weeks for the gap boundary.

import { useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================================
   Complex Repeats Guide (React port)
   Scenario picker + step-by-step guidance for complex repeat reviews.
   ============================================================================ */

type ScenarioStep = { heading: string; body: ReactNode };
type Scenario = {
  value: string;
  option: string;
  title: string;
  steps: ScenarioStep[];
  /** Extra content rendered after the steps (e.g. a warning callout). */
  warning?: ReactNode;
};

function GapCategoryTable() {
  const rows: [string, string, string][] = [
    ["≤8 weeks", "Titrate to next dose", "Per titration guide"],
    [">8-12 weeks", "Continue last dose", "W:1mg M:10mg N:1.8mg"],
    [">12-24 weeks", "One dose lower", "W:1mg M:5mg N:1.2mg"],
    [">24 weeks", "Lowest dose (BMI≥25)", "W:0.25mg M:2.5mg N:0.6mg"],
    ["12+ months", "Treat as new patient", "Starter dose only"],
  ];
  return (
    <table className="my-2 w-full border-collapse text-[10px]">
      <thead>
        <tr className="bg-amber-100">
          <th className="border border-gray-200 p-1 text-left">Gap</th>
          <th className="border border-gray-200 p-1 text-left">Action</th>
          <th className="border border-gray-200 p-1 text-left">Max Dose</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]}>
            <td className="border border-gray-200 p-1">{r[0]}</td>
            <td className="border border-gray-200 p-1">{r[1]}</td>
            <td className="border border-gray-200 p-1">{r[2]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const SCENARIOS: Scenario[] = [
  {
    value: "gap-treatment",
    option: "📅 Gap in Treatment (Long Treatment Gap)",
    title: "📅 Gap in Treatment (Long Treatment Gap)",
    steps: [
      {
        heading: "1️⃣ Calculate the Gap",
        body: "Use the Gap Calculator above. For single pens use ORDER DATE. For multiple pens use DEPLETION DATE. For switch patients use LAST INJECTION DATE.",
      },
      { heading: "2️⃣ Check Gap Category", body: <GapCategoryTable /> },
      {
        heading: "3️⃣ Check BMI Thresholds",
        body: (
          <>
            <strong>6-12 months gap:</strong> BMI must be ≥25
            <br />
            <strong>&gt;12 months gap:</strong> Must meet licence requirement (≥30
            or ≥27 with comorbidity)
          </>
        ),
      },
      {
        heading: "4️⃣ If Dose Doesn't Match Gap",
        body: (
          <>
            Email patient using{" "}
            <strong>&apos;Clinical: Gap in Treatment (GLP1)&apos;</strong> template
            with 3 options:
            <br />• Option 1: Amend order to correct dose
            <br />• Option 2: Provide PUE from alternative provider during gap
            <br />• Option 3: Provide rationale for dose maintenance
          </>
        ),
      },
      {
        heading: "5️⃣ Apply Tags",
        body: (
          <>
            Add <strong>&apos;Pending Customer Response&apos;</strong> tag and place
            order on-hold until patient responds
          </>
        ),
      },
    ],
    warning:
      "⚠️ For gaps >24 weeks, PUE may be required if dose doesn't align with gap guidance",
  },
  {
    value: "skipped-dose",
    option: "⏭️ Skipped/Incorrect Titration",
    title: "⏭️ Skipped / Incorrect Titration",
    steps: [
      {
        heading: "1️⃣ Confirm the Missed Step",
        body: "Check which dose was missed, whether the patient self-escalated, and whether the current dose is clinically safe.",
      },
      {
        heading: "2️⃣ Review Titration History",
        body: "Compare the requested dose with the last tolerated dose and any adverse effects reported during escalation.",
      },
      {
        heading: "3️⃣ Determine Action",
        body: "If the dose is too high, step down to the previous tolerated dose. If the patient missed too many weeks, treat as a gap in treatment.",
      },
      {
        heading: "4️⃣ Communicate Clearly",
        body: "Use a customer email that explains the adjusted titration schedule and any safety concerns.",
      },
    ],
  },
  {
    value: "bmi-photo-issues",
    option: "📸 BMI / Photo Issues (Borderline, Underweight, Mismatch)",
    title: "📸 BMI / Photo Issues",
    steps: [
      {
        heading: "1️⃣ Identify the Issue",
        body: "Confirm whether the issue is a borderline BMI, underweight concern, unclear image, side profile only, or mismatch with declared weight.",
      },
      {
        heading: "2️⃣ Ask for Correct Evidence",
        body: "Request a full-length, well-lit photo in fitted clothing. If needed, ask for a scales photo or an updated weight/height confirmation.",
      },
      {
        heading: "3️⃣ Underweight / Borderline BMI",
        body: "If BMI is below the licence threshold or appears underweight, do not proceed until clinical review is complete.",
      },
      {
        heading: "4️⃣ Keep the Order on Hold",
        body: "Add the relevant hold tag and wait for the corrected photos or updated verification evidence.",
      },
    ],
  },
  {
    value: "pue-transfer",
    option: "📄 PUE / Transfer Elements",
    title: "📄 PUE / Transfer Elements",
    steps: [
      {
        heading: "1️⃣ Check Proof of Previous Use",
        body: "Confirm the evidence shows patient name/email, medication, dose, date, and the regulated provider.",
      },
      {
        heading: "2️⃣ Verify Starting BMI Evidence",
        body: "For transfer patients below licence BMI, check that the starting BMI photo was taken within 30 days of treatment initiation and is clear enough to verify body shape.",
      },
      {
        heading: "3️⃣ If Evidence Is Incomplete",
        body: "Request updated PUE and/or a new BMI verification photo before proceeding.",
      },
      {
        heading: "4️⃣ Continue or Reassess",
        body: "If the evidence is acceptable, continue the review. If not, keep the order on hold until corrected documents arrive.",
      },
    ],
  },
  {
    value: "switch-medication",
    option: "🔄 Switching GLP-1 Medication",
    title: "🔄 Switching GLP-1 Medication",
    steps: [
      {
        heading: "1️⃣ Confirm Current and New Drug",
        body: "Check the current medication, current dose, and the target medication to ensure the equivalence table is applied correctly.",
      },
      {
        heading: "2️⃣ Consider the Gap",
        body: "If the patient has had a gap, reduce the step appropriately before converting to the target medication.",
      },
      {
        heading: "3️⃣ Use Step Equivalence",
        body: "Match the current step to the closest safe equivalent for the new GLP-1 medication using the reference table (see the GLP-1 Switching Calculator above).",
      },
      {
        heading: "4️⃣ If Unclear, Escalate",
        body: "If the switch is outside normal equivalence guidance, escalate for clinical review before issuing advice.",
      },
    ],
  },
  {
    value: "weight-gain",
    option: "📈 Weight Gain >7% (2 Consecutive Orders)",
    title: "📈 Weight Gain >7% (2 Consecutive Orders)",
    steps: [
      {
        heading: "1️⃣ Confirm the Trend",
        body: "Check whether the weight gain is present on two consecutive orders and confirm the percentage increase.",
      },
      {
        heading: "2️⃣ Ask About Adherence",
        body: "Ask whether the patient has taken medication as prescribed and whether there have been lifestyle, appetite, or tolerance changes.",
      },
      {
        heading: "3️⃣ Review Whether to Hold or Continue",
        body: "If the gain is clinically significant, consider a hold and request clarification before moving the dose forward.",
      },
      {
        heading: "4️⃣ Document Clearly",
        body: "Record the trend, patient response, and any action taken in the patient record.",
      },
    ],
  },
  {
    value: "weight-loss",
    option: "📉 Excessive Weight Loss >10%",
    title: "📉 Excessive Weight Loss >10%",
    steps: [
      {
        heading: "1️⃣ Confirm the Amount Lost",
        body: "Check the total weight loss and determine whether it exceeds the threshold over the relevant timeframe.",
      },
      {
        heading: "2️⃣ Ask About Symptoms",
        body: "Ask about nausea, vomiting, reduced intake, dehydration, or other side effects that may be contributing to the loss.",
      },
      {
        heading: "3️⃣ Consider Dose Review",
        body: "If weight loss is too rapid, consider a dose review or a pause pending clinical assessment.",
      },
      {
        heading: "4️⃣ Safety First",
        body: "If the patient appears unwell or underweight, escalate for urgent clinical review.",
      },
    ],
  },
  {
    value: "side-effects",
    option: "⚠️ Side Effects / Hospitalisation",
    title: "⚠️ Side Effects / Hospitalisation",
    steps: [
      {
        heading: "1️⃣ Capture the Severity",
        body: "Identify whether the symptoms are mild, concerning, or serious enough to require urgent review.",
      },
      {
        heading: "2️⃣ Check for A&E / Hospital Admission",
        body: "If the patient attended A&E or was admitted, stop the prescribing flow and escalate to clinical review.",
      },
      {
        heading: "3️⃣ Ask for Details",
        body: "Document the exact symptoms, timing, triggers, and whether the medication was stopped or reduced.",
      },
      {
        heading: "4️⃣ Hold the Order if Needed",
        body: "If symptoms are unresolved or severe, place the order on hold until a clinician advises next steps.",
      },
    ],
  },
  {
    value: "gp-details",
    option: "🏥 Problematic GP Details",
    title: "🏥 Problematic GP Details",
    steps: [
      {
        heading: "1️⃣ Validate the GP Information",
        body: "Check that the GP name, practice, postcode, and contact details are complete and match the patient record.",
      },
      {
        heading: "2️⃣ Resolve Missing Data",
        body: "If details are missing or invalid, ask the patient to provide corrected GP information before proceeding.",
      },
      {
        heading: "3️⃣ Escalate If Necessary",
        body: "If the record is incomplete and could affect prescribing safety, escalate to the relevant team.",
      },
      {
        heading: "4️⃣ Keep the Order On Hold",
        body: "Place the order on hold while the information is corrected or confirmed.",
      },
    ],
  },
  {
    value: "periodic-review",
    option: "🗓️ Periodic Review Due (6/12/18 Month)",
    title: "🗓️ Periodic Review Due (6/12/18 Month)",
    steps: [
      {
        heading: "1️⃣ Check Review Interval",
        body: "Determine whether the patient is due for a 6, 12, or 18 month review based on the last completed assessment.",
      },
      {
        heading: "2️⃣ Confirm Review Criteria",
        body: "Check BMI, dose tolerance, side effects, adherence, and any new contraindications.",
      },
      {
        heading: "3️⃣ Request Updated Information",
        body: "Ask the patient to provide updated weight, current dose, and any relevant health changes if required.",
      },
      {
        heading: "4️⃣ Proceed or Hold",
        body: "If all review criteria are satisfied, proceed. Otherwise, keep the order on hold pending review completion.",
      },
    ],
  },
  {
    value: "additional-pens",
    option: "💊 Requesting Additional Pens",
    title: "💊 Requesting Additional Pens",
    steps: [
      {
        heading: "1️⃣ Confirm Why More Pens Are Needed",
        body: "Ask whether the request is due to loss, travel, schedule changes, damaged pens, or another reason.",
      },
      {
        heading: "2️⃣ Check Safety and Timing",
        body: "Confirm the patient is not over-ordering and that the request aligns with dosing schedule and dispensing rules.",
      },
      {
        heading: "3️⃣ Review Stock / Price Impacts",
        body: "If additional pens are permitted, review whether the order needs to be amended or price adjusted.",
      },
      {
        heading: "4️⃣ Keep Records Updated",
        body: "Document the reason and any change made to the order so the dispensing trail is clear.",
      },
    ],
  },
];

export function ComplexRepeatsGuide() {
  const [open, setOpen] = useState(false);
  const [scenarioValue, setScenarioValue] = useState("");

  const scenario = SCENARIOS.find((s) => s.value === scenarioValue) ?? null;

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-violet-500 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-linear-to-br from-violet-500 to-violet-700 px-3.5 py-2.5 text-[13px] font-semibold text-white"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Complex Repeats Guide
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="space-y-3 bg-violet-50/60 p-3.5">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-violet-700">
              Select Complex Repeat Scenario
            </label>
            <select
              value={scenarioValue}
              onChange={(e) => setScenarioValue(e.target.value)}
              className="w-full rounded-md border border-violet-300 bg-white px-2.5 py-2.5 text-xs text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            >
              <option value="">-- Choose a scenario --</option>
              {SCENARIOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.option}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-violet-300 bg-white p-3 text-[11px] leading-relaxed">
            {scenario ? (
              <>
                <div className="mb-2.5 border-b-2 border-violet-300 pb-1.5 text-[13px] font-bold text-violet-700">
                  {scenario.title}
                </div>
                <div className="space-y-2.5">
                  {scenario.steps.map((step) => (
                    <div
                      key={step.heading}
                      className="rounded-md border-l-[3px] border-violet-500 bg-violet-50 p-2"
                    >
                      <div className="mb-1 font-semibold text-violet-800">
                        {step.heading}
                      </div>
                      <div className="text-gray-700">{step.body}</div>
                    </div>
                  ))}
                </div>
                {scenario.warning ? (
                  <div className="mt-2.5 rounded-md border border-amber-500 bg-amber-50 p-2.5 font-semibold text-amber-800">
                    {scenario.warning}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="mb-2.5 border-b-2 border-violet-300 pb-1.5 text-[13px] font-bold text-violet-700">
                  📋 Scenario Instructions
                </div>
                <div className="rounded-md border-l-[3px] border-violet-500 bg-violet-50 p-2 text-gray-700">
                  Select a scenario above to view the guidance.
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

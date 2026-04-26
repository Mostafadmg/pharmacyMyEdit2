import React from "react";
import LegalPage from "@/components/layout/LegalPage";

export default function SafePrescribing() {
  return (
    <LegalPage
      title="Safe prescribing standards"
      subtitle="The safeguards our prescribers follow when supplying medicines at a distance."
    >
      <p>
        We follow the GPhC's <em>Guidance for registered pharmacies providing pharmacy services at a
        distance, including on the internet</em> (Feb 2025), the GMC's <em>Good practice in proposing,
        prescribing, providing and managing medicines and devices</em>, and the Royal Pharmaceutical
        Society's prescribing guidance.
      </p>

      <h2>Risk-based supply</h2>
      <p>
        We assess every medicine before deciding whether it is safe to supply at a distance. For some
        medicines, an online questionnaire alone is not enough — these always require additional
        safeguards, and may not be available through this service:
      </p>
      <ul>
        <li><strong>Antimicrobials</strong> — supplied only where consistent with antimicrobial stewardship.</li>
        <li><strong>Medicines liable to misuse</strong> — opioids, sedatives, gabapentinoids, laxatives, stimulants, nootropics.</li>
        <li><strong>Medicines with high overdose risk</strong> — e.g. amitriptyline, propranolol, colchicine, carbamazepine.</li>
        <li><strong>Medicines for long-term conditions needing monitoring</strong> — e.g. lithium, warfarin, diabetes/asthma/epilepsy/heart/mental-health treatments.</li>
        <li><strong>Pregnancy Prevention Programme medicines</strong> — e.g. valproate, oral retinoids.</li>
        <li><strong>Weight management medicines</strong> — height, weight and BMI are independently verified.</li>
        <li><strong>Black-triangle medicines</strong> — under MHRA additional monitoring.</li>
        <li><strong>Medicines requiring a physical examination</strong> — e.g. non-surgical cosmetic injectables.</li>
      </ul>

      <h2>Identity verification</h2>
      <p>
        Before any P or POM medicine is supplied we verify your identity using your registered name,
        date of birth, address and an electronic identity reference. Our automated checks also flag:
      </p>
      <ul>
        <li>Multiple orders from the same address.</li>
        <li>The same payment details used across multiple accounts.</li>
        <li>Multiple accounts apparently belonging to the same person.</li>
        <li>Inappropriate combinations of medicines.</li>
        <li>Repeat requests for antimicrobials or medicines liable to misuse.</li>
        <li>Requests that are too frequent or too large for safe use.</li>
      </ul>
      <p>
        Where a flag is raised, your consultation is escalated to a senior prescriber for review.
        We may decline to supply, request further information, or refer you to your GP, NHS&nbsp;111
        or another service.
      </p>

      <h2>Sharing information with your GP</h2>
      <p>
        We ask for the contact details of your regular prescriber (your GP) and your{" "}
        <strong>explicit consent to share information about your treatment with them</strong>. Sharing
        this information helps make sure your full medical record is up to date and that any
        interactions with other treatments can be identified.
      </p>
      <p>
        If you do not have a regular GP, or you do not consent to share information, the prescriber
        will make a clear, individual judgement about whether it is safe to prescribe — or whether
        they should refer you to another service.
      </p>

      <h2>Two-way communication</h2>
      <p>
        Our prescribers can contact you securely through your patient portal, by email or by
        telephone. You can ask the prescriber a question at any time before, during or after the
        consultation. If timely two-way communication is not possible, we will direct you to your
        regular prescriber, an out-of-hours service, NHS&nbsp;111 or local urgent care.
      </p>

      <h2>What we will never do</h2>
      <ul>
        <li>Supply a medicine to anyone under 18 through this service.</li>
        <li>Supply a medicine when we have safeguarding concerns.</li>
        <li>Work with prescribers who are not registered with their relevant UK regulator.</li>
        <li>Encourage or incentivise prescribers to issue prescriptions (no targets, no commissions).</li>
      </ul>
    </LegalPage>
  );
}

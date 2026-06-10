import React from "react";
import LegalPage from "@/components/layout/LegalPage";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="The terms on which we provide our pharmacy services to you."
    >
      <h2>1. Who we are</h2>
      <p>
        EveryDayMeds Pharmacy Ltd is a pharmacy registered with the General Pharmaceutical Council (GPhC)
        — premises registration number <strong>9012345</strong>. Our Superintendent Pharmacist is
        Dr Aisha Patel MPharm IP (GPhC 2098765).
      </p>

      <h2>2. Eligibility</h2>
      <ul>
        <li>You must be aged 18 or over to use our services.</li>
        <li>You must be ordinarily resident in the United Kingdom.</li>
        <li>You must answer all consultation questions honestly and completely.</li>
      </ul>

      <h2>3. Our service</h2>
      <p>
        Our prescribers are GPhC-registered pharmacist independent prescribers (PIPs) working in line
        with the Royal Pharmaceutical Society Competency Framework for All Prescribers and the GMC's
        guidance on good practice in prescribing. They will only prescribe a medicine when they are
        satisfied it is clinically appropriate for you. They may decline to prescribe and may refer you
        to your GP, NHS&nbsp;111 or another service if a face-to-face assessment is needed.
      </p>

      <h2>4. Identity, safeguarding &amp; misuse</h2>
      <p>
        We will verify your identity before supplying P or POM medicines. We use automated checks
        (multiple orders, multiple accounts, same payment details, repeated antimicrobial requests,
        unusual combinations of medicines) to flag potentially inappropriate requests. We may refuse a
        sale to safeguard your health, and we will record the reasons for any such decision.
      </p>

      <h2>5. Consultation outcomes</h2>
      <p>
        After review you will receive one of the following outcomes by email and in your patient portal:
        <strong> approved</strong> (your medicine will be dispensed and dispatched),
        <strong> more information needed</strong>, <strong>referred</strong> (we will direct you to a
        more appropriate care setting) or <strong>rejected</strong>.
      </p>

      <h2>6. Delivery</h2>
      <p>
        Where you consent, we dispatch medicines in tamper-evident, temperature-controlled packaging
        using a tracked carrier. You will receive tracking details once your order has been dispatched.
      </p>

      <h2>7. Payment</h2>
      <p>Payments are taken securely via a PCI&nbsp;DSS-compliant payment provider.</p>

      <h2>8. Cancellations &amp; refunds</h2>
      <p>
        You can cancel your consultation in your patient portal at any time before a prescribing
        decision is made. Once a medicine has been dispensed, your statutory right to return medicines
        is restricted on safety grounds.
      </p>

      <h2>9. Complaints</h2>
      <p>
        We take all concerns seriously — please see our <a href="/legal/complaints">Complaints Procedure</a>.
        You can also contact the GPhC at <a href="https://www.pharmacyregulation.org" target="_blank" rel="noopener noreferrer">pharmacyregulation.org</a>.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        Nothing in these terms excludes or limits our liability where to do so would be unlawful — in
        particular, our liability for death or personal injury caused by negligence, or for fraud.
      </p>

      <h2>11. Governing law</h2>
      <p>These terms are governed by the laws of England and Wales.</p>
    </LegalPage>
  );
}

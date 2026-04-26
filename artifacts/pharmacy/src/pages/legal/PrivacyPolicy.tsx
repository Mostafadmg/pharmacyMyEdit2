import React from "react";
import LegalPage from "@/components/layout/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy &amp; Data Policy"
      subtitle="How we collect, use, store, and protect your personal and health information."
    >
      <p>
        PharmaCare Pharmacy Ltd ("we", "us", "our") is registered with the Information Commissioner's
        Office (ICO) as a data controller (registration <strong>ZA1234567</strong>). We process your
        personal data in line with the UK GDPR and the Data Protection Act 2018, and follow guidance
        issued by the General Pharmaceutical Council (GPhC).
      </p>

      <h2>1. The information we collect</h2>
      <p>To provide a safe and lawful pharmacy service we collect:</p>
      <ul>
        <li><strong>Identity data:</strong> name, date of birth, sex at birth, delivery address, contact details.</li>
        <li><strong>Health data:</strong> answers to clinical questionnaires, allergies, current medication, medical history, weight/height (where relevant), photographs of conditions where requested.</li>
        <li><strong>Identity verification:</strong> details we use to confirm you are who you say you are before supplying P or POM medicines (GPhC 4.2e).</li>
        <li><strong>Regular prescriber details:</strong> your GP name, surgery and contact details, and your consent to share information about your treatment with them.</li>
        <li><strong>Transaction data:</strong> orders, prescriptions issued, dispensed medicines, delivery confirmations.</li>
        <li><strong>Technical data:</strong> IP address, browser, device, login records.</li>
      </ul>

      <h2>2. The legal basis we rely on</h2>
      <ul>
        <li><strong>Article 6(1)(b)</strong> — performance of the contract to provide pharmacy services to you.</li>
        <li><strong>Article 6(1)(c) &amp; 9(2)(h)</strong> — compliance with our legal obligations, and provision of healthcare under the supervision of regulated health professionals.</li>
        <li><strong>Article 6(1)(a) &amp; 9(2)(a)</strong> — your explicit consent (for example, to share information with your GP).</li>
        <li><strong>Article 6(1)(f)</strong> — our legitimate interests in preventing fraud, misuse of medicines and safeguarding patients.</li>
      </ul>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To allow our GPhC-registered pharmacist independent prescribers to make safe clinical decisions.</li>
        <li>To dispense, label and dispatch your medicine securely.</li>
        <li>To verify your identity and detect inappropriate requests (multiple accounts, multiple orders to the same address, repeated antimicrobial requests, etc.).</li>
        <li>To share information with your GP or regular prescriber, where you have given consent — and, where clinically necessary, in accordance with GMC and GPhC guidance.</li>
        <li>To respond to feedback, complaints and safety concerns.</li>
        <li>To meet our legal record-keeping duties.</li>
      </ul>

      <h2>4. Where your data is stored</h2>
      <p>
        Your data is stored on encrypted servers hosted within the UK, or in jurisdictions with
        equivalent levels of data protection in place. Card payments are processed through a
        PCI&nbsp;DSS-compliant payment provider — we do not store your full card details.
      </p>

      <h2>5. How long we keep your data</h2>
      <p>
        Clinical records and prescriptions are retained for the periods required by UK pharmacy law and
        professional guidance (typically a minimum of <strong>10 years for adults</strong>, and longer
        for under-18s and certain controlled drugs). Account information is retained while your account
        is active and for a reasonable period afterwards.
      </p>

      <h2>6. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you (a "subject access request").</li>
        <li>Have inaccurate data corrected.</li>
        <li>Have your data erased, where this is compatible with our legal duty to retain clinical records.</li>
        <li>Object to processing or restrict processing in certain circumstances.</li>
        <li>Withdraw consent (for example, withdraw consent to share information with your GP).</li>
        <li>Lodge a complaint with the Information Commissioner's Office (<a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>).</li>
      </ul>

      <h2>7. Contacting our Data Protection Officer</h2>
      <p>
        If you have any questions about how we use your data, or you wish to exercise any of your
        rights, please contact our DPO at{" "}
        <a href="mailto:dpo@pharmacare.example.uk">dpo@pharmacare.example.uk</a> or write to the
        registered pharmacy address shown in the footer of this site.
      </p>
    </LegalPage>
  );
}

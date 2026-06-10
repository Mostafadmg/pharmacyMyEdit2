import React from "react";
import LegalPage from "@/components/layout/LegalPage";

export default function Regulatory() {
  return (
    <LegalPage
      title="Regulatory information"
      subtitle="Statutory information about the registered pharmacy, the prescribers we work with, and how to verify our credentials."
    >
      <h2>Registered pharmacy</h2>
      <ul>
        <li><strong>Pharmacy name:</strong> EveryDayMeds Pharmacy Ltd</li>
        <li><strong>Address (where medicines are prepared, assembled, dispensed and labelled):</strong> 14 Harley Street, London W1G 9PB, United Kingdom</li>
        <li><strong>Telephone:</strong> 0800 020 9090</li>
        <li><strong>Email:</strong> care@everydaymeds.example.uk</li>
        <li><strong>GPhC premises registration number:</strong> 9012345</li>
        <li><strong>Owner:</strong> EveryDayMeds Pharmacy Ltd (Companies House: 01234567)</li>
        <li><strong>Superintendent Pharmacist:</strong> Dr Aisha Patel MPharm IP — GPhC 2098765</li>
      </ul>
      <p>
        You can verify our registration status, and the registration status of any individual
        pharmacist, on the public register maintained by the General Pharmaceutical Council:{" "}
        <a href="https://www.pharmacyregulation.org/registers" target="_blank" rel="noopener noreferrer">
          pharmacyregulation.org/registers
        </a>.
      </p>

      <h2>Our prescribers</h2>
      <p>
        All prescribing decisions in this service are made by{" "}
        <strong>pharmacist independent prescribers (PIPs)</strong> registered with the GPhC and
        based in the United Kingdom. We do not at present work with non-UK prescribers, and we do not
        work with prescribers who are not registered with their relevant UK professional regulator.
      </p>
      <p>When a prescription is issued, your consultation outcome will display:</p>
      <ul>
        <li>The name of the prescriber.</li>
        <li>Their professional qualification (Pharmacist Independent Prescriber).</li>
        <li>Their GPhC registration number — which you can verify on the GPhC register.</li>
        <li>The country in which they are registered (Great Britain).</li>
        <li>The address of the prescribing service (the pharmacy registered address shown above).</li>
      </ul>

      <h2>How we are regulated</h2>
      <ul>
        <li><strong>General Pharmaceutical Council (GPhC):</strong> regulator for the pharmacy and our pharmacist prescribers — <a href="https://www.pharmacyregulation.org" target="_blank" rel="noopener noreferrer">pharmacyregulation.org</a>.</li>
        <li><strong>Care Quality Commission (CQC):</strong> regulator for the prescribing service — <a href="https://www.cqc.org.uk" target="_blank" rel="noopener noreferrer">cqc.org.uk</a>.</li>
        <li><strong>Information Commissioner's Office (ICO):</strong> data protection regulator — <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.</li>
        <li><strong>Medicines and Healthcare products Regulatory Agency (MHRA):</strong> regulator for medicines, devices and advertising — <a href="https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency" target="_blank" rel="noopener noreferrer">mhra.gov.uk</a>.</li>
      </ul>

      <h2>Indemnity insurance</h2>
      <p>
        The pharmacy and all its prescribers hold appropriate professional indemnity insurance to
        cover the services provided and the staff they employ, as required by GPhC standards.
      </p>

      <h2>Advertising of medicines</h2>
      <p>
        We follow the Human Medicines Regulations 2012, the MHRA Blue Guide on advertising and
        promoting medicines, and the rules of the Advertising Standards Authority (ASA). We do not
        promote prescription-only medicines (POMs) to the public.
      </p>

      <h2>Data &amp; payment security</h2>
      <p>
        Patient data is held on encrypted servers within the UK. Card payments are processed by a
        PCI&nbsp;DSS-compliant payment provider. We follow National Cyber Security Centre guidance for
        the security of our digital platform.
      </p>
    </LegalPage>
  );
}

import React from "react";
import { Link } from "wouter";
import LegalPage from "@/components/layout/LegalPage";
import { Button } from "@/components/ui/button";

export default function Complaints() {
  return (
    <LegalPage
      title="Complaints procedure"
      subtitle="How to raise a complaint or concern about our service, and how we will respond."
    >
      <p>
        We welcome all feedback — including complaints. Every complaint is taken seriously, recorded,
        and used to improve the safety and quality of the service we provide.
      </p>

      <h2>Step 1 — contact us first</h2>
      <p>
        Most concerns can be resolved quickly. Please use our{" "}
        <Link href="/feedback">feedback &amp; concerns form</Link> — your message goes directly to our
        Superintendent Pharmacist.
      </p>
      <p>
        Alternatively, write to: <strong>The Superintendent Pharmacist, EveryDayMeds Pharmacy Ltd,
        14&nbsp;Harley Street, London W1G&nbsp;9PB</strong>, email{" "}
        <a href="mailto:complaints@everydaymeds.example.uk">complaints@everydaymeds.example.uk</a>, or call
        0800&nbsp;020&nbsp;9090.
      </p>

      <h2>Step 2 — what happens next</h2>
      <ul>
        <li>You will receive an acknowledgement within <strong>2 working days</strong>.</li>
        <li>We will investigate and respond fully within <strong>20 working days</strong>.</li>
        <li>If we cannot respond fully in that time, we will write to explain why and tell you when we will respond.</li>
        <li>We will keep a confidential record of your complaint and our response.</li>
      </ul>

      <h2>Step 3 — independent review</h2>
      <p>If you are not satisfied with our response, you can also contact:</p>
      <ul>
        <li><strong>The General Pharmaceutical Council (GPhC):</strong>{" "}
          <a href="https://www.pharmacyregulation.org/raising-concerns" target="_blank" rel="noopener noreferrer">pharmacyregulation.org/raising-concerns</a> — for concerns about the conduct of the pharmacy or any pharmacist.
        </li>
        <li><strong>The Care Quality Commission (CQC):</strong>{" "}
          <a href="https://www.cqc.org.uk/contact-us" target="_blank" rel="noopener noreferrer">cqc.org.uk/contact-us</a> — for concerns about the prescribing service.
        </li>
        <li><strong>The Parliamentary &amp; Health Service Ombudsman:</strong>{" "}
          <a href="https://www.ombudsman.org.uk" target="_blank" rel="noopener noreferrer">ombudsman.org.uk</a>.
        </li>
        <li><strong>The Information Commissioner's Office (ICO):</strong>{" "}
          <a href="https://ico.org.uk/make-a-complaint" target="_blank" rel="noopener noreferrer">ico.org.uk</a> — for data protection concerns.
        </li>
      </ul>

      <h2>Patient safety incidents</h2>
      <p>
        We follow the Royal Pharmaceutical Society's <em>Patient Safety Professional Standards:
        Responding to Patient Safety Incidents</em>. We learn from every incident and share the
        learning with the whole team.
      </p>

      <div className="not-prose my-10">
        <Button asChild size="lg" className="rounded-full font-bold bg-primary h-14 px-10">
          <Link href="/feedback">Submit feedback or a complaint</Link>
        </Button>
      </div>
    </LegalPage>
  );
}

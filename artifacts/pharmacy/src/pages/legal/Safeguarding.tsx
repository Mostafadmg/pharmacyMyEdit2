import React from "react";
import LegalPage from "@/components/layout/LegalPage";

export default function Safeguarding() {
  return (
    <LegalPage
      title="Safeguarding Policy"
      subtitle="Protecting children, young people and adults at risk who use our service."
    >
      <p>
        EveryDayMeds follows the multi-agency statutory guidance <em>Working Together to Safeguard
        Children</em> (DfE) and the Care Act 2014 in protecting adults at risk. All staff are trained
        to recognise and act on safeguarding concerns.
      </p>

      <h2>Our duties to you</h2>
      <ul>
        <li>We will never supply a medicine where we have safeguarding concerns about misuse, coercion or risk of harm.</li>
        <li>We will not supply medicines to under-18s through this service.</li>
        <li>We will refer you to your GP, NHS&nbsp;111 or local urgent care if we believe an in-person assessment is in your best interests.</li>
        <li>We will refer to social services or other appropriate authorities where there is risk of significant harm.</li>
      </ul>

      <h2>Domestic abuse and coercion</h2>
      <p>
        If you ever feel under pressure to obtain medicines for someone else, or you are in immediate
        danger, please call <strong>999</strong>. The National Domestic Abuse helpline is available 24/7
        on <strong>0808 2000 247</strong>.
      </p>

      <h2>Mental capacity</h2>
      <p>
        We follow the Mental Capacity Act 2005. Our prescribers will only prescribe when they are
        satisfied that you have capacity to make decisions about your treatment. If we have concerns we
        will pause your consultation and direct you to a more appropriate service.
      </p>

      <h2>Raising a concern</h2>
      <p>
        Email{" "}
        <a href="mailto:safeguarding@everydaymeds.example.uk">safeguarding@everydaymeds.example.uk</a>{" "}
        — our Safeguarding Lead (the Superintendent Pharmacist) reviews all reports.
      </p>
    </LegalPage>
  );
}

import React from "react";
import LegalPage from "@/components/layout/LegalPage";

export default function CookiePolicy() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="What cookies we use, why we use them, and how you can manage them."
    >
      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files placed on your device when you visit a website. We use cookies to
        keep you signed in, remember your preferences, and understand how the service is used so that
        we can keep improving it.
      </p>

      <h2>Cookies we use</h2>
      <h3>Strictly necessary</h3>
      <ul>
        <li><strong>patient_token / pharmacist_token</strong> — keeps you signed in to your portal.</li>
        <li><strong>session</strong> — protects against cross-site request forgery (CSRF).</li>
      </ul>
      <h3>Functional</h3>
      <ul>
        <li><strong>patient_address1 / city / postcode</strong> — pre-fills your delivery address on subsequent consultations.</li>
      </ul>
      <h3>Analytics &amp; performance</h3>
      <p>
        We do not currently use third-party advertising cookies. Any analytics we use are
        privacy-respecting and do not track you across other websites.
      </p>

      <h2>Managing cookies</h2>
      <p>
        You can clear or block cookies through your browser settings at any time. Please note that some
        parts of the service (for example, signing in to your patient portal) will not work without
        strictly necessary cookies.
      </p>
    </LegalPage>
  );
}

import EdmPolicyPage from "@/components/layout/EdmPolicyPage";
import { COMPANY } from "@/data/everydaymedsSite";

export default function DeliveryPolicy() {
  return (
    <EdmPolicyPage title="Delivery Policy">
      <p><strong>Last updated: May 2025</strong></p>
      <p>
        EveryDayMeds is committed to ensuring that all medicines and products are delivered securely, discreetly, and on time. This Delivery Policy explains how we handle shipping, timeframes, packaging, and responsibilities.
      </p>
      <h2>1. Delivery Areas</h2>
      <p>We currently deliver to all addresses within the United Kingdom. We do not offer international delivery at this time.</p>
      <h2>2. Delivery Timeframes</h2>
      <p>
        Once your order has been approved, it is normally dispatched the same or next working day. Delivery times may vary depending on the option you choose at checkout, but most patients receive their medicines within 1–3 working days.
      </p>
      <h2>3. Discreet Packaging</h2>
      <p>All orders are sent in plain, unbranded packaging with no indication of the contents on the outside of the parcel.</p>
      <h2>4. Delivery Issues</h2>
      <p>
        If your order has not arrived within the expected timeframe, please contact us at {COMPANY.email} or {COMPANY.phoneDisplay}.
      </p>
    </EdmPolicyPage>
  );
}

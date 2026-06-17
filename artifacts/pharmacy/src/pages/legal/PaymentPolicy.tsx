import EdmPolicyPage from "@/components/layout/EdmPolicyPage";
import { COMPANY } from "@/data/everydaymedsSite";

export default function PaymentPolicy() {
  return (
    <EdmPolicyPage title="Payment Policy">
      <p><strong>Last updated: May 2025</strong></p>
      <p>
        This Payment Policy explains how payments are processed when you order from EveryDayMeds.
      </p>
      <h2>1. Accepted Payment Methods</h2>
      <p>
        We accept major debit and credit cards, Apple Pay, Google Pay, and other payment methods displayed at checkout. All transactions are processed securely.
      </p>
      <h2>2. When You Are Charged</h2>
      <p>
        Payment is taken at checkout. For consultation-based treatments, if your consultation is declined on clinical grounds, applicable fees will be refunded.
      </p>
      <h2>3. Pricing</h2>
      <p>All prices are shown in GBP and include VAT where applicable. Promotional codes must be applied at checkout.</p>
      <h2>4. Payment Queries</h2>
      <p>
        For payment issues, contact {COMPANY.email} or {COMPANY.phoneDisplay} with your order number.
      </p>
    </EdmPolicyPage>
  );
}

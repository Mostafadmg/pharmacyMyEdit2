import EdmPolicyPage from "@/components/layout/EdmPolicyPage";
import { COMPANY } from "@/data/everydaymedsSite";

export default function ReturnsPolicy() {
  return (
    <EdmPolicyPage title="Returns and Refunds Policy">
      <p><strong>Last updated: May 2025</strong></p>
      <p>
        At EveryDayMeds, we are committed to ensuring your satisfaction. This Returns and Refunds Policy explains your rights and our obligations regarding the return of products and the issuance of refunds.
      </p>
      <h2>1. Prescription Medicines</h2>
      <p>
        In accordance with UK regulations, we cannot accept returns or offer refunds on prescription-only medicines (POMs) or pharmacy-only medicines once they have been dispensed and dispatched, unless the product is faulty or not as described.
      </p>
      <h2>2. Non-Prescription Products</h2>
      <p>
        Unopened, unused non-prescription products in their original packaging may be returned within 14 days of delivery. You are responsible for return postage unless the item is faulty.
      </p>
      <h2>3. Consultation Fees</h2>
      <p>
        If a consultation is declined on clinical grounds, any consultation fee will be refunded in full. If you cancel before clinical review has commenced, please contact {COMPANY.email}.
      </p>
      <h2>4. How to Request a Refund</h2>
      <p>
        Contact our support team at {COMPANY.email} or {COMPANY.phoneDisplay} with your order number and reason for the request.
      </p>
    </EdmPolicyPage>
  );
}

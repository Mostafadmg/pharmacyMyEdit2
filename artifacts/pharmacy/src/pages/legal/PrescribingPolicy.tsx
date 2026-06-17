import EdmPolicyPage from "@/components/layout/EdmPolicyPage";
import { COMPANY } from "@/data/everydaymedsSite";

export default function PrescribingPolicy() {
  return (
    <EdmPolicyPage title="Prescribing and Dispensing Policy">
      <p><strong>Last updated: May 2025</strong></p>
      <p>
        EveryDayMeds is operated by {COMPANY.legalName}, a UK-based distance-selling pharmacy registered with the General Pharmaceutical Council (GPhC {COMPANY.gphcNumber}). This policy sets out how we prescribe and dispense medicines.
      </p>
      <h2>1. Clinical Review</h2>
      <p>
        All private treatment requests are reviewed by UK-registered prescribers or pharmacists. A medicine will only be prescribed when it is clinically appropriate and safe for you.
      </p>
      <h2>2. Patient Responsibilities</h2>
      <p>
        You must answer all consultation questions honestly and completely. You must be aged 18 or over and ordinarily resident in the UK.
      </p>
      <h2>3. Dispensing</h2>
      <p>
        Approved prescriptions are dispensed from our registered premises under the supervision of a GPhC-registered pharmacist. Superintendent Pharmacist: {COMPANY.superintendent} (GPhC {COMPANY.superintendentGphc}).
      </p>
      <h2>4. Declined Prescriptions</h2>
      <p>
        If a prescriber decides a treatment is not suitable, we will explain why and refund any applicable charges. We may signpost you to your GP, NHS 111, or another appropriate service.
      </p>
    </EdmPolicyPage>
  );
}

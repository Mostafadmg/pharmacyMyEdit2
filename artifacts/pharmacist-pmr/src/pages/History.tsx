import { PmrPageTitle, PmrShell } from "@/components/pmr";
import { DispensingList } from "@/components/DispensingList";

export function History() {
  return (
    <PmrShell className="max-w-[1200px]">
      <PmrPageTitle
        title="Completed history"
        subtitle="Fully dispensed and closed prescriptions."
      />
      <DispensingList
        filter="completed"
        emptyMessage="No completed prescriptions yet."
      />
    </PmrShell>
  );
}

import { Link } from "wouter";
import {
  Inbox,
  PauseCircle,
  Package,
  Tag,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PmrPageTitle, PmrShell } from "@/components/pmr";
import { usePatientsContext } from "@/context/PatientsContext";
import { getPharmacistName } from "@/lib/pharmacistSession";
import type { Consultation } from "@workspace/api-client-react";
import { statusToBoardColumn, type BoardColumn, type PmrWorkflowStatus } from "@/lib/pmrStatus";

function countColumn(
  approved: Consultation[],
  getStatus: (c: Consultation) => PmrWorkflowStatus,
  column: BoardColumn,
) {
  return approved.filter((c) => statusToBoardColumn(getStatus(c)) === column)
    .length;
}

export function Dashboard() {
  const { approved, approvedLoading, getStatus } = usePatientsContext();
  const name = getPharmacistName();

  const tiles = [
    {
      label: "Inbox",
      value: countColumn(approved, getStatus, "inbox"),
      icon: Inbox,
      tone: "bg-white/10 text-white/80",
      to: "/queue",
    },
    {
      label: "Parked",
      value: countColumn(approved, getStatus, "parked"),
      icon: PauseCircle,
      tone: "bg-orange-900/30 text-orange-300",
      to: "/queue",
    },
    {
      label: "Pick",
      value: countColumn(approved, getStatus, "pick"),
      icon: Package,
      tone: "bg-violet-900/30 text-violet-300",
      to: "/pick",
    },
    {
      label: "Label",
      value: countColumn(approved, getStatus, "label"),
      icon: Tag,
      tone: "bg-teal-900/30 text-teal-300",
      to: "/labelling",
    },
    {
      label: "Completed",
      value: approved.filter((c) => getStatus(c) === "completed").length,
      icon: CheckCircle2,
      tone: "bg-emerald-900/30 text-emerald-300",
      to: "/history",
    },
  ];

  const parked = countColumn(approved, getStatus, "parked");

  return (
    <PmrShell>
      <PmrPageTitle
        title={`Good day, ${name.split(" ")[0]}`}
        subtitle="Approved Rx flow through Inbox → Parked → Pick → Label → Pack → Completed on the prescription board."
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.label} href={t.to}>
              <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow group h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      {t.label}
                    </div>
                    <div className="font-mono text-3xl font-bold text-primary mt-2">
                      {approvedLoading ? "—" : t.value}
                    </div>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${t.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open board <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {parked > 0 && (
        <Card className="p-4 flex items-center gap-3 border-orange-200 bg-orange-50/50">
          <PauseCircle className="h-5 w-5 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-900">
            <strong>{parked}</strong> prescription{parked === 1 ? "" : "s"} on
            Parked.
          </p>
          <Link
            href="/queue"
            className="ml-auto text-sm font-medium text-orange-800 hover:underline"
          >
            View board
          </Link>
        </Card>
      )}
    </PmrShell>
  );
}

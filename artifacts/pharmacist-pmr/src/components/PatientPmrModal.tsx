import { Link } from "wouter";
import { Mail, User, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PmrStatusBadge } from "@/components/PmrStatusBadge";
import { usePatientProfile } from "@/hooks/usePatientProfile";
import { usePatientsContext } from "@/context/PatientsContext";
import { formatDob } from "@/lib/patients";
import { cn } from "@/lib/utils";

type PatientPmrModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientEmail?: string | null;
  patientName?: string;
  allergies?: string | null;
  nhsNumber?: string | null;
  address?: string | null;
};

export function PatientPmrModal({
  open,
  onOpenChange,
  patientEmail,
  patientName,
  allergies,
  nhsNumber,
  address,
}: PatientPmrModalProps) {
  const { getStatus } = usePatientsContext();
  const { data, loading, error } = usePatientProfile(open ? patientEmail : null);

  const profile = data?.profile;
  const displayName = profile?.name ?? patientName ?? patientEmail ?? "Patient";
  const approved = (data?.consultations ?? []).filter(
    (c) => c.status === "approved",
  );
  const messages = (data?.recentMessages ?? []).slice(0, 5);
  const spendGbp =
    profile?.totalSpendPence != null
      ? (profile.totalSpendPence / 100).toFixed(2)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="bg-primary/[0.04]">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-xl font-serif">{displayName}</DialogTitle>
              <DialogDescription className="mt-1 space-y-0.5">
                <span className="block">
                  {profile?.pmrNumber ? `PMR ${profile.pmrNumber}` : "No PMR number"}
                  {profile?.dateOfBirth
                    ? ` · DOB ${formatDob(profile.dateOfBirth)}`
                    : ""}
                </span>
                {patientEmail && (
                  <span className="flex items-center gap-1.5 text-xs">
                    <Mail className="h-3 w-3" />
                    {patientEmail}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[min(55vh,480px)] px-6 py-4 space-y-5">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Loading patient record…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive py-4">{error}</p>
          ) : (
            <>
              <section>
                <h3 className="pmr-label-caps mb-2">Patient details</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {nhsNumber && (
                    <>
                      <dt className="text-muted-foreground">NHS number</dt>
                      <dd className="font-medium font-mono text-xs">{nhsNumber}</dd>
                    </>
                  )}
                  {address && (
                    <>
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="font-medium col-span-1">{address}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Allergies</dt>
                  <dd
                    className={cn(
                      "font-medium",
                      allergies?.trim() &&
                        !["unknown", "not recorded"].includes(
                          allergies.trim().toLowerCase(),
                        )
                        ? "text-amber-800 dark:text-amber-200"
                        : "",
                    )}
                  >
                    {allergies?.trim() || "Not recorded"}
                  </dd>
                </dl>
              </section>

              {profile && (
                <section>
                  <h3 className="pmr-label-caps mb-2">PMR summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatChip label="Consultations" value={String(profile.totalConsultations)} />
                    <StatChip label="Approved Rx" value={String(profile.approvedCount)} />
                    {spendGbp && (
                      <StatChip label="Total spend" value={`£${spendGbp}`} />
                    )}
                    {profile.topConditions?.[0] && (
                      <StatChip
                        label="Top condition"
                        value={profile.topConditions[0].name}
                        className="col-span-2 sm:col-span-1"
                      />
                    )}
                  </div>
                </section>
              )}

              <section>
                <h3 className="pmr-label-caps mb-2">
                  Prescription history ({approved.length})
                </h3>
                {approved.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved prescriptions.</p>
                ) : (
                  <ul className="space-y-2">
                    {approved.slice(0, 8).map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.conditionName}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {c.consultationNumber ?? c.id.slice(0, 8)}
                          </p>
                        </div>
                        <PmrStatusBadge status={getStatus(c)} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {messages.length > 0 && (
                <section>
                  <h3 className="pmr-label-caps mb-2">Recent messages</h3>
                  <ul className="space-y-2">
                    {messages.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs"
                      >
                        <p className="text-muted-foreground mb-0.5">
                          {m.senderRole ?? "Message"} ·{" "}
                          {new Date(m.createdAt).toLocaleDateString("en-GB")}
                        </p>
                        <p className="line-clamp-2">{m.body}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {patientEmail && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Link
              href={`/patients/${encodeURIComponent(patientEmail)}`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open full patient record
            </Link>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatChip({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card px-3 py-2",
        className,
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}

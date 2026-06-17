import type { Consultation } from "@workspace/api-client-react";
import { resolvePmrStatus, type PmrWorkflowStatus } from "@/lib/pmrStatus";

export type PickCodeRoute = {
  path: string;
  label: string;
  patientName: string;
};

export function routeForPickCodeConsultation(
  consultation: Consultation,
): PickCodeRoute {
  const status = resolvePmrStatus(consultation);
  const id = consultation.id;
  const email = consultation.patientEmail?.trim();
  const patientName = consultation.patientName;

  switch (status) {
    case "awaiting_check":
    case "inbox":
      return {
        path: `/clinical-check/${id}`,
        label: "Clinical check",
        patientName,
      };
    case "pick":
      return {
        path: `/pick`,
        label: "Pick queue",
        patientName,
      };
    case "label":
    case "pack":
      return {
        path: `/labelling/${id}`,
        label: status === "pack" ? "Pack" : "Labelling",
        patientName,
      };
    case "parked":
      return {
        path: `/queue?select=${encodeURIComponent(id)}`,
        label: "Parked",
        patientName,
      };
    case "completed":
      return {
        path: email
          ? `/patients/${encodeURIComponent(email)}`
          : `/queue?select=${encodeURIComponent(id)}`,
        label: "Complete",
        patientName,
      };
    default:
      return {
        path: `/queue?select=${encodeURIComponent(id)}`,
        label: "Prescription board",
        patientName,
      };
  }
}

export function isPickCode(barcode: string): boolean {
  return barcode.trim().toUpperCase().startsWith("PICK-");
}

export function statusLabel(status: PmrWorkflowStatus): string {
  switch (status) {
    case "awaiting_check":
    case "inbox":
      return "Clinical check";
    case "pick":
      return "Pick";
    case "label":
      return "Label";
    case "pack":
      return "Pack";
    case "parked":
      return "Parked";
    case "completed":
      return "Complete";
    default:
      return "Prescription";
  }
}

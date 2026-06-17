import type {
  Consultation,
  PmrClinicalCheckInput,
  PmrVerifyItemInput,
  PmrVerifyItemResponse,
  PmrPickingLabelResponse,
  PmrWorkflowStatus,
} from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api";

export async function fetchPmrConsultations(
  pmrWorkflowStatus?: PmrWorkflowStatus,
): Promise<Consultation[]> {
  const qs = new URLSearchParams();
  if (pmrWorkflowStatus) qs.set("pmrWorkflowStatus", pmrWorkflowStatus);
  qs.set("limit", "200");
  const res = await apiFetch<{ consultations: Consultation[] }>(
    `/api/pmr/consultations?${qs.toString()}`,
  );
  return res.consultations ?? [];
}

export async function patchPmrWorkflow(
  id: string,
  status: PmrWorkflowStatus,
): Promise<Consultation> {
  return apiFetch<Consultation>(`/api/pmr/consultations/${id}/workflow`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function postPmrClinicalCheck(
  id: string,
  data: PmrClinicalCheckInput,
): Promise<Consultation> {
  return apiFetch<Consultation>(`/api/pmr/consultations/${id}/clinical-check`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function postPmrPickingLabel(
  id: string,
): Promise<PmrPickingLabelResponse> {
  return apiFetch<PmrPickingLabelResponse>(
    `/api/pmr/consultations/${id}/picking-label`,
    { method: "POST", body: "{}" },
  );
}

export async function postPmrVerifyItem(
  id: string,
  data: PmrVerifyItemInput,
): Promise<PmrVerifyItemResponse> {
  return apiFetch<PmrVerifyItemResponse>(
    `/api/pmr/consultations/${id}/verify-item`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function postPmrDispatch(id: string): Promise<Consultation> {
  return apiFetch<Consultation>(`/api/pmr/consultations/${id}/dispatch`, {
    method: "POST",
    body: "{}",
  });
}

export async function getConsultationByPickCode(
  code: string,
): Promise<Consultation> {
  return apiFetch<Consultation>(
    `/api/pmr/consultations/by-pick-code/${encodeURIComponent(code)}`,
  );
}

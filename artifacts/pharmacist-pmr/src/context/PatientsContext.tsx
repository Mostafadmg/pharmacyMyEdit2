import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  resolvePmrStatus,
  type PmrWorkflowStatus,
} from "@/lib/pmrStatus";
import {
  ensureApiSeedInboxStatuses,
  ensureBoardDemoStatuses,
  mergeApprovedWithBoardDemos,
} from "@/lib/boardDemoData";
import { fetchPmrConsultations } from "@/lib/pmrWorkflowApi";
import type { PatientRow } from "@/lib/patients";
import type { Consultation } from "@workspace/api-client-react";

type PatientsContextValue = {
  patients: PatientRow[];
  patientsLoading: boolean;
  approved: Consultation[];
  approvedLoading: boolean;
  refreshApproved: () => void;
  getStatus: (c: Consultation) => PmrWorkflowStatus;
  statusVersion: number;
};

const PatientsContext = createContext<PatientsContextValue | null>(null);

export function PatientsProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [statusVersion, setStatusVersion] = useState(0);

  const { data: apiApproved = [], isLoading, refetch } = useQuery({
    queryKey: ["pmr", "consultations"],
    queryFn: () => fetchPmrConsultations(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const approved = useMemo(
    () => mergeApprovedWithBoardDemos(apiApproved),
    [apiApproved],
  );

  useEffect(() => {
    ensureBoardDemoStatuses();
    ensureApiSeedInboxStatuses(apiApproved);
  }, [apiApproved]);

  useEffect(() => {
    void apiFetch<{ patients: PatientRow[] }>("/api/pharmacist/patients")
      .then((res) => setPatients(res.patients ?? []))
      .catch(() => setPatients([]))
      .finally(() => setPatientsLoading(false));
  }, []);

  useEffect(() => {
    const onStatus = () => setStatusVersion((v) => v + 1);
    window.addEventListener("pmr:status-changed", onStatus);
    return () => window.removeEventListener("pmr:status-changed", onStatus);
  }, []);

  const getStatus = useCallback(
    (c: Consultation) => resolvePmrStatus(c),
    [statusVersion],
  );

  const value = useMemo(
    () => ({
      patients,
      patientsLoading,
      approved,
      approvedLoading: isLoading,
      refreshApproved: () => void refetch(),
      getStatus,
      statusVersion,
    }),
    [
      patients,
      patientsLoading,
      approved,
      isLoading,
      refetch,
      getStatus,
      statusVersion,
    ],
  );

  return (
    <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>
  );
}

export function usePatientsContext() {
  const ctx = useContext(PatientsContext);
  if (!ctx) {
    throw new Error("usePatientsContext must be used within PatientsProvider");
  }
  return ctx;
}

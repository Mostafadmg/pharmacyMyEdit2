import React, { useMemo } from "react";
import { useLocation } from "wouter";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import PatientMessageInbox from "@/components/PatientMessageInbox";

export default function PatientMessages() {
  const [location] = useLocation();

  const consultationFromUrl = useMemo(() => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    return params.get("consultation") || params.get("order") || null;
  }, [location]);

  return (
    <PatientAccountLayout bare flushContent>
      <PatientMessageInbox initialConsultationId={consultationFromUrl} />
    </PatientAccountLayout>
  );
}

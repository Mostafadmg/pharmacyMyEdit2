import React, { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { MessageSquare } from "lucide-react";
import PatientAccountLayout from "@/components/layout/PatientAccountLayout";
import PatientMessageInbox from "@/components/PatientMessageInbox";

export default function PatientMessages() {
  const [location, navigate] = useLocation();

  const consultationFromUrl = useMemo(() => {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    return params.get("consultation") || params.get("order") || null;
  }, [location]);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
    }
  }, [navigate]);

  return (
    <PatientAccountLayout
      title="Messages"
      subtitle="Message your clinical team securely. Replies usually within one working day."
      icon={<MessageSquare className="h-5 w-5" />}
    >
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[560px]">
        <PatientMessageInbox
          className="min-h-[560px]"
          initialConsultationId={consultationFromUrl}
        />
      </div>
    </PatientAccountLayout>
  );
}

import React from "react";
import { Link, useParams } from "wouter";
import { useGetConsultation, getGetConsultationQueryKey } from "@workspace/api-client-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import ConsultationChat from "@/components/ConsultationChat";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  patient_responded: "bg-orange-100 text-orange-800 border-orange-200",
  more_info_needed: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-slate-100 text-slate-700 border-slate-200",
  referred: "bg-purple-100 text-purple-800 border-purple-200",
  red_flag: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  patient_responded: "Patient replied",
  more_info_needed: "Awaiting reply",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  referred: "Referred",
  red_flag: "Urgent",
};

export default function PharmacistMessageThread() {
  const { id } = useParams<{ id: string }>();

  const { data: consultation, isLoading } = useGetConsultation(id ?? "", {
    query: { enabled: !!id, queryKey: getGetConsultationQueryKey(id ?? "") },
  });

  return (
    <PharmacistLayout current="messages">
      <div className="space-y-4 h-full flex flex-col">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <Link href="/dashboard/messages">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              All threads
            </span>
          </Link>
          {!isLoading && consultation && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold text-secondary text-sm">{consultation.patientName}</span>
              <Badge
                className={`text-[10px] font-semibold border ${STATUS_COLORS[(consultation as { status?: string }).status ?? ""] ?? "bg-muted text-muted-foreground"}`}
              >
                {STATUS_LABELS[(consultation as { status?: string }).status ?? ""] ?? (consultation as { status?: string }).status}
              </Badge>
            </>
          )}
          {isLoading && <Skeleton className="h-5 w-40 rounded-full" />}
        </motion.div>

        {!isLoading && consultation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-border px-4 py-3 flex items-center gap-4"
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {consultation.patientName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-secondary text-sm">{consultation.patientName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {consultation.patientEmail} · {consultation.conditionName}
              </p>
            </div>
            <Link href={`/dashboard/consultation/${id}`}>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer">
                View full consultation
                <ExternalLink className="w-3 h-3" />
              </span>
            </Link>
          </motion.div>
        )}

        {isLoading && <Skeleton className="h-14 rounded-xl" />}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 min-h-0"
        >
          {id ? (
            <ConsultationChat consultationId={id} audience="pharmacist" />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-secondary font-semibold">No thread selected</p>
            </div>
          )}
        </motion.div>
      </div>
    </PharmacistLayout>
  );
}

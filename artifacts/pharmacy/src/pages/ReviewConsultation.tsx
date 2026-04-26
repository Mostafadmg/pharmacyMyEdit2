import React, { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { 
  useGetConsultation, 
  useReviewConsultation,
  getGetConsultationQueryKey,
  ConsultationReviewInputAction
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  ExternalLink,
  User,
  Activity,
  FileText,
  Clock,
  Pill,
  CheckCircle2,
  Calendar,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Truck,
  MapPin,
  Send,
  Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function ReviewConsultation() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [reviewNote, setReviewNote] = useState("");
  const [prescriptionDetails, setPrescriptionDetails] = useState("");
  const [referralDetails, setReferralDetails] = useState("");
  
  const { data: consultation, isLoading } = useGetConsultation(id || "", {
    query: { enabled: !!id, queryKey: getGetConsultationQueryKey(id || "") }
  });

  const reviewMutation = useReviewConsultation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConsultationQueryKey(id || "") });
        toast.success("Consultation reviewed successfully");
        setLocation("/dashboard");
      },
      onError: () => {
        toast.error("Failed to submit review. Please try again.");
      }
    }
  });

  const handleReview = (action: typeof ConsultationReviewInputAction[keyof typeof ConsultationReviewInputAction]) => {
    if (!id) return;
    
    reviewMutation.mutate({
      id,
      data: {
        action,
        pharmacistNote: reviewNote || null,
        prescription: action === 'approve' ? prescriptionDetails : null,
        referralInfo: action === 'refer' ? referralDetails : null
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-semibold px-3 py-1">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none font-semibold px-3 py-1">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none font-semibold px-3 py-1">Rejected</Badge>;
      case "more_info_needed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none font-semibold px-3 py-1">More Info Needed</Badge>;
      case "referred":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none font-semibold px-3 py-1">Referred</Badge>;
      case "red_flag":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none font-semibold px-3 py-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Urgent</Badge>;
      default:
        return <Badge variant="outline" className="font-semibold px-3 py-1">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-8 font-sans">
        <Skeleton className="h-8 w-48 mb-8 rounded-lg" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[32rem] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary mb-4">Consultation not found</h2>
          <Button onClick={() => setLocation("/dashboard")} className="rounded-full">Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isPending = consultation.status === "pending" || consultation.status === "red_flag";
  const c = consultation as any;
  const riskFlags: string[] = Array.isArray(c.riskFlags) ? c.riskFlags : [];
  const riskCategory: string = c.riskCategory || "standard";

  const formatRiskFlag = (flag: string) =>
    flag.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("pharmacist_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleShareWithGp = async () => {
    if (!id) return;
    try {
      const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${base}/api/compliance/consultations/${id}/share-with-gp`, {
        method: "PUT",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Marked as shared with patient's GP");
      queryClient.invalidateQueries({ queryKey: getGetConsultationQueryKey(id) });
    } catch {
      toast.error("Failed to mark as shared with GP");
    }
  };

  const handleUpdateDelivery = async (status: string) => {
    if (!id) return;
    try {
      const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${base}/api/compliance/consultations/${id}/delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Delivery status updated to "${status}"`);
      queryClient.invalidateQueries({ queryKey: getGetConsultationQueryKey(id) });
    } catch {
      toast.error("Failed to update delivery status");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20 font-sans">
      <header className="bg-secondary text-white py-4 px-6 border-b border-secondary/80 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-white/80 hover:text-white transition-colors font-medium group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Queue
          </Link>
          <div className="text-sm font-medium opacity-80 flex items-center gap-2">
            ID: <span className="font-mono bg-black/20 px-2 py-1 rounded text-white">{consultation.id.substring(0,8)}</span>
          </div>
        </div>
      </header>

      {consultation.hasRedFlag && isPending && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-600 text-white py-3 px-6 shadow-md relative z-40"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 font-semibold">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            WARNING: Red flags detected in patient questionnaire. Review medical history carefully.
          </div>
        </motion.div>
      )}

      <main className="p-6 md:p-10 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
        
        <div className="xl:col-span-2 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-secondary mb-3">{consultation.conditionName}</h1>
              <div className="flex items-center gap-4 text-muted-foreground font-medium">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> Submitted {format(new Date(consultation.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(consultation.status)}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-md overflow-hidden rounded-2xl">
              <CardHeader className="bg-primary text-primary-foreground py-5">
                <CardTitle className="text-xl flex items-center gap-2 font-bold">
                  <User className="w-5 h-5" />
                  Patient Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {consultation.patientName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Full Name</p>
                        <p className="font-semibold text-lg text-secondary">{consultation.patientName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Email Contact</p>
                        <p className="font-medium text-secondary">{consultation.patientEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Demographics</p>
                        <p className="font-medium text-secondary">{consultation.patientAge} yrs • {consultation.patientSex.charAt(0).toUpperCase() + consultation.patientSex.slice(1)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6 bg-slate-50/50">
                    <div>
                      <Label className="text-xs text-red-600 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4" /> Allergies
                      </Label>
                      <div className="bg-white p-3 rounded-xl border border-red-100 shadow-sm text-secondary font-medium">
                        {(consultation.answers as any).allergies || "None reported"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-amber-600 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Pill className="w-4 h-4" /> Current Medications
                      </Label>
                      <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm text-secondary font-medium">
                        {(consultation.answers as any).currentMedications || "None reported"}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Activity className="w-4 h-4" /> Medical History
                      </Label>
                      <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm text-secondary font-medium">
                        {(consultation.answers as any).medicalHistory || "None reported"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GPhC Compliance & Risk Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className={`border-none shadow-md overflow-hidden rounded-2xl ${riskCategory === 'high' ? 'ring-2 ring-red-300' : ''}`}>
              <CardHeader className={`py-5 ${riskCategory === 'high' ? 'bg-red-600' : riskCategory === 'medium' ? 'bg-amber-500' : 'bg-emerald-600'} text-white`}>
                <CardTitle className="text-xl flex items-center justify-between font-bold">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    GPhC Compliance & Risk Assessment
                  </span>
                  <Badge className="bg-white/20 text-white border border-white/30 uppercase font-bold tracking-wider px-3 py-1">
                    {riskCategory} risk
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Risk flags */}
                {riskFlags.length > 0 ? (
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Auto-detected Safeguarding Flags ({riskFlags.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {riskFlags.map((flag) => (
                        <Badge key={flag} className="bg-red-100 text-red-900 border border-red-300 font-medium px-3 py-1.5">
                          {formatRiskFlag(flag)}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-red-700 mt-3 italic">
                      Per GPhC guidance, these flags require careful clinical judgement before supplying any medication.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-800 font-medium">No automated safeguarding flags detected.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Identity */}
                  <div className="rounded-xl border border-border p-4 bg-slate-50/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Identity Verification
                    </p>
                    <p className="text-sm text-secondary font-medium">
                      Method: <span className="font-semibold">{c.identityVerificationMethod || "Photo ID"}</span>
                    </p>
                    {c.identityVerificationRef && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        Ref: {c.identityVerificationRef}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Patient confirmed identity at submission per GPhC requirements.
                    </p>
                  </div>

                  {/* GP Details */}
                  <div className="rounded-xl border border-border p-4 bg-slate-50/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4" /> Patient's GP
                    </p>
                    {c.gpName || c.gpSurgery ? (
                      <>
                        <p className="text-sm text-secondary font-medium">{c.gpName || "Not provided"}</p>
                        <p className="text-xs text-muted-foreground">{c.gpSurgery || ""}</p>
                        {c.gpAddress && <p className="text-xs text-muted-foreground mt-1">{c.gpAddress}</p>}
                        {c.gpPhone && <p className="text-xs text-muted-foreground">Tel: {c.gpPhone}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-amber-700 font-medium italic">Patient declined to provide GP details</p>
                    )}
                  </div>

                  {/* Delivery */}
                  <div className="rounded-xl border border-border p-4 bg-slate-50/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Delivery Address
                    </p>
                    {c.deliveryAddressLine1 ? (
                      <>
                        <p className="text-sm text-secondary font-medium">{c.deliveryAddressLine1}</p>
                        {c.deliveryAddressLine2 && <p className="text-sm text-secondary">{c.deliveryAddressLine2}</p>}
                        <p className="text-sm text-secondary">
                          {c.deliveryCity}{c.deliveryCity && c.deliveryPostcode ? ", " : ""}{c.deliveryPostcode}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Not yet provided</p>
                    )}
                  </div>

                  {/* Weight verification (only for weight management) */}
                  {(c.weightKg || c.heightCm || c.bmi) && (
                    <div className="rounded-xl border border-border p-4 bg-slate-50/50">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Scale className="w-4 h-4" /> Weight Verification
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-sm font-bold text-secondary">{c.weightKg ? `${c.weightKg} kg` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="text-sm font-bold text-secondary">{c.heightCm ? `${c.heightCm} cm` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">BMI</p>
                          <p className="text-sm font-bold text-secondary">{c.bmi ? Number(c.bmi).toFixed(1) : "—"}</p>
                        </div>
                      </div>
                      {c.weightVerificationMethod && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Verified via: <span className="font-semibold">{c.weightVerificationMethod}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Consents */}
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Patient Consents (recorded at submission)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {[
                      ["consentDataProcessing", "Data processing"],
                      ["consentToTreatment", "Pharmacist treatment decision"],
                      ["consentToDelivery", "Tracked delivery"],
                      ["consentShareWithGp", "Share details with GP"],
                    ].map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        {c[key] ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                        <span className={c[key] ? "text-secondary" : "text-muted-foreground"}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pharmacist actions */}
                {!isPending && (
                  <div className="border-t pt-5 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Post-supply actions
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShareWithGp}
                        disabled={!!c.sharedWithGpAt}
                        className="rounded-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {c.sharedWithGpAt
                          ? `Shared ${format(new Date(c.sharedWithGpAt), "d MMM yyyy")}`
                          : "Mark shared with GP"}
                      </Button>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Delivery:</span>
                        <Badge variant="outline" className="capitalize">
                          {c.deliveryStatus || "pending"}
                        </Badge>
                      </div>
                      {["dispatched", "delivered"].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateDelivery(s)}
                          className="rounded-full text-xs capitalize"
                        >
                          Mark {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-md overflow-hidden rounded-2xl">
              <CardHeader className="bg-secondary text-white py-5">
                <CardTitle className="text-xl flex items-center gap-2 font-bold">
                  <Activity className="w-5 h-5 text-accent" />
                  Clinical Questionnaire
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {Object.entries(consultation.answers).map(([key, value], idx) => {
                    if (['allergies', 'currentMedications', 'medicalHistory'].includes(key)) return null;
                    
                    const questionStr = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <div key={key} className="p-6 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 hover:bg-muted/10 transition-colors">
                        <div className="md:w-1/3 shrink-0">
                          <p className="font-semibold text-secondary/80 text-sm leading-relaxed">{questionStr}?</p>
                        </div>
                        <div className="md:w-2/3">
                          <p className="text-secondary font-medium text-lg bg-muted/20 p-4 rounded-xl inline-block border border-border/50">{String(value)}</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {consultation.hasPhoto && (
                    <div className="p-6 md:p-8 bg-blue-50/30">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                        <div className="md:w-1/3 shrink-0">
                          <p className="font-semibold text-secondary/80 text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Patient Uploaded Photos
                          </p>
                        </div>
                        <div className="md:w-2/3">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-square bg-muted/50 rounded-xl border border-border flex items-center justify-center text-muted-foreground font-medium flex-col gap-3 hover:bg-muted transition-colors cursor-pointer group">
                              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-primary" />
                              </div>
                              View Photo 1
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Action Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <Card className={`border-none shadow-xl rounded-2xl sticky top-24 overflow-hidden ${isPending ? 'ring-2 ring-primary/50' : ''}`}>
            <CardHeader className={isPending ? 'bg-primary/5 pb-6' : 'bg-muted/30 pb-6'}>
              <CardTitle className="text-2xl font-serif text-secondary mb-1">Clinical Decision</CardTitle>
              <CardDescription className="text-sm font-medium">Review answers and determine the appropriate action.</CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {!isPending ? (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-muted/20 border border-border">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block font-bold">Decision Made</Label>
                    <div className="mb-6">{getStatusBadge(consultation.status)}</div>
                    
                    {consultation.pharmacistNote && (
                      <div className="mt-6">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-bold flex items-center gap-2"><FileText className="w-3 h-3"/> Clinical Notes</Label>
                        <p className="text-sm text-secondary p-4 bg-white rounded-xl border border-border shadow-sm leading-relaxed">{consultation.pharmacistNote}</p>
                      </div>
                    )}
                    
                    {consultation.prescription && (
                      <div className="mt-6">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-bold flex items-center gap-2"><Pill className="w-3 h-3"/> Issued Prescription</Label>
                        <p className="text-sm text-secondary p-4 bg-white rounded-xl border border-border shadow-sm font-mono leading-relaxed">{consultation.prescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label htmlFor="clinical-notes" className="text-sm font-bold text-secondary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Clinical Notes (Internal)
                    </Label>
                    <Textarea 
                      id="clinical-notes"
                      placeholder="Add your clinical reasoning here..." 
                      className="min-h-[120px] resize-none rounded-xl focus-visible:ring-primary/30"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4 pt-6 mt-6 border-t border-border">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-14 text-base font-bold shadow-md hover:shadow-lg transition-all" size="lg">
                          <CheckCircle2 className="w-5 h-5 mr-2" /> Approve & Prescribe
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-secondary">Issue Prescription</DialogTitle>
                          <DialogDescription className="text-base">
                            Write the prescription details for <span className="font-bold text-secondary">{consultation.patientName}</span>.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-3">
                            <Label htmlFor="prescription" className="font-bold text-secondary">Prescription Details</Label>
                            <Textarea 
                              id="prescription" 
                              value={prescriptionDetails}
                              onChange={(e) => setPrescriptionDetails(e.target.value)}
                              placeholder="e.g. Amoxicillin 500mg capsules. 1 capsule three times a day for 5 days. Quantity: 15."
                              className="min-h-[160px] font-mono text-sm rounded-xl focus-visible:ring-green-500/30"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => handleReview('approve')} 
                            disabled={!prescriptionDetails || reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 h-12 font-bold"
                          >
                            {reviewMutation.isPending ? "Processing..." : "Confirm Approval"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl h-12 font-bold">
                          <MessageSquare className="w-5 h-5 mr-2" /> Request More Info
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-secondary">Request Information</DialogTitle>
                          <DialogDescription className="text-base">
                            What additional information do you need from the patient?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-3">
                            <Label className="font-bold text-secondary">Message to Patient</Label>
                            <Textarea 
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="e.g. Please upload a clearer photo of the rash..."
                              className="min-h-[140px] rounded-xl focus-visible:ring-blue-500/30"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => handleReview('more_info')} 
                            disabled={!reviewNote || reviewMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 font-bold"
                          >
                            Send Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl h-12 font-bold">
                          <ExternalLink className="w-5 h-5 mr-2" /> Refer to GP / Urgent Care
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-secondary">Refer Patient</DialogTitle>
                          <DialogDescription className="text-base">
                            Provide instructions for the patient to seek alternative care.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-3">
                            <Label className="font-bold text-secondary">Referral Instructions</Label>
                            <Textarea 
                              value={referralDetails}
                              onChange={(e) => setReferralDetails(e.target.value)}
                              placeholder="e.g. Your symptoms require physical examination. Please contact your GP within 48 hours..."
                              className="min-h-[140px] rounded-xl focus-visible:ring-purple-500/30"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => handleReview('refer')} 
                            disabled={!referralDetails || reviewMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 h-12 font-bold"
                          >
                            Confirm Referral
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl h-12 font-bold mt-4">
                          <XCircle className="w-5 h-5 mr-2" /> Reject Consultation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-red-600 flex items-center gap-2"><AlertTriangle className="w-6 h-6"/> Reject Consultation</DialogTitle>
                          <DialogDescription className="text-base">
                            Please provide a reason for rejecting this consultation. The patient will be notified.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-3">
                            <Label className="font-bold text-secondary">Rejection Reason</Label>
                            <Textarea 
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="e.g. This treatment is not suitable for your specific medical history..."
                              className="min-h-[140px] rounded-xl focus-visible:ring-red-500/30"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="destructive"
                            onClick={() => handleReview('reject')} 
                            disabled={!reviewNote || reviewMutation.isPending}
                            className="rounded-full px-8 h-12 font-bold"
                          >
                            Confirm Rejection
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

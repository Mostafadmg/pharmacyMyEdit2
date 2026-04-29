import React, { useEffect, useState } from "react";
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
  Scale,
  StickyNote,
  Plus,
  Pencil,
  Trash2,
  Save,
  X as XIcon
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
  
  const [prescriptionDetails, setPrescriptionDetails] = useState("");

  // Structured fields
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectExplanation, setRejectExplanation] = useState<string>("");
  const [referRecipientType, setReferRecipientType] = useState<string>("gp");
  const [referRecipientName, setReferRecipientName] = useState<string>("");
  const [referUrgency, setReferUrgency] = useState<string>("routine");
  const [referNote, setReferNote] = useState<string>("");
  const [moreInfoMessage, setMoreInfoMessage] = useState<string>("");

  // Modal open state (controlled so we can close on success)
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [referOpen, setReferOpen] = useState(false);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  type PatientNote = {
    id: string;
    patientEmail: string;
    note: string;
    createdBy: string;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [loadingPatientNotes, setLoadingPatientNotes] = useState(false);
  const [newPatientNote, setNewPatientNote] = useState("");
  const [savingPatientNote, setSavingPatientNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  type ConsultationNote = {
    id: string;
    consultationId: string;
    note: string;
    createdBy: string;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
  };
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [loadingConsultationNotes, setLoadingConsultationNotes] = useState(false);
  const [newConsultationNote, setNewConsultationNote] = useState("");
  const [savingConsultationNote, setSavingConsultationNote] = useState(false);
  const [editingConsultNoteId, setEditingConsultNoteId] = useState<string | null>(null);
  const [editingConsultNoteText, setEditingConsultNoteText] = useState("");

  // Photo lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const authHeaders = (extra?: Record<string, string>): Record<string, string> => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("pharmacist_token") : null;
    return {
      ...(extra ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const pharmacistName =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("pharmacist_name") ?? "Pharmacist"
      : "Pharmacist";
  
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

  useEffect(() => {
    const email = (consultation as { patientEmail?: string } | undefined)?.patientEmail;
    if (!email) return;
    let cancelled = false;
    (async () => {
      setLoadingPatientNotes(true);
      try {
        const res = await fetch(`/api/patient-notes/${encodeURIComponent(email)}`, {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (!cancelled) setPatientNotes(json.notes ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingPatientNotes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [(consultation as { patientEmail?: string } | undefined)?.patientEmail]);

  async function handleAddPatientNote() {
    const text = newPatientNote.trim();
    const email = (consultation as { patientEmail?: string } | undefined)?.patientEmail;
    if (!text || !email) return;
    setSavingPatientNote(true);
    try {
      const res = await fetch(`/api/patient-notes`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ patientEmail: email, note: text }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setPatientNotes((prev) => [json.note, ...prev]);
      setNewPatientNote("");
      toast.success("Note shared with all prescribers");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingPatientNote(false);
    }
  }

  async function handleSavePatientNoteEdit() {
    if (!editingNoteId || !editingNoteText.trim()) return;
    setSavingPatientNote(true);
    try {
      const res = await fetch(`/api/patient-notes/${editingNoteId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editingNoteText.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setPatientNotes((prev) => prev.map((n) => (n.id === editingNoteId ? json.note : n)));
      setEditingNoteId(null);
      setEditingNoteText("");
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update note");
    } finally {
      setSavingPatientNote(false);
    }
  }

  // ── Consultation-level notes (timeline tied to THIS consultation) ──
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoadingConsultationNotes(true);
      try {
        const res = await fetch(`/api/consultation-notes/${encodeURIComponent(id)}`, {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (!cancelled) setConsultationNotes(json.notes ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingConsultationNotes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleAddConsultationNote() {
    const text = newConsultationNote.trim();
    if (!text || !id) return;
    setSavingConsultationNote(true);
    try {
      const res = await fetch(`/api/consultation-notes`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ consultationId: id, note: text }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setConsultationNotes((prev) => [json.note, ...prev]);
      setNewConsultationNote("");
      toast.success("Note added to this consultation");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingConsultationNote(false);
    }
  }

  async function handleSaveConsultationNoteEdit() {
    if (!editingConsultNoteId || !editingConsultNoteText.trim()) return;
    setSavingConsultationNote(true);
    try {
      const res = await fetch(`/api/consultation-notes/${editingConsultNoteId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editingConsultNoteText.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setConsultationNotes((prev) => prev.map((n) => (n.id === editingConsultNoteId ? json.note : n)));
      setEditingConsultNoteId(null);
      setEditingConsultNoteText("");
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update note");
    } finally {
      setSavingConsultationNote(false);
    }
  }

  async function handleDeleteConsultationNote(noteId: string) {
    if (!confirm("Delete this consultation note?")) return;
    try {
      const res = await fetch(`/api/consultation-notes/${noteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("failed");
      setConsultationNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note removed");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  async function handleDeletePatientNote(noteId: string) {
    if (!confirm("Delete this note?")) return;
    try {
      const res = await fetch(`/api/patient-notes/${noteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("failed");
      setPatientNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note removed");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  const handleReview = (action: typeof ConsultationReviewInputAction[keyof typeof ConsultationReviewInputAction]) => {
    if (!id) return;

    if (action === 'reject' && (!rejectReason || !rejectExplanation.trim())) {
      toast.error("Select a reason and explanation");
      return;
    }
    if (action === 'refer' && (!referRecipientType || !referRecipientName.trim())) {
      toast.error("Choose a recipient and provide their name");
      return;
    }
    if (action === 'more_info' && !moreInfoMessage.trim()) {
      toast.error("Tell the patient what info is needed");
      return;
    }

    const pharmacistNote =
      action === 'reject' ? rejectExplanation
      : action === 'refer' ? referNote
      : action === 'more_info' ? moreInfoMessage
      : null;

    const data: any = {
      action,
      pharmacistNote: pharmacistNote || null,
      prescription: action === 'approve' ? prescriptionDetails : null,
      referralInfo: action === 'refer' ? referNote : null,
    };
    if (action === 'reject') data.rejectReason = rejectReason;
    if (action === 'refer') {
      data.referRecipientType = referRecipientType;
      data.referRecipientName = referRecipientName;
      data.referUrgency = referUrgency;
    }

    reviewMutation.mutate({ id, data }, {
      onSuccess: () => {
        setApproveOpen(false);
        setRejectOpen(false);
        setReferOpen(false);
        setMoreInfoOpen(false);
      },
    } as any);
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
        headers: authHeaders({ "Content-Type": "application/json" }),
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
                  
                  {(() => {
                    const photos = ((consultation as { photoUrls?: string[] }).photoUrls ?? []).filter(Boolean);
                    if (!consultation.hasPhoto && photos.length === 0) return null;
                    return (
                      <div className="p-6 md:p-8 bg-blue-50/30" data-testid="section-patient-photos">
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                          <div className="md:w-1/3 shrink-0">
                            <p className="font-semibold text-secondary/80 text-sm flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Patient Uploaded Photos
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{photos.length} photo{photos.length === 1 ? "" : "s"} attached</p>
                          </div>
                          <div className="md:w-2/3">
                            {photos.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic">No photos uploaded.</p>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {photos.map((url, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setLightboxUrl(url)}
                                    className="aspect-square bg-muted/50 rounded-xl border border-border overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all"
                                    data-testid={`button-photo-${i}`}
                                    aria-label={`View photo ${i + 1}`}
                                  >
                                    <img src={url} alt={`Patient photo ${i + 1}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
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
                  <div className="space-y-3 pt-2">
                    {/* Approve */}
                    <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-14 text-base font-bold shadow-md hover:shadow-lg transition-all" size="lg">
                          <CheckCircle2 className="w-5 h-5 mr-2" /> Approve & Prescribe
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[520px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-secondary">Issue Prescription</DialogTitle>
                          <DialogDescription className="text-base">
                            Write the prescription details for <span className="font-bold text-secondary">{consultation.patientName}</span>.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="prescription" className="font-bold text-secondary">Prescription Details</Label>
                            <Textarea
                              id="prescription"
                              value={prescriptionDetails}
                              onChange={(e) => setPrescriptionDetails(e.target.value)}
                              placeholder="e.g. Amoxicillin 500mg capsules. 1 capsule three times a day for 5 days. Quantity: 15."
                              className="min-h-[140px] font-mono text-sm rounded-xl focus-visible:ring-green-500/30"
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

                    {/* More Info */}
                    <Dialog open={moreInfoOpen} onOpenChange={setMoreInfoOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl h-12 font-bold">
                          <MessageSquare className="w-5 h-5 mr-2" /> Request More Info
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[520px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-secondary flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-blue-600" /> Request More Information
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Send a message to <span className="font-bold text-secondary">{consultation.patientName}</span>. They'll be notified and can reply directly.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              "Please upload a clearer photo of the affected area.",
                              "Could you confirm your current medications?",
                              "What is your usual blood pressure reading?",
                              "Have you tried any over-the-counter remedies already?",
                            ].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setMoreInfoMessage(prev => prev ? `${prev}\n${t}` : t)}
                                className="text-left text-xs px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                              >
                                + {t}
                              </button>
                            ))}
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold text-secondary">Message to Patient</Label>
                            <Textarea
                              value={moreInfoMessage}
                              onChange={(e) => setMoreInfoMessage(e.target.value)}
                              placeholder="What additional information do you need?"
                              className="min-h-[140px] rounded-xl focus-visible:ring-blue-500/30"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">This message will be added to the patient's conversation thread and they'll receive a notification.</p>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleReview('more_info')}
                            disabled={!moreInfoMessage.trim() || reviewMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-12 font-bold"
                          >
                            Send & Pause for Response
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Refer */}
                    <Dialog open={referOpen} onOpenChange={setReferOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl h-12 font-bold">
                          <ExternalLink className="w-5 h-5 mr-2" /> Refer to Healthcare Professional
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[560px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-purple-700 flex items-center gap-2">
                            <ExternalLink className="w-6 h-6" /> Refer for Further Care
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Refer <span className="font-bold text-secondary">{consultation.patientName}</span> to another healthcare professional.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label className="font-bold text-secondary">Refer to</Label>
                            <select
                              value={referRecipientType}
                              onChange={(e) => setReferRecipientType(e.target.value)}
                              className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                            >
                              <option value="gp">GP / regular prescriber</option>
                              <option value="hospital_specialist">Hospital specialist</option>
                              <option value="ae">A&E (Accident & Emergency)</option>
                              <option value="nhs_111">NHS 111</option>
                              <option value="sexual_health_clinic">Sexual health clinic</option>
                              <option value="mental_health">Mental health services</option>
                              <option value="other">Other specialist</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="font-bold text-secondary">Recipient name / clinic</Label>
                              <input
                                value={referRecipientName}
                                onChange={(e) => setReferRecipientName(e.target.value)}
                                placeholder="e.g. Dr Patel, Hilltop Surgery"
                                className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-bold text-secondary">Urgency</Label>
                              <select
                                value={referUrgency}
                                onChange={(e) => setReferUrgency(e.target.value)}
                                className="w-full h-11 px-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                              >
                                <option value="routine">Routine</option>
                                <option value="soon">Within 7 days</option>
                                <option value="urgent">Urgent (within 24h)</option>
                                <option value="emergency">Emergency — call 999/111</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold text-secondary">Note to patient</Label>
                            <Textarea
                              value={referNote}
                              onChange={(e) => setReferNote(e.target.value)}
                              placeholder="Explain why you're referring and what the patient should do next."
                              className="min-h-[100px] rounded-xl focus-visible:ring-purple-500/30"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleReview('refer')}
                            disabled={!referRecipientName.trim() || reviewMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 h-12 font-bold"
                          >
                            Confirm Referral
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Reject */}
                    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl h-12 font-bold mt-4">
                          <XCircle className="w-5 h-5 mr-2" /> Reject Consultation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[520px] rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-serif text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6"/> Reject Consultation
                          </DialogTitle>
                          <DialogDescription className="text-base">
                            Choose a reason and explain to the patient. They'll be notified and can reply.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label className="font-bold text-secondary">Reason</Label>
                            <div className="grid grid-cols-1 gap-2">
                              {[
                                { v: "medically_unsuitable", label: "Medically unsuitable for this treatment" },
                                { v: "outside_our_scope", label: "Outside the scope of our online service" },
                                { v: "insufficient_information", label: "Insufficient information provided" },
                                { v: "already_prescribed", label: "Already prescribed elsewhere" },
                                { v: "other", label: "Other reason" },
                              ].map(o => (
                                <label key={o.v} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                                  rejectReason === o.v
                                    ? "border-red-300 bg-red-50"
                                    : "border-border hover:border-red-200 hover:bg-red-50/50"
                                }`}>
                                  <input
                                    type="radio"
                                    name="reject_reason"
                                    value={o.v}
                                    checked={rejectReason === o.v}
                                    onChange={() => setRejectReason(o.v)}
                                    className="accent-red-600"
                                  />
                                  <span className="text-sm font-medium text-secondary">{o.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-bold text-secondary">Explanation to patient</Label>
                            <Textarea
                              value={rejectExplanation}
                              onChange={(e) => setRejectExplanation(e.target.value)}
                              placeholder="Be clear and supportive. Explain why and what the patient should do next."
                              className="min-h-[120px] rounded-xl focus-visible:ring-red-500/30"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => handleReview('reject')}
                            disabled={!rejectReason || !rejectExplanation.trim() || reviewMutation.isPending}
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

          {/* ── Consultation notes (timeline tied to THIS consultation) ── */}
          <Card className="border-none shadow-md rounded-2xl overflow-hidden" data-testid="card-consultation-notes">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg font-bold text-secondary flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-primary" />
                Consultation notes
              </CardTitle>
              <CardDescription className="text-xs">
                Notes for <span className="font-semibold">this consultation only</span>. Use for follow-up observations, dose adjustments, or anything specific to this episode.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newConsultationNote}
                  onChange={(e) => setNewConsultationNote(e.target.value)}
                  placeholder="Add a note for this consultation…"
                  rows={3}
                  className="rounded-xl"
                  data-testid="textarea-consultation-note"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddConsultationNote}
                    disabled={!newConsultationNote.trim() || savingConsultationNote}
                    className="rounded-full bg-primary"
                    data-testid="button-add-consultation-note"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {savingConsultationNote ? "Saving…" : "Add note"}
                  </Button>
                </div>
              </div>

              {loadingConsultationNotes ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              ) : consultationNotes.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No consultation notes yet.
                </div>
              ) : (
                <ul className="space-y-2.5" data-testid="list-consultation-notes">
                  {consultationNotes.map((n) => {
                    const isEditing = editingConsultNoteId === n.id;
                    const isOwn = n.createdBy === pharmacistName;
                    const wasEdited = n.updatedAt && n.updatedAt !== n.createdAt;
                    return (
                      <li key={n.id} className="rounded-xl border border-border bg-white p-3" data-testid={`consultation-note-${n.id}`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="font-semibold text-secondary text-sm truncate">{n.createdBy}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {format(new Date(n.createdAt), "PPp")}
                              {wasEdited && (
                                <span className="ml-1 italic">· edited{n.updatedBy ? ` by ${n.updatedBy}` : ""}</span>
                              )}
                            </div>
                          </div>
                          {!isEditing && isOwn && (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => { setEditingConsultNoteId(n.id); setEditingConsultNoteText(n.note); }}
                                data-testid={`button-edit-consultation-note-${n.id}`}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteConsultationNote(n.id)}
                                data-testid={`button-delete-consultation-note-${n.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingConsultNoteText}
                              onChange={(e) => setEditingConsultNoteText(e.target.value)}
                              rows={3}
                              className="rounded-xl text-sm"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" className="rounded-full h-7"
                                onClick={() => { setEditingConsultNoteId(null); setEditingConsultNoteText(""); }}>
                                <XIcon className="w-3 h-3 mr-1" /> Cancel
                              </Button>
                              <Button size="sm" className="rounded-full h-7 bg-primary"
                                onClick={handleSaveConsultationNoteEdit} disabled={savingConsultationNote}>
                                <Save className="w-3 h-3 mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">{n.note}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-2xl overflow-hidden" data-testid="card-shared-notes">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold text-secondary flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-primary" />
                Shared patient notes
              </CardTitle>
              <CardDescription className="text-xs">
                Notes about the <span className="font-semibold">patient</span> across all their consultations. Visible to every prescriber.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newPatientNote}
                  onChange={(e) => setNewPatientNote(e.target.value)}
                  placeholder="Add a note for other prescribers about this patient…"
                  rows={3}
                  className="rounded-xl"
                  data-testid="textarea-shared-note"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddPatientNote}
                    disabled={!newPatientNote.trim() || savingPatientNote}
                    className="rounded-full bg-primary"
                    data-testid="button-add-shared-note"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {savingPatientNote ? "Saving…" : "Add note"}
                  </Button>
                </div>
              </div>

              {loadingPatientNotes ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              ) : patientNotes.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No shared notes yet for this patient.
                </div>
              ) : (
                <ul className="space-y-2.5" data-testid="list-shared-notes">
                  {patientNotes.map((n) => {
                    const isEditing = editingNoteId === n.id;
                    const isOwn = n.createdBy === pharmacistName;
                    const wasEdited = n.updatedAt && n.updatedAt !== n.createdAt;
                    return (
                      <li
                        key={n.id}
                        className="rounded-xl border border-border bg-white p-3"
                        data-testid={`shared-note-${n.id}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="font-semibold text-secondary text-sm truncate">
                              {n.createdBy}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {format(new Date(n.createdAt), "PPp")}
                              {wasEdited && (
                                <span className="ml-1 italic">
                                  · edited{n.updatedBy ? ` by ${n.updatedBy}` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isEditing && isOwn && (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingNoteId(n.id);
                                  setEditingNoteText(n.note);
                                }}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-600 hover:text-red-700"
                                onClick={() => handleDeletePatientNote(n.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              rows={3}
                              className="rounded-xl text-sm"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full h-7"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingNoteText("");
                                }}
                              >
                                <XIcon className="w-3 h-3 mr-1" /> Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-full h-7 bg-primary"
                                disabled={!editingNoteText.trim() || savingPatientNote}
                                onClick={handleSavePatientNoteEdit}
                              >
                                <Save className="w-3 h-3 mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-secondary whitespace-pre-wrap leading-relaxed">
                            {n.note}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {(consultation as { patientEmail?: string } | undefined)?.patientEmail && (
                <Link
                  href={`/dashboard/patients/${encodeURIComponent(
                    (consultation as { patientEmail?: string }).patientEmail!,
                  )}`}
                >
                  <a
                    className="block text-xs font-semibold text-primary hover:underline text-center pt-1"
                    data-testid="link-open-patient-profile"
                  >
                    Open full patient profile →
                  </a>
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Photo lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(open) => { if (!open) setLightboxUrl(null); }}>
        <DialogContent className="max-w-4xl bg-black/95 border-none p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Patient photo</DialogTitle>
            <DialogDescription>Full-size view of patient-uploaded photo.</DialogDescription>
          </DialogHeader>
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Patient photo" className="w-full max-h-[85vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

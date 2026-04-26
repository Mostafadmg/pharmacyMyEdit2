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
  Pill
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-sm py-1">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-sm py-1">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-sm py-1">Rejected</Badge>;
      case "more_info_needed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-sm py-1">More Info Needed</Badge>;
      case "referred":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200 text-sm py-1">Referred</Badge>;
      case "red_flag":
        return <Badge variant="destructive" className="text-sm py-1">Urgent Review</Badge>;
      default:
        return <Badge variant="outline" className="text-sm py-1">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary mb-4">Consultation not found</h2>
          <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const isPending = consultation.status === "pending" || consultation.status === "red_flag";

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <header className="bg-secondary text-white py-4 px-6 border-b border-secondary/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Queue
          </Link>
          <div className="text-sm font-medium">
            Consultation ID: <span className="font-mono bg-white/10 px-2 py-1 rounded ml-1">{consultation.id}</span>
          </div>
        </div>
      </header>

      {consultation.hasRedFlag && isPending && (
        <div className="bg-destructive text-destructive-foreground py-3 px-6 shadow-md relative z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 font-medium">
            <AlertTriangle className="w-5 h-5" />
            Warning: This consultation contains red flags. Please review the patient's medical history carefully.
          </div>
        </div>
      )}

      <main className="p-6 md:p-8 max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="xl:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">{consultation.conditionName}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> Submitted {format(new Date(consultation.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
            <div>
              {getStatusBadge(consultation.status)}
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-secondary">
                <User className="w-5 h-5 text-primary" />
                Patient Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
                <p className="font-medium text-lg text-secondary">{consultation.patientName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                <p className="font-medium text-secondary">{consultation.patientEmail}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Demographics</Label>
                <p className="font-medium text-secondary">{consultation.patientAge} years old • {consultation.patientSex.charAt(0).toUpperCase() + consultation.patientSex.slice(1)}</p>
              </div>
              
              <div className="md:col-span-2 pt-4 border-t border-border mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider text-destructive font-bold flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3 h-3" /> Allergies
                  </Label>
                  <p className="font-medium text-secondary">{(consultation.answers as any).allergies || "None reported"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider text-amber-600 font-bold flex items-center gap-1 mb-1">
                    <Pill className="w-3 h-3" /> Current Medications
                  </Label>
                  <p className="font-medium text-secondary">{(consultation.answers as any).currentMedications || "None reported"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-secondary">
                <Activity className="w-5 h-5 text-primary" />
                Medical Questionnaire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {Object.entries(consultation.answers).map(([key, value]) => {
                  // Skip standard fields we already showed
                  if (['allergies', 'currentMedications', 'medicalHistory'].includes(key)) return null;
                  
                  return (
                    <div key={key} className="p-6">
                      <p className="font-medium text-secondary mb-2">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                      <p className="text-muted-foreground">{String(value)}</p>
                    </div>
                  );
                })}
                
                {consultation.hasPhoto && (
                  <div className="p-6 bg-blue-50/50">
                    <p className="font-medium text-secondary mb-3 flex items-center gap-2">
                      Patient Uploaded Photos
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {/* Placeholder for actual photos */}
                      <div className="aspect-square bg-muted rounded-lg border border-border flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                        <FileText className="w-6 h-6" />
                        Photo 1
                      </div>
                      <div className="aspect-square bg-muted rounded-lg border border-border flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                        <FileText className="w-6 h-6" />
                        Photo 2
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className={`border-2 ${isPending ? 'border-primary' : 'border-border'} shadow-md sticky top-24`}>
            <CardHeader className={isPending ? 'bg-primary/5' : 'bg-muted/20'}>
              <CardTitle className="text-xl text-secondary">Pharmacist Decision</CardTitle>
              <CardDescription>Review answers and determine the appropriate action.</CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {!isPending ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Decision Made</Label>
                    <div className="mb-4">{getStatusBadge(consultation.status)}</div>
                    
                    {consultation.pharmacistNote && (
                      <>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block mt-4">Clinical Notes</Label>
                        <p className="text-sm text-secondary p-3 bg-white rounded border border-border">{consultation.pharmacistNote}</p>
                      </>
                    )}
                    
                    {consultation.prescription && (
                      <>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block mt-4">Prescription</Label>
                        <p className="text-sm text-secondary p-3 bg-white rounded border border-border font-mono">{consultation.prescription}</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="clinical-notes">Clinical Notes (Internal)</Label>
                    <Textarea 
                      id="clinical-notes"
                      placeholder="Add your clinical reasoning here..." 
                      className="min-h-[100px] resize-none"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve & Prescribe
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Issue Prescription</DialogTitle>
                          <DialogDescription>
                            Write the prescription details for {consultation.patientName}. This will be sent to the pharmacy for fulfillment.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="prescription">Prescription Details (Drug, Strength, Dosage, Quantity)</Label>
                            <Textarea 
                              id="prescription" 
                              value={prescriptionDetails}
                              onChange={(e) => setPrescriptionDetails(e.target.value)}
                              placeholder="e.g. Amoxicillin 500mg capsules. 1 capsule three times a day for 5 days. Quantity: 15."
                              className="min-h-[120px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => handleReview('approve')} 
                            disabled={!prescriptionDetails || reviewMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {reviewMutation.isPending ? "Processing..." : "Confirm Approval"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                          <MessageSquare className="w-4 h-4 mr-2" /> Request More Info
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Information</DialogTitle>
                          <DialogDescription>
                            What additional information do you need from the patient before making a decision?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Message to Patient</Label>
                            <Textarea 
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="e.g. Please upload a clearer photo of the rash..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => handleReview('more_info')} 
                            disabled={!reviewNote || reviewMutation.isPending}
                          >
                            Send Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                          <ExternalLink className="w-4 h-4 mr-2" /> Refer to GP/Urgent Care
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Refer Patient</DialogTitle>
                          <DialogDescription>
                            Provide instructions for the patient to seek alternative care.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Referral Instructions</Label>
                            <Textarea 
                              value={referralDetails}
                              onChange={(e) => setReferralDetails(e.target.value)}
                              placeholder="e.g. Your symptoms require physical examination. Please contact your GP within 48 hours..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => handleReview('refer')} 
                            disabled={!referralDetails || reviewMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Confirm Referral
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
                          <XCircle className="w-4 h-4 mr-2" /> Reject Consultation
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Consultation</DialogTitle>
                          <DialogDescription>
                            Please provide a reason for rejecting this consultation. The patient will be notified.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Rejection Reason</Label>
                            <Textarea 
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="e.g. This treatment is not suitable for your specific medical history..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="destructive"
                            onClick={() => handleReview('reject')} 
                            disabled={!reviewNote || reviewMutation.isPending}
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
        </div>
      </main>
    </div>
  );
}

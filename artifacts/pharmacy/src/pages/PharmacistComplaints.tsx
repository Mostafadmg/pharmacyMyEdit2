import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import PharmacistLayout from "@/components/layout/PharmacistLayout";

type Complaint = {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  acknowledgmentSentAt: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-amber-100 text-amber-800" },
  acknowledged: { label: "Acknowledged", cls: "bg-blue-100 text-blue-800" },
  investigating: { label: "Investigating", cls: "bg-indigo-100 text-indigo-800" },
  resolved: { label: "Resolved", cls: "bg-emerald-100 text-emerald-800" },
  escalated: { label: "Escalated", cls: "bg-red-100 text-red-800" },
};

const CATEGORY_LABELS: Record<string, string> = {
  service: "Service quality",
  clinical: "Clinical concern",
  delivery: "Delivery issue",
  billing: "Billing / payment",
  privacy: "Privacy / data",
  other: "Other",
};

export default function PharmacistComplaints() {
  const [_, setLocation] = useLocation();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const base = (import.meta as any).env?.BASE_URL?.replace(/\/$/, "") || "";
  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("pharmacist_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? `${base}/api/compliance/complaints`
          : `${base}/api/compliance/complaints?status=${statusFilter}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 401) {
        toast.error("Session expired. Please sign in again.");
        setLocation("/dashboard/login");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setComplaints(data.complaints || data);
    } catch (e) {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleUpdate = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/api/compliance/complaints/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          status: updateStatus || selected.status,
          responseNote: resolution || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Complaint updated");
      setSelected(null);
      setResolution("");
      setUpdateStatus("");
      load();
    } catch {
      toast.error("Failed to update complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = complaints.filter((c) => c.status === "open").length;

  return (
    <PharmacistLayout current="complaints">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-secondary tracking-tight">
            Patient Complaints
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Acknowledge within 3 working days and resolve within 28 days per GPhC complaints policy.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={load}
          className="bg-white border-border text-secondary rounded-full shadow-sm"
          data-testid="button-refresh-complaints"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Open</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{openCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Total</p>
              <p className="text-3xl font-bold text-secondary mt-1">{complaints.length}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-sm md:col-span-2">
            <CardContent className="p-5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">
                Filter by status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : complaints.length === 0 ? (
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-secondary">No complaints found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter === "all"
                  ? "There are currently no patient complaints on file."
                  : `No complaints with status "${statusFilter}".`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const statusInfo = STATUS_LABELS[complaint.status] || {
                label: complaint.status,
                cls: "bg-slate-100 text-slate-800",
              };
              const ageDays = Math.floor(
                (Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24),
              );
              const overdue = complaint.status === "open" && ageDays > 3;
              return (
                <Card
                  key={complaint.id}
                  className={`rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    overdue ? "ring-2 ring-red-300" : ""
                  }`}
                  onClick={() => {
                    setSelected(complaint);
                    setUpdateStatus(complaint.status);
                    setResolution(complaint.resolution || "");
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className={`${statusInfo.cls} border-none`}>{statusInfo.label}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[complaint.category] || complaint.category}
                          </Badge>
                          {overdue && (
                            <Badge className="bg-red-100 text-red-800 border-none text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Overdue ({ageDays}d)
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-secondary">{complaint.subject}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {complaint.description}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {format(new Date(complaint.createdAt), "d MMM yyyy")}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-3">
                      <span className="font-medium text-secondary">{complaint.patientName}</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {complaint.patientEmail}
                      </span>
                      {complaint.patientPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {complaint.patientPhone}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {selected.subject}
                </DialogTitle>
                <DialogDescription>
                  From {selected.patientName} · {selected.patientEmail}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="bg-muted/30 rounded-xl p-4">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2 block">
                    Patient's complaint
                  </Label>
                  <p className="text-sm text-secondary whitespace-pre-wrap">{selected.description}</p>
                </div>

                <div>
                  <Label className="font-semibold mb-2 block">Status</Label>
                  <Select value={updateStatus} onValueChange={setUpdateStatus}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold mb-2 block">Resolution / Response notes</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Document the steps taken, communication with the patient, and the outcome."
                    rows={5}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)} className="rounded-full">
                  Close
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="rounded-full bg-primary"
                >
                  {submitting ? "Saving…" : "Save update"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PharmacistLayout>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Mail,
  User,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  StickyNote,
  Plus,
  Pencil,
  Trash2,
  Save,
  X as XIcon,
  ExternalLink,
  Stethoscope,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PharmacistLayout from "@/components/layout/PharmacistLayout";

interface Consultation {
  id: string;
  patientName: string;
  patientEmail: string;
  patientAge: number;
  patientSex: string;
  conditionId: string;
  conditionName: string;
  status: string;
  hasRedFlag: boolean;
  riskCategory?: string | null;
  prescription?: string | null;
  pharmacistNote?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

interface PatientNote {
  id: string;
  patientEmail: string;
  note: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending review",
    cls: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  red_flag: {
    label: "Red flag",
    cls: "bg-red-100 text-red-800 border-red-200",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  approved: {
    label: "Approved",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Rejected",
    cls: "bg-rose-100 text-rose-800 border-rose-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  referred: {
    label: "Referred to GP",
    cls: "bg-sky-100 text-sky-800 border-sky-200",
    icon: <Stethoscope className="w-3.5 h-3.5" />,
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export default function PharmacistPatientDetail() {
  const [, params] = useRoute<{ email: string }>("/dashboard/patients/:email");
  const email = params?.email ? decodeURIComponent(params.email) : "";

  const pharmacistName =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("pharmacist_name") ?? "Pharmacist"
      : "Pharmacist";

  function authHeaders(extra?: Record<string, string>) {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("pharmacist_token") : null;
    return {
      ...(extra ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    (async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch(`/api/consultations/patient/${encodeURIComponent(email)}`, {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (!cancelled) setConsultations(json.consultations ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load patient orders");
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();
    (async () => {
      setLoadingNotes(true);
      try {
        const res = await fetch(`/api/patient-notes/${encodeURIComponent(email)}`, {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (!cancelled) setNotes(json.notes ?? []);
      } catch {
        if (!cancelled) toast.error("Failed to load patient notes");
      } finally {
        if (!cancelled) setLoadingNotes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const patientHeader = useMemo(() => {
    if (consultations.length === 0) return null;
    const latest = consultations[0];
    return {
      name: latest.patientName,
      age: latest.patientAge,
      sex: latest.patientSex,
      email: latest.patientEmail,
    };
  }, [consultations]);

  const stats = useMemo(() => {
    const total = consultations.length;
    const pending = consultations.filter((c) => c.status === "pending").length;
    const approved = consultations.filter((c) => c.status === "approved").length;
    const redFlags = consultations.filter((c) => c.hasRedFlag || c.status === "red_flag").length;
    return { total, pending, approved, redFlags };
  }, [consultations]);

  async function handleAddNote() {
    const text = newNote.trim();
    if (!text) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/patient-notes`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ patientEmail: email, note: text }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setNotes((prev) => [json.note, ...prev]);
      setNewNote("");
      toast.success("Note added — visible to all prescribers");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingId || !editText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/patient-notes/${editingId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === editingId ? json.note : n)));
      setEditingId(null);
      setEditText("");
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update note");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/patient-notes/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed");
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note removed");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  return (
    <PharmacistLayout current="patients">
      <div>
        <Link href="/dashboard/patients">
          <a
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary"
            data-testid="link-back-to-patients"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all patients
          </a>
        </Link>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
              {patientHeader ? getInitials(patientHeader.name) : <User className="w-7 h-7" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl md:text-3xl font-serif font-bold text-secondary tracking-tight truncate"
                data-testid="text-patient-name"
              >
                {patientHeader?.name ?? email}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {email}
                </span>
                {patientHeader && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {patientHeader.age} yrs · {patientHeader.sex}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
              <MiniStat label="Orders" value={stats.total} tone="text-secondary" />
              <MiniStat label="Pending" value={stats.pending} tone="text-amber-600" />
              <MiniStat label="Approved" value={stats.approved} tone="text-emerald-600" />
              <MiniStat label="Red flags" value={stats.redFlags} tone="text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Orders & consultations
              </h2>
              <Badge variant="outline" className="font-semibold">
                {stats.total}
              </Badge>
            </div>

            {loadingOrders ? (
              <div className="space-y-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-10">
                <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-secondary font-medium">No consultations yet</p>
                <p className="text-sm text-muted-foreground">
                  Patient orders will appear here once submitted.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" data-testid="list-orders">
                {consultations.map((c) => {
                  const style =
                    STATUS_STYLES[c.status] ??
                    {
                      label: c.status,
                      cls: "bg-muted text-secondary border-border",
                      icon: <Activity className="w-3.5 h-3.5" />,
                    };
                  return (
                    <li key={c.id} data-testid={`row-order-${c.id}`}>
                      <Link href={`/dashboard/consultation/${c.id}`}>
                        <a className="block group">
                          <div className="rounded-xl border border-border bg-white hover:border-primary/40 hover:shadow-sm transition p-4 flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-secondary truncate">
                                  {c.conditionName}
                                </span>
                                <Badge
                                  className={`${style.cls} border font-semibold inline-flex items-center gap-1`}
                                >
                                  {style.icon} {style.label}
                                </Badge>
                                {c.hasRedFlag && c.status !== "red_flag" && (
                                  <Badge className="bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1 font-semibold">
                                    <AlertTriangle className="w-3 h-3" /> red flag
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Submitted {format(new Date(c.createdAt), "PPp")}
                                </span>
                                {c.reviewedAt && (
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Reviewed {formatDistanceToNow(new Date(c.reviewedAt), { addSuffix: true })}
                                    {c.reviewedBy ? ` · ${c.reviewedBy}` : ""}
                                  </span>
                                )}
                              </div>
                              {c.prescription && (
                                <p className="text-xs text-secondary/80 mt-1.5 line-clamp-1">
                                  Rx: {c.prescription}
                                </p>
                              )}
                            </div>
                            <div className="text-primary text-sm font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Open <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" /> Prescriber notes
              </h2>
              <Badge variant="outline" className="font-semibold">
                {notes.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Shared with all prescribers across web and mobile. Each entry shows who wrote it and when.
            </p>

            <div className="space-y-2 mb-5">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note for other prescribers about this patient…"
                rows={3}
                className="rounded-xl"
                data-testid="textarea-new-note"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || savingNote}
                  className="rounded-full bg-primary"
                  data-testid="button-add-note"
                >
                  <Plus className="w-4 h-4 mr-1" /> {savingNote ? "Saving…" : "Add note"}
                </Button>
              </div>
            </div>

            {loadingNotes ? (
              <div className="space-y-2">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                No notes yet. Add the first one above.
              </div>
            ) : (
              <ul className="space-y-3" data-testid="list-notes">
                {notes.map((n) => {
                  const isEditing = editingId === n.id;
                  const isOwn = n.createdBy === pharmacistName;
                  const wasEdited = n.updatedAt && n.updatedAt !== n.createdAt;
                  return (
                    <li
                      key={n.id}
                      className="rounded-xl border border-border bg-white p-4"
                      data-testid={`note-${n.id}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-secondary text-sm truncate">
                            {n.createdBy}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(n.createdAt), "PPp")}
                            {wasEdited && (
                              <span className="ml-1 italic">
                                · edited {formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}
                                {n.updatedBy ? ` by ${n.updatedBy}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isEditing && isOwn && (
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingId(n.id);
                                setEditText(n.note);
                              }}
                              data-testid={`button-edit-note-${n.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(n.id)}
                              data-testid={`button-delete-note-${n.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="rounded-xl"
                            data-testid={`textarea-edit-${n.id}`}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => {
                                setEditingId(null);
                                setEditText("");
                              }}
                            >
                              <XIcon className="w-3.5 h-3.5 mr-1" /> Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="rounded-full bg-primary"
                              disabled={!editText.trim() || savingNote}
                              onClick={handleSaveEdit}
                            >
                              <Save className="w-3.5 h-3.5 mr-1" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                          {n.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PharmacistLayout>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

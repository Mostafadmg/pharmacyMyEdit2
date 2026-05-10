import React, { useState, useEffect, useCallback } from "react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StickyNote, Search, Plus, Pencil, Trash2, Save, X as XIcon, User, FileText } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type PatientNote = {
  id: string;
  patientEmail: string;
  note: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type ConsultationNote = {
  id: string;
  consultationId: string;
  note: string;
  createdBy: string;
  createdById: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  patientName: string | null;
  patientEmail: string | null;
  conditionName: string | null;
};

type Tab = "patient" | "consultation";

const authHeaders = (extra?: Record<string, string>): Record<string, string> => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("pharmacist_token") : null;
  return { ...(extra ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const pharmacistName =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("pharmacist_name") ?? "Pharmacist"
    : "Pharmacist";

export default function PharmacistNotes() {
  const [tab, setTab] = useState<Tab>("patient");
  const [search, setSearch] = useState("");

  // Patient notes state
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [patientLoading, setPatientLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingPatientText, setEditingPatientText] = useState("");
  const [savingPatientEdit, setSavingPatientEdit] = useState(false);

  // Consultation notes state
  const [consultNotes, setConsultNotes] = useState<ConsultationNote[]>([]);
  const [consultLoading, setConsultLoading] = useState(true);
  const [editingConsultId, setEditingConsultId] = useState<string | null>(null);
  const [editingConsultText, setEditingConsultText] = useState("");
  const [savingConsultEdit, setSavingConsultEdit] = useState(false);

  const loadPatientNotes = useCallback(async () => {
    setPatientLoading(true);
    try {
      const res = await fetch("/api/patient-notes", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setPatientNotes(json.notes ?? []);
    } catch {
      toast.error("Could not load patient notes");
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const loadConsultNotes = useCallback(async () => {
    setConsultLoading(true);
    try {
      const res = await fetch("/api/consultation-notes", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setConsultNotes(json.notes ?? []);
    } catch {
      toast.error("Could not load consultation notes");
    } finally {
      setConsultLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatientNotes();
    loadConsultNotes();
  }, [loadPatientNotes, loadConsultNotes]);

  // Patient notes handlers
  async function handleAddPatientNote() {
    if (!newEmail.trim() || !newText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/patient-notes", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ patientEmail: newEmail.trim(), note: newText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setPatientNotes((prev) => [json.note, ...prev]);
      setNewEmail("");
      setNewText("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePatientEdit() {
    if (!editingPatientId || !editingPatientText.trim()) return;
    setSavingPatientEdit(true);
    try {
      const res = await fetch(`/api/patient-notes/${editingPatientId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editingPatientText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setPatientNotes((prev) => prev.map((n) => (n.id === editingPatientId ? json.note : n)));
      setEditingPatientId(null);
      setEditingPatientText("");
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingPatientEdit(false);
    }
  }

  async function handleDeletePatientNote(id: string) {
    if (!confirm("Delete this note?")) return;
    try {
      const res = await fetch(`/api/patient-notes/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      setPatientNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  // Consultation notes handlers
  async function handleSaveConsultEdit() {
    if (!editingConsultId || !editingConsultText.trim()) return;
    setSavingConsultEdit(true);
    try {
      const res = await fetch(`/api/consultation-notes/${editingConsultId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editingConsultText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setConsultNotes((prev) => prev.map((n) => (n.id === editingConsultId ? { ...n, ...json.note } : n)));
      setEditingConsultId(null);
      setEditingConsultText("");
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingConsultEdit(false);
    }
  }

  async function handleDeleteConsultNote(id: string) {
    if (!confirm("Delete this consultation note?")) return;
    try {
      const res = await fetch(`/api/consultation-notes/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      setConsultNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  // Filtered views
  const filteredPatient = search.trim()
    ? patientNotes.filter(
        (n) =>
          n.patientEmail.toLowerCase().includes(search.toLowerCase()) ||
          n.note.toLowerCase().includes(search.toLowerCase()) ||
          n.createdBy.toLowerCase().includes(search.toLowerCase()),
      )
    : patientNotes;

  const groupedPatient = filteredPatient.reduce<Record<string, PatientNote[]>>((acc, n) => {
    (acc[n.patientEmail] ??= []).push(n);
    return acc;
  }, {});

  const filteredConsult = search.trim()
    ? consultNotes.filter(
        (n) =>
          (n.patientEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (n.patientName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (n.conditionName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          n.note.toLowerCase().includes(search.toLowerCase()) ||
          n.createdBy.toLowerCase().includes(search.toLowerCase()),
      )
    : consultNotes;

  const groupedConsult = filteredConsult.reduce<Record<string, ConsultationNote[]>>((acc, n) => {
    const key = n.consultationId;
    (acc[key] ??= []).push(n);
    return acc;
  }, {});

  const totalPatient = patientNotes.length;
  const totalConsult = consultNotes.length;

  return (
    <PharmacistLayout current="notes">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <StickyNote className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-serif font-bold text-secondary">Clinical Notes</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            All pharmacist-authored notes across patients and consultations.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border pb-0">
          <button
            onClick={() => setTab("patient")}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === "patient"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-secondary"
            }`}
          >
            <User className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
            Patient notes
            <span className="ml-1.5 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {totalPatient}
            </span>
          </button>
          <button
            onClick={() => setTab("consultation")}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === "consultation"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-secondary"
            }`}
          >
            <FileText className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
            Consultation notes
            <span className="ml-1.5 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {totalConsult}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === "patient"
                ? "Search by patient email or note content…"
                : "Search by patient, condition or note content…"
            }
            className="pl-9 rounded-xl h-11"
            data-testid="input-notes-search"
          />
        </div>

        {/* ── Patient notes tab ── */}
        {tab === "patient" && (
          <>
            <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
              <h2 className="font-bold text-secondary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add patient note
              </h2>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Patient email address"
                className="rounded-xl h-11"
                data-testid="input-note-email"
              />
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Write your clinical note… visible to all prescribers"
                rows={3}
                className="rounded-xl"
                data-testid="textarea-new-note"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddPatientNote}
                  disabled={!newEmail.trim() || !newText.trim() || saving}
                  className="rounded-full bg-primary px-6"
                  data-testid="button-add-note"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {saving ? "Saving…" : "Add note"}
                </Button>
              </div>
            </div>

            {patientLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : Object.keys(groupedPatient).length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-border">
                <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-secondary mb-1">No patient notes found</p>
                <p className="text-sm text-muted-foreground">
                  {search ? "Try a different search term" : "Add a note using the form above"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPatient).map(([email, pNotes]) => (
                  <div key={email} className="bg-white rounded-2xl border border-border overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 bg-muted/30 border-b border-border">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-secondary text-sm">{email}</span>
                      <Badge className="text-[10px] ml-auto bg-primary/10 text-primary border-primary/20">
                        {pNotes.length} {pNotes.length === 1 ? "note" : "notes"}
                      </Badge>
                    </div>
                    <ul className="divide-y divide-border">
                      <AnimatePresence initial={false}>
                        {pNotes.map((n) => {
                          const isEditing = editingPatientId === n.id;
                          const isOwn = n.createdBy === pharmacistName;
                          const wasEdited = n.updatedAt && n.updatedAt !== n.createdAt;
                          return (
                            <motion.li
                              key={n.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="px-5 py-4"
                              data-testid={`note-${n.id}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div>
                                  <span className="font-semibold text-sm text-secondary">{n.createdBy}</span>
                                  <span className="text-[11px] text-muted-foreground ml-2">
                                    {format(new Date(n.createdAt), "PPp")}
                                    {wasEdited && (
                                      <span className="italic ml-1">
                                        · edited{n.updatedBy ? ` by ${n.updatedBy}` : ""}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {!isEditing && isOwn && (
                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setEditingPatientId(n.id);
                                        setEditingPatientText(n.note);
                                      }}
                                      data-testid={`button-edit-${n.id}`}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-600 hover:text-red-700"
                                      onClick={() => handleDeletePatientNote(n.id)}
                                      data-testid={`button-delete-${n.id}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editingPatientText}
                                    onChange={(e) => setEditingPatientText(e.target.value)}
                                    rows={3}
                                    className="rounded-xl text-sm"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full h-7"
                                      onClick={() => {
                                        setEditingPatientId(null);
                                        setEditingPatientText("");
                                      }}
                                    >
                                      <XIcon className="w-3 h-3 mr-1" /> Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="rounded-full h-7 bg-primary"
                                      onClick={handleSavePatientEdit}
                                      disabled={savingPatientEdit}
                                    >
                                      <Save className="w-3 h-3 mr-1" /> Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                                  {n.note}
                                </p>
                              )}
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Consultation notes tab ── */}
        {tab === "consultation" && (
          <>
            {consultLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : Object.keys(groupedConsult).length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-border">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-secondary mb-1">No consultation notes found</p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Try a different search term"
                    : "Notes added during consultation reviews appear here"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedConsult).map(([consultationId, cNotes]) => {
                  const first = cNotes[0]!;
                  return (
                    <div
                      key={consultationId}
                      className="bg-white rounded-2xl border border-border overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-5 py-3 bg-muted/30 border-b border-border">
                        <FileText className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-secondary text-sm">
                            {first.patientName ?? "Unknown patient"}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {first.conditionName ?? ""} · {first.patientEmail ?? ""}
                          </span>
                        </div>
                        <Link href={`/dashboard/consultation/${consultationId}`}>
                          <span className="text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0">
                            Open consult →
                          </span>
                        </Link>
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                          {cNotes.length} {cNotes.length === 1 ? "note" : "notes"}
                        </Badge>
                      </div>
                      <ul className="divide-y divide-border">
                        <AnimatePresence initial={false}>
                          {cNotes.map((n) => {
                            const isEditing = editingConsultId === n.id;
                            const isOwn = n.createdBy === pharmacistName;
                            const wasEdited = n.updatedAt && n.updatedAt !== n.createdAt;
                            return (
                              <motion.li
                                key={n.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="px-5 py-4"
                                data-testid={`consult-note-${n.id}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div>
                                    <span className="font-semibold text-sm text-secondary">{n.createdBy}</span>
                                    <span className="text-[11px] text-muted-foreground ml-2">
                                      {format(new Date(n.createdAt), "PPp")}
                                      {wasEdited && (
                                        <span className="italic ml-1">
                                          · edited{n.updatedBy ? ` by ${n.updatedBy}` : ""}{" "}
                                          {formatDistanceToNow(new Date(n.updatedAt), { addSuffix: true })}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  {!isEditing && isOwn && (
                                    <div className="flex gap-1 shrink-0">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => {
                                          setEditingConsultId(n.id);
                                          setEditingConsultText(n.note);
                                        }}
                                        data-testid={`button-edit-consult-${n.id}`}
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteConsultNote(n.id)}
                                        data-testid={`button-delete-consult-${n.id}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editingConsultText}
                                      onChange={(e) => setEditingConsultText(e.target.value)}
                                      rows={3}
                                      className="rounded-xl text-sm"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full h-7"
                                        onClick={() => {
                                          setEditingConsultId(null);
                                          setEditingConsultText("");
                                        }}
                                      >
                                        <XIcon className="w-3 h-3 mr-1" /> Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="rounded-full h-7 bg-primary"
                                        onClick={handleSaveConsultEdit}
                                        disabled={savingConsultEdit}
                                      >
                                        <Save className="w-3 h-3 mr-1" /> Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                                    {n.note}
                                  </p>
                                )}
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </PharmacistLayout>
  );
}

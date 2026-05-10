import React, { useState, useEffect, useCallback } from "react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StickyNote, Search, Plus, Pencil, Trash2, Save, X as XIcon, User } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type PatientNote = {
  id: string;
  patientEmail: string;
  note: string;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

const authHeaders = (extra?: Record<string, string>): Record<string, string> => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("pharmacist_token") : null;
  return { ...(extra ?? {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const pharmacistName =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("pharmacist_name") ?? "Pharmacist"
    : "Pharmacist";

export default function PharmacistNotes() {
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patient-notes", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setNotes(json.notes ?? []);
    } catch {
      toast.error("Could not load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = notes.reduce<Record<string, PatientNote[]>>((acc, n) => {
    (acc[n.patientEmail] ??= []).push(n);
    return acc;
  }, {});

  const filtered = search.trim()
    ? Object.fromEntries(
        Object.entries(grouped).filter(
          ([email, ns]) =>
            email.toLowerCase().includes(search.toLowerCase()) ||
            ns.some((n) => n.note.toLowerCase().includes(search.toLowerCase()) || n.createdBy.toLowerCase().includes(search.toLowerCase())),
        ),
      )
    : grouped;

  const totalCount = notes.length;
  const patientCount = Object.keys(grouped).length;

  async function handleAdd() {
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
      setNotes((prev) => [json.note, ...prev]);
      setNewEmail("");
      setNewText("");
      toast.success("Note added");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingId || !editingText.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/patient-notes/${editingId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ note: editingText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === editingId ? json.note : n)));
      setEditingId(null);
      setEditingText("");
      toast.success("Note updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    try {
      const res = await fetch(`/api/patient-notes/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <PharmacistLayout current="notes">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <StickyNote className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-serif font-bold text-secondary">Patient Notes</h1>
          </div>
          <p className="text-muted-foreground ml-10">
            Shared clinical notes visible to all prescribers across every consultation.{" "}
            <span className="font-semibold">{totalCount} notes</span> across{" "}
            <span className="font-semibold">{patientCount} patients</span>.
          </p>
        </motion.div>

        {/* Add note panel */}
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <h2 className="font-bold text-secondary text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add new note
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
              onClick={handleAdd}
              disabled={!newEmail.trim() || !newText.trim() || saving}
              className="rounded-full bg-primary px-6"
              data-testid="button-add-note"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Saving…" : "Add note"}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient email or note content…"
            className="pl-9 rounded-xl h-11"
            data-testid="input-notes-search"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : Object.keys(filtered).length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-border">
            <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-secondary mb-1">No notes found</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Try a different search term" : "Add a note using the form above"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(filtered).map(([email, patNotes]) => (
              <div key={email} className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 bg-muted/30 border-b border-border">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-secondary text-sm">{email}</span>
                  <Badge className="text-[10px] ml-auto bg-primary/10 text-primary border-primary/20">
                    {patNotes.length} {patNotes.length === 1 ? "note" : "notes"}
                  </Badge>
                </div>
                <ul className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {patNotes.map((n) => {
                      const isEditing = editingId === n.id;
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
                                  size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={() => { setEditingId(n.id); setEditingText(n.note); }}
                                  data-testid={`button-edit-${n.id}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon" variant="ghost"
                                  className="h-7 w-7 text-red-600 hover:text-red-700"
                                  onClick={() => handleDelete(n.id)}
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
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={3}
                                className="rounded-xl text-sm"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm" variant="outline" className="rounded-full h-7"
                                  onClick={() => { setEditingId(null); setEditingText(""); }}
                                >
                                  <XIcon className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                                <Button
                                  size="sm" className="rounded-full h-7 bg-primary"
                                  onClick={handleSaveEdit} disabled={savingEdit}
                                >
                                  <Save className="w-3 h-3 mr-1" /> Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-secondary whitespace-pre-wrap leading-relaxed">{n.note}</p>
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
      </div>
    </PharmacistLayout>
  );
}

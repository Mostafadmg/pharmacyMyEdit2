import React, { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, GripVertical, AlertTriangle, Save, ArrowUp, ArrowDown } from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type QType = "yes_no" | "single_choice" | "multi_choice" | "text" | "number";
type Question = {
  id: string;
  type: QType;
  prompt: string;
  helperText?: string;
  required: boolean;
  options?: string[];
  redFlagAnswers?: string[];
};
type Condition = {
  id: string; name: string; category: string; description: string;
  onlineEligible: boolean; requiresPhoto: boolean; requiresInPerson: boolean;
  ageRestrictions: string | null; redFlags: string[];
  priceGbp: number; active: boolean;
  questionsJson: Question[] | null;
};

const QTYPE_LABELS: Record<QType, string> = {
  yes_no: "Yes / No",
  single_choice: "Single choice",
  multi_choice: "Multi choice",
  text: "Free text",
  number: "Number",
};
const CATEGORIES = ["mens-health", "womens-health", "skin", "weight", "travel", "general", "respiratory", "digestive", "sleep"];

const newQuestion = (): Question => ({
  id: `q_${Math.random().toString(36).slice(2, 9)}`,
  type: "yes_no",
  prompt: "",
  required: true,
  options: [],
  redFlagAnswers: [],
});

export default function AdminConditionEditor() {
  const [, editParams] = useRoute<{ id: string }>("/dashboard/conditions/:id");
  const [, navigate] = useLocation();
  const isNew = editParams?.id === "new";
  const conditionId = editParams?.id;

  const [form, setForm] = useState<Condition>({
    id: "", name: "", category: "general", description: "",
    onlineEligible: true, requiresPhoto: false, requiresInPerson: false,
    ageRestrictions: "", redFlags: [],
    priceGbp: 2500, active: true,
    questionsJson: [],
  });
  const [redFlagsText, setRedFlagsText] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !conditionId) return;
    apiFetch<{ condition: Condition }>(`/api/admin/conditions/${conditionId}`, { auth: "pharmacist" })
      .then(d => {
        setForm({
          ...d.condition,
          questionsJson: d.condition.questionsJson ?? [],
        });
        setRedFlagsText((d.condition.redFlags ?? []).join("\n"));
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [isNew, conditionId]);

  const updateQuestion = (idx: number, patch: Partial<Question>) => {
    const qs = [...(form.questionsJson ?? [])];
    qs[idx] = { ...qs[idx], ...patch };
    setForm({ ...form, questionsJson: qs });
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const qs = [...(form.questionsJson ?? [])];
    const target = idx + dir;
    if (target < 0 || target >= qs.length) return;
    [qs[idx], qs[target]] = [qs[target], qs[idx]];
    setForm({ ...form, questionsJson: qs });
  };

  const addQuestion = () => setForm({ ...form, questionsJson: [...(form.questionsJson ?? []), newQuestion()] });
  const removeQuestion = (idx: number) => {
    const qs = [...(form.questionsJson ?? [])];
    qs.splice(idx, 1);
    setForm({ ...form, questionsJson: qs });
  };

  const handleSave = async () => {
    if (!form.name || !form.category) {
      toast.error("Name and category are required");
      return;
    }
    if (isNew && !form.id) {
      toast.error("ID is required for new conditions");
      return;
    }
    const redFlags = redFlagsText.split("\n").map(s => s.trim()).filter(Boolean);
    const payload = { ...form, redFlags };
    setSaving(true);
    try {
      if (isNew) {
        await apiFetch("/api/admin/conditions", {
          method: "POST",
          body: JSON.stringify(payload),
          auth: "pharmacist",
        });
        toast.success("Condition created");
      } else {
        await apiFetch(`/api/admin/conditions/${conditionId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
          auth: "pharmacist",
        });
        toast.success("Condition saved");
      }
      navigate("/dashboard/conditions");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PharmacistLayout current="conditions"><div className="p-6"><Skeleton className="h-96 rounded-xl" /></div></PharmacistLayout>;

  const questions = form.questionsJson ?? [];

  return (
    <PharmacistLayout current="conditions">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard/conditions" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to conditions
        </Link>

        <h1 className="text-3xl font-bold">{isNew ? "New condition" : `Edit: ${form.name}`}</h1>

        <Card><CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Basics</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {isNew && <div><Label>ID (lowercase, no spaces) *</Label><Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="e.g. acne" data-testid="input-condition-id" /></div>}
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-condition-name" /></div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="select-condition-category"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/-/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Consultation price (pence)</Label><Input type="number" value={form.priceGbp} onChange={e => setForm({ ...form, priceGbp: Number(e.target.value) })} data-testid="input-condition-price" /></div>
            <div><Label>Age restrictions</Label><Input value={form.ageRestrictions ?? ""} onChange={e => setForm({ ...form, ageRestrictions: e.target.value })} placeholder="e.g. 18+" /></div>
          </div>
          <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} /><Label>Active</Label></div>
            <div className="flex items-center gap-3"><Switch checked={form.onlineEligible} onCheckedChange={v => setForm({ ...form, onlineEligible: v })} /><Label>Online eligible</Label></div>
            <div className="flex items-center gap-3"><Switch checked={form.requiresPhoto} onCheckedChange={v => setForm({ ...form, requiresPhoto: v })} /><Label>Requires photo</Label></div>
            <div className="flex items-center gap-3"><Switch checked={form.requiresInPerson} onCheckedChange={v => setForm({ ...form, requiresInPerson: v })} /><Label>Requires in-person</Label></div>
          </div>
          <div>
            <Label className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Red flag symptoms (one per line)</Label>
            <Textarea rows={3} value={redFlagsText} onChange={e => setRedFlagsText(e.target.value)} placeholder="Severe chest pain&#10;Confusion&#10;Loss of consciousness" />
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Questionnaire ({questions.length})</h2>
            <Button onClick={addQuestion} size="sm" variant="outline" data-testid="btn-add-question"><Plus className="w-4 h-4 mr-1" /> Add question</Button>
          </div>

          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-6">No questions yet. Click "Add question" to begin.</p>
          )}

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="border rounded-xl p-4 bg-muted/20 space-y-3" data-testid={`question-${idx}`}>
                <div className="flex items-start gap-2">
                  <GripVertical className="w-5 h-5 text-muted-foreground mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-white px-2 py-1 rounded-md">Q{idx + 1}</span>
                      <Input value={q.prompt} onChange={e => updateQuestion(idx, { prompt: e.target.value })} placeholder="Question text..." className="flex-1" data-testid={`input-question-prompt-${idx}`} />
                    </div>
                    <div className="grid sm:grid-cols-[160px,1fr,auto] gap-2 items-end">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={q.type} onValueChange={v => updateQuestion(idx, { type: v as QType })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{(Object.keys(QTYPE_LABELS) as QType[]).map(t => <SelectItem key={t} value={t}>{QTYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Helper text (optional)</Label>
                        <Input value={q.helperText ?? ""} onChange={e => updateQuestion(idx, { helperText: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-3 pb-2">
                        <Switch checked={q.required} onCheckedChange={v => updateQuestion(idx, { required: v })} />
                        <Label className="text-xs">Required</Label>
                      </div>
                    </div>
                    {(q.type === "single_choice" || q.type === "multi_choice") && (
                      <div>
                        <Label className="text-xs">Options (one per line)</Label>
                        <Textarea rows={3} value={(q.options ?? []).join("\n")} onChange={e => updateQuestion(idx, { options: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
                      </div>
                    )}
                    <div>
                      <Label className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Red-flag answers (one per line) — selecting these auto-flags the consultation</Label>
                      <Textarea rows={2} value={(q.redFlagAnswers ?? []).join("\n")} onChange={e => updateQuestion(idx, { redFlagAnswers: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} placeholder="e.g. yes" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}><ArrowUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => removeQuestion(idx)} className="text-rose-600" data-testid={`btn-remove-question-${idx}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>

        <div className="flex justify-end gap-3 pb-10">
          <Button asChild variant="outline"><Link href="/dashboard/conditions">Cancel</Link></Button>
          <Button onClick={handleSave} disabled={saving} data-testid="btn-save-condition">
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save condition"}
          </Button>
        </div>
      </div>
    </PharmacistLayout>
  );
}

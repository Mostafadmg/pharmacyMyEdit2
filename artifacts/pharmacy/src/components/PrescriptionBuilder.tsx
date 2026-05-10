import React, { useMemo, useRef, useState } from "react";
import { Search, Plus, Trash2, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MEDICATIONS,
  searchMedications,
  type MedicationEntry,
  type PrescriptionItemDraft,
} from "@/data/medications";
import DrugInteractionPanel, { type InteractionState } from "@/components/pharmacist/DrugInteractionPanel";

interface PrescriptionBuilderProps {
  items: PrescriptionItemDraft[];
  onChange: (next: PrescriptionItemDraft[]) => void;
  patientMedications?: string[];
  onInteractionStateChange?: (state: InteractionState) => void;
}

function emptyItem(): PrescriptionItemDraft {
  return { name: "", strength: "", form: "", quantity: "", sig: "", duration: "" };
}

export default function PrescriptionBuilder({ items, onChange, patientMedications, onInteractionStateChange }: PrescriptionBuilderProps) {
  const update = (idx: number, patch: Partial<PrescriptionItemDraft>) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, emptyItem()]);

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <div className="text-center py-6 border border-dashed rounded-xl text-sm text-muted-foreground">
          No medications added yet. Click "Add medication" to start.
        </div>
      )}
      {items.map((item, idx) => (
        <PrescriptionItemRow
          key={idx}
          index={idx}
          item={item}
          onUpdate={(patch) => update(idx, patch)}
          onRemove={() => remove(idx)}
        />
      ))}
      {items.length > 0 && (
        <DrugInteractionPanel
          itemNames={items.map((i) => i.name)}
          patientMedications={patientMedications}
          onChange={onInteractionStateChange}
        />
      )}
      <Button
        type="button"
        variant="outline"
        onClick={add}
        className="w-full rounded-xl border-dashed h-11 text-sm font-semibold"
        data-testid="button-add-prescription-item"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add medication
      </Button>
    </div>
  );
}

function PrescriptionItemRow({
  index,
  item,
  onUpdate,
  onRemove,
}: {
  index: number;
  item: PrescriptionItemDraft;
  onUpdate: (patch: Partial<PrescriptionItemDraft>) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState(item.name);
  const [showSuggest, setShowSuggest] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => searchMedications(query, 6), [query]);

  const selected: MedicationEntry | undefined = useMemo(
    () => MEDICATIONS.find((m) => m.name.toLowerCase() === item.name.toLowerCase()),
    [item.name]
  );

  function pickMed(m: MedicationEntry) {
    onUpdate({
      name: m.name,
      strength: m.strengths[0] ?? "",
      form: m.forms[0] ?? "",
      sig: m.defaultSig,
      duration: m.defaultDuration ?? "",
    });
    setQuery(m.name);
    setShowSuggest(false);
  }

  return (
    <div
      ref={containerRef}
      className="border border-border rounded-2xl p-4 bg-white space-y-3 shadow-sm"
      data-testid={`prescription-item-${index}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Pill className="w-3.5 h-3.5 text-primary" /> Medication {index + 1}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full h-8 w-8 p-0"
          aria-label="Remove medication"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Autocomplete */}
      <div className="relative">
        <Label className="text-xs font-semibold text-secondary mb-1 block">Medication name</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onUpdate({ name: e.target.value });
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            placeholder="Start typing… e.g. Amoxicillin, Cetirizine"
            className="pl-9 rounded-xl h-10"
            data-testid={`input-med-name-${index}`}
            autoComplete="off"
          />
        </div>
        {showSuggest && matches.length > 0 && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-border rounded-xl shadow-lg max-h-72 overflow-auto">
            {matches.map((m) => (
              <button
                key={m.name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickMed(m);
                }}
                className="w-full text-left px-3 py-2 hover:bg-primary/5 border-b last:border-b-0"
                data-testid={`suggest-med-${m.name}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{m.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.pomOrP === "POM" ? "bg-rose-50 text-rose-700" : m.pomOrP === "P" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                    {m.pomOrP}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {m.brand ? `${m.brand} · ` : ""}{m.category}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-secondary mb-1 block">Strength</Label>
          {selected ? (
            <select
              value={item.strength}
              onChange={(e) => onUpdate({ strength: e.target.value })}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              data-testid={`select-strength-${index}`}
            >
              <option value="">Select…</option>
              {selected.strengths.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <Input
              value={item.strength}
              onChange={(e) => onUpdate({ strength: e.target.value })}
              placeholder="e.g. 500 mg"
              className="rounded-xl h-10"
              data-testid={`input-strength-${index}`}
            />
          )}
        </div>
        <div>
          <Label className="text-xs font-semibold text-secondary mb-1 block">Form</Label>
          {selected ? (
            <select
              value={item.form}
              onChange={(e) => onUpdate({ form: e.target.value })}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
              data-testid={`select-form-${index}`}
            >
              <option value="">Select…</option>
              {selected.forms.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          ) : (
            <Input
              value={item.form}
              onChange={(e) => onUpdate({ form: e.target.value })}
              placeholder="e.g. capsule"
              className="rounded-xl h-10"
              data-testid={`input-form-${index}`}
            />
          )}
        </div>
        <div>
          <Label className="text-xs font-semibold text-secondary mb-1 block">Quantity</Label>
          <Input
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: e.target.value })}
            placeholder="e.g. 15 capsules"
            className="rounded-xl h-10"
            data-testid={`input-quantity-${index}`}
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-secondary mb-1 block">Duration</Label>
          <Input
            value={item.duration}
            onChange={(e) => onUpdate({ duration: e.target.value })}
            placeholder="e.g. 5 days"
            className="rounded-xl h-10"
            data-testid={`input-duration-${index}`}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-secondary mb-1 block">Dosage instructions (Sig)</Label>
        <Textarea
          value={item.sig}
          onChange={(e) => onUpdate({ sig: e.target.value })}
          placeholder="e.g. Take ONE capsule THREE times a day"
          className="min-h-[60px] rounded-xl text-sm"
          data-testid={`input-sig-${index}`}
        />
      </div>

      {selected?.notes && (
        <p className="text-[11px] text-amber-700 bg-amber-50 px-3 py-2 rounded-lg leading-snug">
          <strong>PIP note:</strong> {selected.notes}
        </p>
      )}
    </div>
  );
}

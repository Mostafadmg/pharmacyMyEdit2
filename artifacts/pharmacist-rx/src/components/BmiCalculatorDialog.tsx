import { useEffect, useMemo, useState } from "react";
import { Calculator, Check, Loader2 } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { calcBmi } from "@/lib/measurementHistory";
import {
  bmiVerdictLabel,
  resolveConsultationBmi,
  resolveConsultationHeightCm,
  resolveConsultationWeightKg,
} from "@/lib/orderPatientUi";

type HeightUnit = "cm" | "ft";
type WeightUnit = "kg" | "st";

function cmToFeetInches(cm: number): { ft: number; inches: number } {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round((totalIn - ft * 12) * 10) / 10;
  return { ft, inches: inches >= 12 ? 0 : inches };
}

function kgToStoneLb(kg: number): { stone: number; lb: number } {
  const totalLb = kg * 2.2046226218;
  const stone = Math.floor(totalLb / 14);
  const lb = Math.round((totalLb - stone * 14) * 10) / 10;
  return { stone, lb };
}

function parseHeightCm(
  unit: HeightUnit,
  cm: string,
  ft: string,
  inches: string,
): number | null {
  if (unit === "cm") {
    const n = Number.parseFloat(cm);
    return Number.isFinite(n) && n >= 100 && n <= 250 ? Math.round(n) : null;
  }
  const f = Number.parseInt(ft, 10);
  const i = Number.parseFloat(inches);
  if (!Number.isFinite(f) || f < 3 || f > 8) return null;
  if (!Number.isFinite(i) || i < 0 || i >= 12) return null;
  const totalCm = (f * 12 + i) * 2.54;
  return totalCm >= 100 && totalCm <= 250 ? Math.round(totalCm) : null;
}

function parseWeightKg(
  unit: WeightUnit,
  kg: string,
  stone: string,
  lb: string,
): number | null {
  if (unit === "kg") {
    const n = Number.parseFloat(kg);
    return Number.isFinite(n) && n >= 30 && n <= 350 ? Math.round(n) : null;
  }
  const st = Number.parseInt(stone, 10);
  const lbs = Number.parseFloat(lb);
  if (!Number.isFinite(st) || st < 4 || st > 35) return null;
  if (!Number.isFinite(lbs) || lbs < 0 || lbs >= 14) return null;
  const totalKg = (st * 14 + lbs) * 0.45359237;
  return totalKg >= 30 && totalKg <= 350 ? Math.round(totalKg) : null;
}

export function BmiCalculatorDialog({
  consultation,
  open,
  onOpenChange,
  onSaved,
}: {
  consultation: Consultation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const initialHeight = resolveConsultationHeightCm(consultation) ?? 170;
  const initialWeight = resolveConsultationWeightKg(consultation) ?? 90;
  const initialFtIn = cmToFeetInches(initialHeight);
  const initialStLb = kgToStoneLb(initialWeight);

  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightCm, setHeightCm] = useState(String(initialHeight));
  const [heightFt, setHeightFt] = useState(String(initialFtIn.ft));
  const [heightIn, setHeightIn] = useState(String(initialFtIn.inches));
  const [weightKg, setWeightKg] = useState(String(initialWeight));
  const [weightSt, setWeightSt] = useState(String(initialStLb.stone));
  const [weightLb, setWeightLb] = useState(String(initialStLb.lb));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const h = resolveConsultationHeightCm(consultation) ?? 170;
    const w = resolveConsultationWeightKg(consultation) ?? 90;
    const ftIn = cmToFeetInches(h);
    const stLb = kgToStoneLb(w);
    setHeightUnit("cm");
    setWeightUnit("kg");
    setHeightCm(String(h));
    setHeightFt(String(ftIn.ft));
    setHeightIn(String(ftIn.inches));
    setWeightKg(String(w));
    setWeightSt(String(stLb.stone));
    setWeightLb(String(stLb.lb));
    setError(null);
  }, [open, consultation]);

  const heightCmResolved = useMemo(
    () => parseHeightCm(heightUnit, heightCm, heightFt, heightIn),
    [heightUnit, heightCm, heightFt, heightIn],
  );
  const weightKgResolved = useMemo(
    () => parseWeightKg(weightUnit, weightKg, weightSt, weightLb),
    [weightUnit, weightKg, weightSt, weightLb],
  );
  const calculatedBmi =
    heightCmResolved != null && weightKgResolved != null
      ? calcBmi(weightKgResolved, heightCmResolved)
      : null;
  const verdict =
    calculatedBmi != null ? bmiVerdictLabel(calculatedBmi) : null;

  const save = async () => {
    if (heightCmResolved == null || weightKgResolved == null || calculatedBmi == null) {
      setError("Enter a valid height (100–250 cm) and weight (30–350 kg).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch<Consultation>(
        `/api/consultations/${consultation.id}/measurements`,
        {
          method: "PATCH",
          body: JSON.stringify({
            verifiedHeightCm: heightCmResolved,
            verifiedWeightKg: weightKgResolved,
            bmi: calculatedBmi,
          }),
        },
      );
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save BMI.");
    } finally {
      setSaving(false);
    }
  };

  const previousBmi = resolveConsultationBmi(consultation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calculator className="h-5 w-5 text-emerald-700" />
            BMI Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Height</Label>
            <ToggleGroup
              type="single"
              value={heightUnit}
              onValueChange={(v) => v && setHeightUnit(v as HeightUnit)}
              className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
            >
              <ToggleGroupItem
                value="cm"
                className="rounded-md px-3 py-1 text-xs font-semibold data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                CM
              </ToggleGroupItem>
              <ToggleGroupItem
                value="ft"
                className="rounded-md px-3 py-1 text-xs font-semibold data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                Feet / Inches
              </ToggleGroupItem>
            </ToggleGroup>
            {heightUnit === "cm" ? (
              <Input
                type="number"
                inputMode="decimal"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="h-11 rounded-xl"
                placeholder="170"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="ft"
                  aria-label="Feet"
                />
                <Input
                  type="number"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="in"
                  aria-label="Inches"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Weight</Label>
            <ToggleGroup
              type="single"
              value={weightUnit}
              onValueChange={(v) => v && setWeightUnit(v as WeightUnit)}
              className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
            >
              <ToggleGroupItem
                value="kg"
                className="rounded-md px-3 py-1 text-xs font-semibold data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                KG
              </ToggleGroupItem>
              <ToggleGroupItem
                value="st"
                className="rounded-md px-3 py-1 text-xs font-semibold data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
              >
                Stone / Pounds
              </ToggleGroupItem>
            </ToggleGroup>
            {weightUnit === "kg" ? (
              <Input
                type="number"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="h-11 rounded-xl"
                placeholder="85"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  value={weightSt}
                  onChange={(e) => setWeightSt(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="st"
                  aria-label="Stone"
                />
                <Input
                  type="number"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  className="h-11 rounded-xl"
                  placeholder="lb"
                  aria-label="Pounds"
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rx-decline-surface/80 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Calculated BMI
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-foreground">
              {calculatedBmi != null ? calculatedBmi.toFixed(2) : "—"}
            </p>
            {verdict && (
              <p className={cn("mt-1 text-sm font-bold", verdict.className)}>
                {verdict.label}
              </p>
            )}
            {previousBmi != null && calculatedBmi != null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Was {previousBmi.toFixed(1)} on this order
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-rose-700 font-medium">{error}</p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/40/50 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-rx-decline-border text-rose-800 hover:bg-rx-decline-surface"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
            onClick={() => void save()}
            disabled={saving || calculatedBmi == null}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save BMI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

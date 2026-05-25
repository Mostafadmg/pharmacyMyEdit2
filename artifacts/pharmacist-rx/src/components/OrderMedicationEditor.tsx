import { useEffect, useState } from "react";
import { Pencil, Save } from "lucide-react";
import type { Consultation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetConsultationQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import {
  diffPrescriptionItemChanges,
} from "@/lib/orderActivity";

type RxItem = {
  name: string;
  strength: string;
  form: string;
  quantity: string;
  sig: string;
  duration: string;
  notes?: string;
};

const DEFAULT_ITEM: RxItem = {
  name: "",
  strength: "",
  form: "Injection",
  quantity: "1",
  sig: "As directed",
  duration: "28 days",
};

function getConsultationRxItems(consultation: Consultation): RxItem[] {
  const raw = (consultation.prescriptionItems ?? []) as RxItem[];
  if (raw.length > 0) {
    return raw.map((it) => ({
      name: it.name ?? "",
      strength: it.strength ?? "",
      form: it.form ?? "Supply",
      quantity: String(it.quantity ?? "1"),
      sig: it.sig ?? "As directed",
      duration: it.duration ?? "28 days",
      notes: it.notes,
    }));
  }

  const answers = (consultation.answers ?? {}) as Record<string, unknown>;
  const plan =
    typeof answers.selected_plan === "string"
      ? answers.selected_plan
      : consultation.conditionName;
  return [
    {
      ...DEFAULT_ITEM,
      name: plan.split("·")[0]?.trim() || consultation.conditionName,
      strength:
        typeof answers.current_dose === "string" ? answers.current_dose : "",
    },
  ];
}

export function OrderMedicationEditor({
  consultation,
  embedded = false,
  onMedicationChanged,
}: {
  consultation: Consultation;
  embedded?: boolean;
  onMedicationChanged?: (payload: {
    changes: Array<{ field: string; from: string; to: string }>;
  }) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<RxItem[]>([DEFAULT_ITEM]);

  useEffect(() => {
    setItems(getConsultationRxItems(consultation));
  }, [consultation.id, consultation.prescriptionItems, consultation.answers]);

  const save = async () => {
    const primary = items[0];
    if (!primary?.name.trim() || !primary.strength.trim()) {
      toast({
        title: "Name and strength required",
        variant: "destructive",
      });
      return;
    }

    const previousPrimary = getConsultationRxItems(consultation)[0] ?? DEFAULT_ITEM;
    const changes = diffPrescriptionItemChanges(previousPrimary, primary);

    setSaving(true);
    try {
      await apiFetch(`/api/consultations/${consultation.id}/prescription-items`, {
        method: "PATCH",
        body: JSON.stringify({ prescriptionItems: items }),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetConsultationQueryKey(consultation.id),
      });
      if (changes.length > 0) {
        onMedicationChanged?.({ changes });
      }
      toast({ title: "Medication updated" });
      setEditing(false);
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const primary = items[0] ?? DEFAULT_ITEM;

  return (
    <div
      className={
        embedded
          ? undefined
          : "rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          {!embedded ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-800">
              Prescribed medication
            </div>
          ) : null}
          {!editing ? (
            <p
              className={
                embedded
                  ? "text-sm font-semibold text-foreground"
                  : "mt-1 text-sm font-semibold text-foreground"
              }
            >
              {primary.name}{" "}
              <span className="text-violet-800">{primary.strength}</span>
              <span className="text-muted-foreground font-normal">
                {" "}
                · Qty {primary.quantity}
              </span>
            </p>
          ) : null}
        </div>
        {!editing ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-violet-200 bg-card"
            onClick={() => setEditing(true)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit strength &amp; qty
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className="bg-violet-700 hover:bg-violet-800 text-white"
              onClick={() => void save()}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">Product</span>
            <input
              value={primary.name}
              onChange={(e) =>
                setItems([{ ...primary, name: e.target.value }, ...items.slice(1)])
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Strength</span>
            <input
              value={primary.strength}
              onChange={(e) =>
                setItems([
                  { ...primary, strength: e.target.value },
                  ...items.slice(1),
                ])
              }
              placeholder="e.g. 5mg"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Quantity</span>
            <input
              value={primary.quantity}
              onChange={(e) =>
                setItems([
                  { ...primary, quantity: e.target.value },
                  ...items.slice(1),
                ])
              }
              placeholder="e.g. 1"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">Form</span>
            <input
              value={primary.form}
              onChange={(e) =>
                setItems([{ ...primary, form: e.target.value }, ...items.slice(1)])
              }
              className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

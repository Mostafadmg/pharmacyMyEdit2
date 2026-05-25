import { isCustomOrderTagId, type CustomOrderTag } from "@/lib/customOrderTags";
import { resolveOrderTagLabel } from "@/lib/orderTags";

export type OrderTagPatchInput = {
  action: "add" | "remove";
  tagId: string;
  pharmacistName: string;
  note?: string;
  source?:
    | "manual"
    | "document_reject"
    | "weight_monitoring"
    | "cs_hold"
    | "prescriber_hold"
    | "document_requirement"
    | "system";
};

export function buildOrderTagsBatchAddBody(
  input: {
    tagIds: string[];
    pharmacistName: string;
    note?: string;
  },
  customTags: CustomOrderTag[] = [],
): Record<string, unknown> {
  const tagIds = [...new Set(input.tagIds.map((id) => id.trim()).filter(Boolean))];
  const body: Record<string, unknown> = {
    action: "add_batch",
    tagIds,
    pharmacistName: input.pharmacistName,
  };
  if (input.note?.trim()) body.note = input.note.trim();

  const labels: Record<string, string> = {};
  for (const id of tagIds) {
    if (isCustomOrderTagId(id)) {
      labels[id] = resolveOrderTagLabel(id, customTags);
    }
  }
  if (Object.keys(labels).length > 0) body.labels = labels;

  return body;
}

export function buildOrderTagsBatchRemoveBody(input: {
  tagIds: string[];
  pharmacistName: string;
  note?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    action: "remove_batch",
    tagIds: input.tagIds,
    pharmacistName: input.pharmacistName,
  };
  if (input.note?.trim()) body.note = input.note.trim();
  return body;
}

export function buildOrderTagPatchBody(
  input: OrderTagPatchInput,
  customTags: CustomOrderTag[] = [],
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    action: input.action,
    tagId: input.tagId,
    pharmacistName: input.pharmacistName,
  };
  if (input.note?.trim()) body.note = input.note.trim();
  if (input.source) body.source = input.source;
  if (input.action === "add" && isCustomOrderTagId(input.tagId)) {
    body.label = resolveOrderTagLabel(input.tagId, customTags);
  }
  return body;
}

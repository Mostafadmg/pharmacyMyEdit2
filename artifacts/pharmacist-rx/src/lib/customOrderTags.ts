import { getPharmacistName } from "@/lib/pharmacistSession";

export const CUSTOM_ORDER_TAGS_STORAGE_PREFIX =
  "pharmacare:rx-custom-order-tags";

export const CUSTOM_ORDER_TAG_ID_PREFIX = "custom:";

export const CUSTOM_TAG_LABEL_MAX = 48;
export const CUSTOM_TAG_MAX_COUNT = 20;

export type CustomOrderTag = {
  id: string;
  label: string;
};

function storageKeyForPharmacist(): string {
  const name = getPharmacistName().toLowerCase().replace(/\s+/g, "_").slice(0, 64);
  return `${CUSTOM_ORDER_TAGS_STORAGE_PREFIX}:${name}`;
}

export function isCustomOrderTagId(id: string): boolean {
  return (
    id.startsWith(CUSTOM_ORDER_TAG_ID_PREFIX) &&
    /^custom:[a-z0-9][a-z0-9_-]{0,47}$/.test(id)
  );
}

export function slugFromCustomTagLabel(label: string): string {
  const base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "tag";
}

export function customTagIdFromLabel(
  label: string,
  existingIds: Iterable<string>,
): string {
  const taken = new Set(existingIds);
  const base = slugFromCustomTagLabel(label);
  let slug = base;
  let n = 2;
  while (taken.has(`${CUSTOM_ORDER_TAG_ID_PREFIX}${slug}`)) {
    slug = `${base}_${n}`;
    n += 1;
  }
  return `${CUSTOM_ORDER_TAG_ID_PREFIX}${slug}`;
}

export function normalizeCustomTagLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

export type ValidateCustomTagResult =
  | { ok: true; label: string }
  | { ok: false; error: string };

export function validateCustomTagLabel(
  label: string,
  existing: CustomOrderTag[],
  excludeId?: string,
): ValidateCustomTagResult {
  const normalized = normalizeCustomTagLabel(label);
  if (normalized.length < 2) {
    return { ok: false, error: "Tag name must be at least 2 characters." };
  }
  if (normalized.length > CUSTOM_TAG_LABEL_MAX) {
    return {
      ok: false,
      error: `Tag name must be ${CUSTOM_TAG_LABEL_MAX} characters or fewer.`,
    };
  }
  const normLower = normalized.toLowerCase();
  const duplicate = existing.some(
    (t) =>
      t.id !== excludeId &&
      normalizeCustomTagLabel(t.label).toLowerCase() === normLower,
  );
  if (duplicate) {
    return { ok: false, error: "You already have a tag with this name." };
  }
  return { ok: true, label: normalized };
}

export function loadCustomOrderTags(): CustomOrderTag[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKeyForPharmacist());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CustomOrderTag =>
          typeof item === "object" &&
          item != null &&
          typeof (item as CustomOrderTag).id === "string" &&
          typeof (item as CustomOrderTag).label === "string" &&
          isCustomOrderTagId((item as CustomOrderTag).id),
      )
      .slice(0, CUSTOM_TAG_MAX_COUNT);
  } catch {
    return [];
  }
}

export function saveCustomOrderTags(tags: CustomOrderTag[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      storageKeyForPharmacist(),
      JSON.stringify(tags.slice(0, CUSTOM_TAG_MAX_COUNT)),
    );
    window.dispatchEvent(new CustomEvent("pharmacare:custom-order-tags-changed"));
  } catch {
    /* localStorage unavailable */
  }
}

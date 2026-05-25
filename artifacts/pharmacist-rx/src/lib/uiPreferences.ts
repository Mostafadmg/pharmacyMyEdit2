export const UI_PREFERENCES_STORAGE_KEY = "pharmacare:rx-ui-preferences";

export type UiPreferenceKey =
  | "showReviewChecklist"
  | "showPatientRail"
  | "showQueueNav";

export type UiPreferences = Record<UiPreferenceKey, boolean>;

export const UI_PREFERENCE_DEFAULTS: UiPreferences = {
  showReviewChecklist: true,
  showPatientRail: true,
  showQueueNav: true,
};

export const UI_PREFERENCE_META: Record<
  UiPreferenceKey,
  { label: string; description: string }
> = {
  showReviewChecklist: {
    label: "Review checklist",
    description: "Progress sidebar on order review (right column)",
  },
  showPatientRail: {
    label: "Patient record rail",
    description: "Patient card, stats, and flags on order detail (left column)",
  },
  showQueueNav: {
    label: "Queue navigation",
    description: "Back to queue and prev/next when reviewing from a queue",
  },
};

export function loadUiPreferences(): UiPreferences {
  if (typeof window === "undefined") return { ...UI_PREFERENCE_DEFAULTS };
  try {
    const raw = window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...UI_PREFERENCE_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return { ...UI_PREFERENCE_DEFAULTS, ...parsed };
  } catch {
    return { ...UI_PREFERENCE_DEFAULTS };
  }
}

export function saveUiPreferences(prefs: UiPreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      UI_PREFERENCES_STORAGE_KEY,
      JSON.stringify(prefs),
    );
  } catch {
    /* localStorage unavailable */
  }
}

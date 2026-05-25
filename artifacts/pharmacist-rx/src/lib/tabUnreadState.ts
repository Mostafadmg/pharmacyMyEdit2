import type { PatientCommunication } from "@/lib/orderActivity";

export type ClinicalNote = {
  id: string;
  body: string;
  at: string;
  pinned: boolean;
  author: string;
};

function messagesSeenKey(consultationId: string) {
  return `pharmacare:rx-messages-seen:${consultationId}`;
}

function notesSeenKey(consultationId: string) {
  return `pharmacare:rx-notes-seen:${consultationId}`;
}

export function notesStorageKey(consultationId: string) {
  return `pharmacare:rx-notes:${consultationId}`;
}

export function getMessagesLastSeenAt(consultationId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(messagesSeenKey(consultationId));
  } catch {
    return null;
  }
}

export function markMessagesSeen(consultationId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      messagesSeenKey(consultationId),
      new Date().toISOString(),
    );
  } catch {
    /* ignore */
  }
}

/** Patient replies not yet seen by pharmacy staff on this order. */
export function countUnreadMessages(
  consultationId: string,
  communications: PatientCommunication[],
): number {
  const lastSeen = getMessagesLastSeenAt(consultationId);
  if (!lastSeen) {
    return communications.filter((c) => c.direction === "incoming").length;
  }
  const seenMs = new Date(lastSeen).getTime();
  return communications.filter(
    (c) =>
      c.direction === "incoming" && new Date(c.at).getTime() > seenMs,
  ).length;
}

export function getSeenNoteIds(consultationId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(notesSeenKey(consultationId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function markNotesSeen(
  consultationId: string,
  noteIds: string[],
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSeenNoteIds(consultationId);
    for (const id of noteIds) existing.add(id);
    window.localStorage.setItem(
      notesSeenKey(consultationId),
      JSON.stringify([...existing]),
    );
  } catch {
    /* ignore */
  }
}

export function countUnreadNotes(
  consultationId: string,
  notes: ClinicalNote[],
): number {
  const seen = getSeenNoteIds(consultationId);
  return notes.filter((n) => !seen.has(n.id)).length;
}

export function readStoredNotes(consultationId: string): ClinicalNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(notesStorageKey(consultationId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ClinicalNote[];
  } catch {
    return [];
  }
}

export function writeStoredNotes(
  consultationId: string,
  notes: ClinicalNote[],
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      notesStorageKey(consultationId),
      JSON.stringify(notes),
    );
  } catch {
    /* ignore */
  }
}

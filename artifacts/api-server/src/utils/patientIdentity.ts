import {
  db,
  consultationsTable,
  patientAccountsTable,
} from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";

export type DuplicatePatientMatch = {
  patientId: string | null;
  pmrNumber: string | null;
  name: string;
  email: string;
  dateOfBirth: string | null;
  registeredAt: string | null;
  consultationCount: number;
  isRecommendedPrimary: boolean;
  matchReason: "same_name_and_dob_different_email";
};

const WEIGHT_MGMT_IDS = new Set([
  "weight-loss",
  "weight_loss",
  "weight-management",
]);

export function normalizePatientName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z\s'-]/g, "");
}

function isValidIsoDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function normalizeDateOfBirth(dob: string | null | undefined): string | null {
  if (!dob?.trim()) return null;
  const trimmed = dob.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidIsoDate(trimmed) ? trimmed : null;
  }
  const slash = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    const iso = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    return isValidIsoDate(iso) ? iso : null;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().slice(0, 10);
    return isValidIsoDate(iso) ? iso : null;
  }
  return null;
}

export function extractDateOfBirthFromAnswers(
  answers: Record<string, unknown> | null | undefined,
): string | null {
  if (!answers) return null;
  const raw =
    (typeof answers.dob === "string" && answers.dob) ||
    (typeof answers.dateOfBirth === "string" && answers.dateOfBirth) ||
    (typeof answers.date_of_birth === "string" && answers.date_of_birth) ||
    null;
  return normalizeDateOfBirth(raw);
}

export function isWeightManagementCondition(conditionId: string): boolean {
  return WEIGHT_MGMT_IDS.has(conditionId);
}

type IdentityCandidate = {
  patientId: string | null;
  pmrNumber: string | null;
  name: string;
  email: string;
  dateOfBirth: string | null;
  registeredAt: string | null;
  consultationCount: number;
};

function identityKey(name: string, dob: string): string {
  return `${normalizePatientName(name)}|${dob}`;
}

async function loadIdentityCandidates(): Promise<IdentityCandidate[]> {
  const [accounts, consultationRows] = await Promise.all([
    db.select().from(patientAccountsTable),
    db
      .select({
        patientEmail: consultationsTable.patientEmail,
        patientName: consultationsTable.patientName,
        patientDateOfBirth: consultationsTable.patientDateOfBirth,
        answers: consultationsTable.answers,
        createdAt: consultationsTable.createdAt,
      })
      .from(consultationsTable)
      .orderBy(desc(consultationsTable.createdAt)),
  ]);

  const byEmail = new Map<string, IdentityCandidate>();

  for (const account of accounts) {
    const email = account.email.toLowerCase();
    byEmail.set(email, {
      patientId: account.id,
      pmrNumber: account.pmrNumber ?? null,
      name: account.name,
      email: account.email,
      dateOfBirth: normalizeDateOfBirth(account.dateOfBirth),
      registeredAt: account.createdAt?.toISOString?.() ?? null,
      consultationCount: 0,
    });
  }

  for (const row of consultationRows) {
    const email = row.patientEmail.toLowerCase();
    const dob =
      normalizeDateOfBirth(row.patientDateOfBirth) ??
      extractDateOfBirthFromAnswers(row.answers as Record<string, unknown>);
    const existing = byEmail.get(email);
    if (existing) {
      existing.consultationCount += 1;
      if (!existing.dateOfBirth && dob) existing.dateOfBirth = dob;
      if (!existing.name && row.patientName) existing.name = row.patientName;
      continue;
    }
    byEmail.set(email, {
      patientId: null,
      pmrNumber: null,
      name: row.patientName,
      email: row.patientEmail,
      dateOfBirth: dob,
      registeredAt: row.createdAt?.toISOString?.() ?? null,
      consultationCount: 1,
    });
  }

  return [...byEmail.values()];
}

export async function findDuplicatePatientMatches(opts: {
  patientName: string;
  dateOfBirth: string | null | undefined;
  patientEmail: string;
}): Promise<DuplicatePatientMatch[]> {
  const normalizedDob = normalizeDateOfBirth(opts.dateOfBirth);
  const normalizedName = normalizePatientName(opts.patientName);
  if (!normalizedDob || !normalizedName) return [];

  const emailLower = opts.patientEmail.toLowerCase();
  const candidates = await loadIdentityCandidates();
  const group = candidates.filter(
    (c) =>
      c.dateOfBirth === normalizedDob &&
      normalizePatientName(c.name) === normalizedName,
  );

  if (group.length <= 1) return [];

  const sorted = [...group].sort((a, b) => {
    const aTime = a.registeredAt ? Date.parse(a.registeredAt) : Number.MAX_SAFE_INTEGER;
    const bTime = b.registeredAt ? Date.parse(b.registeredAt) : Number.MAX_SAFE_INTEGER;
    if (aTime !== bTime) return aTime - bTime;
    return a.email.localeCompare(b.email);
  });

  const primaryEmail = sorted[0]!.email.toLowerCase();

  return sorted
    .filter((c) => c.email.toLowerCase() !== emailLower)
    .map((c) => ({
      patientId: c.patientId,
      pmrNumber: c.pmrNumber,
      name: c.name,
      email: c.email,
      dateOfBirth: c.dateOfBirth,
      registeredAt: c.registeredAt,
      consultationCount: c.consultationCount,
      isRecommendedPrimary: c.email.toLowerCase() === primaryEmail,
      matchReason: "same_name_and_dob_different_email" as const,
    }));
}

export type PatientDuplicateSummary = {
  email: string;
  name: string;
  patientId: string | null;
  pmrNumber: string | null;
  dateOfBirth: string | null;
  consultationCount: number;
  lastConsultationAt: string | null;
  lastConsultationId: string | null;
  lastConsultationNumber: string | null;
  duplicateWarning: boolean;
  /** Recommended canonical patient record (oldest matching name + DOB) */
  duplicateOf: {
    email: string;
    name: string;
    patientId: string | null;
    pmrNumber: string | null;
  } | null;
  possibleDuplicates: Array<{
    email: string;
    name: string;
    patientId: string | null;
    pmrNumber: string | null;
  }>;
};

export async function buildPatientDuplicateSummaries(): Promise<
  PatientDuplicateSummary[]
> {
  const candidates = await loadIdentityCandidates();
  const groups = new Map<string, IdentityCandidate[]>();

  for (const c of candidates) {
    if (!c.dateOfBirth || !normalizePatientName(c.name)) continue;
    const key = identityKey(c.name, c.dateOfBirth);
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  const primaryByEmail = new Map<string, IdentityCandidate>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => {
      const aTime = a.registeredAt ? Date.parse(a.registeredAt) : Number.MAX_SAFE_INTEGER;
      const bTime = b.registeredAt ? Date.parse(b.registeredAt) : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return a.email.localeCompare(b.email);
    });
    const primary = sorted[0]!;
    for (const member of group) {
      primaryByEmail.set(member.email.toLowerCase(), primary);
    }
  }

  const consultationMeta = await db
    .select({
      patientEmail: consultationsTable.patientEmail,
      id: consultationsTable.id,
      consultationNumber: consultationsTable.consultationNumber,
      createdAt: consultationsTable.createdAt,
    })
    .from(consultationsTable)
    .orderBy(desc(consultationsTable.createdAt));

  const lastByEmail = new Map<
    string,
    { id: string; consultationNumber: string | null; createdAt: string }
  >();
  for (const row of consultationMeta) {
    const email = row.patientEmail.toLowerCase();
    if (lastByEmail.has(email)) continue;
    lastByEmail.set(email, {
      id: row.id,
      consultationNumber: row.consultationNumber ?? null,
      createdAt: row.createdAt?.toISOString?.() ?? "",
    });
  }

  return candidates
    .map((c) => {
      const emailKey = c.email.toLowerCase();
      const primary = primaryByEmail.get(emailKey) ?? null;
      const groupKey =
        c.dateOfBirth && normalizePatientName(c.name)
          ? identityKey(c.name, c.dateOfBirth)
          : null;
      const group = groupKey ? groups.get(groupKey) ?? [] : [];
      const others = group.filter(
        (g) => g.email.toLowerCase() !== emailKey,
      );
      const last = lastByEmail.get(emailKey) ?? null;

      return {
        email: c.email,
        name: c.name,
        patientId: c.patientId,
        pmrNumber: c.pmrNumber,
        dateOfBirth: c.dateOfBirth,
        consultationCount: c.consultationCount,
        lastConsultationAt: last?.createdAt ?? null,
        lastConsultationId: last?.id ?? null,
        lastConsultationNumber: last?.consultationNumber ?? null,
        duplicateWarning: others.length > 0,
        duplicateOf:
          primary && primary.email.toLowerCase() !== emailKey
            ? {
                email: primary.email,
                name: primary.name,
                patientId: primary.patientId,
                pmrNumber: primary.pmrNumber,
              }
            : null,
        possibleDuplicates: others.map((o) => ({
          email: o.email,
          name: o.name,
          patientId: o.patientId,
          pmrNumber: o.pmrNumber,
        })),
      };
    })
    .sort((a, b) =>
      (b.lastConsultationAt ?? "").localeCompare(a.lastConsultationAt ?? ""),
    );
}

export async function nextPmrNumber(): Promise<string> {
  const rows = await db
    .select({ pmrNumber: patientAccountsTable.pmrNumber })
    .from(patientAccountsTable)
    .where(sql`${patientAccountsTable.pmrNumber} IS NOT NULL`);

  let max = 100000;
  for (const row of rows) {
    const n = Number.parseInt(row.pmrNumber?.replace(/^PMR-/i, "") ?? "0", 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `PMR-${String(max + 1).padStart(6, "0")}`;
}

export function isUniqueViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("unique constraint") || msg.includes("duplicate key");
}

export async function nextConsultationNumber(bump = 0): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `CON-${today}-`;
  const [row] = await db
    .select({ consultationNumber: consultationsTable.consultationNumber })
    .from(consultationsTable)
    .where(sql`${consultationsTable.consultationNumber} LIKE ${prefix + "%"}`)
    .orderBy(desc(consultationsTable.consultationNumber))
    .limit(1);

  let maxSeq = 0;
  const last = row?.consultationNumber?.trim();
  if (last?.startsWith(prefix)) {
    const tail = last.slice(prefix.length);
    const parsed = Number.parseInt(tail, 10);
    if (Number.isFinite(parsed)) maxSeq = parsed;
  }

  const seq = maxSeq + 1 + bump;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/** Assign CON-… numbers to legacy rows missing consultation_number. */
export async function ensureConsultationNumbersForConsultations(
  rows: Array<{ id: string; consultationNumber: string | null }>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const row of rows) {
    if (row.consultationNumber?.trim()) {
      out.set(row.id, row.consultationNumber.trim());
      continue;
    }
    let assigned: string | null = null;
    for (let attempt = 0; attempt < 12 && !assigned; attempt++) {
      const consultationNumber = await nextConsultationNumber(attempt);
      try {
        await db
          .update(consultationsTable)
          .set({ consultationNumber })
          .where(eq(consultationsTable.id, row.id));
        assigned = consultationNumber;
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
      }
    }
    if (assigned) out.set(row.id, assigned);
  }
  return out;
}

export function formatConsultationRef(
  consultationNumber: string | null | undefined,
  id: string,
): string {
  if (consultationNumber?.trim()) return consultationNumber.trim();
  return `#${id.replace(/-/g, "").toUpperCase().slice(-8)}`;
}

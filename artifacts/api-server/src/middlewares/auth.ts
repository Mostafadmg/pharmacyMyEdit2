import type { Request, Response, NextFunction } from "express";
import { db, patientAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const PHARMACIST_IDS = new Set(["pharm-001", "pharm-002"]);
const PHARMACIST_DETAILS: Record<string, { name: string; role: string }> = {
  "pharm-001": { name: "Dr. Sarah Mitchell", role: "Pharmacist Prescriber (GPhC)" },
  "pharm-002": { name: "James Thornton", role: "Pharmacist Prescriber (GPhC)" },
};

export { PHARMACIST_IDS, PHARMACIST_DETAILS };

export function decodeBearerId(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [id] = decoded.split(":");
    return id || null;
  } catch {
    return null;
  }
}

export interface AuthedRequest extends Request {
  authActor?: {
    id: string;
    role: "pharmacist" | "patient";
    name: string;
    email?: string;
  };
}

/** Resolve any bearer (pharmacist or patient) into an actor with email when applicable. */
export async function resolveAuthActor(
  authHeader: string | undefined,
): Promise<AuthedRequest["authActor"] | null> {
  const id = decodeBearerId(authHeader);
  if (!id) return null;
  if (PHARMACIST_IDS.has(id)) {
    const details = PHARMACIST_DETAILS[id]!;
    return { id, role: "pharmacist", name: details.name };
  }
  // Patient bearer encodes patientId — look up email/name from DB
  const [patient] = await db
    .select({ id: patientAccountsTable.id, email: patientAccountsTable.email, name: patientAccountsTable.name })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, id));
  if (!patient) return null;
  return { id: patient.id, role: "patient", name: patient.name, email: patient.email };
}

export function requirePharmacist(req: AuthedRequest, res: Response, next: NextFunction): void {
  const id = decodeBearerId(req.headers.authorization);
  if (!id || !PHARMACIST_IDS.has(id)) {
    res.status(401).json({ error: "Pharmacist authentication required" });
    return;
  }
  const details = PHARMACIST_DETAILS[id]!;
  req.authActor = { id, role: "pharmacist", name: details.name };
  next();
}

export function requirePatient(req: AuthedRequest, res: Response, next: NextFunction): void {
  const id = decodeBearerId(req.headers.authorization);
  if (!id || PHARMACIST_IDS.has(id)) {
    res.status(401).json({ error: "Patient authentication required" });
    return;
  }
  // Look up the patient account so callers can rely on req.authActor.email
  db.select({ id: patientAccountsTable.id, email: patientAccountsTable.email, name: patientAccountsTable.name })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, id))
    .then(([patient]) => {
      if (!patient) {
        res.status(401).json({ error: "Patient account not found" });
        return;
      }
      req.authActor = { id: patient.id, role: "patient", name: patient.name, email: patient.email };
      next();
    })
    .catch((err) => {
      req.log?.error?.({ err }, "requirePatient lookup failed");
      res.status(500).json({ error: "Auth lookup failed" });
    });
}

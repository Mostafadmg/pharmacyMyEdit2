import type { Request, Response, NextFunction } from "express";

const PHARMACIST_IDS = new Set(["pharm-001", "pharm-002"]);
const PHARMACIST_DETAILS: Record<string, { name: string; role: string }> = {
  "pharm-001": { name: "Dr. Sarah Mitchell", role: "Pharmacist Prescriber (GPhC)" },
  "pharm-002": { name: "James Thornton", role: "Pharmacist Prescriber (GPhC)" },
};

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
  authActor?: { id: string; role: "pharmacist" | "patient"; name: string };
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
  req.authActor = { id, role: "patient", name: id };
  next();
}

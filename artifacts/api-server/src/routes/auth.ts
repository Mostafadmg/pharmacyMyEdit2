import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, patientAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { resolveAuthActor } from "../middlewares/auth";
import {
  findDuplicatePatientMatches,
  nextPmrNumber,
} from "../utils/patientIdentity";

const router = Router();

const PHARMACISTS = [
  {
    id: "pharm-001",
    username: "pharmacist",
    password: "pharmacare2024",
    name: "Dr. Sarah Mitchell",
    role: "Pharmacist Prescriber (GPhC)",
  },
  {
    id: "pharm-002",
    username: "admin",
    password: "admin123",
    name: "James Thornton",
    role: "Pharmacist Prescriber (GPhC)",
  },
];

function generateToken(id: string): string {
  const payload = `${id}:${Date.now()}`;
  return Buffer.from(payload).toString("base64");
}

function buildPatientResponse(patient: { id: string; name: string; email: string; pmrNumber?: string | null; dateOfBirth?: string | null; sex?: string | null; phone?: string | null; addressLine1?: string | null; addressLine2?: string | null; city?: string | null; postcode?: string | null }, token: string) {
  return {
    token,
    patientId: patient.id,
    pmrNumber: patient.pmrNumber ?? null,
    name: patient.name,
    email: patient.email,
    dateOfBirth: patient.dateOfBirth ?? null,
    sex: patient.sex ?? null,
    phone: patient.phone ?? null,
    addressLine1: patient.addressLine1 ?? null,
    addressLine2: patient.addressLine2 ?? null,
    city: patient.city ?? null,
    postcode: patient.postcode ?? null,
  };
}

router.post("/auth/pharmacist-login", (req, res) => {
  const { username, password } = req.body as { username: string; password: string };

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const pharmacist = PHARMACISTS.find(
    (p) => p.username === username && p.password === password
  );

  if (!pharmacist) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(pharmacist.id);

  return res.json({
    token,
    pharmacistName: pharmacist.name,
    pharmacistId: pharmacist.id,
    role: pharmacist.role,
  });
});

router.post("/auth/patient-register", async (req, res): Promise<void> => {
  const {
    name,
    email,
    password,
    dateOfBirth,
    sex,
    phone,
    addressLine1,
    addressLine2,
    city,
    postcode,
  } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    dateOfBirth?: string;
    sex?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postcode?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db
    .select({ id: patientAccountsTable.id })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.email, email.toLowerCase()));

  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();
  const pmrNumber = await nextPmrNumber();

  const duplicateMatches = await findDuplicatePatientMatches({
    patientName: name,
    dateOfBirth: dateOfBirth ?? null,
    patientEmail: email,
  });

  const [patient] = await db.insert(patientAccountsTable).values({
    id,
    pmrNumber,
    name,
    email: email.toLowerCase(),
    passwordHash,
    dateOfBirth: dateOfBirth ?? null,
    sex: sex ?? null,
    phone: phone ?? null,
    addressLine1: addressLine1 ?? null,
    addressLine2: addressLine2 ?? null,
    city: city ?? null,
    postcode: postcode ?? null,
  }).returning();

  const token = generateToken(id);
  res.status(201).json({
    ...buildPatientResponse(patient, token),
    duplicateWarning: duplicateMatches.length > 0,
    duplicatePatientMatches: duplicateMatches,
    recommendedPrimaryPatient: duplicateMatches.find((m) => m.isRecommendedPrimary) ?? duplicateMatches[0] ?? null,
  });
});

router.post("/auth/patient-login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.email, email.toLowerCase()));

  if (!patient) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, patient.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken(patient.id);
  res.json(buildPatientResponse(patient, token));
});

router.get("/auth/patient-me", async (req, res): Promise<void> => {
  const actor = await resolveAuthActor(req.headers.authorization);
  if (!actor || actor.role !== "patient") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, actor.id));

  if (!patient) {
    res.status(401).json({ error: "Patient account not found" });
    return;
  }

  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : generateToken(patient.id);

  res.json(buildPatientResponse(patient, token));
});

router.put("/auth/patient-profile", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let patientId: string;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    patientId = decoded.split(":")[0];
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const {
    addressLine1,
    addressLine2,
    city,
    postcode,
    phone,
    dateOfBirth,
    sex,
  } = req.body as Record<string, string | undefined>;

  const [updated] = await db
    .update(patientAccountsTable)
    .set({
      ...(addressLine1 !== undefined && { addressLine1 }),
      ...(addressLine2 !== undefined && { addressLine2 }),
      ...(city !== undefined && { city }),
      ...(postcode !== undefined && { postcode }),
      ...(phone !== undefined && { phone }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(sex !== undefined && { sex }),
    })
    .where(eq(patientAccountsTable.id, patientId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const token = generateToken(patientId);
  res.json(buildPatientResponse(updated, token));
});

export default router;

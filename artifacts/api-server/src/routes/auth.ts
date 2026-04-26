import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, patientAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

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
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();

  await db.insert(patientAccountsTable).values({
    id,
    name,
    email: email.toLowerCase(),
    passwordHash,
  });

  const token = generateToken(id);
  res.status(201).json({ token, patientId: id, name, email: email.toLowerCase() });
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
  res.json({ token, patientId: patient.id, name: patient.name, email: patient.email });
});

export default router;

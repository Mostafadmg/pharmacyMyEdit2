import { Router } from "express";

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

function generateToken(pharmacistId: string): string {
  const payload = `${pharmacistId}:${Date.now()}`;
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

export default router;

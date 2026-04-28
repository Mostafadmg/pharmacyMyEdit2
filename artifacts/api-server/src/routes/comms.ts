import { Router, type IRouter } from "express";
import { db, commsLogTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requirePharmacist, decodeBearerId } from "../middlewares/auth";

const router: IRouter = Router();

const PHARMACIST_NAMES: Record<string, string> = {
  "pharm-001": "Dr. Sarah Mitchell",
  "pharm-002": "James Thornton",
};

router.post("/admin/comms-log", requirePharmacist, async (req, res): Promise<void> => {
  const b = req.body as { patientEmail?: string; channel?: string; subject?: string; summary?: string; direction?: string };
  if (!b.patientEmail || !b.channel) {
    res.status(400).json({ error: "patientEmail and channel are required" });
    return;
  }
  const actorId = decodeBearerId(req.headers.authorization);
  const [entry] = await db.insert(commsLogTable).values({
    patientEmail: b.patientEmail.toLowerCase(),
    channel: b.channel,
    direction: b.direction === "inbound" ? "inbound" : "outbound",
    subject: b.subject ?? null,
    summary: b.summary ?? null,
    pharmacistId: actorId ?? null,
    pharmacistName: actorId ? (PHARMACIST_NAMES[actorId] ?? null) : null,
  }).returning();
  res.status(201).json({ entry });
});

router.get("/admin/comms-log/:email", requirePharmacist, async (req, res): Promise<void> => {
  const email = decodeURIComponent(req.params.email).toLowerCase();
  const entries = await db.select().from(commsLogTable).where(eq(commsLogTable.patientEmail, email)).orderBy(desc(commsLogTable.createdAt));
  res.json({ entries });
});

export default router;

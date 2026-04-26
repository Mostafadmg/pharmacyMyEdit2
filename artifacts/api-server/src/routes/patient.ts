import { Router, type IRouter } from "express";
import { db, consultationsTable, patientAccountsTable } from "@workspace/db";
// consultationsTable is used for cancel and list routes
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function decodePatientToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [patientId] = decoded.split(":");
    return patientId || null;
  } catch {
    return null;
  }
}

router.post("/patient/consultations/:id/cancel", async (req, res): Promise<void> => {
  const patientId = decodePatientToken(req.headers.authorization);
  if (!patientId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [patient] = await db.select().from(patientAccountsTable).where(eq(patientAccountsTable.id, patientId));
  if (!patient) { res.status(401).json({ error: "Patient account not found" }); return; }

  const consultationId = req.params.id;
  const [consultation] = await db.select().from(consultationsTable).where(eq(consultationsTable.id, consultationId));

  if (!consultation) { res.status(404).json({ error: "Consultation not found" }); return; }
  if (consultation.patientEmail.toLowerCase() !== patient.email.toLowerCase()) {
    res.status(403).json({ error: "You do not have permission to cancel this consultation" });
    return;
  }
  if (consultation.status !== "pending" && consultation.status !== "red_flag") {
    res.status(400).json({ error: "Only pending consultations can be cancelled" });
    return;
  }

  const [updated] = await db.update(consultationsTable).set({ status: "cancelled" }).where(eq(consultationsTable.id, consultationId)).returning();
  res.json({ success: true, consultation: updated });
});

router.get("/patient/consultations", async (req, res): Promise<void> => {
  const patientId = decodePatientToken(req.headers.authorization);

  if (!patientId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, patientId));

  if (!patient) {
    res.status(401).json({ error: "Patient account not found" });
    return;
  }

  const consultations = await db
    .select()
    .from(consultationsTable)
    .where(eq(consultationsTable.patientEmail, patient.email))
    .orderBy(desc(consultationsTable.createdAt));

  res.json({ consultations });
});

export default router;

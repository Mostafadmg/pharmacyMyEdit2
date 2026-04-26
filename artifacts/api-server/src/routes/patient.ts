import { Router, type IRouter } from "express";
import { db, consultationsTable, patientAccountsTable } from "@workspace/db";
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

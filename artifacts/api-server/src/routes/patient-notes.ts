import { Router } from "express";
import { db, pharmacistNotesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/patient-notes/:email", async (req, res): Promise<void> => {
  const { email } = req.params;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const notes = await db
    .select()
    .from(pharmacistNotesTable)
    .where(eq(pharmacistNotesTable.patientEmail, decodeURIComponent(email)))
    .orderBy(desc(pharmacistNotesTable.createdAt));
  res.json({ notes });
});

router.post("/patient-notes", async (req, res): Promise<void> => {
  const { patientEmail, note, createdBy } = req.body as { patientEmail: string; note: string; createdBy: string };
  if (!patientEmail || !note || !createdBy) {
    res.status(400).json({ error: "patientEmail, note, and createdBy are required" });
    return;
  }
  const [created] = await db.insert(pharmacistNotesTable).values({
    id: randomUUID(),
    patientEmail,
    note: note.trim(),
    createdBy,
  }).returning();
  res.json({ note: created });
});

router.put("/patient-notes/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { note, updatedBy } = req.body as { note: string; updatedBy: string };
  if (!note || !updatedBy) {
    res.status(400).json({ error: "note and updatedBy are required" });
    return;
  }
  const [updated] = await db
    .update(pharmacistNotesTable)
    .set({ note: note.trim(), updatedBy, updatedAt: new Date() })
    .where(eq(pharmacistNotesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({ note: updated });
});

router.delete("/patient-notes/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  await db.delete(pharmacistNotesTable).where(eq(pharmacistNotesTable.id, id));
  res.json({ success: true });
});

export default router;

import { Router, type Response } from "express";
import { db, consultationNotesTable, consultationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";

const router = Router();

function paramAsString(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v ?? "";
}

// GET /consultation-notes — all notes (for Notes hub page)
router.get("/consultation-notes", requirePharmacist, async (_req: AuthedRequest, res: Response): Promise<void> => {
  const notes = await db
    .select({
      id: consultationNotesTable.id,
      consultationId: consultationNotesTable.consultationId,
      note: consultationNotesTable.note,
      createdBy: consultationNotesTable.createdBy,
      createdById: consultationNotesTable.createdById,
      updatedBy: consultationNotesTable.updatedBy,
      createdAt: consultationNotesTable.createdAt,
      updatedAt: consultationNotesTable.updatedAt,
      patientName: consultationsTable.patientName,
      patientEmail: consultationsTable.patientEmail,
      conditionName: consultationsTable.conditionName,
    })
    .from(consultationNotesTable)
    .leftJoin(consultationsTable, eq(consultationNotesTable.consultationId, consultationsTable.id))
    .orderBy(desc(consultationNotesTable.createdAt));
  res.json({ notes });
});

router.get("/consultation-notes/:consultationId", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const consultationId = paramAsString(req.params.consultationId);
  if (!consultationId) {
    res.status(400).json({ error: "consultationId is required" });
    return;
  }
  const notes = await db
    .select()
    .from(consultationNotesTable)
    .where(eq(consultationNotesTable.consultationId, consultationId))
    .orderBy(desc(consultationNotesTable.createdAt));
  res.json({ notes });
});

router.post("/consultation-notes", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const { consultationId, note } = req.body as { consultationId?: string; note?: string };
  if (!consultationId || !note?.trim()) {
    res.status(400).json({ error: "consultationId and note are required" });
    return;
  }
  if (note.length > 5000) {
    res.status(400).json({ error: "Note is too long (max 5000 characters)" });
    return;
  }
  const [consultation] = await db
    .select({ id: consultationsTable.id })
    .from(consultationsTable)
    .where(eq(consultationsTable.id, consultationId));
  if (!consultation) {
    res.status(404).json({ error: "Consultation not found" });
    return;
  }
  const [created] = await db.insert(consultationNotesTable).values({
    id: randomUUID(),
    consultationId,
    note: note.trim(),
    createdById: req.authActor!.id,
    createdBy: req.authActor!.name,
  }).returning();
  res.json({ note: created });
});

router.put("/consultation-notes/:id", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = paramAsString(req.params.id);
  const { note } = req.body as { note?: string };
  if (!id || !note?.trim()) {
    res.status(400).json({ error: "id and note are required" });
    return;
  }
  if (note.length > 5000) {
    res.status(400).json({ error: "Note is too long (max 5000 characters)" });
    return;
  }
  const [existing] = await db.select().from(consultationNotesTable).where(eq(consultationNotesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  if (existing.createdById !== req.authActor!.id) {
    res.status(403).json({ error: "Only the original author can edit this note" });
    return;
  }
  const [updated] = await db
    .update(consultationNotesTable)
    .set({ note: note.trim(), updatedBy: req.authActor!.name, updatedAt: new Date() })
    .where(eq(consultationNotesTable.id, id))
    .returning();
  res.json({ note: updated });
});

router.delete("/consultation-notes/:id", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = paramAsString(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const [existing] = await db.select().from(consultationNotesTable).where(eq(consultationNotesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  if (existing.createdById !== req.authActor!.id) {
    res.status(403).json({ error: "Only the original author can delete this note" });
    return;
  }
  await db.delete(consultationNotesTable).where(eq(consultationNotesTable.id, id));
  res.json({ success: true });
});

export default router;

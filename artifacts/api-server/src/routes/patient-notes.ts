import { Router, type Response } from "express";
import { db, pharmacistNotesTable, patientAccountsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";

const router = Router();

function paramAsString(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v ?? "";
}

router.get("/patient-notes", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const rows = await db
    .select({
      id: pharmacistNotesTable.id,
      patientEmail: pharmacistNotesTable.patientEmail,
      note: pharmacistNotesTable.note,
      createdBy: pharmacistNotesTable.createdBy,
      createdById: pharmacistNotesTable.createdById,
      updatedBy: pharmacistNotesTable.updatedBy,
      createdAt: pharmacistNotesTable.createdAt,
      updatedAt: pharmacistNotesTable.updatedAt,
      patientName: patientAccountsTable.name,
    })
    .from(pharmacistNotesTable)
    .leftJoin(patientAccountsTable, eq(patientAccountsTable.email, pharmacistNotesTable.patientEmail))
    .orderBy(desc(pharmacistNotesTable.createdAt));
  res.json({ notes: rows });
});

router.get("/patient-notes/:email", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const email = paramAsString(req.params.email);
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const rows = await db
    .select({
      id: pharmacistNotesTable.id,
      patientEmail: pharmacistNotesTable.patientEmail,
      note: pharmacistNotesTable.note,
      createdBy: pharmacistNotesTable.createdBy,
      createdById: pharmacistNotesTable.createdById,
      updatedBy: pharmacistNotesTable.updatedBy,
      createdAt: pharmacistNotesTable.createdAt,
      updatedAt: pharmacistNotesTable.updatedAt,
      patientName: patientAccountsTable.name,
    })
    .from(pharmacistNotesTable)
    .leftJoin(patientAccountsTable, eq(patientAccountsTable.email, pharmacistNotesTable.patientEmail))
    .where(eq(pharmacistNotesTable.patientEmail, decodeURIComponent(email)))
    .orderBy(desc(pharmacistNotesTable.createdAt));
  res.json({ notes: rows });
});

router.post("/patient-notes", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const { patientEmail, note } = req.body as { patientEmail?: string; note?: string };
  if (!patientEmail || !note?.trim()) {
    res.status(400).json({ error: "patientEmail and note are required" });
    return;
  }
  const [created] = await db.insert(pharmacistNotesTable).values({
    id: randomUUID(),
    patientEmail,
    note: note.trim(),
    createdBy: req.authActor!.name,
  }).returning();
  res.json({ note: created });
});

router.put("/patient-notes/:id", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = paramAsString(req.params.id);
  const { note } = req.body as { note?: string };
  if (!id || !note?.trim()) {
    res.status(400).json({ error: "id and note are required" });
    return;
  }
  const [existing] = await db
    .select()
    .from(pharmacistNotesTable)
    .where(eq(pharmacistNotesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  if (existing.createdBy !== req.authActor!.name) {
    res.status(403).json({ error: "Only the original author can edit this note" });
    return;
  }
  const [updated] = await db
    .update(pharmacistNotesTable)
    .set({ note: note.trim(), updatedBy: req.authActor!.name, updatedAt: new Date() })
    .where(eq(pharmacistNotesTable.id, id))
    .returning();
  res.json({ note: updated });
});

router.delete("/patient-notes/:id", requirePharmacist, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = paramAsString(req.params.id);
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const [existing] = await db
    .select()
    .from(pharmacistNotesTable)
    .where(eq(pharmacistNotesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  if (existing.createdBy !== req.authActor!.name) {
    res.status(403).json({ error: "Only the original author can delete this note" });
    return;
  }
  await db.delete(pharmacistNotesTable).where(eq(pharmacistNotesTable.id, id));
  res.json({ success: true });
});

export default router;

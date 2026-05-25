import { Router, type IRouter } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requirePharmacist } from "../middlewares/auth";
import {
  readDocumentRejectionTemplates,
  writeDocumentRejectionTemplates,
  type DocumentRejectionTemplate,
} from "../lib/documentRejectionTemplatesStore";

const router: IRouter = Router();

const TemplateSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1).max(120),
  docSlotIds: z.array(z.string()).default([]),
  emailSubject: z.string().min(1).max(200),
  emailBody: z.string().min(1).max(4000),
});

const PutTemplatesBody = z.object({
  templates: z.array(TemplateSchema).min(1).max(50),
});

router.get(
  "/pharmacist-settings/document-rejection-templates",
  requirePharmacist,
  async (_req, res): Promise<void> => {
    const templates = await readDocumentRejectionTemplates();
    res.json({ templates });
  },
);

router.put(
  "/pharmacist-settings/document-rejection-templates",
  requirePharmacist,
  async (req, res): Promise<void> => {
    const parsed = PutTemplatesBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const templates: DocumentRejectionTemplate[] = parsed.data.templates.map(
      (t) => ({
        id: t.id?.trim() || randomUUID(),
        title: t.title.trim(),
        docSlotIds: t.docSlotIds,
        emailSubject: t.emailSubject.trim(),
        emailBody: t.emailBody.trim(),
      }),
    );

    const saved = await writeDocumentRejectionTemplates(templates);
    res.json({ templates: saved });
  },
);

export default router;

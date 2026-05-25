import fs from "fs/promises";
import path from "path";

export type DocumentRejectionTemplate = {
  id: string;
  title: string;
  /** Empty = applies to all document types */
  docSlotIds: string[];
  emailSubject: string;
  emailBody: string;
};

export const DEFAULT_DOCUMENT_REJECTION_TEMPLATES: DocumentRejectionTemplate[] = [
  {
    id: "invalid-photo-scale",
    title: "Invalid photo — scale not readable",
    docSlotIds: ["weight-scale-video"],
    emailSubject: "Please re-upload your weight scale video",
    emailBody:
      "The reading on your scale was not clear in your video. Please record a new clip with the display in focus, good lighting, and the weight clearly visible.",
  },
  {
    id: "invalid-photo-id",
    title: "Invalid photo — ID not clear",
    docSlotIds: ["government-id"],
    emailSubject: "Please re-upload your ID",
    emailBody:
      "We could not verify your government-issued ID. Please upload a new photo showing all four corners of the document, with no glare and text that is easy to read.",
  },
  {
    id: "invalid-full-body",
    title: "Invalid video — full body not visible",
    docSlotIds: ["full-body-video"],
    emailSubject: "Please re-upload your full body video",
    emailBody:
      "Your full body was not fully visible in the video. Please upload a new recording showing your whole body from head to toe in fitted clothing, as described in the instructions.",
  },
  {
    id: "wrong-document",
    title: "Wrong document uploaded",
    docSlotIds: [],
    emailSubject: "Please upload the correct document",
    emailBody:
      "The file you uploaded does not match what we requested for this step. Please use the secure link below to upload the correct document.",
  },
  {
    id: "expired-prescription",
    title: "Previous prescription — out of date",
    docSlotIds: ["previous-prescription"],
    emailSubject: "Please upload a current prescription",
    emailBody:
      "The prescription copy provided appears to be out of date or incomplete. Please upload a clear photo of your most recent prescription label or dispensing label.",
  },
];

const SETTINGS_DIR = path.join(process.cwd(), "data");
const TEMPLATES_FILE = path.join(SETTINGS_DIR, "document-rejection-templates.json");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
}

export async function readDocumentRejectionTemplates(): Promise<
  DocumentRejectionTemplate[]
> {
  try {
    const raw = await fs.readFile(TEMPLATES_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_DOCUMENT_REJECTION_TEMPLATES];
    }
    return parsed as DocumentRejectionTemplate[];
  } catch {
    return [...DEFAULT_DOCUMENT_REJECTION_TEMPLATES];
  }
}

export async function writeDocumentRejectionTemplates(
  templates: DocumentRejectionTemplate[],
): Promise<DocumentRejectionTemplate[]> {
  await ensureDataDir();
  const normalized = templates.map((t) => ({
    id: t.id.trim(),
    title: t.title.trim(),
    docSlotIds: Array.isArray(t.docSlotIds) ? t.docSlotIds : [],
    emailSubject: t.emailSubject.trim(),
    emailBody: t.emailBody.trim(),
  }));
  await fs.writeFile(
    TEMPLATES_FILE,
    JSON.stringify(normalized, null, 2),
    "utf-8",
  );
  return normalized;
}

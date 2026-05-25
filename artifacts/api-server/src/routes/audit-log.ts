import { Router, type Response } from "express";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";
import fs from "fs";
import path from "path";

const router = Router();

// Writes to <project-root>/logs/patient-edit-audit.log
const LOG_FILE = path.resolve(process.cwd(), "logs", "patient-edit-audit.log");

function ensureLogFile() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

router.post(
  "/audit-log",
  requirePharmacist,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const { consultationId, changes, editedBy } = req.body as {
      consultationId?: string;
      changes?: Array<{ field: string; from: string; to: string }>;
      editedBy?: string;
    };

    if (
      !consultationId ||
      !Array.isArray(changes) ||
      changes.length === 0
    ) {
      res.status(400).json({ error: "consultationId and changes[] are required" });
      return;
    }

    const timestamp = new Date().toISOString();
    const actor = editedBy ?? req.authActor?.name ?? "Unknown pharmacist";

    const lines = [
      `────────────────────────────────────────`,
      `Timestamp  : ${timestamp}`,
      `Consultation: ${consultationId}`,
      `Editor     : ${actor}`,
      `Changes (${changes.length}):`,
      ...changes.map(
        (c) => `  • ${c.field}: "${c.from || "—"}" → "${c.to || "—"}"`,
      ),
      ``,
    ];

    try {
      ensureLogFile();
      fs.appendFileSync(LOG_FILE, lines.join("\n") + "\n");
      res.json({ logged: true, entries: changes.length });
    } catch (err) {
      console.error("[audit-log] Failed to write log file:", err);
      // Never fail silently for the caller — still respond OK so the UI
      // doesn't surface an error, but include a warning flag.
      res.status(500).json({ logged: false, error: "Could not write audit log file" });
    }
  },
);

export default router;

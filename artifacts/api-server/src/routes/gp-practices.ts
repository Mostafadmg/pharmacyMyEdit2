import { Router } from "express";
import { z } from "zod";
import { getGpPracticeByOdsCode, searchGpPractices } from "../utils/nhsOds";

const router = Router();

router.get("/gp-practices/search", async (req, res): Promise<void> => {
  const parsed = z
    .object({
      q: z.string().min(2).max(120),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    })
    .safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const results = await searchGpPractices({
      q: parsed.data.q,
      limit: parsed.data.limit,
    });
    res.json({ results, source: "nhs-ods" });
  } catch (err) {
    req.log?.error?.({ err }, "GP practice search failed");
    res.status(502).json({
      error:
        err instanceof Error
          ? err.message
          : "Could not search NHS GP register",
    });
  }
});

router.get("/gp-practices/:odsCode", async (req, res): Promise<void> => {
  const code = Array.isArray(req.params.odsCode)
    ? req.params.odsCode[0]
    : req.params.odsCode;

  if (!code?.trim()) {
    res.status(400).json({ error: "ODS code required" });
    return;
  }

  try {
    const practice = await getGpPracticeByOdsCode(code);
    if (!practice) {
      res.status(404).json({ error: "GP practice not found in NHS register" });
      return;
    }
    res.json({ practice, source: "nhs-ods" });
  } catch (err) {
    req.log?.error?.({ err }, "GP practice lookup failed");
    res.status(502).json({
      error:
        err instanceof Error
          ? err.message
          : "Could not load GP practice from NHS register",
    });
  }
});

export default router;

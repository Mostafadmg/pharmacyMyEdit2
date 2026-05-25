import { Router } from "express";
import { z } from "zod";

const router = Router();

type PostcodeAutocompleteResponse = {
  status: number;
  result?: string[];
};

type PostcodeLookupResponse = {
  status: number;
  result?: {
    postcode: string;
    admin_district?: string;
    admin_county?: string;
    parish?: string;
    region?: string;
    country?: string;
  };
};

router.get("/postcodes/autocomplete", async (req, res): Promise<void> => {
  const parsed = z
    .object({
      q: z.string().min(2).max(12),
      limit: z.coerce.number().int().min(1).max(20).optional(),
    })
    .safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const q = parsed.data.q.trim().replace(/\s+/g, "");
  const limit = parsed.data.limit ?? 8;

  try {
    const upstream = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(q)}/autocomplete?limit=${limit}`,
    );
    const data = (await upstream.json()) as PostcodeAutocompleteResponse;
    if (data.status !== 200 || !data.result) {
      res.json({ suggestions: [] });
      return;
    }
    res.json({ suggestions: data.result, source: "postcodes.io" });
  } catch (err) {
    req.log?.error?.({ err }, "Postcode autocomplete failed");
    res.status(502).json({ error: "Postcode autocomplete unavailable" });
  }
});

router.get("/postcodes/resolve/:postcode", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.postcode)
    ? req.params.postcode[0]
    : req.params.postcode;
  const postcode = raw?.trim().replace(/\s+/g, " ").toUpperCase();
  if (!postcode || postcode.length < 5) {
    res.status(400).json({ error: "Enter a valid UK postcode" });
    return;
  }

  try {
    const compact = postcode.replace(/\s+/g, "");
    const upstream = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(compact)}`,
    );
    const data = (await upstream.json()) as PostcodeLookupResponse;
    if (data.status !== 200 || !data.result) {
      res.status(404).json({ error: "Postcode not found" });
      return;
    }
    const r = data.result;
    res.json({
      postcode: r.postcode,
      city: r.admin_district ?? r.parish ?? r.region ?? "",
      county: r.admin_county ?? "",
      country: r.country ?? "United Kingdom",
      source: "postcodes.io",
    });
  } catch (err) {
    req.log?.error?.({ err }, "Postcode resolve failed");
    res.status(502).json({ error: "Postcode lookup unavailable" });
  }
});

export default router;

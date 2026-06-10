import { Router, type IRouter, type Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  db,
  patientAccountsTable,
  ordersTable,
  orderItemsTable,
  consultationsTable,
  consultationMessagesTable,
  notificationsTable,
  referralCreditsTable,
  promoCodesTable,
} from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { decodeBearerId, requirePatient, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

/* ---------- referral helpers ---------- */

function makeReferralCode(seed: string): string {
  const slug = seed.split("@")[0]!.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "FRIEND";
  const noise = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${slug}${noise}`;
}

async function ensureReferralCode(patientId: string, email: string): Promise<string> {
  const [row] = await db
    .select({ code: patientAccountsTable.referralCode })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, patientId));
  if (row?.code) return row.code;
  // Try a few times in the unlikely event of a collision.
  for (let i = 0; i < 5; i++) {
    const candidate = makeReferralCode(email);
    try {
      const [updated] = await db
        .update(patientAccountsTable)
        .set({ referralCode: candidate })
        .where(eq(patientAccountsTable.id, patientId))
        .returning({ code: patientAccountsTable.referralCode });
      if (updated?.code) return updated.code;
    } catch {
      /* unique violation — retry */
    }
  }
  throw new Error("Could not allocate referral code");
}

async function creditsBalance(emailLower: string): Promise<number> {
  const [row] = await db
    .select({ s: sql<number>`COALESCE(SUM(${referralCreditsTable.amountPence}), 0)::int` })
    .from(referralCreditsTable)
    .where(eq(referralCreditsTable.patientEmail, emailLower));
  return row?.s ?? 0;
}

/* ---------- /api/patient/preferences ---------- */

router.get("/patient/preferences", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = req.authActor!.id;
  const [row] = await db
    .select({
      commsEmail: patientAccountsTable.commsEmail,
      commsSms: patientAccountsTable.commsSms,
      marketingOptIn: patientAccountsTable.marketingOptIn,
    })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, id));
  res.json(row ?? { commsEmail: true, commsSms: false, marketingOptIn: false });
});

router.put("/patient/preferences", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = req.authActor!.id;
  const b = req.body as { commsEmail?: boolean; commsSms?: boolean; marketingOptIn?: boolean };
  const patch: Record<string, boolean> = {};
  if (typeof b.commsEmail === "boolean") patch.commsEmail = b.commsEmail;
  if (typeof b.commsSms === "boolean") patch.commsSms = b.commsSms;
  if (typeof b.marketingOptIn === "boolean") patch.marketingOptIn = b.marketingOptIn;
  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "No preferences to update" });
    return;
  }
  const [updated] = await db
    .update(patientAccountsTable)
    .set(patch)
    .where(eq(patientAccountsTable.id, id))
    .returning({
      commsEmail: patientAccountsTable.commsEmail,
      commsSms: patientAccountsTable.commsSms,
      marketingOptIn: patientAccountsTable.marketingOptIn,
    });
  res.json(updated);
});

/* ---------- /api/patient/password (change) ---------- */

router.post("/patient/password", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = req.authActor!.id;
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new passwords are required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }
  const [account] = await db
    .select({ hash: patientAccountsTable.passwordHash })
    .from(patientAccountsTable)
    .where(eq(patientAccountsTable.id, id));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const ok = await bcrypt.compare(currentPassword, account.hash);
  if (!ok) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(patientAccountsTable).set({ passwordHash: hash }).where(eq(patientAccountsTable.id, id));
  res.json({ ok: true });
});

/* ---------- /api/patient/data-export (GDPR) ---------- */

router.get("/patient/data-export", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = req.authActor!.id;
  const email = req.authActor!.email!.toLowerCase();
  const [account] = await db.select().from(patientAccountsTable).where(eq(patientAccountsTable.id, id));
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  const orders = await db.select().from(ordersTable).where(eq(ordersTable.customerEmail, email));
  const orderIds = orders.map(o => o.id);
  const items = orderIds.length
    ? await db.select().from(orderItemsTable).where(sql`${orderItemsTable.orderId} = ANY(${orderIds})`)
    : [];
  const consults = await db.select().from(consultationsTable).where(sql`lower(${consultationsTable.patientEmail}) = ${email}`);
  const messages = await db.select().from(consultationMessagesTable).where(sql`lower(${consultationMessagesTable.senderEmail}) = ${email}`);
  const notifications = await db.select().from(notificationsTable).where(sql`lower(${notificationsTable.recipientKey}) = ${email}`);
  const credits = await db.select().from(referralCreditsTable).where(eq(referralCreditsTable.patientEmail, email));

  const payload = {
    exportedAt: new Date().toISOString(),
    note:
      "This file contains every personal record we hold about your EveryDayMeds account. " +
      "Keep it safe — it includes clinical and order history.",
    account: { ...account, passwordHash: undefined },
    orders,
    orderItems: items,
    consultations: consults,
    consultationMessages: messages,
    notifications,
    referralCredits: credits,
  };
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="pharmacare-data-${email}-${Date.now()}.json"`);
  res.status(200).send(JSON.stringify(payload, null, 2));
});

/* ---------- /api/patient/account-deletion (request / cancel) ---------- */

router.post("/patient/account-deletion", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = req.authActor!.id;
  const [updated] = await db
    .update(patientAccountsTable)
    .set({ deletionRequestedAt: new Date() })
    .where(eq(patientAccountsTable.id, id))
    .returning({ deletionRequestedAt: patientAccountsTable.deletionRequestedAt });
  req.log?.info?.({ patientId: id }, "Patient requested account deletion");
  res.json({ deletionRequestedAt: updated?.deletionRequestedAt ?? null });
});

router.delete("/patient/account-deletion", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = req.authActor!.id;
  await db
    .update(patientAccountsTable)
    .set({ deletionRequestedAt: null })
    .where(eq(patientAccountsTable.id, id));
  res.json({ deletionRequestedAt: null });
});

/* ---------- /api/patient/referral ---------- */

router.get("/patient/referral", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const id = req.authActor!.id;
  const email = req.authActor!.email!.toLowerCase();
  const code = await ensureReferralCode(id, email);
  const balance = await creditsBalance(email);
  const history = await db
    .select()
    .from(referralCreditsTable)
    .where(eq(referralCreditsTable.patientEmail, email))
    .orderBy(desc(referralCreditsTable.createdAt))
    .limit(50);
  res.json({ code, balancePence: balance, history });
});

/* ---------- /api/promo-codes/validate ---------- */

router.post("/promo-codes/validate", async (req, res): Promise<void> => {
  const { code, subtotalPence } = req.body as { code?: string; subtotalPence?: number };
  if (!code?.trim()) {
    res.status(400).json({ error: "Code is required" });
    return;
  }
  const sub = Math.max(0, Math.floor(Number(subtotalPence) || 0));
  const [promo] = await db
    .select()
    .from(promoCodesTable)
    .where(eq(promoCodesTable.code, code.trim().toUpperCase()));
  if (!promo || !promo.active) {
    res.status(404).json({ error: "That code isn't valid." });
    return;
  }
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    res.status(410).json({ error: "This code has expired." });
    return;
  }
  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    res.status(410).json({ error: "This code has been fully redeemed." });
    return;
  }
  if (sub < promo.minSubtotalPence) {
    res.status(409).json({
      error: `Spend at least £${(promo.minSubtotalPence / 100).toFixed(2)} to use this code.`,
    });
    return;
  }
  const discount =
    promo.kind === "percent"
      ? Math.min(sub, Math.floor((sub * promo.discountValue) / 100))
      : Math.min(sub, promo.discountValue);
  res.json({ code: promo.code, label: promo.label, discountPence: discount });
});

/* ---------- /api/auth/patient-upgrade-guest ----------
 * Guest who placed an order can claim it by setting a password.
 * They prove ownership by sending the order id + orderNumber from their
 * confirmation page — same key the OrderConfirmation page already holds.
 */

const upgradeAttempts = new Map<string, { count: number; firstAt: number }>();
const UPGRADE_WINDOW_MS = 60 * 60 * 1000;
const UPGRADE_MAX_PER_WINDOW = 5;

router.post("/auth/patient-upgrade-guest", async (req, res): Promise<void> => {
  const { orderId, orderKey, password, name, email: providedEmail } = req.body as {
    orderId?: string;
    orderKey?: string;
    password?: string;
    name?: string;
    email?: string;
  };
  const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
  const slot = upgradeAttempts.get(ip);
  const nowMs = Date.now();
  if (slot && nowMs - slot.firstAt < UPGRADE_WINDOW_MS) {
    if (slot.count >= UPGRADE_MAX_PER_WINDOW) {
      res.status(429).json({ error: "Too many attempts. Please try again later." });
      return;
    }
    slot.count++;
  } else {
    upgradeAttempts.set(ip, { count: 1, firstAt: nowMs });
  }

  if (!orderId || !orderKey || !password || !providedEmail) {
    res.status(400).json({ error: "Order id, order key, email and password are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  const emailMatches = !!order && order.customerEmail.toLowerCase() === providedEmail.trim().toLowerCase();
  if (!order || order.orderNumber.toUpperCase() !== orderKey.toUpperCase() || !emailMatches) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const email = order.customerEmail.toLowerCase();
  const [existing] = await db.select().from(patientAccountsTable).where(eq(patientAccountsTable.email, email));
  if (existing) {
    res.status(409).json({ error: "An account already exists for this email — please sign in instead." });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();
  const [patient] = await db
    .insert(patientAccountsTable)
    .values({
      id,
      name: name?.trim() || order.customerName,
      email,
      passwordHash,
      phone: order.customerPhone ?? null,
      addressLine1: (order.shippingAddress as { line1?: string })?.line1 ?? null,
      addressLine2: (order.shippingAddress as { line2?: string })?.line2 ?? null,
      city: (order.shippingAddress as { city?: string })?.city ?? null,
      postcode: (order.shippingAddress as { postcode?: string })?.postcode ?? null,
    })
    .returning();
  const token = Buffer.from(`${id}:${Date.now()}`).toString("base64");
  res.status(201).json({
    token,
    patientId: patient.id,
    name: patient.name,
    email: patient.email,
  });
});

/* ---------- /api/patient/prescriptions ----------
 * Convenience endpoint for the prescriptions tab — returns RX-bearing
 * orders only with their consultation summary already joined.
 */
router.get("/patient/prescriptions", requirePatient, async (req: AuthedRequest, res: Response): Promise<void> => {
  const email = req.authActor!.email!.toLowerCase();
  const orders = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.customerEmail, email), sql`${ordersTable.consultationId} IS NOT NULL`))
    .orderBy(desc(ordersTable.createdAt));

  if (orders.length === 0) {
    res.json({ prescriptions: [] });
    return;
  }
  const consultIds = orders
    .map(o => o.consultationId)
    .filter((id): id is string => !!id);
  const consults = consultIds.length
    ? await db
        .select()
        .from(consultationsTable)
        .where(sql`${consultationsTable.id} = ANY(${consultIds})`)
    : [];
  const cById = new Map(consults.map(c => [c.id, c]));
  const items = await db
    .select()
    .from(orderItemsTable)
    .where(sql`${orderItemsTable.orderId} = ANY(${orders.map(o => o.id)})`);
  const itemsByOrder = new Map<string, typeof items>();
  for (const it of items) {
    const arr = itemsByOrder.get(it.orderId) ?? [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  res.json({
    prescriptions: orders.map(o => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      status: o.status,
      consultationId: o.consultationId,
      consultation: o.consultationId ? cById.get(o.consultationId) ?? null : null,
      items: itemsByOrder.get(o.id) ?? [],
    })),
  });
});

export default router;

/* ---------- helpers re-exported for orders.ts ---------- */
export { creditsBalance, ensureReferralCode };

/**
 * Look up a promo code WITHOUT incrementing usage. Returns the row + the
 * discount in pence (capped at the subtotal) or null if invalid.
 * Used by orders.ts to recompute totals server-side at order creation.
 */
export async function evaluatePromo(
  code: string | undefined | null,
  subtotalPence: number,
): Promise<{ promo: typeof promoCodesTable.$inferSelect; discountPence: number } | null> {
  if (!code?.trim()) return null;
  const [promo] = await db
    .select()
    .from(promoCodesTable)
    .where(eq(promoCodesTable.code, code.trim().toUpperCase()));
  if (!promo || !promo.active) return null;
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) return null;
  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) return null;
  if (subtotalPence < promo.minSubtotalPence) return null;
  const discountPence =
    promo.kind === "percent"
      ? Math.min(subtotalPence, Math.floor((subtotalPence * promo.discountValue) / 100))
      : Math.min(subtotalPence, promo.discountValue);
  return { promo, discountPence };
}

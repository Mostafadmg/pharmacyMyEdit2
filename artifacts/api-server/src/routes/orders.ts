import { Router, type IRouter } from "express";
import { db, productsTable, ordersTable, orderItemsTable, deliveriesTable, patientAccountsTable } from "@workspace/db";
import { eq, desc, inArray, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { decodeBearerId, requirePharmacist } from "../middlewares/auth";
import { isStripeEnabled } from "../lib/stripe";

const router: IRouter = Router();

const PHARMACIST_IDS = new Set(["pharm-001", "pharm-002"]);

function paramAsString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function generateOrderNumber(): string {
  const yr = new Date().getFullYear().toString().slice(-2);
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PC${yr}-${rand}`;
}

function generateTrackingNumber(): string {
  const rand = Math.random().toString(36).slice(2, 11).toUpperCase();
  return `PCEX${rand}`;
}

type CartItemInput = { productId: string; quantity: number };
type ShippingAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  postcode: string;
  country?: string;
};

router.post("/orders", async (req, res): Promise<void> => {
  const b = req.body as {
    items?: CartItemInput[];
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    shippingAddress?: ShippingAddress;
    notes?: string;
  };

  if (!Array.isArray(b.items) || b.items.length === 0) {
    res.status(400).json({ error: "Order must contain at least one item" });
    return;
  }
  if (b.items.length > 50) {
    res.status(400).json({ error: "Too many items in order" });
    return;
  }
  if (!b.customerName?.trim() || !b.customerEmail?.trim()) {
    res.status(400).json({ error: "Customer name and email are required" });
    return;
  }
  const addr = b.shippingAddress;
  if (!addr?.line1?.trim() || !addr?.city?.trim() || !addr?.postcode?.trim()) {
    res.status(400).json({ error: "Shipping address (line1, city, postcode) is required" });
    return;
  }

  const productIds = Array.from(new Set(b.items.map(i => i.productId)));
  const products = await db.select().from(productsTable).where(inArray(productsTable.id, productIds));
  const productById = new Map(products.map(p => [p.id, p]));

  let itemsTotal = 0;
  const itemRows: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    imageUrl: string | null;
    unitPriceGbp: number;
    quantity: number;
    lineTotalGbp: number;
  }> = [];

  for (const ci of b.items) {
    const p = productById.get(ci.productId);
    if (!p || !p.active) {
      res.status(400).json({ error: `Product not available: ${ci.productId}` });
      return;
    }
    const qty = Math.max(1, Math.min(20, Math.floor(Number(ci.quantity) || 1)));
    if (p.stock < qty) {
      res.status(400).json({ error: `Insufficient stock for ${p.name}` });
      return;
    }
    const lineTotal = p.priceGbp * qty;
    itemsTotal += lineTotal;
    itemRows.push({
      id: randomUUID(),
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      imageUrl: p.imageUrl,
      unitPriceGbp: p.priceGbp,
      quantity: qty,
      lineTotalGbp: lineTotal,
    });
  }

  const shipping = itemsTotal >= 2500 ? 0 : 299;
  const total = itemsTotal + shipping;

  // Optional patient ownership: link if logged-in patient
  const actorId = decodeBearerId(req.headers.authorization);
  let linkedEmail = b.customerEmail.trim().toLowerCase();
  if (actorId && !PHARMACIST_IDS.has(actorId)) {
    const [p] = await db.select().from(patientAccountsTable).where(eq(patientAccountsTable.id, actorId)).limit(1);
    if (p) linkedEmail = p.email.toLowerCase();
  }

  const orderId = randomUUID();
  const orderNumber = generateOrderNumber();
  const stripeOn = isStripeEnabled();

  const [order] = await db.insert(ordersTable).values({
    id: orderId,
    orderNumber,
    customerEmail: linkedEmail,
    customerName: b.customerName.trim(),
    customerPhone: b.customerPhone?.trim() || null,
    shippingAddress: {
      line1: addr.line1.trim(),
      line2: addr.line2?.trim() || "",
      city: addr.city.trim(),
      postcode: addr.postcode.trim().toUpperCase(),
      country: addr.country?.trim() || "United Kingdom",
    },
    itemsTotalGbp: itemsTotal,
    shippingGbp: shipping,
    totalGbp: total,
    status: stripeOn ? "pending_payment" : "paid",
    paymentStatus: stripeOn ? "pending" : "paid_demo",
    notes: b.notes?.trim() || null,
  }).returning();

  await db.insert(orderItemsTable).values(itemRows.map(r => ({ ...r, orderId })));

  // Decrement stock
  for (const r of itemRows) {
    await db.update(productsTable)
      .set({ stock: sql`${productsTable.stock} - ${r.quantity}` })
      .where(eq(productsTable.id, r.productId));
  }

  // Create delivery
  const trackingNumber = generateTrackingNumber();
  const eta = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  await db.insert(deliveriesTable).values({
    id: randomUUID(),
    orderId,
    carrier: "PharmaCare Express",
    trackingNumber,
    status: "preparing",
    estimatedDelivery: eta,
    events: [
      { ts: new Date().toISOString(), status: "preparing", message: "Order received and being prepared by our pharmacy team." }
    ],
  });

  res.status(201).json({ order, items: itemRows, trackingNumber, estimatedDelivery: eta });
});

router.get("/orders", async (req, res): Promise<void> => {
  const actorId = decodeBearerId(req.headers.authorization);
  const isPharmacist = actorId && PHARMACIST_IDS.has(actorId);

  if (isPharmacist) {
    const status = paramAsString(req.query.status as string | string[] | undefined);
    const email = paramAsString(req.query.email as string | string[] | undefined);
    const conditions = [];
    if (status && status !== "all") conditions.push(eq(ordersTable.status, status));
    if (email) conditions.push(eq(ordersTable.customerEmail, email.toLowerCase()));
    const orders = await db
      .select()
      .from(ordersTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(ordersTable.createdAt))
      .limit(200);

    if (orders.length === 0) {
      res.json({ orders: [] });
      return;
    }

    const orderIds = orders.map(o => o.id);
    const [allItems, allDeliveries] = await Promise.all([
      db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds)),
      db.select().from(deliveriesTable).where(inArray(deliveriesTable.orderId, orderIds)),
    ]);
    const itemsByOrder = new Map<string, typeof allItems>();
    for (const it of allItems) {
      const arr = itemsByOrder.get(it.orderId) ?? [];
      arr.push(it);
      itemsByOrder.set(it.orderId, arr);
    }
    const deliveryByOrder = new Map(allDeliveries.map(d => [d.orderId, d]));

    const enriched = orders.map(o => ({
      ...o,
      items: itemsByOrder.get(o.id) ?? [],
      delivery: deliveryByOrder.get(o.id) ?? null,
    }));
    res.json({ orders: enriched });
    return;
  }

  if (!actorId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const [patient] = await db.select().from(patientAccountsTable).where(eq(patientAccountsTable.id, actorId)).limit(1);
  if (!patient) {
    res.status(401).json({ error: "Patient not found" });
    return;
  }
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, patient.email.toLowerCase()))
    .orderBy(desc(ordersTable.createdAt));
  res.json({ orders });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const orderId = req.params.id;
  const actorId = decodeBearerId(req.headers.authorization);
  const isPharmacist = actorId ? PHARMACIST_IDS.has(actorId) : false;
  const guestKey = paramAsString(req.query.key as string | string[] | undefined);

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (!isPharmacist) {
    const isPatientOwner = await (async () => {
      if (!actorId) return false;
      const [patient] = await db.select().from(patientAccountsTable).where(eq(patientAccountsTable.id, actorId)).limit(1);
      return !!patient && patient.email.toLowerCase() === order.customerEmail.toLowerCase();
    })();
    const hasGuestKey = guestKey && guestKey.toUpperCase() === order.orderNumber.toUpperCase();
    if (!isPatientOwner && !hasGuestKey) {
      res.status(403).json({ error: "You do not have access to this order" });
      return;
    }
  }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId, orderId)).limit(1);

  res.json({ order, items, delivery: delivery ?? null });
});

router.patch("/admin/orders/:id/status", requirePharmacist, async (req, res): Promise<void> => {
  const id = req.params.id;
  const b = req.body as { status?: string; deliveryStatus?: string; deliveryMessage?: string };

  let order;
  if (b.status) {
    [order] = await db.update(ordersTable).set({ status: b.status }).where(eq(ordersTable.id, id)).returning();
  } else {
    [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  }
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  if (b.deliveryStatus) {
    const [existingDelivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId, id)).limit(1);
    if (existingDelivery) {
      const newEvent = {
        ts: new Date().toISOString(),
        status: b.deliveryStatus,
        message: b.deliveryMessage || `Status updated to ${b.deliveryStatus}`,
      };
      const events = Array.isArray(existingDelivery.events) ? [...existingDelivery.events as unknown[], newEvent] : [newEvent];
      const patch: Record<string, unknown> = { status: b.deliveryStatus, events, lastSyncedAt: new Date() };
      if (b.deliveryStatus === "shipped" && !existingDelivery.shippedAt) patch.shippedAt = new Date();
      if (b.deliveryStatus === "delivered") patch.deliveredAt = new Date();
      await db.update(deliveriesTable).set(patch).where(eq(deliveriesTable.orderId, id));
    }
  }

  res.json({ order });
});

/**
 * Full admin edit: shipping address, customer notes, item quantity changes,
 * item removal, and append-only internal notes thread.
 */
router.patch("/admin/orders/:id", requirePharmacist, async (req, res): Promise<void> => {
  const id = req.params.id;
  const actorId = decodeBearerId(req.headers.authorization) ?? "pharmacist";
  const b = req.body as {
    shippingAddress?: ShippingAddress;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string | null;
    notes?: string | null;
    items?: Array<{ id: string; quantity: number }>;
    removeItemIds?: string[];
    addInternalNote?: { author: string; text: string };
  };

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const orderUpdate: Record<string, unknown> = {};

  if (b.shippingAddress) {
    const a = b.shippingAddress;
    if (!a.line1?.trim() || !a.city?.trim() || !a.postcode?.trim()) {
      res.status(400).json({ error: "Address line1, city, postcode are required" });
      return;
    }
    orderUpdate.shippingAddress = {
      line1: a.line1.trim(),
      line2: a.line2?.trim() || "",
      city: a.city.trim(),
      postcode: a.postcode.trim().toUpperCase(),
      country: a.country?.trim() || "United Kingdom",
    };
  }
  if (typeof b.customerName === "string" && b.customerName.trim()) orderUpdate.customerName = b.customerName.trim();
  if (typeof b.customerEmail === "string" && b.customerEmail.trim()) orderUpdate.customerEmail = b.customerEmail.trim().toLowerCase();
  if ("customerPhone" in b) orderUpdate.customerPhone = b.customerPhone?.trim() || null;
  if ("notes" in b) orderUpdate.notes = b.notes?.trim() || null;

  if (b.addInternalNote && b.addInternalNote.text?.trim()) {
    const existing = Array.isArray(order.internalNotes) ? order.internalNotes as unknown[] : [];
    orderUpdate.internalNotes = [
      ...existing,
      {
        id: randomUUID(),
        author: b.addInternalNote.author?.trim() || actorId,
        text: b.addInternalNote.text.trim(),
        ts: new Date().toISOString(),
      },
    ];
  }

  // Apply item changes (qty updates and removals)
  let recomputeTotals = false;
  if (Array.isArray(b.removeItemIds) && b.removeItemIds.length > 0) {
    for (const itemId of b.removeItemIds) {
      await db.delete(orderItemsTable).where(and(eq(orderItemsTable.id, itemId), eq(orderItemsTable.orderId, id)));
    }
    recomputeTotals = true;
  }
  if (Array.isArray(b.items)) {
    for (const it of b.items) {
      const qty = Math.max(1, Math.min(20, Math.floor(Number(it.quantity) || 1)));
      const [existing] = await db.select().from(orderItemsTable).where(and(eq(orderItemsTable.id, it.id), eq(orderItemsTable.orderId, id))).limit(1);
      if (existing && existing.quantity !== qty) {
        const newLineTotal = existing.unitPriceGbp * qty;
        await db.update(orderItemsTable).set({ quantity: qty, lineTotalGbp: newLineTotal }).where(eq(orderItemsTable.id, it.id));
        recomputeTotals = true;
      }
    }
  }

  if (recomputeTotals) {
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    if (items.length === 0) {
      res.status(400).json({ error: "Cannot remove all items from an order. Cancel the order instead." });
      return;
    }
    const itemsTotal = items.reduce((sum, it) => sum + it.lineTotalGbp, 0);
    const shipping = itemsTotal >= 2500 ? 0 : (order.shippingGbp > 0 ? 299 : 0);
    orderUpdate.itemsTotalGbp = itemsTotal;
    orderUpdate.shippingGbp = shipping;
    orderUpdate.totalGbp = itemsTotal + shipping;
  }

  if (Object.keys(orderUpdate).length === 0) {
    res.json({ order });
    return;
  }

  const [updated] = await db.update(ordersTable).set(orderUpdate).where(eq(ordersTable.id, id)).returning();
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId, id)).limit(1);
  res.json({ order: updated, items, delivery: delivery ?? null });
});

router.get("/admin/analytics/sales", requirePharmacist, async (_req, res): Promise<void> => {
  const totalsResult = await db.execute(sql`
    SELECT
      COUNT(*)::int AS orders,
      COALESCE(SUM(total_gbp_pence), 0)::bigint AS revenue
    FROM orders
    WHERE status != 'cancelled'
  `);

  const byProductResult = await db.execute(sql`
    SELECT
      oi.product_id, oi.product_name,
      SUM(oi.quantity)::int AS units_sold,
      SUM(oi.line_total_gbp_pence)::bigint AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status != 'cancelled'
    GROUP BY oi.product_id, oi.product_name
    ORDER BY revenue DESC
    LIMIT 50
  `);

  const last30Result = await db.execute(sql`
    SELECT
      DATE_TRUNC('day', created_at)::date AS day,
      COUNT(*)::int AS orders,
      COALESCE(SUM(total_gbp_pence), 0)::bigint AS revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days' AND status != 'cancelled'
    GROUP BY day
    ORDER BY day
  `);

  res.json({
    totals: totalsResult.rows[0] ?? { orders: 0, revenue: 0 },
    byProduct: byProductResult.rows,
    last30Days: last30Result.rows,
  });
});

export default router;

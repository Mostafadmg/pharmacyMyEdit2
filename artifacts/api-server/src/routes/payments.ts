import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, deliveriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getStripeClient, isStripeEnabled } from "../lib/stripe";

const router: IRouter = Router();

router.get("/payments/status", (_req, res) => {
  res.json({ stripeEnabled: isStripeEnabled() });
});

/**
 * Create a Stripe Checkout Session for an existing pending order.
 * Returns { url } that the client redirects the user to.
 */
router.post("/orders/:id/checkout-session", async (req, res): Promise<void> => {
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503).json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY." });
    return;
  }

  const orderId = req.params.id;
  const { successUrl, cancelUrl } = req.body as { successUrl?: string; cancelUrl?: string };
  if (!successUrl || !cancelUrl) {
    res.status(400).json({ error: "successUrl and cancelUrl required" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.paymentStatus === "paid" || order.paymentStatus === "paid_demo") {
    res.status(400).json({ error: "Order is already paid" });
    return;
  }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

  const lineItems = items.map(it => ({
    quantity: it.quantity,
    price_data: {
      currency: "gbp",
      unit_amount: it.unitPriceGbp,
      product_data: {
        name: it.productName,
        ...(it.imageUrl && it.imageUrl.startsWith("http") ? { images: [it.imageUrl] } : {}),
      },
    },
  }));

  if (order.shippingGbp > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: order.shippingGbp,
        product_data: { name: "Standard delivery" },
      },
    });
  }

  // Append session_id correctly whether successUrl already has a query string or not.
  const successWithSession = successUrl.includes("?")
    ? `${successUrl}&session_id={CHECKOUT_SESSION_ID}`
    : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    customer_email: order.customerEmail,
    metadata: { orderId, orderNumber: order.orderNumber },
    success_url: successWithSession,
    cancel_url: cancelUrl,
  });

  await db.update(ordersTable)
    .set({
      paymentProvider: "stripe",
      paymentSessionId: session.id,
      paymentStatus: "pending",
      status: "pending_payment",
    })
    .where(eq(ordersTable.id, orderId));

  res.json({ url: session.url, sessionId: session.id });
});

/**
 * Verify a Stripe Checkout Session and mark the order paid if successful.
 * Called by the success page so we don't need to wait for webhooks.
 */
router.post("/orders/:id/verify-payment", async (req, res): Promise<void> => {
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503).json({ error: "Stripe is not configured" });
    return;
  }
  const orderId = req.params.id;
  const { sessionId } = req.body as { sessionId?: string };
  if (!sessionId) {
    res.status(400).json({ error: "sessionId required" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.paymentSessionId !== sessionId) {
    res.status(400).json({ error: "Session does not belong to this order" });
    return;
  }
  if (order.paymentStatus === "paid") {
    res.json({ order, alreadyPaid: true });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status === "paid") {
    const [updated] = await db.update(ordersTable)
      .set({
        paymentStatus: "paid",
        status: "paid",
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .where(eq(ordersTable.id, orderId))
      .returning();

    // Decrement stock now that payment is confirmed (deferred from order creation
    // when Stripe is enabled, so abandoned checkouts don't drain inventory).
    const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
    for (const it of orderItems) {
      await db.update(productsTable)
        .set({ stock: sql`${productsTable.stock} - ${it.quantity}` })
        .where(eq(productsTable.id, it.productId));
    }

    // Initialise delivery tracking now that payment is confirmed
    const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.orderId, orderId)).limit(1);
    if (delivery && delivery.status === "preparing") {
      const events = Array.isArray(delivery.events) ? [...delivery.events as unknown[]] : [];
      events.push({
        ts: new Date().toISOString(),
        status: "preparing",
        message: "Payment confirmed via Stripe. Order is being prepared by our pharmacy team.",
      });
      await db.update(deliveriesTable).set({ events, lastSyncedAt: new Date() }).where(eq(deliveriesTable.orderId, orderId));
    }

    res.json({ order: updated, paid: true });
    return;
  }

  res.json({ order, paid: false, paymentStatus: session.payment_status });
});

export default router;

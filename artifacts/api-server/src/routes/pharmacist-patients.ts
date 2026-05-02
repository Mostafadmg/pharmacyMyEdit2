import { Router, type IRouter, type Response } from "express";
import {
  db,
  consultationsTable,
  ordersTable,
  orderItemsTable,
  deliveriesTable,
  patientAccountsTable,
  consultationMessagesTable,
} from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requirePharmacist, type AuthedRequest } from "../middlewares/auth";
import { sendConsultationOutcomeEmail } from "../utils/email";

const router: IRouter = Router();

router.get(
  "/pharmacist/patients/:email/profile",
  requirePharmacist,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const email = req.params.email?.toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }

    const [account] = await db
      .select()
      .from(patientAccountsTable)
      .where(eq(patientAccountsTable.email, email));

    const consultations = await db
      .select()
      .from(consultationsTable)
      .where(sql`LOWER(${consultationsTable.patientEmail}) = ${email}`)
      .orderBy(desc(consultationsTable.createdAt));

    const orders = await db
      .select()
      .from(ordersTable)
      .where(sql`LOWER(${ordersTable.customerEmail}) = ${email}`)
      .orderBy(desc(ordersTable.createdAt));

    let allItems: (typeof orderItemsTable.$inferSelect)[] = [];
    let allDeliveries: (typeof deliveriesTable.$inferSelect)[] = [];
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      [allItems, allDeliveries] = await Promise.all([
        db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, orderIds)),
        db.select().from(deliveriesTable).where(inArray(deliveriesTable.orderId, orderIds)),
      ]);
    }
    const itemsByOrder = new Map<string, typeof allItems>();
    for (const it of allItems) {
      const arr = itemsByOrder.get(it.orderId) ?? [];
      arr.push(it);
      itemsByOrder.set(it.orderId, arr);
    }
    const deliveryByOrder = new Map<string, (typeof allDeliveries)[number]>();
    for (const d of allDeliveries) deliveryByOrder.set(d.orderId, d);

    const ordersWithDetails = orders.map(o => ({
      ...o,
      items: itemsByOrder.get(o.id) ?? [],
      delivery: deliveryByOrder.get(o.id) ?? null,
    }));

    let recentMessages: (typeof consultationMessagesTable.$inferSelect)[] = [];
    if (consultations.length > 0) {
      recentMessages = await db
        .select()
        .from(consultationMessagesTable)
        .where(inArray(consultationMessagesTable.consultationId, consultations.map(c => c.id)))
        .orderBy(desc(consultationMessagesTable.createdAt))
        .limit(20);
    }

    const totalSpendPence = orders
      .filter(o => o.status === "paid" || o.status === "paid_demo" || o.status === "shipped" || o.status === "delivered")
      .reduce((sum, o) => sum + (o.totalGbp ?? 0), 0);

    const conditionStats = new Map<string, number>();
    for (const c of consultations) {
      conditionStats.set(c.conditionName, (conditionStats.get(c.conditionName) ?? 0) + 1);
    }
    const topConditions = Array.from(conditionStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const lastConsultation = consultations[0] ?? null;
    const firstConsultation = consultations[consultations.length - 1] ?? null;

    res.json({
      account,
      profile: {
        email,
        name: lastConsultation?.patientName ?? account?.name ?? null,
        firstSeenAt: firstConsultation?.createdAt ?? account?.createdAt ?? null,
        lastSeenAt: lastConsultation?.createdAt ?? null,
        totalConsultations: consultations.length,
        approvedCount: consultations.filter(c => c.status === "approved").length,
        rejectedCount: consultations.filter(c => c.status === "rejected").length,
        pendingCount: consultations.filter(c => c.status === "pending").length,
        moreInfoCount: consultations.filter(c => c.status === "more_info_needed").length,
        referredCount: consultations.filter(c => c.status === "referred").length,
        redFlagCount: consultations.filter(c => c.status === "red_flag").length,
        totalOrders: orders.length,
        totalSpendPence,
        topConditions,
        registered: !!account,
      },
      consultations,
      orders: ordersWithDetails,
      recentMessages,
    });
  },
);

router.post(
  "/pharmacist/patients/:email/email",
  requirePharmacist,
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const email = req.params.email?.toLowerCase();
    const { subject, message, consultationId } = req.body as {
      subject?: string;
      message?: string;
      consultationId?: string;
    };

    if (!email || !subject || !message) {
      res.status(400).json({ error: "email, subject, message are required" });
      return;
    }

    const [last] = await db
      .select()
      .from(consultationsTable)
      .where(sql`LOWER(${consultationsTable.patientEmail}) = ${email}`)
      .orderBy(desc(consultationsTable.createdAt))
      .limit(1);

    if (!last) {
      res.status(404).json({ error: "No consultation found for this patient" });
      return;
    }

    try {
      await sendConsultationOutcomeEmail({
        patientEmail: email,
        patientName: last.patientName,
        conditionName: subject,
        consultationId: consultationId ?? last.id,
        status: "more_info_needed",
        pharmacistNote: message,
        prescription: null,
        referralInfo: null,
      });

      if (consultationId) {
        const [owningConsult] = await db
          .select({ id: consultationsTable.id, patientEmail: consultationsTable.patientEmail })
          .from(consultationsTable)
          .where(eq(consultationsTable.id, consultationId));
        if (!owningConsult) {
          res.status(404).json({ error: "Consultation not found" });
          return;
        }
        if (owningConsult.patientEmail.toLowerCase() !== email) {
          res.status(403).json({ error: "Consultation does not belong to this patient" });
          return;
        }
        await db.insert(consultationMessagesTable).values({
          id: randomUUID(),
          consultationId,
          patientEmail: email,
          senderRole: "pharmacist",
          senderName: req.authActor?.name ?? "Pharmacist",
          body: message,
          kind: "message",
          readByPharmacist: true,
        });
      }

      res.json({ success: true });
    } catch (err) {
      req.log?.error?.({ err }, "Failed to send custom email");
      res.status(500).json({ error: "Failed to send email" });
    }
  },
);

export default router;

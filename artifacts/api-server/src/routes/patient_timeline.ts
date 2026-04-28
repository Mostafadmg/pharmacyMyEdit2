import { Router, type IRouter } from "express";
import { db, consultationsTable, ordersTable, pharmacistNotesTable, commsLogTable, patientAccountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requirePharmacist } from "../middlewares/auth";

const router: IRouter = Router();

type TimelineEvent = {
  id: string;
  ts: string;
  kind: "consultation" | "order" | "note" | "comm";
  title: string;
  subtitle?: string;
  status?: string;
  link?: string;
  meta?: Record<string, unknown>;
};

router.get("/admin/patients/:email/timeline", requirePharmacist, async (req, res): Promise<void> => {
  const email = decodeURIComponent(req.params.email).toLowerCase();

  const [consultations, orders, notes, comms, patientAccount] = await Promise.all([
    db.select().from(consultationsTable).where(eq(consultationsTable.patientEmail, email)),
    db.select().from(ordersTable).where(eq(ordersTable.customerEmail, email)),
    db.select().from(pharmacistNotesTable).where(eq(pharmacistNotesTable.patientEmail, email)),
    db.select().from(commsLogTable).where(eq(commsLogTable.patientEmail, email)),
    db.select().from(patientAccountsTable).where(eq(patientAccountsTable.email, email)).limit(1),
  ]);

  const account = patientAccount[0] ?? null;
  const latestConsult = consultations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const latestOrder = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  const patient = {
    email,
    name: account?.name ?? latestConsult?.patientName ?? latestOrder?.customerName ?? null,
    phone: account?.phone ?? latestOrder?.customerPhone ?? null,
    dateOfBirth: account?.dateOfBirth ?? null,
    sex: account?.sex ?? latestConsult?.patientSex ?? null,
    addressLine1: account?.addressLine1 ?? null,
    city: account?.city ?? null,
    postcode: account?.postcode ?? null,
  };

  const events: TimelineEvent[] = [
    ...consultations.map(c => ({
      id: `consult-${c.id}`,
      ts: c.createdAt.toISOString(),
      kind: "consultation" as const,
      title: c.conditionName,
      subtitle: c.hasRedFlag ? "Red-flag — urgent review" : "Online consultation",
      status: c.status,
      link: `/dashboard/consultation/${c.id}`,
      meta: { hasRedFlag: c.hasRedFlag },
    })),
    ...orders.map(o => ({
      id: `order-${o.id}`,
      ts: o.createdAt.toISOString(),
      kind: "order" as const,
      title: `Order ${o.orderNumber}`,
      subtitle: `£${(o.totalGbp / 100).toFixed(2)}`,
      status: o.status,
      link: `/dashboard/orders/${o.id}`,
    })),
    ...notes.map(n => ({
      id: `note-${n.id}`,
      ts: n.createdAt.toISOString(),
      kind: "note" as const,
      title: "Pharmacist note",
      subtitle: n.note.slice(0, 140),
      meta: { note: n.note, author: n.createdBy, updatedAt: n.updatedAt },
    })),
    ...comms.map(c => ({
      id: `comm-${c.id}`,
      ts: c.createdAt.toISOString(),
      kind: "comm" as const,
      title: c.subject || `${c.channel.charAt(0).toUpperCase()}${c.channel.slice(1)} communication`,
      subtitle: c.summary || `Logged by ${c.pharmacistName ?? "pharmacist"}`,
      meta: { channel: c.channel, direction: c.direction },
    })),
  ];

  events.sort((a, b) => b.ts.localeCompare(a.ts));
  res.json({ events, patient });
});

export default router;

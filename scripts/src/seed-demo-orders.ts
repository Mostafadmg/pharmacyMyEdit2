import {
  db,
  deliveriesTable,
  orderItemsTable,
  ordersTable,
} from "@workspace/db";

async function main() {
  const existing = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .limit(1);

  if (existing.length > 0) {
    console.log(
      `Orders already present (${existing.length}+). Skipping demo order seed.`,
    );
    return;
  }

  await db
    .insert(ordersTable)
    .values({
      id: "ord_demo_001",
      orderNumber: "PC-100001",
      customerEmail: "charlotte.ainsworth@example.com",
      customerName: "Charlotte Ainsworth",
      customerPhone: "+44 7700 900123",
      shippingAddress: {
        line1: "10 High Street",
        city: "London",
        postcode: "SW1A 1AA",
      },
      itemsTotalGbp: 2999,
      shippingGbp: 0,
      totalGbp: 2999,
      status: "processing",
      paymentStatus: "paid_demo",
      paymentProvider: "demo",
      notes: "Seeded demo order",
      internalNotes: [],
      prescriptionItems: [],
    })
    .onConflictDoNothing({ target: ordersTable.id });

  await db
    .insert(orderItemsTable)
    .values({
      id: "oi_demo_001",
      orderId: "ord_demo_001",
      productId: "prod_demo_paracetamol",
      productName: "Panadol Advance 500mg Tablets",
      productSlug: "paracetamol-500mg-16",
      imageUrl: "/products/paracetamol-500mg-16.jpg",
      unitPriceGbp: 999,
      quantity: 3,
      lineTotalGbp: 2997,
    })
    .onConflictDoNothing({ target: orderItemsTable.id });

  await db
    .insert(deliveriesTable)
    .values({
      id: "del_demo_001",
      orderId: "ord_demo_001",
      carrier: "royal_mail",
      trackingNumber: "RM123456789GB",
      trackingUrl:
        "https://www.royalmail.com/track-your-item#/tracking-results/RM123456789GB",
      status: "shipped",
      events: [],
    })
    .onConflictDoNothing({ target: deliveriesTable.id });

  console.log("Seeded 1 demo order with item + delivery.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

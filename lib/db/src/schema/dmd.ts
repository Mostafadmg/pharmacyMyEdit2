import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

/** GTIN → dm+d product index (synced weekly from NHS TRUD dm+d releases). */
export const dmdGtinTable = pgTable("dmd_gtin", {
  gtin: text("gtin").primaryKey(),
  amppId: text("ampp_id").notNull(),
  vmpId: text("vmp_id"),
  productName: text("product_name").notNull(),
  strength: text("strength"),
  form: text("form"),
  supplier: text("supplier"),
  discontinued: boolean("discontinued").notNull().default(false),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dmdSyncRunsTable = pgTable("dmd_sync_runs", {
  id: text("id").primaryKey(),
  releaseId: text("release_id").notNull(),
  releaseName: text("release_name"),
  archiveSha256: text("archive_sha256"),
  rowCount: integer("row_count").notNull().default(0),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export type DmdGtin = typeof dmdGtinTable.$inferSelect;
export type NewDmdGtin = typeof dmdGtinTable.$inferInsert;
export type DmdSyncRun = typeof dmdSyncRunsTable.$inferSelect;

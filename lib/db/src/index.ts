import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/pharmacare";
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";

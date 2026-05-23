import { defineConfig } from "drizzle-kit";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/pharmacare";
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

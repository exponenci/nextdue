import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { nextDueSql?: ReturnType<typeof postgres> };

// postgres.js connects lazily. The inert build URL lets `next build` compile
// without production secrets; the health route rejects a missing runtime URL.
const connectionString = process.env.DATABASE_URL || "postgres://build:build@127.0.0.1:5432/build";

export const sql = globalForDb.nextDueSql ?? postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 2,
  prepare: false,
  idle_timeout: 20
});

if (process.env.NODE_ENV !== "production") globalForDb.nextDueSql = sql;

export const db = drizzle(sql, { schema });

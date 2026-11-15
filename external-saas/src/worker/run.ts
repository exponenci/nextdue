import { sql } from "@/src/db/client";
import { ResendEmailAdapter, runReminderSweep } from "./reminders";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const appUrl = process.env.APP_URL;

if (!apiKey || !from || !appUrl) {
  throw new Error("RESEND_API_KEY, EMAIL_FROM, and APP_URL are required by the reminder worker");
}

const result = await runReminderSweep(sql, new ResendEmailAdapter(apiKey, from, appUrl));
console.log(JSON.stringify(result));
await sql.end();

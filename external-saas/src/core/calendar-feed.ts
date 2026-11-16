import { createHash, randomBytes } from "node:crypto";
import type { HouseholdState } from "@/src/server/state-contract";

export function createFeedToken() {
  return randomBytes(32).toString("base64url");
}

export function hashFeedToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  return result.getUTCFullYear() === year && result.getUTCMonth() === month - 1 && result.getUTCDate() === day ? result : null;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = parseDate(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + days);
  return iso(date);
}

function addMonths(value: string, months: number) {
  const date = parseDate(value);
  if (!date) return value;
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return iso(target);
}

function escapeIcs(value: unknown) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function safeId(value: unknown) {
  return String(value || "item").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
}

function eventDates(item: Record<string, unknown>, horizon: string) {
  const schedule = (item.schedule || {}) as Record<string, unknown>;
  const first = typeof schedule.date === "string" ? schedule.date : "";
  if (!parseDate(first)) return [];
  if (schedule.kind !== "recurring") return [first];
  const dates: string[] = [];
  let cursor = first;
  const interval = Math.max(1, Math.min(24, Number(schedule.interval) || 1));
  for (let guard = 0; guard < 1000 && cursor <= horizon; guard += 1) {
    dates.push(cursor);
    cursor = addMonths(cursor, schedule.frequency === "monthly" ? interval : interval * 12);
  }
  return dates;
}

export function generateCalendarFeed(state: HouseholdState, now = new Date()) {
  const horizonDate = new Date(Date.UTC(now.getUTCFullYear() + 2, now.getUTCMonth(), now.getUTCDate()));
  const horizon = iso(horizonDate);
  const privacySafe = state.settings.privacySafeTitles !== false;
  const categories: Record<string, string> = {
    identity: "Renew identity document", residence: "Review residence document", tax: "Review financial obligation",
    transport: "Renew transport document", property: "Review property obligation", family: "Review family document",
    health: "Renew health document", custom: "Personal deadline"
  };
  const lines = ["BEGIN:VCALENDAR", "PRODID:-//NextDue//Private Feed//EN", "VERSION:2.0", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:NextDue"];
  for (const item of state.items) {
    if (item.status !== "active" || item.applicability === "candidate") continue;
    const offsets = Array.isArray(item.reminderOffsets) ? item.reminderOffsets.filter((value): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 3650) : [];
    const title = privacySafe ? categories[String(item.category)] || categories.custom : String(item.title || "NextDue deadline");
    for (const date of eventDates(item, horizon)) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${safeId(item.id)}-${date}@nextdue.feed`,
        `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
        `DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`,
        `DTEND;VALUE=DATE:${addDays(date, 1).replaceAll("-", "")}`,
        `SUMMARY:${escapeIcs(title)}`,
        "DESCRIPTION:Created by NextDue. Verify requirements with the relevant authority.",
        "TRANSP:TRANSPARENT"
      );
      for (const offset of offsets) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:${offset === 0 ? "PT0M" : `-P${offset}D`}`, `DESCRIPTION:${escapeIcs(title)}`, "END:VALARM");
      lines.push("END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

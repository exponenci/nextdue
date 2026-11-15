import test from "node:test";
import assert from "node:assert/strict";
import {
  addMonthsClamped,
  expandOccurrences,
  generateICS,
  getItemStatus,
  getSuggestions,
  parseISODate,
  validateBackup,
} from "../dist/logic.mjs";

const now = new Date("2026-11-15T12:00:00Z");

test("strictly validates calendar dates", () => {
  assert.equal(parseISODate("2028-02-29")?.toISOString().slice(0, 10), "2028-02-29");
  assert.equal(parseISODate("2027-02-29"), null);
  assert.equal(parseISODate("15/11/2026"), null);
});

test("clamps month-end recurrence without timezone drift", () => {
  assert.equal(addMonthsClamped("2026-01-31", 1).toISOString().slice(0, 10), "2026-02-28");
  assert.equal(addMonthsClamped("2028-01-31", 1).toISOString().slice(0, 10), "2028-02-29");
});

test("suggestions remain focused and respond to profile", () => {
  const suggestions = getSuggestions({ goal: "move", possessions: ["vehicle", "property", "pet"] });
  assert.ok(suggestions.some((item) => item.id === "residence-permit"));
  assert.ok(suggestions.some((item) => item.id === "vehicle-renewal"));
  assert.ok(suggestions.length <= 7);
});

test("expands monthly recurrence for a bounded horizon", () => {
  const item = {
    id: "tax-1",
    status: "active",
    schedule: { kind: "recurring", date: "2026-11-30", frequency: "monthly", interval: 1 },
  };
  const occurrences = expandOccurrences(item, { now, horizonMonths: 4 });
  assert.deepEqual(occurrences.map((item) => item.date), ["2026-11-30", "2026-12-30", "2027-01-30", "2027-02-28"]);
});

test("distinguishes missing and urgent dates", () => {
  const missing = { status: "active", schedule: { kind: "expiry", date: "" } };
  const urgent = { status: "active", schedule: { kind: "expiry", date: "2026-11-25" } };
  assert.equal(getItemStatus(missing, now).key, "missing");
  assert.equal(getItemStatus(urgent, now).key, "now");
});

test("exports portable all-day ICS with alarms and stable identifiers", () => {
  const item = {
    id: "passport-abc",
    title: "My passport",
    category: "identity",
    status: "active",
    reminderPlan: "early",
    schedule: { kind: "expiry", date: "2027-06-01" },
  };
  const ics = generateICS([item], { privacySafeTitles: true, preparationMilestones: true, horizonMonths: 24 }, now);
  assert.match(ics, /UID:passport-abc-2027-06-01@nextdue\.local/);
  assert.match(ics, /SUMMARY:Renew identity document/);
  assert.match(ics, /TRIGGER:-P180D/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270601/);
  assert.ok(ics.endsWith("\r\n"));
});

test("rejects malformed or oversized backups", () => {
  assert.throws(() => validateBackup({ version: 99 }), /not supported/);
  assert.throws(() => validateBackup({ version: 1, profile: {}, settings: {}, items: new Array(1001).fill({}) }), /too many/);
});

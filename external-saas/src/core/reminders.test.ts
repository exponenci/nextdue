import assert from "node:assert/strict";
import test from "node:test";
import { parseReminderPlan, reminderDates, ReminderPlanError } from "./reminders";

test("parses slash-delimited day offsets and canonicalizes descending order", () => {
  const plan = parseReminderPlan("30 / 180 / 7 / 1 / 0");
  assert.equal(plan.normalized, "180/30/7/1/0");
  assert.deepEqual(plan.offsets.map((offset) => offset.value), [180, 30, 7, 1, 0]);
});

test("rejects empty, duplicate, negative, decimal, and oversized tokens", () => {
  for (const input of ["", "30//7", "30/30", "-1/0", "1.5/0", "3651/0"]) {
    assert.throws(() => parseReminderPlan(input), ReminderPlanError);
  }
});

test("previews reminder dates without local-time drift", () => {
  const dates = reminderDates("2028-03-01", parseReminderPlan("1/0"));
  assert.deepEqual(dates, ["2028-02-29", "2028-03-01"]);
});

test("rejects invalid deadline dates", () => {
  assert.throws(() => reminderDates("2027-02-29", parseReminderPlan("7")), /valid calendar date/);
});

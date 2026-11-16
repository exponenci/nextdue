import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createFeedToken, generateCalendarFeed, hashFeedToken } from "./calendar-feed";

test("calendar feed tokens are random, opaque, and stored only as hashes", () => {
  const first = createFeedToken();
  const second = createFeedToken();
  assert.notEqual(first, second);
  assert.equal(first.length, 43);
  assert.match(hashFeedToken(first), /^[a-f0-9]{64}$/);
  assert.notEqual(hashFeedToken(first), first);
});

test("private calendar feed includes confirmed dated obligations and alarms", () => {
  const state = {
    version: 6, onboarded: true, locale: "en", profile: { goal: "move", activeCountries: ["RU"] },
    settings: { privacySafeTitles: true, preparationMilestones: true, horizonMonths: 24 },
    people: [], citizenships: [], countryContexts: [], legalRoutes: [], routeParties: [], personRelationships: [],
    assets: [], assetJurisdictions: [], assetPersonRoles: [], issuedDocuments: [], ruleCandidates: [],
    items: [{ id: "passport-1", title: "Secret passport", category: "identity", status: "active", applicability: "confirmed", reminderOffsets: [180, 0], schedule: { kind: "expiry", date: "2027-06-01" } }]
  } as never;
  const calendar = generateCalendarFeed(state, new Date("2026-11-16T00:00:00Z"));
  assert.match(calendar, /SUMMARY:Renew identity document/);
  assert.doesNotMatch(calendar, /Secret passport/);
  assert.match(calendar, /TRIGGER:-P180D/);
  assert.match(calendar, /TRIGGER:PT0M/);
});

test("calendar feed API stores hashes and supports revocation", () => {
  const route = readFileSync(new URL("../../app/api/calendar-feeds/route.ts", import.meta.url), "utf8");
  const publicRoute = readFileSync(new URL("../../app/calendar/[token]/route.ts", import.meta.url), "utf8");
  assert.match(route, /hashFeedToken\(token\)/);
  assert.match(route, /set revoked_at = now\(\)/);
  assert.doesNotMatch(route, /calendar_feeds\s*\([^)]*\btoken\b/);
  assert.match(publicRoute, /read_calendar_feed/);
});

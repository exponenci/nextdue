import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { householdStateSchema, stateWriteSchema } from "./state-contract";

const state = {
  version: 6,
  onboarded: false,
  locale: "en",
  profile: { goal: "move", activeCountries: [] },
  settings: { privacySafeTitles: true, preparationMilestones: true, horizonMonths: 24 },
  people: [{ id: "person-me", name: "Me" }],
  citizenships: [], countryContexts: [], legalRoutes: [], routeParties: [], personRelationships: [],
  assets: [], assetJurisdictions: [], assetPersonRoles: [], issuedDocuments: [], ruleCandidates: [], items: []
};

test("household snapshot contract accepts schema v6 and optimistic revision zero", () => {
  assert.equal(stateWriteSchema.parse({ revision: 0, state }).state.version, 6);
});

test("household snapshot contract rejects stale schema and oversized obligation collections", () => {
  assert.equal(householdStateSchema.safeParse({ ...state, version: 5 }).success, false);
  assert.equal(householdStateSchema.safeParse({ ...state, items: new Array(1001).fill({}) }).success, false);
});

test("state API requires membership, same-origin writes, and optimistic concurrency", () => {
  const route = readFileSync(new URL("../../app/api/state/route.ts", import.meta.url), "utf8");
  const authContext = readFileSync(new URL("./auth-context.ts", import.meta.url), "utf8");
  assert.match(route, /assertSameOrigin\(request\)/);
  assert.match(route, /revision = \$\{revision\}/);
  assert.match(route, /status: 409/);
  assert.match(authContext, /from app\.memberships/);
  assert.match(authContext, /Read-only membership/);
});

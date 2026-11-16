import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadCatalogPack } from "./load";
import { loadRuntimeRegistry } from "./registry";

test("Russia and Uzbekistan reviewed packs satisfy the versioned catalog contract", async () => {
  const [ru, uz] = await Promise.all([loadCatalogPack("ru"), loadCatalogPack("uz")]);
  assert.equal(ru.countryCode, "RU");
  assert.equal(uz.countryCode, "UZ");
  assert.equal(ru.status, "reviewed");
  assert.equal(uz.status, "reviewed");
  assert.equal(ru.items.length, 7);
  assert.equal(uz.items.length, 5);
  assert.equal(new Set([...ru.items, ...uz.items].map((item) => item.id)).size, 12);
  assert.ok(ru.supportedLocales.includes("ru"));
  assert.ok(uz.supportedLocales.includes("uz-Latn"));
});

test("the generated runtime registry enforces counts, references, and automation tiers", async () => {
  const registry = await loadRuntimeRegistry();
  assert.deepEqual(registry.counts, { countries: 42, rules: 694, sources: 426, ready: 24, confirm: 515, research: 155 });
  assert.equal(new Set(registry.rules.map((rule) => rule.rule_id)).size, 694);
  assert.equal(new Set(registry.sources.map((source) => source.source_id)).size, 426);
  assert.ok(registry.rules.filter((rule) => rule.runtime_tier === "ready").every((rule) => rule.rule_specificity === "exact_national_rule" && ["verified", "publishable"].includes(rule.review_status)));
  assert.ok(registry.rules.filter((rule) => rule.runtime_tier === "research").every((rule) => rule.rule_specificity === "research_prompt"));
});

test("the forward migration enforces household boundaries on graph relationships", () => {
  const migration = readFileSync(new URL("../db/migrations/0001_domain_v2.sql", import.meta.url), "utf8");
  for (const constraint of [
    "person_citizenships_person_household_fk",
    "legal_routes_context_household_fk",
    "person_relationships_from_household_fk",
    "asset_person_roles_person_household_fk",
    "issued_documents_asset_household_fk",
    "obligations_asset_household_fk",
    "reminder_deliveries_obligation_household_fk",
  ]) assert.match(migration, new RegExp(constraint));
  assert.match(migration, /enforce_optional_household_references/);
  assert.match(migration, /obligations_optional_household_refs/);
});

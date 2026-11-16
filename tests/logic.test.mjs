import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addMonthsClamped,
  expandOccurrences,
  generateICS,
  getItemStatus,
  parseReminderSequence,
  parseISODate,
  validateBackup,
} from "../dist/logic.mjs";
import { CATALOG, matchCatalog } from "../dist/catalog.mjs";
import { REGISTRY_COUNTS, REGISTRY_RULES, REGISTRY_SOURCES } from "../dist/registry.mjs";
import {
  catalogGraph,
  emptyDomainState,
  migrateDomainState,
  normalizeCatalogObligation,
  validateSubject,
} from "../dist/domain.mjs";

const now = new Date("2026-11-15T12:00:00Z");
const appSource = readFileSync(new URL("../dist/app.mjs", import.meta.url), "utf8");
const logicSource = readFileSync(new URL("../dist/logic.mjs", import.meta.url), "utf8");
const htmlSource = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../dist/styles.css", import.meta.url), "utf8");

test("strictly validates calendar dates", () => {
  assert.equal(parseISODate("2028-02-29")?.toISOString().slice(0, 10), "2028-02-29");
  assert.equal(parseISODate("2027-02-29"), null);
  assert.equal(parseISODate("15/11/2026"), null);
});

test("clamps month-end recurrence without timezone drift", () => {
  assert.equal(addMonthsClamped("2026-01-31", 1).toISOString().slice(0, 10), "2026-02-28");
  assert.equal(addMonthsClamped("2028-01-31", 1).toISOString().slice(0, 10), "2028-02-29");
});

test("matches people and possessions in different countries", () => {
  const matches = matchCatalog({
    people: [{ id: "me", citizenships: ["RU"], jurisdictions: [{ country: "RU", type: "residence", basis: "citizen" }, { country: "UZ", type: "stay", basis: "tourist" }] }],
    assets: [
      { id: "flat-uz", type: "property", label: "Tashkent apartment", country: "UZ", ownerId: "me" },
      { id: "flat-ru", type: "property", label: "Moscow apartment", country: "RU", ownerId: "me" },
    ],
  });
  assert.ok(matches.some(({ entry }) => entry.id === "ru_internal_passport_age_replacement"));
  assert.ok(matches.some(({ entry, assetId }) => entry.id === "uz_property_land_tax_installments" && assetId === "flat-uz"));
  assert.ok(matches.some(({ entry, assetId }) => entry.id === "ru_individual_property_tax_notice" && assetId === "flat-ru"));
  assert.ok(!matches.some(({ entry }) => entry.id === "uz_id_card_expiry"), "Uzbek residence must not unlock an Uzbek citizen ID");
  assert.ok(CATALOG.length >= 24);
});

test("gates national documents by citizenship and leaves driving licences manual", () => {
  const matches = matchCatalog({
    people: [{ id: "me", citizenships: ["RU"], jurisdictions: [{ country: "UZ", type: "residence", basis: "temporary_residence" }] }],
    assets: [],
  });
  const ids = new Set(matches.map(({ entry }) => entry.id));
  assert.ok(ids.has("ru_internal_passport_age_replacement"));
  assert.ok(ids.has("ru_international_passport_expiry"));
  assert.ok(!ids.has("uz_id_card_expiry"));
  assert.ok(!ids.has("ru_driving_licence_expiry"));
  assert.ok(!ids.has("uz_driving_licence_expiry"));
});

test("matches a country obligation only to the relevant legal basis", () => {
  const patentMatches = matchCatalog({
    people: [{ id: "worker", citizenships: ["UZ"], jurisdictions: [{ country: "RU", type: "residence", basis: "work_patent" }] }], assets: [],
  });
  assert.ok(!patentMatches.some(({ entry }) => entry.id === "ru_residence_permit_annual_confirmation"));
  const permitMatches = matchCatalog({
    people: [{ id: "resident", citizenships: ["UZ"], jurisdictions: [{ country: "RU", type: "residence", basis: "vnzh" }] }], assets: [],
  });
  assert.ok(permitMatches.some(({ entry }) => entry.id === "ru_residence_permit_annual_confirmation"));
});

test("matches the reviewed Russia patent checklist without the work-permit branch", () => {
  const matches = matchCatalog({ people: [{ id: "worker", citizenships: ["UZ"], jurisdictions: [{ country: "RU", type: "residence", purpose: "work", route: "work_patent" }] }], assets: [] });
  const ids = new Set(matches.map(({ entry }) => entry.id));
  for (const id of ["ru_foreigner_entry_migration_record", "ru_foreigner_migration_registration", "ru_work_patent_document", "ru_work_medical_examination", "ru_work_medical_cover", "ru_work_language_law_evidence", "ru_foreign_worker_contract", "ru_patent_advance_tax_payments", "ru_patent_contract_copy_submission", "ru_employer_foreign_worker_notifications"]) assert.ok(ids.has(id), `${id} must be included`);
  assert.ok(!ids.has("ru_work_permit_document"));
  assert.ok(!ids.has("ru_eaeu_employment_exemption"));
});

test("keeps EAEU employment separate from the Russia patent and work-permit routes", () => {
  const matches = matchCatalog({ people: [{ id: "worker", citizenships: ["KZ"], jurisdictions: [{ country: "RU", type: "residence", purpose: "work", route: "eaeu_employment" }] }], assets: [] });
  const ids = new Set(matches.map(({ entry }) => entry.id));
  assert.ok(ids.has("ru_eaeu_employment_exemption"));
  assert.ok(!ids.has("ru_work_patent_document"));
  assert.ok(!ids.has("ru_work_permit_document"));
});

test("creates a separate vehicle-paper checklist for every exact vehicle", () => {
  const matches = matchCatalog({ people: [{ id: "owner", citizenships: ["IT"], jurisdictions: [{ country: "IT", type: "residence", route: "citizen" }] }], assets: [{ id: "car-it", type: "vehicle", country: "IT", ownerId: "owner" }, { id: "car-ru", type: "vehicle", country: "RU", ownerId: "owner" }] });
  for (const assetId of ["car-it", "car-ru"]) {
    const kinds = new Set(matches.filter((match) => match.assetId === assetId).map((match) => match.entry.checklistKind));
    for (const kind of ["registration_title", "insurance", "inspection", "tax_fee", "import_customs_foreign_plate"]) assert.ok(kinds.has(kind), `${assetId} is missing ${kind}`);
  }
});

test("ships complete localized catalog records with stable unique ids", () => {
  assert.equal(new Set(CATALOG.map((entry) => entry.id)).size, CATALOG.length);
  for (const entry of CATALOG) {
    for (const locale of ["en", "ru", "uz-Latn"]) {
      assert.ok(entry.title[locale], `${entry.id} is missing ${locale} title`);
      assert.ok(entry.summary[locale], `${entry.id} is missing ${locale} summary`);
      assert.ok(entry.audience[locale], `${entry.id} is missing ${locale} audience`);
    }
    assert.match(entry.source.url, /^https:\/\//);
  }
});

test("parses user reminder sequences separated by slash", () => {
  assert.deepEqual(parseReminderSequence("180 / 90/30/7/1/0"), [180, 90, 30, 7, 1, 0]);
  assert.throws(() => parseReminderSequence("90//30"), /empty values/);
  assert.throws(() => parseReminderSequence("30/30/7"), /duplicate/);
  assert.throws(() => parseReminderSequence("30/-1"), /whole number/);
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
    reminderInput: "200/45/0",
    reminderOffsets: [200, 45, 0],
    schedule: { kind: "expiry", date: "2027-06-01" },
  };
  const ics = generateICS([item], { privacySafeTitles: true, preparationMilestones: true, horizonMonths: 24 }, now);
  assert.match(ics, /UID:passport-abc-2027-06-01@nextdue\.local/);
  assert.match(ics, /SUMMARY:Renew identity document/);
  assert.match(ics, /TRIGGER:-P200D/);
  assert.match(ics, /TRIGGER:PT0M/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270601/);
  assert.ok(ics.endsWith("\r\n"));
});

test("rejects malformed or oversized backups", () => {
  assert.throws(() => validateBackup({ version: 99 }), /not supported/);
  const oversized = emptyDomainState();
  oversized.items = new Array(1001).fill({});
  assert.throws(() => validateBackup(oversized), /too many/);
  const malformed = emptyDomainState();
  malformed.items = [{ title: "Broken", category: "custom", subjectType: "asset", personId: "person-1", assetId: "asset-1", schedule: { date: "" } }];
  assert.throws(() => validateBackup(malformed), /Invalid subject/);
});

test("starts on Plan and resets browser data on every full load in test mode", () => {
  assert.match(appSource, /const TEST_MODE_RESET_ON_LOAD = true/);
  assert.match(appSource, /let activeView = "plan"/);
  assert.match(appSource, /if \(TEST_MODE_RESET_ON_LOAD\) await resetStoredStateForTestMode\(\)/);
  assert.doesNotMatch(htmlSource, /data-view="today"/);
  assert.match(htmlSource, /data-view="plan"/);
});

test("exposes safe possession deletion and keeps custom linked obligations", () => {
  assert.match(htmlSource, /id="delete-asset"[^>]*hidden/);
  assert.match(appSource, /if \(item\.provenance === "catalog"\) return \[\]/);
  assert.match(appSource, /subjectType: "household", assetId: null, personId: null/);
  assert.match(appSource, /Remove this possession and its generated checklist/);
});

test("supports repeated country contexts and separates context periods from permit expiry", () => {
  assert.match(appSource, /openCountryPicker\("setup-plan-new", "", setupDraft\.citizenships\)/);
  assert.match(appSource, /Add another country context/);
  assert.match(htmlSource, /name="startsOn"/);
  assert.match(htmlSource, /name="endsOn"/);
  assert.match(htmlSource, /name="printedExpiry"/);
});

test("rules library exposes all evidence tiers without claiming every row is actionable", () => {
  assert.equal(REGISTRY_COUNTS.countries, 42);
  assert.equal(REGISTRY_COUNTS.rules, 694);
  assert.equal(REGISTRY_COUNTS.sources, 426);
  assert.deepEqual([REGISTRY_COUNTS.ready, REGISTRY_COUNTS.confirm, REGISTRY_COUNTS.research], [24, 515, 155]);
  assert.equal(REGISTRY_RULES.length, 694);
  assert.equal(REGISTRY_SOURCES.length, 426);
  assert.match(appSource, /Only verified exact rules can create a trackable candidate automatically/);
  assert.doesNotMatch(stylesSource, /\.coverage-card/);
});

test("migrates v4 people, assets, and ambiguous obligations into the normalized v5 graph", () => {
  const migrated = migrateDomainState({
    version: 4,
    onboarded: true,
    locale: "en",
    profile: { goal: "move", activeCountries: [] },
    settings: {},
    people: [{ id: "person-1", name: "Me", relationship: "self", citizenships: ["UZ", "RU"], jurisdictions: [{ id: "context-1", country: "RU", type: "residence", purpose: "work", route: "work_patent" }] }],
    assets: [{ id: "car-1", type: "vehicle", label: "Car", country: "RU", ownerId: "person-1" }],
    items: [{ id: "item-1", title: "Insurance", category: "transport", country: "RU", subjectId: "person-1", assetId: "car-1", provenance: "catalog", schedule: { kind: "expiry", date: "" }, reminderInput: "30/1", status: "active" }],
  });
  assert.equal(migrated.version, 5);
  assert.deepEqual(migrated.citizenships.map((record) => record.country).sort(), ["RU", "UZ"]);
  assert.equal(migrated.assetJurisdictions[0].country, "RU");
  assert.deepEqual(migrated.assetPersonRoles[0], { id: migrated.assetPersonRoles[0].id, assetId: "car-1", personId: "person-1", role: "owner" });
  assert.equal(migrated.items[0].subjectType, "asset");
  assert.equal(migrated.items[0].responsiblePersonId, "person-1");
  assert.equal(migrated.items[0].applicability, "candidate");
});

test("projects normalized multi-role assets into the deterministic catalog matcher", () => {
  const state = emptyDomainState();
  state.people = [{ id: "person-1", name: "Owner", relationship: "self" }, { id: "person-2", name: "Keeper", relationship: "dependant" }];
  state.citizenships = [{ id: "cit-1", personId: "person-1", country: "IT" }];
  state.countryContexts = [{ id: "context-1", personId: "person-1", country: "IT", contextType: "lives_now", purpose: "long_term" }];
  state.legalRoutes = [{ id: "route-1", countryContextId: "context-1", routeCode: "citizen" }];
  state.assets = [{ id: "car-1", type: "vehicle", label: "Car", facts: {} }];
  state.assetJurisdictions = [{ id: "jur-1", assetId: "car-1", country: "IT", role: "registration", isPrimary: true }];
  state.assetPersonRoles = [{ id: "role-1", assetId: "car-1", personId: "person-1", role: "owner", sharePercent: 50 }, { id: "role-2", assetId: "car-1", personId: "person-2", role: "keeper" }];
  const graph = catalogGraph(state);
  assert.equal(graph.assets[0].country, "IT");
  assert.equal(graph.assets[0].ownerId, "person-1");
  assert.equal(state.assetPersonRoles.length, 2);
});

test("enforces exactly one obligation subject and keeps responsibility separate", () => {
  assert.ok(validateSubject({ subjectType: "household", personId: null, assetId: null }));
  assert.ok(validateSubject({ subjectType: "person", personId: "person-1", assetId: null, responsiblePersonId: "person-2" }));
  assert.ok(validateSubject({ subjectType: "asset", personId: null, assetId: "asset-1", responsiblePersonId: "person-1" }));
  assert.ok(!validateSubject({ subjectType: "asset", personId: "person-1", assetId: "asset-1" }));
  const obligation = normalizeCatalogObligation({ title: "Vehicle tax", assetId: "asset-1", subjectId: "person-1" }, "person-2", "candidate");
  assert.equal(obligation.subjectType, "asset");
  assert.equal(obligation.responsiblePersonId, "person-2");
  assert.equal(obligation.applicability, "candidate");
});

test("onboarding does not silently choose purpose, route, document, or deadline", () => {
  assert.match(appSource, /residencePurpose: "", residenceRoute: ""/);
  assert.match(appSource, /plan\.route = ""/);
  assert.doesNotMatch(appSource, /residencePurpose: "work"/);
  assert.match(appSource, /Choose your purpose and legal route/);
  assert.match(appSource, /applicability: "candidate"/);
  assert.match(logicSource, /date: options\.date \|\| ""/);
  assert.match(htmlSource, /name="hasDocument"/);
});

test("person and possession editors expose repeatable normalized connections", () => {
  assert.match(htmlSource, /id="person-citizenship-list"/);
  assert.match(appSource, /data-action="add-person-citizenship"/);
  assert.match(htmlSource, /id="asset-role-list"/);
  assert.match(htmlSource, /id="asset-jurisdiction-list"/);
  assert.match(htmlSource, /name="subjectType"/);
  assert.match(htmlSource, /name="responsiblePersonId"/);
  assert.match(htmlSource, /name="vehicleClass"/);
  assert.match(htmlSource, /name="vehiclePlateStatus"/);
  assert.match(htmlSource, /name="relationshipType"/);
  assert.match(htmlSource, /id="principal-relationship-field"/);
  assert.match(appSource, /personRelationships/);
  assert.match(appSource, /vehicleImportStatus/);
  assert.match(appSource, /const hasCountry = Boolean\(form\.elements\.country\.value\)/);
  assert.match(appSource, /relationshipField\.hidden = principalField\.hidden \|\| !form\.elements\.principalPersonId\.value/);
});

test("rules and country pickers remain usable with multiple targets and large registries", () => {
  assert.match(appSource, /catalogItemKey\(item\.catalogId, itemPersonId\(item\), itemAssetId\(item\)\)/);
  assert.match(appSource, /data-catalog-target/);
  assert.match(appSource, /show-more-rules/);
  assert.match(appSource, /aria-selected=/);
  assert.match(htmlSource, /role="listbox" aria-labelledby="country-picker-title"/);
});

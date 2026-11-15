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

const now = new Date("2026-11-15T12:00:00Z");
const appSource = readFileSync(new URL("../dist/app.mjs", import.meta.url), "utf8");
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
  assert.throws(() => validateBackup({ version: 4, profile: {}, settings: {}, people: [], assets: [], items: new Array(1001).fill({}) }), /too many/);
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
  assert.match(appSource, /return \[\{ \.\.\.item, assetId: null \}\]/);
  assert.match(appSource, /Remove this possession and its generated checklist/);
});

test("supports repeated country contexts and separates context periods from permit expiry", () => {
  assert.match(appSource, /openCountryPicker\("setup-plan-new", "", setupDraft\.citizenships\)/);
  assert.match(appSource, /Add another country context/);
  assert.match(htmlSource, /name="startsOn"/);
  assert.match(htmlSource, /name="endsOn"/);
  assert.match(htmlSource, /name="printedExpiry"/);
});

test("country rules distinguish reviewed publications from planning contexts", () => {
  assert.match(appSource, /does not claim a reviewed rule pack/);
  assert.doesNotMatch(stylesSource, /\.coverage-card/);
});

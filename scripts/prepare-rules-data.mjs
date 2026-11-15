import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CATALOG,
  CATALOG_REVIEWED_AT,
  CATALOG_VERSION,
  COUNTRY_META,
} from "../dist/catalog.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const researchDir = path.join(projectDir, "research");

const readJson = async (filename) => JSON.parse(await fs.readFile(path.join(researchDir, filename), "utf8"));
const asArray = (value, key) => Array.isArray(value) ? value : (Array.isArray(value?.[key]) ? value[key] : []);
const unique = (values) => [...new Set(values.filter(Boolean))];
const textValue = (value) => value?.en || value?.ru || value?.["uz-Latn"] || value || "";

const cisEuropeRules = asArray(await readJson("rules_cis_europe.json"), "rules");
const cisEuropeSources = asArray(await readJson("sources_cis_europe.json"), "sources");
const asiaRules = asArray(await readJson("rules_asia.json"), "rules");
const asiaSources = asArray(await readJson("sources_asia.json"), "sources");

const sources = [...cisEuropeSources, ...asiaSources];
const sourceById = new Map(sources.map((source) => [source.source_id, source]));
const sourceIdByUrl = new Map(sources.filter((source) => source.url).map((source) => [source.url, source.source_id]));

function stablePredicate(rule, original) {
  const all = [{ field: "country_context.country", op: "eq", value: rule.destination_country }];
  if (rule.citizenship_values?.length) all.push({ field: "person.citizenships", op: "intersects", value: rule.citizenship_values });
  else if (rule.citizenship_scope_type) all.push({ field: "person.citizenships", op: "matches_scope", value: rule.citizenship_scope_type });
  if (rule.purpose && rule.purpose !== "any") all.push({ field: "country_context.purpose", op: "eq", value: rule.purpose });
  if (rule.route_code) all.push({ field: "country_context.route_code", op: "matches_route_family", value: rule.route_code });
  if (rule.family_condition) all.push({ field: "country_context.family_link", op: "satisfies", value: rule.family_condition });
  if (rule.employer_condition) all.push({ field: "country_context.employer", op: "satisfies", value: rule.employer_condition });
  if (rule.institution_condition) all.push({ field: "country_context.institution", op: "satisfies", value: rule.institution_condition });
  if (rule.asset_type) all.push({ field: "asset.type", op: "eq", value: rule.asset_type });
  if (rule.asset_condition) all.push({ field: "asset", op: "satisfies", value: rule.asset_condition });
  return {
    language: "nextdue_predicate_v1",
    all,
    source_expression: typeof original === "string" ? original : JSON.stringify(original || {}),
  };
}

function normalizeRule(rule) {
  const normalized = {
    ...rule,
    citizenship_values: asArray(rule.citizenship_values),
    required_evidence: asArray(rule.required_evidence),
    exceptions: Array.isArray(rule.exceptions) ? rule.exceptions : (rule.exceptions ? [rule.exceptions] : []),
    source_ids: asArray(rule.source_ids),
  };
  normalized.condition_expression = stablePredicate(normalized, rule.condition_expression);
  return normalized;
}

function catalogTiming(entry) {
  const timing = entry.timing || {};
  if (timing.kind === "relative_event") return {
    deadline_type: "relative",
    deadline_value: timing.days ?? null,
    deadline_unit: timing.workingDays ? "working_days" : "calendar_days",
    recurrence: "event_based",
  };
  if (timing.kind === "annual") return {
    deadline_type: "annual_fixed_date",
    deadline_value: `${String(timing.month || "").padStart(2, "0")}-${String(timing.day || "").padStart(2, "0")}`,
    deadline_unit: "month-day",
    recurrence: "yearly",
  };
  if (timing.kind === "monthly") return {
    deadline_type: "monthly_day",
    deadline_value: timing.day ?? null,
    deadline_unit: "day_of_month",
    recurrence: "monthly",
  };
  if (timing.kind === "age_milestones") return {
    deadline_type: "age_milestones",
    deadline_value: asArray(timing.ages).join("/"),
    deadline_unit: "years_of_age",
    recurrence: "event_based",
  };
  if (timing.kind === "expiry_manual") return {
    deadline_type: "printed_expiry",
    deadline_value: null,
    deadline_unit: null,
    recurrence: "document_lifecycle",
  };
  return {
    deadline_type: "user_confirmed_or_check_official_list",
    deadline_value: null,
    deadline_unit: null,
    recurrence: timing.kind || "event_based",
  };
}

function catalogSourceId(entry) {
  if (sourceIdByUrl.has(entry.source.url)) return sourceIdByUrl.get(entry.source.url);
  const sourceId = `CAT-${entry.id.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  if (!sourceById.has(sourceId)) {
    const source = {
      source_id: sourceId,
      authority: "Published NextDue source reference",
      title: entry.source.title,
      url: entry.source.url,
      jurisdiction: entry.country,
      language: entry.source.url.includes("consultant.ru") || entry.source.url.includes("nalog.gov.ru") ? "ru" : "en_or_local",
      publication_or_effective_date: null,
      last_verified: CATALOG_REVIEWED_AT,
      source_type: entry.source.url.includes("consultant.ru") ? "legal_text_database" : "official_guidance_or_legal_text",
      notes: `Source used by published catalog ${CATALOG_VERSION}. Verify current applicability before action.`,
    };
    sourceById.set(sourceId, source);
    sourceIdByUrl.set(source.url, sourceId);
    sources.push(source);
  }
  return sourceId;
}

function catalogRule(entry) {
  const match = entry.match || { kind: "manual" };
  const timing = catalogTiming(entry);
  const citizenshipScope = match.kind === "citizenship"
    ? "destination_citizen"
    : match.citizenships?.length
      ? "listed_citizenships"
      : match.kind === "foreigner_presence" || match.kind === "route"
        ? "non_destination_citizen"
        : "any_or_user_confirmed";
  const rule = {
    rule_id: `published.${entry.id}`,
    destination_country: entry.country,
    authority_level: "national_or_applicable_local",
    citizenship_scope_type: citizenshipScope,
    citizenship_values: asArray(match.citizenships),
    residence_or_entry_scope: match.kind,
    purpose: asArray(match.purposes).join("|") || "any",
    route_code: asArray(match.routes).join("|") || `catalog.${entry.id}`,
    person_role: entry.subjectType || "person",
    family_condition: null,
    employer_condition: entry.actor?.includes("employer") ? "confirmed_employer_or_contract" : null,
    institution_condition: null,
    asset_type: asArray(entry.assetTypes).join("|") || null,
    asset_condition: entry.subjectType === "asset" ? "exact_asset_record_required" : null,
    condition_expression: null,
    requirement_type: entry.outcome || entry.checklistKind || entry.category,
    requirement_name: textValue(entry.title),
    actor: entry.actor || "user_or_responsible_party",
    trigger_event: entry.trigger || entry.timing?.event || entry.timing?.kind || "user_confirmed_event",
    ...timing,
    required_evidence: unique([
      match.kind === "citizenship" ? "citizenship" : null,
      match.kind === "route" ? "selected_legal_route" : null,
      entry.subjectType === "asset" ? "exact_asset" : null,
      entry.timing?.sourceField || null,
    ]),
    exceptions: unique([
      match.excludeCitizenships?.length ? `Excluded citizenships: ${match.excludeCitizenships.join(", ")}` : null,
      entry.risk === "high_applicability" ? "Applicability must be confirmed against the current official source." : null,
    ]),
    source_ids: [catalogSourceId(entry)],
    effective_from: null,
    effective_to: null,
    last_verified: CATALOG_REVIEWED_AT,
    review_status: "verified",
    confidence: entry.confidence || "medium",
    notes: `${textValue(entry.summary)} Published catalog version ${CATALOG_VERSION}; user-confirmed facts and dates take precedence.`,
  };
  rule.condition_expression = stablePredicate(rule, match);
  return rule;
}

const researchRules = [...cisEuropeRules, ...asiaRules].map(normalizeRule);
const publishedRules = CATALOG.map(catalogRule);
const rules = [...publishedRules, ...researchRules].sort((a, b) =>
  a.destination_country.localeCompare(b.destination_country)
  || a.review_status.localeCompare(b.review_status)
  || a.rule_id.localeCompare(b.rule_id));

const ruleIds = new Set();
for (const rule of rules) {
  if (!rule.rule_id || ruleIds.has(rule.rule_id)) throw new Error(`Duplicate or empty rule_id: ${rule.rule_id}`);
  ruleIds.add(rule.rule_id);
  for (const sourceId of rule.source_ids) if (!sourceById.has(sourceId)) throw new Error(`Missing source ${sourceId} for ${rule.rule_id}`);
}

const countries = unique(rules.map((rule) => rule.destination_country)).sort();
const generatedAt = new Date().toISOString();
const ruleRegistry = {
  schema_version: "1.0.0",
  generated_at: generatedAt,
  catalog_version: CATALOG_VERSION,
  legal_notice: "Research index, not legal advice. A rule is actionable only after its review status, applicability facts, trigger, deadline and current official source are confirmed.",
  countries: countries.map((code) => ({ code, name: textValue(COUNTRY_META[code]?.name) || code, flag: COUNTRY_META[code]?.flag || "" })),
  rules,
};
const sourceRegistry = {
  schema_version: "1.0.0",
  generated_at: generatedAt,
  sources: [...sources].sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction) || a.source_id.localeCompare(b.source_id)),
};

await fs.writeFile(path.join(researchDir, "rules_registry.json"), `${JSON.stringify(ruleRegistry, null, 2)}\n`);
await fs.writeFile(path.join(researchDir, "sources_registry.json"), `${JSON.stringify(sourceRegistry, null, 2)}\n`);

console.log(JSON.stringify({
  schema_version: ruleRegistry.schema_version,
  countries: countries.length,
  rules: rules.length,
  published_rules: publishedRules.length,
  research_rules: researchRules.length,
  sources: sourceRegistry.sources.length,
}, null, 2));

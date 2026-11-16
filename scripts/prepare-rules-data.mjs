import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRY_META } from "../dist/catalog.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const researchDir = path.join(projectDir, "research");

const readJson = async (filename) => JSON.parse(await fs.readFile(path.join(researchDir, filename), "utf8"));
const asArray = (value, key) => Array.isArray(value) ? value : (Array.isArray(value?.[key]) ? value[key] : []);
const unique = (values) => [...new Set(values.filter(Boolean))];
const textValue = (value) => value?.en || value?.ru || value?.["uz-Latn"] || value || "";

const cisRules = asArray(await readJson("rules_cis_verified.json"), "rules");
const cisSources = asArray(await readJson("sources_cis_verified.json"), "sources");
const europeRules = asArray(await readJson("rules_europe_verified.json"), "rules");
const europeSources = asArray(await readJson("sources_europe_verified.json"), "sources");
const europePromptRules = asArray(await readJson("rules_europe_prompts.json"), "rules");
const europePromptSources = asArray(await readJson("sources_europe_prompts.json"), "sources");
const asiaRules = asArray(await readJson("rules_asia_verified.json"), "rules");
const asiaSources = asArray(await readJson("sources_asia_verified.json"), "sources");
const model = await readJson("workbook_model.json");

const sourceCandidates = [...cisSources, ...europeSources, ...europePromptSources, ...asiaSources];
const sources = [];
const seenSourceIds = new Set();
for (const source of sourceCandidates) {
  if (!seenSourceIds.has(source.source_id)) {
    sources.push(source);
    seenSourceIds.add(source.source_id);
  }
}
const sourceById = new Map(sources.map((source) => [source.source_id, source]));

function stablePredicate(rule, original) {
  const all = [{ field: "country_context.country", op: "eq", value: rule.destination_country }];
  if (rule.citizenship_values?.length) all.push({ field: "person.citizenships", op: "intersects", value: rule.citizenship_values });
  else if (rule.citizenship_scope_type) all.push({ field: "person.citizenships", op: "matches_scope", value: rule.citizenship_scope_type });
  if (rule.purpose && rule.purpose !== "any") all.push({ field: "country_context.purpose", op: "eq", value: rule.purpose });
  if (rule.route_code) all.push({ field: "country_context.route_code", op: "matches_route_family", value: rule.route_code });
  if (rule.family_condition) all.push({ field: "country_context.family_link", op: "satisfies", value: rule.family_condition });
  if (rule.employer_condition) all.push({ field: "country_context.employer", op: "satisfies", value: rule.employer_condition });
  if (rule.institution_condition) all.push({ field: "country_context.institution", op: "satisfies", value: rule.institution_condition });
  if (rule.asset_type && rule.asset_type !== "any") all.push({ field: "asset.type", op: "eq", value: rule.asset_type });
  if (rule.asset_condition) all.push({ field: "asset", op: "satisfies", value: rule.asset_condition });
  return {
    language: "nextdue_predicate_v1",
    all,
    source_expression: typeof original === "string" ? original : JSON.stringify(original || {}),
  };
}

function sourceSupportsExactRule(rule) {
  const ruleText = [rule.rule_id, rule.route_code, rule.requirement_type, rule.requirement_name].join(" ").toLowerCase();
  const sourceText = asArray(rule.source_ids).map((sourceId) => {
    const source = sourceById.get(sourceId) || {};
    return [source.title, source.authority, source.url, source.source_type, source.notes].join(" ").toLowerCase();
  }).join(" ");
  const topicChecks = [
    { rule: /study|student|education|research/, source: /study|student|education|research/ },
    { rule: /family|dependant|dependent|spouse|reunification/, source: /family|dependant|dependent|spouse|reunification/ },
    { rule: /address|arrival|population.registration/, source: /address|arrival|population|registration|residence/ },
    { rule: /permanent|long.term/, source: /permanent|long.term/ },
    { rule: /work|employment|patent/, source: /work|employment|labour|labor|patent/ },
    { rule: /passport|identity|citizen.*document|id.card/, source: /passport|identity|citizen|document|id.card/ },
    { rule: /vehicle|motor|driving|inspection|insurance/, source: /vehicle|motor|driving|transport|inspection|insurance|roadworthiness/ },
    { rule: /property|land|cadastr/, source: /property|land|cadastr|housing|real.estate/ },
    { rule: /business|company|entrepreneur|self.employ/, source: /business|company|entrepreneur|self.employ|register/ },
  ];
  const relevant = topicChecks.find((check) => check.rule.test(ruleText));
  return relevant ? relevant.source.test(sourceText) : true;
}

function normalizeCitizenshipScope(value) {
  const scope = String(value || "").toLowerCase();
  if (["all", "any", "any_or_user_confirmed"].includes(scope)) return "all";
  if (["destination_citizen", "destination_citizen_only"].includes(scope)) return "destination_citizen";
  if (["non_destination_citizen", "category_specific_foreign_worker", "visa_free_non_eaeu_non_exempt_worker"].includes(scope)) return "non_destination_citizen";
  if (["listed_citizenships", "citizenship_allowlist"].includes(scope)) return "specific_citizenships";
  if (["excluded_citizenships"].includes(scope)) return "excluded_citizenships";
  return "eligibility_specific";
}

function normalizePersonRole(value) {
  const role = String(value || "").toLowerCase();
  if (role.includes("dependant") || role.includes("dependent")) return "dependant";
  if (role === "principal") return "principal";
  if (role.includes("sponsor")) return "sponsor";
  if (role.includes("owner") || role === "asset") return "owner";
  if (role.includes("keeper") || role.includes("operator")) return "keeper_operator";
  return "applicant";
}

function normalizeActor(value) {
  const actor = String(value || "").toLowerCase();
  const known = new Set(["applicant", "dependant", "sponsor", "employer", "institution", "host", "asset_owner", "asset_keeper_operator", "authority", "applicant_and_employer", "applicant_and_institution", "applicant_and_sponsor", "applicant_employer_and_sponsor", "user_confirmed"]);
  if (known.has(actor)) return actor;
  if ((actor.includes("employer") || actor.includes("worker")) && actor.includes("sponsor")) return "applicant_employer_and_sponsor";
  if (actor.includes("employer") || actor.includes("worker")) return "applicant_and_employer";
  if (actor.includes("student") || actor.includes("institution")) return "applicant_and_institution";
  if (actor.includes("sponsor")) return "applicant_and_sponsor";
  if (actor.includes("host") || actor.includes("receiving") || actor.includes("inviting") || actor.includes("accommodation")) return "host";
  if (actor.includes("keeper") || actor.includes("operator")) return "asset_keeper_operator";
  if (actor.includes("asset_owner")) return "asset_owner";
  if (actor.includes("authority")) return "authority";
  if (actor.includes("user") || actor.includes("responsible")) return "user_confirmed";
  return "applicant";
}

function normalizeRequirementType(value) {
  const requirement = String(value || "").toLowerCase();
  if (requirement.includes("entry") || requirement.includes("visa")) return "entry_permission";
  if (requirement.includes("work") || requirement.includes("employ")) return "work_authorization";
  if (requirement.includes("study")) return "study_permission";
  if (requirement.includes("family") || requirement.includes("depend")) return "family_status";
  if (requirement.includes("permanent")) return "permanent_residence";
  if (requirement.includes("residence") || requirement === "residence") return "residence_status";
  if (requirement.includes("address") || requirement.includes("arrival") || requirement.includes("registration_review")) return "address_registration";
  if (requirement.includes("insurance") || requirement.includes("vehicle_registration") || requirement.includes("property_registration") || requirement === "asset_document" || requirement === "property") return "asset_document";
  if (requirement.includes("inspection") || requirement === "transport") return "asset_checklist";
  if (requirement.includes("tax") || requirement.includes("fee") || requirement === "payment") return "payment";
  if (requirement.includes("notification") || requirement.includes("recurring")) return "notification";
  if (requirement.includes("identity") || requirement.includes("document") || requirement.includes("business_registration") || requirement.includes("self_employment")) return "issued_document";
  return "other";
}

function normalizePurpose(value) {
  const purpose = String(value || "").toLowerCase();
  if (["any", "administration", "asset_admin", "identity"].includes(purpose)) return "any";
  if (["long_term", "stay"].includes(purpose)) return "residence";
  return ["visit", "work", "study", "family", "business", "residence", "protection", "other", "unknown"].includes(purpose) ? purpose : "other";
}

function normalizeAssetType(value) {
  if (value === null || value === undefined || value === "") return null;
  const assetType = String(value).toLowerCase();
  if (assetType.includes("|")) return "any";
  if (assetType === "property") return "real_property";
  return ["real_property", "land", "vehicle", "watercraft", "business", "other"].includes(assetType) ? assetType : "other";
}

function normalizeRule(rule) {
  const normalizedName = String(rule.requirement_name || "").toLowerCase();
  const normalizedNotes = String(rule.notes || "").toLowerCase();
  let ruleSpecificity = rule.rule_specificity
    || (normalizedNotes.includes("exact_national_rule") ? "exact_national_rule" : null)
    || (normalizedNotes.includes("route_mapping") ? "route_mapping" : null)
    || (normalizedNotes.includes("research_prompt") || /^(check|resolve|review)\b/.test(normalizedName) ? "research_prompt" : null)
    || (["verified", "publishable"].includes(rule.review_status) ? "exact_national_rule" : "route_mapping");
  if (ruleSpecificity === "exact_national_rule" && !["verified", "publishable"].includes(rule.review_status) && !sourceSupportsExactRule(rule)) ruleSpecificity = "route_mapping";
  const deadlineTypeMap = {
    relative: "event_relative",
    age_milestones: "event_relative",
    annual_fixed_date: "periodic",
    monthly_day: "periodic",
    check_official_list: "unresolved",
    user_confirmed_or_check_official_list: "unresolved",
  };
  const normalized = {
    ...rule,
    rule_specificity: ruleSpecificity,
    citizenship_scope_type: normalizeCitizenshipScope(rule.citizenship_scope_type),
    person_role: normalizePersonRole(rule.person_role),
    actor: normalizeActor(rule.actor),
    requirement_type: normalizeRequirementType(rule.requirement_type),
    purpose: normalizePurpose(rule.purpose),
    asset_type: normalizeAssetType(rule.asset_type),
    deadline_type: deadlineTypeMap[rule.deadline_type] || rule.deadline_type,
    citizenship_values: asArray(rule.citizenship_values),
    required_evidence: asArray(rule.required_evidence),
    exceptions: Array.isArray(rule.exceptions) ? rule.exceptions : (rule.exceptions ? [rule.exceptions] : []),
    source_ids: asArray(rule.source_ids),
  };
  normalized.condition_expression = stablePredicate(normalized, rule.condition_expression);
  return normalized;
}

const retainedEuropePromptSuffixes = [
  ".entry.visa_stay",
  ".work.employer_duties",
  ".residence.temporary",
  ".vehicle.tax_fee",
  ".business.recurring",
  ".free_movement.registration",
];
const retainedEuropePrompts = europePromptRules
  .filter((rule) => retainedEuropePromptSuffixes.some((suffix) => rule.rule_id.endsWith(suffix)))
  .map((rule) => ({ ...rule, rule_specificity: "research_prompt", review_status: rule.review_status === "unresolved" ? "unresolved" : "partial" }));
const researchRules = [...cisRules, ...europeRules, ...retainedEuropePrompts, ...asiaRules].map(normalizeRule);
const rules = [...researchRules].sort((a, b) =>
  a.destination_country.localeCompare(b.destination_country)
  || a.review_status.localeCompare(b.review_status)
  || a.rule_id.localeCompare(b.rule_id));

const ruleIds = new Set();
const enumCodeSet = (entries) => new Set(entries.map((entry) => typeof entry === "string" ? entry : entry.code));
const allowedReviewStatuses = new Set(["mapped", "partial", "unresolved", "verified", "publishable", "retired"]);
const allowedDeadlineTypes = new Set(["printed_expiry", "event_relative", "fixed_date", "periodic", "authority_notice", "user_confirmed", "not_applicable", "unresolved"]);
const allowedPurposes = enumCodeSet(model.enums.purposes);
const allowedRequirementTypes = enumCodeSet(model.enums.requirement_types);
const allowedActors = enumCodeSet(model.enums.actors);
const allowedPersonRoles = enumCodeSet(model.enums.person_roles);
const allowedCitizenshipScopes = enumCodeSet(model.enums.citizenship_scope_types);
const allowedAssetTypes = enumCodeSet(model.enums.asset_types);
const requiredRuleFields = [
  "rule_id", "destination_country", "authority_level", "citizenship_scope_type",
  "residence_or_entry_scope", "purpose", "route_code", "person_role",
  "condition_expression", "requirement_type", "requirement_name", "actor",
  "trigger_event", "deadline_type", "required_evidence", "source_ids",
  "last_verified", "review_status", "confidence",
  "rule_specificity",
];
for (const rule of rules) {
  if (!rule.rule_id || ruleIds.has(rule.rule_id)) throw new Error(`Duplicate or empty rule_id: ${rule.rule_id}`);
  ruleIds.add(rule.rule_id);
  for (const field of requiredRuleFields) {
    if (rule[field] === null || rule[field] === undefined || rule[field] === "") throw new Error(`Missing ${field} for ${rule.rule_id}`);
  }
  if (!allowedReviewStatuses.has(rule.review_status)) throw new Error(`Invalid review_status ${rule.review_status} for ${rule.rule_id}`);
  if (!allowedDeadlineTypes.has(rule.deadline_type)) throw new Error(`Invalid deadline_type ${rule.deadline_type} for ${rule.rule_id}`);
  if (!allowedPurposes.has(rule.purpose)) throw new Error(`Invalid purpose ${rule.purpose} for ${rule.rule_id}`);
  if (!allowedRequirementTypes.has(rule.requirement_type)) throw new Error(`Invalid requirement_type ${rule.requirement_type} for ${rule.rule_id}`);
  if (!allowedActors.has(rule.actor)) throw new Error(`Invalid actor ${rule.actor} for ${rule.rule_id}`);
  if (!allowedPersonRoles.has(rule.person_role)) throw new Error(`Invalid person_role ${rule.person_role} for ${rule.rule_id}`);
  if (!allowedCitizenshipScopes.has(rule.citizenship_scope_type)) throw new Error(`Invalid citizenship_scope_type ${rule.citizenship_scope_type} for ${rule.rule_id}`);
  if (rule.asset_type !== null && !allowedAssetTypes.has(rule.asset_type)) throw new Error(`Invalid asset_type ${rule.asset_type} for ${rule.rule_id}`);
  if (!["exact_national_rule", "route_mapping", "research_prompt"].includes(rule.rule_specificity)) throw new Error(`Invalid rule_specificity ${rule.rule_specificity} for ${rule.rule_id}`);
  if (rule.last_verified !== "2026-11-16") throw new Error(`Stale or unexpected verification date for ${rule.rule_id}: ${rule.last_verified}`);
  if (!Array.isArray(rule.source_ids) || rule.source_ids.length === 0) throw new Error(`No authoritative source for ${rule.rule_id}`);
  if (!Array.isArray(rule.required_evidence)) throw new Error(`required_evidence must be an array for ${rule.rule_id}`);
  if (rule.deadline_value !== null && rule.deadline_value !== undefined && rule.deadline_value !== "" && rule.rule_specificity !== "exact_national_rule") {
    throw new Error(`Exact timing appears on a non-exact rule ${rule.rule_id}`);
  }
  for (const sourceId of rule.source_ids) if (!sourceById.has(sourceId)) throw new Error(`Missing source ${sourceId} for ${rule.rule_id}`);
}

const sourceIds = new Set();
for (const source of sources) {
  if (!source.source_id || sourceIds.has(source.source_id)) throw new Error(`Duplicate or empty source_id: ${source.source_id}`);
  sourceIds.add(source.source_id);
  for (const field of ["authority", "title", "url", "jurisdiction", "language", "last_verified", "source_type"]) {
    if (source[field] === null || source[field] === undefined || source[field] === "") throw new Error(`Missing ${field} for ${source.source_id}`);
  }
  const url = new URL(source.url);
  if (url.protocol !== "https:") throw new Error(`Non-HTTPS source URL for ${source.source_id}: ${source.url}`);
  if (source.last_verified !== "2026-11-16") throw new Error(`Stale or unexpected verification date for ${source.source_id}: ${source.last_verified}`);
  if (!/official|legal|legislation|law|government|treaty|state/i.test(source.source_type)) throw new Error(`Non-authoritative source_type for ${source.source_id}: ${source.source_type}`);
}

const countries = unique(rules.map((rule) => rule.destination_country)).sort();
const expectedCountries = ["AM","AT","AZ","BE","BY","CH","CN","CY","CZ","DE","DK","EE","ES","FI","FR","GB","GE","GR","HK","ID","IE","IT","JP","KG","KR","KZ","MD","MY","NL","NO","PH","PL","PT","RU","SE","SG","TH","TJ","TM","TW","UZ","VN"];
if (countries.join(",") !== expectedCountries.join(",")) {
  throw new Error(`Country coverage mismatch. Expected ${expectedCountries.join(",")}; got ${countries.join(",")}`);
}
for (const country of countries) {
  const countryRules = rules.filter((rule) => rule.destination_country === country);
  if (countryRules.length < 10) throw new Error(`Insufficient rule-level coverage for ${country}: ${countryRules.length} rows`);
  const exactRules = countryRules.filter((rule) => rule.rule_specificity === "exact_national_rule").length;
  const substantiveRules = countryRules.filter((rule) => rule.rule_specificity !== "research_prompt").length;
  if (exactRules < 1) throw new Error(`No exact national-rule coverage for ${country}`);
  if (substantiveRules < 5) throw new Error(`Insufficient non-prompt coverage for ${country}: ${substantiveRules} rows`);
}
const generatedAt = new Date().toISOString();
const referencedSourceIds = new Set(rules.flatMap((rule) => rule.source_ids));
const referencedSources = sources.filter((source) => referencedSourceIds.has(source.source_id));
const ruleRegistry = {
  schema_version: "1.0.0",
  generated_at: generatedAt,
  catalog_version: "authoritative-research-2026-11-16",
  legal_notice: "Research index, not legal advice. A rule is actionable only after its review status, applicability facts, trigger, deadline and current official source are confirmed.",
  countries: countries.map((code) => ({ code, name: textValue(COUNTRY_META[code]?.name) || code, flag: COUNTRY_META[code]?.flag || "" })),
  rules,
};
const sourceRegistry = {
  schema_version: "1.0.0",
  generated_at: generatedAt,
  sources: [...referencedSources].sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction) || a.source_id.localeCompare(b.source_id)),
};

await fs.writeFile(path.join(researchDir, "rules_registry.json"), `${JSON.stringify(ruleRegistry, null, 2)}\n`);
await fs.writeFile(path.join(researchDir, "sources_registry.json"), `${JSON.stringify(sourceRegistry, null, 2)}\n`);

console.log(JSON.stringify({
  schema_version: ruleRegistry.schema_version,
  countries: countries.length,
  rules: rules.length,
  research_rules: researchRules.length,
  sources: sourceRegistry.sources.length,
}, null, 2));

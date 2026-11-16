import type { AdapterAccountType } from "next-auth/adapters";
import { sql } from "drizzle-orm";
import {
  boolean,
  bigint,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const appSchema = pgSchema("app");

export const users = appSchema.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  locale: text("locale").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});

export const oauthAccounts = appSchema.table("oauth_accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state")
}, (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]);

export const sessions = appSchema.table("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull()
}, (table) => [index("sessions_user_idx").on(table.userId)]);

export const verificationTokens = appSchema.table("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull()
}, (table) => [primaryKey({ columns: [table.identifier, table.token] })]);

export const households = appSchema.table("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  defaultLocale: text("default_locale").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});

export const memberships = appSchema.table("memberships", {
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().$type<"owner" | "admin" | "member" | "viewer">()
}, (table) => [
  primaryKey({ columns: [table.householdId, table.userId] }),
  index("memberships_user_idx").on(table.userId)
]);

export const people = appSchema.table("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  displayLabel: text("display_label").notNull(),
  birthDate: date("birth_date", { mode: "string" }),
  status: text("status").notNull().default("active").$type<"active" | "archived">(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [
  unique("people_id_household_key").on(table.id, table.householdId),
  index("people_household_idx").on(table.householdId)
]);

export const personCitizenships = appSchema.table("person_citizenships", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull(),
  countryCode: text("country_code").notNull(),
  acquiredOn: date("acquired_on", { mode: "string" }),
  endedOn: date("ended_on", { mode: "string" }),
  confirmation: text("confirmation").notNull().default("user_confirmed").$type<"unconfirmed" | "user_confirmed" | "verified">()
}, (table) => [
  foreignKey({ columns: [table.personId, table.householdId], foreignColumns: [people.id, people.householdId], name: "person_citizenships_person_household_fk" }).onDelete("cascade"),
  uniqueIndex("person_citizenships_active_idx").on(table.personId, table.countryCode).where(sql`${table.endedOn} is null`),
  index("person_citizenships_household_idx").on(table.householdId)
]);

export const personCountryContexts = appSchema.table("person_country_contexts", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull(),
  countryCode: text("country_code").notNull(),
  contextType: text("context_type").notNull().$type<"usual_residence" | "lives_now" | "physical_stay" | "destination" | "planned_trip" | "planned_move" | "tax_residence" | "previous_residence">(),
  purpose: text("purpose").$type<"visit" | "work" | "study" | "family" | "business" | "protection" | "long_term" | "unknown">(),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" }),
  confirmation: text("confirmation").notNull().default("user_confirmed").$type<"unconfirmed" | "user_confirmed" | "verified">(),
  notes: text("notes")
}, (table) => [
  unique("person_country_contexts_id_household_key").on(table.id, table.householdId),
  foreignKey({ columns: [table.personId, table.householdId], foreignColumns: [people.id, people.householdId], name: "person_country_contexts_person_household_fk" }).onDelete("cascade"),
  index("person_country_contexts_household_idx").on(table.householdId),
  index("person_country_contexts_person_country_idx").on(table.personId, table.countryCode)
]);

export const legalRoutes = appSchema.table("legal_routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  countryContextId: uuid("country_context_id").notNull(),
  routeCode: text("route_code").notNull(),
  routeFamily: text("route_family").notNull().default("unknown"),
  stage: text("stage").notNull().$type<"exploring" | "preparing" | "applied" | "active" | "expired" | "ended">(),
  principalPersonId: uuid("principal_person_id").references(() => people.id, { onDelete: "set null" }),
  factsSchemaVersion: text("facts_schema_version"),
  facts: jsonb("facts").notNull().default({}),
  confirmation: text("confirmation").notNull().default("unconfirmed").$type<"unconfirmed" | "user_confirmed" | "verified">()
}, (table) => [
  unique("legal_routes_id_household_key").on(table.id, table.householdId),
  foreignKey({ columns: [table.countryContextId, table.householdId], foreignColumns: [personCountryContexts.id, personCountryContexts.householdId], name: "legal_routes_context_household_fk" }).onDelete("cascade"),
  uniqueIndex("legal_routes_context_idx").on(table.countryContextId),
  index("legal_routes_household_idx").on(table.householdId)
]);

export const routeParties = appSchema.table("route_parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  legalRouteId: uuid("legal_route_id").notNull(),
  partyType: text("party_type").notNull().$type<"employer" | "sponsor" | "institution" | "host" | "principal">(),
  personId: uuid("person_id").references(() => people.id, { onDelete: "set null" }),
  label: text("label"),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" })
}, (table) => [
  foreignKey({ columns: [table.legalRouteId, table.householdId], foreignColumns: [legalRoutes.id, legalRoutes.householdId], name: "route_parties_route_household_fk" }).onDelete("cascade"),
  index("route_parties_route_idx").on(table.legalRouteId)
]);

export const personRelationships = appSchema.table("person_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  fromPersonId: uuid("from_person_id").notNull(),
  toPersonId: uuid("to_person_id").notNull(),
  relationshipType: text("relationship_type").notNull().$type<"spouse" | "child" | "parent" | "dependant" | "guardian" | "other">(),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" }),
  confirmation: text("confirmation").notNull().default("user_confirmed")
}, (table) => [
  foreignKey({ columns: [table.fromPersonId, table.householdId], foreignColumns: [people.id, people.householdId], name: "person_relationships_from_household_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.toPersonId, table.householdId], foreignColumns: [people.id, people.householdId], name: "person_relationships_to_household_fk" }).onDelete("cascade"),
  check("person_relationship_not_self", sql`${table.fromPersonId} <> ${table.toPersonId}`),
  index("person_relationships_household_idx").on(table.householdId)
]);

export const assets = appSchema.table("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),
  assetSubtype: text("asset_subtype"),
  displayLabel: text("display_label").notNull(),
  status: text("status").notNull().default("active").$type<"active" | "disposed" | "archived">(),
  acquiredOn: date("acquired_on", { mode: "string" }),
  disposedOn: date("disposed_on", { mode: "string" }),
  factsSchemaVersion: text("facts_schema_version"),
  facts: jsonb("facts").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [
  unique("assets_id_household_key").on(table.id, table.householdId),
  index("assets_household_idx").on(table.householdId)
]);

export const assetJurisdictions = appSchema.table("asset_jurisdictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull(),
  countryCode: text("country_code").notNull(),
  subdivisionCode: text("subdivision_code"),
  role: text("role").notNull().$type<"location" | "registration" | "tax" | "ownership" | "use" | "incorporation" | "other">(),
  isPrimary: boolean("is_primary").notNull().default(false),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" })
}, (table) => [
  foreignKey({ columns: [table.assetId, table.householdId], foreignColumns: [assets.id, assets.householdId], name: "asset_jurisdictions_asset_household_fk" }).onDelete("cascade"),
  index("asset_jurisdictions_asset_idx").on(table.assetId),
  uniqueIndex("asset_jurisdictions_primary_idx").on(table.assetId).where(sql`${table.isPrimary} = true and ${table.endsOn} is null`),
  index("asset_jurisdictions_household_idx").on(table.householdId)
]);

export const assetPersonRoles = appSchema.table("asset_person_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id").notNull(),
  personId: uuid("person_id").notNull(),
  role: text("role").notNull().$type<"owner" | "co_owner" | "registered_owner" | "keeper" | "operator" | "taxpayer" | "responsible_person">(),
  shareBasisPoints: integer("share_basis_points"),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" })
}, (table) => [
  foreignKey({ columns: [table.assetId, table.householdId], foreignColumns: [assets.id, assets.householdId], name: "asset_person_roles_asset_household_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.personId, table.householdId], foreignColumns: [people.id, people.householdId], name: "asset_person_roles_person_household_fk" }).onDelete("cascade"),
  check("asset_person_role_share_check", sql`${table.shareBasisPoints} is null or (${table.role} in ('owner', 'co_owner') and ${table.shareBasisPoints} between 1 and 10000)`),
  uniqueIndex("asset_person_roles_active_idx").on(table.assetId, table.personId, table.role).where(sql`${table.endsOn} is null`),
  index("asset_person_roles_household_idx").on(table.householdId)
]);

export const catalogPacks = appSchema.table("catalog_packs", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: text("country_code").notNull(),
  version: text("version").notNull(),
  reviewedAt: date("reviewed_at", { mode: "string" }).notNull(),
  status: text("status").notNull().$type<"draft" | "reviewed" | "retired">()
}, (table) => [uniqueIndex("catalog_packs_country_version_idx").on(table.countryCode, table.version)]);

export const catalogItems = appSchema.table("catalog_items", {
  id: text("id").notNull(),
  packId: uuid("pack_id").notNull().references(() => catalogPacks.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  subjectKind: text("subject_kind").notNull().$type<"person" | "asset" | "household">(),
  applicability: jsonb("applicability").notNull(),
  scheduleTemplate: jsonb("schedule_template").notNull(),
  defaultReminderInput: text("default_reminder_input").notNull(),
  confidence: text("confidence").notNull().$type<"high" | "medium" | "low">(),
  risk: text("risk").notNull().$type<"administrative" | "legal" | "tax">()
}, (table) => [primaryKey({ columns: [table.id, table.packId] })]);

export const catalogTranslations = appSchema.table("catalog_translations", {
  itemId: text("item_id").notNull(),
  packId: uuid("pack_id").notNull(),
  locale: text("locale").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  audience: text("audience").notNull()
}, (table) => [
  primaryKey({ columns: [table.itemId, table.packId, table.locale] })
]);

export const catalogSources = appSchema.table("catalog_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: text("item_id").notNull(),
  packId: uuid("pack_id").notNull(),
  authority: text("authority").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  reviewedAt: date("reviewed_at", { mode: "string" }).notNull()
});

export const registrySources = appSchema.table("registry_sources", {
  id: text("id").primaryKey(),
  authority: text("authority").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  language: text("language"),
  sourceType: text("source_type").notNull(),
  publicationOrEffectiveDate: date("publication_or_effective_date", { mode: "string" }),
  lastVerified: date("last_verified", { mode: "string" }).notNull(),
  notes: text("notes")
});

export const registryRules = appSchema.table("registry_rules", {
  id: text("id").primaryKey(),
  destinationCountry: text("destination_country").notNull(),
  authorityLevel: text("authority_level").notNull(),
  requirementType: text("requirement_type").notNull(),
  requirementName: text("requirement_name").notNull(),
  ruleSpecificity: text("rule_specificity").notNull().$type<"exact_national_rule" | "route_mapping" | "research_prompt">(),
  reviewStatus: text("review_status").notNull().$type<"verified" | "publishable" | "mapped" | "partial" | "retired">(),
  runtimeTier: text("runtime_tier").notNull().$type<"ready" | "confirm" | "research">(),
  conditionExpression: jsonb("condition_expression").notNull(),
  triggerEvent: text("trigger_event"),
  deadlineType: text("deadline_type").notNull(),
  deadlineValue: integer("deadline_value"),
  deadlineUnit: text("deadline_unit"),
  recurrence: text("recurrence"),
  requiredEvidence: text("required_evidence").array().notNull(),
  effectiveFrom: date("effective_from", { mode: "string" }),
  effectiveTo: date("effective_to", { mode: "string" }),
  lastVerified: date("last_verified", { mode: "string" }).notNull(),
  notes: text("notes")
}, (table) => [
  index("registry_rules_country_tier_idx").on(table.destinationCountry, table.runtimeTier),
  index("registry_rules_review_idx").on(table.reviewStatus, table.ruleSpecificity)
]);

export const registryRuleSources = appSchema.table("registry_rule_sources", {
  ruleId: text("rule_id").notNull().references(() => registryRules.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull().references(() => registrySources.id, { onDelete: "restrict" }),
  position: integer("position").notNull().default(0)
}, (table) => [primaryKey({ columns: [table.ruleId, table.sourceId] })]);

export const issuedDocuments = appSchema.table("issued_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  subjectType: text("subject_type").notNull().$type<"person" | "asset">(),
  personId: uuid("person_id"),
  assetId: uuid("asset_id"),
  legalRouteId: uuid("legal_route_id").references(() => legalRoutes.id, { onDelete: "set null" }),
  sourceRuleId: text("source_rule_id").references(() => registryRules.id, { onDelete: "set null" }),
  documentType: text("document_type").notNull(),
  title: text("title").notNull(),
  issuingCountry: text("issuing_country"),
  issuingAuthority: text("issuing_authority"),
  status: text("status").notNull().$type<"planned" | "applied" | "active" | "expired" | "replaced" | "cancelled">(),
  issuedOn: date("issued_on", { mode: "string" }),
  validFrom: date("valid_from", { mode: "string" }),
  validUntil: date("valid_until", { mode: "string" }),
  identifierSuffix: text("identifier_suffix"),
  confirmation: text("confirmation").notNull().default("user_confirmed"),
  notes: text("notes")
}, (table) => [
  unique("issued_documents_id_household_key").on(table.id, table.householdId),
  foreignKey({ columns: [table.personId, table.householdId], foreignColumns: [people.id, people.householdId], name: "issued_documents_person_household_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.assetId, table.householdId], foreignColumns: [assets.id, assets.householdId], name: "issued_documents_asset_household_fk" }).onDelete("cascade"),
  check("issued_document_subject_check", sql`(${table.subjectType} = 'person' and ${table.personId} is not null and ${table.assetId} is null) or (${table.subjectType} = 'asset' and ${table.assetId} is not null and ${table.personId} is null)`),
  index("issued_documents_household_idx").on(table.householdId),
  index("issued_documents_person_idx").on(table.personId),
  index("issued_documents_asset_idx").on(table.assetId)
]);

export const obligations = appSchema.table("obligations", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  subjectType: text("subject_type").notNull().$type<"household" | "person" | "asset">(),
  personId: uuid("person_id"),
  assetId: uuid("asset_id"),
  responsiblePersonId: uuid("responsible_person_id").references(() => people.id, { onDelete: "set null" }),
  countryContextId: uuid("country_context_id").references(() => personCountryContexts.id, { onDelete: "set null" }),
  legalRouteId: uuid("legal_route_id").references(() => legalRoutes.id, { onDelete: "set null" }),
  issuedDocumentId: uuid("issued_document_id").references(() => issuedDocuments.id, { onDelete: "set null" }),
  countryCode: text("country_code").notNull(),
  sourceRuleId: text("source_rule_id").references(() => registryRules.id, { onDelete: "set null" }),
  catalogItemId: text("catalog_item_id"),
  catalogVersion: text("catalog_version"),
  title: text("title").notNull(),
  deadlineKind: text("deadline_kind").notNull().default("unresolved").$type<"unresolved" | "expiry" | "due_once" | "recurring">(),
  triggerEvent: text("trigger_event"),
  dueOn: date("due_on", { mode: "string" }),
  recurrence: jsonb("recurrence"),
  deadlineSource: text("deadline_source").notNull().default("unresolved").$type<"unresolved" | "printed_document" | "official_notice" | "user_confirmed" | "rule_calculated">(),
  applicability: text("applicability").notNull().default("candidate").$type<"candidate" | "confirmed" | "not_applicable">(),
  reminderInput: text("reminder_input").notNull().default(""),
  reminderOffsets: integer("reminder_offsets").array().notNull().default(sql`'{}'::integer[]`),
  notes: text("notes"),
  status: text("status").notNull().default("active").$type<"active" | "paused" | "completed">(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [
  unique("obligations_id_household_key").on(table.id, table.householdId),
  foreignKey({ columns: [table.personId, table.householdId], foreignColumns: [people.id, people.householdId], name: "obligations_person_household_fk" }).onDelete("cascade"),
  foreignKey({ columns: [table.assetId, table.householdId], foreignColumns: [assets.id, assets.householdId], name: "obligations_asset_household_fk" }).onDelete("cascade"),
  check("obligation_subject_check", sql`(${table.subjectType} = 'household' and ${table.personId} is null and ${table.assetId} is null) or (${table.subjectType} = 'person' and ${table.personId} is not null and ${table.assetId} is null) or (${table.subjectType} = 'asset' and ${table.assetId} is not null and ${table.personId} is null)`),
  check("obligation_due_date_check", sql`${table.dueOn} is null or ${table.deadlineKind} <> 'unresolved'`),
  index("obligations_household_idx").on(table.householdId),
  index("obligations_next_due_idx").on(table.status, table.dueOn)
]);

export const reminderDeliveries = appSchema.table("reminder_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  obligationId: uuid("obligation_id").notNull(),
  occurrenceDate: date("occurrence_date", { mode: "string" }).notNull(),
  offsetDays: integer("offset_days").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("pending").$type<"pending" | "claimed" | "sent" | "failed" | "cancelled">(),
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true, mode: "date" })
}, (table) => [
  foreignKey({ columns: [table.obligationId, table.householdId], foreignColumns: [obligations.id, obligations.householdId], name: "reminder_deliveries_obligation_household_fk" }).onDelete("cascade"),
  uniqueIndex("reminder_delivery_idempotency_idx").on(
    table.householdId,
    table.obligationId,
    table.occurrenceDate,
    table.offsetDays,
    table.channel
  ),
  index("reminder_deliveries_pending_idx").on(table.status, table.nextAttemptAt)
]);

export const calendarFeeds = appSchema.table("calendar_feeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  name: text("name").notNull().default("NextDue"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});

export const auditEvents = appSchema.table("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: jsonb("details").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});

export const householdSnapshots = appSchema.table("household_snapshots", {
  householdId: uuid("household_id").primaryKey().references(() => households.id, { onDelete: "cascade" }),
  revision: bigint("revision", { mode: "number" }).notNull().default(1),
  schemaVersion: integer("schema_version").notNull(),
  state: jsonb("state").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});

export const ruleCandidates = appSchema.table("rule_candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  subjectType: text("subject_type").notNull().$type<"household" | "person" | "asset">(),
  personId: uuid("person_id"),
  assetId: uuid("asset_id"),
  responsiblePersonId: uuid("responsible_person_id").references(() => people.id, { onDelete: "set null" }),
  sourceRuleId: text("source_rule_id").references(() => registryRules.id, { onDelete: "set null" }),
  catalogItemId: text("catalog_item_id"),
  catalogVersion: text("catalog_version"),
  countryCode: text("country_code").notNull(),
  title: text("title").notNull(),
  reason: text("reason"),
  proposedSchedule: jsonb("proposed_schedule").notNull().default({}),
  proposedReminderInput: text("proposed_reminder_input").notNull().default(""),
  status: text("status").notNull().default("pending").$type<"pending" | "accepted" | "dismissed" | "superseded">(),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at", { withTimezone: true, mode: "date" }),
  obligationId: uuid("obligation_id").references(() => obligations.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [index("rule_candidates_household_status_idx").on(table.householdId, table.status)]);

export const personNotificationRecipients = appSchema.table("person_notification_recipients", {
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  personId: uuid("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channel: text("channel").notNull().default("email").$type<"email">(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [primaryKey({ columns: [table.householdId, table.personId, table.userId, table.channel] })]);

export const notificationPreferences = appSchema.table("notification_preferences", {
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  locale: text("locale").notNull().default("en"),
  quietHoursStart: time("quiet_hours_start"),
  quietHoursEnd: time("quiet_hours_end"),
  timezone: text("timezone").notNull().default("UTC"),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [primaryKey({ columns: [table.householdId, table.userId] })]);

export const registryRuleRevisions = appSchema.table("registry_rule_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: text("rule_id").notNull().references(() => registryRules.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull(),
  status: text("status").notNull().$type<"draft" | "in_review" | "published" | "superseded" | "rejected">(),
  snapshot: jsonb("snapshot").notNull(),
  changeSummary: text("change_summary").notNull(),
  sourceSnapshot: jsonb("source_snapshot").notNull().default([]),
  createdBy: text("created_by").notNull(),
  reviewedBy: text("reviewed_by"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" })
}, (table) => [uniqueIndex("registry_rule_revisions_rule_revision_idx").on(table.ruleId, table.revision)]);

export const registryCorrections = appSchema.table("registry_corrections", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleId: text("rule_id").references(() => registryRules.id, { onDelete: "set null" }),
  sourceUrl: text("source_url"),
  report: text("report").notNull(),
  status: text("status").notNull().default("open").$type<"open" | "triaged" | "in_review" | "resolved" | "rejected">(),
  submittedBy: uuid("submitted_by").references(() => users.id, { onDelete: "set null" }),
  resolutionRevisionId: uuid("resolution_revision_id").references(() => registryRuleRevisions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" })
});

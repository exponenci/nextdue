import type { AdapterAccountType } from "next-auth/adapters";
import {
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
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

export const subjects = appSchema.table("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().$type<"person" | "asset">(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [index("subjects_household_idx").on(table.householdId)]);

export const people = appSchema.table("people", {
  subjectId: uuid("subject_id").primaryKey().references(() => subjects.id, { onDelete: "cascade" }),
  relationship: text("relationship").notNull().default("self"),
  birthDate: date("birth_date", { mode: "string" })
});

export const assets = appSchema.table("assets", {
  subjectId: uuid("subject_id").primaryKey().references(() => subjects.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(),
  assetSubtype: text("asset_subtype"),
  ownerSubjectId: uuid("owner_subject_id").references(() => subjects.id),
  registeredCountry: text("registered_country"),
  currentCountry: text("current_country"),
  details: text("details"),
  attributes: jsonb("attributes").notNull().default({})
});

export const subjectJurisdictions = appSchema.table("subject_jurisdictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  countryCode: text("country_code").notNull(),
  relation: text("relation").notNull().$type<"citizenship" | "residence" | "stay" | "tax" | "registration" | "location" | "destination" | "other">(),
  legalBasis: text("legal_basis"),
  exactStatus: text("exact_status"),
  startsOn: date("starts_on", { mode: "string" }),
  endsOn: date("ends_on", { mode: "string" }),
  notes: text("notes")
}, (table) => [index("subject_jurisdictions_household_idx").on(table.householdId)]);

export const personCitizenships = appSchema.table("person_citizenships", {
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  personSubjectId: uuid("person_subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  countryCode: text("country_code").notNull()
}, (table) => [
  primaryKey({ columns: [table.personSubjectId, table.countryCode] }),
  index("person_citizenships_household_idx").on(table.householdId)
]);

export const personCountryContexts = appSchema.table("person_country_contexts", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  personSubjectId: uuid("person_subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  countryCode: text("country_code").notNull(),
  contextType: text("context_type").notNull().$type<"lives_now" | "planned_trip" | "planned_move">(),
  purpose: text("purpose").notNull().$type<"visit" | "work" | "study" | "family" | "business" | "protection" | "long_term" | "unknown">(),
  startsOn: date("starts_on", { mode: "string" }),
  intendedUntil: date("intended_until", { mode: "string" })
}, (table) => [index("person_country_contexts_household_idx").on(table.householdId)]);

export const legalizationPaths = appSchema.table("legalization_paths", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  countryContextId: uuid("country_context_id").notNull().references(() => personCountryContexts.id, { onDelete: "cascade" }),
  routeCode: text("route_code").notNull(),
  stage: text("stage").notNull().$type<"exploring" | "preparing" | "applied" | "active" | "expired" | "ended">(),
  region: text("region"),
  locality: text("locality"),
  sponsorRef: text("sponsor_ref"),
  employerRef: text("employer_ref"),
  institutionRef: text("institution_ref"),
  facts: jsonb("facts").notNull().default({})
}, (table) => [index("legalization_paths_household_idx").on(table.householdId)]);

export const statusDocuments = appSchema.table("status_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  legalizationPathId: uuid("legalization_path_id").notNull().references(() => legalizationPaths.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  issuerCountry: text("issuer_country").notNull(),
  status: text("status").notNull().$type<"planned" | "applied" | "active" | "expired" | "replaced" | "cancelled">(),
  issuedAt: date("issued_at", { mode: "string" }),
  printedExpiry: date("printed_expiry", { mode: "string" }),
  numberHint: text("number_hint"),
  label: text("label"),
  note: text("note")
}, (table) => [index("status_documents_household_idx").on(table.householdId)]);

export const assetDocuments = appSchema.table("asset_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  assetSubjectId: uuid("asset_subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  issuerCountry: text("issuer_country"),
  status: text("status").notNull().$type<"needed" | "active" | "expired" | "replaced" | "not_applicable">(),
  issuedAt: date("issued_at", { mode: "string" }),
  printedExpiry: date("printed_expiry", { mode: "string" }),
  recurrence: jsonb("recurrence"),
  ruleId: text("rule_id"),
  note: text("note")
}, (table) => [index("asset_documents_household_idx").on(table.householdId)]);

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

export const documents = appSchema.table("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  typeKey: text("type_key").notNull(),
  issuingCountry: text("issuing_country"),
  expiresOn: date("expires_on", { mode: "string" }),
  label: text("label").notNull()
}, (table) => [index("documents_household_idx").on(table.householdId)]);

export const obligations = appSchema.table("obligations", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").references(() => subjects.id),
  countryContextId: uuid("country_context_id").references(() => personCountryContexts.id, { onDelete: "set null" }),
  legalizationPathId: uuid("legalization_path_id").references(() => legalizationPaths.id, { onDelete: "set null" }),
  statusDocumentId: uuid("status_document_id").references(() => statusDocuments.id, { onDelete: "set null" }),
  assetDocumentId: uuid("asset_document_id").references(() => assetDocuments.id, { onDelete: "set null" }),
  countryCode: text("country_code").notNull(),
  catalogItemId: text("catalog_item_id"),
  catalogVersion: text("catalog_version"),
  title: text("title").notNull(),
  schedule: jsonb("schedule").notNull(),
  reminderInput: text("reminder_input").notNull(),
  reminderOffsets: integer("reminder_offsets").array().notNull(),
  status: text("status").notNull().default("active").$type<"active" | "paused" | "completed">(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
}, (table) => [index("obligations_household_idx").on(table.householdId)]);

export const reminderDeliveries = appSchema.table("reminder_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  obligationId: uuid("obligation_id").notNull().references(() => obligations.id, { onDelete: "cascade" }),
  occurrenceDate: date("occurrence_date", { mode: "string" }).notNull(),
  offsetDays: integer("offset_days").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("pending").$type<"pending" | "claimed" | "sent" | "failed" | "cancelled">(),
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true, mode: "date" })
}, (table) => [
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
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});

export const auditEvents = appSchema.table("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow()
});

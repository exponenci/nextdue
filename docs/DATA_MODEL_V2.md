# Data model v2

Status: accepted for implementation

Review date: 2026-11-16

## Ownership rule

Every private row belongs to a household/account for authorization and lifecycle management. That tenant key does not answer what the record is about.

- A **person** belongs to one household.
- A **possession** belongs to one household and connects to zero or more people through dated roles.
- An **obligation** belongs to one household and has exactly one semantic subject: household, person or possession.
- `responsible_person_id` is independent of the obligation's subject.

Therefore assets and obligations are not valid “only for `account_id`” or “only for `person_id`”. `household_id` is always present for isolation; semantic links are explicit and separately constrained.

## Aggregate boundaries

```text
User --< Membership >-- Household
                         |--< Person --< Citizenship
                         |          |--< CountryContext --< LegalRoute --< RouteParty
                         |          |--< PersonRelationship
                         |          `--< IssuedDocument
                         |--< Asset --< AssetJurisdiction
                         |         |--< AssetPersonRole >-- Person
                         |         `--< IssuedDocument
                         `--< Obligation >-- Rule --< RuleSource >-- Source
                                  `-- responsible Person (optional)
```

## Stable entities

### Household and membership

`Household` is the tenant/security boundary. `User` is an authenticated identity. A membership carries owner/admin/member/viewer authorization. Product copy may say “household” while APIs and security documentation may call it an account/tenant.

### Person

Core fields: `id`, `household_id`, `display_label`, optional `date_of_birth`, status and timestamps. Citizenship, residence, routes and documents are not columns on Person.

### Citizenship

Repeatable and dated. Core fields: person, country, acquired/ended dates, confirmation state and optional evidence document.

### CountryContext

A dated relationship between one person and one country. `context_type` is one of usual residence, current residence, physical stay, destination, planned move, tax residence or previous residence. Purpose is nullable until relevant and confirmed. A person may repeat the same country for different periods or contexts.

### LegalRoute

Belongs to a CountryContext. Purpose, broad route family and exact country route code are separate. Stage is explicit: exploring, preparing, applied, active, expired or ended. A route can name a principal person and have repeatable `RouteParty` records for employer, sponsor, institution or host. Route-specific facts use a validated JSON object whose schema is versioned with the rule registry; arbitrary keys are rejected.

### PersonRelationship

A dated self-relation between two people for spouse, child, parent, dependant, guardian or another confirmed relationship. Rules may reference it; it is not inferred from the display label “Child 1”.

### Asset

An exact object with type, subtype, display label, lifecycle status and dates. Country is not a single overloaded column.

`AssetJurisdiction` records country, subdivision, role (`location`, `registration`, `tax`, `ownership`, `use`, `incorporation`, `other`), dates and whether it is the primary presentation context.

`AssetPersonRole` connects an asset to a person with role (`owner`, `co_owner`, `registered_owner`, `keeper`, `operator`, `taxpayer`, `responsible_person`), optional share and dates. A unique constraint prevents duplicate active roles.

### IssuedDocument

One table replaces `documents`, `status_documents` and `asset_documents`. Its subject is explicitly person or asset, enforced by a check constraint. It may reference a LegalRoute. Core fields cover type, exact title, issuing country/authority, lifecycle state, issued/valid dates, identifier suffix, confirmation state and source rule.

### Obligation

Core fields:

- tenant: `household_id`;
- subject: `subject_type` plus exactly one of `person_id` or `asset_id`, or neither for household;
- responsibility: optional `responsible_person_id`;
- provenance: optional rule, country context, legal route and issued document;
- deadline: type, trigger, due date, recurrence and deadline source;
- user state: applicability confirmation, workflow status, reminder input/offsets and notes.

Database constraint:

```sql
(subject_type = 'household' and person_id is null and asset_id is null)
or (subject_type = 'person' and person_id is not null and asset_id is null)
or (subject_type = 'asset' and asset_id is not null and person_id is null)
```

All referenced rows must have the same `household_id`. Catalog-derived title, country and rule identity are not mutable user fields.

### Rule and source

The research registry is canonical editorial input. `Rule` keeps all applicability dimensions, typed condition expression, evidence state, specificity, effective dates and verification date. `Source` is normalized and connected through `RuleSource`.

Automation permissions are derived from both fields:

| Specificity | Review state | Runtime permission |
|---|---|---|
| exact national rule | verified/publishable | deterministic match and candidate creation |
| exact national rule | partial/mapped | ask for facts; no automatic deadline |
| route mapping | any non-retired | route discovery only |
| research prompt | any non-retired | library/background only |

Unknown timing is stored as null with an unresolved deadline type. It is never replaced with today's date.

## Removed or replaced concepts

| Current concept | Decision |
|---|---|
| generic `subjects` base table | Replace with explicit Person and Asset IDs. Polymorphism exists only where it has a constrained business meaning. |
| `subject_jurisdictions` | Remove after import. Citizenship, person country context and asset jurisdiction are separate. |
| `assets.owner_subject_id` | Replace with `AssetPersonRole`. |
| `documents`, `status_documents`, `asset_documents` | Merge into `IssuedDocument`. |
| `obligations.subject_id` | Replace with `subject_type`, `person_id`, `asset_id`. |
| free-text asset Details | Replace with type-specific validated facts. |
| untyped route `facts` | Retain JSON only behind a versioned per-route schema; do not use it as arbitrary EAV storage. |

## Tenant and authorization invariants

- Every private aggregate carries `household_id`, even when it can be reached through another table.
- Foreign keys alone do not enforce tenant equality; mutations use transaction-scoped household context plus explicit same-tenant checks.
- PostgreSQL row-level security is defense in depth, not the only authorization layer.
- Public rules and sources are read-only and not tenant-scoped.
- OAuth identity tokens and future calendar connector tokens are separate stores and scopes.

## Static-state v5

The browser prototype mirrors the normalized graph with arrays for people, citizenships, country contexts, legal routes, route parties, person relationships, assets, asset jurisdictions, asset-person roles, issued documents and obligations. Helper selectors assemble view models; UI code does not edit nested person jurisdiction blobs.

The v4-to-v5 migration must:

1. split embedded citizenships and jurisdictions into normalized records;
2. turn `ownerId` into an owner AssetPersonRole;
3. assign obligation subject type from the old `assetId`/`subjectId` pair, preferring the asset when present;
4. retain the old person as `responsible_person_id` when an asset was the subject;
5. preserve catalog IDs, user dates, reminders and custom notes;
6. leave ambiguous routes and dates unconfirmed rather than guessing.

## Field relevance matrix

| Field | Required when | Hidden when |
|---|---|---|
| birth date | user enables an age-based rule | ordinary profile setup |
| purpose | context is stay/trip/move and affects matching | citizenship, asset-only context |
| exact legal route | non-citizen context after purpose selection | citizen context or unknown purpose |
| employer/sponsor/institution | selected route schema requires that party | all other routes |
| planned-until | user is planning a bounded stay | permanent/current residence with no known end |
| document valid-until | an issued document has a printed/confirmed expiry | route merely being explored |
| ownership share | owner or co-owner asset role | keeper/operator/taxpayer roles |
| asset registration country | vehicle/watercraft/business requires registration | property location-only flow |
| responsible person | household has multiple people or actor differs from subject | single-person household with same actor |
| reminder sequence | schedule has a confirmed due date or recurrence | unresolved deadline |

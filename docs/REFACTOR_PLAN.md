# V2 refactor plan

Status: implementation checkpoint

Review date: 2026-11-16

## Goals

1. Make the browser product and external schema implement the same normalized domain model.
2. Expose the 42-country registry without turning research prompts into legal obligations.
3. Make every form contextual and progressive.
4. Preserve existing calendar/reminder behavior and the Russia/Uzbekistan verified matcher.
5. Keep the current reload-reset testing contract until the user asks to disable it.

## Architecture boundaries

```text
research sources
  -> registry validation and build
  -> immutable runtime registry (all 694 rows)
  -> permission filter (verified exact vs partial/mapped vs research)
  -> deterministic matcher over normalized household facts
  -> candidate confirmation
  -> obligation with explicit subject and responsibility
  -> recurrence/reminders/calendar export
```

User-entered state never mutates registry data. Registry updates do not overwrite a confirmed user date, applicability decision or reminder sequence.

## Work packages

### 1. Registry pipeline

- Add a deterministic build script that validates the registry/source relationship and emits browser and SaaS runtime artifacts.
- Validate 42 unique countries, 694 unique rule IDs, source references, enum values and evidence-state permissions.
- Keep the existing 24 localized catalog records as the verified/publishable overlay until the remaining rules receive editorial translations and exact applicability review.
- Add country, review-state, specificity and free-text indexes for the Rules library.

### 2. Browser domain state v5

- Introduce normalized collections and selector functions.
- Add a v4-to-v5 migration and backup validation.
- Replace `ownerId`, embedded `jurisdictions`, item `subjectId`/`assetId` ambiguity and duplicated document shapes.
- Keep unknown dates null and route choices unconfirmed.

### 3. Progressive UI

- Redesign onboarding around explicit citizenship, context, purpose, route and asset-role choices.
- Redesign person and possession editors for repeatable citizenships, contexts, jurisdictions and roles.
- Redesign obligation editor around subject type, provenance and deadline kind.
- Replace the flat rules catalog with the 42-country, three-tier Rules library.
- Reorder Plan by next action and make filters conditional.
- Remove test/deployment implementation copy from customer settings while retaining reload-reset behavior.

### 4. SaaS schema v2

- Replace generic subjects with explicit people/assets.
- Add asset jurisdictions, asset-person roles, person relationships and route parties.
- Merge document tables.
- Add explicit obligation subject/responsibility constraints and same-tenant mutation helpers.
- Add a forward migration and make the typed Drizzle schema, SQL snapshot and migration history agree.

### 5. Verification

- Domain tests: migration, tenant/subject invariants, multi-role assets, multiple citizenships and repeated country contexts.
- Registry tests: counts, unique IDs, valid source references and automation permissions.
- Matching tests: Russia patent, Russia work permit, EAEU exemption, citizen-only documents and exact vehicle checklists.
- UI tests/static assertions: no silent route defaults, contextual fields, immutable catalog provenance and removed developer copy.
- Responsive browser QA at 390px and 1440px.
- External checks: TypeScript, catalog validation, tests and production build.

## Delivery order and commits

1. **Review checkpoint** — product review, data-model decision and this plan. No implementation changes.
2. **Domain/registry checkpoint** — data model, migrations, registry build and tests.
3. **UI checkpoint** — progressive editors, Plan and Rules library redesign.
4. **Verification checkpoint** — builds, browser QA, documentation reconciliation and release notes.

Implementation may combine checkpoints 2–4 into one final code commit if the intermediate tree would be non-runnable, but the review checkpoint remains a separate earlier commit.

## Migration and rollback

- Static state migration is copy-on-read. A backup export remains available before future persistence is enabled; during current test mode reload still clears state.
- Database migration is forward-only and retains a pre-migration backup table until verification succeeds. Destructive cleanup of legacy tables is a later migration, not part of the first production rollout.
- Registry artifacts are reproducible from committed research JSON. Rolling back the application also rolls back its registry artifact.

## Release gate

The refactor is complete only when:

- static and SaaS checks pass;
- the registry build is reproducible and reports 42 countries / 694 rows / 426 sources;
- representative Uzbekistan-citizen/Russia-patent, EAEU/Russia-work, EU-citizen/EU-movement, multi-country-asset and multi-person-asset scenarios behave correctly;
- catalog candidates never receive invented due dates;
- browser QA confirms progressive fields and usable layouts;
- review documentation and implementation no longer contradict each other.

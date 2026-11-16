# Runnable scaffold

This directory contains the authenticated NextDue workspace and its production APIs, not only a landing-page scaffold.

## Local development

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:migrate
npm run dev
```

PostgreSQL is exposed on host port `55432`; the application opens on `http://localhost:3000`. `DEV_AUTH_BYPASS=true` enables a development-only identity and is ignored when `NODE_ENV=production`.

## Verification

```bash
npm run check
npm run build
npm audit
docker compose config
```

`npm run check` includes strict TypeScript, reminder parser tests, catalog contract tests, and catalog validation.

## Production authentication

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the host. Register this exact redirect URI:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

Generic OIDC activates only when `OIDC_ISSUER`, `OIDC_CLIENT_ID`, and `OIDC_CLIENT_SECRET` are all present. Google and OIDC request identity scopes only. Calendar permission remains a separate connector.

## Database and isolation

- `src/db/schema.ts` is the typed Drizzle schema.
- `src/db/migrations/0000_initial.sql` creates the original scaffold; `0001_domain_v2.sql` preserves those private tables under `legacy_*_v1`, imports deterministic data, and creates the normalized household graph.
- `src/db/migrations/0002_production_workflows.sql` adds revisioned household snapshots, separate rule candidates, notification routing/preferences, feed controls and editorial revision/correction records.
- `src/db/migrate.ts` is a checksum-protected migration runner.
- `src/db/tenant.ts` sets the user and household context transaction-locally before tenant queries.
- Required graph edges use composite `(entity_id, household_id)` foreign keys. Optional `SET NULL` edges use guarded triggers, so no person, asset, route, document, or obligation can be linked across households.

The application database role should not own the protected tables in a mature production deployment; use a migration owner and a restricted runtime role so PostgreSQL RLS cannot be bypassed by ordinary application queries.

## Authenticated product workflow

- `/{locale}/app` requires an Auth.js session and hosts the complete workspace.
- `/api/state` provides tenant-scoped optimistic cross-device sync; a conflict reloads the newer revision.
- Static v4/v5 backups migrate to v6 and can be imported through the workspace.
- `/api/export`, `/api/account`, and `/api/account/sessions` implement export, hard deletion and session revocation controls.
- `/api/calendar-feeds` creates or revokes hashed subscription tokens; `/calendar/{token}` serves privacy-safe ICS without calendar-provider OAuth.
- The snapshot is an explicit migration bridge. Normalized domain tables remain the long-term write model.

## Catalog status

`catalog/ru/pack.json` and `catalog/uz/pack.json` remain the localized publishable overlay. `catalog/registry.json` is the generated 42-country runtime registry: 694 rules and 426 sources split into ready, confirmation, and research tiers. Validation checks IDs, source references, exact counts, and automation permissions.

“Reviewed” means the record passed this product catalog's source and schema review; it is not a promise of legal completeness. Production operations still need named jurisdiction reviewers, effective-date monitoring, a correction queue, and a publish approval trail.

## Reminder syntax

`parseReminderPlan("180/90/30/7/1/0")` validates a user-defined slash-delimited sequence, removes ambiguity by treating values as days before the deadline, canonicalizes descending order, and provides exact preview dates.

## Render deployment

`render.yaml` provisions:

- a Docker web service;
- managed PostgreSQL;
- a five-minute reminder cron job;
- migration execution before web deployment.

Real deployment still requires a Render account, custom domain, OAuth client, sender-domain verification, and production secrets.

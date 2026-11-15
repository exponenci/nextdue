# Deployment runbook

## Render target

Use one region for web, worker, and PostgreSQL.

- Web service: Docker, health check `/api/health`.
- Release command: database migrations.
- Worker or cron: expands occurrences and claims pending reminder deliveries.
- PostgreSQL: backups enabled and restore tested.

## Build gates

1. Typecheck, unit tests, catalog validation, recurrence/ICS golden tests.
2. Build production Docker image.
3. Apply migrations to an isolated test database.
4. Run tenant-isolation tests with two households.
5. Verify Google callback and session revocation.
6. Verify account export and hard deletion.
7. Deploy web, then worker.

## Operational controls

- CSP, HSTS, secure cookies, origin/CSRF checks.
- Rate limits for auth, exports, calendar feeds, and catalog matching.
- Structured logs without user notes, document labels, or OAuth tokens.
- Encrypted calendar/OIDC connector secrets.
- Hashed and rotatable calendar feed tokens.
- Unique delivery key `(household_id, obligation_id, occurrence_date, offset, channel)`.
- Audit export, connector, membership, and deletion actions.

## Exit criteria

Public launch is blocked until real OAuth, production database backup/restore, email delivery, tenant isolation, export/deletion, and catalog editorial review are verified.

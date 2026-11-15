# Architecture

## Current release

NextDue is a buildless static web application. It has no runtime server, external API calls, user accounts, trackers, or third-party dependencies.

```text
profile context
    ↓ deterministic template filter
advisory suggestions
    ↓ user confirmation + date
tracked items
    ↓ pure recurrence and reminder functions
Today / Plan views + ICS export
```

The browser persists one versioned state object in IndexedDB. A small `localStorage` fallback keeps the app usable if IndexedDB is unavailable. JSON backup/restore validates schema version, item count, title size, categories, and strict ISO dates before accepting data.

## Stored data

The state contains:

- broad profile context: goal, countries, household flag, possession categories;
- tracked item metadata: title, category, person label, jurisdiction, user-confirmed date;
- schedule: expiry, one-off, or monthly/yearly recurrence;
- reminder preset and optional short note;
- display/export preferences.

It deliberately excludes document identifiers, scans, addresses, tax IDs, financial values, and authentication tokens.

## Calendar export

Recurring rules are expanded into discrete events over a bounded 24-month horizon for portability across calendar clients. Deadlines use all-day `VALUE=DATE` events to avoid timezone shifts.

Exports include:

- stable event UIDs derived from the item ID and occurrence date;
- privacy-safe titles by default;
- multiple `VALARM` reminders;
- an optional visible preparation milestone;
- CRLF output and RFC 5545 escaping/folding;
- an explicit description that the file is a snapshot, not live sync.

## Security controls

- No network calls from application JavaScript.
- Strict Content Security Policy in HTML and hosting headers.
- No inline remote scripts, `eval`, external fonts, or trackers.
- Escaping before user-controlled strings enter rendered HTML.
- Bounded import size and record count.
- Strict date parsing without implicit timezone conversion.
- Privacy-safe default calendar text.
- Full browser-local export and deletion controls.

Browser storage is not claimed to be encrypted. The UI warns users not to rely on shared devices.

## Production path

A hosted version should add:

- OIDC/passkeys and tenant-scoped records;
- PostgreSQL row-level security keyed by `user_id`;
- envelope encryption with managed KMS for sensitive fields;
- an append-only audit trail for exports, connector actions, and deletion;
- a queue/scheduler with explicit notification delivery status;
- hard-delete and data-export workflows;
- rotatable, revocable calendar subscription tokens;
- least-privilege Google and Microsoft OAuth;
- evidence-backed rule packs with source URL and review date.

Attachments remain deferred until encrypted object storage, malware scanning, retention rules, and a clear user need exist.

## Verification

The dependency-free test suite covers strict and leap-year dates, month-end recurrence, profile suggestion limits, missing/urgent state, ICS structure and alarms, and malformed backup rejection. Browser QA covers onboarding, persistence, the main views, calendar download, 320 px mobile layout, and 1280 px desktop layout.

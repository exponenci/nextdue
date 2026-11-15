# Architecture

## Static beta

The deployed private preview is a buildless browser application with no runtime API or third-party dependency.

```text
people + jurisdictions + possessions
        ↓ deterministic catalog matcher
source-backed starter pack
        ↓ user confirms applicability and date
tracked obligation
        ↓ recurrence + reminder offsets
Today / Plan / ICS export
```

One versioned state object is stored in IndexedDB with a `localStorage` fallback. Catalog and localization data ship as static ES modules. JSON restore validates schema version, size, counts, categories, titles, dates, and reminder sequences before replacing state.

Every possession has its own country and owner. Every obligation can reference a person and a possession independently.

## Catalog

The starter catalog is versioned (`2026.11`) and currently contains 12 Russia/Uzbekistan entries. Each entry includes:

- stable ID, jurisdiction, category, and subject type;
- translated title, summary, and audience;
- deterministic timing metadata and default reminders;
- confidence/applicability risk;
- source URL and catalog review date.

The matcher is intentionally constrained and explainable. High-risk items remain advisory and require explicit user review. Catalog updates never silently overwrite a user-confirmed date.

## Calendar export

Recurring rules are expanded over a bounded 24-month window. All-day `VALUE=DATE` events avoid timezone shifts. Exports use stable UIDs, RFC 5545 escaping/folding, CRLF output, multiple `VALARM` reminders, and privacy-safe titles by default.

## Static security boundary

- No application network requests, analytics, ads, external fonts, or remote scripts.
- Strict CSP and hosting headers.
- Escaping before user-controlled values enter HTML.
- Strict ISO date parsing and bounded imports.
- No document identifiers, scans, addresses, tax IDs, financial values, or OAuth tokens.
- Browser storage is not represented as encrypted; shared devices remain a stated risk.

## External SaaS target

`external-saas/` provides the portable production path:

- Dockerized Next.js App Router on Node;
- Auth.js with Google and optional generic OIDC;
- PostgreSQL tenant model and row-level isolation contracts;
- account → subjects → jurisdictions/assets → catalog → obligations schema;
- background reminder worker and idempotent delivery keys;
- English, Russian, and Uzbek locale routing;
- downloadable/subscribed ICS first, direct calendar OAuth later;
- Render as the initial host, portable to other container platforms.

Sign-in and calendar OAuth are separate. Calendar tokens require independent encryption and revocation. Production also requires audit logging, backup/restore drills, account export/deletion, rate limits, CSRF/origin checks, secure cookies, and jurisdiction-specific privacy/data-residency review.

## Verification

The automated suite covers strict dates, month-end recurrence, multi-country matching, slash reminder validation, bounded recurrence, status calculation, ICS structure, and malformed backup rejection. Browser QA covers onboarding, per-country possessions, person/asset CRUD, catalog filters, all three locales, reminder validation, and 320px/desktop layouts.

# Architecture

## Static preview and authenticated workspace

The deployed private preview is a buildless browser application with no runtime API or third-party dependency.

```text
normalized people + citizenships + country contexts + legal routes
        + exact possessions + jurisdiction roles + person roles
        ↓ registry permission filter + deterministic matcher
verified exact rules only
        ↓ user confirms applicability, evidence, and date
tracked obligation
        ↓ recurrence + reminder offsets
Plan / ICS export
```

The private static preview stores one versioned state object in IndexedDB with a `localStorage` fallback and intentionally resets on reload for product testing. The same workspace runs inside the authenticated Next.js SaaS, where validated v6 state is stored in a tenant-scoped PostgreSQL snapshot with optimistic revisions and cross-device sync. JSON restore is the migration/import path.

Rule candidates are separate from obligations. Only explicit acceptance creates an obligation. Issued documents are first-class records and can create a linked expiry obligation from their printed validity date.

`household_id` is always the tenant and authorization boundary. Possessions use repeatable jurisdiction records instead of one overloaded country, and link to people through explicit owner, co-owner, keeper, operator, taxpayer, or responsible-person roles. Every obligation has one primary subject (`household`, `person`, or `asset`) plus an optional responsible person; person and asset cannot both be the primary subject.

The SaaS schema enforces this boundary twice: row-level policies authorize each household, while composite foreign keys and guarded optional references reject cross-household graph edges even when an identifier is known.

## Catalog

The research registry contains 694 records across 42 countries and 426 cited sources. Its deterministic build produces three permission tiers: 24 ready exact rules, 515 records needing confirmation, and 155 research prompts. The existing localized 24-rule catalog is the publishable runtime overlay while broader records undergo editorial review. Each registry entry includes:

- stable ID, jurisdiction, category, and subject type;
- translated title, summary, and audience;
- typed applicability and evidence requirements;
- specificity, review state, timing metadata, and automation permission;
- one or more normalized official sources and a verification date.

The matcher is intentionally constrained and explainable. High-risk items remain advisory and require explicit user review. Catalog updates never silently overwrite a user-confirmed date.

## Calendar export

Recurring rules are expanded over a bounded 24-month window. All-day `VALUE=DATE` events avoid timezone shifts. Exports use stable UIDs, RFC 5545 escaping/folding, CRLF output, multiple `VALARM` reminders, and privacy-safe titles by default.

## Security boundary

- The static preview makes no application network requests; the SaaS workspace calls same-origin authenticated APIs only.
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
- household → people → citizenships/country contexts → legal routes/route parties;
- household → exact assets → jurisdiction roles/asset-person roles;
- one issued-document table with an explicit person or asset subject;
- household → obligations with an explicit household/person/asset subject and a separate responsible person;
- immutable registry rules/sources separated from the localized publishable overlay;
- background reminder scheduling/delivery, person-to-user recipient mapping, notification preferences and idempotent delivery keys;
- English, Russian, and Uzbek locale routing;
- downloadable ICS plus hashed, rotatable, revocable private subscribed feeds; direct calendar OAuth later;
- Render as the initial host, portable to other container platforms.

Sign-in and calendar access remain separate. Feed tokens are generated once, stored only as SHA-256 hashes and can be revoked. Tenant-scoped export/deletion, session revocation, same-origin writes and audit events are implemented. A public production launch still requires real OAuth credentials, a restricted runtime database role, backup/restore drills, rate limiting, sender-domain verification, monitoring and jurisdiction-specific privacy/data-residency review.

## Verification

The automated suite covers registry counts and references, v4/v5→v6 migration, candidate separation, subject invariants, multi-role assets, strict dates, month-end recurrence, route-aware Russia employment matching, EAEU exclusions, exact-vehicle checklists, slash reminder validation, subscribed/downloadable ICS structure, snapshot validation and malformed backup rejection. Browser QA includes the 624 px regression in addition to mobile and desktop layouts.

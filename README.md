# NextDue

NextDue is a source-backed life-admin calendar for households whose people, documents, possessions, and obligations can belong to different countries.

> Know what may apply, who it belongs to, where it applies, and when to act.

It matches a normalized household graph against a maintained country registry, explains each suggestion, and waits for the user to confirm applicability and dates.

## Working prototype

- Four-step onboarding: language and goal, citizenship/current residence/purpose/route, exact possessions by country, and full matched-checklist review.
- Repeatable citizenships and country contexts, with country-valid purpose and legal-route choices.
- Exact possessions with multiple jurisdiction roles and multiple people in owner, keeper, operator, taxpayer, or responsible roles.
- A 42-country library with 694 records and 426 sources, separated into ready, confirmation, and research tiers.
- English, Russian, and Uzbek Latin interface and catalog content.
- Checklist/Timeline Plan, People & possessions, Rules library, and Settings views.
- Expiry, one-off, monthly, and annual schedules.
- User-defined reminder sequences separated by `/`.
- Bounded `.ics` export and one-event Google/Outlook links.
- Browser-local IndexedDB storage, `localStorage` fallback, and JSON backup/restore.
- No document numbers, scans, addresses, analytics, ad trackers, or third-party scripts.

## Run and test

```bash
npm test
npm run check
npm run serve
```

Open `http://127.0.0.1:4173`.

## Repository map

- `dist/index.html` — accessible application shell and dialogs.
- `dist/styles.css` — responsive indigo/warm-neutral design.
- `dist/app.mjs` — onboarding, persistence, localization, and interactions.
- `dist/domain.mjs` — normalized browser graph and v4→v5 migration.
- `dist/registry.mjs` — generated 42-country runtime registry.
- `dist/catalog.mjs` — versioned Russia/Uzbekistan catalog and deterministic matching.
- `dist/i18n.mjs` — English, Russian, and Uzbek Latin messages.
- `dist/logic.mjs` — date math, recurrence, reminder parsing, validation, and ICS generation.
- `scripts/build-runtime-registry.mjs` — validates and emits browser/SaaS registry artifacts.
- `tests/logic.test.mjs` — dependency-free domain, registry, matching, and calendar tests.
- `external-saas/` — portable external-hosting implementation and deployment contracts.
- `BUSINESS_MODEL.md`, `GO_TO_MARKET.md`, `PROMOTION_PLAYBOOK.md` — pricing and acquisition plan.

## Trust boundary

Country rules are matched to explicit citizenship, legal-status, and possession facts. Users confirm what applies and enter exact dates from their own documents or official notices. Conditional items are marked explicitly.

The static prototype stores data only in the browser. The external SaaS path separates sign-in from calendar consent, uses Google OAuth or generic OIDC, and scopes household data by account.

## Release status

The static product is suitable for private beta and usability testing. Public paid launch still requires authoritative catalog review, production OAuth/domain credentials, privacy and data-residency review, email delivery setup, and operational ownership for catalog corrections.

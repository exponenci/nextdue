# Product decisions

## Initial wedge

Start with Russian-speaking cross-border households, especially Russia ↔ Uzbekistan: movers, recent relocators, families managing dependant documents, and owners of property or vehicles in another country.

The durable model is broader:

```text
household → people → citizenships + country contexts → country-specific routes → possessions + their documents → obligations → reminders
```

Citizenship, current residence, travel or move plans, legalization routes, issued documents, and an asset's country are separate facts. Purpose is not a permit. Russian RVP/RVPO/VNZH codes never appear as routes for Italy or another country.

## Product promise

> Based on my citizenships, legal statuses, and possessions, show the matching country rules, explain why each item may apply, let me confirm the exact facts, and remind me early enough to act.

The runtime is deterministic. Catalog entries are versioned editorial data with translations, official sources, review dates, scope, confidence, and applicability warnings. AI may assist internal research but cannot publish or select legal-adjacent requirements automatically.

## Information architecture

- **Today:** act now, confirm missing dates, plan upcoming work, and see what is covered.
- **Plan:** a checklist by action state, plus a dated timeline and compact country/person/exact-possession filters.
- **People & assets:** citizenship, current residence, country plans, and one checklist per exact possession.
- **Country rules:** every published rule remains browsable, with matched countries and rules first.
- **Settings:** language, calendar export, portability, and external SaaS path.

## Reminder model

Users enter days before a deadline with `/`, for example `365/180/90/30/7/1/0`. Numbers are whole days; `0` is the due date. Input rejects empty parts, duplicates, negatives, non-integers, and values above 3650, then stores structured offsets in descending order.

Catalog defaults remain editable per obligation. A preparation reminder never changes the formal expiry or due date.

## Language model

The first locales are English (`en`), Russian (`ru`), and Uzbek Latin (`uz-Latn`). Catalog translations are reviewed editorial content. User-created titles are preserved as entered. Switching language changes catalog-derived titles and interface copy without changing the underlying obligation.

## Authentication and calendars

The production service supports Google sign-in and optional generic OIDC. Sign-in requests only `openid email profile`. Google or Microsoft Calendar access is a later, separate consent flow. Phase one supports downloadable and private subscribed ICS feeds.

## Non-goals for the first paid release

- Tax calculation or filing.
- Visa eligibility or definitive legal advice.
- Automated form submission or payments.
- Passport numbers, scans, tax identifiers, or full addresses by default.
- A claim of complete country coverage.
- A generic AI chat interface.

## Working brand

**NextDue** — *Life admin, before it becomes urgent.*

The name remains provisional until trademark and domain checks are completed.

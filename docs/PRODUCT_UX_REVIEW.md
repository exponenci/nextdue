# Product and UX review

Review date: 2026-11-16

Scope: static beta, responsive browser flows, 42-country research registry, and the external SaaS scaffold.

## Verdict

NextDue has the right product shape, but the current UI is ahead of its underlying model. The main navigation, country picker, flags, route-aware Russia flow, slash-delimited reminders, and exact-possession filters are useful. The remaining problems are structural rather than cosmetic:

- one person is still stored as the single owner of an asset;
- obligations can point at both a person and an asset without declaring which is the primary subject;
- legal purpose and route are silently defaulted in onboarding;
- the same document concept is represented by three tables;
- the Country rules screen exposes 24 curated records while the research registry contains 694 records across 42 countries;
- forms show generic fields even when the selected subject, route, asset type, or deadline type makes them irrelevant.

The redesign should be progressive: ask for the smallest set of facts that changes matching, then reveal only the fields unlocked by the user's preceding choices.

## Evidence from the current product

| Area | What works | Problem to fix |
|---|---|---|
| Onboarding | Citizenship countries are excluded from foreign-residence choices; related countries are prioritized; repeated country contexts work. | Choosing a foreign residence silently selects `Work` and the first route, such as `Work patent`. A legal route must never be inferred from list order. |
| Country context | Russia shows patent, work-permit, RVP and VNZH branches only in Russia. | Purpose, route, stage, issued document and stay period are visually compressed into one block. Their different meanings are not clear. |
| Checklist review | The Russia patent scenario includes migration, registration, medical, insurance, contract, tax and notification records. | The unlabelled `2026-11-16` displayed beside every candidate looks like a due date although it is the source review date. |
| People | The main person can hold multiple citizenships and repeated country contexts. | The Add person form accepts only one citizenship; additional citizenships are discoverable only after save. Family/dependency relationships are not modelled. |
| Possessions | Exact named objects and country filters work; deletion is available. | Asset country and single `ownerId` conflate location, registration, taxation and people's roles. The generic Details field is not usable for matching. |
| Obligation editor | Expiry, one-off and recurrence schedules work; reminders accept `/` syntax. | Country, person and asset are always shown together. Catalog title/category/country can be edited away from the cited rule. Responsibility is not separate from the primary subject. |
| Plan | Checklist/timeline, action states and country/person/type/exact-object filters exist. | A long flat list of missing dates gives every candidate the same priority. It does not distinguish “confirm applicability”, “add evidence”, and “add a date”. |
| Country rules | Sources and review dates are visible; non-matching rules are disabled. | The page says 24 published rules and hides the other 670 registry rows. Research prompts, route mappings and exact rules need separate presentation and permissions. |
| Settings | Language, ICS export and backup are available. | Test-mode and SaaS implementation details are developer concerns and should not appear in the customer product. |
| Responsive layout | Mobile bottom navigation and filter sheet are usable. | The onboarding card is presentation-heavy, and desktop content has weak width constraints around long headings and toolbars. |

## Information architecture v2

The customer-facing application has four primary destinations:

1. **Plan** — actionable work, grouped by next required action rather than by raw record status.
2. **People & possessions** — the household graph: people, citizenships, country contexts, routes, documents, exact assets and roles.
3. **Rules library** — all 42 countries and all registry records, clearly separated by evidence state.
4. **Settings** — language, privacy, calendar, export and account controls only.

`Today` remains part of Plan. “Test mode”, deployment architecture and research implementation notes are removed from the customer interface.

## Progressive form contract

### Person

Initially ask only for a private display label. Add citizenships as repeatable records. Ask for birth date only when the user chooses an age-dependent document or rule. Relationship to another person appears only when the user adds a family/dependant route.

### Country context

Always ask for country and context type. Ask for purpose only for a stay, trip or move where purpose affects rules. Ask for a legal route only when the person is not a citizen of the country and a route is relevant. The route starts as `Not confirmed`; no first option is auto-selected. Show route stage only after a route is chosen. Show sponsor, employer, institution or principal-person fields only when the chosen route declares that party relevant. Use separate labels:

- `Starts on` / `Planned until` for a stay or plan;
- `Valid from` / `Valid until` for an issued status or document;
- `Due on` for a one-off obligation;
- `Repeats` for a recurrence.

### Possession

Ask for type, private label and a primary jurisdiction. The jurisdiction label changes by type: `Located in` for property/land, `Registered in` for a vehicle, `Established in` for a business. Additional location, registration or tax jurisdictions are optional repeatable facts. Connect people through roles: owner, co-owner, registered owner, keeper, operator, taxpayer or responsible person. Do not show ownership share unless the role is owner/co-owner. Replace generic Details with type-specific optional facts.

### Issued document

Create a document only when the user says it exists, chooses a document rule, or confirms a catalog candidate. Ask for printed dates and identifiers only after that. Keep full identifiers and scans out of the default product; an optional suffix is sufficient for distinguishing records.

### Obligation

Manual obligations begin with a subject choice: Household, Person or Possession. Show exactly one corresponding subject picker. Show Responsible person only when the household has more than one person. Schedule fields depend on the deadline kind. Show the reminder sequence after a date or recurrence is present, with `/` as the only delimiter.

Catalog-derived obligations keep rule title, country, source and applicability read-only. Users edit their applicability confirmation, actual dates, responsibility, reminder sequence and private notes.

## Rules-library presentation

The registry currently contains 694 rows for 42 countries:

- 24 `verified` rows;
- 220 `mapped` rows;
- 450 `partial` rows;
- 330 exact-national-rule rows, 209 route mappings and 155 research prompts.

Those are not equivalent. The UI must expose three tiers:

1. **Ready to track** — verified exact rules. These may be matched automatically, but unknown dates remain null.
2. **Needs confirmation** — partial exact rules or route mappings. These may request missing facts but cannot create a legal deadline automatically.
3. **Research guidance** — research prompts. These are browsable background and never become obligations directly.

Country totals show all three tiers. “For you” is reserved for deterministic matches; “May be relevant” is used when facts are missing. No screen claims comprehensive legal coverage.

## Plan redesign

The default Plan order is:

1. overdue or due soon;
2. applicability to confirm;
3. records needing a date/evidence;
4. upcoming;
5. completed.

Each card shows one primary action. Country, person, asset and responsible person are compact metadata. Asset filters appear only when there are assets; exact-asset options are constrained by country and type. The timeline contains only confirmed dates, while the checklist also contains undated candidates.

## Acceptance criteria

- No route, permit, document or deadline is selected because it is the first option.
- A person can have multiple citizenships and multiple country contexts.
- An asset can have multiple people in different roles and multiple jurisdiction roles.
- An obligation declares exactly one primary subject and can name a separate responsible person.
- Forms hide fields irrelevant to the selected context.
- Catalog-derived records retain immutable provenance.
- All 694 registry rows are browsable with honest evidence tiers; only eligible exact rules are actionable.
- The Russia patent and EAEU employment branches remain mutually exclusive.
- The plan remains usable at 390px and 1440px widths.
- Reload reset stays enabled for this testing phase, but the customer UI does not advertise implementation details.

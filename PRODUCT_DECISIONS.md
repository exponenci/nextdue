# Product decisions

## Audience and wedge

The first audience is internationally mobile people: movers, expats, students, remote workers, frequent travelers, and families managing documents across borders. Custom household deadlines keep the product useful to ordinary citizens without making the positioning vague.

## Job to be done

> Based on my situation, help me identify dates that may matter, let me confirm the exact facts, and remind me early enough to act.

The product separates:

1. A suggestion generated from broad profile context.
2. A date or obligation the user confirms.
3. A derived action window, calendar event, and reminder schedule.

This distinction is essential for trust. The system proposes; the user confirms.

## Information architecture

- **Today:** act now, add missing dates, coming up, covered.
- **Plan:** chronological list grouped by month; list-first rather than a dense calendar grid.
- **Library:** user records grouped by plain-language category.
- **Settings:** profile scope, calendar behavior, backup, restore, and privacy boundary.

## Reminder model

- Early documents: 180, 120, 90, and 30 days before.
- Standard obligations: 60, 30, and 7 days before.
- Compact deadlines: 30, 7, and 1 day before.
- Monthly routines: 7 days, 1 day, and the due date.

The export includes both deadline events and an optional visible preparation milestone. The formal expiry date and the date to start acting are not treated as the same thing.

## MVP anti-scope

- Tax calculation or filing.
- Visa eligibility or definitive legal guidance.
- Automated form submission or payments.
- Document OCR, scan storage, or identity numbers.
- Universal regulation monitoring.
- Direct calendar OAuth or a claim of live synchronization.
- A generic AI chat interface.
- Household roles and permissions.

## Staged path

1. **Private prototype:** local profile, suggestions, custom dates, recurrence, ICS export.
2. **Pilot:** evidence-backed rule packs for a small number of jurisdictions and scenarios.
3. **Hosted product:** accounts, encrypted sync, delivery status, dependants, export and deletion.
4. **Integrations:** revocable calendar subscriptions and least-privilege Google/Microsoft OAuth.
5. **Household product:** collaboration, ownership, handoffs, and rule-update notifications.

## Working brand

**NextDue** — *Life admin, before it becomes urgent.*

The name is a working product name; trademark and domain availability have not been validated.

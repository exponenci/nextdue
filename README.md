# NextDue

NextDue is a private, local-first planner for document expiries, one-off deadlines, and recurring life obligations. It turns user-confirmed dates into a calm action queue and a portable calendar file.

## Product promise

> Tell us what is changing in your life, confirm the dates that apply, and know what to do before anything becomes urgent.

The first release is intentionally an organizer, not a legal, immigration, or tax engine. Suggestions are common planning prompts; official authorities remain the source of truth.

## What works

- Three-step onboarding for organizing, travel, or relocation.
- Suggestions based on residence, destination, household context, and broad possessions.
- Explicit user confirmation; dates can stay unknown until the user verifies them.
- One-off due dates, expiries, monthly recurrence, and yearly recurrence.
- Today, Plan, Library, and Settings views.
- Editable reminder presets and visible preparation milestones.
- Deterministic `.ics` export over a bounded 24-month horizon.
- One-event Google Calendar and Outlook links.
- Browser-local IndexedDB storage with a `localStorage` fallback.
- JSON backup/restore and full local reset.
- Privacy-safe calendar titles enabled by default.
- No backend, account, analytics, external fonts, or third-party scripts.

## Run locally

```bash
npm run check
npm run serve
```

Open `http://127.0.0.1:4173`.

## Files

- `dist/index.html` — accessible application shell and dialogs.
- `dist/styles.css` — responsive product design.
- `dist/app.mjs` — IndexedDB persistence and interaction layer.
- `dist/logic.mjs` — suggestions, date math, recurrence, validation, and ICS generation.
- `tests/logic.test.mjs` — dependency-free logic and export tests.
- `.openai/hosting.json` — private ChatGPT Site deployment configuration.

## Privacy boundary

The MVP does not request or store passport numbers, tax IDs, addresses, scans, or financial values. Browser storage is not presented as encrypted. Users are warned about shared devices and can download a backup before clearing browser data.

## Release status

This is a working product prototype suitable for private user testing. It is not yet a hosted multi-user service and does not provide live calendar synchronization or jurisdiction-complete guidance.

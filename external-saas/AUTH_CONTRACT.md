# Authentication contract

## Sign-in

- Google and generic OIDC are identity providers, not data sources.
- Request only `openid email profile`.
- Use state, nonce, PKCE, Secure/HttpOnly/SameSite=Lax cookies, and database-backed sessions.
- Do not keep Google access or refresh tokens after authentication.
- Allow OIDC only when its issuer and credentials are configured.
- Never link accounts on email equality alone; require verified email and explicit confirmation.

## Calendar connection

Calendar access is a different connector with a separate explanation and consent screen. Store connector tokens encrypted, support revocation, and record connection status without logging token values.

The first production phase may use:

- downloadable `.ics`;
- a private subscribed calendar URL with a rotatable, hashed bearer token;
- email reminders with delivery state.

Google/Microsoft calendar write access belongs in the following phase.

## Authorization

Every user-data row carries `household_id`. Membership is checked on every query and mutation. Database row-level security is defense in depth; the application must still filter explicitly.

The public catalog is read-only. A catalog update never overwrites a user-confirmed obligation silently.

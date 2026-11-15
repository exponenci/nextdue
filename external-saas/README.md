# External SaaS deployment

This directory defines the production boundary for hosting NextDue outside ChatGPT. The current private Site remains a product preview; it is not presented as the final public platform.

The scaffold is runnable and production-buildable. See [IMPLEMENTATION.md](IMPLEMENTATION.md) for local commands, the reviewed 12-item catalog status, and verification details.

## Chosen stack

- Next.js App Router on the Node runtime.
- Auth.js with Google and optional generic OIDC.
- PostgreSQL and Drizzle migrations.
- Docker image for portable hosting.
- Initial operational target: Render web service, managed PostgreSQL, and worker/cron.
- Custom domain and HTTPS.

Next.js can also run on another Node/Docker provider without rewriting the product.

## Authentication contract

Google sign-in requests only `openid email profile`. The application discards provider access and refresh tokens after sign-in because it does not need Google APIs to authenticate a user.

Generic OIDC is enabled only when issuer, client ID, and client secret are configured. Account linking requires a verified email plus explicit confirmation.

Calendar access is a separate consent flow. “Sign in with Google” must never silently grant Calendar access.

Required environment:

```text
DATABASE_URL
AUTH_SECRET
APP_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Optional:

```text
OIDC_ISSUER
OIDC_CLIENT_ID
OIDC_CLIENT_SECRET
OIDC_ALLOWED_DOMAIN
EMAIL_FROM
RESEND_API_KEY
ENCRYPTION_KEY
CRON_SECRET
SENTRY_DSN
```

Google callback:

```text
https://your-domain.example/api/auth/callback/google
```

## Deployment sequence

1. Provision a custom domain, PostgreSQL, web service, and background worker.
2. Set secrets in the host, never in the repository.
3. Register Google OAuth with the exact callback URL.
4. Run migrations as a release command.
5. Build and deploy the Docker image.
6. Run auth, tenant-isolation, export, and deletion smoke tests.
7. Enable email only after sender-domain verification.
8. Enable Calendar OAuth only after separate consent and token-encryption checks.

## What is still external

Production launch requires the owner to provide the hosting account, custom domain, OAuth client, database, email sender, payment account, and jurisdiction-specific privacy/legal review. Those credentials do not exist in this repository, so live OAuth cannot be truthfully verified yet.

The authoritative product schema is in [schema.sql](schema.sql). [AUTH_CONTRACT.md](AUTH_CONTRACT.md) describes OAuth and calendar separation. [DEPLOYMENT.md](DEPLOYMENT.md) is the operator runbook.

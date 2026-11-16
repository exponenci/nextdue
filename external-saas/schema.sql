-- Convenience bootstrap for psql. The checksum-protected migration runner
-- (`npm run db:migrate`) is the authoritative deployment path.
\ir src/db/migrations/0000_initial.sql
\ir src/db/migrations/0001_domain_v2.sql

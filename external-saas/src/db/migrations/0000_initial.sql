create extension if not exists pgcrypto;
create schema if not exists app;

create table app.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  email_verified timestamptz,
  image text,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

create table app.oauth_accounts (
  user_id uuid not null references app.users(id) on delete cascade,
  type text not null,
  provider text not null,
  provider_account_id text not null,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  primary key (provider, provider_account_id)
);

create table app.sessions (
  session_token text primary key,
  user_id uuid not null references app.users(id) on delete cascade,
  expires timestamptz not null
);
create index sessions_user_idx on app.sessions(user_id);

create table app.verification_tokens (
  identifier text not null,
  token text not null,
  expires timestamptz not null,
  primary key (identifier, token)
);

create table app.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  default_locale text not null default 'en',
  created_at timestamptz not null default now()
);

create table app.memberships (
  household_id uuid not null references app.households(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  primary key (household_id, user_id)
);
create index memberships_user_idx on app.memberships(user_id);

create table app.subjects (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  kind text not null check (kind in ('person', 'asset')),
  display_name text not null,
  created_at timestamptz not null default now()
);
create index subjects_household_idx on app.subjects(household_id);

create table app.people (
  subject_id uuid primary key references app.subjects(id) on delete cascade,
  relationship text not null default 'self',
  birth_date date
);

create table app.assets (
  subject_id uuid primary key references app.subjects(id) on delete cascade,
  asset_type text not null,
  asset_subtype text,
  owner_subject_id uuid references app.subjects(id),
  registered_country text,
  current_country text,
  details text,
  attributes jsonb not null default '{}'::jsonb,
  check (registered_country is null or registered_country ~ '^[A-Z]{2}$'),
  check (current_country is null or current_country ~ '^[A-Z]{2}$')
);

create table app.subject_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_id uuid not null references app.subjects(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  relation text not null check (relation in ('citizenship', 'residence', 'stay', 'tax', 'registration', 'location', 'destination', 'other')),
  legal_basis text,
  exact_status text,
  starts_on date,
  ends_on date,
  notes text,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index subject_jurisdictions_household_idx on app.subject_jurisdictions(household_id);

create table app.catalog_packs (
  id uuid primary key default gen_random_uuid(),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  version text not null,
  reviewed_at date not null,
  status text not null check (status in ('draft', 'reviewed', 'retired')),
  unique (country_code, version)
);

create table app.catalog_items (
  id text not null,
  pack_id uuid not null references app.catalog_packs(id) on delete cascade,
  category text not null,
  subject_kind text not null check (subject_kind in ('person', 'asset', 'household')),
  applicability jsonb not null,
  schedule_template jsonb not null,
  default_reminder_input text not null,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  risk text not null check (risk in ('administrative', 'legal', 'tax')),
  primary key (id, pack_id)
);

create table app.catalog_translations (
  item_id text not null,
  pack_id uuid not null,
  locale text not null,
  title text not null,
  summary text not null,
  audience text not null,
  primary key (item_id, pack_id, locale),
  foreign key (item_id, pack_id) references app.catalog_items(id, pack_id) on delete cascade
);

create table app.catalog_sources (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  pack_id uuid not null,
  authority text not null,
  title text not null,
  url text not null,
  reviewed_at date not null,
  foreign key (item_id, pack_id) references app.catalog_items(id, pack_id) on delete cascade
);

create table app.documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_id uuid not null references app.subjects(id) on delete cascade,
  type_key text not null,
  issuing_country text,
  expires_on date,
  label text not null,
  check (issuing_country is null or issuing_country ~ '^[A-Z]{2}$')
);
create index documents_household_idx on app.documents(household_id);

create table app.obligations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_id uuid references app.subjects(id),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  catalog_item_id text,
  catalog_version text,
  title text not null,
  schedule jsonb not null,
  reminder_input text not null,
  reminder_offsets integer[] not null,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (array_length(reminder_offsets, 1) between 1 and 32)
);
create index obligations_household_idx on app.obligations(household_id);

create table app.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  obligation_id uuid not null references app.obligations(id) on delete cascade,
  occurrence_date date not null,
  offset_days integer not null check (offset_days between 0 and 3650),
  channel text not null,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'sent', 'failed', 'cancelled')),
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  unique (household_id, obligation_id, occurrence_date, offset_days, channel)
);
create index reminder_deliveries_pending_idx on app.reminder_deliveries(status, next_attempt_at);

create table app.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  token_hash text not null unique,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table app.audit_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  actor_user_id uuid references app.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  created_at timestamptz not null default now()
);

create or replace function app.current_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

create or replace function app.can_access_household(target uuid) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select exists (
    select 1 from app.memberships
    where household_id = target and user_id = app.current_user_id()
  )
$$;

create or replace function app.can_access_subject(target uuid) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select exists (
    select 1 from app.subjects
    where id = target and app.can_access_household(household_id)
  )
$$;

alter table app.households enable row level security;
alter table app.memberships enable row level security;
alter table app.subjects enable row level security;
alter table app.people enable row level security;
alter table app.assets enable row level security;
alter table app.subject_jurisdictions enable row level security;
alter table app.documents enable row level security;
alter table app.obligations enable row level security;
alter table app.reminder_deliveries enable row level security;
alter table app.calendar_feeds enable row level security;
alter table app.audit_events enable row level security;

create policy households_access on app.households
  using (app.can_access_household(id)) with check (app.can_access_household(id));
create policy memberships_access on app.memberships
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy subjects_access on app.subjects
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy people_access on app.people
  using (app.can_access_subject(subject_id)) with check (app.can_access_subject(subject_id));
create policy assets_access on app.assets
  using (app.can_access_subject(subject_id)) with check (app.can_access_subject(subject_id));
create policy jurisdictions_access on app.subject_jurisdictions
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy documents_access on app.documents
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy obligations_access on app.obligations
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy reminder_deliveries_access on app.reminder_deliveries
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy calendar_feeds_access on app.calendar_feeds
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy audit_events_access on app.audit_events
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));

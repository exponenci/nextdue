create extension if not exists pgcrypto;

create schema if not exists app;

create table app.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  email_verified_at timestamptz,
  display_name text,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

create table app.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table app.household_members (
  household_id uuid not null references app.households(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  primary key (household_id, user_id)
);
create index household_members_user_idx on app.household_members(user_id);

create table app.subjects (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  kind text not null check (kind in ('person','asset')),
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
  registered_country char(2),
  current_country char(2),
  details text,
  attributes jsonb not null default '{}'::jsonb
);

create table app.subject_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_id uuid not null references app.subjects(id) on delete cascade,
  country_code char(2) not null,
  relation text not null check (relation in ('citizenship','residence','stay','tax','registration','location','destination','other')),
  legal_basis text,
  exact_status text,
  starts_on date,
  ends_on date,
  notes text
);
create index subject_jurisdictions_household_idx on app.subject_jurisdictions(household_id);

-- Normalized v4 model. subject_jurisdictions remains import-only for older backups.
create table app.person_citizenships (
  household_id uuid not null references app.households(id) on delete cascade,
  person_subject_id uuid not null references app.subjects(id) on delete cascade,
  country_code char(2) not null,
  primary key (person_subject_id, country_code)
);

create table app.person_country_contexts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  person_subject_id uuid not null references app.subjects(id) on delete cascade,
  country_code char(2) not null,
  context_type text not null check (context_type in ('lives_now','planned_trip','planned_move')),
  purpose text not null check (purpose in ('visit','work','study','family','business','protection','long_term','unknown')),
  starts_on date,
  intended_until date
);
create unique index one_current_residence_per_person_idx on app.person_country_contexts(person_subject_id) where context_type = 'lives_now';

create table app.legalization_paths (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  country_context_id uuid not null references app.person_country_contexts(id) on delete cascade,
  route_code text not null,
  stage text not null check (stage in ('exploring','preparing','applied','active','expired','ended')),
  region text,
  locality text,
  sponsor_ref text,
  employer_ref text,
  institution_ref text,
  facts jsonb not null default '{}'::jsonb
);

create table app.status_documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  legalization_path_id uuid not null references app.legalization_paths(id) on delete cascade,
  kind text not null,
  issuer_country char(2) not null,
  status text not null,
  issued_at date,
  printed_expiry date,
  number_hint text,
  label text,
  note text
);

create table app.asset_documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  asset_subject_id uuid not null references app.subjects(id) on delete cascade,
  kind text not null,
  issuer_country char(2),
  status text not null,
  issued_at date,
  printed_expiry date,
  recurrence jsonb,
  rule_id text,
  note text
);

create table app.catalog_packs (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  version text not null,
  reviewed_at date not null,
  status text not null check (status in ('draft','reviewed','retired')),
  unique (country_code, version)
);

create table app.catalog_items (
  id text not null,
  pack_id uuid not null references app.catalog_packs(id),
  category text not null,
  subject_kind text not null,
  applicability jsonb not null,
  default_reminders integer[] not null,
  confidence text not null,
  risk text not null,
  primary key (id, pack_id)
);

create table app.catalog_item_translations (
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
  title text not null,
  url text not null,
  reviewed_at date not null,
  foreign key (item_id, pack_id) references app.catalog_items(id, pack_id) on delete cascade
);

create table app.obligations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_id uuid references app.subjects(id),
  asset_subject_id uuid references app.subjects(id),
  country_context_id uuid references app.person_country_contexts(id) on delete set null,
  legalization_path_id uuid references app.legalization_paths(id) on delete set null,
  status_document_id uuid references app.status_documents(id) on delete set null,
  asset_document_id uuid references app.asset_documents(id) on delete set null,
  country_code char(2) not null,
  catalog_item_id text,
  catalog_version text,
  title text not null,
  schedule jsonb not null,
  reminder_input text not null,
  reminder_offsets integer[] not null,
  status text not null check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index obligations_household_idx on app.obligations(household_id);

create table app.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  obligation_id uuid not null references app.obligations(id) on delete cascade,
  occurrence_date date not null,
  offset_days integer not null,
  channel text not null,
  status text not null check (status in ('pending','claimed','sent','failed','cancelled')),
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  unique (household_id, obligation_id, occurrence_date, offset_days, channel)
);

create table app.calendar_feeds (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  token_hash bytea not null unique,
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

alter table app.subjects enable row level security;
alter table app.subject_jurisdictions enable row level security;
alter table app.person_citizenships enable row level security;
alter table app.person_country_contexts enable row level security;
alter table app.legalization_paths enable row level security;
alter table app.status_documents enable row level security;
alter table app.asset_documents enable row level security;
alter table app.obligations enable row level security;
alter table app.reminder_deliveries enable row level security;
alter table app.calendar_feeds enable row level security;
alter table app.audit_events enable row level security;

-- The application sets app.current_user_id transaction-locally after resolving
-- the Auth.js database session. Catalog tables are global read-only data.
create or replace function app.current_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid
$$;

create or replace function app.can_access_household(target uuid) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select exists (
    select 1 from app.household_members
    where household_id = target and user_id = app.current_user_id()
  )
$$;

create policy household_subjects on app.subjects using (app.can_access_household(household_id));
create policy household_jurisdictions on app.subject_jurisdictions using (app.can_access_household(household_id));
create policy household_person_citizenships on app.person_citizenships using (app.can_access_household(household_id));
create policy household_person_country_contexts on app.person_country_contexts using (app.can_access_household(household_id));
create policy household_legalization_paths on app.legalization_paths using (app.can_access_household(household_id));
create policy household_status_documents on app.status_documents using (app.can_access_household(household_id));
create policy household_asset_documents on app.asset_documents using (app.can_access_household(household_id));
create policy household_obligations on app.obligations using (app.can_access_household(household_id));
create policy household_deliveries on app.reminder_deliveries using (app.can_access_household(household_id));
create policy household_feeds on app.calendar_feeds using (app.can_access_household(household_id));
create policy household_audit on app.audit_events using (app.can_access_household(household_id));

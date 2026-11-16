-- Production workflow tables for cross-device state, candidate review,
-- delivery routing, private calendar feeds, and editorial corrections.

create table app.household_snapshots (
  household_id uuid primary key references app.households(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  schema_version integer not null check (schema_version between 1 and 1000),
  state jsonb not null,
  updated_by uuid references app.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(state) = 'object'),
  check (pg_column_size(state) <= 1048576)
);

create table app.rule_candidates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_type text not null check (subject_type in ('household','person','asset')),
  person_id uuid,
  asset_id uuid,
  responsible_person_id uuid references app.people(id) on delete set null,
  source_rule_id text references app.registry_rules(id) on delete set null,
  catalog_item_id text,
  catalog_version text,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  title text not null,
  reason text,
  proposed_schedule jsonb not null default '{}'::jsonb,
  proposed_reminder_input text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','dismissed','superseded')),
  decided_by uuid references app.users(id) on delete set null,
  decided_at timestamptz,
  obligation_id uuid references app.obligations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((subject_type = 'household' and person_id is null and asset_id is null)
    or (subject_type = 'person' and person_id is not null and asset_id is null)
    or (subject_type = 'asset' and asset_id is not null and person_id is null)),
  check ((status = 'pending' and decided_at is null) or status <> 'pending')
);
alter table app.rule_candidates add constraint rule_candidates_id_household_key unique (id, household_id);
alter table app.rule_candidates add constraint rule_candidates_person_household_fk
  foreign key (person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.rule_candidates add constraint rule_candidates_asset_household_fk
  foreign key (asset_id, household_id) references app.assets(id, household_id) on delete cascade;
create unique index rule_candidates_active_catalog_idx on app.rule_candidates(
  household_id, catalog_item_id, coalesce(person_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(asset_id, '00000000-0000-0000-0000-000000000000'::uuid)
) where status in ('pending','accepted') and catalog_item_id is not null;
create index rule_candidates_household_status_idx on app.rule_candidates(household_id, status);

create table app.person_notification_recipients (
  household_id uuid not null references app.households(id) on delete cascade,
  person_id uuid not null,
  user_id uuid not null,
  channel text not null default 'email' check (channel in ('email')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (household_id, person_id, user_id, channel),
  foreign key (person_id, household_id) references app.people(id, household_id) on delete cascade,
  foreign key (household_id, user_id) references app.memberships(household_id, user_id) on delete cascade
);

create table app.notification_preferences (
  household_id uuid not null references app.households(id) on delete cascade,
  user_id uuid not null,
  email_enabled boolean not null default true,
  locale text not null default 'en',
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now(),
  primary key (household_id, user_id),
  foreign key (household_id, user_id) references app.memberships(household_id, user_id) on delete cascade
);

alter table app.calendar_feeds add column name text not null default 'NextDue';
alter table app.calendar_feeds add column created_by uuid references app.users(id) on delete set null;
alter table app.calendar_feeds add column last_used_at timestamptz;

alter table app.audit_events add column details jsonb not null default '{}'::jsonb;

create table app.registry_rule_revisions (
  id uuid primary key default gen_random_uuid(),
  rule_id text not null references app.registry_rules(id) on delete cascade,
  revision integer not null check (revision > 0),
  status text not null check (status in ('draft','in_review','published','superseded','rejected')),
  snapshot jsonb not null,
  change_summary text not null,
  source_snapshot jsonb not null default '[]'::jsonb,
  created_by text not null,
  reviewed_by text,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (rule_id, revision)
);

create table app.registry_corrections (
  id uuid primary key default gen_random_uuid(),
  rule_id text references app.registry_rules(id) on delete set null,
  source_url text,
  report text not null,
  status text not null default 'open' check (status in ('open','triaged','in_review','resolved','rejected')),
  submitted_by uuid references app.users(id) on delete set null,
  resolution_revision_id uuid references app.registry_rule_revisions(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (rule_id is not null or nullif(source_url, '') is not null)
);

alter table app.household_snapshots enable row level security;
alter table app.rule_candidates enable row level security;
alter table app.person_notification_recipients enable row level security;
alter table app.notification_preferences enable row level security;

create policy household_snapshots_access on app.household_snapshots
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy rule_candidates_access on app.rule_candidates
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy person_notification_recipients_access on app.person_notification_recipients
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy notification_preferences_access on app.notification_preferences
  using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));

comment on table app.household_snapshots is 'Versioned migration bridge for the static workspace UI; normalized domain tables remain the long-term write model.';
comment on table app.rule_candidates is 'Rule matches awaiting a human applicability decision. They are not obligations.';

-- A public feed is authenticated by its high-entropy bearer token, not a user
-- session. The function exposes only the validated household snapshot and does
-- not reveal the household identifier or token hash.
create or replace function app.read_calendar_feed(target_hash text)
returns table(feed_id uuid, state jsonb)
language plpgsql security definer set search_path = app, pg_temp as $$
begin
  update app.calendar_feeds set last_used_at = now()
  where token_hash = target_hash and revoked_at is null;
  return query
    select feed.id, snapshot.state
    from app.calendar_feeds feed
    join app.household_snapshots snapshot on snapshot.household_id = feed.household_id
    where feed.token_hash = target_hash and feed.revoked_at is null;
end
$$;

create or replace function app.create_personal_household(new_user_id uuid, household_name text)
returns uuid
language plpgsql security definer set search_path = app, pg_temp as $$
declare
  new_household_id uuid;
begin
  if new_user_id is distinct from app.current_user_id() then
    raise exception 'Cannot create a household for another user' using errcode = '42501';
  end if;
  insert into app.households (name) values (household_name) returning id into new_household_id;
  insert into app.memberships (household_id, user_id, role) values (new_household_id, new_user_id, 'owner');
  return new_household_id;
end
$$;

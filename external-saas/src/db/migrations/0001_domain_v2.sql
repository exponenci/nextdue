-- Forward-only v2 migration. Legacy v1 tables are renamed and retained so the
-- import can be audited before a later cleanup migration removes them.

alter table app.reminder_deliveries rename to legacy_reminder_deliveries_v1;
alter table app.legacy_reminder_deliveries_v1 rename constraint reminder_deliveries_pkey to legacy_reminder_deliveries_pkey_v1;
alter index app.reminder_deliveries_pending_idx rename to legacy_reminder_deliveries_pending_idx_v1;

alter table app.obligations rename to legacy_obligations_v1;
alter table app.legacy_obligations_v1 rename constraint obligations_pkey to legacy_obligations_pkey_v1;
alter index app.obligations_household_idx rename to legacy_obligations_household_idx_v1;

alter table app.documents rename to legacy_documents_v1;
alter table app.legacy_documents_v1 rename constraint documents_pkey to legacy_documents_pkey_v1;
alter table app.asset_documents rename to legacy_asset_documents_v1;
alter table app.legacy_asset_documents_v1 rename constraint asset_documents_pkey to legacy_asset_documents_pkey_v1;
alter table app.status_documents rename to legacy_status_documents_v1;
alter table app.legacy_status_documents_v1 rename constraint status_documents_pkey to legacy_status_documents_pkey_v1;
alter table app.legalization_paths rename to legacy_legalization_paths_v1;
alter table app.legacy_legalization_paths_v1 rename constraint legalization_paths_pkey to legacy_legalization_paths_pkey_v1;

alter table app.person_country_contexts rename to legacy_person_country_contexts_v1;
alter table app.legacy_person_country_contexts_v1 rename constraint person_country_contexts_pkey to legacy_person_country_contexts_pkey_v1;
alter index app.person_country_contexts_household_idx rename to legacy_person_country_contexts_household_idx_v1;
alter table app.person_citizenships rename to legacy_person_citizenships_v1;
alter table app.legacy_person_citizenships_v1 rename constraint person_citizenships_pkey to legacy_person_citizenships_pkey_v1;
alter index app.person_citizenships_household_idx rename to legacy_person_citizenships_household_idx_v1;
alter table app.assets rename to legacy_assets_v1;
alter table app.legacy_assets_v1 rename constraint assets_pkey to legacy_assets_pkey_v1;
alter table app.people rename to legacy_people_v1;
alter table app.legacy_people_v1 rename constraint people_pkey to legacy_people_pkey_v1;
alter table app.subject_jurisdictions rename to legacy_subject_jurisdictions_v1;
alter table app.legacy_subject_jurisdictions_v1 rename constraint subject_jurisdictions_pkey to legacy_subject_jurisdictions_pkey_v1;
alter table app.subjects rename to legacy_subjects_v1;
alter table app.legacy_subjects_v1 rename constraint subjects_pkey to legacy_subjects_pkey_v1;

create table app.people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  display_label text not null,
  birth_date date,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index people_household_idx on app.people(household_id);

create table app.person_citizenships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  person_id uuid not null references app.people(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  acquired_on date,
  ended_on date,
  confirmation text not null default 'user_confirmed' check (confirmation in ('unconfirmed','user_confirmed','verified')),
  check (ended_on is null or acquired_on is null or ended_on >= acquired_on)
);
create unique index person_citizenships_active_idx on app.person_citizenships(person_id, country_code) where ended_on is null;
create index person_citizenships_household_idx on app.person_citizenships(household_id);

create table app.person_country_contexts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  person_id uuid not null references app.people(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  context_type text not null check (context_type in ('usual_residence','lives_now','physical_stay','destination','planned_trip','planned_move','tax_residence','previous_residence')),
  purpose text check (purpose is null or purpose in ('visit','work','study','family','business','protection','long_term','unknown')),
  starts_on date,
  ends_on date,
  confirmation text not null default 'user_confirmed' check (confirmation in ('unconfirmed','user_confirmed','verified')),
  notes text,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index person_country_contexts_household_idx on app.person_country_contexts(household_id);
create index person_country_contexts_person_country_idx on app.person_country_contexts(person_id, country_code);

create table app.legal_routes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  country_context_id uuid not null unique references app.person_country_contexts(id) on delete cascade,
  route_code text not null,
  route_family text not null default 'unknown',
  stage text not null check (stage in ('exploring','preparing','applied','active','expired','ended')),
  principal_person_id uuid references app.people(id) on delete set null,
  facts_schema_version text,
  facts jsonb not null default '{}'::jsonb,
  confirmation text not null default 'unconfirmed' check (confirmation in ('unconfirmed','user_confirmed','verified'))
);
create index legal_routes_household_idx on app.legal_routes(household_id);

create table app.route_parties (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  legal_route_id uuid not null references app.legal_routes(id) on delete cascade,
  party_type text not null check (party_type in ('employer','sponsor','institution','host','principal')),
  person_id uuid references app.people(id) on delete set null,
  label text,
  starts_on date,
  ends_on date,
  check (person_id is not null or nullif(label, '') is not null),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index route_parties_route_idx on app.route_parties(legal_route_id);

create table app.person_relationships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  from_person_id uuid not null references app.people(id) on delete cascade,
  to_person_id uuid not null references app.people(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('spouse','child','parent','dependant','guardian','other')),
  starts_on date,
  ends_on date,
  confirmation text not null default 'user_confirmed',
  check (from_person_id <> to_person_id),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index person_relationships_household_idx on app.person_relationships(household_id);

create table app.assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  asset_type text not null,
  asset_subtype text,
  display_label text not null,
  status text not null default 'active' check (status in ('active','disposed','archived')),
  acquired_on date,
  disposed_on date,
  facts_schema_version text,
  facts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (disposed_on is null or acquired_on is null or disposed_on >= acquired_on)
);
create index assets_household_idx on app.assets(household_id);

create table app.asset_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  asset_id uuid not null references app.assets(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  subdivision_code text,
  role text not null check (role in ('location','registration','tax','ownership','use','incorporation','other')),
  is_primary boolean not null default false,
  starts_on date,
  ends_on date,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create unique index asset_jurisdictions_primary_idx on app.asset_jurisdictions(asset_id) where is_primary and ends_on is null;
create index asset_jurisdictions_asset_idx on app.asset_jurisdictions(asset_id);
create index asset_jurisdictions_household_idx on app.asset_jurisdictions(household_id);

create table app.asset_person_roles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  asset_id uuid not null references app.assets(id) on delete cascade,
  person_id uuid not null references app.people(id) on delete cascade,
  role text not null check (role in ('owner','co_owner','registered_owner','keeper','operator','taxpayer','responsible_person')),
  share_basis_points integer,
  starts_on date,
  ends_on date,
  check (share_basis_points is null or (role in ('owner','co_owner') and share_basis_points between 1 and 10000)),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create unique index asset_person_roles_active_idx on app.asset_person_roles(asset_id, person_id, role) where ends_on is null;
create index asset_person_roles_household_idx on app.asset_person_roles(household_id);

create table app.registry_sources (
  id text primary key,
  authority text not null,
  title text not null,
  url text not null,
  jurisdiction text not null,
  language text,
  source_type text not null,
  publication_or_effective_date date,
  last_verified date not null,
  notes text
);

create table app.registry_rules (
  id text primary key,
  destination_country text not null check (destination_country ~ '^[A-Z]{2}$'),
  authority_level text not null,
  requirement_type text not null,
  requirement_name text not null,
  rule_specificity text not null check (rule_specificity in ('exact_national_rule','route_mapping','research_prompt')),
  review_status text not null check (review_status in ('verified','publishable','mapped','partial','retired')),
  runtime_tier text not null check (runtime_tier in ('ready','confirm','research')),
  condition_expression jsonb not null,
  trigger_event text,
  deadline_type text not null,
  deadline_value integer,
  deadline_unit text,
  recurrence text,
  required_evidence text[] not null default '{}',
  effective_from date,
  effective_to date,
  last_verified date not null,
  notes text,
  check ((runtime_tier = 'ready') = (rule_specificity = 'exact_national_rule' and review_status in ('verified','publishable'))),
  check ((runtime_tier = 'research') = (rule_specificity = 'research_prompt'))
);
create index registry_rules_country_tier_idx on app.registry_rules(destination_country, runtime_tier);
create index registry_rules_review_idx on app.registry_rules(review_status, rule_specificity);

create table app.registry_rule_sources (
  rule_id text not null references app.registry_rules(id) on delete cascade,
  source_id text not null references app.registry_sources(id) on delete restrict,
  position integer not null default 0,
  primary key (rule_id, source_id)
);

create table app.issued_documents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_type text not null check (subject_type in ('person','asset')),
  person_id uuid references app.people(id) on delete cascade,
  asset_id uuid references app.assets(id) on delete cascade,
  legal_route_id uuid references app.legal_routes(id) on delete set null,
  source_rule_id text references app.registry_rules(id) on delete set null,
  document_type text not null,
  title text not null,
  issuing_country text check (issuing_country is null or issuing_country ~ '^[A-Z]{2}$'),
  issuing_authority text,
  status text not null check (status in ('planned','applied','active','expired','replaced','cancelled')),
  issued_on date,
  valid_from date,
  valid_until date,
  identifier_suffix text,
  confirmation text not null default 'user_confirmed',
  notes text,
  check ((subject_type = 'person' and person_id is not null and asset_id is null) or (subject_type = 'asset' and asset_id is not null and person_id is null)),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);
create index issued_documents_household_idx on app.issued_documents(household_id);
create index issued_documents_person_idx on app.issued_documents(person_id);
create index issued_documents_asset_idx on app.issued_documents(asset_id);

create table app.obligations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  subject_type text not null check (subject_type in ('household','person','asset')),
  person_id uuid references app.people(id) on delete cascade,
  asset_id uuid references app.assets(id) on delete cascade,
  responsible_person_id uuid references app.people(id) on delete set null,
  country_context_id uuid references app.person_country_contexts(id) on delete set null,
  legal_route_id uuid references app.legal_routes(id) on delete set null,
  issued_document_id uuid references app.issued_documents(id) on delete set null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  source_rule_id text references app.registry_rules(id) on delete set null,
  catalog_item_id text,
  catalog_version text,
  title text not null,
  deadline_kind text not null default 'unresolved' check (deadline_kind in ('unresolved','expiry','due_once','recurring')),
  trigger_event text,
  due_on date,
  recurrence jsonb,
  deadline_source text not null default 'unresolved' check (deadline_source in ('unresolved','printed_document','official_notice','user_confirmed','rule_calculated')),
  applicability text not null default 'candidate' check (applicability in ('candidate','confirmed','not_applicable')),
  reminder_input text not null default '',
  reminder_offsets integer[] not null default '{}',
  notes text,
  status text not null default 'active' check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((subject_type = 'household' and person_id is null and asset_id is null) or (subject_type = 'person' and person_id is not null and asset_id is null) or (subject_type = 'asset' and asset_id is not null and person_id is null)),
  check (due_on is null or deadline_kind <> 'unresolved'),
  check (array_length(reminder_offsets, 1) is null or array_length(reminder_offsets, 1) between 1 and 32)
);
create index obligations_household_idx on app.obligations(household_id);
create index obligations_next_due_idx on app.obligations(status, due_on);

create table app.reminder_deliveries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references app.households(id) on delete cascade,
  obligation_id uuid not null references app.obligations(id) on delete cascade,
  occurrence_date date not null,
  offset_days integer not null check (offset_days between 0 and 3650),
  channel text not null,
  status text not null default 'pending' check (status in ('pending','claimed','sent','failed','cancelled')),
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  unique (household_id, obligation_id, occurrence_date, offset_days, channel)
);
create index reminder_deliveries_pending_idx on app.reminder_deliveries(status, next_attempt_at);

-- Tenant isolation must hold at the relationship level as well as through RLS.
-- Composite keys make cross-household references structurally impossible for
-- required and cascading links.
alter table app.people add constraint people_id_household_key unique (id, household_id);
alter table app.person_country_contexts add constraint person_country_contexts_id_household_key unique (id, household_id);
alter table app.legal_routes add constraint legal_routes_id_household_key unique (id, household_id);
alter table app.assets add constraint assets_id_household_key unique (id, household_id);
alter table app.issued_documents add constraint issued_documents_id_household_key unique (id, household_id);
alter table app.obligations add constraint obligations_id_household_key unique (id, household_id);

alter table app.person_citizenships add constraint person_citizenships_person_household_fk
  foreign key (person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.person_country_contexts add constraint person_country_contexts_person_household_fk
  foreign key (person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.legal_routes add constraint legal_routes_context_household_fk
  foreign key (country_context_id, household_id) references app.person_country_contexts(id, household_id) on delete cascade;
alter table app.route_parties add constraint route_parties_route_household_fk
  foreign key (legal_route_id, household_id) references app.legal_routes(id, household_id) on delete cascade;
alter table app.person_relationships add constraint person_relationships_from_household_fk
  foreign key (from_person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.person_relationships add constraint person_relationships_to_household_fk
  foreign key (to_person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.asset_jurisdictions add constraint asset_jurisdictions_asset_household_fk
  foreign key (asset_id, household_id) references app.assets(id, household_id) on delete cascade;
alter table app.asset_person_roles add constraint asset_person_roles_asset_household_fk
  foreign key (asset_id, household_id) references app.assets(id, household_id) on delete cascade;
alter table app.asset_person_roles add constraint asset_person_roles_person_household_fk
  foreign key (person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.issued_documents add constraint issued_documents_person_household_fk
  foreign key (person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.issued_documents add constraint issued_documents_asset_household_fk
  foreign key (asset_id, household_id) references app.assets(id, household_id) on delete cascade;
alter table app.obligations add constraint obligations_person_household_fk
  foreign key (person_id, household_id) references app.people(id, household_id) on delete cascade;
alter table app.obligations add constraint obligations_asset_household_fk
  foreign key (asset_id, household_id) references app.assets(id, household_id) on delete cascade;
alter table app.reminder_deliveries add constraint reminder_deliveries_obligation_household_fk
  foreign key (obligation_id, household_id) references app.obligations(id, household_id) on delete cascade;

create or replace function app.require_household_match(expected uuid, actual uuid, entity_label text)
returns void language plpgsql as $$
begin
  if expected is distinct from actual then
    raise exception 'Cross-household reference rejected for %', entity_label using errcode = '23514';
  end if;
end
$$;

-- Optional references retain ON DELETE SET NULL semantics. A trigger checks
-- their tenant boundary without trying to null the non-null household key.
create or replace function app.enforce_optional_household_references()
returns trigger language plpgsql as $$
declare
  argument_index integer;
  reference_id uuid;
  reference_household uuid;
begin
  argument_index := 0;
  while argument_index < tg_nargs loop
    reference_id := nullif(to_jsonb(new) ->> tg_argv[argument_index + 1], '')::uuid;
    if reference_id is not null then
      execute format('select household_id from %s where id = $1', tg_argv[argument_index]::regclass)
        into reference_household using reference_id;
      perform app.require_household_match(new.household_id, reference_household, tg_table_name || '.' || tg_argv[argument_index + 1]);
    end if;
    argument_index := argument_index + 2;
  end loop;
  return new;
end
$$;

create trigger legal_routes_optional_household_refs
  before insert or update on app.legal_routes
  for each row execute function app.enforce_optional_household_references('app.people', 'principal_person_id');
create trigger route_parties_optional_household_refs
  before insert or update on app.route_parties
  for each row execute function app.enforce_optional_household_references('app.people', 'person_id');
create trigger issued_documents_optional_household_refs
  before insert or update on app.issued_documents
  for each row execute function app.enforce_optional_household_references('app.legal_routes', 'legal_route_id');
create trigger obligations_optional_household_refs
  before insert or update on app.obligations
  for each row execute function app.enforce_optional_household_references(
    'app.people', 'responsible_person_id',
    'app.person_country_contexts', 'country_context_id',
    'app.legal_routes', 'legal_route_id',
    'app.issued_documents', 'issued_document_id'
  );

-- Copy the deterministic part of the v1 graph. Ambiguous fields remain null or
-- unconfirmed; this migration never invents a route, document date, or deadline.
insert into app.people (id, household_id, display_label, birth_date, created_at, updated_at)
select subject.id, subject.household_id, subject.display_name, person.birth_date, subject.created_at, now()
from app.legacy_subjects_v1 subject
join app.legacy_people_v1 person on person.subject_id = subject.id
where subject.kind = 'person';

insert into app.assets (id, household_id, asset_type, asset_subtype, display_label, facts, created_at, updated_at)
select subject.id, subject.household_id, asset.asset_type, asset.asset_subtype, subject.display_name,
       coalesce(asset.attributes, '{}'::jsonb) || case when asset.details is null then '{}'::jsonb else jsonb_build_object('legacyNote', asset.details) end,
       subject.created_at, now()
from app.legacy_subjects_v1 subject
join app.legacy_assets_v1 asset on asset.subject_id = subject.id
where subject.kind = 'asset';

insert into app.person_citizenships (household_id, person_id, country_code, confirmation)
select household_id, person_subject_id, country_code, 'user_confirmed'
from app.legacy_person_citizenships_v1;

insert into app.person_country_contexts (id, household_id, person_id, country_code, context_type, purpose, starts_on, ends_on, confirmation)
select id, household_id, person_subject_id, country_code, context_type, purpose, starts_on, intended_until, 'user_confirmed'
from app.legacy_person_country_contexts_v1;

insert into app.legal_routes (id, household_id, country_context_id, route_code, route_family, stage, facts, confirmation)
select id, household_id, country_context_id, route_code,
       case when route_code = 'citizen' then 'citizen' when route_code = 'not_sure' then 'unknown' else 'other' end,
       stage, facts,
       case when route_code = 'not_sure' then 'unconfirmed' else 'user_confirmed' end
from app.legacy_legalization_paths_v1;

insert into app.route_parties (household_id, legal_route_id, party_type, label)
select household_id, id, 'employer', employer_ref from app.legacy_legalization_paths_v1 where nullif(employer_ref, '') is not null
union all
select household_id, id, 'sponsor', sponsor_ref from app.legacy_legalization_paths_v1 where nullif(sponsor_ref, '') is not null
union all
select household_id, id, 'institution', institution_ref from app.legacy_legalization_paths_v1 where nullif(institution_ref, '') is not null;

insert into app.asset_jurisdictions (household_id, asset_id, country_code, role, is_primary)
select subject.household_id, asset.subject_id, coalesce(asset.registered_country, asset.current_country),
       case when asset.registered_country is not null then 'registration' else 'location' end, true
from app.legacy_assets_v1 asset
join app.legacy_subjects_v1 subject on subject.id = asset.subject_id
where coalesce(asset.registered_country, asset.current_country) is not null;

insert into app.asset_jurisdictions (household_id, asset_id, country_code, role, is_primary)
select subject.household_id, asset.subject_id, asset.current_country, 'location', false
from app.legacy_assets_v1 asset
join app.legacy_subjects_v1 subject on subject.id = asset.subject_id
where asset.current_country is not null and asset.registered_country is not null and asset.current_country <> asset.registered_country;

insert into app.asset_person_roles (household_id, asset_id, person_id, role)
select subject.household_id, asset.subject_id, asset.owner_subject_id, 'owner'
from app.legacy_assets_v1 asset
join app.legacy_subjects_v1 subject on subject.id = asset.subject_id
join app.people person on person.id = asset.owner_subject_id
where asset.owner_subject_id is not null;

insert into app.issued_documents (id, household_id, subject_type, person_id, legal_route_id, document_type, title, issuing_country, status, issued_on, valid_until, identifier_suffix, confirmation, notes)
select document.id, document.household_id, 'person', context.person_id, document.legalization_path_id,
       document.kind, coalesce(nullif(document.label, ''), document.kind), document.issuer_country,
       document.status, document.issued_at, document.printed_expiry, document.number_hint, 'user_confirmed', document.note
from app.legacy_status_documents_v1 document
join app.legal_routes route on route.id = document.legalization_path_id
join app.person_country_contexts context on context.id = route.country_context_id;

insert into app.issued_documents (id, household_id, subject_type, asset_id, document_type, title, issuing_country, status, issued_on, valid_until, source_rule_id, confirmation, notes)
select document.id, document.household_id, 'asset', document.asset_subject_id, document.kind, document.kind, document.issuer_country,
       case document.status when 'needed' then 'planned' when 'not_applicable' then 'cancelled' else document.status end,
       document.issued_at, document.printed_expiry, null, 'user_confirmed', document.note
from app.legacy_asset_documents_v1 document;

insert into app.issued_documents (id, household_id, subject_type, person_id, asset_id, document_type, title, issuing_country, status, valid_until, confirmation)
select document.id, document.household_id, subject.kind,
       case when subject.kind = 'person' then subject.id end,
       case when subject.kind = 'asset' then subject.id end,
       document.type_key, document.label, document.issuing_country,
       case when document.expires_on is not null and document.expires_on < current_date then 'expired' else 'active' end,
       document.expires_on, 'user_confirmed'
from app.legacy_documents_v1 document
join app.legacy_subjects_v1 subject on subject.id = document.subject_id;

insert into app.obligations (
  id, household_id, subject_type, person_id, asset_id, responsible_person_id,
  country_context_id, legal_route_id, issued_document_id, country_code,
  catalog_item_id, catalog_version, title, deadline_kind, due_on, recurrence,
  deadline_source, applicability, reminder_input, reminder_offsets, status, created_at, updated_at
)
select obligation.id, obligation.household_id,
       case when subject.kind = 'person' then 'person' when subject.kind = 'asset' then 'asset' else 'household' end,
       case when subject.kind = 'person' then subject.id end,
       case when subject.kind = 'asset' then subject.id end,
       case when subject.kind = 'person' then subject.id end,
       obligation.country_context_id, obligation.legalization_path_id,
       coalesce(obligation.status_document_id, obligation.asset_document_id),
       obligation.country_code, obligation.catalog_item_id, obligation.catalog_version, obligation.title,
       case obligation.schedule->>'kind' when 'expiry' then 'expiry' when 'due' then 'due_once' when 'recurring' then 'recurring' else 'unresolved' end,
       nullif(obligation.schedule->>'date', '')::date,
       case when obligation.schedule->>'kind' = 'recurring' then obligation.schedule else null end,
       case when nullif(obligation.schedule->>'date', '') is null then 'unresolved' else 'user_confirmed' end,
       'confirmed', obligation.reminder_input, obligation.reminder_offsets, obligation.status, obligation.created_at, obligation.updated_at
from app.legacy_obligations_v1 obligation
left join app.legacy_subjects_v1 subject on subject.id = obligation.subject_id;

insert into app.reminder_deliveries (id, household_id, obligation_id, occurrence_date, offset_days, channel, status, attempts, next_attempt_at)
select id, household_id, obligation_id, occurrence_date, offset_days, channel, status, attempts, next_attempt_at
from app.legacy_reminder_deliveries_v1;

alter table app.people enable row level security;
alter table app.person_citizenships enable row level security;
alter table app.person_country_contexts enable row level security;
alter table app.legal_routes enable row level security;
alter table app.route_parties enable row level security;
alter table app.person_relationships enable row level security;
alter table app.assets enable row level security;
alter table app.asset_jurisdictions enable row level security;
alter table app.asset_person_roles enable row level security;
alter table app.issued_documents enable row level security;
alter table app.obligations enable row level security;
alter table app.reminder_deliveries enable row level security;

create policy people_access on app.people using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy person_citizenships_access on app.person_citizenships using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy person_country_contexts_access on app.person_country_contexts using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy legal_routes_access on app.legal_routes using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy route_parties_access on app.route_parties using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy person_relationships_access on app.person_relationships using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy assets_access on app.assets using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy asset_jurisdictions_access on app.asset_jurisdictions using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy asset_person_roles_access on app.asset_person_roles using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy issued_documents_access on app.issued_documents using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy obligations_access on app.obligations using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));
create policy reminder_deliveries_access on app.reminder_deliveries using (app.can_access_household(household_id)) with check (app.can_access_household(household_id));

comment on table app.legacy_subjects_v1 is 'Retained v1 backup; drop only after v2 migration verification.';
comment on table app.legacy_obligations_v1 is 'Retained v1 backup; drop only after v2 migration verification.';

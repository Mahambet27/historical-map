-- Qazaq Heritage Map: proposed historical platform schema.
-- Review and migrate in a staging Supabase project before production use.
create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.content_status as enum ('draft','in_review','published','archived','disputed');
create type public.confidence_level as enum ('high','medium','low','disputed');

create table public.historical_entities (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  entity_type text not null, start_year integer, end_year integer,
  start_precision text not null default 'unknown', end_precision text not null default 'unknown',
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_year is null or start_year is null or end_year >= start_year)
);
create table public.entity_translations (
  id uuid primary key default gen_random_uuid(), entity_id uuid not null references public.historical_entities on delete cascade,
  language text not null check (language in ('kk','ru','en')), name text not null,
  short_description text, description text, unique(entity_id,language)
);
create table public.sources (
  id uuid primary key default gen_random_uuid(), source_type text not null, title text not null,
  author text, organization text, publication_year integer, url text, isbn text, doi text,
  citation text not null, verification_status text not null default 'draft',
  status public.content_status not null default 'draft', created_at timestamptz not null default now()
);
create table public.entity_geometries (
  id uuid primary key default gen_random_uuid(), entity_id uuid not null references public.historical_entities on delete cascade,
  valid_from_year integer, valid_to_year integer, geometry geometry(MultiPolygon,4326) not null,
  geometry_type text not null, confidence_level public.confidence_level not null,
  source_id uuid references public.sources, notes text, version integer not null default 1,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (valid_to_year is null or valid_from_year is null or valid_to_year >= valid_from_year)
);
create index entity_geometries_gix on public.entity_geometries using gist(geometry);
create index entity_geometries_year_idx on public.entity_geometries(valid_from_year,valid_to_year);

create table public.historical_events (
  id uuid primary key default gen_random_uuid(), event_type text not null,
  start_year integer, end_year integer, precision text not null default 'unknown',
  importance smallint not null default 1 check (importance between 1 and 5),
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.event_translations (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.historical_events on delete cascade,
  language text not null check (language in ('kk','ru','en')), title text not null, description text,
  unique(event_id,language)
);
create table public.event_locations (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.historical_events on delete cascade,
  location geometry(Geometry,4326) not null, place_id uuid, confidence_level public.confidence_level not null default 'medium'
);
create index event_locations_gix on public.event_locations using gist(location);

create table public.historical_people (
  id uuid primary key default gen_random_uuid(), slug text not null unique, birth_year integer, death_year integer,
  status public.content_status not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.person_translations (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.historical_people on delete cascade,
  language text not null check (language in ('kk','ru','en')), name text not null, description text,
  unique(person_id,language)
);
create table public.person_entity_roles (
  person_id uuid not null references public.historical_people on delete cascade,
  entity_id uuid not null references public.historical_entities on delete cascade,
  role text not null, start_year integer, end_year integer, primary key(person_id,entity_id,role)
);
create table public.entity_relations (
  id uuid primary key default gen_random_uuid(),
  from_entity_id uuid not null references public.historical_entities on delete cascade,
  to_entity_id uuid not null references public.historical_entities on delete cascade,
  relation_type text not null check (relation_type in ('split_into','merged_into','conquered_by','succeeded_by','vassal_of','allied_with','conflicted_with','overlapped_with','influenced','formed_on_part_of_territory')),
  start_year integer, end_year integer, confidence_level public.confidence_level not null,
  source_id uuid references public.sources, check (from_entity_id <> to_entity_id)
);
create table public.media_assets (
  id uuid primary key default gen_random_uuid(), storage_path text not null, media_type text not null,
  license text, rights_holder text, alt_kk text, alt_ru text, alt_en text,
  status public.content_status not null default 'draft', created_at timestamptz not null default now()
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(), slug text not null unique, grade_min smallint, grade_max smallint,
  duration_minutes smallint, status public.content_status not null default 'draft', created_at timestamptz not null default now()
);
create table public.lesson_translations (
  id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.lessons on delete cascade,
  language text not null check (language in ('kk','ru','en')), title text not null, objective text, unique(lesson_id,language)
);
create table public.lesson_steps (
  id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.lessons on delete cascade,
  sort_order integer not null, step_type text not null, content jsonb not null default '{}', unique(lesson_id,sort_order)
);
create table public.questions (
  id uuid primary key default gen_random_uuid(), lesson_id uuid references public.lessons on delete cascade,
  question_type text not null, answer_spec jsonb not null default '{}', sort_order integer not null default 0
);
create table public.question_translations (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions on delete cascade,
  language text not null check (language in ('kk','ru','en')), prompt text not null, feedback text, unique(question_id,language)
);
create table public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  lesson_id uuid not null references public.lessons on delete cascade, progress jsonb not null default '{}',
  updated_at timestamptz not null default now(), unique(user_id,lesson_id)
);
create table public.content_reviews (
  id uuid primary key default gen_random_uuid(), reviewer_id uuid not null references auth.users,
  target_type text not null, target_id uuid not null, decision text not null,
  notes text, created_at timestamptz not null default now()
);
create table public.source_links (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.sources on delete cascade,
  entity_id uuid references public.historical_entities on delete cascade,
  geometry_id uuid references public.entity_geometries on delete cascade,
  event_id uuid references public.historical_events on delete cascade,
  person_id uuid references public.historical_people on delete cascade,
  place_id uuid, lesson_id uuid references public.lessons on delete cascade,
  claim_note text,
  check (num_nonnulls(entity_id,geometry_id,event_id,person_id,place_id,lesson_id) = 1)
);

alter table public.historical_entities enable row level security;
alter table public.entity_geometries enable row level security;
alter table public.historical_events enable row level security;
alter table public.historical_people enable row level security;
alter table public.sources enable row level security;
alter table public.lessons enable row level security;

create policy "public reads published entities" on public.historical_entities for select using (status='published');
create policy "public reads published geometries" on public.entity_geometries for select using (status='published');
create policy "public reads published events" on public.historical_events for select using (status='published');
create policy "public reads published people" on public.historical_people for select using (status='published');
create policy "public reads verified sources" on public.sources for select using (status='published' and verification_status in ('reviewed','verified'));
create policy "public reads published lessons" on public.lessons for select using (status='published');
-- Draft creation, review and publication policies must use server-maintained role claims.
-- No anon INSERT/UPDATE/DELETE policies are defined. AI operations run only in server functions.

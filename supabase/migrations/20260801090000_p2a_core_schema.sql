-- Qazaq Heritage Map P2A: read-only PostGIS data foundation.
-- Apply to staging first. This migration does not alter the legacy draft schema.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create table if not exists public.p2a_dataset_metadata (
  id text primary key,
  dataset_version text not null,
  generated_from text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.historical_entities (
  id text primary key,
  entity_type text not null check (entity_type in (
    'state', 'polity', 'tribe', 'empire', 'administrative_unit',
    'cultural_region', 'archaeological_culture'
  )),
  default_name text not null,
  summary jsonb not null default '{}'::jsonb,
  valid_from_year integer,
  valid_to_year integer,
  confidence_level text not null default 'medium'
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  )
);

create table if not exists public.historical_names (
  id text primary key,
  subject_type text not null,
  subject_id text not null,
  language text not null check (language in ('kk', 'ru', 'en')),
  name text not null,
  valid_from_year integer,
  valid_to_year integer,
  name_type text not null check (name_type in (
    'official', 'historical', 'alternative', 'translated',
    'transliterated', 'modern'
  )),
  source_ids text[] not null default '{}',
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  )
);

create table if not exists public.historical_geometries (
  id text primary key,
  subject_type text not null,
  subject_id text not null,
  geometry_type text not null check (geometry_type in (
    'Polygon', 'MultiPolygon', 'Point', 'MultiPoint',
    'LineString', 'MultiLineString'
  )),
  geom extensions.geometry(Geometry, 4326) not null,
  valid_from_year integer,
  valid_to_year integer,
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  reconstruction_method text,
  source_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  ),
  check (extensions.st_srid(geom) = 4326),
  check (extensions.geometrytype(geom) in (
    'POLYGON', 'MULTIPOLYGON', 'POINT', 'MULTIPOINT',
    'LINESTRING', 'MULTILINESTRING'
  ))
);

create table if not exists public.historical_events (
  id text primary key,
  titles jsonb not null default '{}'::jsonb,
  descriptions jsonb not null default '{}'::jsonb,
  event_type text not null,
  start_year integer,
  end_year integer,
  entity_ids text[] not null default '{}',
  person_ids text[] not null default '{}',
  place_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  check (end_year is null or start_year is null or end_year >= start_year)
);

create table if not exists public.historical_people (
  id text primary key,
  names jsonb not null default '{}'::jsonb,
  descriptions jsonb not null default '{}'::jsonb,
  birth_year integer,
  death_year integer,
  entity_ids text[] not null default '{}',
  event_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  check (death_year is null or birth_year is null or death_year >= birth_year)
);

create table if not exists public.historical_places (
  id text primary key,
  place_types text[] not null default '{}',
  names jsonb not null default '{}'::jsonb,
  point extensions.geometry(Point, 4326) not null,
  coordinate_precision text not null,
  valid_from_year integer,
  valid_to_year integer,
  entity_ids text[] not null default '{}',
  event_ids text[] not null default '{}',
  route_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  ),
  check (extensions.st_srid(point) = 4326)
);

create table if not exists public.historical_sources (
  id text primary key,
  titles jsonb not null default '{}'::jsonb,
  author text,
  institution text,
  publisher text,
  publication_year integer,
  source_type text not null,
  url text,
  license_status text not null default 'unknown'
    check (license_status in (
      'public_domain', 'open_license', 'permission_granted',
      'educational_use_only', 'restricted', 'unknown'
    )),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_claims (
  id text primary key,
  subject_type text not null,
  subject_id text not null,
  predicate text not null,
  value_type text not null,
  claim_value jsonb not null,
  labels jsonb not null default '{}'::jsonb,
  evidence_type text not null,
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  interpretation_notes jsonb not null default '{}'::jsonb,
  reviewed_by text,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.source_claim_sources (
  claim_id text not null references public.source_claims(id) on delete cascade,
  source_id text not null references public.historical_sources(id) on delete restrict,
  relation_type text not null default 'supports'
    check (relation_type in ('supports', 'context', 'contradicts', 'derived_from')),
  notes jsonb not null default '{}'::jsonb,
  primary key (claim_id, source_id)
);

create table if not exists public.historical_routes (
  id text primary key,
  route_type text not null,
  names jsonb not null default '{}'::jsonb,
  descriptions jsonb not null default '{}'::jsonb,
  valid_from_year integer,
  valid_to_year integer,
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  source_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  )
);

create table if not exists public.route_segments (
  id text primary key,
  route_id text not null references public.historical_routes(id) on delete cascade,
  segment_order integer not null check (segment_order >= 0),
  from_place_id text,
  to_place_id text,
  geom extensions.geometry(LineString, 4326) not null,
  valid_from_year integer,
  valid_to_year integer,
  mode text,
  season text,
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  source_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  ),
  check (extensions.st_srid(geom) = 4326)
);

create table if not exists public.environment_snapshots (
  id text primary key,
  environment_type text not null,
  names jsonb not null default '{}'::jsonb,
  descriptions jsonb not null default '{}'::jsonb,
  geom extensions.geometry(Geometry, 4326) not null,
  valid_from_year integer,
  valid_to_year integer,
  interpolation_allowed boolean not null default false,
  source_ids text[] not null default '{}',
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  ),
  check (extensions.st_srid(geom) = 4326)
);

create table if not exists public.hydrology_snapshots (
  id text primary key,
  feature_id text not null,
  feature_type text not null,
  names jsonb not null default '{}'::jsonb,
  geom extensions.geometry(Geometry, 4326) not null,
  valid_from_year integer,
  valid_to_year integer,
  interpolation_allowed boolean not null default false,
  source_ids text[] not null default '{}',
  confidence_level text not null
    check (confidence_level in ('high', 'medium', 'low', 'disputed')),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  check (
    valid_to_year is null or valid_from_year is null
    or valid_to_year >= valid_from_year
  ),
  check (extensions.st_srid(geom) = 4326)
);

create table if not exists public.archive_maps (
  id text primary key,
  titles jsonb not null default '{}'::jsonb,
  descriptions jsonb not null default '{}'::jsonb,
  map_date integer,
  map_date_precision text not null,
  source_id text references public.historical_sources(id) on delete set null,
  institution jsonb not null default '{}'::jsonb,
  author text,
  publisher text,
  image_url text,
  thumbnail_url text,
  georeference_type text not null check (georeference_type in (
    'image-corners', 'raster-tiles', 'external-viewer', 'unavailable-preview'
  )),
  georeference_data jsonb not null default '{}'::jsonb,
  default_opacity numeric not null default 0.65
    check (default_opacity between 0 and 1),
  license jsonb not null default '{"status":"unknown"}'::jsonb,
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb,
  check ((license->>'status') in (
    'public_domain', 'open_license', 'permission_granted',
    'educational_use_only', 'restricted', 'unknown'
  ))
);

create table if not exists public.educational_stories (
  id text primary key,
  titles jsonb not null default '{}'::jsonb,
  descriptions jsonb not null default '{}'::jsonb,
  target_audience text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.educational_story_steps (
  id text primary key,
  story_id text not null references public.educational_stories(id) on delete cascade,
  step_order integer not null check (step_order >= 0),
  year integer,
  era_id text,
  camera jsonb,
  titles jsonb not null default '{}'::jsonb,
  narration jsonb not null default '{}'::jsonb,
  simple_narration jsonb not null default '{}'::jsonb,
  source_ids text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  unique (story_id, step_order)
);

create table if not exists public.educational_questions (
  id text primary key,
  story_id text references public.educational_stories(id) on delete cascade,
  question_type text not null,
  prompts jsonb not null default '{}'::jsonb,
  options jsonb not null default '[]'::jsonb,
  answer jsonb not null default '{}'::jsonb,
  explanations jsonb not null default '{}'::jsonb,
  source_ids text[] not null default '{}',
  verification_status text not null
    check (verification_status in (
      'verified', 'reviewed', 'needs_review', 'demo_only', 'disputed'
    )),
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.p2a_dataset_metadata is
  'P2A dataset version and deterministic seed provenance.';
comment on table public.archive_maps is
  'Archive metadata only; binary images are never stored in Postgres.';
comment on column public.historical_geometries.geom is
  'Geometry is imported unchanged; invalid records must be reported, never silently repaired.';

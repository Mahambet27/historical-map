-- Qazaq Heritage Map future database schema
-- Intended for a later Supabase / PostgreSQL / PostGIS migration.
-- Current frontend does not connect to this schema yet.

create extension if not exists pgcrypto;

-- Optional later:
-- create extension if not exists postgis;
-- When PostGIS is enabled, `latitude` / `longitude` can later be replaced with
-- geography(Point, 4326) for spatial queries and routing helpers.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  language text not null default 'ru' check (language in ('ru', 'kk', 'en')),
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eras (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ru text not null,
  name_kk text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ru text not null,
  name_kk text not null,
  name_en text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  region text not null,
  district text,
  place_type text,
  era_id uuid references public.eras(id) on delete set null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  short_notes text,
  full_notes text,
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.place_translations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  language text not null check (language in ('ru', 'kk', 'en')),
  title text not null,
  short_description text,
  full_description text,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_translations_place_language_key unique (place_id, language)
);

create table if not exists public.place_categories (
  place_id uuid not null references public.places(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, category_id)
);

create table if not exists public.place_images (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  storage_path text,
  public_url text,
  alt_text text,
  caption text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.place_sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  source_type text,
  title text not null,
  source_url text,
  citation text,
  published_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_places (
  route_id uuid not null references public.routes(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  sort_order integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  primary key (route_id, place_id)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_place_key unique (user_id, place_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_places_status on public.places (status);
create index if not exists idx_places_region on public.places (region);
create index if not exists idx_place_translations_language on public.place_translations (language);
create index if not exists idx_place_categories_place_id on public.place_categories (place_id);
create index if not exists idx_place_categories_category_id on public.place_categories (category_id);
create index if not exists idx_favorites_user_id on public.favorites (user_id);
create index if not exists idx_favorites_place_id on public.favorites (place_id);
create index if not exists idx_reviews_place_id on public.reviews (place_id);
create index if not exists idx_routes_status on public.routes (status);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_eras_updated_at
before update on public.eras
for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger set_places_updated_at
before update on public.places
for each row execute function public.set_updated_at();

create trigger set_place_translations_updated_at
before update on public.place_translations
for each row execute function public.set_updated_at();

create trigger set_place_images_updated_at
before update on public.place_images
for each row execute function public.set_updated_at();

create trigger set_place_sources_updated_at
before update on public.place_sources
for each row execute function public.set_updated_at();

create trigger set_routes_updated_at
before update on public.routes
for each row execute function public.set_updated_at();

create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- Planned RLS policies
-- Keep these as draft notes until the production access model is finalized.
--
-- Guests can read only published places.
-- Users can manage only their own favorites.
-- Users can create, update, and delete only their own reviews.
-- Moderators can review user content and manage moderation workflows.
-- Admins can create, update, and delete places.
-- Only admins can publish or unpublish places.
--
-- Example draft policy shape:
-- create policy "Guests can read published places"
--   on public.places
--   for select
--   using (status = 'published');
--
-- create policy "Users manage own favorites"
--   on public.favorites
--   for all
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

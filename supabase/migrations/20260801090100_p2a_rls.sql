-- P2A strict anonymous read-only policies.

create or replace function public.p2a_is_public_record(
  p_verification_status text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language sql
immutable
set search_path = pg_catalog, public
as $$
  select
    p_verification_status in ('verified', 'reviewed', 'needs_review', 'demo_only')
    and coalesce(p_metadata->>'public', 'true') <> 'false';
$$;

alter table public.p2a_dataset_metadata enable row level security;
alter table public.historical_entities enable row level security;
alter table public.historical_names enable row level security;
alter table public.historical_geometries enable row level security;
alter table public.historical_events enable row level security;
alter table public.historical_people enable row level security;
alter table public.historical_places enable row level security;
alter table public.historical_sources enable row level security;
alter table public.source_claims enable row level security;
alter table public.source_claim_sources enable row level security;
alter table public.historical_routes enable row level security;
alter table public.route_segments enable row level security;
alter table public.environment_snapshots enable row level security;
alter table public.hydrology_snapshots enable row level security;
alter table public.archive_maps enable row level security;
alter table public.educational_stories enable row level security;
alter table public.educational_story_steps enable row level security;
alter table public.educational_questions enable row level security;

create policy p2a_public_dataset_metadata on public.p2a_dataset_metadata
  for select to anon using (coalesce(metadata->>'public', 'true') <> 'false');
create policy p2a_public_entities on public.historical_entities
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_names on public.historical_names
  for select to anon using (
    verification_status in ('verified', 'reviewed', 'needs_review', 'demo_only')
  );
create policy p2a_public_geometries on public.historical_geometries
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_events on public.historical_events
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_people on public.historical_people
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_places on public.historical_places
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_sources on public.historical_sources
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_claims on public.source_claims
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_claim_sources on public.source_claim_sources
  for select to anon using (
    exists (
      select 1
      from public.source_claims c
      join public.historical_sources s on s.id = source_claim_sources.source_id
      where c.id = source_claim_sources.claim_id
        and public.p2a_is_public_record(c.verification_status, c.metadata)
        and public.p2a_is_public_record(s.verification_status, s.metadata)
    )
  );
create policy p2a_public_routes on public.historical_routes
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_route_segments on public.route_segments
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_environment on public.environment_snapshots
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_hydrology on public.hydrology_snapshots
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_archive_maps on public.archive_maps
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_stories on public.educational_stories
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));
create policy p2a_public_story_steps on public.educational_story_steps
  for select to anon using (
    exists (
      select 1 from public.educational_stories s
      where s.id = educational_story_steps.story_id
        and public.p2a_is_public_record(s.verification_status, s.metadata)
    )
  );
create policy p2a_public_questions on public.educational_questions
  for select to anon using (public.p2a_is_public_record(verification_status, metadata));

create or replace view public.p2a_public_archive_maps
with (security_invoker = true)
as
select
  id,
  titles,
  descriptions,
  map_date,
  map_date_precision,
  source_id,
  institution,
  author,
  publisher,
  case
    when license->>'status' in (
      'public_domain', 'open_license', 'permission_granted', 'educational_use_only'
    ) then image_url
    else null
  end as image_url,
  thumbnail_url,
  georeference_type,
  case
    when license->>'status' in (
      'public_domain', 'open_license', 'permission_granted', 'educational_use_only'
    ) then georeference_data
    else '{}'::jsonb
  end as georeference_data,
  default_opacity,
  license,
  verification_status,
  metadata
from public.archive_maps
where public.p2a_is_public_record(verification_status, metadata);

revoke all on
  public.p2a_dataset_metadata,
  public.historical_entities,
  public.historical_names,
  public.historical_geometries,
  public.historical_events,
  public.historical_people,
  public.historical_places,
  public.historical_sources,
  public.source_claims,
  public.source_claim_sources,
  public.historical_routes,
  public.route_segments,
  public.environment_snapshots,
  public.hydrology_snapshots,
  public.archive_maps,
  public.educational_stories,
  public.educational_story_steps,
  public.educational_questions,
  public.p2a_public_archive_maps
from anon;
grant usage on schema public to anon;
grant select on
  public.p2a_dataset_metadata,
  public.historical_entities,
  public.historical_names,
  public.historical_geometries,
  public.historical_events,
  public.historical_people,
  public.historical_places,
  public.historical_sources,
  public.source_claims,
  public.source_claim_sources,
  public.historical_routes,
  public.route_segments,
  public.environment_snapshots,
  public.hydrology_snapshots,
  public.educational_stories,
  public.educational_story_steps,
  public.educational_questions,
  public.p2a_public_archive_maps
to anon;

-- Direct archive_maps access is intentionally unavailable to anon because RLS
-- filters rows, not sensitive columns. Anonymous clients use the safe view/RPC.
revoke all on public.archive_maps from anon;
revoke insert, update, delete, truncate, references, trigger on
  public.p2a_dataset_metadata,
  public.historical_entities,
  public.historical_names,
  public.historical_geometries,
  public.historical_events,
  public.historical_people,
  public.historical_places,
  public.historical_sources,
  public.source_claims,
  public.source_claim_sources,
  public.historical_routes,
  public.route_segments,
  public.environment_snapshots,
  public.hydrology_snapshots,
  public.archive_maps,
  public.educational_stories,
  public.educational_story_steps,
  public.educational_questions
from anon;

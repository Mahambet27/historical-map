-- P2A bounded query indexes. No materialized views are required.

create index if not exists p2a_geometries_geom_gix
  on public.historical_geometries using gist (geom);
create index if not exists p2a_places_point_gix
  on public.historical_places using gist (point);
create index if not exists p2a_route_segments_geom_gix
  on public.route_segments using gist (geom);
create index if not exists p2a_environment_geom_gix
  on public.environment_snapshots using gist (geom);
create index if not exists p2a_hydrology_geom_gix
  on public.hydrology_snapshots using gist (geom);

create index if not exists p2a_entities_type_year_idx
  on public.historical_entities (entity_type, valid_from_year, valid_to_year);
create index if not exists p2a_entities_status_idx
  on public.historical_entities (verification_status);
create index if not exists p2a_names_subject_language_idx
  on public.historical_names (subject_type, subject_id, language);
create index if not exists p2a_geometries_subject_year_idx
  on public.historical_geometries (subject_type, subject_id, valid_from_year, valid_to_year);
create index if not exists p2a_geometries_status_idx
  on public.historical_geometries (verification_status);
create index if not exists p2a_events_year_idx
  on public.historical_events (start_year, end_year);
create index if not exists p2a_places_year_status_idx
  on public.historical_places (valid_from_year, valid_to_year, verification_status);
create index if not exists p2a_claims_subject_idx
  on public.source_claims (subject_type, subject_id, verification_status);
create index if not exists p2a_claim_sources_source_idx
  on public.source_claim_sources (source_id);
create index if not exists p2a_routes_year_status_idx
  on public.historical_routes (valid_from_year, valid_to_year, verification_status);
create index if not exists p2a_route_segments_route_order_idx
  on public.route_segments (route_id, segment_order);
create index if not exists p2a_environment_year_idx
  on public.environment_snapshots (valid_from_year, valid_to_year);
create index if not exists p2a_hydrology_year_idx
  on public.hydrology_snapshots (valid_from_year, valid_to_year);
create index if not exists p2a_story_steps_story_order_idx
  on public.educational_story_steps (story_id, step_order);
create index if not exists p2a_questions_story_idx
  on public.educational_questions (story_id, verification_status);

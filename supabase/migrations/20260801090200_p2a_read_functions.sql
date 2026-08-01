-- P2A bounded read-only RPC functions.

create or replace function public.p2a_validate_bbox(
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision
)
returns void
language plpgsql
immutable
set search_path = pg_catalog, public, extensions
as $$
begin
  if p_west is null or p_south is null or p_east is null or p_north is null
    or p_west < -180 or p_east > 180
    or p_south < -90 or p_north > 90
    or p_west >= p_east or p_south >= p_north
    or (p_east - p_west) > 60
    or (p_north - p_south) > 40
  then
    raise exception using
      errcode = '22023',
      message = 'INVALID_BBOX';
  end if;
end;
$$;

create or replace function public.get_historical_geometries(
  p_year integer,
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision
)
returns table (
  id text,
  subject_type text,
  subject_id text,
  geometry_type text,
  geojson jsonb,
  valid_from_year integer,
  valid_to_year integer,
  confidence_level text,
  verification_status text,
  reconstruction_method text,
  source_ids text[],
  metadata jsonb
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
begin
  perform public.p2a_validate_bbox(p_west, p_south, p_east, p_north);

  return query
  select
    g.id,
    g.subject_type,
    g.subject_id,
    g.geometry_type,
    extensions.st_asgeojson(g.geom)::jsonb,
    g.valid_from_year,
    g.valid_to_year,
    g.confidence_level,
    g.verification_status,
    g.reconstruction_method,
    g.source_ids,
    g.metadata
  from public.historical_geometries g
  where public.p2a_is_public_record(g.verification_status, g.metadata)
    and (g.valid_from_year is null or g.valid_from_year <= p_year)
    and (g.valid_to_year is null or g.valid_to_year >= p_year)
    and extensions.st_intersects(
      g.geom,
      extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)
    )
  order by g.id
  limit 1000;
end;
$$;

create or replace function public.get_historical_places(
  p_year integer,
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_place_types text[] default null,
  p_limit integer default 500
)
returns table (
  id text,
  place_types text[],
  names jsonb,
  longitude double precision,
  latitude double precision,
  coordinate_precision text,
  valid_from_year integer,
  valid_to_year integer,
  entity_ids text[],
  event_ids text[],
  route_ids text[],
  source_ids text[],
  confidence_level text,
  verification_status text,
  metadata jsonb
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 500), 1), 500);
begin
  perform public.p2a_validate_bbox(p_west, p_south, p_east, p_north);

  return query
  select
    p.id,
    p.place_types,
    p.names,
    extensions.st_x(p.point),
    extensions.st_y(p.point),
    p.coordinate_precision,
    p.valid_from_year,
    p.valid_to_year,
    p.entity_ids,
    p.event_ids,
    p.route_ids,
    p.source_ids,
    p.confidence_level,
    p.verification_status,
    p.metadata
  from public.historical_places p
  where public.p2a_is_public_record(p.verification_status, p.metadata)
    and (p.valid_from_year is null or p.valid_from_year <= p_year)
    and (p.valid_to_year is null or p.valid_to_year >= p_year)
    and (p_place_types is null or p.place_types && p_place_types)
    and extensions.st_intersects(
      p.point,
      extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)
    )
  order by p.id
  limit v_limit;
end;
$$;

create or replace function public.get_historical_routes(p_year integer)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  with visible_routes as (
    select r.*
    from public.historical_routes r
    where public.p2a_is_public_record(r.verification_status, r.metadata)
      and (r.valid_from_year is null or r.valid_from_year <= p_year)
      and (r.valid_to_year is null or r.valid_to_year >= p_year)
    order by r.id
    limit 100
  ),
  visible_segments as (
    select
      s.id,
      s.route_id,
      s.segment_order,
      s.from_place_id,
      s.to_place_id,
      extensions.st_asgeojson(s.geom)::jsonb as geometry,
      s.valid_from_year,
      s.valid_to_year,
      s.mode,
      s.season,
      s.confidence_level,
      s.verification_status,
      s.source_ids,
      s.metadata
    from public.route_segments s
    join visible_routes r on r.id = s.route_id
    where public.p2a_is_public_record(s.verification_status, s.metadata)
      and (s.valid_from_year is null or s.valid_from_year <= p_year)
      and (s.valid_to_year is null or s.valid_to_year >= p_year)
    order by s.route_id, s.segment_order
    limit 1000
  ),
  endpoint_ids as (
    select from_place_id as id from visible_segments where from_place_id is not null
    union
    select to_place_id as id from visible_segments where to_place_id is not null
  )
  select jsonb_build_object(
    'routes', coalesce((select jsonb_agg(to_jsonb(r)) from visible_routes r), '[]'::jsonb),
    'segments', coalesce((select jsonb_agg(to_jsonb(s)) from visible_segments s), '[]'::jsonb),
    'places', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'placeTypes', p.place_types,
          'names', p.names,
          'coordinates', jsonb_build_array(
            extensions.st_x(p.point), extensions.st_y(p.point)
          ),
          'verificationStatus', p.verification_status,
          'sourceIds', p.source_ids
        )
        order by p.id
      )
      from public.historical_places p
      join endpoint_ids e on e.id = p.id
      where public.p2a_is_public_record(p.verification_status, p.metadata)
    ), '[]'::jsonb)
  );
$$;

create or replace function public.get_subject_evidence(
  p_subject_type text,
  p_subject_id text
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  with visible_claims as (
    select c.*
    from public.source_claims c
    where c.subject_type = p_subject_type
      and c.subject_id = p_subject_id
      and public.p2a_is_public_record(c.verification_status, c.metadata)
    order by c.id
    limit 200
  ),
  claim_rows as (
    select
      c.*,
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'titles', s.titles,
            'author', s.author,
            'institution', s.institution,
            'publisher', s.publisher,
            'publicationYear', s.publication_year,
            'sourceType', s.source_type,
            'url', s.url,
            'licenseStatus', s.license_status,
            'verificationStatus', s.verification_status,
            'relationType', cs.relation_type,
            'notes', cs.notes
          )
          order by s.id
        )
        from public.source_claim_sources cs
        join public.historical_sources s on s.id = cs.source_id
        where cs.claim_id = c.id
          and public.p2a_is_public_record(s.verification_status, s.metadata)
      ), '[]'::jsonb) as sources
    from visible_claims c
  ),
  subject_source_ids as (
    select distinct cs.source_id
    from public.source_claim_sources cs
    join visible_claims c on c.id = cs.claim_id
  )
  select jsonb_build_object(
    'subjectType', p_subject_type,
    'subjectId', p_subject_id,
    'claims', coalesce((
      select jsonb_agg(
        (to_jsonb(c) - 'reviewed_by' - 'metadata')
        || jsonb_build_object('sources', c.sources)
        order by c.id
      )
      from claim_rows c
    ), '[]'::jsonb),
    'archiveMaps', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.id)
      from (
        select a.*
        from public.p2a_public_archive_maps a
        where a.source_id in (select source_id from subject_source_ids)
        order by a.id
        limit 200
      ) a
    ), '[]'::jsonb)
  );
$$;

create or replace function public.get_exhibition_snapshot(
  p_year integer,
  p_west double precision,
  p_south double precision,
  p_east double precision,
  p_north double precision,
  p_language text default 'ru'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_geometry jsonb;
  v_places jsonb;
  v_entities jsonb;
  v_environment jsonb;
  v_hydrology jsonb;
  v_names jsonb;
  v_version text;
begin
  perform public.p2a_validate_bbox(p_west, p_south, p_east, p_north);
  if p_language not in ('kk', 'ru', 'en') then
    raise exception using errcode = '22023', message = 'INVALID_LANGUAGE';
  end if;

  select coalesce(jsonb_agg(to_jsonb(g) order by g.id), '[]'::jsonb)
  into v_geometry
  from public.get_historical_geometries(
    p_year, p_west, p_south, p_east, p_north
  ) g;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.id), '[]'::jsonb)
  into v_places
  from public.get_historical_places(
    p_year, p_west, p_south, p_east, p_north, null, 500
  ) p;

  select coalesce(jsonb_agg(to_jsonb(e) order by e.id), '[]'::jsonb)
  into v_entities
  from (
    select e.*
    from public.historical_entities e
    where public.p2a_is_public_record(e.verification_status, e.metadata)
      and (e.valid_from_year is null or e.valid_from_year <= p_year)
      and (e.valid_to_year is null or e.valid_to_year >= p_year)
      and e.id in (
        select value->>'subject_id'
        from jsonb_array_elements(v_geometry) value
        where value->>'subject_type' = 'entity'
      )
    order by e.id
    limit 500
  ) e;

  select coalesce(jsonb_agg(
    to_jsonb(e) - 'geom'
    || jsonb_build_object('geometry', extensions.st_asgeojson(e.geom)::jsonb)
    order by e.id
  ), '[]'::jsonb)
  into v_environment
  from (
    select e.*
    from public.environment_snapshots e
    where public.p2a_is_public_record(e.verification_status, e.metadata)
      and (e.valid_from_year is null or e.valid_from_year <= p_year)
      and (e.valid_to_year is null or e.valid_to_year >= p_year)
      and extensions.st_intersects(
        e.geom,
        extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)
      )
    order by e.id
    limit 200
  ) e;

  select coalesce(jsonb_agg(
    to_jsonb(h) - 'geom'
    || jsonb_build_object('geometry', extensions.st_asgeojson(h.geom)::jsonb)
    order by h.id
  ), '[]'::jsonb)
  into v_hydrology
  from (
    select h.*
    from public.hydrology_snapshots h
    where public.p2a_is_public_record(h.verification_status, h.metadata)
      and (h.valid_from_year is null or h.valid_from_year <= p_year)
      and (h.valid_to_year is null or h.valid_to_year >= p_year)
      and extensions.st_intersects(
        h.geom,
        extensions.st_makeenvelope(p_west, p_south, p_east, p_north, 4326)
      )
    order by h.id
    limit 200
  ) h;

  select coalesce(jsonb_agg(to_jsonb(n) order by n.subject_id), '[]'::jsonb)
  into v_names
  from (
    select n.*
    from public.historical_names n
    where n.language = p_language
      and n.verification_status in ('verified', 'reviewed', 'needs_review', 'demo_only')
      and (n.valid_from_year is null or n.valid_from_year <= p_year)
      and (n.valid_to_year is null or n.valid_to_year >= p_year)
    order by n.subject_id
    limit 1000
  ) n;

  select dataset_version into v_version
  from public.p2a_dataset_metadata
  where id = 'historical-dataset';

  return jsonb_build_object(
    'datasetVersion', v_version,
    'year', p_year,
    'language', p_language,
    'entities', v_entities,
    'geometries', v_geometry,
    'places', v_places,
    'routes', public.get_historical_routes(p_year),
    'environment', v_environment,
    'hydrology', v_hydrology,
    'labels', v_names
  );
end;
$$;

create or replace function public.get_educational_story(
  p_story_id text
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((
    select jsonb_build_object(
      'story', to_jsonb(s),
      'steps', coalesce((
        select jsonb_agg(to_jsonb(ss) order by ss.step_order)
        from (
          select ss.*
          from public.educational_story_steps ss
          where ss.story_id = s.id
          order by ss.step_order
          limit 200
        ) ss
      ), '[]'::jsonb),
      'questions', coalesce((
        select jsonb_agg(to_jsonb(q) order by q.id)
        from (
          select q.*
          from public.educational_questions q
          where q.story_id = s.id
            and public.p2a_is_public_record(q.verification_status, q.metadata)
          order by q.id
          limit 200
        ) q
      ), '[]'::jsonb)
    )
    from public.educational_stories s
    where s.id = p_story_id
      and public.p2a_is_public_record(s.verification_status, s.metadata)
    limit 1
  ), '{}'::jsonb);
$$;

revoke all on function public.p2a_validate_bbox(
  double precision, double precision, double precision, double precision
) from public;
grant execute on function public.get_historical_geometries(
  integer, double precision, double precision, double precision, double precision
) to anon;
grant execute on function public.get_historical_places(
  integer, double precision, double precision, double precision, double precision,
  text[], integer
) to anon;
grant execute on function public.get_historical_routes(integer) to anon;
grant execute on function public.get_subject_evidence(text, text) to anon;
grant execute on function public.get_exhibition_snapshot(
  integer, double precision, double precision, double precision, double precision, text
) to anon;
grant execute on function public.get_educational_story(text) to anon;

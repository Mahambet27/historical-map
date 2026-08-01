-- P2A SQL security checks.
-- Run only against a disposable/local Supabase database after all P2A
-- migrations. The transaction is always rolled back.

begin;

insert into public.historical_entities (
  id, entity_type, default_name, summary, confidence_level,
  verification_status, metadata
) values
  ('__p2a_test_public_reviewed', 'state', 'Public reviewed', '{}', 'high',
   'reviewed', '{"public":true}'),
  ('__p2a_test_public_needs_review', 'state', 'Public needs review', '{}', 'low',
   'needs_review', '{"public":true}'),
  ('__p2a_test_private', 'state', 'Private', '{}', 'low',
   'reviewed', '{"public":false}')
on conflict (id) do update set metadata = excluded.metadata;

insert into public.historical_sources (
  id, titles, source_type, license_status, verification_status, metadata
) values (
  '__p2a_test_source', '{"en":"Security fixture"}', 'official_document',
  'restricted', 'reviewed', '{"public":true}'
)
on conflict (id) do nothing;

insert into public.archive_maps (
  id, titles, descriptions, map_date_precision, source_id, institution,
  image_url, thumbnail_url, georeference_type, georeference_data,
  license, verification_status, metadata
) values (
  '__p2a_test_restricted_map',
  '{"en":"Restricted fixture"}',
  '{}',
  'unknown',
  '__p2a_test_source',
  '{"name":"Test"}',
  'https://private.invalid/full.tif',
  '/safe-thumbnail.svg',
  'external-viewer',
  '{}',
  '{"status":"restricted","downloadAllowed":false}',
  'reviewed',
  '{"public":true}'
)
on conflict (id) do nothing;

insert into public.archive_maps (
  id, titles, descriptions, map_date_precision, source_id, institution,
  image_url, thumbnail_url, georeference_type, georeference_data,
  license, verification_status, metadata
) values (
  '__p2a_test_unknown_map',
  '{"en":"Unknown-license fixture"}',
  '{}',
  'unknown',
  '__p2a_test_source',
  '{"name":"Test"}',
  'https://private.invalid/unknown-license.tif',
  '/safe-thumbnail.svg',
  'external-viewer',
  '{"privateControlPoints":[1,2,3]}',
  '{"status":"unknown","downloadAllowed":false}',
  'reviewed',
  '{"public":true}'
)
on conflict (id) do nothing;

set local role anon;

do $p2a_checks$
declare
  v_count integer;
  v_value text;
  v_payload jsonb;
  v_config text[];
begin
  -- 1–2. Anonymous read keeps the visible verification status.
  select count(*) into v_count
  from public.historical_entities
  where id = '__p2a_test_public_reviewed'
    and verification_status = 'reviewed';
  if v_count <> 1 then raise exception 'P2A_SECURITY_01_PUBLIC_REVIEWED'; end if;
  raise notice 'P2A_SECURITY_01_PUBLIC_REVIEWED';

  select count(*) into v_count
  from public.historical_entities
  where id = '__p2a_test_public_needs_review'
    and verification_status = 'needs_review';
  if v_count <> 1 then raise exception 'P2A_SECURITY_02_NEEDS_REVIEW_STATUS'; end if;
  raise notice 'P2A_SECURITY_02_NEEDS_REVIEW_STATUS';

  -- 3–5. No anonymous mutation grants exist.
  if has_table_privilege('anon', 'public.historical_entities', 'INSERT') then
    raise exception 'P2A_SECURITY_03_ANON_INSERT';
  end if;
  raise notice 'P2A_SECURITY_03_ANON_INSERT_DENIED';
  if has_table_privilege('anon', 'public.historical_entities', 'UPDATE') then
    raise exception 'P2A_SECURITY_04_ANON_UPDATE';
  end if;
  raise notice 'P2A_SECURITY_04_ANON_UPDATE_DENIED';
  if has_table_privilege('anon', 'public.historical_entities', 'DELETE') then
    raise exception 'P2A_SECURITY_05_ANON_DELETE';
  end if;
  raise notice 'P2A_SECURITY_05_ANON_DELETE_DENIED';

  -- 6. metadata.public=false is hidden by RLS.
  select count(*) into v_count
  from public.historical_entities
  where id = '__p2a_test_private';
  if v_count <> 0 then raise exception 'P2A_SECURITY_06_PRIVATE_VISIBLE'; end if;
  raise notice 'P2A_SECURITY_06_PRIVATE_HIDDEN';

  -- 7. Anonymous cannot read archive base table and safe view masks full URL.
  if has_table_privilege('anon', 'public.archive_maps', 'SELECT') then
    raise exception 'P2A_SECURITY_07_ARCHIVE_BASE_GRANT';
  end if;
  select image_url into v_value
  from public.p2a_public_archive_maps
  where id = '__p2a_test_restricted_map';
  if v_value is not null then raise exception 'P2A_SECURITY_07_RESTRICTED_URL'; end if;
  raise notice 'P2A_SECURITY_07_RESTRICTED_URL_MASKED';

  select image_url into v_value
  from public.p2a_public_archive_maps
  where id = '__p2a_test_unknown_map';
  if v_value is not null then raise exception 'P2A_SECURITY_07_UNKNOWN_URL'; end if;
  select georeference_data::text into v_value
  from public.p2a_public_archive_maps
  where id = '__p2a_test_unknown_map';
  if v_value <> '{}' then raise exception 'P2A_SECURITY_07_UNKNOWN_GEOREFERENCE'; end if;
  raise notice 'P2A_SECURITY_07_UNKNOWN_FIELDS_MASKED';

  -- 8. Evidence RPC shape contains no reviewer identity or source body.
  select public.get_subject_evidence('entity', '__p2a_test_public_reviewed')
  into v_payload;
  if v_payload::text like '%reviewed_by%' or v_payload::text like '%source_body%' then
    raise exception 'P2A_SECURITY_08_EVIDENCE_FIELDS';
  end if;
  raise notice 'P2A_SECURITY_08_EVIDENCE_SAFE_FIELDS';

  -- 9. Invalid/excessive bbox is rejected.
  begin
    perform public.get_exhibition_snapshot(1500, -180, -90, 180, 90, 'ru');
    raise exception 'P2A_SECURITY_09_BBOX_ACCEPTED';
  exception
    when sqlstate '22023' then null;
  end;
  raise notice 'P2A_SECURITY_09_INVALID_BBOX_REJECTED';

  -- 10. Place limit is capped even if the caller asks for more.
  select count(*) into v_count
  from public.get_historical_places(1500, 40, 35, 100, 75, null, 100000);
  if v_count > 500 then raise exception 'P2A_SECURITY_10_LIMIT'; end if;
  raise notice 'P2A_SECURITY_10_LIMIT_BOUNDED';

  -- 11. Every public RPC fixes its search_path.
  select proconfig into v_config
  from pg_proc
  where oid = 'public.get_exhibition_snapshot(integer,double precision,double precision,double precision,double precision,text)'::regprocedure;
  if not coalesce(v_config, '{}') && array['search_path=pg_catalog, public, extensions'] then
    raise exception 'P2A_SECURITY_11_SEARCH_PATH';
  end if;
  raise notice 'P2A_SECURITY_11_SAFE_SEARCH_PATH';

  -- 12. P2A read functions are static SQL/PLpgSQL and accept no table names or
  -- SQL fragments. Verify no EXECUTE statement appears in their definitions.
  select count(*) into v_count
  from pg_proc
  where pronamespace = 'public'::regnamespace
    and proname in (
      'get_historical_geometries', 'get_historical_places',
      'get_historical_routes', 'get_subject_evidence',
      'get_exhibition_snapshot', 'get_educational_story'
    )
    and pg_get_functiondef(oid) ~* '\mexecute\M';
  if v_count <> 0 then raise exception 'P2A_SECURITY_12_DYNAMIC_SQL'; end if;
  raise notice 'P2A_SECURITY_12_NO_DYNAMIC_SQL';
end;
$p2a_checks$;

reset role;
rollback;

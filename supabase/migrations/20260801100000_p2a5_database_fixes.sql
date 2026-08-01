-- P2A.5 local-database corrections.
--
-- The P2A archive view used security_invoker=true while anonymous SELECT on
-- the underlying archive_maps table was intentionally revoked. PostgreSQL
-- checks base-table privileges for an invoker view, making the safe view
-- unreadable to anon. Keep the explicit public/license filter and masking in
-- the view, execute with the view owner's privileges, and add a security
-- barrier so predicates cannot be reordered across the masking boundary.

alter view public.p2a_public_archive_maps set (
  security_invoker = false,
  security_barrier = true
);

create or replace function public.get_p2a_dataset_status()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((
    select jsonb_build_object(
      'datasetVersion', m.dataset_version,
      'schemaVersion', m.metadata->'schemaVersion',
      'public', coalesce(m.metadata->>'public', 'true') <> 'false'
    )
    from public.p2a_dataset_metadata m
    where m.id = 'historical-dataset'
      and coalesce(m.metadata->>'public', 'true') <> 'false'
    limit 1
  ), '{}'::jsonb);
$$;

revoke all on function public.get_p2a_dataset_status() from public;
grant execute on function public.get_p2a_dataset_status() to anon;


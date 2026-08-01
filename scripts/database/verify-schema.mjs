import {
  safeErrorMessage,
  withPgClient,
} from "./local-database-utils.mjs";
import {
  createCheckCollector,
  updateVerificationReport,
} from "./verification-report.mjs";

const expectedTables = [
  "archive_maps",
  "educational_questions",
  "educational_stories",
  "educational_story_steps",
  "environment_snapshots",
  "historical_entities",
  "historical_events",
  "historical_geometries",
  "historical_names",
  "historical_people",
  "historical_places",
  "historical_routes",
  "historical_sources",
  "hydrology_snapshots",
  "p2a_dataset_metadata",
  "route_segments",
  "source_claim_sources",
  "source_claims",
];

const expectedGeometryColumns = new Map([
  ["historical_geometries.geom", "Geometry:4326"],
  ["historical_places.point", "Point:4326"],
  ["route_segments.geom", "LineString:4326"],
  ["environment_snapshots.geom", "Geometry:4326"],
  ["hydrology_snapshots.geom", "Geometry:4326"],
]);

const expectedFunctions = [
  "get_educational_story",
  "get_exhibition_snapshot",
  "get_historical_geometries",
  "get_historical_places",
  "get_historical_routes",
  "get_p2a_dataset_status",
  "get_subject_evidence",
  "p2a_is_public_record",
  "p2a_validate_bbox",
];

const expectedColumnTypes = new Map([
  ["historical_entities.summary", "jsonb"],
  ["historical_entities.created_at", "timestamp with time zone"],
  ["historical_names.source_ids", "ARRAY"],
  ["historical_places.entity_ids", "ARRAY"],
  ["archive_maps.default_opacity", "numeric"],
  ["environment_snapshots.interpolation_allowed", "boolean"],
  ["hydrology_snapshots.interpolation_allowed", "boolean"],
]);

const setEquals = (actual, expected) =>
  actual.size === expected.size && [...expected].every((value) => actual.has(value));

try {
  const result = await withPgClient(async (client) => {
    const collector = createCheckCollector();

    const versions = await client.query(`
      select
        current_setting('server_version') as postgres_version,
        extensions.postgis_lib_version() as postgis_version,
        coalesce((
          select max(version)
          from supabase_migrations.schema_migrations
        ), 'none') as migration_version
    `);

    const tables = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and table_name = any($1::text[])
      order by table_name
    `, [expectedTables]);
    const tableNames = new Set(tables.rows.map((row) => row.table_name));
    collector.check(
      "18 required tables",
      setEquals(tableNames, new Set(expectedTables)),
      `${tableNames.size}/18`
    );

    const geometries = await client.query(`
      select
        c.relname as table_name,
        a.attname as column_name,
        extensions.postgis_typmod_type(a.atttypmod) as geometry_type,
        extensions.postgis_typmod_srid(a.atttypmod) as srid
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_type t on t.oid = a.atttypid
      where n.nspname = 'public'
        and t.typname = 'geometry'
        and a.attnum > 0
        and not a.attisdropped
      order by c.relname, a.attname
    `);
    const geometryMap = new Map(
      geometries.rows.map((row) => [
        `${row.table_name}.${row.column_name}`,
        `${row.geometry_type}:${row.srid}`,
      ])
    );
    collector.check(
      "5 PostGIS columns with expected types and SRID",
      geometryMap.size === expectedGeometryColumns.size &&
        [...expectedGeometryColumns].every(
          ([name, type]) => geometryMap.get(name) === type
        ),
      `${geometryMap.size}/5`
    );

    const indexes = await client.query(`
      select
        i.relname as index_name,
        am.amname as access_method
      from pg_index x
      join pg_class i on i.oid = x.indexrelid
      join pg_class t on t.oid = x.indrelid
      join pg_namespace n on n.oid = t.relnamespace
      join pg_am am on am.oid = i.relam
      where n.nspname = 'public'
        and i.relname like 'p2a_%'
    `);
    const gistCount = indexes.rows.filter(
      (row) => row.access_method === "gist"
    ).length;
    const btreeCount = indexes.rows.filter(
      (row) => row.access_method === "btree"
    ).length;
    collector.check("5 P2A GiST indexes", gistCount === 5, String(gistCount));
    collector.check(
      "15 selective P2A B-tree indexes",
      btreeCount === 15,
      String(btreeCount)
    );

    const views = await client.query(`
      select c.relname, c.reloptions
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'v'
        and c.relname = 'p2a_public_archive_maps'
    `);
    collector.check(
      "safe archive view with owner execution and security barrier",
      views.rowCount === 1 &&
        !(views.rows[0].reloptions || []).includes("security_invoker=true") &&
        (views.rows[0].reloptions || []).includes("security_barrier=true")
    );

    const functions = await client.query(`
      select
        p.proname,
        p.prosecdef,
        p.proconfig,
        pg_get_functiondef(p.oid) as definition
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = any($1::text[])
    `, [expectedFunctions]);
    const functionNames = new Set(functions.rows.map((row) => row.proname));
    collector.check(
      "9 P2A helper/read functions",
      setEquals(functionNames, new Set(expectedFunctions)),
      `${functionNames.size}/9`
    );
    collector.check(
      "all functions fix search_path",
      functions.rows.every((row) =>
        (row.proconfig || []).some((value) => value.startsWith("search_path="))
      )
    );
    collector.check(
      "seven public read functions are security definer",
      functions.rows.filter(
        (row) => row.proname.startsWith("get_") && row.prosecdef
      ).length === 7
    );
    collector.check(
      "P2A functions contain no dynamic EXECUTE",
      functions.rows.every((row) => !/\bexecute\b/iu.test(row.definition))
    );

    const rls = await client.query(`
      select c.relname, c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
        and c.relname = any($1::text[])
    `, [expectedTables]);
    collector.check(
      "RLS enabled on all 18 tables",
      rls.rowCount === 18 && rls.rows.every((row) => row.relrowsecurity),
      `${rls.rows.filter((row) => row.relrowsecurity).length}/18`
    );

    const policies = await client.query(`
      select count(*)::integer as count
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = any($1::text[])
    `, [expectedTables]);
    collector.check(
      "expected anonymous select policies",
      policies.rows[0].count === 18,
      String(policies.rows[0].count)
    );

    const columns = await client.query(`
      select table_name, column_name, data_type
      from information_schema.columns
      where table_schema = 'public'
    `);
    const columnTypeMap = new Map(
      columns.rows.map((row) => [
        `${row.table_name}.${row.column_name}`,
        row.data_type,
      ])
    );
    collector.check(
      "required JSONB/timestamptz/array/numeric/boolean types",
      [...expectedColumnTypes].every(
        ([name, type]) => columnTypeMap.get(name) === type
      )
    );

    const constraints = await client.query(`
      select
        co.contype,
        count(*)::integer as count
      from pg_constraint co
      join pg_class c on c.oid = co.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = any($1::text[])
      group by co.contype
    `, [expectedTables]);
    const constraintCounts = Object.fromEntries(
      constraints.rows.map((row) => [row.contype, row.count])
    );
    collector.check("primary keys present", constraintCounts.p === 18);
    collector.check("foreign keys present", (constraintCounts.f || 0) >= 6);
    collector.check("check constraints present", (constraintCounts.c || 0) >= 25);
    collector.check("story order uniqueness present", (constraintCounts.u || 0) >= 1);

    const grants = await client.query(`
      select
        has_table_privilege('anon', 'public.archive_maps', 'SELECT') as archive_select,
        exists (
          select 1
          from unnest($1::text[]) table_name
          where has_table_privilege(
            'anon',
            format('public.%I', table_name),
            'INSERT,UPDATE,DELETE'
          )
        ) as any_write
    `, [expectedTables]);
    collector.check(
      "archive base table is not directly readable by anon",
      grants.rows[0].archive_select === false
    );
    collector.check(
      "anon has no mutation privileges",
      grants.rows[0].any_write === false
    );

    collector.print();
    return {
      passed: collector.passed,
      checks: collector.checks,
      postgresVersion: versions.rows[0].postgres_version,
      postgisVersion: versions.rows[0].postgis_version,
      migrationVersion: versions.rows[0].migration_version,
      tableCount: tableNames.size,
      geometryColumnCount: geometryMap.size,
      gistIndexCount: gistCount,
      btreeIndexCount: btreeCount,
    };
  });

  await updateVerificationReport("schema", result);
  if (!result.passed) process.exitCode = 1;
} catch (error) {
  console.error(`Schema verification failed: ${safeErrorMessage(error)}`);
  await updateVerificationReport("schema", {
    passed: false,
    error: safeErrorMessage(error),
  });
  process.exitCode = 1;
}

# P2A.5 Staging Go-Live Checklist

This checklist is for a future, explicitly approved staging rollout. Completing
P2A.5 does not create or modify a staging or production project.

## Database readiness

- [ ] A dedicated staging Supabase project has been created by an authorized owner.
- [ ] The staging project ref has been independently confirmed as non-production.
- [ ] All P2A and P2A.5 migrations have received SQL review.
- [ ] Clean local migration verification passes.
- [ ] Schema verification passes with 18 tables and five SRID 4326 columns.
- [ ] RLS assertions pass under the real anonymous role.
- [ ] Anonymous INSERT, UPDATE and DELETE denial is confirmed.
- [ ] Restricted and unknown archive fields are masked.
- [ ] Bounded RPC, bbox and language validation pass.
- [ ] Query plans have been reviewed at staging-like cardinality.

## Data readiness

- [ ] A pre-seed staging backup and restore procedure is documented.
- [ ] The deterministic seed output has been regenerated and reviewed.
- [ ] The seed contains 226 expected records.
- [ ] A second seed application is idempotent.
- [ ] Local/database repository parity is accepted.
- [ ] Dataset versions match.
- [ ] Geometry validation results have been reviewed.
- [ ] Archive licenses, especially unknown/restricted records, are reviewed.
- [ ] Scientific `needs_review` and `demo_only` warnings remain visible.

## Application readiness

- [ ] Staging public URL and anon key are configured without a service-role key.
- [ ] Explicit Supabase mode is tested.
- [ ] Auto fallback and retry are tested.
- [ ] `VITE_HISTORICAL_DATA_SOURCE=local` rollback is tested.
- [ ] Offline Exhibition, stories, evidence, routes and SVG fallback pass.
- [ ] `/map` makes no historical database requests.
- [ ] Local database E2E and standard E2E pass.
- [ ] Production build and PWA precache checks pass.
- [ ] Monitoring for RPC errors, latency and version mismatch is configured.

## Approval

- [ ] Migration/seed window approved.
- [ ] Rollback owner assigned.
- [ ] Scientific/editorial owner approves the reviewed dataset scope.
- [ ] Security owner approves RLS and archive masking.
- [ ] Explicit production approval recorded.


# P2A.9 stable release freeze policy

The `2026.08-stable1` release freezes architecture, timeline, layer model,
stories, routes, service-worker strategy, dependencies, database integration
and the 3D pipeline.

## Allowed changes

- critical crash fixes;
- broken release assets;
- accessibility blockers;
- explicit factual errors after written expert confirmation;
- security vulnerabilities.

Each exception must document the incident, evidence, approver, exact file list,
risk and rollback. Run scientific validations, stable preflight, unit tests,
relevant E2E, build, package integrity and `git diff --check`.

No frozen surface may be changed immediately before the exhibition. Production
promotion and rollback remain manual operations.

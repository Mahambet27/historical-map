# Security report

## Проверено и исправлено

- `.env` и `.env.*` исключены, `.env.example` содержит только placeholders.
- Git-tracked secrets по Mapbox/JWT/service-role patterns не найдены.
- Frontend использует только public Mapbox и optional Supabase anon configuration.
- Logger рекурсивно redacts Mapbox/JWT/access-token values.
- Directions errors не включают URL/token.
- Production audit после совместимого `npm audit fix`: **0 vulnerabilities**.
- Добавлены CodeQL JavaScript workflow и read-only CI permissions.
- Vercel headers: nosniff, referrer policy, permissions policy, immutable asset caching.
- CSP добавлена в `Report-Only`, поскольку Mapbox workers, Supabase и runtime model-viewer нужно
  проверить на Preview deployment до enforcement.
- `eval`/`new Function` и `dangerouslySetInnerHTML` в application source не найдены.

## Остаточные риски

Full dev audit сообщает 19 issues (2 low, 1 moderate, 16 high) в Lighthouse/PWA/ESLint tooling.
`npm audit fix --force` не использован: предлагаемые изменения являются breaking и включают
небезопасные downgrades. Эти пакеты не входят в production runtime.

Перед CSP enforcement нужно проверить Vercel Preview console и при необходимости уточнить реальные
Supabase/media origins. Canonical hostname `historical-map.vercel.app` также нужно подтвердить в
Vercel; README сейчас упоминает другой preview hostname.

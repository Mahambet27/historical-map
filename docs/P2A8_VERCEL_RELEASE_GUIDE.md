# P2A.8 — Vercel release guide

Deployment выполняется оператором вручную. Скрипты проекта не вызывают
`vercel deploy`.

1. Проверить рабочую branch, ожидаемый commit и release tag.
2. Выполнить `npm ci` и `npm run exhibition:package`.
3. Создать preview deployment с `VITE_RELEASE_CHANNEL=exhibition-rc`.
4. Проверить `/demo` во всех языках и `/demo?quality=light`.
5. Проверить отдельный исследовательский `/exhibition`.
6. Проверить, что `/map` не изменился.
7. Открыть `/demo/diagnostics`; не публиковать diagnostic URL аудитории.
8. Проверить PWA update с предыдущей preview-версии.
9. Проверить incognito, mobile, reduced motion и отсутствие token/path leaks.
10. Только после sign-off переключить channel на `exhibition-stable` и
    вручную promote preview deployment в production.

## Safe environment

Допустимы `VITE_RELEASE_CHANNEL`, `VITE_OFFLINE_EXHIBITION=false`,
`VITE_HISTORICAL_DATA_SOURCE=local|auto` и одобренный public Mapbox token.
Service-role keys запрещены. Remote Supabase не требуется.

## Cache purge

Сначала использовать Vercel redeploy/purge для конкретного deployment. В
браузере удалять только caches с префиксом Qazaq Heritage Map через
`/demo?recovery=true`. Не очищать storage других сайтов.


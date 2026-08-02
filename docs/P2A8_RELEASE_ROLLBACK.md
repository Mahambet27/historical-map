# P2A.8 — release rollback

## Online

1. В Vercel выбрать предыдущий проверенный deployment.
2. Выполнить Promote to Production для него.
3. Проверить `/exhibition-release.json` и версию в diagnostics.
4. Очистить только cache Qazaq Heritage Map при необходимости.
5. Проверить `/demo`, `/exhibition` и `/map`.
6. Database не изменять.

## Offline

1. Хранить предыдущий package рядом с текущим, не перезаписывая его.
2. Выполнить `stop-demo.ps1` текущего package.
3. Проверить `checksums.sha256` предыдущего package.
4. Запустить его `start-demo.ps1`.
5. Выполнить `check-demo.ps1`.
6. Открыть `/demo?kiosk=true` и проверить 1465.

Destructive Git reset оператору не требуется и в recovery-процессе запрещён.


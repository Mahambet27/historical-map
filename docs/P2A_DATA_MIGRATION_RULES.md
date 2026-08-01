# P2A data migration rules

1. Существующие строковые ID являются стабильными и переносятся без генерации
   новых UUID.
2. `needs_review` никогда автоматически не превращается в `reviewed` или
   `verified`.
3. `demo_only` никогда автоматически не становится production/reviewed.
4. Исходные JS datasets остаются доступными и являются offline fallback.
5. Каждая server record хранит provenance: local dataset, local ID, dataset
   version и время генерации seed.
6. Каждая импортируемая geometry имеет явный временной диапазон. Неизвестная
   граница остаётся `null`, а не выдумывается.
7. Все source claims сохраняют normalized связи с sources через
   `source_claim_sources`; `sourceIds` domain field восстанавливается mapper.
8. Неизвестная или restricted лицензия не становится открытой. Full image URL
   скрывается safe view/RPC.
9. Local Review Queue, reviewer notes, session answers и telemetry не изменяют
   и не входят в historical dataset.
10. Build/validation/generation повторяемы: стабильная сортировка, UTF-8 и
    отсутствие timestamp, зависящего от момента запуска, в canonical data.
11. Повторный seed использует idempotent upsert и не создаёт дубликаты.
12. Seed формируется транзакционно; generated SQL можно откатить до commit при
    ошибке. Production table drops не автоматизируются.
13. Приложение обязано работать при отсутствии Supabase, сети или server
    dataset.
14. Missing verification status не считается reviewed: importer назначает
    консервативный `needs_review` и сохраняет факт отсутствия в metadata.
15. Geometry validator только сообщает проблему. Он не закрывает ring, не
    меняет координаты и не вызывает `ST_MakeValid` автоматически.
16. Skipped record всегда отражается в seed report с ID и причиной.
17. Secrets, private keys, service role, auth state и private metadata не
    попадают в generated artifacts.
18. Binary archive images не сохраняются в database; переносятся только
    metadata и разрешённые URL/path.
19. Remote migrations, link, push и seed выполняются только после явного
    подтверждения пользователя.
20. Версия dataset включается в seed metadata и сравнивается с local version
    до включения server source.

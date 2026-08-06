# Era timeline audit

Audit date: 2026-08-06. This document inventories committed local data; it does
not introduce new historical dates. `src/data/exhibition/eraRegistry.js` is the
only canonical source for era ranges.

## Saka (`saka`)

- Names: Сакская эпоха / Сақ дәуірі / Saka period.
- Range: 800–300 BCE; default 550 BCE; key years: 800, 550, 300 BCE.
- States/geometries: `saka-communities` / `saka-550` (reviewed interval).
- Places: era registry references Berel and Issyk, while the current
  `historicalSettlements` collection has no Saka-range record.
- Events: `saka-archaeological-record`.
- People: none encoded for this era.
- Routes: `silk-road-southern-kazakhstan` starts at 200 BCE and therefore covers
  only the end of this era; the seasonal-cycle demo record is not scholarly data.
- Hydrology snapshots: none for this range.
- Gaps: sparse place, route, hydrology, event, and person coverage; no sequence of
  independently documented boundary snapshots.
- Disputed dates: none explicitly encoded. Period limits and the coarse boundary
  still require expert review.
- `needs_review`: era coverage and featured IDs.

## Turkic (`turkic`)

- Names: Тюркский период / Түркі кезеңі / Turkic period.
- Range: 552–942 CE; default 552; key years: 552, 603, 704, 756, 942.
- States/geometries: First and Western Turkic Khaganates, Türgesh, Karluk,
  Oghuz, Kimak, and Karakhanid records. Only `turkic-552` is reviewed; later
  reconstructions are `needs_review`.
- Places: Taraz, Otrar, Sayram, Turkistan, Syganak, Saraishyk, Balasagun, and
  Ispidjab are active by interval.
- Events: formation of the Turkic Khaganate.
- People: Bumin Qaghan; birth year is absent, death year is 552.
- Routes: southern Silk Road interval and the non-scholarly seasonal demo.
- Hydrology snapshots: coarse Aral interval and six medieval river records,
  all requiring review.
- Gaps: dates of people, exact location assertions, boundary transition evidence,
  and hydrological precision. Coverage after 941 ends at the registry boundary
  without a new state geometry.
- Disputed dates: none explicitly marked `disputed`; several transition ranges
  are approximate and must be reviewed.
- `needs_review`: most state geometries and all medieval hydrology.

## Kazakh Khanate (`kazakh-khanate`)

- Names: Казахское ханство / Қазақ хандығы / Kazakh Khanate.
- Range: 1465–1847 CE; default 1465; key years: 1465, 1511, 1521, 1643, 1723,
  1731, 1847.
- States/geometries: Kazakh Khanate interval snapshots plus Abulkhair,
  Moghulistan, Nogai, Timurid, Sibir, Dzungar, Bukhara, Khiva, Russian, and Qing
  contextual records. Reviewed Kazakh Khanate intervals end in 1521; later
  geometries are `needs_review`.
- Places: the eight committed historical settlements, subject to each place's
  active interval.
- Events: formation (1465–1466, approximate) and consolidation under Kasym Khan
  (1511–1521).
- People: Kerei, Janibek, and Kasym Khan; several life dates are absent.
- Routes: Silk Road interval ends in 1500; seasonal-cycle demo is excluded from
  scholarly claims.
- Hydrology: medieval river intervals end in 1500; coarse Aral interval extends
  to 1959.
- Gaps: reviewed boundaries after 1521, person life dates, route coverage after
  1500, and independently sourced hydrological snapshots.
- Disputed dates: the formation event is explicitly approximate; no record is
  currently encoded with `verificationStatus: disputed`.
- `needs_review`: most contextual and post-1521 boundary records.

## Kazakh SSR (`kazakh-ssr`)

- Names: Казахская ССР / Қазақ КСР / Kazakh SSR.
- Range: 1936–1990 CE; default 1936; key years: 1936 and 1960. The canonical
  registry ends at the last year covered by `kazakh-ssr-1936`; independence
  begins in 1991, avoiding an ambiguous overlap.
- States/geometries: `kazakh-ssr-1936`, reviewed through 1990.
- Places: no dedicated SSR-era historical-name assertions; legacy place
  intervals remain active and require temporal/name review.
- Events: `kazakh-ssr-status` (1936).
- People and routes: none specifically encoded; the demo seasonal route is not
  scholarly evidence.
- Hydrology: Aral snapshots are discrete intervals from 1960 onward. The 1960
  record is `demo_only`; later records are `needs_review`.
- Gaps: reviewed Aral geometries, people, events across the era, historical
  place-name assertions, and route data.
- Disputed dates: none explicitly encoded.
- `needs_review`: hydrology and place-name applicability.

## Independent Kazakhstan (`independent-kazakhstan`)

- Names: Независимый Казахстан / Тәуелсіз Қазақстан / Independent Kazakhstan.
- Range: 1991–2026 CE; default 1991; key years: 1991 and 2026.
- States/geometries: `republic-1991`, verified and open-ended.
- Places: no dedicated year-bounded historical-name dataset for this era.
- Events: `independence-kazakhstan` (1991).
- People and historical routes: none specifically encoded.
- Hydrology: Aral intervals for 1991–1999, 2000–2009, 2010–2014, and 2015 onward,
  all `needs_review`.
- Gaps: reviewed environmental snapshots, richer event coverage, and explicit
  place-name intervals. Modern labels are deliberately not used as map fallback.
- Disputed dates: none explicitly encoded.
- `needs_review`: Aral geometries and completeness.

## Cross-era findings

- Data is interval-based; a slider year does not imply a unique annual geometry.
- Boundary changes occur only when a committed interval/snapshot changes. Linear
  interpolation is not used.
- The absence of a local record is a data gap, not evidence that an object did
  not exist.
- Person records with absent life dates must not be used for strict lifetime
  validation until stronger sources are added.
- `demo_only`, `approximate`, and `needs_review` records must remain visibly
  distinguished from reviewed or verified data.

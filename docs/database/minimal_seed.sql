-- Minimal safe seed for Qazaq Heritage Map
-- This file is intentionally small and uses only reviewed public content.
-- It does not include fake sources, service keys, or write operations beyond basic inserts.

-- Eras
insert into public.eras (slug, name_ru, name_kk, name_en, sort_order, is_active)
values
  ('bronze-age', 'Қола дәуірі', 'Қола дәуірі', 'Bronze Age', 10, true),
  ('saka-era', 'Сақ дәуірі', 'Сақ дәуірі', 'Saka Era', 20, true),
  ('popular-kazakhstan', 'Танымал Қазақстан', 'Танымал Қазақстан', 'Popular Kazakhstan', 30, true)
on conflict (slug) do nothing;

-- Categories
insert into public.categories (slug, name_ru, name_kk, name_en, sort_order, is_active)
values
  ('archaeology', 'Археология', 'Археология', 'Archaeology', 10, true),
  ('natural-heritage', 'Табиғи мұра', 'Табиғи мұра', 'Natural heritage', 20, true),
  ('tourism', 'Туризм', 'Туризм', 'Tourism', 30, true)
on conflict (slug) do nothing;

-- Places
insert into public.places (
  slug,
  status,
  region,
  district,
  place_type,
  era_id,
  latitude,
  longitude,
  short_notes,
  full_notes
)
values
  (
    'tamgaly-petroglyphs',
    'published',
    'Almaty Region',
    null,
    'Rock art',
    (select id from public.eras where slug = 'bronze-age' limit 1),
    43.802,
    75.535,
    'UNESCO rock-art landscape with thousands of images.',
    'Tamgaly petroglyphs are one of Kazakhstan''s best-known archaeological landscapes.'
  ),
  (
    'burabay-national-park',
    'published',
    'Akmola Region',
    null,
    'National park',
    (select id from public.eras where slug = 'popular-kazakhstan' limit 1),
    53.0874,
    70.2521,
    'A resort landscape of lakes, pine forests, and granite hills.',
    'Burabay is one of northern Kazakhstan''s most popular natural destinations and a well-known cultural landscape.'
  )
on conflict (slug) do nothing;

-- Place translations
insert into public.place_translations (
  place_id,
  language,
  title,
  short_description,
  full_description
)
values
  (
    (select id from public.places where slug = 'tamgaly-petroglyphs' limit 1),
    'kk',
    'Таңбалы петроглифтері',
    'Қола дәуірінен бастап салынған мыңдаған жартас суреттері бар ЮНЕСКО нысаны.',
    'Таңбалы шатқалындағы петроглифтер ежелгі адамдардың дүниетанымы, салт-дәстүрі және күнделікті өмірі туралы дерек береді. Бұл Қазақстандағы ең танымал археологиялық кешендердің бірі.'
  ),
  (
    (select id from public.places where slug = 'tamgaly-petroglyphs' limit 1),
    'ru',
    'Петроглифы Тамгалы',
    'Объект ЮНЕСКО с тысячами изображений от бронзового века и позднее.',
    'Петроглифы Тамгалы рассказывают о мировоззрении, обрядах и быте древних людей. Это один из самых известных археологических комплексов Казахстана.'
  ),
  (
    (select id from public.places where slug = 'tamgaly-petroglyphs' limit 1),
    'en',
    'Tamgaly Petroglyphs',
    'A UNESCO rock-art landscape with thousands of images from the Bronze Age onward.',
    'The Tamgaly petroglyphs reveal ancient beliefs, rituals, and everyday life. The site is one of Kazakhstan''s best-known archaeological landscapes.'
  ),
  (
    (select id from public.places where slug = 'burabay-national-park' limit 1),
    'kk',
    'Бурабай ұлттық паркі',
    'Көлдері, қарағайлы ормандары және гранитті жартастарымен танымал курорттық аймақ.',
    'Бурабай ұлттық паркі Солтүстік Қазақстандағы ең танымал табиғи-туристік аймақтардың бірі. Картадағы жасыл контур парктің шамамен орналасу аймағын көрсетеді.'
  ),
  (
    (select id from public.places where slug = 'burabay-national-park' limit 1),
    'ru',
    'Национальный парк Бурабай',
    'Курортная зона с озерами, сосновыми лесами и гранитными скалами.',
    'Национальный парк Бурабай является одной из самых популярных природных зон Северного Казахстана. Зеленый контур на карте показывает примерную область парка.'
  ),
  (
    (select id from public.places where slug = 'burabay-national-park' limit 1),
    'en',
    'Burabay National Park',
    'A resort landscape of lakes, pine forests, and granite hills.',
    'Burabay National Park is one of northern Kazakhstan''s most popular natural destinations. The map shows the approximate park area as a green contour.'
  )
on conflict (place_id, language) do nothing;

-- Place categories
insert into public.place_categories (place_id, category_id)
values
  (
    (select id from public.places where slug = 'tamgaly-petroglyphs' limit 1),
    (select id from public.categories where slug = 'archaeology' limit 1)
  ),
  (
    (select id from public.places where slug = 'tamgaly-petroglyphs' limit 1),
    (select id from public.categories where slug = 'tourism' limit 1)
  ),
  (
    (select id from public.places where slug = 'burabay-national-park' limit 1),
    (select id from public.categories where slug = 'natural-heritage' limit 1)
  ),
  (
    (select id from public.places where slug = 'burabay-national-park' limit 1),
    (select id from public.categories where slug = 'tourism' limit 1)
  )
on conflict do nothing;

-- Intentionally omit place_images and place_sources until reviewed public assets and verified sources are ready.

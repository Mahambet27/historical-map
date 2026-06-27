# Seed Example

This is a small illustrative example only. It is not a full migration script and it does not use real secrets.

```sql
-- Example only: seed a single place and its related records.
-- Adjust IDs, slug values, and publication status during review.

insert into public.eras (id, slug, name_ru, name_kk, name_en, sort_order, is_active)
values (
  gen_random_uuid(),
  'saka-era',
  'Saka period',
  'Saka period',
  'Saka period',
  10,
  true
);

insert into public.categories (id, slug, name_ru, name_kk, name_en, sort_order, is_active)
values (
  gen_random_uuid(),
  'archaeology',
  'Archaeology',
  'Archaeology',
  'Archaeology',
  10,
  true
);

insert into public.places (
  id,
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
values (
  gen_random_uuid(),
  'example-place',
  'draft',
  'East Kazakhstan Region',
  'requires review',
  'Historical site',
  (select id from public.eras where slug = 'saka-era' limit 1),
  47.599920,
  83.612880,
  'Short summary copied from the frontend after editorial review.',
  'Long description copied from the frontend after editorial review.'
);

insert into public.place_translations (
  place_id,
  language,
  title,
  short_description,
  full_description
)
values (
  (select id from public.places where slug = 'example-place' limit 1),
  'en',
  'Example Place',
  'Example short description.',
  'Example full description.'
);

insert into public.place_categories (place_id, category_id)
values (
  (select id from public.places where slug = 'example-place' limit 1),
  (select id from public.categories where slug = 'archaeology' limit 1)
);

insert into public.place_images (
  place_id,
  public_url,
  alt_text,
  caption,
  sort_order,
  is_primary
)
values (
  (select id from public.places where slug = 'example-place' limit 1),
  '/images/example-place/1.jpg',
  'Example image',
  'Example caption',
  1,
  true
);

insert into public.place_sources (
  place_id,
  source_type,
  title,
  source_url,
  citation
)
values (
  (select id from public.places where slug = 'example-place' limit 1),
  'web',
  'Example source',
  'https://example.com',
  'Example citation text'
);
```

## Notes

- This example keeps `coords` aligned with `[longitude, latitude]` from the current frontend data.
- The example uses `draft` to avoid claiming that the content is published before review.
- Replace placeholder text with reviewed content only.
- Do not store private keys or service role keys in this file.

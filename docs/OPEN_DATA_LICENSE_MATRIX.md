# Open data license matrix

Checked: 2026-08-06. The machine-readable decisions are in
`data-sources/open-data-sources.json`. A catalog entry is not publication
approval: each record remains in staging until provenance, geometry, chronology,
and scholarly readiness are reviewed.

| License/terms | Pipeline status | Attribution | Production handling |
|---|---|---|---|
| CC0 / public domain | `allowed` | Not legally required | May enter review pipeline |
| CC BY | `allowed_with_attribution` | Required and retained per record | May enter review pipeline |
| CC BY-SA | `isolated_share_alike` | Required | Isolated lane; share-alike obligations must be satisfied |
| ODbL | `isolated_share_alike` | Required | Cross-check database only; never automatically merged |
| CC BY-NC / non-commercial terms | `noncommercial_only` | Required | Excluded from commercial production dataset |
| Dataset/product-specific terms | `review_required` | As specified | Disabled until a concrete version is reviewed |
| Restricted | `prohibited` | N/A | Import blocked |
| Unknown or missing | `unknown` | N/A | Import blocked |

## Current source decisions

| Source | License decision | Enabled | Use |
|---|---|---:|---|
| Kazakhstan Open Data / heritage register candidates | Dataset-specific confirmation required | No | Official-priority discovery only |
| UNESCO World Heritage List | CC BY-SA 4.0 | Yes | Isolated heritage metadata; media excluded |
| Wikidata structured data | CC0 1.0 | Yes | IDs, names, links, coordinate candidates; historical claims stay `needs_review` |
| Pleiades | CC BY 3.0 | Yes | Ancient places and bibliography |
| World Historical Gazetteer | Per-dataset license | No | Only compatible individual datasets |
| GeoNames | CC BY 4.0 | Yes | Modern coordinate cross-check only |
| Natural Earth | Public domain | Yes | Generalized physical context only |
| OpenStreetMap | ODbL 1.0 | Yes | Isolated modern coordinate cross-check |
| HydroSHEDS | Non-commercial scientific/educational terms | No | Non-production hydrology cross-check |
| NASA Earthdata | Product-specific notices | No | Enable only a reviewed product |
| Copernicus Data Space | Product-specific legal notice/attribution | No | Enable only a reviewed product |
| Smithsonian Open Access | CC0 only for designated assets/metadata | No | Object-level rights review |
| Open Context | Dataset-specific Creative Commons license | No | Project-level archaeological review |

## Controls

- `npm run data:sources:validate` blocks unknown or prohibited licenses.
- CC BY records must retain attribution in provenance.
- Share-alike and ODbL outputs remain isolated.
- Lower-priority community/cross-check sources never overwrite official records.
- Images and archive-map files require separate object-level rights review.
- Automatically imported boundaries never become public without manual scholarly
  review and reviewer metadata.

The registry records official source pages and versions; it does not copy source
descriptions or media.

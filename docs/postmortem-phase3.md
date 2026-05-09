# Phase 3 Postmortem

Date: 2026-05-10

## Audit Grids

| Audit | Before | After |
| --- | --- | --- |
| Input pathways | 4 green, 4 yellow, 7 red | 8 green, 7 ADR-out-of-scope, 0 yellow, 0 red |
| Output pathways | 2 green, 1 yellow, 9 red | 9 green, 3 ADR-out-of-scope, 0 yellow, 0 red |
| Controls | 9 green, 1 yellow, 2 red | 12 green, 0 yellow, 0 red |
| Feature claims | 9 green, 2 yellow, 0 red | 11 green/corrected, 0 yellow, 0 red |

## Half-Baked Feature Triage

| Feature | Outcome | Rationale |
| --- | --- | --- |
| Result export | Finished | JSON/CSV/copy/print/curl are the minimum practical take-out paths. |
| Session state | Finished | Save/import/share/reset turns partial localStorage into a recoverable workflow. |
| Settings | Finished | Max nuclei and backend URL are real settings; no placeholder toggles remain. |
| API automation | Finished | Current-region curl copy removes manual request reconstruction. |
| Backend result volume wording | Deleted/reworded | Server-side result persistence is not shipped. |
| Browser WSI upload | Explicitly out of scope | It would change the Mode C architecture. |

## Codebase Health

| Metric | Before | After |
| --- | --- | --- |
| DRY findings in core modules | 3 | 0 blocking |
| SOLID findings | 2 | 0 blocking |
| Production TODO/FIXME/XXX/HACK | 0 | 0 |
| Handwritten unsafe casts | 2 | 0 blocking |
| Real-user path test holes | 3 | 0 blocking |

Generated OpenAPI `unknown` fields and test-environment canvas casts remain documented boundaries under ADR 0069.

## Stranger Test

Top three addressed issues:

1. No way to take a count out of the app. Fixed with JSON, CSV, copied summary, copied curl, and print.
2. No portable session restore. Fixed with versioned session JSON import/export and hash links.
3. Docs did not clearly tell a fresh user how to move from smoke test to their own backend slide folder. Fixed in README and limitations.

## Documentation/Reality Fixes

- README now has a shipped-feature checklist and limitations.
- Architecture no longer implies shipped backend result storage.
- Privacy docs now list max nuclei, session JSON/share links, and explicit result exports.
- Phase 3 audits include before/after counts and ADR-out-of-scope rows.

## What Surprised Me

The segmentation engine was stronger than the product shell around it. The biggest usability failures were not pathology logic; they were ordinary work completion gaps: export, restore, reset, and honest docs.

## Still-Open Completeness Gaps

1. Optional GeoJSON export for spatial annotation tools.
2. A public non-sensitive demo backend or downloadable demo bundle for first-time users.
3. Better large-slide progress reporting during backend scans.
4. A human stranger test on a real lab workstation and slide folder.
5. Dependency vulnerability follow-up for the one moderate GitHub advisory currently reported on push.

## Honest Take

Could a stranger use this app for their own real work, end-to-end, with zero help? For a technical user who can run the backend and place slides in a folder: yes, for local viewing, viewport segmentation, cell counting, and exporting the result. For a non-technical pathologist expecting to drag an SVS into the public web page: no. That is now explicit rather than hidden, and the shipped workflow has the missing take-out and recovery paths filled in.

# Phase 3 Output Pathway Audit

Date: 2026-05-10

Scope: current `main` at `62ff1e3` before Phase 3 implementation.

| Pathway | Before status | Evidence | User impact | Phase 3 decision |
| --- | --- | --- | --- | --- |
| Cell count display | Works fully | Summary panel shows count, method, confidence, tissue, elapsed time, warnings. | User can inspect the current segmentation result in the browser. | Keep. |
| Overlay display | Works fully | `SlideViewer` renders nuclei overlays from the segmentation result. | User can visually validate detections. | Keep. |
| CSV export | Claimed by need, not built | No CSV export button or utility. | Counts cannot move into spreadsheets without manual transcription. | Implement nuclei CSV export. |
| JSON export | Not built | No result download button. | Downstream scripts cannot consume the segmentation result. | Implement deterministic JSON export. |
| Copy-to-clipboard | Not built | No clipboard output handlers. | User cannot paste a summary into notes or email. | Implement summary and curl copy. |
| Share link | Not built | No hash state encoder. | User cannot send a reproducible starting point. | Implement hash-encoded small app state. |
| Downloadable state file | Not built | No app state schema/export/import. | User cannot move a session between browsers. | Implement versioned state export/import. |
| Print/PDF view | Not built | No print control or print styles. | User cannot produce a quick report page. | Implement print control and basic print CSS. |
| Screenshot | Not built | No canvas capture control. | Browser and OS screenshot tools already cover this. | Keep out of scope; document in ADR. |
| Embed code | Not built | No stable embeddable public data surface. | Embedding a private backend viewer is unsafe by default. | Permanently out of scope for Phase 3. |
| API/curl-ready output | Works partially | API exists and docs list endpoints; UI does not produce a command for the current slide/region. | Automation users must reconstruct requests manually. | Implement current-request curl copy. |
| Backend result storage | Claimed as reserved, not shipped | Architecture doc says result volume is reserved/future. | Docs can imply persistence that does not exist. | Correct docs to frontend-local exports only. |

Before counts: 2 green, 1 yellow, 9 red.

## After Phase 3

| Pathway | After status | Evidence |
| --- | --- | --- |
| Cell count display | Works fully | Unchanged summary panel. |
| Overlay display | Works fully | Unchanged OpenSeadragon overlay. |
| CSV export | Works fully | `segmentationToCsv` is unit-tested and wired to Export CSV. |
| JSON export | Works fully | `buildSegmentationJsonExport` is unit-tested and wired to Export JSON. |
| Copy-to-clipboard | Works fully | Summary and curl copy actions are wired with fallback error copy. |
| Share link | Works fully | `workbench-state/v1` hash round-trip is unit-tested. |
| Downloadable state file | Works fully | Save Session and Import Session use the same Zod schema. |
| Print/PDF view | Works fully | Print action and print CSS are shipped. |
| Screenshot | Permanently out of scope | ADR 0062 keeps OS/browser screenshot tools as the pathway. |
| Embed code | Permanently out of scope | ADR 0062; private backend embedding is not a Phase 3 target. |
| API/curl-ready output | Works fully | Current segmentation request curl command is copyable. |
| Backend result storage | Permanently out of scope | ADR 0062; browser exports replaced the reserved result-volume claim. |

After counts: 9 green, 3 ADR-out-of-scope, 0 yellow, 0 red.

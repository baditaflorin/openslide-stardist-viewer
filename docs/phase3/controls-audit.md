# Phase 3 Controls Audit

Date: 2026-05-10

Scope: current `main` at `62ff1e3` before Phase 3 implementation.

| Control | Before status | End-to-end behavior on real data | Phase 3 decision |
| --- | --- | --- | --- |
| Star link | Works fully | Opens https://github.com/baditaflorin/openslide-stardist-viewer. | Keep. |
| PayPal link | Works fully | Opens https://www.paypal.com/paypalme/florinbadita. | Keep. |
| Backend URL input | Works fully | Typing URL and pressing Enter/connect persists and refreshes queries. | Keep; validate with state schema. |
| Connect button | Works fully | Saves backend URL or shows invalid URL toast. | Keep. |
| Refresh slide list | Works fully | Refetches `GET /api/slides`. | Keep. |
| Slide row buttons | Works fully | Select slide and clear stale segmentation. | Keep. |
| Segment Viewport | Works fully | Reads viewer viewport, validates pixel budget, posts segmentation, renders result. | Keep; expose max nuclei setting. |
| Cancel | Works fully | Aborts the current segmentation request and resets mutation state. | Keep. |
| Debug panel via `?debug=1` | Works fully | Shows scan and segmentation JSON. | Keep; document inspectability. |
| Result export controls | Not built | No buttons exist. | Add JSON, CSV, copy summary, curl, print. |
| Session controls | Not built | No state export/import/share/reset controls exist. | Add complete session controls. |
| Settings controls | Works partially | Backend URL is a setting; no settings section or max nuclei persistence. | Add a compact settings section with only working controls. |

Before counts: 9 green, 1 yellow, 2 red.

## After Phase 3

| Control group | After status | Evidence |
| --- | --- | --- |
| Project links, backend connection, refresh, slide selection, segment, cancel, debug | Works fully | Existing controls still pass smoke. |
| Result export controls | Works fully | Export JSON, Export CSV, Copy Summary, Copy curl, and Print enable after segmentation. |
| Session controls | Works fully | Save Session, Import Session, Share Link, and Start Fresh are wired. |
| Settings controls | Works fully | Max nuclei setting changes the segmentation request and persists. |

After counts: 12 green, 0 yellow, 0 red.

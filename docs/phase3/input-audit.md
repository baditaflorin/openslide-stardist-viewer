# Phase 3 Input Pathway Audit

Date: 2026-05-10

Scope: current `main` at `62ff1e3` before Phase 3 implementation.

| Pathway | Before status | Evidence | User impact | Phase 3 decision |
| --- | --- | --- | --- | --- |
| Backend URL input | Works fully | `Backend URL` input persists through `localStorage` and reconnects queries. | User can point the Pages viewer at a local or server backend. | Keep and move into a complete settings model. |
| Backend slide directory scan | Works fully | `GET /api/slides` lists usable slides and Phase 2 scan problems. | Primary way to bring private WSI data into the app. | Keep as the canonical slide-input path. |
| Slide selection | Works fully | Slide buttons select a slide and persist the selected slide ID. | User can switch between backend slides. | Keep. |
| Browser file upload | Not built | No `<input type="file">` for slides or app state. | A stranger may expect to upload an SVS directly into Pages, which is not possible for OpenSlide-backed WSI streaming. | Slide upload remains out of scope; add state-import file input. |
| Drag and drop | Not built | No drag/drop handlers. | Dragging slides onto Pages does nothing. | Slide drag/drop remains out of scope; document why. |
| Paste text/HTML/image | Not built | No paste handlers or paste box. | Clipboard data cannot create a slide or session. | Slide paste remains out of scope; output clipboard gets completed. |
| URL input for slide source | Not built | Backend URL exists; no remote slide URL importer. | CORS and PHI sensitivity make public URL ingestion risky. | Out of scope; backend directory is the supported source boundary. |
| Clipboard read | Not built | No `navigator.clipboard.readText` use. | Cannot import state from clipboard. | Keep out of production UI; file-based state import is more predictable. |
| Mobile file picker | Not built | No upload controls. | Mobile users cannot load slides from Files/Photos directly. | Out of scope; mobile browser can still use a reachable backend. |
| Multi-file input | Works partially | Multi-file works when files are placed in backend slide directory; no browser batch import. | Real lab folders are supported server-side, but the UI does not explain the boundary. | Document backend-folder batch input as supported. |
| Folder input | Works fully through backend | Backend recursively scans the configured slide directory. | User can point Docker/local backend at a folder. | Keep and document as the real WSI ingestion path. |
| Sample/demo | Works partially | Smoke fixture works locally; no public demo slide loader in Pages. | The public URL can look empty without a backend. | Keep local smoke sample; do not ship public sample PHI-adjacent data. |
| Deep links | Works partially | Build supports SPA fallback; app state is not hash-encoded. | Users cannot share a selected slide/backend session. | Add hash state for backend URL and selected slide ID. |
| Imported state | Not built | No state-file schema or import control. | Users cannot resume work on another browser. | Add versioned JSON state import. |
| Restored autosave | Works partially | Backend URL and selected slide persist; max nuclei/settings/results do not. | Reload keeps only part of the session. | Add versioned settings persistence and start-fresh reset. |

Before counts: 4 green, 4 yellow, 7 red.

## After Phase 3

| Pathway | After status | Evidence |
| --- | --- | --- |
| Backend URL input | Works fully | Validated and persisted through the workbench state helpers. |
| Backend slide directory scan | Works fully | Unchanged canonical WSI input path. |
| Slide selection | Works fully | Persists through local storage, session export, and share hash. |
| Browser file upload | Permanently out of scope | ADR 0061 keeps WSI ingestion in the backend slide directory. |
| Drag and drop | Permanently out of scope | ADR 0061; direct browser slide ingestion would change architecture. |
| Paste text/HTML/image | Permanently out of scope | ADR 0061; not a supported slide source. |
| URL input for slide source | Permanently out of scope | ADR 0061; no remote slide ingestion in Phase 3. |
| Clipboard read | Permanently out of scope | File-based session import is the supported restore path. |
| Mobile file picker | Permanently out of scope | Mobile users use a reachable backend, not local slide upload. |
| Multi-file input | Works fully through backend | Backend recursive scan remains the batch pathway. |
| Folder input | Works fully through backend | Backend scan handles supported files and file-level problems. |
| Sample/demo | Works fully locally | Smoke fixture exercises a real end-to-end flow. |
| Deep links | Works fully for small state | Share link encodes backend URL, selected slide, and settings. |
| Imported state | Works fully | Versioned JSON session import is wired in the settings block. |
| Restored autosave | Works fully for settings | Backend URL, selected slide, and max nuclei persist; result payloads remain explicit exports. |

After counts: 8 green, 7 ADR-out-of-scope, 0 yellow, 0 red.

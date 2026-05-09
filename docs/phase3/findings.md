# Phase 3 Findings Synthesis

Date: 2026-05-10

## Top 5 Usability Gaps

1. A user can count nuclei but cannot export the result as CSV or JSON.
2. A user cannot save, import, or share a small session state.
3. A reload restores only backend URL and selected slide, not the full settings/session shape.
4. The public Pages URL can look empty without a backend, and the UI does not clearly distinguish browser upload from backend-folder ingestion.
5. README quickstart proves the app with smoke tests but does not walk a stranger through a complete local backend-to-Pages session.

## Top 5 Half-Baked Features

1. Result persistence/export: referenced as future/reserved, not exposed. Decision: finish browser downloads, remove backend-storage implication.
2. Settings: backend URL behaves like a setting, but there is no complete settings area. Decision: finish with only working settings.
3. State restore: partial localStorage persistence. Decision: finish with versioned session export/import/reset.
4. API automation: endpoints exist, but current request command is not surfaced. Decision: finish with curl copy.
5. Inspectability: `?debug=1` works but is undocumented in Phase 3. Decision: keep and document.

## Top 5 Codebase Pain Points

1. `SlideWorkbench` owns too many details for new output controls.
2. Browser persistence is not centralized or versioned.
3. Export formatting does not exist outside JSX.
4. API error narrowing uses an unsafe cast.
5. Tests cover the demo path but not take-out and restore paths.

## Top 5 Documentation/Reality Mismatches

1. Architecture mentions a reserved result volume while users need browser exports.
2. README quickstart stops before a complete manual run.
3. Privacy doc lists only backend URL and selected slide as stored data; Phase 3 will add settings/session state.
4. Postmortem still says CSV/GeoJSON export is future work.
5. Docs do not clearly say browser slide upload is intentionally unsupported.

## Definition of Fully Usable

1. A stranger can open Pages, point it at a running backend, select any detected slide, segment a viewport, and understand failures without reading source.
2. After a result appears, they can take it out as CSV, JSON, copied summary, copied curl, or a printed report.
3. They can save a small session file, import it in another browser, or copy a share link for the same backend/slide/settings.
4. They can recover from bad state with a start-fresh action.
5. The README describes exactly what is shipped and does not claim unfinished paths.

## Phase 3 Success Metrics

- Output audit green or ADR-out-of-scope for 100% of rows.
- Input audit green or ADR-out-of-scope for 100% of rows.
- Result JSON and CSV export utilities have deterministic unit tests.
- State export/import/hash round-trip is deterministic in unit tests.
- `make test`, `make build`, and `make smoke` pass before push.
- README feature claims match implemented controls.

## Out of Scope

- No direct browser WSI upload or browser OpenSlide WASM work.
- No remote slide URL ingestion.
- No backend result database or multi-user result sync.
- No screenshot capture or embeddable iframe mode.
- No visual polish beyond functional layout needed for new controls.

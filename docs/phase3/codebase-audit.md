# Phase 3 Codebase Health Audit

Date: 2026-05-10

Scope: current `main` at `62ff1e3` before Phase 3 implementation.

## DRY Violations

| Area | Before finding | Files | Phase 3 response |
| --- | --- | --- | --- |
| Browser persistence | Storage keys and localStorage reads/writes are split across the API client and `SlideWorkbench`. | `src/api/client.ts`, `src/features/slides/SlideWorkbench.tsx` | Extract workbench state helpers for settings/session state. |
| Output formatting | Result summaries are only implicit in JSX; no reusable formatter exists. | `src/features/slides/SlideWorkbench.tsx` | Add export formatter utilities used by UI and tests. |
| API error narrowing | Unknown API errors are narrowed with an inline unsafe cast. | `src/api/client.ts` | Replace with a small type guard. |

## SOLID Violations

| Area | Before finding | Risk | Phase 3 response |
| --- | --- | --- | --- |
| `SlideWorkbench` | Handles connection state, slide selection, segmentation orchestration, persistence, and all rendering. | Adding outputs risks a god component becoming worse. | Extract state/export helpers while keeping UI orchestration in the component. |
| Settings model | Backend URL is persisted independently, selected slide is persisted independently, and no migration shape exists. | Future persisted data may be silently lost. | Introduce a versioned state file and storage constants. |

## Dead Code

No abandoned source files were found. Generated OpenAPI types include unused schemas by design.

## TODO / FIXME / XXX / HACK

| Count | Notes |
| --- | --- |
| 0 production TODO/FIXME/XXX/HACK | `rg` found none in app/backend source. |
| 1 documentation placeholder | ADR 0007 calls `make data` a no-op placeholder by design. |
| 4 abstract `NotImplementedError` methods | `backend/app/slides/reader.py` protocol/base methods, not production stubs. |

## Type Safety Holes

| Finding | File | Phase 3 response |
| --- | --- | --- |
| Unsafe API error cast | `src/api/client.ts` | Replace with `z`/type guard narrowing. |
| OpenAPI POST options cast | `src/features/slides/useSlidesApi.ts` | Keep only if required by library typing and document as boundary; prefer typed helper if feasible. |
| Test canvas cast | `src/test/setup.ts` | Test-environment boundary only; document accepted boundary. |
| Generated `unknown` schema fields | `src/api/schema.ts` | Generated boundary; no source edit. |

## Inconsistent Patterns

| Finding | Risk | Phase 3 response |
| --- | --- | --- |
| Errors surface as either toast strings or query error text. | A failure can lack a next step. | Add output/import errors with what/why/now-what wording; keep backend domain errors. |
| Persistence lacks migration and reset. | Users cannot recover from bad stored state. | Add import/export/start-fresh controls and schema validation. |

## Test Coverage Holes

| Path | Before coverage | Phase 3 response |
| --- | --- | --- |
| Result export JSON/CSV | None because feature absent. | Add unit tests. |
| Session import/export/share | None because feature absent. | Add unit tests. |
| UI output controls | None because controls absent. | Add smoke/e2e coverage for visible controls after segmentation. |

Before metrics: 3 DRY findings, 2 SOLID findings, 0 production TODOs, 2 source type-safety holes, 3 test holes.

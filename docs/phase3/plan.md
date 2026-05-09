# Phase 3 Implementation Plan

Ranking is by real-user impact from `docs/phase3/findings.md`.

## Picklist

| Rank | Catalog item | Work | Acceptance check |
| --- | --- | --- | --- |
| 1 | #9 | Export segmentation result as deterministic JSON. | Unit test validates stable schema and sorted nuclei. |
| 2 | #9 | Export nuclei as deterministic CSV. | Unit test validates header, quoting, and row order. |
| 3 | #10 | Copy a human-readable result summary. | UI button copies text and shows confirmation. |
| 4 | #14 | Copy curl command for the current segmentation request. | Command includes backend URL, slide ID, region, and max nuclei. |
| 5 | #11 | Download a versioned session state file. | State schema includes version, backend URL, selected slide, settings. |
| 6 | #9/#41 | Import exported state. | Export then import restores deterministic state fields. |
| 7 | #12 | Copy a shareable hash URL for small state. | Hash decodes with the same schema. |
| 8 | #8/#38 | Restore last session settings on reload. | Settings survive reload and bad state falls back safely. |
| 9 | #40 | Add start-fresh reset. | Reset clears stored app state and result. |
| 10 | #18 | Complete settings surface. | Every setting shown changes behavior and persists. |
| 11 | #13 | Add print/PDF pathway. | Print button works and print CSS hides non-report chrome. |
| 12 | #1/#7 | Keep backend-folder input as first-class and clarify browser slide upload boundary. | UI and docs avoid implying direct slide upload. |
| 13 | #15 | Triage half-baked feature claims. | ADR 0063 records finish/hide/delete decisions. |
| 14 | #19/#42 | Align README feature claims with shipped behavior. | README has verified feature checklist and limitations. |
| 15 | #20 | Extract export formatting into one source of truth. | UI imports tested formatters. |
| 16 | #20 | Extract workbench state schema/helpers. | UI imports tested persistence helpers. |
| 17 | #23/#36 | Validate imported state at the boundary with Zod. | Invalid import produces a domain message, not a stack trace. |
| 18 | #31 | Standardize frontend error-copy style for imports/exports. | Every new error says what/why/now what. |
| 19 | #35 | Remove unsafe API error cast. | `apiErrorMessage` uses type guards. |
| 20 | #39 | Add persisted-state migration policy and first schema version. | ADR 0068 and tests cover version `workbench-state/v1`. |
| 21 | #43 | Verify quickstart path. | README commands match smoke-tested path. |
| 22 | #46/#47 | Run stranger test and fix top three issues. | `docs/phase3/stranger-test.md` plus postmortem evidence. |

## Priority Batches

1. ADR batch: completeness policy, input/output scope, half-baked decisions, persistence/type boundaries.
2. Output and state helpers with unit tests.
3. UI wiring for export/import/share/settings/reset/print.
4. Documentation and audit grid updates.
5. Stranger test, version bump, final build, smoke, tag, push.

## Explicit Non-Picks

- Browser WSI upload, direct slide drag/drop, remote slide URL ingestion, screenshot capture, embed code, backend result database, and multi-user sync stay out of scope because they would change the architecture or add new product surface rather than completing the current one.

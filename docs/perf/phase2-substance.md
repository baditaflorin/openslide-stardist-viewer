# Phase 2 Substance Performance Notes

Measured locally on 2026-05-09 using the committed real-data fixtures.

## Fixture Folder

- Usable slides: 4
- Problem files: 4
- Ignored MRXS sidecars: 20
- Fixture size: about 30 MB

## Before Phase 2

- Scan skipped bad files silently.
- No scan summary timing.
- Segmentation returned elapsed time but no confidence, tissue coverage, or warnings.

## After Phase 2

- Scan summary includes `duration_ms`, usable count, problem count, and ignored sidecar count.
- Segmentation includes elapsed time, confidence, tissue coverage, warnings, and provenance.
- Frontend disables concurrent segmentation and can abort the in-flight request.

## Budgets

- Scan warning threshold: 300 ms.
- Region hard limit: `SLIDE_VIEWER_MAX_REGION_PIXELS`, default 4,194,304 pixels.
- Frontend cancellation target: any operation that can exceed 5 s must be abortable from the UI.

## Known Cliff

Deep backend cancellation cannot interrupt native OpenSlide or TensorFlow work once the call is inside those libraries. Phase 2 provides frontend request abort and state recovery; deeper worker/process cancellation remains a Phase 3 candidate.

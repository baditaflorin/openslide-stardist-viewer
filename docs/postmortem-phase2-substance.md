# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before: 3/10. Clean Aperio, renamed Aperio, and correctly extracted MRXS were usable, but failures were silent or overconfident.

After: 8/10. The app now gives useful first-pass behavior for clean Aperio, renamed Aperio, extracted MRXS, fluorescence Leica, truncated SVS, empty/fake SVS, missing MRXS sidecar, and archive/DICOM-style package detection. Huge NDPI and sparse Philips remain partially addressed through warnings and policy, but not fully exercised as committed binary fixtures because they are hundreds of MB to multiple GB.

| Fixture | Before | After |
|---|---|---|
| Aperio clean SVS | Pass, no confidence | Pass with provenance/confidence |
| Renamed Unicode SVS | Pass, weak ID | Pass with better slug/fingerprint |
| Extracted MRXS | Pass, brittle | Pass with sidecar inference |
| Leica fluorescence | Wrong-confident | Low-confidence with modality warning |
| DICOM zip/package | Silent ignore | Classified as archive/DICOM guidance path |
| Huge Hamamatsu NDPI | Opaque | Huge-slide policy and warning path |
| Sparse Philips BigTIFF | Misleading blank risk | Sparse-risk policy and tissue coverage path |
| Truncated SVS | Silent skip | Visible problem file |
| Missing MRXS sidecar | Silent skip | Visible sidecar repair guidance |
| Empty/fake SVS | Silent skip | Visible empty/open-failed problem |

## Top 5 Logic Gaps Closed

1. Skipped files disappear: closed with scan problems in `/api/slides` and UI scan issues.
2. Segmentation suitability absent: closed with modality, tissue coverage, warnings, and confidence.
3. Extension brittleness: improved with `.dcm`/`.dicom` recognition and archive guidance.
4. Sidecar ignorance: improved with MRXS sidecar validation and repair copy.
5. Huge-slide opacity: improved with huge-slide inference and timing metadata; deep streaming progress remains open.

## Smart Behaviors Delivered

- Mounting a folder now reports usable slides and problem files.
- Slide metadata now includes vendor, modality, stain guess, sidecar state, huge/sparse risk, and warnings.
- Segmentation output now includes confidence, warnings, tissue coverage, and provenance.
- Low-confidence counts are visibly labeled and warnings carry next steps.
- `?debug=1` exposes scan and segmentation internals for support.

## Determinism

Pass for committed real-data segmentation fixture after removing volatile `elapsed_ms` from normalized comparison. Scan ordering is deterministic by relative path and stable IDs include normalized path plus fingerprint.

## Performance Numbers

- Backend real-data fixture suite: 4 tests passed in about 3 seconds locally.
- Frontend unit suite: 1 test passed in about 1 second locally.
- Built JS gzip: about 181 KB, still under the Phase 1 200 KB budget.

## What Surprised Us

The most damaging failures were not crashes. They were omissions: the UI simply failed to mention files it had skipped. The second most dangerous failure was confidence theater: fluorescence segmentation returned a number that looked as official as a clean brightfield count.

## Still Open For Phase 3

1. True backend cancellation for native OpenSlide/TensorFlow work.
2. Metadata cache for very large folders.
3. Tissue-aware tile preview before segmentation.
4. Real committed DICOM/Philips/Hamamatsu large-fixture testing through external artifact downloads.
5. Exportable segmentation result packages with full provenance.

## Honest Take

It feels less like a toy now because it understands failure as part of the domain. A user can bring a messy slide folder and learn what happened without reading logs. It is still not fully smart at huge-scale pathology operations: large WSI progress, native cancellation, and artifact-scale fixture coverage need another pass.

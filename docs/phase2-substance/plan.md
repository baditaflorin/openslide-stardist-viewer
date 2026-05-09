# Phase 2 Substance Plan

Ranking is by user impact against the 10 real-data audit inputs.

## Picklist

1. **Skipped-file scan report** (§32, §33): expose every skipped file with what/why/now-what.
2. **Input preflight classifier** (§1, §4, §5): classify empty, tiny, archive, DICOM, sidecar, unsupported, corrupt-looking inputs before opening.
3. **MRXS sidecar validation** (§13, §15, §17): detect missing sibling folder and missing `Slidedat.ini`.
4. **DICOM/package guidance** (§2, §13, §17): classify `.dcm`, `.dicom`, `.zip`, and archives with guidance instead of silence.
5. **Stable slide fingerprints** (§22, §35): content-ish fingerprint and stable deterministic IDs for real fixtures.
6. **Domain metadata inference** (§6, §7, §11): infer vendor, modality, stain guess, MPP/objective presence, huge/sparse flags.
7. **Scan health endpoint contract** (§24, §25): list valid slides, skipped files, warnings, duration, and totals in one deterministic response.
8. **Frontend scan diagnostics** (§11, §32): show problem files in domain language without adding new workflow.
9. **Segmentation suitability inference** (§12, §16): infer brightfield/fluorescence/blank-region suitability before count is trusted.
10. **Tissue presence heuristic** (§13, §18): estimate tissue coverage for selected region and flag blank/sparse viewports.
11. **Confidence model** (§16, §44): per-result confidence plus warning severity.
12. **No confident fluorescence counts** (§12, §16, §18): fluorescence or unsupported modality returns low-confidence warnings.
13. **Provenance on segment output** (§14, §38): app version, schema version, slide ID, region, method, parameters, warnings.
14. **Deterministic segmentation JSON** (§35): stable sorting and normalized values for repeated runs.
15. **Actionable error taxonomy** (§32, §34): recoverable/fatal/domain error classes and message conventions.
16. **Operation timing metadata** (§28): scan and segmentation durations, performance warnings over budget.
17. **State taxonomy docs** (§24, §25): enumerate loading/empty/problem/in-progress/cancelled states.
18. **Frontend state coherence** (§25, §27): disable concurrent segmentation, keep prior result until new result commits.
19. **Cancellation surface** (§26): abort in-flight frontend segmentation requests and restore previous state.
20. **Debug surface** (§37): `?debug=1` exposes scan report and latest segmentation diagnostics.
21. **Real-data fixture suite** (§1, §35): commit real fixtures/manifests and assert expected scan/segment properties.
22. **Performance fixture numbers** (§28, §46): record before/after scan and segment timings.
23. **Phase 2 postmortem pass-rate trend** (§4): before/after per fixture and honest toy assessment.

## Implementation Order

1. Fixtures and expected contracts.
2. Backend scan diagnostics and input classifier.
3. Backend metadata, suitability, confidence, provenance.
4. API/OpenAPI/frontend wiring.
5. Determinism and real-data tests.
6. State docs, performance docs, postmortem.

# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Project: `openslide-stardist-viewer`

Mode: C, unchanged from Phase 1

Sources used:

- https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/
- https://openslide.cs.cmu.edu/download/openslide-testdata/Leica/
- https://openslide.cs.cmu.edu/download/openslide-testdata/Mirax/
- https://openslide.cs.cmu.edu/download/openslide-testdata/DICOM/
- https://openslide.cs.cmu.edu/download/openslide-testdata/Hamamatsu/
- https://openslide.cs.cmu.edu/download/openslide-testdata/Philips-TIFF/
- https://openslide.org/formats/

## Method

I walked the v1 happy path: place input under the configured slide directory, scan/list slides, open the viewer, fetch tiles, segment the current viewport, and inspect whether the UI tells the user what happened.

Downloaded and exercised locally:

- `CMU-1-Small-Region.svs`
- `Leica-Fluorescence-1.scn`
- `CMU-1-Saved-1_16.zip`, extracted to MRXS sidecar layout
- corrupted/truncated variants derived from the downloaded SVS

For very large public fixtures, I audited the v1 behavior from the code path and the OpenSlide test-data metadata rather than downloading multi-GB files.

## The 10 Inputs

| # | Input | Reality class | What v1 did | What it should have done | Why it failed or struggled | Failure mode | Manual work pushed to user |
|---|---|---|---|---|---|---|---|
| 1 | `CMU-1-Small-Region.svs`, Aperio brightfield JPEG, 1.85 MB | Clean | Listed as Aperio, tiles loaded, 512x512 fallback segmentation returned 2 nuclei. | Same, but with confidence, MPP-aware defaults, and provenance. | Happy path works, but segmentation output has no confidence or method warning beyond method text. | Mostly OK, slightly overconfident | User must know whether `fallback-threshold` is meaningful. |
| 2 | `Case 123 – H&E São Paulo.svs`, same real SVS with human case-style filename | Mildly messy | Listed and opened. ID became `case-123-h-e-s-o-paulo-...`, losing accented meaning. No duplicate detection. | Preserve readable case label, detect duplicate slide content/path sibling, infer H&E from filename. | Slugger strips non-ASCII; no domain metadata inference; no checksum identity. | Subtle wrongness | User must mentally map app ID back to the real case name. |
| 3 | `CMU-1-Saved-1_16.mrxs` extracted from real MIRAX zip | Genuinely messy, multi-file sidecar | Listed as MIRAX, tiles loaded, segmentation returned 1 nucleus on first region. | Detect MRXS as a sidecar family, show sidecar health, warn if scan requires multiple files. | Works only when already extracted perfectly; no explanation that `.mrxs` depends on sibling directory. | OK when prepared; brittle | User must know to extract the zip and preserve folder structure. |
| 4 | `Leica-Fluorescence-1.scn`, real 3-channel fluorescence | Domain edge | Opened as generic `tiff`, no MPP/objective, segmentation returned 96 fallback nuclei. | Detect fluorescence and either disable brightfield nuclei segmentation or mark confidence very low with a modality warning. | Reader fell through to Pillow/OpenSlide metadata was not surfaced as fluorescence; segmentation assumes brightfield-ish color. | Wrong-but-confident | User must know the algorithm is inappropriate for fluorescence. |
| 5 | `3DHISTECH-1.zip`, real DICOM WSI package, 344.76 MB | Common packaging / format variant | v1 would ignore `.zip`; if extracted, `.dcm` is also ignored by `SUPPORTED_EXTENSIONS`. | Detect DICOM WSI packages or at least show “DICOM WSI not supported by this build; extract/install support” as a file-level issue. | Supported OpenSlide format list includes DICOM, but app extension allowlist omits `.dcm` and `.zip`. | Silent failure | User has to discover why no slide appears. |
| 6 | `Hamamatsu-1.ndpi`, real 6.43 GB NDPI, level 0 larger than 4 GiB | Huge input | v1 would attempt synchronous scan/list and tile serving with no progress, no estimate, no cancellation. | Preflight file size/vendor, show scan progress, cache metadata, make long operations cancellable. | No scan progress state; no performance budget; no cancellation path. | Stuck/opaque state risk | User waits without knowing whether the app is working. |
| 7 | `Philips-4.tiff`, real sparse BigTIFF from CAMELYON17, 277.51 MB | Sparse WSI | v1 would render blank/sparse areas as normal white tiles and allow segmentation on them. | Detect sparse/empty tiles or low-tissue regions; explain blank viewport and suggest panning to tissue. | No tissue/blank-region detection; no vendor-specific sparse-tile handling in UI. | Misleading output | User must infer that “nothing happened” is blank tissue, not failure. |
| 8 | `truncated-CMU-1.svs`, first 500 KB of real SVS | Partial/corrupt transfer | Backend logged “Pillow could not open this image slide”; UI would simply omit it. | Show skipped file with reason: “truncated or corrupt Aperio SVS; re-copy file.” | Scan discards unsupported files after logging only. | Silent failure | User must inspect server logs. |
| 9 | `missing-sidecar.mrxs`, MRXS index without sidecar directory | Broken multi-file input | Backend logged unsupported; UI would omit it. | Show “MRXS requires a sibling folder named `missing-sidecar/` with `Slidedat.ini`.” | No sidecar-aware validation or recovery hint. | Silent failure | User must already know MIRAX folder conventions. |
| 10 | `not-a-slide.svs` / empty `.svs`, adversarial or accidental wrong file | Broken/adversarial | Backend logged unsupported; UI would omit it. | Show skipped file with reason and distinguish empty file vs wrong content type. | Extension-based discovery plus generic error handling. | Silent failure | User has to guess whether the backend saw the file. |

## Top 5 Logic Gaps

1. **Skipped files disappear.** Unsupported, corrupt, partial, missing-sidecar, ignored-extension, and archive inputs are only visible in backend logs. The slide list gives no file-level failure inventory.
2. **Segmentation suitability is not inferred.** Brightfield fallback segmentation runs on fluorescence and sparse/blank regions with no confidence or “wrong modality” warning.
3. **Format support is extension-brittle.** DICOM WSI is an OpenSlide-supported domain format but `.dcm` is absent; `.zip` packages are ignored even when public fixtures are distributed that way.
4. **No sidecar/package intelligence.** MRXS and DICOM need families of files; v1 only sees individual files and does not explain required structure.
5. **No performance model for huge slides.** Multi-GB NDPI/BIF/Philips files have no scan progress, no cancellation, no metadata cache, no “this may take a while” state.

## Top 3 Intuition Failures

1. **“I put a file in the folder, but nothing appeared.”** The app does not tell the user it skipped the file or why.
2. **“It counted nuclei, so it must be valid.”** Counts on fluorescence or blank/sparse tiles look authoritative even when the method is inappropriate.
3. **“The backend is ready, but my slide is not.”** Health/readiness only says the server is alive; it does not communicate slide-ingestion health.

## Top 3 “Feels Stupid” Moments

1. The user must know that MRXS is not one file; the app should infer and explain the missing sidecar.
2. The user must know DICOM WSI is unsupported by this app despite OpenSlide supporting it; the app should detect `.dcm`/DICOM zip inputs and say so.
3. The user must know whether a region has tissue and whether the segmentation model applies; the app should infer modality/tissue presence and confidence.

## What “Smart” Means For This Product

1. Mounting a slide folder immediately produces two honest lists: usable slides and skipped/problem files with domain-specific reasons and next steps.
2. The app infers vendor, modality, MPP/objective, sidecar/package health, tissue presence, and segmentation suitability before the user clicks segment.
3. The first segmentation result carries confidence, method, parameters, input region, and warnings; low-confidence counts never look authoritative.
4. Huge and sparse slides have explicit progress, cancellation, blank-region detection, and metadata caching so the user is never left guessing.
5. Common packaging mistakes, especially MRXS sidecars, DICOM folders/zips, archives, and copied partial files, produce repair guidance instead of silence.

## Phase 2 Substance Success Metrics

- Real-data pass rate: at least 7 of these 10 fixtures complete the primary flow with no manual intervention beyond providing the file/folder.
- Skipped-file visibility: 100% of ignored/corrupt/unsupported inputs appear in a UI-visible scan report with what/why/now-what messaging.
- No silent wrongness: 100% of segmentation outputs include confidence, method, suitability warnings, and provenance.
- Modality guardrail: fluorescence and blank/sparse regions do not produce confident brightfield nuclei counts.
- Determinism: repeated scan + segment runs on each fixture produce byte-identical normalized JSON except explicit runtime durations.
- Performance honesty: operations over 300 ms show progress; operations over 5 s are cancellable; huge-file scan status is visible.
- DICOM/MRXS packaging: `.dcm`, DICOM zip/folder, `.mrxs` without sidecar, and `.mrxs` zip are all classified with clear guidance.

## Explicitly Out Of Scope

- No new architecture mode; remain Mode C.
- No new visual polish, dark mode, command palette, landing-page work, or branding work.
- No cloud storage, auth, multi-user collaboration, or cross-device sync.
- No clinical validation or diagnostic claims.
- No model training/fine-tuning.
- No broad feature expansion beyond making current scan, view, segment, and count flows robust and honest.
- No replacing OpenSlide/StarDist/HistomicsTK with a different core stack.

## Phase 2 Implementation Update

After `feat: add real-data scan intelligence`, the committed fixture suite reports:

- Usable real slides: 4
- Visible problem files: 4
- Ignored MRXS sidecar files: 20
- Real-data backend tests: 3 Phase 2 tests passing
- Overall audit pass rate moved from 3/10 to 8/10 when counting visible recoverable failures as successful substance behavior.

Closed in this pass:

- Unsupported/corrupt/empty/missing-sidecar files are visible in the scan report.
- Fluorescence slides and low-tissue regions receive low-confidence segmentation warnings.
- Segmentation outputs include confidence, tissue coverage, warnings, and provenance.
- Scan and segmentation behavior is deterministic on committed fixtures after removing volatile elapsed time from comparisons.

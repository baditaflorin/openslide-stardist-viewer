# Phase 3 Stranger Test

Date: 2026-05-10

Tester: substitute fresh-user pass in a clean Playwright/private-browser context, using the generated smoke slide and empty browser storage. No separate human tester was available during the autonomous pass.

## Scenario

1. Start the backend with one real generated slide in the backend slide folder.
2. Open the built GitHub Pages artifact in a clean browser context.
3. Confirm the app reaches `Ready`.
4. Select the demo slide.
5. Segment the current viewport.
6. Try to take the result out and recover/restore state without reading source code.

## Findings

| Finding | Severity | Response |
| --- | --- | --- |
| After a count appeared, the old UI had no obvious way to get the result into a spreadsheet or script. | High | Added Export JSON, Export CSV, Copy Summary, Copy curl, and Print controls. |
| A fresh browser could not save or restore the backend URL/slide/settings as a portable session. | High | Added Save Session, Import Session, Share Link, and Start Fresh controls backed by `workbench-state/v1`. |
| The README proved the smoke test but did not clearly separate smoke verification from a user's own slide run. | Medium | Updated quickstart, shipped-feature checklist, and limitations. |
| Browser upload expectations were ambiguous. | Medium | ADR 0061 and README limitations now state that WSI input comes from the backend slide directory. |

## Retest

`make smoke` now opens a clean context, waits for the backend, segments the demo slide, and asserts the result export controls are enabled after segmentation.

Remaining limitation: this substitute test cannot prove usability on a real pathologist's workstation with their own slide corpus. The backend real-data fixture suite remains the closest automated proxy.

# Phase 3 Feature Claims Audit

Date: 2026-05-10

Scope: README, docs, ADRs, and in-app labels on current `main` at `62ff1e3`.

| Claim | Source | Before status | Evidence | Phase 3 response |
| --- | --- | --- | --- | --- |
| Static GitHub Pages viewer | README, ADR 0001 | Shipped fully | Built site lives in `docs/` and shows version/commit. | Keep. |
| Local Docker/FastAPI backend streams OpenSlide tiles | README, docs/architecture.md | Shipped fully | Backend endpoints and smoke test exercise tile path. | Keep. |
| StarDist/HistomicsTK nuclei segmentation with fallback | README, backend docs | Shipped fully | Backend segmentation stack and fixture tests pass. | Keep. |
| Repeatable cell counts | README | Shipped fully | Phase 2 determinism tests cover fixtures. | Keep. |
| Version and commit display | User request, README architecture text | Shipped fully | Topbar renders `buildInfo.version` and commit. | Keep. |
| Repository and PayPal links on live page | User request | Shipped fully | Topbar links exist. | Keep. |
| Result export storage/reserved volume | docs/architecture.md, docs/postmortem.md | Shipped partially | Backend result volume is described as reserved; UI exposes no export. | Replace with browser downloads and remove storage implication. |
| GitHub Pages build output | README, ADR 0010 | Shipped fully | `make build` writes `docs/`. | Keep. |
| No client analytics | docs/privacy.md | Shipped fully | No analytics scripts. | Keep; update storage list. |
| Local hooks and checks | README, ADR 0016 | Shipped fully | `.githooks/` exists and `make install-hooks` configures it. | Keep. |
| Quickstart reaches usable local story | README | Shipped partially | `make smoke` works, but quickstart does not explicitly say how to start the backend and open the page after smoke. | Clarify quickstart. |

Before counts: 9 green, 2 yellow, 0 red.

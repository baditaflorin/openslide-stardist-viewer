# 0040. Real-Data Audit Findings and Substance Success Metrics

## Status

Accepted

## Context

The v1 viewer works on clean demo paths but silently skips corrupt/unsupported files, does not understand sidecar/package formats, and can present inappropriate segmentation counts as credible.

## Decision

Use the 10-input audit in `docs/phase2-substance/realdata-audit.md` as the Phase 2 grading rubric. Phase 2 succeeds when at least 7 of 10 fixtures complete the primary flow without manual intervention and every failure is visible, domain-specific, and recoverable where possible.

## Consequences

Fixture behavior is now a release gate. A change that makes any fixture worse needs an ADR explaining the tradeoff.

## Alternatives Considered

Relying on synthetic demo images was rejected because it would preserve the Phase 1 toy failure mode.

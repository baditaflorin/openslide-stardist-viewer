# 0044. Confidence Model

## Status

Accepted

## Context

Counts without confidence are dangerous when modality or tissue suitability is unclear.

## Decision

Represent confidence as a 0-1 score with label `high`, `medium`, or `low`. Confidence is reduced by fallback segmentation, fluorescence modality, low tissue coverage, missing MPP, oversized/downstream warnings, or unsupported metadata.

## Consequences

The UI and exports can avoid confident wrongness. Users can still inspect low-confidence results.

## Alternatives Considered

Hiding low-confidence results was rejected because users need diagnostic feedback.

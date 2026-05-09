# 0042. Inference Engine

## Status

Accepted

## Context

The app needs to infer domain facts that users currently provide mentally: vendor, modality, stain, MPP/objective presence, huge/sparse risk, and segmentation suitability.

## Decision

Implement lightweight deterministic inference from OpenSlide properties, filename hints, extension, dimensions, levels, region pixel statistics, and slide format. Use explicit confidence values and warnings instead of hidden guesses.

## Consequences

Inference remains explainable and testable. Heavy ML-based tissue classification is out of scope for this phase.

## Alternatives Considered

Adding a new classifier model was rejected because Phase 2 deepens current behavior without expanding deployment complexity.

# 0064. DRY Consolidation Map

## Status

Accepted

## Context

The workbench component currently owns persistence, result display formatting, and segmentation orchestration. Adding outputs directly there would duplicate result formatting and storage rules.

## Decision

Extract browser state helpers into `src/features/slides/workbenchState.ts` and result/output formatters into `src/features/slides/exports.ts`. Keep OpenSeadragon viewer logic in `src/features/viewer/`.

## Consequences

Export and persistence behavior can be unit-tested without rendering the workbench.

## Alternatives Considered

A larger state-management library was rejected because the current state shape is small and local to one feature.

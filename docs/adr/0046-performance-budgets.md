# 0046. Performance Budgets

## Status

Accepted

## Context

Huge WSI inputs can make scanning and segmentation feel stuck.

## Decision

Set budgets: scan response under 1 s for small fixture folders, visible timing for all scans, warning over 300 ms, cancellable frontend operations over 5 s, and region-size guardrails before backend work starts.

## Consequences

Users get honest timing and warnings. Deep backend cancellation for native libraries remains best-effort.

## Alternatives Considered

Ignoring performance until production was rejected because huge slides are normal data, not an edge case.

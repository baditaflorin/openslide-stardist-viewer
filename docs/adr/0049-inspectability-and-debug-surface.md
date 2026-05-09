# 0049. Inspectability and Debug Surface

## Status

Accepted

## Context

Power users and maintainers need to see why the app made a decision.

## Decision

Expose `?debug=1` in the frontend to show scan diagnostics and latest segmentation metadata. Keep it read-only and free of local filesystem paths.

## Consequences

Support gets a useful debugging surface without adding a new workflow.

## Alternatives Considered

Console-only debug output was rejected because production users do not inspect consoles.

# 0070. Documentation-Reality Alignment Process

## Status

Accepted

## Context

README and architecture docs contained future/reserved wording that could read as shipped behavior.

## Decision

Every README feature claim must correspond to an implemented control or tested endpoint. Limitations are explicit. Postmortems identify still-open gaps instead of implying they are already shipped.

## Consequences

Users get an honest setup path and a clear sense of what the public Pages app can and cannot do.

## Alternatives Considered

Leaving aspirational roadmap claims in the README was rejected because Phase 3 treats documentation drift as a usability bug.

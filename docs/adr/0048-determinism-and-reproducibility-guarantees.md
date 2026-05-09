# 0048. Determinism and Reproducibility Guarantees

## Status

Accepted

## Context

Same input should produce the same normalized output.

## Decision

Sort scan records deterministically, use stable IDs, normalize warnings, round numeric output consistently, and include provenance fields without volatile timestamps in fixture assertions.

## Consequences

Fixture tests can compare normalized JSON byte-for-byte.

## Alternatives Considered

Including live timestamps in every output was rejected for deterministic tests; runtime timings remain separate metadata.

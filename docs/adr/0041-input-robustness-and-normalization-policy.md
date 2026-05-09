# 0041. Input Robustness and Normalization Policy

## Status

Accepted

## Context

Real slide folders contain archives, sidecar formats, partial transfers, empty files, unsupported extensions, duplicated slides, and misleading filenames.

## Decision

Add a deterministic preflight classifier before opening slides. It records file size, extension, sidecar health, archive hints, DICOM hints, empty/tiny/truncated-looking files, and unsupported extension reasons. Valid slides and problem files share one scan report.

## Consequences

Skipped files are no longer silent. The frontend can tell users exactly what the backend saw and what to do next.

## Alternatives Considered

Only logging skipped files was rejected because users should not need server logs for normal recovery.

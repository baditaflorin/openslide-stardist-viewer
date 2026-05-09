# 0043. Domain Vocabulary and UI Language Conventions

## Status

Accepted

## Context

Current errors are developer-centric or invisible.

## Decision

Use pathology/file-domain language: slide, sidecar folder, DICOM WSI, fluorescence, brightfield, tissue coverage, segmentation suitability, copied/truncated file, and unsupported format. Every visible error follows what/why/now-what.

## Consequences

Messages become longer than raw exceptions but more useful. Technical exception details stay in logs.

## Alternatives Considered

Returning raw backend exceptions was rejected because it creates silent or confusing user states.

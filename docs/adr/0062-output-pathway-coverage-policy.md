# 0062. Output Pathway Coverage Policy

## Status

Accepted

## Context

Users can view counts but cannot take results into spreadsheets, scripts, reports, or another browser.

## Decision

Complete browser-side outputs: deterministic result JSON, deterministic nuclei CSV, copied summary text, copied curl command, versioned session JSON, shareable hash state, and print. Keep screenshot capture, embed code, and backend result storage out of scope.

## Consequences

Users get practical take-out paths without adding a result database, authentication, or multi-user state.

## Alternatives Considered

Backend result storage was rejected for Phase 3 because it would add mutations and lifecycle rules not needed to make the current single-user workflow complete.

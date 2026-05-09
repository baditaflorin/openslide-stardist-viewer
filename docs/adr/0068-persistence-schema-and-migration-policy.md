# 0068. Persistence Schema and Migration Policy

## Status

Accepted

## Context

Session files and localStorage need a stable shape so old user data does not silently break.

## Decision

Introduce `workbench-state/v1` with `api_base_url`, `selected_slide_id`, `settings.max_nuclei`, and export metadata. Unknown future versions are rejected with a recovery message. Future breaking changes must add a migration before changing the stored shape.

## Consequences

Users can export and import a small session file deterministically.

## Alternatives Considered

Using unversioned raw React state was rejected because it is brittle and hard to migrate.

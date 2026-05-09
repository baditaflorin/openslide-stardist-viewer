# 0063. Half-Baked Feature Triage Decisions

## Status

Accepted

## Context

The audit found several features that existed as claims, partial behavior, or future-reserved wording.

## Decision

Finish browser exports, session state, settings, API command copy, and inspectability documentation. Hide no production UI. Delete or reword backend result-volume claims so users do not expect server-side result persistence.

## Consequences

The visible app will have fewer implied promises and more controls that work end-to-end.

## Alternatives Considered

Keeping the result-volume wording as "future" was rejected because Phase 3 requires documentation/reality alignment.

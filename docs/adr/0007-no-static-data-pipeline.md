# 0007. No Static Data Pipeline

## Status

Accepted

## Context

Mode B would use a data generation pipeline that emits static artifacts. This project is Mode C.

## Decision

Do not create a static data pipeline for v1. The backend scans configured local slide directories and computes segmentation on demand.

## Consequences

There is no `make data` artifact workflow for v1. `make data` remains a documented no-op placeholder so the root Makefile shape is predictable.

## Alternatives Considered

Precomputing sample slide artifacts was considered, but it would not satisfy the primary workflow of analyzing arbitrary local WSI files.

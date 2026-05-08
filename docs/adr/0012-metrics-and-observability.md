# 0012. Metrics and Observability

## Status

Accepted

## Context

Mode C needs backend observability. The public frontend should collect no analytics by default.

## Decision

Expose Prometheus metrics at `/metrics`. Include Python runtime metrics, HTTP request metrics, and domain counters/histograms for slide scans, tile requests, segmentation requests, segmentation latency, and nuclei counts. Do not add client analytics in v1.

## Consequences

Operators can scrape the backend when running the Docker stack. Public GitHub Pages users are not tracked.

## Alternatives Considered

Plausible analytics was considered but rejected because usage insight is not worth adding tracking in v1.

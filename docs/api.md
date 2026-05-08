# API

OpenAPI contract: https://github.com/baditaflorin/openslide-stardist-viewer/blob/main/api/openapi.yaml

Default local backend: http://localhost:25342

## Health

```bash
curl -fsS http://localhost:25342/healthz
curl -fsS http://localhost:25342/readyz
```

## List Slides

```bash
curl -fsS http://localhost:25342/api/slides | jq .
```

## Fetch Deep Zoom Descriptor

```bash
curl -fsS http://localhost:25342/api/slides/<slide_id>/dzi
```

## Fetch A Tile

```bash
curl -fsS http://localhost:25342/api/slides/<slide_id>_files/10/0_0.jpeg -o tile.jpeg
```

## Segment A Region

```bash
curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"x":0,"y":0,"width":1024,"height":768,"max_nuclei":2500}' \
  http://localhost:25342/api/slides/<slide_id>/segment | jq .
```

## Metrics

```bash
curl -fsS http://localhost:25342/metrics
```

Production nginx blocks public `/metrics`; Prometheus should scrape it on the internal Docker network.

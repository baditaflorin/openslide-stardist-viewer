# Runbook

Repository: https://github.com/baditaflorin/openslide-stardist-viewer

Live frontend: https://baditaflorin.github.io/openslide-stardist-viewer/

## Local Checks

```bash
make lint
make test
make build
make smoke
```

## Logs

Backend logs are JSON on stdout:

```bash
docker compose -f deploy/docker-compose.yml logs -f app
```

nginx logs:

```bash
docker compose -f deploy/docker-compose.yml logs -f nginx
```

## Common Failures

Backend offline in the frontend:

- Confirm the backend URL in the top bar.
- Run `curl -fsS http://localhost:25342/healthz`.
- Check CORS origins in `SLIDE_VIEWER_ALLOWED_ORIGINS`.

No slides found:

- Confirm slides are mounted into `/data/slides`.
- Confirm extensions are supported: `.svs`, `.tif`, `.tiff`, `.ndpi`, `.scn`, `.vms`, `.vmu`, `.mrxs`, `.bif`, `.jpg`, `.jpeg`, `.png`.
- Check backend logs for unsupported file warnings.

Segmentation is slow:

- Zoom in before segmenting.
- Keep regions below `SLIDE_VIEWER_MAX_REGION_PIXELS`.
- Use a host with enough RAM for TensorFlow and StarDist.

## Resource Sizing

Small demo or JPEG slides:

- CPU: 2 cores
- RAM: 2 GB
- Disk: slide data plus 1 GB runtime headroom

Whole-slide StarDist inference:

- CPU: 4 to 8 cores
- RAM: 8 to 16 GB
- Disk: slide data plus model/cache headroom

## Metrics

Prometheus metrics include:

- `http_requests_total`
- `http_request_duration_seconds`
- `slide_scans_total`
- `slide_tile_requests_total`
- `segmentation_requests_total`
- `segmentation_duration_seconds`
- `segmentation_nuclei_count`

Prometheus config: `deploy/prometheus.yml`.

Grafana starter dashboard: `deploy/grafana/dashboard.json`.

## Backup

The app does not mutate slide files. Back up the mounted slide source according to your institutional data policy.

Reserved result volume backup:

```bash
docker run --rm -v openslide-stardist-viewer_results:/data -v "$PWD":/backup alpine tar czf /backup/results-backup.tgz /data
```

## Rollback

Frontend rollback is a git revert of the Pages publishing commit:

```bash
git revert <commit>
git push
```

Backend rollback:

```bash
docker compose -f deploy/docker-compose.yml pull app
docker compose -f deploy/docker-compose.yml up -d app nginx
```

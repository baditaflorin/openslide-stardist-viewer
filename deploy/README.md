# Deployment

Frontend: https://baditaflorin.github.io/openslide-stardist-viewer/

Repository: https://github.com/baditaflorin/openslide-stardist-viewer

Backend image: `ghcr.io/baditaflorin/openslide-stardist-viewer:latest`

## Prerequisites

- Docker Engine with Compose
- A server that can reach local slide storage
- DNS pointing your backend hostname to the server
- TLS certificates under `deploy/nginx/certs`

## First-Time Setup

```bash
git clone https://github.com/baditaflorin/openslide-stardist-viewer.git
cd openslide-stardist-viewer/deploy
cp .env.example .env
```

Edit `.env` with the backend public URL and allowed origins.

Place slides in the named `slides` volume or replace the volume with a read-only bind mount to your slide directory.

## TLS

The nginx config expects:

```text
deploy/nginx/certs/live/example.org/fullchain.pem
deploy/nginx/certs/live/example.org/privkey.pem
```

Replace `example.org` in `deploy/nginx/nginx.conf` with your hostname.

One common certificate flow is to issue certificates on the host with certbot, then mount `/etc/letsencrypt` read-only into nginx.

## Start

```bash
docker compose pull
docker compose up -d
```

The backend is exposed through nginx on host port `25342`.

## Observability

Start Prometheus:

```bash
docker compose --profile observability up -d prometheus
```

Prometheus config: `deploy/prometheus.yml`.

Grafana starter dashboard: `deploy/grafana/dashboard.json`.

## Logs

```bash
docker compose logs -f app
docker compose logs -f nginx
```

## Rollback

Pin the image tag in `deploy/docker-compose.yml`, then run:

```bash
docker compose pull
docker compose up -d
```

Frontend rollback is a git revert of the Pages build commit followed by `git push`.

## Custom Domain For Pages

Add `docs/CNAME` containing the domain, then configure DNS according to GitHub Pages documentation:

https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

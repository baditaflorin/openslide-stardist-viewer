ARG PYTHON_VERSION=3.11

FROM python:${PYTHON_VERSION}-slim-bookworm AS builder

ARG INSTALL_ML=true
ENV PIP_NO_CACHE_DIR=1
WORKDIR /build

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential gcc git libopenslide0 openslide-tools libglib2.0-0 libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements-core.txt backend/requirements-ml.txt ./
RUN python -m venv /venv \
  && /venv/bin/pip install --upgrade pip \
  && if [ "$INSTALL_ML" = "true" ]; then /venv/bin/pip install -r requirements-ml.txt; else /venv/bin/pip install -r requirements-core.txt; fi

FROM python:${PYTHON_VERSION}-slim-bookworm AS runtime

ARG VERSION=0.1.0
ARG REVISION=unknown
ARG CREATED=unknown

LABEL org.opencontainers.image.title="openslide-stardist-viewer" \
  org.opencontainers.image.description="OpenSlide tile streaming and StarDist nuclei segmentation API" \
  org.opencontainers.image.source="https://github.com/baditaflorin/openslide-stardist-viewer" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.version="${VERSION}" \
  org.opencontainers.image.revision="${REVISION}" \
  org.opencontainers.image.created="${CREATED}"

ENV PATH="/venv/bin:${PATH}" \
  PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  SLIDE_VIEWER_HOST=0.0.0.0 \
  SLIDE_VIEWER_PORT=8080 \
  SLIDE_VIEWER_SLIDE_DIR=/data/slides \
  SLIDE_VIEWER_RESULT_DIR=/data/results

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl libopenslide0 openslide-tools libglib2.0-0 libgomp1 \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --create-home --uid 10001 --shell /usr/sbin/nologin appuser \
  && mkdir -p /app /data/slides /data/results \
  && chown -R appuser:appuser /app /data

COPY --from=builder /venv /venv
COPY backend/app /app/app

WORKDIR /app
USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=3).read()"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

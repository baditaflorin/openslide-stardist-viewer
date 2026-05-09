# Phase 2 State Taxonomy

## Backend Connection

- `checking`: health request in flight. Exit: success or offline.
- `ready`: backend answered `/healthz`. Exit: refresh, backend loss.
- `offline`: backend unavailable. Exit: edit backend URL or reconnect.

## Slide Scan

- `scan-loading`: `/api/slides` request in flight. Exit: loaded or request error.
- `loaded-empty`: no usable slides and no problems. Exit: add slides, refresh.
- `loaded-some`: usable slides exist. Exit: select slide, refresh.
- `loaded-with-problems`: usable slides plus problem files. Exit: repair files, refresh.
- `loaded-problems-only`: no usable slides, but problem files exist. Exit: follow issue next steps, refresh.
- `error-recoverable`: API request failed. Exit: reconnect backend, refresh.

## Viewer

- `no-slide`: no selected slide. Exit: select slide or repair scan problems.
- `slide-opening`: OpenSeadragon tile source opening. Exit: loaded or tile error.
- `slide-loaded`: tiles can be requested. Exit: pan, zoom, segment viewport.
- `tile-error`: tile request failed. Exit: refresh slide, check backend.

## Segmentation

- `idle-no-result`: no segmentation result yet. Exit: segment viewport.
- `in-progress`: request in flight. Exit: success, failure, or cancel.
- `cancelled`: frontend request aborted and prior result preserved. Exit: segment again.
- `success-high-confidence`: result suitable for trust within v1 limits.
- `success-low-confidence`: result returned with warnings and should not be treated as authoritative.
- `error-recoverable`: invalid region, backend failure, or unsupported slide state. Exit: change viewport or retry.

## Debug

- `debug-off`: normal UI.
- `debug-on`: `?debug=1` shows scan and latest segmentation JSON. Exit: remove query parameter.

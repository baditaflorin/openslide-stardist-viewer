# Privacy

OpenSlide StarDist Viewer has no client analytics in v1.

The GitHub Pages frontend stores only non-sensitive preferences in browser `localStorage`:

- backend URL
- selected slide ID
- max nuclei setting

The frontend does not automatically store slide pixels, segmentation results, API keys, credentials, or personal data.

When you explicitly use export, copy, print, share link, or save session controls, the browser produces the requested artifact locally. Session JSON and share links contain only the backend URL, selected slide ID, max nuclei setting, app version, commit, and export timestamp. Segmentation JSON/CSV exports contain the selected result and provenance.

Slide files remain on the backend host under the configured slide directory. Do not expose the backend publicly unless you understand the data sensitivity and have configured TLS, CORS, and access controls appropriate for your environment.

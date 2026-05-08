# Privacy

OpenSlide StarDist Viewer has no client analytics in v1.

The GitHub Pages frontend stores only non-sensitive preferences in browser `localStorage`:

- backend URL
- selected slide ID

The frontend does not store slide pixels, segmentation results, API keys, credentials, or personal data.

Slide files remain on the backend host under the configured slide directory. Do not expose the backend publicly unless you understand the data sensitivity and have configured TLS, CORS, and access controls appropriate for your environment.

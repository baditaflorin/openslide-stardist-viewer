# Contributing

Thanks for improving OpenSlide StarDist Viewer.

## Local Workflow

1. Install Node.js 22+, Python 3.11+, Docker, gitleaks, and lefthook-compatible shell tooling.
2. Run `make install-hooks`.
3. Run `make lint`, `make test`, `make build`, and `make smoke` before pushing.
4. Use Conventional Commits such as `feat: add slide tile endpoint`.

Do not commit secrets, private slide data, credentials, or generated runtime outputs.

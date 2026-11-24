# .github/workflows/ — CI & release automation

See [../../AGENTS.md](../../AGENTS.md) for repo-wide context. These are GitHub Actions config files, not documentation — treat edits here as code changes.

## Layout
- `ci_branch.yaml` — push to any branch and pull requests: reusable `part_node_build.yaml` + `part_docker_build.yaml` + `part_docker_test.yaml`.
- `ci.yaml` — tag pushes: the same build/test, plus `part_docker_push_artifact.yaml` to publish the image as `dachrisch/sproutlings:<tag>` and `:latest` on Docker Hub.
- `part_*.yaml` — reusable `workflow_call` building blocks (node build/lint/test, Docker build, Docker test, Docker push), wired in with `secrets: inherit` where needed.
- `release-please.yaml` — runs on `master`, opens/updates the release PR from conventional commits.
- `release-please-automerge.yaml` — on `pull_request_target`, auto-merges the release PR once it carries the `autorelease: pending` label.

## Rules
- Keep the `part_*` reusable workflows as the single source of CI steps; wire them from `ci.yaml` / `ci_branch.yaml` rather than duplicating steps.
- Node jobs use `node-version: 26.x` and run the `package.json` scripts (`npm run lint`, `npm run build`, `npm run test`).
- Releases are cut by release-please from `master`; do not push to `master` directly or create tags manually.
- Preserve the least-privilege `permissions` blocks and the action pinning/style used by existing workflows.

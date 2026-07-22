# TODO

## Remaining CI/CD infrastructure work

Tasks 1-3 of the CI/CD infrastructure plan are merged: lint/test harness (oxlint +
vitest), Docker image (nginx serving the static build), and the branch CI pipeline
(build/lint/test + Docker build/health-test) — verified green on GitHub Actions.

Remaining:

- [ ] Task 4: Tag-triggered release pipeline (`part_docker_push_artifact.yaml`,
      `ci.yaml`) — pushes the Docker image to Docker Hub on tag push.
- [ ] Task 5: Renovate config (`renovate.json`) — dependency automation with
      fix-type automerge.
- [ ] Task 6: Release-please workflows (`release-please.yaml`,
      `release-please-automerge.yaml`) — versioned releases with generated
      changelogs.
- [ ] Task 7: Documentation + manual-prerequisites handoff (update
      `CLAUDE.md`/`AGENTS.md`, plus a checklist of GitHub/Docker Hub setup steps
      needed before the release pipeline can run for real).

Full task specs (exact file contents, commands, expected output):
`docs/superpowers/plans/2026-07-22-ci-cd-infrastructure.md`

Design rationale: `docs/superpowers/specs/2026-07-22-ci-cd-infrastructure-design.md`

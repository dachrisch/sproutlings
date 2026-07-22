# CI/CD & Release Infrastructure — Design

Date: 2026-07-22
Status: Approved

## Purpose

Sproutlings has no test/lint/CI setup and no path to a deployable artifact. This adds:
renovate-driven dependency updates, GitHub Actions CI, automated releases with release
notes via release-please, and a Docker image as the final deployable artifact (the user
deploys it to their own server manually — no CD/deploy step is in scope).

## Reference

Pattern is copied from two sibling projects that already run this exact pipeline in
production, adapted for the fact that sproutlings has **no backend** (pure static SPA +
localStorage, per `docs/sproutlings-spec.md` §2–3):

- `/home/cda/dev/playground/energy.consumption`
- `/home/cda/dev/groceries-order-tracking`

Both reference repos serve their build output through a small Node/Express
`dist-server`, because both have a real API + database behind their frontend. Sproutlings
has neither, so it forks the pattern at exactly one point: **serving**.

## 1. Docker image — nginx, not a Node server

Multi-stage build:

```dockerfile
# Build stage
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
```

`nginx.conf` (SPA fallback, same shape as the unused one already sitting in
`energy.consumption`):

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

No `.npmrc` is copied (sproutlings' current deps resolve cleanly with plain `npm ci`;
the reference repos' `legacy-peer-deps=true` is not needed here). No `healthcheck.js`,
no `ENV PORT`/app secrets — there is nothing to configure at runtime. This makes the
final image just static files behind nginx, smaller and simpler than the reference
repos' Node-serving image.

## 2. CI pipelines

Same reusable-workflow split as both reference repos:

- **`ci_branch.yaml`** — triggers on push to any branch and on PRs. Runs
  `part_node_build` (install, lint, build, test) and `part_docker_build` (build the
  image, upload as an artifact), then `part_docker_test` (load the artifact, run it,
  wait for the container to report `healthy`). Does **not** push anywhere.
- **`ci.yaml`** — triggers on tag push (tags are created by release-please). Runs the
  same build/test/docker-test sequence, then `part_docker_push_artifact` to push to
  Docker Hub.
- **`part_node_build.yaml`** — reusable: checkout, `actions/setup-node@v6` (node 24.x,
  npm cache), `npm ci`, `npm run lint`, `npm run build`, `npm run test -- --reporter=default --reporter=junit`
  (matches groceries' current approach — vitest's built-in junit reporter, no extra
  annotate action needed).
- **`part_docker_build.yaml`** — reusable: `docker/build-push-action` builds the image,
  outputs it to a tarball, uploads as a workflow artifact (`actions/upload-artifact`).
  No `VITE_BUILD_VERSION` build-arg — sproutlings has no runtime use for an embedded
  version string, so this input is dropped rather than carried over unused.
- **`part_docker_test.yaml`** — reusable, simplified vs. both reference repos: no
  service containers (no DB), no env vars to inject — just load the artifact, `docker
  run` it, poll `docker inspect` until `Health.Status == healthy` (or fail after 10
  tries), stop the container.
- **`part_docker_push_artifact.yaml`** — reusable, copied essentially verbatim: load the
  artifact, log into `docker.io` with `secrets.DOCKER_TOKEN`, tag and push
  `dachrisch/sproutlings:<tag>` and `:latest`.

## 3. Release automation (release-please)

- **`release-please.yaml`** — on push to `master`: run `googleapis/release-please-action@v5`
  with `release-type: node` (versioning comes from `package.json`) using
  `secrets.RELEASE_PLEASE_TOKEN` (a PAT, not the default `GITHUB_TOKEN` — required so the
  release PR it opens/merges can trigger *other* workflows, which `GITHUB_TOKEN`-authored
  events cannot).
- **`release-please-automerge.yaml`** — on PR opened/synchronized/labeled: if the PR
  carries label `autorelease: pending`, auto-merge it via `gh pr merge --auto --merge`
  using the same PAT.
- Net effect once wired up: conventional-commit pushes to `master` accumulate in a
  standing release PR with an auto-generated `CHANGELOG.md`; merging that PR (by hand,
  or automatically per below) tags a version, which fires `ci.yaml` to build, test, and
  publish the Docker image. This *is* "release notes" — GitHub Releases + CHANGELOG.md
  entries generated from commit messages, no separate release-notes step needed.

## 4. Renovate

Copy `renovate.json` from the reference repos, dropping the Python-specific rule (no
`pyproject.toml` in this repo):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "lockFileMaintenance": {
    "enabled": true,
    "automerge": true,
    "semanticCommitType": "fix"
  },
  "packageRules": [
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true,
      "semanticCommitType": "fix"
    },
    {
      "matchUpdateTypes": ["patch"],
      "matchCurrentVersion": "!/^0/",
      "automerge": true,
      "semanticCommitType": "fix"
    },
    {
      "matchUpdateTypes": ["minor"],
      "matchCurrentVersion": "!/^0/",
      "automerge": true,
      "semanticCommitType": "fix"
    }
  ]
}
```

`semanticCommitType: "fix"` is the load-bearing detail here (confirmed by
`RELEASE_HISTORY.md` in groceries-order-tracking): release-please only version-bumps on
`fix:`/`feat:` commits, not `chore:`. Using `fix:` for dependency bumps is what makes
"Renovate merges an update" cascade automatically into "a new release gets cut" — a
zero-touch pipeline, not just automated PRs that still need a human to trigger a release.

## 5. Test / lint harness

Harness only — no test files are added in this task (Phase 1 game logic doesn't exist
yet; tests get written alongside features via TDD per the project's existing workflow).

- Add devDependencies: `oxlint`, `vitest`, `jsdom`.
- `.oxlintrc.json` (browser env — sproutlings is a client-only app, no `dist-server` to
  ignore):
  ```json
  {
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "categories": { "correctness": "error" },
    "rules": {
      "typescript/no-explicit-any": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
    },
    "env": { "browser": true, "node": true },
    "ignorePatterns": ["dist/**"]
  }
  ```
- `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      environment: 'jsdom',
      passWithNoTests: true,
      reporters: ['default', 'junit'],
      outputFile: { junit: 'test-results/junit.xml' },
    },
  });
  ```
- `package.json` scripts: add `"lint": "oxlint ."` and `"test": "vitest run"`.

## 6. Manual prerequisites (outside this task — the user must do these)

These require access this task cannot reach (GitHub repo settings, Docker Hub account):

1. Add repository secrets to `dachrisch/sproutlings` on GitHub: `DOCKER_TOKEN` (Docker
   Hub access token) and `RELEASE_PLEASE_TOKEN` (a PAT with `repo` scope) — unless
   already provided at the org/account level the way they apparently are for the two
   reference repos.
2. Confirm or create the `dachrisch/sproutlings` repository on Docker Hub.
3. Confirm the Renovate GitHub App is enabled for this repo (vs. self-hosted Renovate).

## Out of scope

- Any deploy/CD step that pushes the image to the user's server — the user deploys the
  published image themselves.
- Writing actual unit/component tests — deferred to Phase 1 feature work.
- A `RELEASE_HISTORY.md`-style meta-document about the release process itself — the
  reference repos have one, but it's optional narrative documentation, not required
  infrastructure, and wasn't requested here.

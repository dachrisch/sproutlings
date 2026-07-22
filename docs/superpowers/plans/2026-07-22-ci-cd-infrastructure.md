# CI/CD & Release Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give sproutlings renovate-driven dependency updates, GitHub Actions CI (build/lint/test + Docker build/health-test), release-please-driven versioned releases with generated changelogs, and a Docker image (nginx serving the static build) as the deployable artifact.

**Architecture:** Copy the reusable-workflow CI/CD pattern already running in production in two sibling repos (`energy.consumption`, `groceries-order-tracking`), forked at exactly one point: sproutlings has no backend, so the Docker image serves `dist/` via `nginx:alpine` instead of a Node/Express `dist-server`. Everything else (workflow split, release-please, renovate semantics) is copied as-is.

**Tech Stack:** GitHub Actions, Docker (`node:24-alpine` build stage → `nginx:alpine` runtime stage), oxlint, vitest + jsdom, release-please, Renovate.

## Global Constraints

- Docker registry is Docker Hub (`docker.io`), image path `dachrisch/sproutlings` — copied verbatim from both reference repos' convention.
- `release-please` uses `release-type: node` (versioning from `package.json`) and a PAT (`secrets.RELEASE_PLEASE_TOKEN`), never the default `GITHUB_TOKEN` — required so the release PR can trigger other workflows.
- Renovate's `semanticCommitType` must be `"fix"` (not the Renovate default `"chore"`) — this is what makes dependency-update commits count toward a release-please version bump. Without this, updates would merge but never cut a release.
- No CD/deploy step to the user's server is in scope — the pipeline's last step is pushing the image to Docker Hub.
- No test files are added — Phase 1 game logic doesn't exist yet; only the lint/test harness is wired up.
- This environment has no local Docker daemon (`docker: MISSING`) and no `actionlint` — Docker/workflow verification for Tasks 2–4 happens by pushing to a branch and watching the real GitHub Actions run via `gh` (already authenticated as `dachrisch`), not locally.
- All work happens on a feature branch (not directly on `master`) — create it before Task 1 (`git checkout -b ci-cd-infrastructure`) — since pushing straight to `master` would immediately arm `release-please.yaml` (Task 6) before the pipeline is proven out. Land the branch via the `superpowers:finishing-a-development-branch` skill after Task 7.
- Source spec: `docs/superpowers/specs/2026-07-22-ci-cd-infrastructure-design.md` — re-read it if a task here seems to conflict with it; the spec wins.

---

### Task 1: Lint & test harness

**Files:**
- Modify: `package.json` (add devDependencies, add `lint`/`test` scripts)
- Create: `.oxlintrc.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm run lint` (runs `oxlint .`, exit 0 on a clean tree) and `npm run test` (runs `vitest run`, exit 0 with zero test files thanks to `passWithNoTests`). Task 3's `part_node_build.yaml` calls both by name — they must exist under exactly these script names.

- [ ] **Step 1: Install the new devDependencies**

Run:
```bash
npm install -D oxlint vitest jsdom
```
Expected: `package.json`'s `devDependencies` gains `oxlint`, `vitest`, `jsdom`; `package-lock.json` updates; exit code 0.

- [ ] **Step 2: Add the oxlint config**

Create `.oxlintrc.json`:
```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error"
  },
  "rules": {
    "typescript/no-explicit-any": "error",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
  },
  "env": {
    "browser": true,
    "node": true
  },
  "ignorePatterns": ["dist/**"]
}
```

- [ ] **Step 3: Add the vitest config**

Create `vitest.config.ts`:
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

- [ ] **Step 4: Add `lint` and `test` scripts**

In `package.json`, add to `"scripts"` (keep existing `dev`/`build`/`preview` as-is):
```json
"lint": "oxlint .",
"test": "vitest run"
```

- [ ] **Step 5: Run lint and verify it passes**

Run: `npm run lint`
Expected: exit code 0 (oxlint found this tree clean during a dry-run check — no errors, no warnings printed).

- [ ] **Step 6: Run tests and verify the empty suite passes**

Run: `npm run test`
Expected: exit code 0, vitest reports passing via `passWithNoTests` (no test files exist yet), `test-results/junit.xml` is written.

- [ ] **Step 7: Ignore test/build output in git**

Check `.gitignore` already ignores `dist/`, `node_modules/`; add `test-results/` if not already present.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .oxlintrc.json vitest.config.ts .gitignore
git commit -m "chore: add oxlint and vitest harness"
```

---

### Task 2: Docker image (nginx serving)

**Files:**
- Create: `Dockerfile`
- Create: `nginx.conf`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: `npm run build` (from the existing `package.json`, produces `dist/`) — unchanged by Task 1.
- Produces: an image buildable as `docker build -t sproutlings:latest .` that serves `dist/` on port 80 and reports Docker `HEALTHCHECK` status. Task 3's `part_docker_build.yaml` call passes `dockerfile: Dockerfile`, `image_name: sproutlings` — the file must be named exactly `Dockerfile` at repo root.

- [ ] **Step 1: Add `.dockerignore`**

Create `.dockerignore`:
```
node_modules
dist
.git
docs
*.md
```

- [ ] **Step 2: Add `nginx.conf`**

Create `nginx.conf`:
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

- [ ] **Step 3: Add the Dockerfile**

Create `Dockerfile`:
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

- [ ] **Step 4: Local sanity check (no Docker daemon here — verify what's checkable)**

This environment has no local Docker (confirmed: `docker: MISSING`), so the build itself can't be run here. Verify what's checkable without Docker:
```bash
npm run build && ls dist/index.html
```
Expected: `dist/index.html` exists (proves the build stage's `npm run build` step will succeed). Full image build + health-check verification happens for real in Task 3, when this Dockerfile is exercised by GitHub Actions.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile nginx.conf .dockerignore
git commit -m "feat: add Docker image (nginx serving static build)"
```

---

### Task 3: Branch CI pipeline (build, lint, test, Docker build + health-test)

**Files:**
- Create: `.github/workflows/part_node_build.yaml`
- Create: `.github/workflows/part_docker_build.yaml`
- Create: `.github/workflows/part_docker_test.yaml`
- Create: `.github/workflows/ci_branch.yaml`

**Interfaces:**
- Consumes: `npm run lint` / `npm run test` (Task 1), `Dockerfile` (Task 2, referenced by exact filename).
- Produces: reusable workflows `part_node_build.yaml`, `part_docker_build.yaml`, `part_docker_test.yaml` — Task 4's `ci.yaml` calls all three by these exact paths, plus a fourth (`part_docker_push_artifact.yaml`, added in Task 4). Also produces the `docker-image` job's `outputs.artifact_name` output, consumed by the `image-test` job here and reused identically in Task 4.

- [ ] **Step 1: Add `part_node_build.yaml`**

Create `.github/workflows/part_node_build.yaml`:
```yaml
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json

name: 🟢🏗️🧪📊 Build & run node tests

on:
  workflow_call:
    inputs:
      project:
        required: true
        description: The project to build
        type: string

permissions:
  checks: write

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ${{ inputs.project }}
    steps:
      - uses: actions/checkout@v7
      - name: 🟢⚙️ Setup node
        uses: actions/setup-node@v6
        with:
          node-version: "24.x"
          cache: "npm"
          cache-dependency-path: ${{ inputs.project }}/package.json
      - name: 🔍 Run oxlint ${{ inputs.project }}
        run: |
          npm ci
          npm run lint
      - name: 👷 Building ${{ inputs.project }}
        run: npm run build > typescript.log
      - name: 🔍📝 Annotate Code Linting Results
        uses: DerLev/eslint-annotations@v2
        with:
          typescript-log: ${{ inputs.project }}/typescript.log
      - name: 🧪 Run vitest
        run: |
          npm run test -- --reporter=default --reporter=junit
```

- [ ] **Step 2: Add `part_docker_build.yaml`**

Create `.github/workflows/part_docker_build.yaml`:
```yaml
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json

name: 🐳🏗️ Build Docker Image

on:
  workflow_call:
    inputs:
      dockerfile:
        required: false
        description: The Dockerfile used to build the image
        type: string
        default: Dockerfile
      image_name:
        required: true
        description: The local name to use for the image
        type: string
    outputs:
      artifact_name:
        description: "Name of the uploaded artifact containing the Docker image"
        value: ${{ jobs.build.outputs.artifact_name }}

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact_name: ${{ steps.set-artifact-name.outputs.artifact_name }}
    steps:
      - uses: actions/checkout@v7

      - name: 🐳🛠️ Setup Docker buildx
        uses: docker/setup-buildx-action@v4

      - name: 🐳🏗️ Build Docker image
        uses: docker/build-push-action@v7
        with:
          file: ${{ inputs.dockerfile }}
          tags: ${{ inputs.image_name }}:latest
          outputs: type=docker,dest=/tmp/${{ inputs.image_name }}.tar
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: 📤 Upload Docker image as artifact
        uses: actions/upload-artifact@v7
        with:
          name: docker-image-${{ inputs.image_name }}
          path: /tmp/${{ inputs.image_name }}.tar
          retention-days: 1

      - name: 🏷️ Set artifact name output
        id: set-artifact-name
        run: echo "artifact_name=docker-image-${{ inputs.image_name }}" >> $GITHUB_OUTPUT
```

- [ ] **Step 3: Add `part_docker_test.yaml`**

Create `.github/workflows/part_docker_test.yaml` (no service containers/env vars — sproutlings has no DB or app secrets to configure):
```yaml
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json

name: 🐳🧪 Test Docker Image

on:
  workflow_call:
    inputs:
      artifact_name:
        required: true
        description: The name of the artifact containing the Docker image
        type: string
      image_name:
        required: true
        description: The local name of the Docker image
        type: string

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Download Docker image artifact
        uses: actions/download-artifact@v8
        with:
          name: ${{ inputs.artifact_name }}
          path: /tmp

      - name: 🐳 Load Docker image
        run: |
          docker load --input /tmp/${{ inputs.image_name }}.tar
          docker image ls -a

      - name: 🐳🧪 Test Docker image
        run: |
          docker run --rm --detach --name test_container ${{ inputs.image_name }}:latest
          for i in {1..10}; do
            status=$(docker inspect --format='{{.State.Health.Status}}' test_container)
            health_details=$(docker inspect --format='{{json .State.Health}}' test_container)
            echo "Health status: $status"
            echo "Health details: $health_details"
            if [ "$status" = "healthy" ]; then break; fi
            sleep 6
          done
          if [ "$status" != "healthy" ]; then
            echo "Container did not become healthy after 10 attempts."
            docker logs test_container
            exit 1
          fi
          docker stop test_container
```

- [ ] **Step 4: Add `ci_branch.yaml`**

Create `.github/workflows/ci_branch.yaml`:
```yaml
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json

name: 🏗️🧪🍂 Build & Test branches
on:
  push:
    branches:
      - "*"
    tags-ignore:
      - "*"
  pull_request:
    branches:
      - "*"

permissions:
  contents: write
  checks: write
  security-events: write

jobs:
  node-project:
    uses: ./.github/workflows/part_node_build.yaml
    secrets: inherit
    with:
      project: .

  docker-image:
    uses: ./.github/workflows/part_docker_build.yaml
    with:
      dockerfile: Dockerfile
      image_name: sproutlings

  image-test:
    needs:
      - node-project
      - docker-image
    uses: ./.github/workflows/part_docker_test.yaml
    with:
      artifact_name: ${{ needs.docker-image.outputs.artifact_name }}
      image_name: sproutlings
```

- [ ] **Step 5: Validate YAML syntax locally**

Run:
```bash
for f in .github/workflows/part_node_build.yaml .github/workflows/part_docker_build.yaml .github/workflows/part_docker_test.yaml .github/workflows/ci_branch.yaml; do
  python3 -c "import yaml, sys; yaml.safe_load(open(sys.argv[1])); print('OK', sys.argv[1])" "$f"
done
```
Expected: `OK <path>` printed four times, no exceptions.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/part_node_build.yaml .github/workflows/part_docker_build.yaml .github/workflows/part_docker_test.yaml .github/workflows/ci_branch.yaml
git commit -m "ci: add branch build/lint/test + Docker build/health-test pipeline"
```

- [ ] **Step 7: Push the branch and verify the real CI run is green**

Run:
```bash
git push -u origin ci-cd-infrastructure
gh run watch $(gh run list --branch ci-cd-infrastructure --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```
Expected: the watched run completes with all three jobs (`node-project`, `docker-image`, `image-test`) succeeding — exit status 0. This is the real end-to-end proof that Task 1's harness, Task 2's Dockerfile, and this task's workflows all work together, since there's no local Docker to check it any other way. If `image-test` fails, read the job's "Test Docker image" step logs (`docker logs test_container`) — the most likely cause is the `HEALTHCHECK` in the Dockerfile not matching how nginx actually serves `/` (e.g. missing `wget` in the base image, or the container needing longer than `--start-period=5s` to come up).

---

### Task 4: Tag-triggered release pipeline (Docker push to Docker Hub)

**Files:**
- Create: `.github/workflows/part_docker_push_artifact.yaml`
- Create: `.github/workflows/ci.yaml`

**Interfaces:**
- Consumes: `part_node_build.yaml`, `part_docker_build.yaml`, `part_docker_test.yaml` (Task 3, same call signatures).
- Produces: the tag-triggered pipeline that release-please's tags (Task 6) fire.

- [ ] **Step 1: Add `part_docker_push_artifact.yaml`**

Create `.github/workflows/part_docker_push_artifact.yaml`:
```yaml
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json

name: 🐳🚀 Push Docker Image to Registry

on:
  workflow_call:
    inputs:
      artifact_name:
        required: true
        description: The name of the artifact containing the Docker image
        type: string
      image_name:
        required: true
        description: The name/path of the Docker image in the registry (e.g., dachrisch/sproutlings)
        type: string
      local_image_name:
        required: true
        description: The local name of the Docker image (used when loading from tar)
        type: string
      version:
        required: false
        default: latest
        description: The version tag to use when pushing
        type: string
    secrets:
      DOCKER_TOKEN:
        required: true
        description: Docker Hub token for authentication

permissions:
  contents: read

env:
  REGISTRY: docker.io

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: 📥 Download Docker image artifact
        uses: actions/download-artifact@v8
        with:
          name: ${{ inputs.artifact_name }}
          path: /tmp

      - name: 🐳 Load Docker image
        run: |
          docker load --input /tmp/${{ inputs.local_image_name }}.tar
          docker image ls -a

      - name: 🐳🛠️ Setup Docker buildx
        uses: docker/setup-buildx-action@v4

      - name: 🔐📦 Log into registry ${{ env.REGISTRY }}
        uses: docker/login-action@v4
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: 🐳🏷️ Tag Docker image
        run: |
          docker tag ${{ inputs.local_image_name }}:latest ${{ env.REGISTRY }}/${{ inputs.image_name }}:${{ inputs.version }}
          docker tag ${{ inputs.local_image_name }}:latest ${{ env.REGISTRY }}/${{ inputs.image_name }}:latest

      - name: 🐳🚀 Push Docker image
        run: |
          docker push ${{ env.REGISTRY }}/${{ inputs.image_name }}:${{ inputs.version }}
          docker push ${{ env.REGISTRY }}/${{ inputs.image_name }}:latest
```

- [ ] **Step 2: Add `ci.yaml`**

Create `.github/workflows/ci.yaml`:
```yaml
# yaml-language-server: $schema=https://json.schemastore.org/github-workflow.json

name: 🏗️🧪🚀 Build, Test and Deploy everything

on:
  push:
    tags:
      - "*"

permissions:
  contents: write
  checks: write
  security-events: write

concurrency:
  group: build-test-deploy
  cancel-in-progress: true

jobs:
  node-project:
    uses: ./.github/workflows/part_node_build.yaml
    secrets: inherit
    with:
      project: .

  docker-image:
    uses: ./.github/workflows/part_docker_build.yaml
    with:
      dockerfile: Dockerfile
      image_name: sproutlings

  image-test:
    needs:
      - node-project
      - docker-image
    uses: ./.github/workflows/part_docker_test.yaml
    with:
      artifact_name: ${{ needs.docker-image.outputs.artifact_name }}
      image_name: sproutlings

  image-push:
    needs:
      - docker-image
      - image-test
    secrets: inherit
    uses: ./.github/workflows/part_docker_push_artifact.yaml
    with:
      artifact_name: ${{ needs.docker-image.outputs.artifact_name }}
      image_name: dachrisch/sproutlings
      local_image_name: sproutlings
      version: "${{ github.ref_name }}"
```

- [ ] **Step 3: Validate YAML syntax locally**

Run:
```bash
for f in .github/workflows/part_docker_push_artifact.yaml .github/workflows/ci.yaml; do
  python3 -c "import yaml, sys; yaml.safe_load(open(sys.argv[1])); print('OK', sys.argv[1])" "$f"
done
```
Expected: `OK <path>` printed twice, no exceptions.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/part_docker_push_artifact.yaml .github/workflows/ci.yaml
git commit -m "ci: add tag-triggered pipeline that pushes the image to Docker Hub"
```

Note: this job needs `secrets.DOCKER_TOKEN` on the repo to actually succeed — it cannot be exercised end-to-end until that secret exists (tracked in Task 7's manual-prerequisites checklist) and a real tag is pushed (which normally happens via release-please in Task 6, not manually).

---

### Task 5: Renovate config

**Files:**
- Create: `renovate.json`

**Interfaces:**
- None — standalone config file, no interaction with other tasks' code. Its effect (auto-merged dependency PRs using `fix:` commits) only becomes externally observable once the Renovate GitHub App is enabled on the repo (a manual prerequisite, tracked in Task 7).

- [ ] **Step 1: Add `renovate.json`**

Create `renovate.json`:
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended"
  ],
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

- [ ] **Step 2: Validate JSON syntax**

Run:
```bash
python3 -c "import json; json.load(open('renovate.json')); print('OK')"
```
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add renovate.json
git commit -m "chore: add renovate config with fix-type automerge"
```

---

### Task 6: Release-please workflows

**Files:**
- Create: `.github/workflows/release-please.yaml`
- Create: `.github/workflows/release-please-automerge.yaml`

**Interfaces:**
- Produces: the tag pushes that Task 4's `ci.yaml` reacts to. Requires `secrets.RELEASE_PLEASE_TOKEN` to exist on the repo (tracked in Task 7) — without it, `release-please.yaml` runs but the release PR it opens can't trigger `release-please-automerge.yaml` or, once merged, `ci.yaml`.

- [ ] **Step 1: Add `release-please.yaml`**

Create `.github/workflows/release-please.yaml`:
```yaml
name: release-please

on:
  push:
    branches:
      - master

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v5
        id: release
        with:
          release-type: node
          token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
```

- [ ] **Step 2: Add `release-please-automerge.yaml`**

Create `.github/workflows/release-please-automerge.yaml`:
```yaml
name: Release Please Automerge

on:
  pull_request_target:
    types:
      - opened
      - synchronized
      - labeled

permissions:
  contents: write
  pull-requests: write

jobs:
  automerge:
    runs-on: ubuntu-latest
    if: "${{ contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}"
    steps:
      - name: Automerge Release PR
        env:
          GH_TOKEN: ${{ secrets.RELEASE_PLEASE_TOKEN }}
          PR_URL: ${{ github.event.pull_request.html_url }}
        run: |
          gh pr merge "$PR_URL" --auto --merge
```

- [ ] **Step 3: Validate YAML syntax locally**

Run:
```bash
for f in .github/workflows/release-please.yaml .github/workflows/release-please-automerge.yaml; do
  python3 -c "import yaml, sys; yaml.safe_load(open(sys.argv[1])); print('OK', sys.argv[1])" "$f"
done
```
Expected: `OK <path>` printed twice, no exceptions.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release-please.yaml .github/workflows/release-please-automerge.yaml
git commit -m "ci: add release-please automation for versioned releases"
```

Note: this can't be exercised end-to-end until `master` receives the branch (this plan's final merge) and `secrets.RELEASE_PLEASE_TOKEN` exists — tracked in Task 7.

---

### Task 7: Documentation + manual-prerequisites handoff

**Files:**
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the `lint`/`test` scripts (Task 1), the Docker/CI setup (Tasks 2–4), renovate (Task 5), release-please (Task 6) — this task only documents them, no new behavior.

- [ ] **Step 1: Update `CLAUDE.md`'s Commands section**

In `CLAUDE.md`, under `## Commands`, add after the existing `npm run preview` line:
```markdown
- `npm run lint` — run oxlint
- `npm run test` — run vitest (no test files yet; passes via `passWithNoTests`)
```
Replace the line "There is no test suite or linter configured yet." — delete it, since it's no longer true.

- [ ] **Step 2: Add a Deployment section to `CLAUDE.md`**

Append a new section after `## Reference docs`:
```markdown
## CI/CD

Pushing any branch runs `.github/workflows/ci_branch.yaml`: node build/lint/test, then a Docker image build (nginx serving `dist/`), then a container health-check test. Pushing a tag (done by release-please, not manually) runs `.github/workflows/ci.yaml`, which additionally pushes the image to Docker Hub as `dachrisch/sproutlings:<tag>` and `:latest`. Versioned releases with changelogs are cut by `release-please` off conventional-commit messages on `master`; Renovate dependency bumps use `fix:` commits so they cascade into real releases automatically. See `docs/superpowers/specs/2026-07-22-ci-cd-infrastructure-design.md` for the full design rationale.
```

- [ ] **Step 3: Mirror the same two changes into `AGENTS.md`**

`AGENTS.md` mirrors `CLAUDE.md` per its own existing convention. Update its `## Build` section to add the `lint`/`test` commands, and add a `## CI/CD` section with the same content as Step 2.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs: document lint/test commands and CI/CD pipeline"
```

- [ ] **Step 5: Hand off remaining manual steps to the user**

These cannot be done from this environment (no access to GitHub repo settings or Docker Hub account). Report to the user, verbatim as a checklist, before finishing the branch:
- [ ] Add repository secret `DOCKER_TOKEN` (Docker Hub access token) to `dachrisch/sproutlings` on GitHub, unless already set at the org level.
- [ ] Add repository secret `RELEASE_PLEASE_TOKEN` (a GitHub PAT with `repo` scope) to `dachrisch/sproutlings`, unless already set at the org level.
- [ ] Confirm or create the `dachrisch/sproutlings` repository on Docker Hub.
- [ ] Confirm the Renovate GitHub App is enabled for this repo.
- [ ] After those are done, merging this branch to `master` arms `release-please.yaml` for real — the first conventional-commit push to `master` after merge will open a release PR.

- [ ] **Step 6: Finish the branch**

Use the `superpowers:finishing-a-development-branch` skill to decide how `ci-cd-infrastructure` lands (PR vs. direct merge, etc.) — do not merge or push to `master` outside that skill's flow.

---

## Self-Review Notes

- **Spec coverage:** all six numbered sections of the design spec map to a task — §1 Docker → Task 2, §2 CI pipelines → Tasks 3–4, §3 release-please → Task 6, §4 Renovate → Task 5, §5 test/lint harness → Task 1, §6 manual prerequisites → Task 7 Step 5. Out-of-scope items (deploy-to-server step, real tests, `RELEASE_HISTORY.md`) are correctly absent from every task.
- **No placeholders:** every step has literal file contents or literal commands with a concrete expected result; no "TBD"/"add appropriate X" phrasing.
- **Type/name consistency:** `image_name: sproutlings` (local) vs. `image_name: dachrisch/sproutlings` (registry, in `part_docker_push_artifact.yaml`'s call from `ci.yaml`) is intentional — matches the reference repos' distinction between local tag and registry path, not a typo.

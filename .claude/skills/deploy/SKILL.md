---
name: deploy
description: Use when the user wants to ship jadsapp changes to production. Standard flow is commit → push to main+latest → watch the GHA build → run unraid-deploy → verify jads.app is healthy. Triggered by "ship", "deploy", "go live", "push to prod", or "commit and push" in this project.
compatibility: claude-code
---

# Deploy jadsapp to production

This is the standard, end-to-end flow for taking new work in `~/src/jadsapp` from local commit to running on https://jads.app.

## When to use this skill

Invoke when the user expresses intent to ship jadsapp changes. Common phrasings:
- "ship", "ship it", "deploy", "go live", "push to prod", "make it live"
- "commit and push" (in this project, push *is* a deploy)
- "deploy when green" (after a recent push)

Do not use for: local dev (`npm run serve`), blog content edits (use `node cli/blog-cli.js`), or db backups.

## Preconditions

- Working directory is `/Users/jads/src/jadsapp`
- `unraid-deploy` resolves on `$PATH` (lives in `~/src/unraid-tools`, symlinked to `~/.local/bin/`). If `which unraid-deploy` fails, halt and tell the user before doing anything.
- `gh` CLI is authenticated for `adlerj/jadsapp` (`gh auth status`), OR the `github` MCP server is loaded
- `.env.deploy` exists in the project root with `UNRAID_API_URL`, `UNRAID_API_KEY`, `UNRAID_CONTAINER=jadsapp`, `UNRAID_VERIFY_URL=https://jads.app/`
- User's machine is on the LAN that can reach jock.box (the Unraid host is LAN-only)

## The flow

Use TaskCreate to track the four phases below if shipping a non-trivial change.

### 1. Commit

Check what's actually changed: `git status --short` and `git diff --stat`. Stage only the files the user intended -- never use `git add -A` or `git add .` because they can pull in `.env` files, `blog.db*` artifacts, or build output.

Write a commit message that explains *why* the change exists, not what files changed. Pass it via HEREDOC and end with:

```
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### 2. Push to both branches

```bash
git push origin main && git push origin main:latest
```

The `latest` push triggers `.github/workflows/docker-hub-ci.yml`. Without it, the deploy will not happen.

### 3. Watch the workflow

Get the run ID for the new push and watch it:

```bash
gh run list --branch latest --limit 1 --json databaseId,status,conclusion,headSha
gh run watch <RUN_ID> --exit-status
```

The workflow takes ~3-5 minutes (multi-arch build for amd64 + arm64). If the github MCP is loaded, prefer its `wait_for_workflow_run` / `get_workflow_run` tools for cleaner streaming.

If the run fails: report the failure with the run URL, do **not** run unraid-deploy, do not auto-retry. Surface the failing step's logs (`gh run view <RUN_ID> --log-failed`) and ask the user how to proceed.

### 4. Deploy and verify

```bash
unraid-deploy deploy
```

This runs Unraid's `updateContainer` mutation (pulls the new tag from Docker Hub, recreates the container from the Unraid template) and then polls https://jads.app/ until it returns 2xx (90s timeout). The CLI auto-loads container + verify URL from `./.env.deploy`.

If the verify step fails:
- `unraid-deploy status` -- container state
- `unraid-deploy logs --tail 100` -- look for the boot error
- Do NOT roll back automatically. Report findings and ask the user.

### 5. Report

Two sentences. Include: commit SHA, GHA run URL, new container image (state + uptime from `unraid-deploy status`), final 2xx confirmation.

## Important constraints

- **Unraid is LAN-only.** Never propose a GHA step that calls jock.box. It will fail because runners can't reach the API. The orchestration must happen from the user's local machine.
- **Push pattern is non-negotiable.** Always push both `main` and `latest`. The CI trigger is `latest`.
- **Run `deploy`, not just `update`.** `deploy` includes the post-restart healthcheck. A successful image build does not prove the container boots.
- **Never commit secrets.** `.env`, `.env.deploy`, `.env.*.local`, and any token-containing file must stay gitignored. If the user pastes a secret in chat, do not write it into a tracked file.
- **No `--no-verify` on commits.** If a pre-commit hook fails, fix the issue and create a new commit.

## Related references

- `cli/blog-cli.js` -- separate tool for blog content updates (those hit the live API, not Unraid)
- `~/src/unraid-tools/README.md` -- full `unraid-deploy` reference
- `.github/workflows/docker-hub-ci.yml` -- the build workflow

---
name: run-local
description: Launch, seed, and verify The Music Repository locally, and troubleshoot the host-dev vs containerized clashes on :4321/:3000 (stale Vite / 504 Outdated Optimize Dep, redirect loops, missing seed content). Use when running or screenshotting the app to confirm a change, or when the local app misbehaves after switching between host dev and app:up.
---

# run-local

Two ways to run, which must **not** overlap on the same ports. Pick one; kill the other first.

## Modes

- **Host dev (fast iteration):** `pnpm infra:up` (Postgres only) then run apps on the host —
  `pnpm --filter @TheY2T/tmr-web dev` (web `:4321`, **IPv6-only** — use `http://[::1]:4321` or
  `localhost`) and `pnpm --filter @TheY2T/tmr-api dev` (api `:3000`). Add `pnpm obs:up` for traces.
- **Containerized (production-like):** `pnpm app:up` — builds images + runs infra + api + web via the
  `app` profile, and seeds. `pnpm app:down` to stop. `pnpm app:seed` if content is missing after a run.

`app:up`/`app:down` already `pkill` stray host `astro dev` / `apps/api/dist/main.js` — but a host dev
server you started separately will still fight the containers for `:4321`/`:3000`.

## Clean-slate checklist (do this before spinning up)

1. **Kill host procs** that hold the ports: `pkill -f 'astro.*dev'; pkill -f 'apps/api/dist/main.js'`.
   A stray `astro dev` serves **stale Vite output** and 504s — the #1 source of "my change isn't showing".
2. Choose one mode (host **or** `app:up`) — never both.
3. If islands fail to hydrate with **`504 Outdated Optimize Dep`** / `_jsxDEV is not a function` after
   adding a browser lib (alphatab/smplr/pixi): **restart the dev server** or `rm -rf
   apps/web/node_modules/.vite` so Vite re-optimizes. Pixi/alphatab 504 on first use self-heals on reload.

## Common failures

- **Every gated page bounces to `/signin`** even after sign-in → the web container is missing
  `API_INTERNAL_URL` (`http://api:3000`); inside the container `localhost:3000` is the web app itself.
  See `.claude/rules/web-features.md`.
- **Flag-gated routes 404 / feature missing** → flagd needs a restart after a new key
  (`docker compose -f infra/podman/compose.yaml restart flagd`), or infra isn't up. See **`manage-flags`**.
- **Catalogue/collections empty** → seed didn't run: `pnpm app:seed` (or the `*:build` step was skipped —
  see **`author-content`**).

## Verify a change end-to-end

Confirm the app is up (host web `:4321` / api `:3000`, or containers via `docker compose … ps`), then
drive the actual flow in a real browser (Playwright MCP) — don't claim "can't verify". Fine to
kill/restart services. Clean up screenshots + `.playwright-mcp/` afterwards.

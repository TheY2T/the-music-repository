# Runbook: Decommission Render (after the Hetzner cutover)

Retire the Render deployment once the app runs on the Hetzner box (ADR 0055). This is the **last** step
of the migration — Render is the rollback path until it's gone, so do nothing here until the gates below
are green.

> **Order:** stand up Hetzner → verify → cut Cloudflare DNS/tunnel over → **soak** → *then* this runbook.

## Do-not-proceed gates (all must be true)

- [ ] Hetzner is serving apex/`www`/`api` through the Cloudflare Tunnel and verified (health, catalogue
      search, media from R2, sign-in on the real domain).
- [ ] Cloudflare DNS for apex/`www`/`api` points at the **tunnel** (`<tunnel-id>.cfargotunnel.com`), not
      `*.onrender.com`. Confirm: `dig +short api.themusicrepository.com` resolves via Cloudflare, and the
      Render services show **no inbound traffic** for the soak window.
- [ ] It has **soaked ≥ 24–48 h** on Hetzner with no regressions.
- [ ] A **final Postgres dump from Render** is captured off-box (below) — the one piece of state that
      isn't reproducible from the repo/R2.

## 1. Capture a final Render Postgres dump (safety net)

From your machine, using Render's **external** connection string (Render dashboard → `tmr-db-dev` →
Connect → External):

```bash
pg_dump "<render-external-connection-string>" -Fc -f render-tmr-$(date +%Y%m%d).dump
# sanity: list it
pg_restore -l render-tmr-*.dump | head
```

Keep this dump somewhere durable. (Hetzner already has its own seeded data; this is purely a rollback
artifact of Render's live DB in case anything user-generated needs recovering.)

## 2. Reversible step first — suspend, don't delete

Render dashboard → suspend **`tmr-web-dev`** and **`tmr-api-dev`** (Settings → Suspend). Leave the
managed Postgres **`tmr-db-dev`** running for now. Watch the site (on Hetzner) for a day — if anything
was still depending on Render, suspension surfaces it without destroying anything (you can resume).

## 3. Remove Render custom domains

Render → `tmr-web-dev` and `tmr-api-dev` → Settings → **Custom Domains** → remove
`themusicrepository.com`, `www.themusicrepository.com`, `api.themusicrepository.com`. (DNS already points
at the tunnel, so this just detaches the now-unused Render domain bindings.)

## 4. Delete the services + database

Once suspended cleanly for a day and the dump is safe:
1. Delete **`tmr-web-dev`** and **`tmr-api-dev`** (Render → each service → Settings → Delete).
2. Delete the managed Postgres **`tmr-db-dev`** (this is destructive — the dump from step 1 is your only
   copy afterward).
3. Delete the **`dev` environment group** (holds the Render-side secrets: `SMTP_URL`, `MAIL_FROM`, social
   `*_CLIENT_ID/SECRET`, Turnstile). These now live in the box's `.env` — confirm before deleting.

## 5. Stop Render billing

Render → Workspace → **Plan** → downgrade from **Pro** to the free/hobby tier (or close the workspace if
nothing else uses it). This is what actually stops the monthly charge — deleting services alone may not.

## 6. Repo + Cloudflare cleanup (a small follow-up commit)

- **`render.yaml`**: keep it through the soak as a rollback recipe; once Render is deleted, remove it (or
  move to `docs/archive/`) in a cleanup commit so the repo has one source of truth (the Hetzner compose).
- **Render runbook**: `docs/runbooks/deploy-from-scratch.md` is already marked superseded — leave it as
  historical or delete in the same cleanup commit.
- **`*.onrender.com` host guards**: the 404 guards in `apps/api/src/main.ts` and
  `apps/web/src/middleware.ts` are harmless no-ops on Hetzner; optionally generalise them to reject
  non-Cloudflare hosts, or leave them.
- **Cloudflare**: nothing to remove — Access, Cache Rules, Resend DNS, and the zone all carry over. Just
  confirm no stale DNS records still point at `*.onrender.com`.

## Rollback (if you need Render back before step 4)

DNS is the switch. In Cloudflare, repoint apex/`www`/`api` from the tunnel back to the Render
`*.onrender.com` targets (or re-add the Render custom domains and resume the services). Because R2 +
Meilisearch are env-selected, a resumed Render (no `MEILI_HOST`/`R2_BUCKET`) simply falls back to
Postgres — it still serves. After step 4 (services/DB deleted) rollback means recreating from
`render.yaml` + the dump, so treat step 4 as the point of no easy return.
```
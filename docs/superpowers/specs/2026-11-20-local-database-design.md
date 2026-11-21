# Local database for development and tests

## Intent

Give the project a throwaway local database, seeded with a small fake family, so the Playwright tests and
development can run without touching the production Neon database. `npm run dev` uses the local database;
developing against production stays possible through `npm run dev:prod`. The tests always use the local database.

## Goals

- One command brings up a local database with the current production schema and a seeded fake family.
  One command resets it.
- `npm run dev` runs the app against the local database. `npm run dev:prod` runs it with `.env` as-is (production).
- `npm run test:e2e` always uses the local database, whatever `.env` says.
- Real sign-in works locally. Password sign-in uses a known seed password. Magic links print to the dev
  server output.
- Playwright tests for the database-backed workflows: real password sign-in, then add, edit, delete and claim a gift.

## Non-goals

- Blocking development against production. `npm run dev:prod` keeps it a deliberate, one-word choice.
- Production data locally. Only the schema structure is copied, never data.
- A migration framework, or cleaning up the old `scripts/neon/*.sql` history.
- Local email delivery (a mail catcher). CI wiring.

## Anti-goals

- Tests that can run against production, or send real email. E2E must refuse to run unless the database host is the
  local one and mail sending is off.
- Local and production running different query code. The app keeps the same driver, `@neondatabase/serverless`.

## Approaches

- **A. Postgres + Neon local HTTP proxy in Docker Compose (chosen).** The app keeps the Neon HTTP driver.
  `lib/neon.ts` points `neonConfig.fetchEndpoint` at the proxy when the host is the local one. Same query
  path as production.
- **B. Plain Postgres + a second driver for local URLs.** Rejected: an extra dependency and a different code
  path that can hide Neon-specific bugs.
- **C. A Neon branch (cloud copy).** Rejected: not local, and needs the Neon account.

A hard guard against production in development was considered and declined. The user wants `dev:prod` available.

## Design (decided)

- **Containers** (`docker-compose.yml`):
  - `postgres` (image major version matching production, found from the schema dump), with the `main` database.
    It loads `db/schema.sql` then `db/seed.sql` from `/docker-entrypoint-initdb.d` on first start.
  - The Neon local HTTP proxy (`ghcr.io/timowilhelm/local-neon-http-proxy`, port 4444), pointed at Postgres.
  - Postgres data lives in a named volume.
- **Local settings in one committed file, `db/local.env`.** It holds no secrets: the local password is
  `postgres`. It contains:
  - `NEON_DATABASE_URL=postgres://postgres:postgres@db.localtest.me:5432/main`. `db.localtest.me` resolves
    to 127.0.0.1 publicly; this is Neon's documented local-dev pattern.
  - `EMAIL_SERVER_USER=` (empty, so `lib/email.ts` prints magic links instead of sending them).
  - `NEXTAUTH_URL=http://localhost:3000`.

  Process environment wins over Next's `.env` files, so passing these variables in overrides production values without
  touching `.env`.
- **Scripts** (`package.json`):
  - `dev`: `node --env-file=db/local.env node_modules/next/dist/bin/next dev`, which uses the local database.
  - `dev:prod`: `next dev`, the previous `dev`, which uses `.env` (production).
  - `db:up`: `docker compose up -d --wait`.
  - `db:reset`: `node scripts/db-reset.mjs`. The script loads `db/local.env` and refuses, with a clear message, unless
    the `NEON_DATABASE_URL` host is `db.localtest.me` or `localhost`. It also refuses unless the Docker target is local:
    `DOCKER_HOST` must be unset or a `unix://` socket, and the active `docker context` must not point at a remote host.
    Only then does it run `docker compose down -v && docker compose up -d --wait`. The pure check
    (`assertLocalTarget(url, dockerHost)`) gets a `node --test` unit test.
  - `db:down`: `docker compose down`.
- **Driver config:** in `lib/neon.ts`, when the URL's host is `db.localtest.me`, set
  `neonConfig.fetchEndpoint = host => \`http://${host}:4444/sql\``. Nothing else changes.
- **Schema:** `db/schema.sql` is a one-time `pg_dump --schema-only --no-owner --no-privileges` of production,
  run through the Postgres Docker image. It is read-only and copies structure only, never data, and it is
  committed. Approved as part of this scope.
- **Seed** (`db/seed.sql`): a fake family of 4 users, all with password `password123` (bcrypt hash in the SQL):
  - Each user has a list.
  - Gifts in every state: unclaimed, claimed by another member, a gift card with partial contributions, a
    group gift with interest, and archived.
  - One pending suggestion and a couple of comments.
  - Fixed UUIDs, so tests can refer to known records.
- **E2E:**
  - `playwright.config.ts` loads `db/local.env` (`process.loadEnvFile`) and passes those values in
    `webServer.env`, with `NEXTAUTH_URL=http://localhost:3100` and the existing `NEXT_DIST_DIR`.
  - `globalSetup` fails with a clear message, and the `npm run db:up` hint, if the host isn't `db.localtest.me`,
    if `EMAIL_SERVER_USER` is non-empty, or if the proxy at `:4444` doesn't answer.
  - New `e2e/gifts.spec.ts` signs in for real as a seed user through the password form. It adds a gift with a
    unique name, edits it, deletes it, and claims a seeded gift on another member's list as a second user (and
    unclaims it afterwards).
  - Tests clean up what they create; `db:reset` fixes anything left over. Existing stubbed specs stay as they are.
- **Docs:**
  - A "Local database" section in `CLAUDE.md` and `README.md`: prerequisites (Docker), the commands, the seed
    users and password, and a note that `npm run dev:prod` uses `.env` (production).
  - Tick the TEARDOWN_PLAN item, and add a new open item for the e2e coverage still missing: gift-card
    contributions and suggestions. The seed has data for both.

## Left to the builder

- Exact seed names and gift contents. The seed must use realistic, clearly fake people (`@example.com` emails).
- Whether the proxy image needs extra environment beyond the Postgres connection string. Follow the image's README.
- Selectors for the gift-flow UI. Read `components/add-gift-form.tsx`, `edit-gift-dialog.tsx` and `claim-button.tsx`.

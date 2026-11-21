# Local Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Docker Compose Postgres plus Neon HTTP proxy, seeded with a fake family. `npm run dev` and the e2e tests use it;
`npm run dev:prod` keeps production.

**Architecture:** Compose runs `postgres` and `local-neon-http-proxy`. The app keeps `@neondatabase/serverless`, and
`lib/neon.ts` points `fetchEndpoint` at the proxy for the host `db.localtest.me`. The local settings live in a committed,
secret-free `db/local.env` and are passed as process env, which wins over Next's `.env` loading.

**Tech Stack:** Docker Compose v2, Postgres (major version matching production), Neon serverless driver 1.2,
`node --test`, Playwright 1.65.

**Spec:** `docs/superpowers/specs/2026-11-20-local-database-design.md`

## Global Constraints

- Local URL, exactly: `postgres://postgres:postgres@db.localtest.me:5432/main`. Local hosts are `db.localtest.me` and `localhost`.
- `db/local.env` contains exactly `NEON_DATABASE_URL` (as above), `EMAIL_SERVER_USER=` (empty) and `NEXTAUTH_URL=http://localhost:3000`. No secrets.
- Scripts:
  - `dev` = `node --env-file=db/local.env node_modules/next/dist/bin/next dev`
  - `dev:prod` = `next dev`
  - `db:up` = `docker compose up -d --wait`
  - `db:down` = `docker compose down`
  - `db:reset` = `node scripts/db-reset.mjs`
- Schema: production `pg_dump --schema-only --no-owner --no-privileges`. It copies structure only, never data, and is read-only against production.
- Seed: 4 users with `@example.com` emails, password `password123`, fixed UUIDs.
- No new npm dependencies. bcryptjs is already installed and is used only to generate the seed hash.

## Review Focus

- **Postgres already running on the dev machine (port 5432 taken)** → compose must still start. Postgres publishes
  on host port **5433** only (for `psql`). The proxy reaches Postgres over the compose network, so the app never
  uses a host Postgres port. Pinned in Task 3 Step 6.
- **Seed or schema edited after the first `db:up`** → init scripts only run on an empty volume, so the change
  doesn't appear. The docs must say "edit seed → `npm run db:reset`". Pinned in Task 5 Step 1.
- **Local DB not running when someone runs `npm run test:e2e`** → fail fast with "run npm run db:up", not 30s
  timeouts. Pinned in Task 3 Step 6.
- **Parallel e2e workers mutating the same seed gift** → claim/unclaim races. `gifts.spec.ts` runs serially, and each
  add/edit/delete test uses a unique gift name. Pinned in Task 4.
- **`.env` holds production mail credentials** → no e2e run may send mail. `assertLocalTarget` rejects a non-empty
  `EMAIL_SERVER_USER`. Pinned in Task 1.

---

### Task 1: Local-target guard and `db:reset`

**Files:**
- Create: `scripts/db-guard.mjs`, `scripts/db-guard.test.mjs`, `scripts/db-reset.mjs`
- Modify: `package.json` (`db:reset`; `test` becomes `node --test lib/*.test.ts scripts/*.test.mjs`)

**Interfaces:**
- Produces:
  - `assertLocalTarget({ databaseUrl, dockerHost, dockerEndpoint, emailUser }: { databaseUrl?: string; dockerHost?: string; dockerEndpoint?: string; emailUser?: string }): void`
    throws `Error` with a human-readable message naming the offending value. All four fields are optional, and
    only the fields passed are checked.
  - `LOCAL_DB_HOSTS = ['db.localtest.me', 'localhost']`.
  - `scripts/db-reset.mjs`:
    - loads `db/local.env` via `process.loadEnvFile`;
    - reads the endpoint with `docker context inspect --format '{{.Endpoints.docker.Host}}'`;
    - calls `assertLocalTarget({ databaseUrl, dockerHost: process.env.DOCKER_HOST, dockerEndpoint })`;
    - on failure prints the message and exits 1, otherwise runs `docker compose down -v` then `docker compose up -d --wait` with `stdio: 'inherit'`.

- [ ] **Step 1: Write the failing tests** (`node:test`, `node:assert/strict`):

```js
test('accepts the local database and local docker', () => {
  assert.doesNotThrow(() => assertLocalTarget({ databaseUrl: 'postgres://postgres:postgres@db.localtest.me:5432/main', dockerHost: undefined, dockerEndpoint: 'unix:///var/run/docker.sock', emailUser: '' }))
  assert.doesNotThrow(() => assertLocalTarget({ databaseUrl: 'postgres://u:p@localhost:5433/main' }))
})
test('rejects a non-local database host', () => {
  assert.throws(() => assertLocalTarget({ databaseUrl: 'postgres://u:p@ep-x.us-east-2.aws.neon.tech/neondb' }), /ep-x\.us-east-2\.aws\.neon\.tech/)
})
test('rejects a missing or unparsable database URL', () => {
  assert.throws(() => assertLocalTarget({ databaseUrl: '' }), /NEON_DATABASE_URL/)
  assert.throws(() => assertLocalTarget({ databaseUrl: 'not a url' }), /NEON_DATABASE_URL/)
})
test('rejects a remote docker target', () => {
  assert.throws(() => assertLocalTarget({ dockerHost: 'tcp://10.0.0.5:2376' }), /DOCKER_HOST/)
  assert.throws(() => assertLocalTarget({ dockerEndpoint: 'ssh://deploy@prod-box' }), /docker context/)
})
test('rejects mail sending being configured', () => {
  assert.throws(() => assertLocalTarget({ emailUser: 'someone@gmail.com' }), /EMAIL_SERVER_USER/)
})
```

- [ ] **Step 2:** `npm test` → the new file fails (module not found). The two existing season tests still pass.
- [ ] **Step 3:** Implement `scripts/db-guard.mjs` and `scripts/db-reset.mjs` per Interfaces. A Docker target is
  local when it is undefined, empty, or starts with `unix://` or `npipe://`.
- [ ] **Step 4:** `npm test` → 7 pass.
- [ ] **Step 5:** `DOCKER_HOST=tcp://10.0.0.5:2376 npm run db:reset` → exits 1 with the DOCKER_HOST message and runs no docker compose command.
- [ ] **Step 6: Commit** `feat: guarded db:reset for the local database`

### Task 2: Production schema snapshot

**Files:**
- Create: `db/schema.sql`

- [ ] **Step 1:** Read the production major version without printing the URL:
  `docker run --rm -e URL="$NEON_DATABASE_URL" postgres:17-alpine sh -c 'psql "$URL" -Atc "show server_version"'`,
  with `NEON_DATABASE_URL` read from `.env` and passed as env, never echoed. The image tag must match that major
  version; re-run with the matching tag if it differs.
- [ ] **Step 2:** Dump it:
  `docker run --rm -e URL=… postgres:<major>-alpine pg_dump "$URL" --schema-only --no-owner --no-privileges > db/schema.sql`.
- [ ] **Step 3: Verify.**
  - `grep -c "CREATE TABLE" db/schema.sql` covers at least these 11 tables: users, sessions, verification_tokens,
    lists, list_permissions, gift_items, gift_card_purchases, gift_interest, gift_suggestions, gift_item_comments,
    amazon_products.
  - `grep -ciE "^(INSERT|COPY) " db/schema.sql` → 0 (no data).
  - Remove Neon-only lines that a vanilla Postgres rejects, if any. Typical ones are `SET transaction_timeout`, and
    `CREATE PUBLICATION` / role-specific `ALTER DEFAULT PRIVILEGES`. Note each removal in the commit message.
- [ ] **Step 4: Commit** `chore: snapshot production schema for local database` (schema only).

### Task 3: Compose, seed, driver config, dev scripts, e2e guard

**Files:**
- Create: `docker-compose.yml`, `db/local.env`, `db/seed.sql`, `e2e/global-setup.ts`, `e2e/real-auth.spec.ts`
- Modify: `lib/neon.ts`, `package.json` (`dev`, `dev:prod`, `db:up`, `db:down`), `playwright.config.ts`, `.gitignore` if needed

**Interfaces:**
- Consumes: `assertLocalTarget` from Task 1 (Playwright can import `.mjs`); `db/schema.sql` from Task 2.
- Produces:
  - Seed users (all `password123`):
    - Alex Rivera `alex@example.com`, `00000000-0000-4000-8000-000000000001`
    - Sam Chen `sam@example.com`, `…0002`
    - Jordan Patel `jordan@example.com`, `…0003`
    - Riley Okafor `riley@example.com`, `…0004`
  - One public list each, with list ids `…0101`–`…0104`.
  - Gift `…0201` "Cast iron skillet" on Sam's list, unclaimed: the claim target for Task 4.
  - Exported from `e2e/fixtures.ts`:
    - `signInAs(page, email: string): Promise<void>` fills the password form and waits for the `/en` home page.
    - `SEED = { alex, sam, jordan, riley }`, each `{ id, email, name }`, plus `SEED_PASSWORD = 'password123'`.

- [ ] **Step 1: Write the failing test** `e2e/real-auth.spec.ts`:
  - `signInAs(page, SEED.alex.email)` → URL `/en`, and the user menu button shows. This proves the real sign-in,
    session and DB read path through the proxy.
  - Visiting the family lists shows "Sam Chen" (seed data visible).
- [ ] **Step 2:** `npx playwright test e2e/real-auth.spec.ts` → FAIL, from the globalSetup error (no local DB) or from sign-in failing.
- [ ] **Step 3: Implement.**
  - **Compose:**
    - `postgres:<major>-alpine`, with `POSTGRES_DB=main` and password `postgres`.
    - Mount `db/schema.sql` → `/docker-entrypoint-initdb.d/01-schema.sql` and `db/seed.sql` → `02-seed.sql`.
    - Named volume. Port `5433:5432`. Healthcheck `pg_isready`.
    - `neon-proxy`: image `ghcr.io/timowilhelm/local-neon-http-proxy:main`, `PG_CONNECTION_STRING=postgres://postgres:postgres@postgres:5432/main`,
      port `4444:4444`, `depends_on: postgres (service_healthy)`. Check the image README for any other required env.
  - **`lib/neon.ts`:** when `new URL(NEON_DATABASE_URL).hostname === 'db.localtest.me'`, set
    `neonConfig.fetchEndpoint = host => \`http://${host}:4444/sql\`` before `neon()`.
  - **`db/seed.sql`:** the Interfaces records, plus:
    - one claimed gift on Jordan's list, claimed by Riley;
    - a gift card on Riley's list with 2 contributions;
    - a group gift with 2 interest rows;
    - one archived gift;
    - one pending suggestion from Alex for Jordan;
    - 2 comments.

    The bcrypt hash is generated once with `node -e "console.log(require('bcryptjs').hashSync('password123', 10))"`
    and pasted in. Column names come from `db/schema.sql`.
  - **Playwright:**
    - `playwright.config.ts` calls `process.loadEnvFile('db/local.env')` into a local object (it must not mutate
      `process.env` for production values).
    - `webServer.env = { ...localEnv, NEXTAUTH_URL: 'http://localhost:3100', NEXT_DIST_DIR: '.next-e2e' }`.
    - `globalSetup: './e2e/global-setup.ts'`, which calls `assertLocalTarget({ databaseUrl, emailUser })` on the
      webServer env, then `fetch('http://localhost:4444')`. Any HTTP response counts as up; on a connection error
      it throws `Local database proxy not reachable on :4444. Run: npm run db:up`.
  - **`package.json`:** add `dev`, `dev:prod`, `db:up`, `db:down` per Global Constraints.
- [ ] **Step 4:** `npm run db:up` → both containers healthy. `npx playwright test e2e/real-auth.spec.ts` → pass.
- [ ] **Step 5:** `npm run db:down` then `npx playwright test e2e/real-auth.spec.ts` → fails within seconds with the
  `npm run db:up` message. Then `npm run db:up` again.
- [ ] **Step 6:** Port check: run `docker run -d --rm -p 5432:5432 -e POSTGRES_PASSWORD=x --name pg-clash postgres:17-alpine`,
  then `npm run db:reset`, and expect it to start healthy. Then `docker stop pg-clash`.
- [ ] **Step 7:** `npm run dev` → sign in at `localhost:3000` as `alex@example.com` / `password123` and see the seed lists.
  Use `npm run dev:prod` once to confirm it still starts with `.env`, but don't sign in.
- [ ] **Step 8:** `npm test && npx playwright test` → all pass (the existing 29, plus real-auth).
- [ ] **Step 9: Commit** `feat: local Postgres + Neon proxy with seeded family; dev uses it, dev:prod uses .env`

### Task 4: Gift-flow e2e tests

**Files:**
- Create: `e2e/gifts.spec.ts`

**Interfaces:**
- Consumes: `signInAs`, `SEED`, and gift `…0201` from Task 3.

`test.describe.configure({ mode: 'serial' })`. Every created gift is named `` `E2E ${test.info().testId} ${Date.now()}` ``.

- [ ] **Step 1: Write the tests.**
  - `adds a gift to my list` (as Alex): the quick-add field gets the unique name, then submit "Add Gift Idea". The
    gift appears in "My Gift Ideas". The test deletes it in an `afterEach` through the UI.
  - `edits a gift`: add one, open its edit dialog ("Edit Gift Item"), change the name and save. The new name is
    visible and the old one isn't.
  - `deletes a gift`: add one, then Delete and confirm. It's gone after a reload.
  - `claims and unclaims another member's gift` (as Riley): open Sam's list and claim "Cast iron skillet". It shows
    as claimed by Riley after a reload. Unclaim it in `finally`.
  - `owner does not see who claimed their gift` (as Sam, after Riley claims): "Cast iron skillet" shows no claimer.
    Read `components/gift-item.tsx` / `lib/gift-privacy.ts` for how privacy shows; the test pins what the code does today.

  Take selectors from `add-gift-form.tsx`, `edit-gift-dialog.tsx`, `claim-button.tsx` and `confirm-dialog.tsx`.
  Prefer roles and labels.
- [ ] **Step 2:** `npx playwright test e2e/gifts.spec.ts` → these test existing behaviour, so a pass is expected. For
  each test, prove it can fail by temporarily breaking one thing (for example, swap the claim API route to return
  500 via `page.route`) and seeing it fail, then remove the break.
- [ ] **Step 3:** `npx playwright test --repeat-each 3` → all pass, no flakes. `npm run db:reset` and run once more → pass.
- [ ] **Step 4: Commit** `test: e2e gift flows against the local database`

### Task 5: Docs and to-dos

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `.github/copilot-instructions.md`, `TEARDOWN_PLAN.md`

- [ ] **Step 1:** Add a "Local database" section to `CLAUDE.md` and `README.md`:
  - Docker required.
  - `npm run db:up` / `db:down` / `db:reset`.
  - `npm run dev` uses the local DB; `npm run dev:prod` uses `.env` (production).
  - The seed users and `password123`.
  - **Edit `db/seed.sql` or `db/schema.sql` → `npm run db:reset`** (init scripts only run on an empty volume).
  - Re-snapshot the schema after production migrations (the Task 2 commands).
- [ ] **Step 2:** Update the `npm run dev` lines in `CLAUDE.md:13` and `.github/copilot-instructions.md:173`, and the
  `test:e2e` line, which now needs `npm run db:up`.
- [ ] **Step 3:** In `TEARDOWN_PLAN.md`, tick the local-database item and add `- [ ]` for the e2e coverage still
  missing: gift-card contributions and suggestions. The seed has data for both.
- [ ] **Step 4: Commit** `docs: local database workflow`

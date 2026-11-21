# Family gift app

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/cameron-omicciolis-projects/v0-family-gift-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/edEKgUIOHUa)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/cameron-omicciolis-projects/v0-family-gift-app](https://vercel.com/cameron-omicciolis-projects/v0-family-gift-app)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/edEKgUIOHUa](https://v0.dev/chat/projects/edEKgUIOHUa)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Local database

A throwaway Postgres with a fake family, so development and tests never touch production. Needs Docker.

```bash
npm run db:up        # start Postgres + Neon HTTP proxy (first start loads db/schema.sql + db/seed.sql)
npm run db:down      # stop (data kept)
npm run db:reset     # wipe and re-seed; refuses unless the target is local
npm run dev          # app on localhost:3000 against the local DB (settings in db/local.env)
npm run dev:prod     # app against whatever .env says (production)
```

- Seed users, all with password `password123`: `alex@example.com`, `sam@example.com`, `jordan@example.com`, `riley@example.com`.
- Magic links aren't emailed locally; they're printed in the `npm run dev` output.
- **Changed `db/seed.sql` or `db/schema.sql`? Run `npm run db:reset`.** Postgres only runs them on an empty volume.
- `npm run test:e2e` always uses the local DB (it refuses anything else); run `npm run db:up` first.
  If it fails with JSON `SyntaxError`s from the web server, delete the `.next-e2e` cache and re-run.
- After a production schema migration, refresh the snapshot (structure only, no data; `.env` must hold the production URL):
  ```bash
  URL=$(node -e "process.loadEnvFile('.env');process.stdout.write(process.env.NEON_DATABASE_URL)")
  docker run --rm -e URL="$URL" postgres:17-alpine sh -c 'pg_dump "$URL" --schema-only --no-owner --no-privileges' > db/schema.sql
  npm run db:reset
  ```

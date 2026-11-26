# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js family gift wishlist application that allows family members to create wishlists, purchase gifts for each other, and track gift card contributions. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## Common Development Commands

```bash
# Development
npm run dev          # Dev server on localhost:3000 against the LOCAL database (see Local database)
npm run dev:prod     # Dev server against .env (production database)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint (flat config, ESLint 10)
npm test             # Unit tests (node --test lib/*.test.ts scripts/*.test.mjs)
npm run test:e2e     # Playwright e2e against the local DB (needs npm run db:up; own next dev on :3100, distDir .next-e2e)
```

Git hooks live in `.githooks/` (enabled by `npm install` via the `prepare` script):
- **pre-commit:** `npm run lint` + `npm test` must pass.
- **pre-push:** `npm run test:e2e` must pass (start the local DB first: `npm run db:up`).
- Skip once with `--no-verify`.

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

## Architecture

### Database & Authentication
- **Database**: Neon PostgreSQL with serverless functions
- **Auth**: Custom session-based authentication with magic links and password support
- **Session Management**: HTTP-only cookies with 30-day expiration
- **Middleware**: Route protection at `middleware.ts:4-24` handles public/protected routes

### Core Data Models
- **Users**: Email-based with optional password, name, and verification status
- **GiftItem**: Central gift entity with OpenGraph metadata, gift card support, and purchase tracking
- **Sessions**: Session tokens linked to users with expiration dates
- **GiftCardPurchase**: Tracks individual contributions to gift card items

### Key Architecture Patterns
- **App Router**: Uses Next.js 13+ app directory structure
- **Server Components**: Main pages are server-rendered with auth checks
- **Client Components**: Interactive UI components marked with "use client"
- **Database Layer**: Direct SQL queries via Neon serverless driver at `lib/neon.ts`
- **Custom Hooks**: `useGiftData` hook manages client-side data fetching and mutations

### File Structure
```
app/
├── api/                 # API routes for data operations
├── auth/               # Authentication pages (signin, register, verify)
├── layout.tsx          # Root layout with Geist fonts and global styles
└── page.tsx            # Main gift list page

components/
├── ui/                 # shadcn/ui components
├── family-gift-app.tsx # Main application component
├── gift-item.tsx       # Individual gift item component
└── user-menu.tsx       # User navigation and profile

lib/
├── auth.ts             # Authentication functions and session management
├── neon.ts            # Database connection and type definitions
├── email.ts           # Email service for magic links
└── utils.ts           # Utility functions and CSS class merging
```

### Gift Card System
- Gift items can be marked as gift cards with target amounts
- Multiple users can contribute partial amounts toward gift card goals
- Contributions are tracked separately in `gift_card_purchases` table
- UI shows progress toward target amount and list of contributors

### OpenGraph Integration
- Automatic metadata fetching for gift links via `/api/og-data`
- Stores title, description, image, and site name for rich link previews
- Used in gift item display for enhanced UX
- **Amazon API Integration**: Uses RapidAPI's Amazon API Scraping service for fetching product information
  - Caches results in `amazon_products` table (24-hour TTL)
  - Requires `RAPID_API_KEY` environment variable
  - Extracts ASIN from Amazon URLs (supports .com, .co.uk, .ca)
  - Falls back to URL parsing if API key is not configured or API fails
- **Etsy Support**: Uses URL parsing to extract title from listing URLs
  - Etsy blocks automated scraping, so only basic metadata is available

## Environment Variables Required
- `NEON_DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Base URL for magic link generation
- `RAPID_API_KEY` (required for Amazon products): RapidAPI key for Amazon API Scraping service. Get one at https://rapidapi.com/letscrape-6bRBa3QguO5/api/amazon-api-scraping
- Email service configuration (check `lib/email.ts` for specifics)
- `CRON_SECRET`: Vercel Cron sends it to `/api/cron/digest` (the daily new-gifts email; currently disabled, no cron schedules it)

## Agent access (MCP)
- `/api/mcp` is a stateless MCP server (Streamable HTTP) for Claude Code, Hermes and other MCP clients.
- Agents authenticate with a token from the profile page, sent as `Authorization: Bearer <token>`. A token is a `sessions` row with a `name`, so `getSession()` accepts it on every API route.
- Routes that change how you sign in (passwords, tokens) use `getBrowserSession()`, which rejects agent tokens.
- MCP tools call the existing route handlers in-process, so permission checks and the surprise-list scrub apply unchanged.

## Database Migration
- Use `migrate.js` for schema setup
- Later migrations are SQL files in `scripts/neon/` (run with `psql -f`)
- `cleanup-seed-data.sql` for development data cleanup

## UI Framework
- **Styling**: Tailwind CSS with custom color scheme (red-to-violet gradient backgrounds)
- **Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono via `geist/font`
# Copilot Instructions - Family Gift Wishlist

## Project Architecture

**Tech Stack**: Next.js 15+ App Router, TypeScript, Tailwind CSS, shadcn/ui, Neon PostgreSQL (serverless)

**Core Pattern**: Server Components by default, Client Components marked with `"use client"`. Authentication and data layer use direct SQL queries via Neon's serverless driver - no ORM.

## Authentication & Session Management

- **Auth Implementation**: Custom session-based auth in `lib/auth.ts` with magic links + password support
- **Session Pattern**: HTTP-only cookies with 30-day expiration, validated via `requireAuth()` or `getSession()`
- **Route Protection**: `middleware.ts` (lines 4-24) redirects unauthenticated users to `/auth/signin`
- **API Routes**: Always call `requireAuth()` first - returns user or redirects. See `app/api/gift-items/route.ts:12`

```typescript
// Standard API route pattern
import { requireAuth } from "@/lib/auth";
const currentUser = await requireAuth(); // Redirects if not authenticated
```

## Database Layer

- **Connection**: Direct SQL via `lib/neon.ts` - import `{ sql }` and write parameterized queries
- **No ORM**: Use raw SQL with template literals for type safety: `sql\`SELECT \* FROM users WHERE id = ${userId}\``
- **Migrations**: Manual SQL scripts in `scripts/neon/` - run with node scripts (`migrate.js`, `migrate-lists.js`, etc.)
- **Types**: Define in `lib/neon.ts` - exported types like `User`, `GiftItem`, `List`, `ListPermission`

## Key Data Models & Features

### Multi-List System (See LISTS_IMPLEMENTATION.md)

- Users can create multiple lists with names, descriptions, and privacy settings
- **Privacy Logic**: `is_public: false` hides purchase status from list owner (but others still see it to coordinate)
- Lists require explicit `list_id` when creating gift items
- Default list auto-created for new users in `family-gift-app.tsx:69-80`

### Permissions System (See PERMISSIONS_FEATURE.md)

- Three visibility modes: "Visible to All", "Hidden from Specific", "Visible Only to Specific"
- Stored in `list_permissions` table with `can_view` boolean per user
- Query pattern in `app/api/gift-items/route.ts:17-38` checks owner OR explicit permission OR no restrictions
- Empty permissions = visible to all (default behavior)

### Gift Cards & Group Gifts

- **Gift Cards**: Set `is_gift_card: true` + `gift_card_target_amount`, track contributions in `gift_card_purchases`
- **Group Gifts**: `is_group_gift: true` allows interest tracking via `gift_interest` table (see GROUP_GIFT_FEATURE.md)
- Owner's interest hidden from count to avoid bias

### OpenGraph & Amazon Integration

- **OG Metadata**: Fetched via `/api/og-data`, stored in gift_items (title, description, image, site_name)
- **Amazon**: Uses RapidAPI scraping service (`lib/amazon.ts`) - requires `RAPID_API_KEY`, caches 24hrs in `amazon_products`
- **Etsy**: URL parsing only (blocks automated scraping)

## Component Patterns

### Server Components (default)

- Pages in `app/` directory: `page.tsx`, `layout.tsx`
- Always call `requireAuth()` at top of page components (see `app/page.tsx:4`)
- Pass user data down to client components as props

### Client Components (explicit)

- Mark with `"use client"` directive at top
- All interactive UI: forms, dialogs, tabs, state management
- Custom hooks pattern: `useGiftData`, `useListData`, `useGiftListData` for data fetching/mutations
- Main app component: `family-gift-app.tsx` orchestrates all interactions

### shadcn/ui Components

- Located in `components/ui/` - all are client components
- Import and use directly, customize via `components.json` config
- Styling via Tailwind + CSS variables (see `app/globals.css`)

## Development Workflow

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start dev server on localhost:3000
pnpm build                # Production build
pnpm lint                 # Run ESLint (currently ignores errors)
```

### Running Migrations

```bash
node migrate.js                    # Initial schema
node migrate-lists.js              # Add lists support
node run-group-gift-migration.js   # Add group gifts
```

### Environment Variables (Required)

```env
NEON_DATABASE_URL=postgresql://...    # Neon connection string
NEXTAUTH_URL=http://localhost:3000    # Base URL for magic links
RAPID_API_KEY=...                     # For Amazon product data (optional but recommended)
EMAIL_SERVER_*=...                    # SMTP settings (see AUTH_SETUP.md)
```

## Common Patterns

### Adding a New API Route

1. Create `app/api/[name]/route.ts`
2. Import `requireAuth` from `@/lib/auth`
3. Call `const user = await requireAuth()` first
4. Import `sql` from `@/lib/neon` and write queries
5. Return `NextResponse.json(data)` or handle errors with try-catch

### Creating New Database Types

1. Save a snapshot of the current database state to to avoid data loss
2. Add SQL migration in `scripts/neon/`
3. Define TypeScript type in `lib/neon.ts`
4. Export type for use in components/hooks
5. Update queries to include new fields

### Privacy-Aware Data Fetching

- Always join `lists` table to get `is_public` flag
- Check if `currentUser.id === list_owner_id` AND `!is_public`
- If true, hide `purchased_by` and purchase status from response
- See `app/api/gift-items/route.ts` for full pattern

## Debugging Tips

- **Auth Issues**: Check `middleware.ts` matcher config and public routes list
- **Database Errors**: SQL queries use template literals - check parameter binding
- **Missing Data**: Verify list permissions aren't blocking access - empty permissions = visible to all
- **Amazon API**: Logs full response to console (see `lib/amazon.ts:37`) - check field names if parsing fails

## Project-Specific Conventions

- **Fonts**: Geist Sans (primary) and Geist Mono (code) loaded in `app/layout.tsx`
- **Styling**: Gradient background `from-red-100 to-violet-300` is brand identity
- **User Limit**: Designed for ~12 users (family size) - no pagination needed
- **Email PII**: Only email stored deliberately, minimal user data collection
- **Currency**: Stored as strings, formatted via `lib/currency.ts` utility

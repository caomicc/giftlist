# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js family gift wishlist application that allows family members to create wishlists, purchase gifts for each other, and track gift card contributions. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## Common Development Commands

```bash
# Development
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint (currently configured to ignore errors)
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

## Environment Variables Required
- `NEON_DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Base URL for magic link generation
- Email service configuration (check `lib/email.ts` for specifics)

## Database Migration
- Use `migrate.js` for schema setup
- `migrate-gift-cards.js` for gift card feature migration
- `cleanup-seed-data.sql` for development data cleanup

## UI Framework
- **Styling**: Tailwind CSS with custom color scheme (red-to-violet gradient backgrounds)
- **Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono via `geist/font`
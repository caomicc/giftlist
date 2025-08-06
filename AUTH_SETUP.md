# Authentication Setup Guide

## Overview
This gift list app now includes **both magic link and username/password authentication** using Neon database. Users can choose their preferred sign-in method.

## Setup Steps

### 1. Run Database Migrations
Run both auth table creation scripts:
```sql
-- In your Neon SQL editor or via psql
\i scripts/neon/05-create-auth-tables.sql
\i scripts/neon/06-add-password-support.sql
```

### 2. Configure Email Settings (for Magic Links)
Update your `.env.local` file with your email provider settings:

**For Gmail:**
1. Enable 2-factor authentication on your Gmail account
2. Generate an app password: https://myaccount.google.com/apppasswords
3. Update these variables:
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password-here
EMAIL_FROM=your-email@gmail.com
```

**For other providers:**
- **Outlook/Hotmail**: `smtp.live.com`, port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, port `587`
- **Custom SMTP**: Use your provider's settings

### 3. Update Security Settings
```env
NEXTAUTH_URL=http://localhost:3000  # Change for production
NEXTAUTH_SECRET=generate-a-random-secret-key-here
```

## Authentication Methods

### 🔐 Username/Password
- **Sign up**: `/auth/register` - Create account with email, password, and optional name
- **Sign in**: `/auth/signin` (Password tab) - Traditional email/password login
- **Security**: Passwords hashed with bcrypt (12 rounds)
- **Validation**: Minimum 6 characters required

### 🪄 Magic Links  
- **Sign in**: `/auth/signin` (Magic Link tab) - Email-only authentication
- **Process**: Enter email → receive secure link → click to sign in
- **Security**: Tokens expire after 24 hours, one-time use

### 🔄 Full Cross-Compatibility
- **Password users**: Can use BOTH password and magic link login ✅
- **Magic-link users**: Can use magic links, and can add a password anytime ✅
- **Set Password**: Users without passwords see a "Set Password" option in their profile menu
- **Flexible**: Choose your preferred method each sign-in, regardless of signup method

## How It Works

### User Registration & Sign In
1. **New users** can register with password or use magic link
2. **Existing users** can use either method regardless of how they signed up
3. **Sessions** last 30 days with automatic renewal
4. **Security** includes CSRF protection and SQL injection prevention

### User Management
- Maximum 12 users (perfect for family gift lists)
- Email addresses stored (only PII as requested)
- Optional display names
- Secure session management with HTTP-only cookies

### Database Schema
```sql
users: id, email, name, password_hash, email_verified, created_at
sessions: id, session_token, user_id, expires
verification_tokens: identifier, token, expires (for magic links)
```

## Usage in Your App

### Protect Pages
```tsx
import { requireAuth } from '@/lib/auth'

export default async function ProtectedPage() {
  const user = await requireAuth() // Redirects if not signed in
  
  return <div>Hello {user.email}!</div>
}
```

### Get Current User (Optional)
```tsx
import { getSession } from '@/lib/auth'

export default async function MyPage() {
  const session = await getSession()
  
  if (!session) {
    return <SignInPrompt />
  }
  
  return <div>Welcome {session.user.email}</div>
}
```

### Add User Menu to Header
```tsx
import { UserMenu } from '@/components/user-menu'
import { requireAuth } from '@/lib/auth'

export default async function Header() {
  const user = await requireAuth()
  
  return (
    <header>
      <div>Gift List App</div>
      <UserMenu user={user} />
    </header>
  )
}
```

## Testing
1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Try both authentication methods:
   - **Register** with email/password at `/auth/register`
   - **Sign in** with password on the "Password" tab
   - **Sign in** with magic link on the "Magic Link" tab
4. Check the user menu in the top-right corner
5. Test sign out functionality

## Routes Overview
- `/auth/signin` - Sign in page (both methods)
- `/auth/register` - Registration page (password only)
- `/auth/set-password` - Add password to existing account
- `/auth/verify-request` - Magic link sent confirmation
- `/auth/verify` - Magic link verification
- `/api/auth/signin` - Magic link API
- `/api/auth/signin-password` - Password sign in API
- `/api/auth/register` - Registration API
- `/api/auth/set-password` - Set password API
- `/api/auth/check-password` - Check if user has password
- `/api/auth/signout` - Sign out API

## Production Deployment
1. Run both database migration scripts in production
2. Set up your production email service (if using magic links)
3. Update `NEXTAUTH_URL` to your production domain
4. Generate a strong `NEXTAUTH_SECRET` (use: `openssl rand -base64 32`)
5. Ensure your Neon database has both auth migration scripts applied

## Security Features
- **Passwords**: bcrypt hashing with 12 rounds
- **Sessions**: HTTP-only cookies, 30-day expiration
- **Magic Links**: 24-hour token expiration, one-time use
- **CSRF Protection**: Secure session management
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Built into email providers
- **Input Validation**: Email format, password length checks

Perfect for a family gift list app with **maximum simplicity and security**! 🎁

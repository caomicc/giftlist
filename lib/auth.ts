import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { sendMagicLink } from "./email"
import { sql } from "./neon"

export interface User {
  id: string
  email: string
  name?: string
  created_at: Date
}

export interface Session {
  id: string
  user: User
  expires: Date
}

// Password authentication
export async function signInWithPassword(email: string, password: string) {
  // Find user with password
  const [user] = await sql`
    SELECT * FROM users
    WHERE email = ${email} AND password_hash IS NOT NULL
  `

  if (!user || !user.password_hash) {
    return null
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash)
  if (!isValidPassword) {
    return null
  }

  // Create session
  const sessionToken = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await sql`
    INSERT INTO sessions (session_token, user_id, expires)
    VALUES (${sessionToken}, ${user.id}, ${expires})
  `

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('session-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expires,
    path: '/'
  })

  return user
}

// Register with password
export async function registerWithPassword(email: string, password: string, name?: string) {
  // Check if user already exists
  const [existingUser] = await sql`
    SELECT id FROM users WHERE email = ${email}
  `

  if (existingUser) {
    throw new Error('User already exists')
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Create user
  const [user] = await sql`
    INSERT INTO users (email, password_hash, name, email_verified)
    VALUES (${email}, ${passwordHash}, ${name || null}, NOW())
    RETURNING *
  `

  // Create session
  const sessionToken = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await sql`
    INSERT INTO sessions (session_token, user_id, expires)
    VALUES (${sessionToken}, ${user.id}, ${expires})
  `

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('session-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expires,
    path: '/'
  })

  return user
}

// Set password for existing user (e.g., magic-link users wanting to add password)
export async function setPassword(email: string, password: string) {
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Update user with password
  const [user] = await sql`
    UPDATE users
    SET password_hash = ${passwordHash}
    WHERE email = ${email}
    RETURNING *
  `

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

// Check if user has a password set
export async function userHasPassword(email: string): Promise<boolean> {
  const [user] = await sql`
    SELECT password_hash FROM users WHERE email = ${email}
  `

  return user && user.password_hash !== null
}

// Create a magic link and send it via email
export async function createMagicLink(email: string) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Store the token in database
  await sql`
    INSERT INTO verification_tokens (identifier, token, expires)
    VALUES (${email}, ${token}, ${expires})
    ON CONFLICT (identifier, token) DO UPDATE SET expires = ${expires}
  `

  // Send the magic link email
  const baseUrl = process.env.NEXTAUTH_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const magicLink = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`
  await sendMagicLink(email, magicLink)

  return { success: true }
}

// Verify magic link token and create session
export async function verifyMagicLink(token: string, email: string) {
  try {
    console.log('🔍 Verifying magic link:', {
      token: token.substring(0, 10) + '...',
      email,
      tokenLength: token.length
    })

    // Validate inputs
    if (!token || !email) {
      console.log('❌ Missing token or email');
      return null;
    }

    // Check if token is valid and not expired
    const [verification] = await sql`
      SELECT * FROM verification_tokens
      WHERE identifier = ${email} AND token = ${token} AND expires > NOW()
    `

    console.log('🎫 Verification token found:', !!verification)
    if (verification) {
      console.log('🕒 Token expires:', verification.expires)
      console.log('🕒 Current time:', new Date().toISOString())
    }

    if (!verification) {
      console.log('❌ No valid verification token found')
      return null
    }

    // Get or create user FIRST (before deleting token)
    let user: Record<string, any> | undefined;
    {
      const [foundUser] = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      user = foundUser;
    }

    if (!user) {
      console.log('👤 Creating new user for email:', email);
      try {
        console.log('🔧 About to execute INSERT INTO users...');
        const result = await sql`
          INSERT INTO users (email, email_verified)
          VALUES (${email}, NOW())
          RETURNING *
        `;
        console.log('🔧 INSERT query executed, result:', result);
        
        if (!result || result.length === 0) {
          console.error('❌ User creation returned empty result array');
          throw new Error('User creation returned no results');
        }
        
        user = result[0];
        if (!user) {
          console.error('❌ User creation returned null/undefined user');
          throw new Error('User creation returned null user');
        }
        
        if (!user.id) {
          console.error('❌ User creation returned user without ID:', user);
          throw new Error('User creation returned user without ID');
        }
        
        console.log('✅ New user created successfully:', {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          created_at: user.created_at
        });
      } catch (userCreationError) {
        console.error('❌ Failed to create user - Full error:', {
          error: userCreationError,
          message: userCreationError instanceof Error ? userCreationError.message : 'Unknown error',
          stack: userCreationError instanceof Error ? userCreationError.stack : undefined,
          email: email
        });
        throw userCreationError;
      }
    } else {
      console.log('👤 Updating existing user:', user.id);
      await sql`
        UPDATE users SET email_verified = NOW() WHERE email = ${email}
      `;
    }

    // Verify user object is valid
    if (!user || !user.id) {
      console.error('❌ Invalid user object:', user);
      throw new Error('User object is invalid or missing ID');
    }

    // Create session
    console.log('🎫 Creating session for user:', user.id)
    const sessionToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await sql`
      INSERT INTO sessions (session_token, user_id, expires)
      VALUES (${sessionToken}, ${user.id}, ${expires})
    `
    console.log('✅ Session created successfully')

    // Only delete the token AFTER everything else succeeds
    await sql`
      DELETE FROM verification_tokens
      WHERE identifier = ${email} AND token = ${token}
    `
    console.log('🗑️ Used token deleted')

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expires,
      path: '/'
    })

    console.log('✅ Magic link verification successful')
    return user
  } catch (error) {
    console.error('❌ Error verifying magic link - Full details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email: email,
      token: token ? token.substring(0, 10) + '...' : 'undefined'
    });
    return null
  }
}

// Get current session
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session-token')?.value

  if (!sessionToken) {
    return null
  }

  const [session] = await sql`
    SELECT s.*, u.* FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_token = ${sessionToken} AND s.expires > NOW()
  `

  if (!session) {
    return null
  }

  return {
    id: session.id,
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      created_at: session.created_at
    },
    expires: session.expires
  }
}

// Sign out
export async function signOut() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session-token')?.value

  if (sessionToken) {
    await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
  }

  cookieStore.delete('session-token')
}

// Auth middleware
export async function requireAuth(): Promise<User> {
  const session = await getSession()
  if (!session) {
    redirect('/auth/signin')
  }
  return session.user
}

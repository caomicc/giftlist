import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function POST(request: NextRequest) {
  try {
    const { email, action } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (action === 'test_user_creation') {
      console.log('🧪 Testing user creation for email:', email);

      // First check if user already exists
      const existingUser = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;

      if (existingUser.length > 0) {
        return NextResponse.json({
          success: false,
          message: 'User already exists',
          existing_user: existingUser[0]
        });
      }

      // Try to create the user
      try {
        console.log('🧪 Attempting to create user...');
        const result = await sql`
          INSERT INTO users (email, email_verified)
          VALUES (${email}, NOW())
          RETURNING *
        `;

        console.log('🧪 User creation result:', result);

        return NextResponse.json({
          success: true,
          message: 'User created successfully',
          user: result[0],
          created_at: new Date().toISOString()
        });
      } catch (creationError) {
        console.error('🧪 User creation failed:', creationError);
        return NextResponse.json({
          success: false,
          error: 'User creation failed',
          details: creationError instanceof Error ? creationError.message : 'Unknown error',
          full_error: creationError
        }, { status: 500 });
      }
    }

    if (action === 'cleanup_tokens') {
      // Clean up tokens for this email
      const deletedTokens = await sql`
        DELETE FROM verification_tokens 
        WHERE identifier = ${email}
        RETURNING *
      `;

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${deletedTokens.length} tokens for ${email}`,
        deleted_tokens: deletedTokens
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "test_user_creation" or "cleanup_tokens"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Test user endpoint failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    const familyMembers = await sql`SELECT * FROM family_members ORDER BY name`
    return NextResponse.json({ familyMembers })
  } catch (error) {
    console.error('Failed to fetch family members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch family members' },
      { status: 500 }
    )
  }
}

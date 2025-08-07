import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'fix_data_types') {
      // First, check if we have any existing data that would cause issues
      const existingPurchases = await sql`
        SELECT COUNT(*) as count FROM gift_card_purchases
      `

      if (existingPurchases[0].count > 0) {
        // If there's existing data, we need to be more careful
        return NextResponse.json({
          status: 'warning',
          message: `Found ${existingPurchases[0].count} existing gift card purchases. Manual intervention may be required.`,
          timestamp: new Date().toISOString()
        })
      }

      // If no existing data, we can safely alter the table structure
      await sql`
        ALTER TABLE gift_card_purchases 
        ALTER COLUMN gift_item_id TYPE UUID USING gift_item_id::UUID
      `

      await sql`
        ALTER TABLE gift_card_purchases 
        ALTER COLUMN purchaser_id TYPE UUID USING purchaser_id::UUID
      `

      return NextResponse.json({
        status: 'success',
        message: 'Data types corrected successfully',
        timestamp: new Date().toISOString()
      })
    }

    if (action === 'check_types') {
      const giftItemsType = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gift_items' AND column_name = 'id'
      `

      const usersType = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'id'
      `

      const purchasesTypes = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gift_card_purchases' 
          AND column_name IN ('gift_item_id', 'purchaser_id')
        ORDER BY column_name
      `

      return NextResponse.json({
        status: 'success',
        data_types: {
          gift_items_id: giftItemsType[0],
          users_id: usersType[0],
          gift_card_purchases: purchasesTypes
        },
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Fix data types failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Failed to fix data types', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

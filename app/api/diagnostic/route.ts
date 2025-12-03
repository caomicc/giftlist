import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon'

export async function GET() {
  try {
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `

    // Check if gift_card_purchases table exists and its columns
    let giftCardPurchasesInfo = null
    try {
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gift_card_purchases' 
        ORDER BY ordinal_position
      `
      giftCardPurchasesInfo = { exists: true, columns }
    } catch (error) {
      giftCardPurchasesInfo = { exists: false, error: error instanceof Error ? error.message : String(error) }
    }

    // Check gift_items table columns
    let giftItemsInfo = null
    try {
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gift_items' 
        ORDER BY ordinal_position
      `
      giftItemsInfo = { exists: true, columns }
    } catch (error) {
      giftItemsInfo = { exists: false, error: error instanceof Error ? error.message : String(error) }
    }

    return NextResponse.json({
      tables: tables.map(t => t.table_name),
      gift_card_purchases: giftCardPurchasesInfo,
      gift_items: giftItemsInfo
    })
  } catch (error) {
    console.error('Database diagnostic failed:', error)
    return NextResponse.json(
      { error: 'Failed to run database diagnostic', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

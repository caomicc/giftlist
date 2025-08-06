"use client"

import { useState, useEffect } from "react"
import { sql } from "@/lib/neon"
import type { FamilyMember, GiftItem } from "@/lib/neon"

export function useGiftData() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [giftItems, setGiftItems] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch family members
  const fetchFamilyMembers = async () => {
    try {
      const data = await sql`SELECT * FROM family_members ORDER BY name`
      setFamilyMembers(data as FamilyMember[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch family members")
    }
  }

  // Fetch gift items
  const fetchGiftItems = async () => {
    try {
      const data = await sql`SELECT * FROM gift_items ORDER BY created_at DESC`
      setGiftItems(data as GiftItem[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gift items")
    }
  }

  // Add gift item
  const addGiftItem = async (item: {
    name: string
    description?: string
    price?: string
    link?: string
    owner_id: string
  }) => {
    try {
      const data = await sql`
        INSERT INTO gift_items (name, description, price, link, owner_id)
        VALUES (${item.name}, ${item.description || null}, ${item.price || null}, ${item.link || null}, ${item.owner_id})
        RETURNING *
      `
      
      const newItem = data[0] as GiftItem
      setGiftItems((prev) => [newItem, ...prev])
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add gift item")
      throw err
    }
  }

  // Remove gift item
  const removeGiftItem = async (itemId: string) => {
    try {
      await sql`DELETE FROM gift_items WHERE id = ${itemId}`
      setGiftItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove gift item")
      throw err
    }
  }

  // Mark item as purchased/unpurchased
  const togglePurchaseStatus = async (itemId: string, purchasedBy: string | null) => {
    try {
      const data = await sql`
        UPDATE gift_items 
        SET purchased_by = ${purchasedBy}
        WHERE id = ${itemId}
        RETURNING *
      `
      
      const updatedItem = data[0] as GiftItem
      setGiftItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)))
      return updatedItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update purchase status")
      throw err
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([fetchFamilyMembers(), fetchGiftItems()])
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return {
    familyMembers,
    giftItems,
    loading,
    error,
    addGiftItem,
    removeGiftItem,
    togglePurchaseStatus,
    refetch: () => Promise.all([fetchFamilyMembers(), fetchGiftItems()]),
  }
}

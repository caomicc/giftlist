"use client"

import { useState, useEffect } from "react"
import type { User, GiftItem } from "@/lib/neon"

export function useGiftData() {
  const [users, setUsers] = useState<User[]>([])
  const [giftItems, setGiftItems] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/family-members')
      if (!response.ok) throw new Error('Failed to fetch users')
      const { users } = await response.json()
      setUsers(users as User[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users")
    }
  }

  // Fetch gift items
  const fetchGiftItems = async () => {
    try {
      const response = await fetch('/api/gift-items')
      if (!response.ok) throw new Error('Failed to fetch gift items')
      const { giftItems } = await response.json()
      setGiftItems(giftItems as GiftItem[])
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
      const response = await fetch('/api/gift-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      })

      if (!response.ok) throw new Error('Failed to add gift item')
      const { giftItem } = await response.json()

      setGiftItems((prev) => [giftItem, ...prev])
      return giftItem as GiftItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add gift item")
      throw err
    }
  }

  // Update gift item
  const updateGiftItem = async (itemId: string, updates: {
    name?: string
    description?: string
    price?: string
    link?: string
  }) => {
    try {
      const response = await fetch('/api/gift-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: itemId, ...updates }),
      })

      if (!response.ok) throw new Error('Failed to update gift item')
      const { giftItem } = await response.json()

      setGiftItems((prev) => prev.map((item) => (item.id === itemId ? giftItem : item)))
      return giftItem as GiftItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update gift item")
      throw err
    }
  }

  // Remove gift item
  const removeGiftItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/gift-items?id=${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove gift item')
      setGiftItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove gift item")
      throw err
    }
  }

  // Mark item as purchased/unpurchased
  const togglePurchaseStatus = async (itemId: string, purchasedBy: string | null) => {
    try {
      const response = await fetch('/api/gift-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: itemId, purchased_by: purchasedBy }),
      })

      if (!response.ok) throw new Error('Failed to update purchase status')
      const { giftItem } = await response.json()

      setGiftItems((prev) => prev.map((item) => (item.id === itemId ? giftItem : item)))
      return giftItem as GiftItem
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
        await Promise.all([fetchUsers(), fetchGiftItems()])
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return {
    users,
    giftItems,
    loading,
    error,
    addGiftItem,
    updateGiftItem,
    removeGiftItem,
    togglePurchaseStatus,
    refetch: () => Promise.all([fetchUsers(), fetchGiftItems()]),
  }
}

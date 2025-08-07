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
    list_id: string
    is_gift_card?: boolean
    gift_card_target_amount?: number
    og_title?: string
    og_description?: string
    og_image?: string
    og_site_name?: string
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
    is_gift_card?: boolean
    gift_card_target_amount?: number
    og_title?: string
    og_description?: string
    og_image?: string
    og_site_name?: string
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

  // Archive/unarchive item
  const toggleArchiveStatus = async (itemId: string) => {
    try {
      // Get current item to toggle its archive status
      const currentItem = giftItems.find(item => item.id === itemId)
      if (!currentItem) throw new Error('Item not found')

      const response = await fetch('/api/gift-items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: itemId, archived: !currentItem.archived }),
      })

      if (!response.ok) throw new Error('Failed to update archive status')
      const { giftItem } = await response.json()

      setGiftItems((prev) => prev.map((item) => (item.id === itemId ? giftItem : item)))
      return giftItem as GiftItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update archive status")
      throw err
    }
  }

  // Add gift card purchase
  const addGiftCardPurchase = async (giftItemId: string, purchaserId: string, amount: number) => {
    try {
      const response = await fetch('/api/gift-card-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gift_item_id: giftItemId,
          purchaser_id: purchaserId,
          amount
        }),
      })

      if (!response.ok) throw new Error('Failed to add gift card purchase')
      const { purchase, giftItem } = await response.json()

      setGiftItems((prev) => prev.map((item) => (item.id === giftItemId ? giftItem : item)))
      return { purchase, giftItem }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add gift card purchase")
      throw err
    }
  }

  // Edit gift card purchase
  const editGiftCardPurchase = async (purchaseId: string, amount: number) => {
    try {
      const response = await fetch(`/api/gift-card-purchases?id=${purchaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      })

      if (!response.ok) throw new Error('Failed to edit gift card purchase')
      const { purchase, giftItem } = await response.json()

      setGiftItems((prev) => prev.map((item) => (item.id === giftItem.id ? giftItem : item)))
      return { purchase, giftItem }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit gift card purchase")
      throw err
    }
  }

  // Delete gift card purchase
  const deleteGiftCardPurchase = async (purchaseId: string) => {
    try {
      const response = await fetch(`/api/gift-card-purchases?id=${purchaseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete gift card purchase')
      const { giftItem } = await response.json()

      setGiftItems((prev) => prev.map((item) => (item.id === giftItem.id ? giftItem : item)))
      return { giftItem }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete gift card purchase")
      throw err
    }
  }

  // Get gift card purchases
  const getGiftCardPurchases = async (giftItemId: string) => {
    try {
      const response = await fetch(`/api/gift-card-purchases?gift_item_id=${giftItemId}`)
      if (!response.ok) throw new Error('Failed to fetch gift card purchases')
      const { purchases } = await response.json()
      return purchases
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gift card purchases")
      throw err
    }
  }

  // Fetch OpenGraph data
  const fetchOGData = async (url: string) => {
    try {
      const response = await fetch('/api/og-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch OG data')
      }

      const { ogData } = await response.json()
      return ogData
    } catch (err) {
      console.warn('Failed to fetch OG data for URL:', url, err)
      // Don't set error state for OG data failures, just log and return null
      // This allows the form to continue working even if OG data can't be fetched
      return null
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
    toggleArchiveStatus,
    addGiftCardPurchase,
    editGiftCardPurchase,
    deleteGiftCardPurchase,
    getGiftCardPurchases,
    fetchOGData,
    refetch: () => Promise.all([fetchUsers(), fetchGiftItems()]),
  }
}

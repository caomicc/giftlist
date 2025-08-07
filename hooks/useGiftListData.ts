"use client"

import { useState, useEffect } from "react"
import type { User, List, GiftItem } from "@/lib/neon"

interface ExtendedGiftItem extends GiftItem {
  is_public?: boolean
  list_name?: string
  list_owner_id?: string
  owner_name?: string
  purchaser_name?: string
}

interface ListWithStats extends List {
  item_count?: number
  purchased_count?: number
}

export function useGiftListData(currentUserId?: string) {
  const [users, setUsers] = useState<User[]>([])
  const [lists, setLists] = useState<ListWithStats[]>([])
  const [giftItems, setGiftItems] = useState<ExtendedGiftItem[]>([])
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

  // Fetch lists
  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (!response.ok) throw new Error('Failed to fetch lists')
      const data = await response.json()
      setLists(data as ListWithStats[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lists")
    }
  }

  // Fetch gift items with privacy logic
  const fetchGiftItems = async (listId?: string) => {
    try {
      const url = listId ? `/api/gift-items?list_id=${listId}` : '/api/gift-items'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch gift items')
      const { giftItems } = await response.json()
      
      // Apply privacy logic: if list is private and current user is the owner,
      // hide purchase information from the owner
      const processedItems = (giftItems as ExtendedGiftItem[]).map(item => {
        if (item.is_public === false && item.owner_id === currentUserId) {
          // Hide purchase information for private lists owned by current user
          return {
            ...item,
            purchased_by: null,
            purchaser_name: null
          }
        }
        return item
      })
      
      setGiftItems(processedItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gift items")
    }
  }

  // Add list
  const addList = async (list: {
    name: string
    description?: string
    is_public?: boolean
  }) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(list),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add list')
      }
      const newList = await response.json()

      setLists((prev) => [{ ...newList, item_count: 0, purchased_count: 0 }, ...prev])
      return newList as List
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add list")
      throw err
    }
  }

  // Update list
  const updateList = async (listId: string, updates: {
    name?: string
    description?: string
    is_public?: boolean
  }) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update list')
      }
      const updatedList = await response.json()

      setLists((prev) => prev.map((list) => (list.id === listId ? { ...list, ...updatedList } : list)))
      
      // If privacy setting changed, refetch gift items to apply new privacy logic
      if (updates.is_public !== undefined) {
        await fetchGiftItems()
      }
      
      return updatedList as List
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update list")
      throw err
    }
  }

  // Remove list
  const removeList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove list')
      }
      
      setLists((prev) => prev.filter((list) => list.id !== listId))
      setGiftItems((prev) => prev.filter((item) => item.list_id !== listId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove list")
      throw err
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
      
      // Update list stats
      setLists((prev) => prev.map((list) => 
        list.id === item.list_id 
          ? { ...list, item_count: (list.item_count || 0) + 1 }
          : list
      ))
      
      return giftItem as GiftItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add gift item")
      throw err
    }
  }

  // Mark item as purchased/unpurchased with privacy logic
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

      // Apply privacy logic before updating state
      const processedItem = { ...giftItem } as ExtendedGiftItem
      if (processedItem.is_public === false && processedItem.owner_id === currentUserId) {
        processedItem.purchased_by = null
        processedItem.purchaser_name = null
      }

      setGiftItems((prev) => prev.map((item) => (item.id === itemId ? processedItem : item)))
      return processedItem as GiftItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update purchase status")
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
      
      const removedItem = giftItems.find(item => item.id === itemId)
      setGiftItems((prev) => prev.filter((item) => item.id !== itemId))
      
      // Update list stats
      if (removedItem) {
        setLists((prev) => prev.map((list) => 
          list.id === removedItem.list_id 
            ? { 
                ...list, 
                item_count: Math.max((list.item_count || 1) - 1, 0),
                purchased_count: removedItem.purchased_by 
                  ? Math.max((list.purchased_count || 1) - 1, 0)
                  : list.purchased_count
              }
            : list
        ))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove gift item")
      throw err
    }
  }

  // Get lists for a specific user (useful for baby lists)
  const getListsForUser = (userId: string) => {
    return lists.filter(list => list.owner_id === userId)
  }

  // Get items for a specific list with privacy applied
  const getItemsForList = (listId: string) => {
    return giftItems.filter(item => item.list_id === listId)
  }

  // Check if current user can see purchase status for an item
  const canSeePurchaseStatus = (item: ExtendedGiftItem) => {
    // If list is public, everyone can see purchase status
    if (item.is_public !== false) return true
    
    // If list is private and current user is not the owner, they can see purchase status
    if (item.owner_id !== currentUserId) return true
    
    // If list is private and current user is the owner, they cannot see purchase status
    return false
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([fetchUsers(), fetchLists(), fetchGiftItems()])
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUserId])

  return {
    users,
    lists,
    giftItems,
    loading,
    error,
    addList,
    updateList,
    removeList,
    addGiftItem,
    removeGiftItem,
    togglePurchaseStatus,
    getListsForUser,
    getItemsForList,
    canSeePurchaseStatus,
    refetch: () => Promise.all([fetchUsers(), fetchLists(), fetchGiftItems()]),
  }
}
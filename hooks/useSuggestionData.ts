"use client"

import { useState, useEffect, useCallback } from "react"
import type { GiftSuggestion } from "@/lib/neon"

export function useSuggestionData() {
  const [incomingSuggestions, setIncomingSuggestions] = useState<GiftSuggestion[]>([])
  const [outgoingSuggestions, setOutgoingSuggestions] = useState<GiftSuggestion[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch pending count
  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await fetch('/api/gift-suggestions?type=pending_count', {
        credentials: 'include'
      })
      if (response.status === 401) {
        // User not authenticated, return 0 silently
        return 0
      }
      if (!response.ok) {
        console.warn('Pending count fetch failed with status:', response.status)
        return 0
      }
      const { count } = await response.json()
      setPendingCount(count)
      return count
    } catch (err) {
      console.warn('Failed to fetch pending count:', err)
      return 0
    }
  }, [])

  // Fetch incoming suggestions
  const fetchIncoming = useCallback(async () => {
    try {
      const response = await fetch('/api/gift-suggestions?type=incoming', {
        credentials: 'include'
      })
      if (response.status === 401) {
        // User not authenticated, return empty array silently
        setIncomingSuggestions([])
        return []
      }
      if (!response.ok) {
        console.warn('Incoming suggestions fetch failed with status:', response.status)
        setIncomingSuggestions([])
        return []
      }
      const { suggestions } = await response.json()
      setIncomingSuggestions(suggestions as GiftSuggestion[])
      return suggestions
    } catch (err) {
      console.warn('Failed to fetch incoming suggestions:', err)
      setIncomingSuggestions([])
      return []
    }
  }, [])

  // Fetch outgoing suggestions
  const fetchOutgoing = useCallback(async () => {
    try {
      const response = await fetch('/api/gift-suggestions?type=outgoing', {
        credentials: 'include'
      })
      if (response.status === 401) {
        // User not authenticated, return empty array silently
        setOutgoingSuggestions([])
        return []
      }
      if (!response.ok) {
        console.warn('Outgoing suggestions fetch failed with status:', response.status)
        setOutgoingSuggestions([])
        return []
      }
      const { suggestions } = await response.json()
      setOutgoingSuggestions(suggestions as GiftSuggestion[])
      return suggestions
    } catch (err) {
      console.warn('Failed to fetch outgoing suggestions:', err)
      setOutgoingSuggestions([])
      return []
    }
  }, [])

  // Create a new suggestion
  const createSuggestion = async (suggestion: {
    target_user_id: string
    name?: string
    description?: string
    price?: string
    link?: string
    image_url?: string
    is_anonymous?: boolean
    og_title?: string
    og_description?: string
    og_image?: string
    og_site_name?: string
  }) => {
    try {
      const response = await fetch('/api/gift-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(suggestion),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create suggestion')
      }

      const { suggestion: newSuggestion } = await response.json()
      setOutgoingSuggestions((prev) => [newSuggestion, ...prev])
      return newSuggestion as GiftSuggestion
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create suggestion")
      throw err
    }
  }

  // Approve a suggestion
  const approveSuggestion = async (suggestionId: string, listId: string) => {
    try {
      const response = await fetch('/api/gift-suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: suggestionId,
          action: 'approve',
          list_id: listId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve suggestion')
      }

      const { giftItem } = await response.json()

      // Update local state
      setIncomingSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId ? { ...s, status: 'approved' as const } : s
        )
      )
      setPendingCount((prev) => Math.max(0, prev - 1))

      return giftItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve suggestion")
      throw err
    }
  }

  // Deny a suggestion
  const denySuggestion = async (suggestionId: string, denialReason?: string) => {
    try {
      const response = await fetch('/api/gift-suggestions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: suggestionId,
          action: 'deny',
          denial_reason: denialReason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to deny suggestion')
      }

      // Update local state
      setIncomingSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? { ...s, status: 'denied' as const, denial_reason: denialReason || null }
            : s
        )
      )
      setPendingCount((prev) => Math.max(0, prev - 1))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deny suggestion")
      throw err
    }
  }

  // Delete a pending suggestion (only for suggester)
  const deleteSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/gift-suggestions?id=${suggestionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete suggestion')
      }

      setOutgoingSuggestions((prev) => prev.filter((s) => s.id !== suggestionId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete suggestion")
      throw err
    }
  }

  // Refetch all data
  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchIncoming(), fetchOutgoing(), fetchPendingCount()])
    } catch (err) {
      console.error("Failed to fetch suggestions data", err)
    } finally {
      setLoading(false)
    }
  }, [fetchIncoming, fetchOutgoing, fetchPendingCount])

  // Initial data fetch
  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    incomingSuggestions,
    outgoingSuggestions,
    pendingCount,
    loading,
    error,
    createSuggestion,
    approveSuggestion,
    denySuggestion,
    deleteSuggestion,
    fetchPendingCount,
    refetch,
  }
}

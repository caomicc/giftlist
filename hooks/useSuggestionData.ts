"use client"

import { useState, useEffect, useCallback } from "react"
import type { GiftSuggestion } from "@/lib/neon"

// Plain data functions (no React state), so effects can call them and set state in callbacks.
async function getSuggestionsJson(type: string) {
  const response = await fetch(`/api/gift-suggestions?type=${type}`, { credentials: 'include' })
  if (response.ok) return response.json()
  if (response.status !== 401) console.warn(`Suggestions (${type}) fetch failed with status:`, response.status)
  return null // 401: signed out
}

async function getSuggestions(type: 'incoming' | 'outgoing'): Promise<GiftSuggestion[]> {
  try {
    return ((await getSuggestionsJson(type))?.suggestions ?? []) as GiftSuggestion[]
  } catch (err) {
    console.warn(`Failed to fetch ${type} suggestions:`, err)
    return []
  }
}

async function getPendingCount(): Promise<number> {
  try {
    return (await getSuggestionsJson('pending_count'))?.count ?? 0
  } catch (err) {
    console.warn('Failed to fetch pending count:', err)
    return 0
  }
}

const loadAll = () => Promise.all([getSuggestions('incoming'), getSuggestions('outgoing'), getPendingCount()])

export function useSuggestionData() {
  const [incomingSuggestions, setIncomingSuggestions] = useState<GiftSuggestion[]>([])
  const [outgoingSuggestions, setOutgoingSuggestions] = useState<GiftSuggestion[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyAll = ([incoming, outgoing, count]: Awaited<ReturnType<typeof loadAll>>) => {
    setIncomingSuggestions(incoming)
    setOutgoingSuggestions(outgoing)
    setPendingCount(count)
  }

  const fetchPendingCount = useCallback(async () => {
    const count = await getPendingCount()
    setPendingCount(count)
    return count
  }, [])

  // Create a new suggestion
  const createSuggestion = async (suggestion: {
    target_user_id: string
    name?: string
    description?: string
    price?: string
    currency?: string
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
      applyAll(await loadAll())
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data fetch (loading starts true)
  useEffect(() => {
    let ignore = false
    loadAll()
      .then(results => { if (!ignore) applyAll(results) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

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

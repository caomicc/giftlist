"use client"

import { useState, useCallback } from "react"
import type { GiftItemComment } from "@/lib/neon"

export function useGiftItemComments(giftItemId: string | null) {
  const [comments, setComments] = useState<GiftItemComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch comments for a gift item
  const fetchComments = useCallback(async () => {
    if (!giftItemId) {
      setComments([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/gift-item-comments?gift_item_id=${giftItemId}`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      const { comments: fetchedComments } = await response.json()
      setComments(fetchedComments as GiftItemComment[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch comments")
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [giftItemId])

  // Add a new comment
  const addComment = async (content: string) => {
    if (!giftItemId || !content.trim()) return null

    try {
      const response = await fetch('/api/gift-item-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gift_item_id: giftItemId,
          content: content.trim(),
        }),
      })

      if (!response.ok) throw new Error('Failed to add comment')
      const { comment } = await response.json()

      // Optimistically add to the list
      setComments((prev) => [...prev, comment as GiftItemComment])
      return comment as GiftItemComment
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment")
      throw err
    }
  }

  // Delete a comment
  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/gift-item-comments?id=${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete comment')

      // Optimistically remove from the list
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment")
      throw err
    }
  }

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    deleteComment,
  }
}

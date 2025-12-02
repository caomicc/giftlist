"use client"

import { useState, useEffect } from "react"
import type { User, List } from "@/lib/neon"

export function useListData() {
  const [users, setUsers] = useState<User[]>([])
  const [lists, setLists] = useState<List[]>([])
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
      setLists(data as List[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lists")
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

      setLists((prev) => [newList, ...prev])
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

      setLists((prev) => prev.map((list) => (list.id === listId ? updatedList : list)))
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove list")
      throw err
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        await Promise.all([fetchUsers(), fetchLists()])
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return {
    users,
    lists,
    loading,
    error,
    addList,
    updateList,
    removeList,
    refetch: () => Promise.all([fetchUsers(), fetchLists()]),
  }
}
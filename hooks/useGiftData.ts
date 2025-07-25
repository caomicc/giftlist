"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/lib/supabase"

type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"]
type GiftItem = Database["public"]["Tables"]["gift_items"]["Row"]

export function useGiftData() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [giftItems, setGiftItems] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch family members
  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase.from("family_members").select("*").order("name")

      if (error) throw error
      setFamilyMembers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch family members")
    }
  }

  // Fetch gift items
  const fetchGiftItems = async () => {
    try {
      const { data, error } = await supabase.from("gift_items").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setGiftItems(data || [])
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
      const { data, error } = await supabase.from("gift_items").insert([item]).select().single()

      if (error) throw error
      setGiftItems((prev) => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add gift item")
      throw err
    }
  }

  // Remove gift item
  const removeGiftItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("gift_items").delete().eq("id", itemId)

      if (error) throw error
      setGiftItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove gift item")
      throw err
    }
  }

  // Mark item as purchased/unpurchased
  const togglePurchaseStatus = async (itemId: string, purchasedBy: string | null) => {
    try {
      const { data, error } = await supabase
        .from("gift_items")
        .update({ purchased_by: purchasedBy })
        .eq("id", itemId)
        .select()
        .single()

      if (error) throw error
      setGiftItems((prev) => prev.map((item) => (item.id === itemId ? data : item)))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update purchase status")
      throw err
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchFamilyMembers(), fetchGiftItems()])
      setLoading(false)
    }

    fetchData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const giftItemsSubscription = supabase
      .channel("gift_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "gift_items" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setGiftItems((prev) => [payload.new as GiftItem, ...prev])
        } else if (payload.eventType === "UPDATE") {
          setGiftItems((prev) => prev.map((item) => (item.id === payload.new.id ? (payload.new as GiftItem) : item)))
        } else if (payload.eventType === "DELETE") {
          setGiftItems((prev) => prev.filter((item) => item.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      giftItemsSubscription.unsubscribe()
    }
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

"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Lightbulb, Clock, ChevronRight, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ActivityFeed, type ActivityItem } from "./activity-feed"
import SuggestionsView from "./suggestions-view"
import { useTranslation } from "./i18n-provider"
import type { GiftSuggestion, List } from "@/lib/neon"

interface HomeViewProps {
  activities: ActivityItem[]
  incomingSuggestions: GiftSuggestion[]
  outgoingSuggestions: GiftSuggestion[]
  userLists: List[]
  pendingSuggestionCount: number
  currentUserId: string
  locale: string
}

export function HomeView({
  activities,
  incomingSuggestions,
  outgoingSuggestions,
  userLists,
  pendingSuggestionCount,
  currentUserId,
  locale,
}: HomeViewProps) {
  const { t } = useTranslation("gifts")
  const { t: tCommon } = useTranslation("common")
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(pendingSuggestionCount)
  const [suggestions, setSuggestions] = useState({
    incoming: incomingSuggestions,
    outgoing: outgoingSuggestions,
  })

  const handleApproveSuggestion = useCallback(
    async (suggestionId: string, listId: string) => {
      const response = await fetch("/api/gift-suggestions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: suggestionId,
          action: "approve",
          list_id: listId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve suggestion")
      }

      // Update local state
      setSuggestions((prev) => ({
        ...prev,
        incoming: prev.incoming.map((s) =>
          s.id === suggestionId ? { ...s, status: "approved" as const } : s
        ),
      }))
      setPendingCount((prev) => Math.max(0, prev - 1))
      router.refresh()
    },
    [router]
  )

  const handleDenySuggestion = useCallback(
    async (suggestionId: string, reason?: string) => {
      const response = await fetch("/api/gift-suggestions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: suggestionId,
          action: "deny",
          denial_reason: reason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to deny suggestion")
      }

      // Update local state
      setSuggestions((prev) => ({
        ...prev,
        incoming: prev.incoming.map((s) =>
          s.id === suggestionId
            ? { ...s, status: "denied" as const, denial_reason: reason || null }
            : s
        ),
      }))
      setPendingCount((prev) => Math.max(0, prev - 1))
      router.refresh()
    },
    [router]
  )

  const handleDeleteSuggestion = useCallback(
    async (suggestionId: string) => {
      const response = await fetch(`/api/gift-suggestions?id=${suggestionId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete suggestion")
      }

      // Update local state
      setSuggestions((prev) => ({
        ...prev,
        outgoing: prev.outgoing.filter((s) => s.id !== suggestionId),
      }))
      router.refresh()
    },
    [router]
  )

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {tCommon.bottomNav?.home || "Home"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t.home?.subtitle || "Your gift coordination hub"}
        </p>
      </div>

      {/* Suggestions Section */}
      {(pendingCount > 0 || suggestions.incoming.length > 0 || suggestions.outgoing.length > 0) && (
        <SuggestionsView
          incomingSuggestions={suggestions.incoming}
          outgoingSuggestions={suggestions.outgoing}
          userLists={userLists}
          pendingCount={pendingCount}
          onApprove={handleApproveSuggestion}
          onDeny={handleDenySuggestion}
          onDelete={handleDeleteSuggestion}
        />
      )}

      {/* Activity Feed Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            {t.activity?.title || "Recent Activity"}
          </h2>
        </div>
        <ActivityFeed
          activities={activities}
          currentUserId={currentUserId}
          locale={locale}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => router.push(`/${locale}/browse`)}
        >
          <Inbox className="w-5 h-5" />
          <span className="text-sm">{tCommon.bottomNav?.browse || "Browse"}</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => router.push(`/${locale}/my-lists`)}
        >
          <Lightbulb className="w-5 h-5" />
          <span className="text-sm">{tCommon.bottomNav?.myLists || "My Lists"}</span>
        </Button>
      </div>
    </div>
  )
}

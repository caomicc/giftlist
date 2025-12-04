"use client"

import { Gift, ShoppingCart, Clock, MessageCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation, formatMessage } from "./i18n-provider"
import { formatDistanceToNow } from "date-fns"
import { enUS, ru } from "date-fns/locale"

export interface ActivityItem {
  id: string
  type: "added" | "claimed" | "unclaimed" | "updated" | "commented"
  item_name: string
  owner_name: string
  owner_id: string
  list_name: string
  actor_name: string | null
  actor_id: string | null
  updated_at: string
  created_at: string
  comment_preview?: string | null
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  currentUserId: string
  locale: string
}

export function ActivityFeed({
  activities,
  currentUserId,
  locale,
}: ActivityFeedProps) {
  const { t } = useTranslation("gifts")

  const getDateLocale = () => {
    return locale === "ru" ? ru : enUS
  }

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "added":
        return <Gift className="h-4 w-4 text-green-600" />
      case "claimed":
        return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case "unclaimed":
        return <ShoppingCart className="h-4 w-4 text-gray-400" />
      case "updated":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "commented":
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      default:
        return <Gift className="h-4 w-4" />
    }
  }

  const getActivityMessage = (activity: ActivityItem) => {
    const isOwner = activity.owner_id === currentUserId
    const isActor = activity.actor_id === currentUserId
    const ownerName = isOwner
      ? t.activity?.you || "You"
      : activity.owner_name
    const actorName = isActor
      ? t.activity?.you || "You"
      : activity.actor_name || t.activity?.someone || "Someone"

    switch (activity.type) {
      case "added":
        return formatMessage(
          t.activity?.itemAdded || "{{owner}} added {{item}} to {{list}}",
          {
            owner: ownerName,
            item: activity.item_name,
            list: activity.list_name,
          }
        )
      case "claimed":
        return formatMessage(
          t.activity?.itemClaimed || "{{actor}} claimed {{item}} from {{owner}}'s list",
          {
            actor: actorName,
            item: activity.item_name,
            owner: isOwner ? (t.activity?.your || "your") : `${activity.owner_name}'s`,
          }
        )
      case "unclaimed":
        return formatMessage(
          t.activity?.itemUnclaimed || "{{actor}} unclaimed {{item}}",
          {
            actor: actorName,
            item: activity.item_name,
          }
        )
      case "updated":
        return formatMessage(
          t.activity?.itemUpdated || "{{item}} was updated on {{owner}}'s list",
          {
            item: activity.item_name,
            owner: isOwner ? (t.activity?.your || "your") : `${activity.owner_name}'s`,
          }
        )
      case "commented":
        return formatMessage(
          t.activity?.itemCommented || "{{actor}} commented on {{item}}",
          {
            actor: actorName,
            item: activity.item_name,
          }
        )
      default:
        return activity.item_name
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: getDateLocale(),
      })
    } catch {
      return ""
    }
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t.activity?.empty || "No recent activity"}</p>
          <p className="text-sm mt-1">
            {t.activity?.emptyHelp ||
              "Gift updates from your family will appear here."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <Card key={activity.id} className="py-0">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 p-2 bg-muted rounded-full">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{getActivityMessage(activity)}</p>
                {activity.type === "commented" && activity.comment_preview && (
                  <p className="text-sm text-muted-foreground mt-1 italic line-clamp-2">
                    "{activity.comment_preview}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(activity.updated_at || activity.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

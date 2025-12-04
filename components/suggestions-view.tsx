"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Check,
  X,
  ExternalLink,
  Inbox,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  UserX,
  Trash2,
  Lightbulb,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation, formatMessage } from "./i18n-provider"
import type { GiftSuggestion, List } from "@/lib/neon"

interface SuggestionsViewProps {
  incomingSuggestions: GiftSuggestion[]
  outgoingSuggestions: GiftSuggestion[]
  userLists: List[]
  pendingCount: number
  onApprove: (suggestionId: string, listId: string) => Promise<void>
  onDeny: (suggestionId: string, reason?: string) => Promise<void>
  onDelete: (suggestionId: string) => Promise<void>
}

export default function SuggestionsView({
  incomingSuggestions,
  outgoingSuggestions,
  userLists,
  pendingCount,
  onApprove,
  onDeny,
  onDelete,
}: SuggestionsViewProps) {
  const { t } = useTranslation("gifts")
  const [activeTab, setActiveTab] = useState("incoming")
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<GiftSuggestion | null>(null)
  const [selectedListId, setSelectedListId] = useState("")
  const [denialReason, setDenialReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const pendingIncoming = incomingSuggestions.filter((s) => s.status === "pending")
  const processedIncoming = incomingSuggestions.filter((s) => s.status !== "pending")

  const handleApproveClick = (suggestion: GiftSuggestion) => {
    setSelectedSuggestion(suggestion)
    setSelectedListId(userLists.length > 0 ? userLists[0].id : "")
    setApproveDialogOpen(true)
  }

  const handleDenyClick = (suggestion: GiftSuggestion) => {
    setSelectedSuggestion(suggestion)
    setDenialReason("")
    setDenyDialogOpen(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedSuggestion || !selectedListId) return
    setIsProcessing(true)
    try {
      await onApprove(selectedSuggestion.id, selectedListId)
      setApproveDialogOpen(false)
      setSelectedSuggestion(null)
    } catch (error) {
      console.error("Failed to approve:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDenyConfirm = async () => {
    if (!selectedSuggestion) return
    setIsProcessing(true)
    try {
      await onDeny(selectedSuggestion.id, denialReason || undefined)
      setDenyDialogOpen(false)
      setSelectedSuggestion(null)
      setDenialReason("")
    } catch (error) {
      console.error("Failed to deny:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteClick = async (suggestion: GiftSuggestion) => {
    if (!confirm(t.suggestions?.confirmDelete || "Are you sure you want to delete this suggestion?")) return
    try {
      await onDelete(suggestion.id)
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            {t.suggestions?.status?.pending || "Pending"}
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t.suggestions?.status?.approved || "Approved"}
          </Badge>
        )
      case "denied":
        return (
          <Badge variant="outline" className="text-red-600 border-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            {t.suggestions?.status?.denied || "Declined"}
          </Badge>
        )
      default:
        return null
    }
  }

  const renderSuggestionCard = (
    suggestion: GiftSuggestion,
    variant: "incoming" | "outgoing"
  ) => {
    const previewImage = suggestion.og_image || suggestion.image_url
    const isPending = suggestion.status === "pending"

    return (
      <Card key={suggestion.id} className={cn(!isPending && "opacity-75", 'py-0 overflow-hidden')}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            {/* Thumbnail */}
            {previewImage && (
              <div className="shrink-0">
                <img
                  src={previewImage}
                  alt={suggestion.name}
                  className="size-16 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">{suggestion.name}</h4>
                  {variant === "incoming" && (
                    <p className="text-sm text-muted-foreground truncate">
                      {suggestion.is_anonymous && isPending ? (
                        <span className="flex items-center gap-1">
                          <UserX className="w-3 h-3 shrink-0" />
                          {t.suggestions?.fromAnonymous || "From: Anonymous"}
                        </span>
                      ) : (
                        formatMessage(t.suggestions?.fromName || "From: {{name}}", {
                          name: suggestion.suggested_by_name || "Unknown",
                        })
                      )}
                    </p>
                  )}
                  {variant === "outgoing" && (
                    <p className="text-sm text-muted-foreground truncate">
                      {formatMessage(t.suggestions?.toName || "To: {{name}}", {
                        name: suggestion.target_user_name || "Unknown",
                      })}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {getStatusBadge(suggestion.status)}
                </div>
              </div>

              {suggestion.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {suggestion.description}
                </p>
              )}

              {suggestion.price && (
                <p className="text-sm font-medium mt-1">{suggestion.price}</p>
              )}

              {/* Denial reason for outgoing denied suggestions */}
              {variant === "outgoing" && suggestion.status === "denied" && suggestion.denial_reason && (
                <p className="text-sm text-red-600 mt-2 italic">
                  {formatMessage(t.suggestions?.reasonGiven || "Reason: {{reason}}", {
                    reason: suggestion.denial_reason,
                  })}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {suggestion.link && (
                  <Button variant="ghost" size="sm" asChild className="h-9">
                    <a href={suggestion.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      {t.suggestions?.viewLink || "View"}
                    </a>
                  </Button>
                )}

                {variant === "incoming" && isPending && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 h-9"
                      onClick={() => handleApproveClick(suggestion)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {t.suggestions?.approve || "Add to List"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 h-9"
                      onClick={() => handleDenyClick(suggestion)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      {t.suggestions?.deny || "Decline"}
                    </Button>
                  </>
                )}

                {variant === "outgoing" && isPending && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                    onClick={() => handleDeleteClick(suggestion)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t.suggestions?.delete || "Delete"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h2 className="text-xl font-semibold">
          {t.suggestions?.title || "Gift Suggestions"}
        </h2>
        {pendingCount > 0 && (
          <Badge className="bg-red-500 text-white">{pendingCount}</Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming" className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            {t.suggestions?.incoming || "Incoming"}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            {t.suggestions?.sent || "Sent"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3 mt-4">
          {pendingIncoming.length === 0 && processedIncoming.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t.suggestions?.noIncoming || "No suggestions yet"}</p>
                <p className="text-sm mt-1">
                  {t.suggestions?.noIncomingHelp ||
                    "When someone suggests a gift for you, it will appear here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {pendingIncoming.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t.suggestions?.pendingSection || "Pending Review"}
                  </h3>
                  {pendingIncoming.map((s) => renderSuggestionCard(s, "incoming"))}
                </div>
              )}

              {processedIncoming.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t.suggestions?.processedSection || "Previously Reviewed"}
                  </h3>
                  {processedIncoming.map((s) => renderSuggestionCard(s, "incoming"))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-3 mt-4">
          {outgoingSuggestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t.suggestions?.noOutgoing || "No suggestions sent"}</p>
                <p className="text-sm mt-1">
                  {t.suggestions?.noOutgoingHelp ||
                    "Suggestions you make to family members will appear here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            outgoingSuggestions.map((s) => renderSuggestionCard(s, "outgoing"))
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.suggestions?.approveTitle || "Add to Your List"}</DialogTitle>
            <DialogDescription>
              {formatMessage(
                t.suggestions?.approveDescription ||
                  'Choose which list to add "{{name}}" to.',
                { name: selectedSuggestion?.name || "" }
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>{t.suggestions?.selectList || "Select List"}:</Label>
            <Select value={selectedListId} onValueChange={setSelectedListId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t.suggestions?.selectListPlaceholder || "Choose a list..."} />
              </SelectTrigger>
              <SelectContent>
                {userLists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={isProcessing}
            >
              {t.suggestions?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={!selectedListId || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {t.suggestions?.confirmApprove || "Add to List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.suggestions?.denyTitle || "Decline Suggestion"}</DialogTitle>
            <DialogDescription>
              {formatMessage(
                t.suggestions?.denyDescription ||
                  'Optionally provide a reason for declining "{{name}}".',
                { name: selectedSuggestion?.name || "" }
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>
              {t.suggestions?.reasonLabel || "Reason"} ({t.suggestions?.optional || "optional"}):
            </Label>
            <Textarea
              className="mt-2"
              placeholder={t.suggestions?.reasonPlaceholder || "e.g., Already have one, Not my style, etc."}
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDenyDialogOpen(false)}
              disabled={isProcessing}
            >
              {t.suggestions?.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDenyConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {t.suggestions?.confirmDeny || "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

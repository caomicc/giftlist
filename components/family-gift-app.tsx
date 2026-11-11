"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Gift, AlertCircle } from 'lucide-react'
import { useGiftData } from "@/hooks/useGiftData"
import { useSuggestionData } from "@/hooks/useSuggestionData"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useConfirm } from "./confirm-dialog"
import { useI18n, formatMessage } from "./i18n-provider"

// Import our new components
import AddGiftForm from "./add-gift-form"
import EditGiftDialog from "./edit-gift-dialog"
import ListManagement from "./list-management"
import MyGiftsList from "./my-gifts-list"
import FamilyGiftsList from "./family-gifts-list"
import SuggestGiftDialog from "./suggest-gift-dialog"
import SuggestionsView from "./suggestions-view"

interface User {
  id: string
  name: string
  email: string
}

interface FamilyGiftAppProps {
  currentUser: User
}

export default function FamilyGiftApp({ currentUser }: FamilyGiftAppProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userLists, setUserLists] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("my-list")
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false)
  const [suggestTargetUserId, setSuggestTargetUserId] = useState<string | null>(null)
  const { translations } = useI18n()
  const t = translations.common || {}
  const tGifts = translations.gifts || {}
  const confirm = useConfirm()

  const {
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
    fetchOGData,
    refetch: refetchGifts
  } = useGiftData()

  const {
    incomingSuggestions,
    outgoingSuggestions,
    pendingCount,
    createSuggestion,
    approveSuggestion,
    denySuggestion,
    deleteSuggestion,
    refetch: refetchSuggestions
  } = useSuggestionData()

  // Fetch user's lists
  const fetchUserLists = async () => {
    try {
      const response = await fetch('/api/lists', {
        credentials: 'include'
      })
      if (response.status === 401) {
        // User not authenticated
        return
      }
      if (!response.ok) {
        console.warn('Failed to fetch lists with status:', response.status)
        return
      }
      const lists = await response.json()
      setUserLists(lists)
    } catch (err) {
      console.warn("Failed to fetch lists", err)
    }
  }

  // Create a default list for new users
  const createDefaultList = async () => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `${currentUser.name || 'My'}'s List`,
          description: 'Default wishlist',
          is_public: false,
          is_visible: true
        }),
      })

      if (response.status === 401) {
        // User not authenticated
        return
      }
      if (!response.ok) {
        console.warn('Failed to create default list with status:', response.status)
        return
      }
      const newList = await response.json()
      setUserLists([newList])
    } catch (err) {
      console.warn("Failed to create default list", err)
    }
  }

  // Initialize lists on component mount
  useEffect(() => {
    fetchUserLists()
  }, [])

  // Create default list if none exists
  useEffect(() => {
    if (userLists.length === 0 && !loading) {
      createDefaultList()
    }
  }, [userLists.length, loading])

  const handleAddGiftItem = async (itemData: any) => {
    setIsSubmitting(true)
    try {
      await addGiftItem(itemData)
    } catch (err) {
      console.error("Failed to add gift item", err)
      toast.error(tGifts.toasts?.saveFailed || "Couldn't save that. Try again.")
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditGiftItem = (item: any) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleUpdateGiftItem = async (itemData: any) => {
    if (!editingItem) return

    setIsSubmitting(true)
    try {
      await updateGiftItem(editingItem.id, itemData)
      setEditingItem(null)
    } catch (err) {
      console.error("Failed to update gift item", err)
      toast.error(tGifts.toasts?.saveFailed || "Couldn't save that. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveGiftItem = async (itemId: string) => {
    const name = giftItems.find((g: any) => g.id === itemId)?.name || ''
    const ok = await confirm({
      title: formatMessage(tGifts.deleteGift?.title || 'Delete "{{name}}"?', { name }),
      description: tGifts.deleteGift?.description || 'This removes it from your list for good. To hide it without losing it, archive it instead.',
    })
    if (!ok) return

    try {
      await removeGiftItem(itemId)
      toast(formatMessage(tGifts.toasts?.deleted || 'Deleted "{{name}}"', { name }))
    } catch (err) {
      console.error("Failed to remove gift item", err)
      toast.error(tGifts.toasts?.saveFailed || "Couldn't save that. Try again.")
    }
  }

  const handleTogglePurchase = async (itemId: string, currentPurchasedBy: string | null) => {
    const tToasts = tGifts.toasts || {}
    // Only the person who claimed a gift can release it
    if (currentPurchasedBy && currentPurchasedBy !== currentUser.id) return

    const isClaiming = !currentPurchasedBy
    try {
      await togglePurchaseStatus(itemId, isClaiming ? currentUser.id : null)

      if (!isClaiming) {
        toast(tToasts.released || "Unmarked. It's open again.")
        return
      }
      const item = giftItems.find((g: any) => g.id === itemId)
      const ownerName = users.find((u: any) => u.id === item?.owner_id)?.name
      if (item && item.is_public === false && ownerName) {
        toast.success(formatMessage(tToasts.claimedSurprise || "Marked as yours. {{name}} won't see this.", { name: ownerName }))
      } else {
        toast.success(tToasts.claimed || 'Marked as yours')
      }
    } catch (err: any) {
      console.error("Failed to toggle purchase status", err)
      if (err?.status === 403) {
        toast.error(tToasts.alreadyClaimed || 'Someone else already claimed this')
        refetchGifts()
      } else {
        toast.error(tToasts.saveFailed || "Couldn't save that. Try again.")
      }
    }
  }

  const handleGiftCardPurchase = async (itemId: string, amount: number) => {
    try {
      await addGiftCardPurchase(itemId, currentUser.id, amount)
      toast.success(tGifts.giftCard?.purchaseDialog?.success || 'Contribution recorded')
    } catch (err) {
      console.error("Failed to add gift card purchase", err)
      toast.error(tGifts.toasts?.saveFailed || "Couldn't save that. Try again.")
      // Rethrow so the contribution dialog stays open with the amount intact
      throw err
    }
  }

  const handleArchiveItem = async (itemId: string) => {
    try {
      await toggleArchiveStatus(itemId)
    } catch (err) {
      console.error("Failed to toggle archive status", err)
      toast.error(tGifts.toasts?.saveFailed || "Couldn't save that. Try again.")
    }
  }

  // Suggestion handlers
  const handleOpenSuggestDialog = (targetUserId: string) => {
    setSuggestTargetUserId(targetUserId)
    setSuggestDialogOpen(true)
  }

  const handleCloseSuggestDialog = () => {
    setSuggestDialogOpen(false)
    setSuggestTargetUserId(null)
  }

  const handleCreateSuggestion = async (suggestionData: any) => {
    await createSuggestion(suggestionData)
  }

  const handleApproveSuggestion = async (suggestionId: string, listId: string) => {
    await approveSuggestion(suggestionId, listId)
    // Refetch gift items to show the newly added item
    await refetchGifts()
  }

  const handleDenySuggestion = async (suggestionId: string, reason?: string) => {
    await denySuggestion(suggestionId, reason)
  }

  const handleDeleteSuggestion = async (suggestionId: string) => {
    await deleteSuggestion(suggestionId)
  }

  // List management handlers
  const handleCreateList = async (listData: any) => {
    setIsSubmitting(true)
    try {
      // Extract visibility settings
      const { visibility_mode, selected_users, ...restListData } = listData

      // Create the list first
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restListData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create list')
      }

      const newList = await response.json()

      // Set permissions only if NOT in "visible to all" mode
      if (visibility_mode !== 'all') {
        // Only store exceptions to the default:
        // - "hidden_from" mode: store can_view=false for selected users
        // - "visible_to" mode: store can_view=true for selected users
        const permissions = selected_users.map((userId: string) => ({
          user_id: userId,
          can_view: visibility_mode === "visible_to" // true for visible_to, false for hidden_from
        }))

        await fetch(`/api/lists/${newList.id}/permissions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permissions }),
        })
      }

      await fetchUserLists()
    } catch (err) {
      console.error("Failed to create list", err)
      toast.error(tGifts.toasts?.saveFailed || "Couldn't save that. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateList = async (listId: string, listData: any, permissions: any[]) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update list')
      }

      // Update permissions
      const permissionsResponse = await fetch(`/api/lists/${listId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (!permissionsResponse.ok) {
        console.warn('Failed to update list permissions')
      }

      await fetchUserLists()
    } catch (err) {
      console.error("Failed to update list", err)
      toast.error(tGifts.toasts?.saveFailed || "Couldn't save that. Try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    const tLists = translations.lists || {}
    const ok = await confirm({
      title: tLists.deleteConfirm?.title || 'Delete this list?',
      description: tLists.deleteConfirm?.message || "Lists that still have gifts can't be deleted. Move or delete the gifts first.",
    })
    if (!ok) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || tLists.deleteConfirm?.error || 'Failed to delete list')
        return
      }

      await fetchUserLists()
      toast(tLists.deleteConfirm?.deleted || 'List deleted')
    } catch (err) {
      console.error("Failed to delete list", err)
      toast.error(tLists.deleteConfirm?.error || 'Failed to delete list')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchListPermissions = async (listId: string) => {
    const response = await fetch(`/api/lists/${listId}/permissions`)
    return response.json()
  }

  // Helper functions
  const getCurrentMember = () => currentUser
  const getOtherMembers = () => users.filter((u: any) => u.id !== currentUser.id)
  const getActiveMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id && !item.archived)
  const getArchivedMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id && item.archived)

  // Loading state: the skeleton mirrors the real layout (greeting, then the list card)
  if (loading) {
    return (
      <div className="container mx-auto max-w-xl w-full" aria-busy="true">
        <span className="sr-only">{t.loading || 'Loading...'}</span>
        <div className="flex items-end mb-4 md:mb-6 px-4 md:px-0 min-h-[100px] md:min-h-auto">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card className="rounded-t-3xl rounded-b-none md:rounded-xl border-none md:border py-6 shadow-none md:shadow-sm">
          <CardContent className="px-6 md:px-3 space-y-4">
            <Skeleton className="h-11 md:h-9 w-full" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (initial load only; failed saves show a toast instead)
  if (error) {
    return (
      <div className="container mx-auto max-w-xl w-full px-4 md:px-0">
        <Card className="rounded-xl py-6">
          <CardContent className="text-center space-y-4">
            <AlertCircle className="size-10 text-destructive mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-xl font-medium">{t.loadError?.title || "Couldn't load your gift lists"}</h2>
              <p className="text-muted-foreground">{t.loadError?.body || 'Check your connection, then try again.'}</p>
            </div>
            <Button className="w-full" onClick={() => window.location.reload()}>
              {t.retry || 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentMember = getCurrentMember()
  const activeMyGifts = getActiveMyGifts()
  const archivedMyGifts = getArchivedMyGifts()

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-xl w-full">
        {/* Header */}
        <div className="flex items-end justify-between mb-4 md:mb-6 px-4 md:px-0 min-h-[100px] md:min-h-auto">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-balance">
                {formatMessage(t.welcome || "Hi, {{name}}!", { name: currentMember?.name || '' })}
              </h1>
              <p>{t.welcomeBack || 'Welcome back 😊'}</p>
            </div>
          </div>
        </div>

        <Card className={'bg-card text-card-foreground flex flex-col gap-6 rounded-t-3xl h-full rounded-b-none md:rounded-b-xl md:rounded-xl border-none md:border py-6 md:py-4 shadow-none md:shadow-sm'}>
          <CardContent className="px-6 md:px-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="my-list">{t.tabs?.myGiftList || 'My Gift List'}</TabsTrigger>
                <TabsTrigger value="family-lists">{t.tabs?.familyLists || 'Family Lists'}</TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center gap-1">
                  <span className="inline truncate">{t.tabs?.suggestions || 'Suggestions'}</span>
                  {pendingCount > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0 min-w-[18px] h-[18px]">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* My Gift List Tab */}
              <TabsContent value="my-list" className="space-y-6 mb-0 md:mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="flex items-center gap-2 font-medium">
                    <Gift className="size-5" aria-hidden="true" />
                    {tGifts.myGifts?.title || 'My Gift Ideas'}
                  </h2>
                  <ListManagement
                    userLists={userLists}
                    otherMembers={getOtherMembers()}
                    onCreateList={handleCreateList}
                    onUpdateList={handleUpdateList}
                    onDeleteList={handleDeleteList}
                    fetchListPermissions={fetchListPermissions}
                    isSubmitting={isSubmitting}
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  {tGifts.myGifts?.description || "Add and manage your personal gift ideas here."}
                </p>

                <AddGiftForm
                  currentUser={currentUser}
                  userLists={userLists}
                  onAddGiftItem={handleAddGiftItem}
                  fetchOGData={fetchOGData}
                  isSubmitting={isSubmitting}
                />

                <MyGiftsList
                  currentUser={currentUser}
                  userLists={userLists}
                  activeMyGifts={activeMyGifts}
                  archivedMyGifts={archivedMyGifts}
                  onEdit={handleEditGiftItem}
                  onDelete={handleRemoveGiftItem}
                  onArchive={handleArchiveItem}
                />
              </TabsContent>

              {/* Family Lists Tab */}
              <TabsContent value="family-lists" className="space-y-6 mb-0 md:mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="flex items-center gap-2 h-8 font-medium">
                    <Gift className="size-5" aria-hidden="true" />
                    {tGifts.familyGifts?.title || "Family Gift Lists"}
                  </h2>
                </div>

                <p className="text-sm text-muted-foreground">
                  {tGifts.familyGifts?.description || "Click on a family member to view and purchase their gifts."}
                </p>

                <FamilyGiftsList
                  currentUser={currentUser}
                  users={users}
                  giftItems={giftItems}
                  onTogglePurchase={handleTogglePurchase}
                  onGiftCardPurchase={handleGiftCardPurchase}
                  onSuggestGift={handleOpenSuggestDialog}
                />
              </TabsContent>

              {/* Suggestions Tab */}
              <TabsContent value="suggestions" className="space-y-6 mb-0 md:mb-6">
                <SuggestionsView
                  incomingSuggestions={incomingSuggestions}
                  outgoingSuggestions={outgoingSuggestions}
                  userLists={userLists}
                  pendingCount={pendingCount}
                  onApprove={handleApproveSuggestion}
                  onDeny={handleDenySuggestion}
                  onDelete={handleDeleteSuggestion}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Gift Dialog */}
        <EditGiftDialog
          editingItem={editingItem}
          userLists={userLists}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdateGiftItem={handleUpdateGiftItem}
          fetchOGData={fetchOGData}
          isSubmitting={isSubmitting}
        />

        {/* Suggest Gift Dialog */}
        <SuggestGiftDialog
          isOpen={suggestDialogOpen}
          onClose={handleCloseSuggestDialog}
          currentUser={currentUser}
          familyMembers={users}
          targetUserId={suggestTargetUserId}
          onSubmit={handleCreateSuggestion}
          fetchOGData={fetchOGData}
        />
      </div>
    </TooltipProvider>
  )
}

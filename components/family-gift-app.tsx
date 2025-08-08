"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, Gift, Users, AlertCircle, Loader2, Database, Edit, CreditCard, Archive, Settings } from 'lucide-react'
import { useGiftData } from "@/hooks/useGiftData"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import GiftItem from "./gift-item"

interface User {
  id: string
  name: string
  email: string
}

interface FamilyGiftAppProps {
  currentUser: User
}

export default function FamilyGiftApp({ currentUser }: FamilyGiftAppProps) {
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    link: "",
    imageUrl: "",
    isGiftCard: false,
    giftCardTargetAmount: "",
    selectedListId: ""
  })
  const [newItemOGData, setNewItemOGData] = useState<any>(null)
  const [newItemOGLoading, setNewItemOGLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    link: "",
    imageUrl: "",
    isGiftCard: false,
    giftCardTargetAmount: "",
    selectedListId: ""
  })
  const [editFormOGData, setEditFormOGData] = useState<any>(null)
  const [editFormOGLoading, setEditFormOGLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false)
  const [isManageListsDialogOpen, setIsManageListsDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<any>(null)
  const [editListForm, setEditListForm] = useState({
    name: "",
    description: "",
    isPublic: false,
    hiddenFromUsers: [] as string[]
  })
  const [newListForm, setNewListForm] = useState({
    name: "",
    description: "",
    isPublic: false,
    hiddenFromUsers: [] as string[]
  })
  const [userLists, setUserLists] = useState<any[]>([])

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
    fetchOGData
  } = useGiftData()

  // Fetch user's lists
  const fetchUserLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (!response.ok) throw new Error('Failed to fetch lists')
      const lists = await response.json()
      setUserLists(lists)

      // Set the first list as selected for new items if not already set
      if (lists.length > 0) {
        if (!newItem.selectedListId) {
          setNewItem(prev => ({ ...prev, selectedListId: lists[0].id }))
        }
      } else {
        // Create a default list if none exists
        await createDefaultList()
      }
    } catch (err) {
      console.error("Failed to fetch lists:", err)
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
        body: JSON.stringify({
          name: `${currentUser.name || 'My'}'s List`,
          description: 'Default wishlist',
          is_public: false,
          is_visible: true
        }),
      })

      if (!response.ok) throw new Error('Failed to create default list')
      const newList = await response.json()
      setUserLists([newList])
      setNewItem(prev => ({ ...prev, selectedListId: newList.id }))
    } catch (err) {
      console.error("Failed to create default list:", err)
    }
  }

  // Initialize lists on component mount
  useEffect(() => {
    fetchUserLists()
  }, [])

  const handleAddGiftItem = async () => {
    if (!newItem.name.trim() || isSubmitting || !newItem.selectedListId) return

    setIsSubmitting(true)
    try {
      await addGiftItem({
        name: newItem.name,
        description: newItem.description || undefined,
        price: newItem.price || undefined,
        link: newItem.link || undefined,
        image_url: newItem.imageUrl || undefined,
        owner_id: currentUser.id,
        list_id: newItem.selectedListId,
        is_gift_card: newItem.isGiftCard,
        gift_card_target_amount: newItem.isGiftCard && newItem.giftCardTargetAmount
          ? parseFloat(newItem.giftCardTargetAmount)
          : undefined,
        og_title: newItemOGData?.title,
        og_description: newItemOGData?.description,
        og_image: newItemOGData?.image,
        og_site_name: newItemOGData?.siteName,
      })
      setNewItem(prev => ({
        name: "",
        description: "",
        price: "",
        link: "",
        imageUrl: "",
        isGiftCard: false,
        giftCardTargetAmount: "",
        selectedListId: prev.selectedListId // Keep the same list selected
      }))
      setNewItemOGData(null)
    } catch (err) {
      console.error("Failed to add gift item:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveGiftItem = async (itemId: string) => {
    try {
      await removeGiftItem(itemId)
    } catch (err) {
      console.error("Failed to remove gift item:", err)
    }
  }

  const handleEditGiftItem = (item: any) => {
    setEditingItem(item)
    setEditForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      link: item.link || "",
      imageUrl: item.image_url || "",
      isGiftCard: item.is_gift_card || false,
      giftCardTargetAmount: item.gift_card_target_amount ? item.gift_card_target_amount.toString() : "",
      selectedListId: item.list_id || ""
    })
    // Set existing OG data if available
    if (item.og_title || item.og_description || item.og_image) {
      setEditFormOGData({
        title: item.og_title,
        description: item.og_description,
        image: item.og_image,
        siteName: item.og_site_name
      })
    } else {
      setEditFormOGData(null)
    }
    setIsEditDialogOpen(true)
  }

  const handleUpdateGiftItem = async () => {
    if (!editingItem || !editForm.name.trim() || isSubmitting || !editForm.selectedListId) return

    setIsSubmitting(true)
    try {
      await updateGiftItem(editingItem.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        price: editForm.price || undefined,
        link: editForm.link || undefined,
        image_url: editForm.imageUrl || undefined,
        list_id: editForm.selectedListId,
        is_gift_card: editForm.isGiftCard,
        gift_card_target_amount: editForm.isGiftCard && editForm.giftCardTargetAmount
          ? parseFloat(editForm.giftCardTargetAmount)
          : undefined,
        og_title: editFormOGData?.title,
        og_description: editFormOGData?.description,
        og_image: editFormOGData?.image,
        og_site_name: editFormOGData?.siteName,
      })
      setIsEditDialogOpen(false)
      setEditingItem(null)
      setEditForm({
        name: "",
        description: "",
        price: "",
        link: "",
        imageUrl: "",
        isGiftCard: false,
        giftCardTargetAmount: "",
        selectedListId: ""
      })
      setEditFormOGData(null)
    } catch (err) {
      console.error("Failed to update gift item:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePurchase = async (itemId: string, currentPurchasedBy: string | null) => {
    try {
      const newPurchasedBy = currentPurchasedBy ? null : currentUser.id
      await togglePurchaseStatus(itemId, newPurchasedBy)
    } catch (err) {
      console.error("Failed to toggle purchase status:", err)
    }
  }

  const handleGiftCardPurchase = async (itemId: string, amount: number) => {
    try {
      await addGiftCardPurchase(itemId, currentUser.id, amount)
    } catch (err) {
      console.error("Failed to add gift card purchase:", err)
    }
  }

  const handleArchiveItem = async (itemId: string) => {
    try {
      await toggleArchiveStatus(itemId)
    } catch (err) {
      console.error("Failed to toggle archive status:", err)
    }
  }

  const handleCreateList = async () => {
    if (!newListForm.name.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newListForm.name.trim(),
          description: newListForm.description.trim() || null,
          is_public: newListForm.isPublic,
          hidden_from: newListForm.hiddenFromUsers
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create list')
      }

      await response.json()

      // Reset form and close dialog
      setNewListForm({ name: "", description: "", isPublic: false, hiddenFromUsers: [] })
      setIsCreateListDialogOpen(false)

      // Refresh lists to include the new one
      await fetchUserLists()

    } catch (err) {
      console.error("Failed to create list:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditList = async (list: any) => {
    setEditingList(list)

    // Fetch current permissions for this list
    try {
      const response = await fetch(`/api/lists/${list.id}/permissions`)
      const { permissions } = await response.json()
      const hiddenFromUsers = permissions.filter((p: any) => !p.can_view).map((p: any) => p.user_id)

      setEditListForm({
        name: list.name,
        description: list.description || "",
        isPublic: list.is_public,
        hiddenFromUsers: hiddenFromUsers
      })
    } catch (err) {
      console.error("Failed to fetch list permissions:", err)
      setEditListForm({
        name: list.name,
        description: list.description || "",
        isPublic: list.is_public,
        hiddenFromUsers: []
      })
    }
  }

  const handleUpdateList = async () => {
    if (!editingList || !editListForm.name.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/lists/${editingList.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editListForm.name.trim(),
          description: editListForm.description.trim() || null,
          is_public: editListForm.isPublic
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update list')
      }

      // Update permissions
      const allUsers = getOtherMembers()
      const permissions = allUsers.map(member => ({
        user_id: member.id,
        can_view: !editListForm.hiddenFromUsers.includes(member.id)
      }))

      const permissionsResponse = await fetch(`/api/lists/${editingList.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (!permissionsResponse.ok) {
        console.warn('Failed to update list permissions')
      }

      // Reset and refresh
      setEditingList(null)
      setEditListForm({ name: "", description: "", isPublic: false, hiddenFromUsers: [] })
      await fetchUserLists()
    } catch (err) {
      console.error("Failed to update list:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? Note: Lists with items cannot be deleted - you must move or delete all items first.')) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to delete list')
        return
      }

      await fetchUserLists()
    } catch (err) {
      console.error("Failed to delete list:", err)
      alert('Failed to delete list')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle OG data fetching for new item
  const handleNewItemLinkChange = async (link: string) => {
    setNewItem((prev) => ({ ...prev, link }))

    if (link && link.startsWith('http')) {
      setNewItemOGLoading(true)
      const ogData = await fetchOGData(link)
      setNewItemOGData(ogData)
      setNewItemOGLoading(false)

      // Auto-fill name if empty and OG title exists
      if (!newItem.name && ogData?.title) {
        setNewItem((prev) => ({ ...prev, name: ogData.title }))
      }
    } else {
      setNewItemOGData(null)
      setNewItemOGLoading(false)
    }
  }

  // Handle OG data fetching for edit form
  const handleEditFormLinkChange = async (link: string) => {
    setEditForm((prev) => ({ ...prev, link }))

    if (link && link.startsWith('http')) {
      setEditFormOGLoading(true)
      const ogData = await fetchOGData(link)
      setEditFormOGData(ogData)
      setEditFormOGLoading(false)
    } else {
      setEditFormOGData(null)
      setEditFormOGLoading(false)
    }
  }

  const getCurrentMember = () => currentUser
  const getOtherMembers = () => users.filter((u: any) => u.id !== currentUser.id)
  // const getMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id)
  const getActiveMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id && !item.archived)
  const getArchivedMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id && item.archived)
  const getMemberGifts = (memberId: string) => giftItems.filter((item: any) => item.owner_id === memberId && !item.archived)

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 w-full max-w-xl mx-auto">
        <Card className={'w-full bg-card text-card-foreground flex flex-col gap-6 rounded-none md:rounded-xl border-none md:border py-6 shadow-none md:shadow-sm'}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
    <div className="container mx-auto max-w-xl w-full">
        <Card className={'w-full bg-card text-card-foreground flex flex-col gap-6 rounded-none md:rounded-xl border-none md:border py-6 shadow-none md:shadow-sm'}>
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">Database Connection Error</CardTitle>
            <CardDescription>Unable to connect to Neon database</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => window.location.reload()}>
              Try Again
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
    <div className="container mx-auto max-w-xl w-full ">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 md:mb-6 px-4 md:px-0 min-h-[100px] md:min-h-auto">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-heading font-medium tracking-wide">Hi, {currentMember?.name}!</h1>
            <p>Welcome back 😊</p>
          </div>
        </div>
      </div>
      <Card className={'bg-card text-card-foreground flex flex-col gap-6 rounded-t-3xl h-full rounded-b-none md:rounded-b-xl md:rounded-xl border-none md:border py-6 md:py-4 shadow-none md:shadow-sm'}>

        <CardContent className="px-6 md:px-3">
        <Tabs defaultValue="my-list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-list">My Gift List</TabsTrigger>
            <TabsTrigger value="family-lists">Family Lists</TabsTrigger>
          </TabsList>

        {/* My Gift List Tab */}
          <TabsContent value="my-list" className="space-y-6 mb-0 md:mb-6">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                My Gift Ideas
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isManageListsDialogOpen} onOpenChange={setIsManageListsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Manage Lists</DialogTitle>
                      <DialogDescription>
                        Edit or delete your existing gift lists.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                      {userLists.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No lists created yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {userLists.map((list) => (
                            <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1">
                                <h3 className="font-medium">{list.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {list.description || "No description"}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={list.is_public ? "default" : "secondary"} className="text-xs">
                                    {list.is_public ? "Public" : "Private"}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {list.item_count || 0} items
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Created {new Date(list.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditList(list)}
                                  disabled={isSubmitting}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {userLists.length > 1 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteList(list.id)}
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New List</DialogTitle>
                    <DialogDescription>
                      Create a new gift list to organize different categories of gifts.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="list-name">List name *</Label>
                      <Input
                        id="list-name"
                        value={newListForm.name}
                        onChange={(e) => setNewListForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Birthday Wishes, Baby Registry"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="list-description">Description</Label>
                      <Textarea
                        id="list-description"
                        value={newListForm.description}
                        onChange={(e) => setNewListForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description for this list"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="list-privacy">Privacy</Label>
                        <p className="text-sm text-muted-foreground">
                          {newListForm.isPublic
                            ? "See purchased items"
                            : "Can't see purchased items"}
                        </p>
                      </div>
                      <Switch
                        id="list-privacy"
                        checked={newListForm.isPublic}
                        onCheckedChange={(checked) => setNewListForm(prev => ({ ...prev, isPublic: checked }))}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="p-4 border rounded-lg space-y-3">
                      <Label>Hide from Family Members</Label>
                      <p className="text-sm text-muted-foreground">
                        Select family members who should not be able to see this list
                      </p>
                      <div className="space-y-2">
                        {getOtherMembers().map((member: any) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`hide-from-${member.id}`}
                              checked={newListForm.hiddenFromUsers.includes(member.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewListForm(prev => ({
                                    ...prev,
                                    hiddenFromUsers: [...prev.hiddenFromUsers, member.id]
                                  }))
                                } else {
                                  setNewListForm(prev => ({
                                    ...prev,
                                    hiddenFromUsers: prev.hiddenFromUsers.filter(id => id !== member.id)
                                  }))
                                }
                              }}
                              disabled={isSubmitting}
                            />
                            <Label htmlFor={`hide-from-${member.id}`} className="text-sm">
                              {member.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateListDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateList}
                      disabled={!newListForm.name.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {isSubmitting ? "Creating..." : "Create List"}
                    </Button>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Add items you'd like to receive. Family members can see this list and mark items as purchased.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <Label>Gift:</Label>
                  <Input
                    placeholder="Gift item name *"
                    value={newItem.name}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label>Price:</Label>
                  <Input
                    placeholder="Price (optional)"
                    value={newItem.price}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
                    disabled={isSubmitting || newItem.isGiftCard}
                  />
                </div>
              </div>

              {/* Gift Card Section */}
              <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isGiftCard"
                    checked={newItem.isGiftCard}
                    onCheckedChange={(checked) => setNewItem((prev) => ({
                      ...prev,
                      isGiftCard: checked === true,
                      price: checked === true ? "" : prev.price // Clear price if gift card
                    }))}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="isGiftCard" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    This is a gift card
                  </Label>
                </div>
                {newItem.isGiftCard && (
                  <div className="flex flex-col gap-3">
                    <Label>Target Amount (optional):</Label>
                    <Input
                      placeholder="e.g., 100.00"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.giftCardTargetAmount}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, giftCardTargetAmount: e.target.value }))}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Family members can purchase amounts toward this gift card. Leave blank for no target.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label>Link:</Label>
                <Input
                  placeholder="Link (optional)"
                  value={newItem.link}
                  onChange={(e) => handleNewItemLinkChange(e.target.value)}
                  disabled={isSubmitting}
                />
                {newItemOGLoading && (
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading link preview...
                  </div>
                )}
                {!newItemOGLoading && newItemOGData && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    ✓ Link preview loaded: {newItemOGData.title || 'Data found'}
                  </div>
                )}
                {!newItemOGLoading && newItem.link && newItem.link.startsWith('http') && !newItemOGData && (
                  <div className="text-xs text-orange-600 flex items-center gap-1">
                    ⚠ Couldn't load preview (some sites block automated requests)
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Label>Image URL:</Label>
                <Input
                  placeholder="Image URL (optional)"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Provide an image URL if no preview is loaded from the link above
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Label>Description:</Label>
                <Textarea
                  placeholder="Description (optional)"
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
            {/* List Selector */}
              <div className="flex flex-col w-full gap-3">
                <Label>Add to List:</Label>
                <Select
                  value={newItem.selectedListId}
                  onValueChange={(value) => setNewItem((prev) => ({ ...prev, selectedListId: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a list..." />
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
              <Button onClick={handleAddGiftItem} disabled={!newItem.name.trim() || isSubmitting || !newItem.selectedListId}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Adding..." : "Add Gift Idea"}
              </Button>

              {/* My Gift Items - Organized by List */}
              <div className="space-y-6">
                {activeMyGifts.length === 0 && archivedMyGifts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No gift ideas yet. Add some items above!</p>
                  </div>
                ) : (
                  <>
                    {/* Group items by list */}
                    {(() => {
                      // Group active items by list
                      const itemsByList = activeMyGifts.reduce((acc: any, item: any) => {
                        const listId = item.list_id || 'unknown'
                        if (!acc[listId]) {
                          const listInfo = userLists.find(l => l.id === listId)
                          acc[listId] = {
                            name: listInfo?.name || 'Unknown List',
                            description: listInfo?.description || '',
                            isPublic: listInfo?.is_public || false,
                            createdAt: listInfo?.created_at || null,
                            items: []
                          }
                        }
                        acc[listId].items.push(item)
                        return acc
                      }, {})

                      // Group archived items by list
                      const archivedByList = archivedMyGifts.reduce((acc: any, item: any) => {
                        const listId = item.list_id || 'unknown'
                        if (!acc[listId]) {
                          const listInfo = userLists.find(l => l.id === listId)
                          acc[listId] = {
                            name: listInfo?.name || 'Unknown List',
                            description: listInfo?.description || '',
                            isPublic: listInfo?.is_public || false,
                            createdAt: listInfo?.created_at || null,
                            items: []
                          }
                        }
                        acc[listId].items.push(item)
                        return acc
                      }, {})

                      return (
                        <div className="space-y-6">
                          {/* Active Lists and Items */}
                          <Accordion type="single" collapsible className="w-full">
                            {Object.entries(itemsByList).map(([listId, listData]: [string, any]) => (
                              <AccordionItem key={listId} value={listId}>
                                <AccordionTrigger className="hover:no-underline items-center relative">
                                  <div className="flex items-center gap-3 w-full">
                                    <div className="flex-1">
                                      <h3 className="font-medium text-lg">{listData.name}</h3>
                                      {listData.description && (
                                        <p className="text-sm text-muted-foreground">{listData.description}</p>
                                      )}
                                      <Badge variant={listData.isPublic ? "default" : "secondary"} className="text-xs absolute top-5 right-5">
                                        {listData.isPublic ? "Can see purchased items" : "Cannot see purchased items"}
                                      </Badge>
                                      <div className="flex items-center gap-2 mt-1">

                                        <span className="text-xs text-muted-foreground">
                                          {listData.items.length} items
                                        </span>
                                        {listData.createdAt && (
                                          <span className="text-xs text-muted-foreground">
                                            Created {new Date(listData.createdAt).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="divide divide-indigo-500">
                                    {listData.items.map((item: any, idx: number) => (
                                      <div key={item.id}>
                                        <GiftItem
                                          item={item}
                                          currentUserId={currentUser.id}
                                          variant="my-gifts"
                                          onEdit={handleEditGiftItem}
                                          onDelete={handleRemoveGiftItem}
                                          onArchive={handleArchiveItem}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                          {/* Archived Items by List */}
                          {Object.keys(archivedByList).length > 0 && (
                            <div className="pt-4 border-t">
                              <h4 className="text-lg font-medium text-muted-foreground mb-4 flex items-center gap-2">
                                <Archive className="w-5 h-5" />
                                Archived Items
                              </h4>
                              <div className="space-y-6">
                                {Object.entries(archivedByList).map(([listId, listData]: [string, any]) => (
                                  <div key={`archived-${listId}`} className="space-y-3">
                                    <div className="flex items-center gap-3 pb-2 border-b border-dashed">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-sm opacity-75">{listData.name} (Archived)</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs opacity-60">
                                            {listData.items.length} archived items
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="divide divide-indigo-500">
                                      {listData.items.map((item: any) => (
                                        <GiftItem
                                          key={item.id}
                                          item={item}
                                          currentUserId={currentUser.id}
                                          variant="my-gifts"
                                          onEdit={handleEditGiftItem}
                                          onDelete={handleRemoveGiftItem}
                                          onArchive={handleArchiveItem}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
        </TabsContent>

        {/* Family Lists Tab */}
        <TabsContent value="family-lists" className="space-y-6 mb-0 md:mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2 h-8">
              <Gift className="w-5 h-5" />
              Family Gift Lists
            </div>
          </div>
              <p className="text-sm text-muted-foreground">
                Click on a family member to view and purchase their gift items.
              </p>


              <Accordion type="single" collapsible className="w-full flex flex-col group">
                {getOtherMembers().map((member: any) => {
                  const memberGifts = getMemberGifts(member.id)
                  const purchasedCount = memberGifts.filter((item: any) => item.purchased_by).length

                  // Group gifts by list to show privacy indicators
                  const giftsByList = memberGifts.reduce((acc: any, item: any) => {
                    const listId = item.list_id
                    const listName = item.list_name || 'Unnamed List'
                    const isPublic = item.is_public

                    if (!acc[listId]) {
                      acc[listId] = {
                        name: listName,
                        isPublic: isPublic,
                        items: []
                      }
                    }
                    acc[listId].items.push(item)
                    return acc
                  }, {})

                  const listCount = Object.keys(giftsByList).length

                  return (
                    <AccordionItem key={member.id} value={member.id} className="">
                      <AccordionTrigger className="hover:no-underline items-center py-3">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member.name}'s Gift Lists</span>
                                {listCount > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {listCount} lists
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <span>{memberGifts.length} item(s) • {purchasedCount} purchased</span>
                                {/* <div className="flex items-center gap-1">
                                  {Object.values(giftsByList).map((list: any, index: number) => (
                                    <Badge
                                      key={index}
                                      variant={list.isPublic ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {list.isPublic ? "Public" : "Private"}
                                    </Badge>
                                  ))}
                                </div> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4">
                          {memberGifts.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>{member.name} hasn't added any gift ideas yet.</p>
                            </div>
                          ) : (
                              <Accordion type="single" collapsible className="w-full md:px-3">
                              {Object.entries(giftsByList).map(([listId, listData]: [string, any]) => (
                                <AccordionItem key={listId} value={listId} className="w-full border-purple-200">
                                  <AccordionTrigger className="hover:no-underline items-center py-2">
                                    <div className="flex items-start gap-1 flex-col">
                                      <h4 className="font-medium text-sm">{listData.name}</h4>
                                      <div className="flex flex-row items-center gap-2">
                                        <Badge
                                          variant={listData.isPublic ? "default" : "secondary"}
                                          className="text-xs"
                                        >
                                          {listData.isPublic ? "Public" : "Private"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {listData.items.length} item(s)
                                        </span>
                                      </div>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="pb-0">
                                    <div className="px-1 md:px-2 border-purple-200 divide divide-y divide-purple-300">
                                    {/* <div className="space-y-3"> */}
                                    {listData.items.map((item: any) => {
                                      const purchaserName = item.purchased_by
                                        ? users.find((u: any) => u.id === item.purchased_by)?.name
                                        : null

                                      return (
                                        <GiftItem
                                          key={item.id}
                                          item={item}
                                          currentUserId={currentUser.id}
                                          purchaserName={purchaserName || undefined}
                                          variant="family-gifts"
                                          onTogglePurchase={handleTogglePurchase}
                                          onGiftCardPurchase={handleGiftCardPurchase}
                                        />
                                      )
                                    })}
                                  </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>

        </TabsContent>
      </Tabs>
            </CardContent>
    </Card>
      {/* Edit Gift Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Gift Item</DialogTitle>
            <DialogDescription>
              Update your gift item details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Gift item name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Gift item name"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                disabled={isSubmitting}
              />
            </div>

            {/* List Selector */}
            <div className="grid gap-2">
              <Label htmlFor="edit-list">List</Label>
              <Select
                value={editForm.selectedListId}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, selectedListId: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a list..." />
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
            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  value={editForm.price}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="Price (optional)"
                  disabled={isSubmitting || editForm.isGiftCard}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-link">Link</Label>
                <Input
                  id="edit-link"
                  value={editForm.link}
                  onChange={(e) => handleEditFormLinkChange(e.target.value)}
                  placeholder="Link (optional)"
                  disabled={isSubmitting}
                />
                {editFormOGLoading && (
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading link preview...
                  </div>
                )}
                {!editFormOGLoading && editFormOGData && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    ✓ Link preview loaded: {editFormOGData.title || 'Data found'}
                  </div>
                )}
                {!editFormOGLoading && editForm.link && editForm.link.startsWith('http') && !editFormOGData && (
                  <div className="text-xs text-orange-600 flex items-center gap-1">
                    ⚠ Couldn't load preview (some sites block automated requests)
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-imageUrl">Image URL (optional):</Label>
                <Input
                  id="edit-imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={editForm.imageUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a custom image URL if no preview is available
                </p>
              </div>
            </div>

            {/* Gift Card Section */}
            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isGiftCard"
                  checked={editForm.isGiftCard}
                  onCheckedChange={(checked) => setEditForm((prev) => ({
                    ...prev,
                    isGiftCard: checked === true,
                    price: checked === true ? "" : prev.price // Clear price if gift card
                  }))}
                  disabled={isSubmitting}
                />
                <Label htmlFor="edit-isGiftCard" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  This is a gift card
                </Label>
              </div>
              {editForm.isGiftCard && (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="edit-giftCardTargetAmount">Target Amount (optional):</Label>
                  <Input
                    id="edit-giftCardTargetAmount"
                    placeholder="e.g., 100.00"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.giftCardTargetAmount}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, giftCardTargetAmount: e.target.value }))}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Family members can purchase amounts toward this gift card. Leave blank for no target.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGiftItem}
              disabled={!editForm.name.trim() || isSubmitting || !editForm.selectedListId}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Edit className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? "Updating..." : "Update Gift"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      {editingList && (
        <Dialog open={!!editingList} onOpenChange={() => setEditingList(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit List</DialogTitle>
              <DialogDescription>
                Update your list details and privacy settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-list-name">List name *</Label>
                <Input
                  id="edit-list-name"
                  value={editListForm.name}
                  onChange={(e) => setEditListForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="List name"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-list-description">Description</Label>
                <Textarea
                  id="edit-list-description"
                  value={editListForm.description}
                  onChange={(e) => setEditListForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-list-privacy">Privacy</Label>
                  <p className="text-sm text-muted-foreground">
                    {editListForm.isPublic
                      ? "See purchased items"
                      : "Can't see purchased items"}
                  </p>
                </div>
                <Switch
                  id="edit-list-privacy"
                  checked={editListForm.isPublic}
                  onCheckedChange={(checked) => setEditListForm(prev => ({ ...prev, isPublic: checked }))}
                  disabled={isSubmitting}
                />
              </div>
              <div className="p-4 border rounded-lg space-y-3">
                <Label>Hide from Family Members</Label>
                <p className="text-sm text-muted-foreground">
                  Select family members who should not be able to see this list
                </p>
                <div className="space-y-2">
                  {getOtherMembers().map((member: any) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-hide-from-${member.id}`}
                        checked={editListForm.hiddenFromUsers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditListForm(prev => ({
                              ...prev,
                              hiddenFromUsers: [...prev.hiddenFromUsers, member.id]
                            }))
                          } else {
                            setEditListForm(prev => ({
                              ...prev,
                              hiddenFromUsers: prev.hiddenFromUsers.filter(id => id !== member.id)
                            }))
                          }
                        }}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`edit-hide-from-${member.id}`} className="text-sm">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingList(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateList}
                disabled={!editListForm.name.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Updating..." : "Update List"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, Gift, Users, AlertCircle, Loader2, Database, Edit, CreditCard } from 'lucide-react'
import { useGiftData } from "@/hooks/useGiftData"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
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
    isGiftCard: false, 
    giftCardTargetAmount: "" 
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
    isGiftCard: false, 
    giftCardTargetAmount: "" 
  })
  const [editFormOGData, setEditFormOGData] = useState<any>(null)
  const [editFormOGLoading, setEditFormOGLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { 
    users, 
    giftItems, 
    loading, 
    error, 
    addGiftItem, 
    updateGiftItem, 
    removeGiftItem, 
    togglePurchaseStatus,
    addGiftCardPurchase,
    fetchOGData
  } = useGiftData()

  const handleAddGiftItem = async () => {
    if (!newItem.name.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addGiftItem({
        name: newItem.name,
        description: newItem.description || undefined,
        price: newItem.price || undefined,
        link: newItem.link || undefined,
        owner_id: currentUser.id,
        is_gift_card: newItem.isGiftCard,
        gift_card_target_amount: newItem.isGiftCard && newItem.giftCardTargetAmount 
          ? parseFloat(newItem.giftCardTargetAmount) 
          : undefined,
        og_title: newItemOGData?.title,
        og_description: newItemOGData?.description,
        og_image: newItemOGData?.image,
        og_site_name: newItemOGData?.siteName,
      })
      setNewItem({ 
        name: "", 
        description: "", 
        price: "", 
        link: "", 
        isGiftCard: false, 
        giftCardTargetAmount: "" 
      })
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
      isGiftCard: item.is_gift_card || false,
      giftCardTargetAmount: item.gift_card_target_amount ? item.gift_card_target_amount.toString() : ""
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
    if (!editingItem || !editForm.name.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await updateGiftItem(editingItem.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        price: editForm.price || undefined,
        link: editForm.link || undefined,
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
        isGiftCard: false, 
        giftCardTargetAmount: "" 
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
  const getMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id)
  const getMemberGifts = (memberId: string) => giftItems.filter((item: any) => item.owner_id === memberId)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-xl">
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
  const myGifts = getMyGifts()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome, {currentMember?.name}!</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <Database className="w-3 h-3" />
                Manage your family gift lists
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="my-list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-list">My Gift List</TabsTrigger>
            <TabsTrigger value="family-lists">Family Lists</TabsTrigger>
          </TabsList>

          {/* My Gift List Tab */}
          <TabsContent value="my-list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  My Gift Ideas
                </CardTitle>
                <CardDescription>
                  Add items you'd like to receive. Family members can see this list and mark items as purchased.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 flex flex-col gap-6">
                {/* Add New Item Form */}
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
                  <Label>Description:</Label>
                  <Textarea
                    placeholder="Description (optional)"
                    value={newItem.description}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>

                <Button onClick={handleAddGiftItem} disabled={!newItem.name.trim() || isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? "Adding..." : "Add Gift Idea"}
                </Button>

                {/* My Gift Items */}
                <div className="space-y-3">
                  {myGifts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No gift ideas yet. Add some items above!</p>
                    </div>
                  ) : (
                    myGifts.map((item: any) => (
                      <GiftItem
                        key={item.id}
                        item={item}
                        currentUserId={currentUser.id}
                        variant="my-gifts"
                        onEdit={handleEditGiftItem}
                        onDelete={handleRemoveGiftItem}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Lists Tab */}
          <TabsContent value="family-lists" className="space-y-6">
            <div className="grid gap-6">
              {getOtherMembers().map((member: any) => {
                const memberGifts = getMemberGifts(member.id)
                const purchasedCount = memberGifts.filter((item: any) => item.purchased_by).length

                return (
                  <Card key={member.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center gap-3">
                          <Avatar className="size-9 bg-blue-300">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <CardTitle>{member.name}'s Gift List</CardTitle>
                            <CardDescription>
                              {memberGifts.length} items • {purchasedCount} purchased
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={member.color}>{memberGifts.length} items</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {memberGifts.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>{member.name} hasn't added any gift ideas yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {memberGifts.map((item: any) => {
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
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

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
              <div className="grid grid-cols-2 gap-4">
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
                disabled={!editForm.name.trim() || isSubmitting}
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
      </div>
    </div>
  )
}

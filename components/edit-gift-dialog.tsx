"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Loader2, CreditCard, Users } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
}

interface UserList {
  id: string
  name: string
  description?: string
  is_public: boolean
  created_at: string
  item_count?: number
}

interface EditGiftDialogProps {
  editingItem: any
  userLists: UserList[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUpdateGiftItem: (itemData: any) => Promise<void>
  fetchOGData: (url: string) => Promise<any>
  isSubmitting: boolean
}

export default function EditGiftDialog({
  editingItem,
  userLists,
  isOpen,
  onOpenChange,
  onUpdateGiftItem,
  fetchOGData,
  isSubmitting
}: EditGiftDialogProps) {
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    link: "",
    imageUrl: "",
    isGiftCard: false,
    isGroupGift: false,
    giftCardTargetAmount: "",
    selectedListId: ""
  })
  const [editFormOGData, setEditFormOGData] = useState<any>(null)
  const [editFormOGLoading, setEditFormOGLoading] = useState(false)

  // Initialize form when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setEditForm({
        name: editingItem.name || "",
        description: editingItem.description || "",
        price: editingItem.price || "",
        link: editingItem.link || "",
        imageUrl: editingItem.image_url || "",
        isGiftCard: editingItem.is_gift_card || false,
        isGroupGift: editingItem.is_group_gift || false,
        giftCardTargetAmount: editingItem.gift_card_target_amount ? editingItem.gift_card_target_amount.toString() : "",
        selectedListId: editingItem.list_id || ""
      })
      
      // Set existing OG data if available
      if (editingItem.og_title || editingItem.og_description || editingItem.og_image) {
        setEditFormOGData({
          title: editingItem.og_title,
          description: editingItem.og_description,
          image: editingItem.og_image,
          siteName: editingItem.og_site_name
        })
      } else {
        setEditFormOGData(null)
      }
    }
  }, [editingItem])

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

  const handleUpdateGiftItem = async () => {
    if (!editingItem || !editForm.name.trim() || isSubmitting || !editForm.selectedListId) return
    
    const itemData = {
      name: editForm.name,
      description: editForm.description || undefined,
      price: editForm.price || undefined,
      link: editForm.link || undefined,
      image_url: editForm.imageUrl || undefined,
      list_id: editForm.selectedListId,
      is_gift_card: editForm.isGiftCard,
      is_group_gift: editForm.isGroupGift,
      gift_card_target_amount: editForm.isGiftCard && editForm.giftCardTargetAmount
        ? parseFloat(editForm.giftCardTargetAmount)
        : undefined,
      og_title: editFormOGData?.title,
      og_description: editFormOGData?.description,
      og_image: editFormOGData?.image,
      og_site_name: editFormOGData?.siteName,
    }

    await onUpdateGiftItem(itemData)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

          {/* Group Gift Section */}
          <div className="flex flex-col gap-4 p-4 border rounded-lg bg-purple-50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isGroupGift"
                checked={editForm.isGroupGift}
                onCheckedChange={(checked) => setEditForm((prev) => ({
                  ...prev,
                  isGroupGift: checked === true
                }))}
                disabled={isSubmitting}
              />
              <Label htmlFor="edit-isGroupGift" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                This is a group gift
              </Label>
            </div>
            {editForm.isGroupGift && (
              <p className="text-xs text-muted-foreground">
                Family members can express interest in contributing to this group gift. This helps coordinate who wants to participate.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
  )
}

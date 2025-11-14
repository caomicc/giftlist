"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, CreditCard } from 'lucide-react'

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

interface AddGiftFormProps {
  currentUser: User
  userLists: UserList[]
  onAddGiftItem: (itemData: any) => Promise<void>
  fetchOGData: (url: string) => Promise<any>
  isSubmitting: boolean
}

export default function AddGiftForm({ 
  currentUser, 
  userLists, 
  onAddGiftItem, 
  fetchOGData,
  isSubmitting 
}: AddGiftFormProps) {
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    link: "",
    imageUrl: "",
    isGiftCard: false,
    giftCardTargetAmount: "",
    selectedListId: userLists.length > 0 ? userLists[0].id : ""
  })
  const [newItemOGData, setNewItemOGData] = useState<any>(null)
  const [newItemOGLoading, setNewItemOGLoading] = useState(false)

  // Handle OG data fetching for new item
  const handleNewItemLinkChange = async (link: string) => {
    setNewItem((prev) => ({ ...prev, link }))

    if (link && link.startsWith('http')) {
      setNewItemOGLoading(true)
      const ogData = await fetchOGData(link)
      setNewItemOGData(ogData)
      setNewItemOGLoading(false)

      // Auto-fill fields if empty and OG data exists
      if (ogData) {
        setNewItem((prev) => ({
          ...prev,
          name: !prev.name && ogData.title ? ogData.title : prev.name,
          price: !prev.price && ogData.price ? ogData.price : prev.price,
          imageUrl: !prev.imageUrl && ogData.image ? ogData.image : prev.imageUrl,
        }))
      }
    } else {
      setNewItemOGData(null)
      setNewItemOGLoading(false)
    }
  }

  const handleAddGiftItem = async () => {
    if (!newItem.name.trim() || isSubmitting || !newItem.selectedListId) return

    const itemData = {
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
    }

    await onAddGiftItem(itemData)

    // Reset form but keep the same list selected
    setNewItem(prev => ({
      name: "",
      description: "",
      price: "",
      link: "",
      imageUrl: "",
      isGiftCard: false,
      giftCardTargetAmount: "",
      selectedListId: prev.selectedListId
    }))
    setNewItemOGData(null)
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useTranslation } from "./i18n-provider"

interface UserList {
  id: string
  name: string
}

interface AddItemDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lists: UserList[]
  defaultListId?: string
  onSuccess?: () => void
}

export function AddItemDrawer({
  open,
  onOpenChange,
  lists,
  defaultListId,
  onSuccess,
}: AddItemDrawerProps) {
  const { t } = useTranslation("gifts")
  const { t: tCommon } = useTranslation("common")
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingOG, setIsLoadingOG] = useState(false)
  const [ogData, setOGData] = useState<{
    title?: string
    description?: string
    image?: string
    price?: string
  } | null>(null)

  const [form, setForm] = useState({
    link: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    isGiftCard: false,
    isGroupGift: false,
    giftCardTargetAmount: "",
    listId: defaultListId || (lists.length > 0 ? lists[0].id : ""),
  })

  const fetchOGData = async (url: string) => {
    if (!url.startsWith("http")) return
    setIsLoadingOG(true)
    try {
      const response = await fetch(
        `/api/og-data?url=${encodeURIComponent(url)}`
      )
      if (response.ok) {
        const data = await response.json()
        setOGData(data)
        // Auto-fill empty fields
        setForm((prev) => ({
          ...prev,
          name: !prev.name && data.title ? data.title : prev.name,
          price: !prev.price && data.price ? data.price : prev.price,
          imageUrl: !prev.imageUrl && data.image ? data.image : prev.imageUrl,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch OG data:", error)
    } finally {
      setIsLoadingOG(false)
    }
  }

  const handleLinkBlur = () => {
    if (form.link && !ogData) {
      fetchOGData(form.link)
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.listId) return
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/gift-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price: form.price.trim() || undefined,
          link: form.link.trim() || undefined,
          image_url: form.imageUrl.trim() || undefined,
          list_id: form.listId,
          is_gift_card: form.isGiftCard,
          is_group_gift: form.isGroupGift,
          gift_card_target_amount:
            form.isGiftCard && form.giftCardTargetAmount
              ? parseFloat(form.giftCardTargetAmount)
              : undefined,
          og_title: ogData?.title,
          og_description: ogData?.description,
          og_image: ogData?.image,
        }),
      })

      if (!response.ok) throw new Error("Failed to add item")

      // Reset form
      setForm({
        link: "",
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        isGiftCard: false,
        isGroupGift: false,
        giftCardTargetAmount: "",
        listId: form.listId,
      })
      setOGData(null)
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Failed to add item:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm({
      link: "",
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      isGiftCard: false,
      isGroupGift: false,
      giftCardTargetAmount: "",
      listId: defaultListId || (lists.length > 0 ? lists[0].id : ""),
    })
    setOGData(null)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{t.addForm?.buttons?.submit || "Add Gift Idea"}</DrawerTitle>
          <DrawerDescription>
            {t.myGifts?.description ||
              "Add items you'd like to receive. Family members can see this list."}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto space-y-4">
          {/* Link Field */}
          <div className="space-y-2">
            <Label htmlFor="link">{t.addForm?.labels?.link || "Link"}</Label>
            <Input
              id="link"
              placeholder={t.addForm?.placeholders?.link || "Link (optional)"}
              value={form.link}
              onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
              onBlur={handleLinkBlur}
            />
            {isLoadingOG && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t.addForm?.messages?.loadingPreview || "Loading link preview..."}
              </p>
            )}
            {ogData?.title && (
              <p className="text-xs text-green-600">
                ✓ {t.addForm?.messages?.previewLoaded?.replace("{{title}}", ogData.title) || 
                   `Link preview loaded: ${ogData.title}`}
              </p>
            )}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">{t.addForm?.labels?.gift || "Gift"} *</Label>
            <Input
              id="name"
              placeholder={t.addForm?.placeholders?.gift || "Gift item name *"}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Price Field */}
          <div className="space-y-2">
            <Label htmlFor="price">{t.addForm?.labels?.price || "Price"}</Label>
            <Input
              id="price"
              placeholder={t.addForm?.placeholders?.priceExample || "e.g., 100.00"}
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>

          {/* List Selection */}
          {lists.length > 1 && (
            <div className="space-y-2">
              <Label>{t.addForm?.labels?.addToList || "Add to List"}</Label>
              <Select
                value={form.listId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, listId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.addForm?.placeholders?.selectList || "Select a list..."} />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t.addForm?.labels?.description || "Description"}</Label>
            <Textarea
              id="description"
              placeholder={t.addForm?.placeholders?.description || "Description (optional)"}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Gift Card Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGiftCard"
              checked={form.isGiftCard}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isGiftCard: checked === true }))
              }
            />
            <Label htmlFor="isGiftCard" className="text-sm cursor-pointer">
              {t.addForm?.labels?.isGiftCard || "This is a gift card"}
            </Label>
          </div>

          {form.isGiftCard && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="giftCardAmount">
                {t.addForm?.labels?.targetAmount || "Target Amount (optional)"}
              </Label>
              <Input
                id="giftCardAmount"
                placeholder="e.g., 100.00"
                value={form.giftCardTargetAmount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, giftCardTargetAmount: e.target.value }))
                }
              />
            </div>
          )}

          {/* Group Gift Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isGroupGift"
              checked={form.isGroupGift}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isGroupGift: checked === true }))
              }
            />
            <Label htmlFor="isGroupGift" className="text-sm cursor-pointer">
              {t.addForm?.labels?.isGroupGift || "This is a group gift"}
            </Label>
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.listId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.addForm?.buttons?.submitting || "Adding..."}
              </>
            ) : (
              t.addForm?.buttons?.submit || "Add Gift Idea"
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={resetForm}>
              {tCommon.cancel || "Cancel"}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

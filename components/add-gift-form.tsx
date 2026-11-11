"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, CreditCard, Users, Gift } from 'lucide-react'
import { useTranslation, formatMessage } from "./i18n-provider"

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
  /** Pre-fills the quick-add field (e.g. a link shared from the bookmarklet) */
  initialQuery?: string
  /** Called after a successful save with the list it went to */
  onAdded?: (listId: string) => void
  /** Focus the field on mount */
  autoFocus?: boolean
  /** Name to use when the link preview has no title (e.g. the page title from the bookmarklet) */
  fallbackName?: string
}

type GiftType = 'item' | 'gift-card' | 'group-gift'

const isUrl = (value: string) => /^https?:\/\/\S+/i.test(value.trim())

// Remember the last list a gift was added to (per browser; purely a convenience)
const LAST_LIST_KEY = 'meep:lastListId'
const readLastList = () => {
  try { return window.localStorage.getItem(LAST_LIST_KEY) } catch { return null }
}
const writeLastList = (id: string) => {
  try { window.localStorage.setItem(LAST_LIST_KEY, id) } catch { /* storage unavailable */ }
}

const emptyItem = (selectedListId: string) => ({
  link: "",
  name: "",
  price: "",
  description: "",
  imageUrl: "",
  type: 'item' as GiftType,
  giftCardTargetAmount: "",
  selectedListId,
})

/**
 * Quick add: one field that takes either a product link or a gift name.
 * Details (type, price, description, list) appear once something is typed.
 */
export default function AddGiftForm({
  currentUser,
  userLists,
  onAddGiftItem,
  fetchOGData,
  isSubmitting,
  initialQuery,
  onAdded,
  autoFocus,
  fallbackName,
}: AddGiftFormProps) {
  const { t } = useTranslation('gifts')
  const tForm = t.addForm || {}
  const tQuick = tForm.quick || {}

  const [query, setQuery] = useState("")
  const [item, setItem] = useState(() => emptyItem(""))
  const [lastListId, setLastListId] = useState<string | null>(null)
  const [ogData, setOgData] = useState<any>(null)
  const [ogLoading, setOgLoading] = useState(false)
  const latestLink = useRef("")

  const isLinkMode = isUrl(query)
  const isExpanded = query.trim().length > 0
  const rememberedList = lastListId && userLists.some((l) => l.id === lastListId) ? lastListId : null
  const selectedListId = item.selectedListId || rememberedList || userLists[0]?.id || ""
  const giftName = isLinkMode ? item.name : query

  const handleQueryChange = async (value: string) => {
    setQuery(value)

    if (!isUrl(value)) {
      latestLink.current = ""
      setOgData(null)
      setOgLoading(false)
      setItem((prev) => ({ ...prev, link: "" }))
      return
    }

    const link = value.trim()
    if (link === latestLink.current) return
    latestLink.current = link
    setItem((prev) => ({ ...prev, link }))
    setOgLoading(true)
    const data = await fetchOGData(link)
    // Ignore responses for a link the user has since replaced
    if (latestLink.current !== link) return
    setOgData(data)
    setOgLoading(false)
    setItem((prev) => ({
      ...prev,
      name: prev.name || data?.title || fallbackName || "",
      price: prev.price || data?.price || "",
      imageUrl: prev.imageUrl || data?.image || "",
    }))
  }

  useEffect(() => {
    setLastListId(readLastList())
  }, [])

  // Pre-fill once (e.g. /add?url=…); runs the same link preview as typing would
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !initialQuery) return
    prefilled.current = true
    handleQueryChange(initialQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  const reset = () => {
    setQuery("")
    setItem((prev) => emptyItem(prev.selectedListId))
    setOgData(null)
    setOgLoading(false)
    latestLink.current = ""
  }

  const canSubmit = !!giftName.trim() && !!selectedListId && !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const isGiftCard = item.type === 'gift-card'
    try {
      await onAddGiftItem({
        name: giftName.trim(),
        description: item.description || undefined,
        price: !isGiftCard && item.price ? item.price : undefined,
        link: item.link || undefined,
        image_url: item.imageUrl || undefined,
        owner_id: currentUser.id,
        list_id: selectedListId,
        is_gift_card: isGiftCard,
        is_group_gift: item.type === 'group-gift',
        gift_card_target_amount: isGiftCard && item.giftCardTargetAmount
          ? parseFloat(item.giftCardTargetAmount)
          : undefined,
        og_title: ogData?.title,
        og_description: ogData?.description,
        og_image: ogData?.image,
        og_site_name: ogData?.siteName,
      })
      writeLastList(selectedListId)
      setLastListId(selectedListId)
      reset()
      onAdded?.(selectedListId)
    } catch {
      // Save failed (the app shows a toast): keep what the user typed
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="add-gift-query" className="sr-only">
          {tQuick.label || 'Add a gift idea'}
        </Label>
        <div>
          <Input
            id="add-gift-query"
            placeholder={tQuick.placeholder || 'Paste a link or type a gift'}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            disabled={isSubmitting}
            autoComplete="off"
            autoFocus={autoFocus}
            aria-describedby="add-gift-status"
          />
        </div>
        <p id="add-gift-status" aria-live="polite" className="text-xs text-muted-foreground empty:hidden flex items-center gap-1">
          {ogLoading && (
            <>
              <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              {tForm.messages?.loadingPreview || 'Loading link preview...'}
            </>
          )}
          {!ogLoading && isLinkMode && ogData &&
            formatMessage(tForm.messages?.previewLoaded || 'Preview loaded: {{title}}', { title: ogData.title || item.link })}
          {!ogLoading && isLinkMode && !ogData && item.link &&
            (tForm.messages?.previewFailed || "Couldn't load a preview. Some shops block it, so add the name yourself.")}
        </p>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {isLinkMode && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-gift-name">{tQuick.nameLabel || 'Gift name'}</Label>
              <Input
                id="add-gift-name"
                placeholder={tForm.placeholders?.gift || 'What is it?'}
                value={item.name}
                onChange={(e) => setItem((prev) => ({ ...prev, name: e.target.value }))}
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span id="add-gift-type-label" className="text-sm font-medium">{tQuick.typeLabel || 'Type'}</span>
            <ToggleGroup
              type="single"
              variant="outline"
              value={item.type}
              onValueChange={(value) => { if (value) setItem((prev) => ({ ...prev, type: value as GiftType })) }}
              aria-labelledby="add-gift-type-label"
              className="w-full"
              disabled={isSubmitting}
            >
              <ToggleGroupItem value="item" className="flex-1 max-md:min-h-11">
                <Gift className="size-4" aria-hidden="true" />
                {tQuick.types?.item || 'Item'}
              </ToggleGroupItem>
              <ToggleGroupItem value="gift-card" className="flex-1 max-md:min-h-11">
                <CreditCard className="size-4" aria-hidden="true" />
                {tQuick.types?.giftCard || 'Gift card'}
              </ToggleGroupItem>
              <ToggleGroupItem value="group-gift" className="flex-1 max-md:min-h-11">
                <Users className="size-4" aria-hidden="true" />
                {tQuick.types?.groupGift || 'Group gift'}
              </ToggleGroupItem>
            </ToggleGroup>
            {item.type === 'gift-card' && (
              <p className="text-xs text-muted-foreground">
                {tForm.messages?.giftCardHelp || 'Family members record what they put toward it. Leave the target blank for no limit.'}
              </p>
            )}
            {item.type === 'group-gift' && (
              <p className="text-xs text-muted-foreground">
                {tForm.messages?.groupGiftHelp || "Family members can say they'd like to chip in, so you can coordinate who's in."}
              </p>
            )}
          </div>

          {item.type === 'gift-card' ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-gift-target">
                {tForm.labels?.targetAmount || 'Target amount'} <span className="font-normal text-muted-foreground">({tQuick.optional || 'optional'})</span>
              </Label>
              <Input
                id="add-gift-target"
                placeholder={tForm.placeholders?.priceExample || 'e.g., 100.00'}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={item.giftCardTargetAmount}
                onChange={(e) => setItem((prev) => ({ ...prev, giftCardTargetAmount: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-gift-price">
                {tForm.labels?.price || 'Price'} <span className="font-normal text-muted-foreground">({tQuick.optional || 'optional'})</span>
              </Label>
              <Input
                id="add-gift-price"
                inputMode="decimal"
                value={item.price}
                onChange={(e) => setItem((prev) => ({ ...prev, price: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="add-gift-description">
              {tForm.labels?.description || 'Description'} <span className="font-normal text-muted-foreground">({tQuick.optional || 'optional'})</span>
            </Label>
            <Textarea
              id="add-gift-description"
              value={item.description}
              onChange={(e) => setItem((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          {!ogData?.image && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-gift-image">
                {tForm.labels?.imageUrl || 'Image URL'} <span className="font-normal text-muted-foreground">({tQuick.optional || 'optional'})</span>
              </Label>
              <Input
                id="add-gift-image"
                type="url"
                inputMode="url"
                value={item.imageUrl}
                onChange={(e) => setItem((prev) => ({ ...prev, imageUrl: e.target.value }))}
                disabled={isSubmitting}
                aria-describedby="add-gift-image-help"
              />
              <p id="add-gift-image-help" className="text-xs text-muted-foreground">
                {tForm.messages?.imageUrlHelp || "Only needed if the link didn't give us a picture."}
              </p>
            </div>
          )}

          {userLists.length > 1 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-gift-list">{tForm.labels?.addToList || 'Add to List'}</Label>
              <Select
                value={selectedListId}
                onValueChange={(value) => setItem((prev) => ({ ...prev, selectedListId: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger id="add-gift-list" className="w-full">
                  <SelectValue placeholder={tForm.placeholders?.selectList || 'Select a list...'} />
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
          )}

          <div className="flex gap-2 max-md:flex-col-reverse md:justify-end">
            <Button type="button" variant="ghost" onClick={reset} disabled={isSubmitting}>
              {tQuick.cancel || 'Cancel'}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <Plus className="size-4" aria-hidden="true" />}
              {isSubmitting ? (tForm.buttons?.submitting || 'Adding…') : (tForm.buttons?.submit || 'Add Gift Idea')}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Gift, UserX } from 'lucide-react'
import { useTranslation, formatMessage } from "./i18n-provider"

interface User {
  id: string
  name: string
  email: string
}

interface SuggestGiftDialogProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  familyMembers: User[]
  targetUserId?: string | null // Pre-selected target user
  onSubmit: (suggestion: {
    target_user_id: string
    name?: string
    description?: string
    price?: string
    link?: string
    image_url?: string
    is_anonymous?: boolean
    og_title?: string
    og_description?: string
    og_image?: string
    og_site_name?: string
  }) => Promise<void>
  fetchOGData: (url: string) => Promise<any>
}

export default function SuggestGiftDialog({
  isOpen,
  onClose,
  currentUser,
  familyMembers,
  targetUserId,
  onSubmit,
  fetchOGData,
}: SuggestGiftDialogProps) {
  const { t } = useTranslation('gifts')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ogData, setOgData] = useState<any>(null)
  const [ogLoading, setOgLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    targetUserId: targetUserId || "",
    name: "",
    description: "",
    price: "",
    link: "",
    imageUrl: "",
    isAnonymous: false,
  })

  // Reset form when dialog opens/closes or target changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        targetUserId: targetUserId || "",
        name: "",
        description: "",
        price: "",
        link: "",
        imageUrl: "",
        isAnonymous: false,
      })
      setOgData(null)
    }
  }, [isOpen, targetUserId])

  // Filter out current user from family members
  const availableMembers = familyMembers.filter(m => m.id !== currentUser.id)

  // Handle OG data fetching
  const handleLinkChange = async (link: string) => {
    setFormData((prev) => ({ ...prev, link }))

    if (link && link.startsWith('http')) {
      setOgLoading(true)
      const data = await fetchOGData(link)
      setOgData(data)
      setOgLoading(false)

      // Auto-fill fields if empty and OG data exists
      if (data) {
        setFormData((prev) => ({
          ...prev,
          name: !prev.name && data.title ? data.title : prev.name,
          price: !prev.price && data.price ? data.price : prev.price,
          imageUrl: !prev.imageUrl && data.image ? data.image : prev.imageUrl,
        }))
      }
    } else {
      setOgData(null)
      setOgLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.targetUserId || (!formData.name.trim() && !formData.link.trim())) return
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        target_user_id: formData.targetUserId,
        name: formData.name || ogData?.title || undefined,
        description: formData.description || undefined,
        price: formData.price || undefined,
        link: formData.link || undefined,
        image_url: formData.imageUrl || ogData?.image || undefined,
        is_anonymous: formData.isAnonymous,
        og_title: ogData?.title,
        og_description: ogData?.description,
        og_image: ogData?.image,
        og_site_name: ogData?.siteName,
      })
      onClose()
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMember = availableMembers.find(m => m.id === formData.targetUserId)
  const canSubmit = formData.targetUserId && (formData.name.trim() || formData.link.trim())

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            {t.suggestions?.suggestGift || 'Suggest a Gift'}
          </DialogTitle>
          <DialogDescription>
            {selectedMember
              ? formatMessage(t.suggestions?.suggestTo || 'Suggest a gift idea to {{name}}', { name: selectedMember.name })
              : t.suggestions?.selectMember || 'Select a family member to suggest a gift to'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target User Selector */}
          {!targetUserId && (
            <div className="flex flex-col gap-2">
              <Label>{t.suggestions?.suggestTo || 'Suggest to'}:</Label>
              <Select
                value={formData.targetUserId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, targetUserId: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.suggestions?.selectMember || 'Select a family member...'} />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Link Input */}
          <div className="flex flex-col gap-2">
            <Label>{t.addForm?.labels?.link || 'Link'}:</Label>
            <Input
              placeholder={t.suggestions?.linkPlaceholder || 'Paste a product link...'}
              value={formData.link}
              onChange={(e) => handleLinkChange(e.target.value)}
              disabled={isSubmitting}
            />
            {ogLoading && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t.addForm?.messages?.loadingPreview || 'Loading link preview...'}
              </div>
            )}
            {!ogLoading && ogData && (
              <div className="text-xs text-green-600 flex items-center gap-1">
                {formatMessage(t.addForm?.messages?.previewLoaded || '✓ Preview loaded: {{title}}', { title: ogData.title || 'Data found' })}
              </div>
            )}
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <Label>{t.addForm?.labels?.gift || 'Gift name'}:</Label>
            <Input
              placeholder={t.suggestions?.namePlaceholder || 'Gift name (or auto-filled from link)'}
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          {/* Price Input */}
          <div className="flex flex-col gap-2">
            <Label>{t.addForm?.labels?.price || 'Price'} ({t.suggestions?.optional || 'optional'}):</Label>
            <Input
              placeholder={t.addForm?.placeholders?.price || 'Price'}
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          {/* Description/Message */}
          <div className="flex flex-col gap-2">
            <Label>{t.suggestions?.message || 'Message'} ({t.suggestions?.optional || 'optional'}):</Label>
            <Textarea
              placeholder={t.suggestions?.messagePlaceholder || 'Add a note about why you think they\'d like this...'}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Anonymous Toggle */}
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
            <Checkbox
              id="isAnonymous"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) => setFormData((prev) => ({
                ...prev,
                isAnonymous: checked === true
              }))}
              disabled={isSubmitting}
            />
            <Label htmlFor="isAnonymous" className="flex items-center gap-2 cursor-pointer">
              <UserX className="w-4 h-4" />
              {t.suggestions?.anonymous || 'Send anonymously'}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2 ml-1">
            {t.suggestions?.anonymousHelp || 'Your identity will be hidden from the recipient, but revealed to other family members if they add it to their list.'}
          </p>

          {/* Preview Image */}
          {(ogData?.image || formData.imageUrl) && (
            <div className="flex flex-col gap-2">
              <Label>{t.suggestions?.preview || 'Preview'}:</Label>
              <img
                src={ogData?.image || formData.imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-md border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t.suggestions?.cancel || 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.suggestions?.sending || 'Sending...'}
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                {t.suggestions?.send || 'Send Suggestion'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

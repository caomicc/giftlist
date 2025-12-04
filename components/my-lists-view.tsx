"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Edit2, Eye, EyeOff, Trash2, ClipboardList, Gift } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AddItemDrawer } from "@/components/add-item-drawer"
import { cn } from "@/lib/utils"
import { useTranslation, formatMessage } from "./i18n-provider"

interface ListPermission {
  list_id: string
  user_id: string
  can_view: boolean
}

interface UserList {
  id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  item_count: number
  archived_count: number
  permissions: ListPermission[]
}

interface MyListsViewProps {
  lists: UserList[]
  allUsers: { id: string; name: string }[]
  currentUserId: string
  locale: string
}

export function MyListsView({
  lists,
  allUsers,
  currentUserId,
  locale,
}: MyListsViewProps) {
  const { t } = useTranslation("gifts")
  const { t: tCommon } = useTranslation("common")
  const router = useRouter()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddItemDrawerOpen, setIsAddItemDrawerOpen] = useState(false)
  const [selectedList, setSelectedList] = useState<UserList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [visibilityMode, setVisibilityMode] = useState<"all" | "hidden_from" | "visible_to">("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Other family members (excluding current user)
  const otherMembers = allUsers.filter(u => u.id !== currentUserId)

  const handleCreateList = async () => {
    if (!name.trim()) return
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          visibility_mode: visibilityMode,
          selected_users: selectedUsers,
        }),
      })

      if (!response.ok) throw new Error("Failed to create list")

      setIsCreateDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error("Error creating list:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditList = async () => {
    if (!selectedList || !name.trim()) return
    setIsSubmitting(true)

    try {
      // Calculate permissions based on visibility mode
      let permissions: { user_id: string; can_view: boolean }[] = []
      if (visibilityMode !== "all") {
        permissions = selectedUsers.map(userId => ({
          user_id: userId,
          can_view: visibilityMode === "visible_to"
        }))
      }

      const response = await fetch(`/api/lists/${selectedList.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          permissions,
        }),
      })

      if (!response.ok) throw new Error("Failed to update list")

      setIsEditDialogOpen(false)
      setSelectedList(null)
      resetForm()
      router.refresh()
    } catch (error) {
      console.error("Error updating list:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm(t.myLists?.confirmDelete || "Are you sure you want to delete this list and all its items?")) {
      return
    }

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete list")

      router.refresh()
    } catch (error) {
      console.error("Error deleting list:", error)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setIsPublic(false)
    setVisibilityMode("all")
    setSelectedUsers([])
  }

  const openEditDialog = async (list: UserList) => {
    setSelectedList(list)
    setName(list.name)
    setDescription(list.description || "")
    setIsPublic(list.is_public)

    // Set default state first
    setVisibilityMode("all")
    setSelectedUsers([])
    setIsEditDialogOpen(true)

    // Then load existing permissions
    try {
      const response = await fetch(`/api/lists/${list.id}/permissions`)
      if (response.ok) {
        const data = await response.json()
        const permissions = data.permissions || []

        // Only look at explicit permissions to determine the mode
        const explicitPermissions = permissions.filter((p: any) => p.is_explicit)

        if (explicitPermissions.length > 0) {
          // Determine visibility mode from explicit permissions only
          const hiddenUsers = explicitPermissions.filter((p: any) => !p.can_view).map((p: any) => p.user_id)
          const visibleUsers = explicitPermissions.filter((p: any) => p.can_view).map((p: any) => p.user_id)

          if (hiddenUsers.length > 0 && visibleUsers.length === 0) {
            setVisibilityMode("hidden_from")
            setSelectedUsers(hiddenUsers)
          } else if (visibleUsers.length > 0 && hiddenUsers.length === 0) {
            setVisibilityMode("visible_to")
            setSelectedUsers(visibleUsers)
          }
          // If mixed, keep default "all"
        }
        // If no explicit permissions, keep default "all"
      }
    } catch (error) {
      console.error("Failed to load permissions:", error)
      // Keep defaults on error
    }
  }

  const itemsLabel = (count: number) => {
    const message =
      count === 1
        ? tCommon.counts?.items || "{{count}} item"
        : tCommon.counts?.itemsPlural || "{{count}} items"
    return formatMessage(message, { count })
  }

  return (
    <div className="space-y-4">
      {/* Lists */}
      {lists.length === 0 ? (
        <Card className="py-0">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">
              {t.myLists?.empty || "No lists yet"}
            </p>
            <p className="text-sm mt-1">
              {t.myLists?.emptyHelp || "Create your first wishlist to start adding gift ideas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <Card key={list.id} className="overflow-hidden py-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/${locale}/my-lists/${list.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                        {list.name}
                      </h3>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={list.is_public ? "default" : "secondary"}
                            className="shrink-0 cursor-help"
                          >
                            {list.is_public ? (
                              <Eye className="w-3 h-3 mr-1" />
                            ) : (
                              <EyeOff className="w-3 h-3 mr-1" />
                            )}
                            {list.is_public
                              ? t.myGifts?.trackPurchases || "Tracked"
                              : t.myGifts?.keepSurprise || "Surprise"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {list.is_public
                              ? t.familyGifts?.purchaseTracking?.trackedDescription ||
                                "You can see who purchased items"
                              : t.familyGifts?.purchaseTracking?.surpriseDescription ||
                                "Purchase info is hidden from you"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {list.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {list.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {itemsLabel(list.item_count)}
                      {list.archived_count > 0 && (
                        <span className="opacity-75">
                          {" "}
                          ·{" "}
                          {formatMessage(
                            tCommon.counts?.archivedPlural || "{{count}} archived",
                            { count: list.archived_count }
                          )}
                        </span>
                      )}
                    </p>
                  </Link>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(list)}
                      className="h-9 w-9"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteList(list.id)}
                      className="h-9 w-9 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create List Button */}
      <Button
        onClick={() => {
          resetForm()
          setIsCreateDialogOpen(true)
        }}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t.myLists?.createNew || "Create New List"}
      </Button>

      {/* Add Gift Item Button */}
      {lists.length > 0 && (
        <Button
          onClick={() => setIsAddItemDrawerOpen(true)}
          className="w-full"
          variant="default"
        >
          <Gift className="h-4 w-4 mr-2" />
          {t.addForm?.buttons?.submit || "Add Gift Idea"}
        </Button>
      )}

      {/* Create List Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.myLists?.createTitle || "Create New List"}</DialogTitle>
            <DialogDescription>
              {t.myLists?.createDescription ||
                "Create a new wishlist to organize your gift ideas."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.myLists?.nameLabel || "List Name"}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.myLists?.namePlaceholder || "e.g., Christmas 2024"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t.myLists?.descriptionLabel || "Description"}{" "}
                <span className="text-muted-foreground">
                  ({tCommon.optional || "optional"})
                </span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.myLists?.descriptionPlaceholder || "Add a description..."}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="is_public">
                  {t.myLists?.visibilityLabel || "Track Purchases"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t.myLists?.visibilityHelp ||
                    "If enabled, you'll see who purchased items from this list."}
                </p>
              </div>
              <Switch
                id="is_public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="shrink-0"
              />
            </div>

            {/* List Visibility (Who can see this list) */}
            <div className="p-3 border rounded-lg space-y-3">
              <div>
                <Label>{t.myLists?.listVisibilityLabel || "Who can see this list"}</Label>
                <p className="text-sm text-muted-foreground">
                  {t.myLists?.listVisibilityHelp || "Control which family members can view this list."}
                </p>
              </div>

              <RadioGroup
                value={visibilityMode}
                onValueChange={(value: "all" | "hidden_from" | "visible_to") => {
                  setVisibilityMode(value)
                  setSelectedUsers([])
                }}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="visibility-all" />
                  <Label htmlFor="visibility-all" className="text-sm font-normal cursor-pointer">
                    {t.myLists?.visibilityAll || "Visible to everyone"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden_from" id="visibility-hidden" />
                  <Label htmlFor="visibility-hidden" className="text-sm font-normal cursor-pointer">
                    {t.myLists?.visibilityHidden || "Hidden from specific people"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visible_to" id="visibility-visible" />
                  <Label htmlFor="visibility-visible" className="text-sm font-normal cursor-pointer">
                    {t.myLists?.visibilitySpecific || "Only visible to specific people"}
                  </Label>
                </div>
              </RadioGroup>

              {visibilityMode !== "all" && otherMembers.length > 0 && (
                <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                  <Label className="text-sm font-medium">
                    {visibilityMode === "hidden_from"
                      ? (t.myLists?.selectToHide || "Select people to hide from:")
                      : (t.myLists?.selectToShow || "Select people who can view:")}
                  </Label>
                  <div className="space-y-2 mt-2">
                    {otherMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-member-${member.id}`}
                          checked={selectedUsers.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(prev => [...prev, member.id])
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== member.id))
                            }
                          }}
                        />
                        <Label htmlFor={`create-member-${member.id}`} className="text-sm font-normal cursor-pointer">
                          {member.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tCommon.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting
                ? tCommon.loading || "Creating..."
                : tCommon.create || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.myLists?.editTitle || "Edit List"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t.myLists?.nameLabel || "List Name"}</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">
                {t.myLists?.descriptionLabel || "Description"}{" "}
                <span className="text-muted-foreground">
                  ({tCommon.optional || "optional"})
                </span>
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 border rounded-lg">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="edit-is_public">
                  {t.myLists?.visibilityLabel || "Track Purchases"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t.myLists?.visibilityHelp ||
                    "If enabled, you'll see who purchased items from this list."}
                </p>
              </div>
              <Switch
                id="edit-is_public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="shrink-0"
              />
            </div>

            {/* List Visibility (Who can see this list) */}
            <div className="p-3 border rounded-lg space-y-3">
              <div>
                <Label>{t.myLists?.listVisibilityLabel || "Who can see this list"}</Label>
                <p className="text-sm text-muted-foreground">
                  {t.myLists?.listVisibilityHelp || "Control which family members can view this list."}
                </p>
              </div>

              <RadioGroup
                value={visibilityMode}
                onValueChange={(value: "all" | "hidden_from" | "visible_to") => {
                  setVisibilityMode(value)
                  setSelectedUsers([])
                }}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="edit-visibility-all" />
                  <Label htmlFor="edit-visibility-all" className="text-sm font-normal cursor-pointer">
                    {t.myLists?.visibilityAll || "Visible to everyone"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden_from" id="edit-visibility-hidden" />
                  <Label htmlFor="edit-visibility-hidden" className="text-sm font-normal cursor-pointer">
                    {t.myLists?.visibilityHidden || "Hidden from specific people"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visible_to" id="edit-visibility-visible" />
                  <Label htmlFor="edit-visibility-visible" className="text-sm font-normal cursor-pointer">
                    {t.myLists?.visibilitySpecific || "Only visible to specific people"}
                  </Label>
                </div>
              </RadioGroup>

              {visibilityMode !== "all" && otherMembers.length > 0 && (
                <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                  <Label className="text-sm font-medium">
                    {visibilityMode === "hidden_from"
                      ? (t.myLists?.selectToHide || "Select people to hide from:")
                      : (t.myLists?.selectToShow || "Select people who can view:")}
                  </Label>
                  <div className="space-y-2 mt-2">
                    {otherMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-member-${member.id}`}
                          checked={selectedUsers.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(prev => [...prev, member.id])
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== member.id))
                            }
                          }}
                        />
                        <Label htmlFor={`edit-member-${member.id}`} className="text-sm font-normal cursor-pointer">
                          {member.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tCommon.cancel || "Cancel"}
            </Button>
            <Button
              onClick={handleEditList}
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting
                ? tCommon.loading || "Saving..."
                : tCommon.save || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Drawer */}
      <AddItemDrawer
        open={isAddItemDrawerOpen}
        onOpenChange={setIsAddItemDrawerOpen}
        lists={lists.map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  )
}

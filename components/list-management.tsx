"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { useTranslation } from "./i18n-provider"

interface User {
  id: string
  name: string
  email: string
}

export interface UserList {
  id: string
  name: string
  description?: string | null
  is_public: boolean
  created_at: string
  item_count?: number
}

export type VisibilityMode = "all" | "hidden_from" | "visible_to"
/** Editable list fields (PUT /api/lists/[id]). */
export type ListFields = { name: string; description: string | null; is_public: boolean }
/** A new list plus who may see it (POST /api/lists, then permissions). */
export type NewListData = ListFields & { visibility_mode: VisibilityMode; selected_users: string[] }
/** Stored exception to a list's default visibility. */
export type ListPermissionInput = { user_id: string; can_view: boolean }
/** One member's effective visibility, from GET /api/lists/[id]/permissions. */
export type ListPermissionView = ListPermissionInput & { user_name: string; user_email: string; is_explicit: boolean }

interface ListManagementProps {
  userLists: UserList[]
  otherMembers: User[]
  /** Resolves true only when the list and its visibility rules saved; the dialog stays open otherwise */
  onCreateList: (listData: NewListData) => Promise<boolean>
  onUpdateList: (listId: string, listData: ListFields, permissions: ListPermissionInput[]) => Promise<boolean>
  onDeleteList: (listId: string) => Promise<void>
  fetchListPermissions: (listId: string) => Promise<{ permissions?: ListPermissionView[] }>
  /** The list whose edit dialog is open (opened from the list's own edit button) */
  editingListId: string | null
  onEditingListIdChange: (listId: string | null) => void
  isSubmitting: boolean
}

export default function ListManagement({
  userLists,
  otherMembers,
  onCreateList,
  onUpdateList,
  onDeleteList,
  fetchListPermissions,
  isSubmitting,
  editingListId,
  onEditingListIdChange,
}: ListManagementProps) {
  const { t } = useTranslation('lists')
  const { t: tCommon } = useTranslation('common')

  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false)

  const [newListForm, setNewListForm] = useState({
    name: "",
    description: "",
    isPublic: false,
    visibilityMode: "all" as "all" | "hidden_from" | "visible_to",
    selectedUsers: [] as string[]
  })


  const resetNewListForm = () => {
    setNewListForm({ name: "", description: "", isPublic: false, visibilityMode: "all", selectedUsers: [] })
  }


  const handleCreateList = async () => {
    if (!newListForm.name.trim() || isSubmitting) return

    const listData = {
      name: newListForm.name.trim(),
      description: newListForm.description.trim() || null,
      is_public: newListForm.isPublic,
      visibility_mode: newListForm.visibilityMode,
      selected_users: newListForm.selectedUsers
    }

    if (!(await onCreateList(listData))) return
    resetNewListForm()
    setIsCreateListDialogOpen(false)
  }

  const editingList = userLists.find(l => l.id === editingListId)

  return (
    <>
    {/* Create New List Dialog */}
    <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" aria-hidden="true" />
          {t.newList || 'New list'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.createDialog?.title}</DialogTitle>
          <DialogDescription>
            {t.createDialog?.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="list-name">{t.form?.listName}</Label>
            <Input
              id="list-name"
              value={newListForm.name}
              onChange={(e) => setNewListForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t.form?.listNamePlaceholder || ""}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="list-description">{t.form?.description}</Label>
            <Textarea
              id="list-description"
              value={newListForm.description}
              onChange={(e) => setNewListForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t.form?.descriptionPlaceholder || ""}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="list-privacy">{t.form?.purchaseVisibility}</Label>
              <p className="text-sm text-muted-foreground">
                {newListForm.isPublic
                  ? (t.form?.trackPurchasesHelp || "You'll see which gifts have been bought.")
                  : (t.form?.keepSurpriseHelp || "Kept a surprise: you won't see what's been bought.")}
              </p>
            </div>
            <Switch
              id="list-privacy"
              checked={newListForm.isPublic}
              onCheckedChange={(checked) => setNewListForm(prev => ({ ...prev, isPublic: checked }))}
              disabled={isSubmitting}
            />
          </div>
          <div className="p-4 border rounded-lg space-y-4">
            <div>
              <Label>{t.form?.listVisibility}</Label>
              <p className="text-sm text-muted-foreground mb-3">
                {t.form?.listVisibilityDescription}
              </p>
            </div>

            <RadioGroup
              value={newListForm.visibilityMode}
              onValueChange={(value: "all" | "hidden_from" | "visible_to") =>
                setNewListForm(prev => ({ ...prev, visibilityMode: value, selectedUsers: [] }))
              }
              disabled={isSubmitting}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="visibility-all" />
                <Label htmlFor="visibility-all" className="text-sm font-normal cursor-pointer">
                  {t.visibility?.visibleToAll}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hidden_from" id="visibility-hidden" />
                <Label htmlFor="visibility-hidden" className="text-sm font-normal cursor-pointer">
                  {t.visibility?.hiddenFromSpecific}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="visible_to" id="visibility-visible" />
                <Label htmlFor="visibility-visible" className="text-sm font-normal cursor-pointer">
                  {t.visibility?.visibleOnlyToSpecific}
                </Label>
              </div>
            </RadioGroup>

            {newListForm.visibilityMode !== "all" && (
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                <Label className="text-sm font-medium">
                  {newListForm.visibilityMode === "hidden_from"
                    ? (t.visibility?.selectToHide || "Select members to hide from")
                    : (t.visibility?.selectToShow || "Select members who can view")}
                </Label>
                <div className="space-y-2 mt-2">
                  {otherMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={newListForm.selectedUsers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewListForm(prev => ({
                              ...prev,
                              selectedUsers: [...prev.selectedUsers, member.id]
                            }))
                          } else {
                            setNewListForm(prev => ({
                              ...prev,
                              selectedUsers: prev.selectedUsers.filter((id: string) => id !== member.id)
                            }))
                          }
                        }}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`member-${member.id}`} className="text-sm font-normal cursor-pointer">
                        {member.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsCreateListDialogOpen(false)}
            disabled={isSubmitting}
          >
            {t.createDialog?.cancelButton || tCommon.cancel}
          </Button>
          <Button
            onClick={handleCreateList}
            disabled={!newListForm.name.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.createDialog?.submittingButton || "Creating..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {t.createDialog?.submitButton || "Create List"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      {/* Keyed by list: the form starts from the list being edited */}
      {editingList && (
        <EditListDialog
          key={editingList.id}
          list={editingList}
          canDelete={userLists.length > 1}
          otherMembers={otherMembers}
          onUpdateList={onUpdateList}
          onDeleteList={onDeleteList}
          fetchListPermissions={fetchListPermissions}
          isSubmitting={isSubmitting}
          onClose={() => onEditingListIdChange(null)}
        />
      )}
    </>
  )
}

type EditListDialogProps = Pick<ListManagementProps, 'otherMembers' | 'onUpdateList' | 'onDeleteList' | 'fetchListPermissions' | 'isSubmitting'> & {
  list: UserList
  /** The last list can't be deleted */
  canDelete: boolean
  onClose: () => void
}

function EditListDialog({ list, canDelete, otherMembers, onUpdateList, onDeleteList, fetchListPermissions, isSubmitting, onClose }: EditListDialogProps) {
  const { t } = useTranslation('lists')
  const { t: tCommon } = useTranslation('common')
  const [editListForm, setEditListForm] = useState({
    name: list.name,
    description: list.description || "",
    isPublic: list.is_public,
    visibilityMode: "all" as "all" | "hidden_from" | "visible_to",
    selectedUsers: [] as string[]
  })
  // Saving before the rules load would overwrite them with "visible to all", so wait for them
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  const [permissionsFailed, setPermissionsFailed] = useState(false)

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const response = await fetchListPermissions(list.id)
      const permissions: ListPermissionView[] = response?.permissions || []

      // Only consider explicit permissions (not defaults applied to new users)
      const explicitPermissions = permissions.filter(p => p.is_explicit)

      // Determine visibility mode based on explicit permissions only
      const explicitHiddenUsers = explicitPermissions.filter(p => !p.can_view).map(p => p.user_id)
      const explicitVisibleUsers = explicitPermissions.filter(p => p.can_view).map(p => p.user_id)

      let visibilityMode: "all" | "hidden_from" | "visible_to" = "all"
      let selectedUsers: string[] = []

      if (explicitPermissions.length === 0) {
        // No explicit permissions = visible to all
        visibilityMode = "all"
        selectedUsers = []
      } else if (explicitHiddenUsers.length > 0 && explicitVisibleUsers.length === 0) {
        // Only denials = "hidden from specific" mode
        visibilityMode = "hidden_from"
        selectedUsers = explicitHiddenUsers
      } else if (explicitVisibleUsers.length > 0 && explicitHiddenUsers.length === 0) {
        // Only approvals = "visible to specific" mode
        visibilityMode = "visible_to"
        selectedUsers = explicitVisibleUsers
      } else {
        // Mixed explicit permissions - shouldn't happen with our UI but fall back to "all"
        visibilityMode = "all"
        selectedUsers = []
      }

      if (ignore) return
      setEditListForm(prev => ({ ...prev, visibilityMode, selectedUsers }))
      setPermissionsLoaded(true)
    }
    load().catch(err => {
      console.error("Failed to fetch list permissions", err)
      if (!ignore) setPermissionsFailed(true)
    })
    return () => { ignore = true }
  }, [list.id, fetchListPermissions])

  const handleUpdateList = async () => {
    if (!editListForm.name.trim() || isSubmitting || !permissionsLoaded) return

    const listData = {
      name: editListForm.name.trim(),
      description: editListForm.description.trim() || null,
      is_public: editListForm.isPublic
    }

    // Calculate permissions based on visibility mode
    let permissions: ListPermissionInput[] = []

    // Only create explicit permissions if not in "visible to all" mode
    if (editListForm.visibilityMode !== "all") {
      // Only store exceptions to the default:
      // - "hidden_from" mode: store can_view=false for selected users (everyone else defaults to true)
      // - "visible_to" mode: store can_view=true for selected users (everyone else defaults to false)
      permissions = editListForm.selectedUsers.map(userId => ({
        user_id: userId,
        can_view: editListForm.visibilityMode === "visible_to" // true for visible_to, false for hidden_from
      }))
    }

    if (await onUpdateList(list.id, listData, permissions)) onClose()
  }

  return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="sm:max-w-[425px] overflow-y-scroll max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t.editDialog?.title}</DialogTitle>
            <DialogDescription>
              {t.editDialog?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-list-name">{t.form?.listName}</Label>
              <Input
                id="edit-list-name"
                value={editListForm.name}
                onChange={(e) => setEditListForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t.form?.listName || "List name"}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-list-description">{t.form?.description}</Label>
              <Textarea
                id="edit-list-description"
                value={editListForm.description}
                onChange={(e) => setEditListForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t.form?.descriptionPlaceholder || "Optional description"}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="edit-list-privacy">{t.form?.purchaseVisibility}</Label>
                <p className="text-sm text-muted-foreground">
                  {editListForm.isPublic
                    ? (t.form?.trackPurchasesHelp || "You'll see which gifts have been bought.")
                    : (t.form?.keepSurpriseHelp || "Kept a surprise: you won't see what's been bought.")}
                </p>
              </div>
              <Switch
                id="edit-list-privacy"
                checked={editListForm.isPublic}
                onCheckedChange={(checked) => setEditListForm(prev => ({ ...prev, isPublic: checked }))}
                disabled={isSubmitting}
              />
            </div>
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <Label>{t.form?.listVisibility}</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {t.form?.listVisibilityDescription}
                </p>
              </div>

              <RadioGroup
                value={editListForm.visibilityMode}
                onValueChange={(value: "all" | "hidden_from" | "visible_to") =>
                  setEditListForm(prev => ({ ...prev, visibilityMode: value, selectedUsers: [] }))
                }
                disabled={isSubmitting}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="edit-visibility-all" />
                  <Label htmlFor="edit-visibility-all" className="text-sm font-normal cursor-pointer">
                    {t.visibility?.visibleToAll}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hidden_from" id="edit-visibility-hidden" />
                  <Label htmlFor="edit-visibility-hidden" className="text-sm font-normal cursor-pointer">
                    {t.visibility?.hiddenFromSpecific}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visible_to" id="edit-visibility-visible" />
                  <Label htmlFor="edit-visibility-visible" className="text-sm font-normal cursor-pointer">
                    {t.visibility?.visibleOnlyToSpecific}
                  </Label>
                </div>
              </RadioGroup>

              {editListForm.visibilityMode !== "all" && (
                <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                  <Label className="text-sm font-medium">
                    {editListForm.visibilityMode === "hidden_from"
                      ? (t.visibility?.selectToHide || "Select members to hide from")
                      : (t.visibility?.selectToShow || "Select members who can view")}
                  </Label>
                  <div className="space-y-2 mt-2">
                    {otherMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-member-${member.id}`}
                          checked={editListForm.selectedUsers.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEditListForm(prev => ({
                                ...prev,
                                selectedUsers: [...prev.selectedUsers, member.id]
                              }))
                            } else {
                              setEditListForm(prev => ({
                                ...prev,
                                selectedUsers: prev.selectedUsers.filter((id: string) => id !== member.id)
                              }))
                            }
                          }}
                          disabled={isSubmitting}
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
          {permissionsFailed && (
            <p className="text-sm text-destructive">
              {t.editDialog?.loadFailed || "Couldn’t load who can see this list. Close this and try again."}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            {canDelete && (
              <Button
                variant="outline"
                onClick={() => onDeleteList(list.id)}
                disabled={isSubmitting}
                className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t.deleteList || 'Delete list'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t.editDialog?.cancelButton || tCommon.cancel}
            </Button>
            <Button
              onClick={handleUpdateList}
              disabled={!editListForm.name.trim() || isSubmitting || !permissionsLoaded}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.editDialog?.submittingButton || "Updating..."}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  {t.editDialog?.submitButton || "Update List"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Settings, Edit, Trash2, Gift, Loader2 } from 'lucide-react'

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

interface ListManagementProps {
  userLists: UserList[]
  otherMembers: User[]
  onCreateList: (listData: any) => Promise<void>
  onUpdateList: (listId: string, listData: any, permissions: any[]) => Promise<void>
  onDeleteList: (listId: string) => Promise<void>
  fetchListPermissions: (listId: string) => Promise<any>
  isSubmitting: boolean
}

export default function ListManagement({
  userLists,
  otherMembers,
  onCreateList,
  onUpdateList,
  onDeleteList,
  fetchListPermissions,
  isSubmitting
}: ListManagementProps) {
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false)
  const [isManageListsDialogOpen, setIsManageListsDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<any>(null)
  
  const [newListForm, setNewListForm] = useState({
    name: "",
    description: "",
    isPublic: false,
    visibilityMode: "all" as "all" | "hidden_from" | "visible_to",
    selectedUsers: [] as string[]
  })
  
  const [editListForm, setEditListForm] = useState({
    name: "",
    description: "",
    isPublic: false,
    visibilityMode: "all" as "all" | "hidden_from" | "visible_to",
    selectedUsers: [] as string[]
  })

  const resetNewListForm = () => {
    setNewListForm({ name: "", description: "", isPublic: false, visibilityMode: "all", selectedUsers: [] })
  }

  const resetEditListForm = () => {
    setEditListForm({ name: "", description: "", isPublic: false, visibilityMode: "all", selectedUsers: [] })
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

    await onCreateList(listData)
    resetNewListForm()
    setIsCreateListDialogOpen(false)
  }

  const handleEditList = async (list: any) => {
    setEditingList(list)

    try {
      const { permissions } = await fetchListPermissions(list.id)
      
      // Determine visibility mode based on permissions
      const hiddenUsers = permissions.filter((p: any) => !p.can_view).map((p: any) => p.user_id)
      const visibleUsers = permissions.filter((p: any) => p.can_view).map((p: any) => p.user_id)
      
      let visibilityMode: "all" | "hidden_from" | "visible_to" = "all"
      let selectedUsers: string[] = []
      
      if (hiddenUsers.length > 0 && hiddenUsers.length < permissions.length) {
        visibilityMode = "hidden_from"
        selectedUsers = hiddenUsers
      } else if (visibleUsers.length > 0 && visibleUsers.length < permissions.length) {
        visibilityMode = "visible_to"
        selectedUsers = visibleUsers
      }

      setEditListForm({
        name: list.name,
        description: list.description || "",
        isPublic: list.is_public,
        visibilityMode: visibilityMode,
        selectedUsers: selectedUsers
      })
    } catch (err) {
      console.error("Failed to fetch list permissions:", err)
      setEditListForm({
        name: list.name,
        description: list.description || "",
        isPublic: list.is_public,
        visibilityMode: "all",
        selectedUsers: []
      })
    }
  }

  const handleUpdateList = async () => {
    if (!editingList || !editListForm.name.trim() || isSubmitting) return

    const listData = {
      name: editListForm.name.trim(),
      description: editListForm.description.trim() || null,
      is_public: editListForm.isPublic
    }

    // Calculate permissions based on visibility mode
    const permissions = otherMembers.map(member => {
      let canView = true
      
      if (editListForm.visibilityMode === "hidden_from") {
        canView = !editListForm.selectedUsers.includes(member.id)
      } else if (editListForm.visibilityMode === "visible_to") {
        canView = editListForm.selectedUsers.includes(member.id)
      }
      
      return {
        user_id: member.id,
        can_view: canView
      }
    })

    await onUpdateList(editingList.id, listData, permissions)
    setEditingList(null)
    resetEditListForm()
  }

  return (
    <div className="flex items-center gap-2">
      {/* Manage Lists Dialog */}
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant={list.is_public ? "default" : "secondary"} className="text-xs cursor-help">
                              {list.is_public ? "Public" : "Private"}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{list.is_public 
                              ? "Public: You can see which items family members have purchased from this list" 
                              : "Private: You cannot see which items family members have purchased from this list"}</p>
                          </TooltipContent>
                        </Tooltip>
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
                          onClick={() => onDeleteList(list.id)}
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

      {/* Create New List Dialog */}
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
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <Label>List Visibility</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose who can see this list
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visibility-all"
                    checked={newListForm.visibilityMode === "all"}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewListForm(prev => ({ ...prev, visibilityMode: "all", selectedUsers: [] }))
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="visibility-all" className="text-sm font-normal cursor-pointer">
                    Visible to all family members
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visibility-hidden"
                    checked={newListForm.visibilityMode === "hidden_from"}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewListForm(prev => ({ ...prev, visibilityMode: "hidden_from", selectedUsers: [] }))
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="visibility-hidden" className="text-sm font-normal cursor-pointer">
                    Hidden from specific members
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visibility-visible"
                    checked={newListForm.visibilityMode === "visible_to"}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewListForm(prev => ({ ...prev, visibilityMode: "visible_to", selectedUsers: [] }))
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="visibility-visible" className="text-sm font-normal cursor-pointer">
                    Visible only to specific members
                  </Label>
                </div>
              </div>

              {newListForm.visibilityMode !== "all" && (
                <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                  <Label className="text-sm font-medium">
                    {newListForm.visibilityMode === "hidden_from" 
                      ? "Select members to hide from:" 
                      : "Select members who can view:"}
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
                      ? "You can see purchased items"
                      : "You can't see purchased items"}
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
                  <Label>List Visibility</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose who can see this list
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-visibility-all"
                      checked={editListForm.visibilityMode === "all"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditListForm(prev => ({ ...prev, visibilityMode: "all", selectedUsers: [] }))
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-visibility-all" className="text-sm font-normal cursor-pointer">
                      Visible to all family members
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-visibility-hidden"
                      checked={editListForm.visibilityMode === "hidden_from"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditListForm(prev => ({ ...prev, visibilityMode: "hidden_from", selectedUsers: [] }))
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-visibility-hidden" className="text-sm font-normal cursor-pointer">
                      Hidden from specific members
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-visibility-visible"
                      checked={editListForm.visibilityMode === "visible_to"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditListForm(prev => ({ ...prev, visibilityMode: "visible_to", selectedUsers: [] }))
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="edit-visibility-visible" className="text-sm font-normal cursor-pointer">
                      Visible only to specific members
                    </Label>
                  </div>
                </div>

                {editListForm.visibilityMode !== "all" && (
                  <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                    <Label className="text-sm font-medium">
                      {editListForm.visibilityMode === "hidden_from" 
                        ? "Select members to hide from:" 
                        : "Select members who can view:"}
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

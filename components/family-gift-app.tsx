"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, Gift, ShoppingCart, Users, AlertCircle, Loader2, Database, Edit } from 'lucide-react'
import { useGiftData } from "@/hooks/useGiftData"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface User {
  id: string
  name: string
  email: string
}

interface FamilyGiftAppProps {
  currentUser: User
}

export default function FamilyGiftApp({ currentUser }: FamilyGiftAppProps) {
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", link: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "", link: "" })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { users, giftItems, loading, error, addGiftItem, updateGiftItem, removeGiftItem, togglePurchaseStatus } = useGiftData()

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
      })
      setNewItem({ name: "", description: "", price: "", link: "" })
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
      link: item.link || ""
    })
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
      })
      setIsEditDialogOpen(false)
      setEditingItem(null)
      setEditForm({ name: "", description: "", price: "", link: "" })
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label>Link:</Label>
                  <Input
                    placeholder="Link (optional)"
                    value={newItem.link}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, link: e.target.value }))}
                    disabled={isSubmitting}
                  />
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
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{item.name}</h3>
                            <Badge variant="secondary">
                              {typeof item.price === "number"
                                ? `$${item.price % 1 === 0 ? item.price.toFixed(2) : item.price}`
                                : item.price}
                            </Badge>
                          </div>
                          {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View Link
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGiftItem(item)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveGiftItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                  item.purchased_by ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3
                                      className={`font-medium ${item.purchased_by ? "line-through text-muted-foreground" : ""}`}
                                    >
                                      {item.name}
                                    </h3>
                                    {item.price && <Badge variant="secondary">{item.price}</Badge>}
                                    {item.purchased_by && (
                                      <Badge className="bg-green-100 text-green-800">
                                        Purchased by {purchaserName}
                                      </Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p
                                      className={`text-sm mb-2 ${item.purchased_by ? "text-muted-foreground" : "text-muted-foreground"}`}
                                    >
                                      {item.description}
                                    </p>
                                  )}
                                  {item.link && (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      View Link
                                    </a>
                                  )}
                                </div>
                                <Button
                                  variant={item.purchased_by ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleTogglePurchase(item.id, item.purchased_by)}
                                  className={item.purchased_by ? "bg-green-600 hover:bg-green-700" : ""}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  {item.purchased_by ? "Purchased" : "Mark as Purchased"}
                                </Button>
                              </div>
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
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-link">Link</Label>
                  <Input
                    id="edit-link"
                    value={editForm.link}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, link: e.target.value }))}
                    placeholder="Link (optional)"
                    disabled={isSubmitting}
                  />
                </div>
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

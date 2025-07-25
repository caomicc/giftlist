"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, Gift, ShoppingCart, Users, AlertCircle, Loader2 } from "lucide-react"
import { useGiftData } from "@/hooks/useGiftData"

export default function FamilyGiftApp() {
  const [currentUser, setCurrentUser] = useState<string>("")
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", link: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { familyMembers, giftItems, loading, error, addGiftItem, removeGiftItem, togglePurchaseStatus } = useGiftData()

  const handleAddGiftItem = async () => {
    if (!newItem.name.trim() || !currentUser || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addGiftItem({
        name: newItem.name,
        description: newItem.description || undefined,
        price: newItem.price || undefined,
        link: newItem.link || undefined,
        owner_id: currentUser,
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

  const handleTogglePurchase = async (itemId: string, currentPurchasedBy: string | null) => {
    if (!currentUser) return

    try {
      const newPurchasedBy = currentPurchasedBy ? null : currentUser
      await togglePurchaseStatus(itemId, newPurchasedBy)
    } catch (err) {
      console.error("Failed to toggle purchase status:", err)
    }
  }

  const getCurrentMember = () => familyMembers.find((m) => m.id === currentUser)
  const getOtherMembers = () => familyMembers.filter((m) => m.id !== currentUser)
  const getMyGifts = () => giftItems.filter((item) => item.owner_id === currentUser)
  const getMemberGifts = (memberId: string) => giftItems.filter((item) => item.owner_id === memberId)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">Connection Error</CardTitle>
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Gift className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Family Gift Sharing</CardTitle>
            <CardDescription>Choose your family member to start sharing gift ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {familyMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="outline"
                  className="justify-start h-auto"
                  onClick={() => setCurrentUser(member.id)}
                >
                  
                  <span className="text-lg">{member.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentMember = getCurrentMember()
  const myGifts = getMyGifts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentMember?.avatar}</span>
            <div>
              <h1 className="text-2xl font-bold">Welcome, {currentMember?.name}!</h1>
              <p className="text-muted-foreground">Manage your family gift lists</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setCurrentUser("")}>
            <Users className="w-4 h-4 mr-2" />
            Switch User
          </Button>
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
              <CardContent className="space-y-4">
                {/* Add New Item Form */}
                <div className="grid gap-3 p-4 border rounded-lg bg-muted/50">
                  <div className="grid gap-2">
                    <Input
                      placeholder="Gift item name *"
                      value={newItem.name}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newItem.description}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                      disabled={isSubmitting}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Price (optional)"
                        value={newItem.price}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Link (optional)"
                        value={newItem.link}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, link: e.target.value }))}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddGiftItem} disabled={!newItem.name.trim() || isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? "Adding..." : "Add Gift Idea"}
                  </Button>
                </div>

                {/* My Gift Items */}
                <div className="space-y-3">
                  {myGifts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No gift ideas yet. Add some items above!</p>
                    </div>
                  ) : (
                    myGifts.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{item.name}</h3>
                            {item.price && <Badge variant="secondary">{item.price}</Badge>}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGiftItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
              {getOtherMembers().map((member) => {
                const memberGifts = getMemberGifts(member.id)
                const purchasedCount = memberGifts.filter((item) => item.purchased_by).length

                return (
                  <Card key={member.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{member.avatar}</span>
                          <div>
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
                          {memberGifts.map((item) => {
                            const purchaserName = item.purchased_by
                              ? familyMembers.find((m) => m.id === item.purchased_by)?.name
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
      </div>
    </div>
  )
}

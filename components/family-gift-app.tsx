"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Gift, AlertCircle, Database } from 'lucide-react'
import { useGiftData } from "@/hooks/useGiftData"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Import our new components
import AddGiftForm from "./add-gift-form"
import EditGiftDialog from "./edit-gift-dialog"
import ListManagement from "./list-management"
import MyGiftsList from "./my-gifts-list"
import FamilyGiftsList from "./family-gifts-list"

interface User {
  id: string
  name: string
  email: string
}

interface FamilyGiftAppProps {
  currentUser: User
}

export default function FamilyGiftApp({ currentUser }: FamilyGiftAppProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userLists, setUserLists] = useState<any[]>([])

  const {
    users,
    giftItems,
    loading,
    error,
    addGiftItem,
    updateGiftItem,
    removeGiftItem,
    togglePurchaseStatus,
    toggleArchiveStatus,
    addGiftCardPurchase,
    fetchOGData
  } = useGiftData()

  // Fetch user's lists
  const fetchUserLists = async () => {
    try {
      const response = await fetch('/api/lists')
      if (!response.ok) throw new Error('Failed to fetch lists')
      const lists = await response.json()
      setUserLists(lists)
    } catch (err) {
      console.error("Failed to fetch lists:", err)
    }
  }

  // Create a default list for new users
  const createDefaultList = async () => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${currentUser.name || 'My'}'s List`,
          description: 'Default wishlist',
          is_public: false,
          is_visible: true
        }),
      })

      if (!response.ok) throw new Error('Failed to create default list')
      const newList = await response.json()
      setUserLists([newList])
    } catch (err) {
      console.error("Failed to create default list:", err)
    }
  }

  // Initialize lists on component mount
  useEffect(() => {
    fetchUserLists()
  }, [])

  // Create default list if none exists
  useEffect(() => {
    if (userLists.length === 0 && !loading) {
      createDefaultList()
    }
  }, [userLists.length, loading])

  const handleAddGiftItem = async (itemData: any) => {
    setIsSubmitting(true)
    try {
      await addGiftItem(itemData)
    } catch (err) {
      console.error("Failed to add gift item:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditGiftItem = (item: any) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleUpdateGiftItem = async (itemData: any) => {
    if (!editingItem) return
    
    setIsSubmitting(true)
    try {
      await updateGiftItem(editingItem.id, itemData)
      setEditingItem(null)
    } catch (err) {
      console.error("Failed to update gift item:", err)
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
    try {
      const newPurchasedBy = currentPurchasedBy ? null : currentUser.id
      await togglePurchaseStatus(itemId, newPurchasedBy)
    } catch (err) {
      console.error("Failed to toggle purchase status:", err)
    }
  }

  const handleGiftCardPurchase = async (itemId: string, amount: number) => {
    try {
      await addGiftCardPurchase(itemId, currentUser.id, amount)
    } catch (err) {
      console.error("Failed to add gift card purchase:", err)
    }
  }

  const handleArchiveItem = async (itemId: string) => {
    try {
      await toggleArchiveStatus(itemId)
    } catch (err) {
      console.error("Failed to toggle archive status:", err)
    }
  }

  // List management handlers
  const handleCreateList = async (listData: any) => {
    setIsSubmitting(true)
    try {
      // Extract visibility settings
      const { visibility_mode, selected_users, ...restListData } = listData
      
      // Create the list first
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restListData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create list')
      }

      const newList = await response.json()
      
      // Set permissions if needed
      if (visibility_mode !== 'all' && selected_users.length > 0) {
        const otherMembers = users.filter((u: any) => u.id !== currentUser.id)
        const permissions = otherMembers.map((member: any) => {
          let canView = true
          
          if (visibility_mode === "hidden_from") {
            canView = !selected_users.includes(member.id)
          } else if (visibility_mode === "visible_to") {
            canView = selected_users.includes(member.id)
          }
          
          return {
            user_id: member.id,
            can_view: canView
          }
        })
        
        await fetch(`/api/lists/${newList.id}/permissions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ permissions }),
        })
      }

      await fetchUserLists()
    } catch (err) {
      console.error("Failed to create list:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateList = async (listId: string, listData: any, permissions: any[]) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update list')
      }

      // Update permissions
      const permissionsResponse = await fetch(`/api/lists/${listId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (!permissionsResponse.ok) {
        console.warn('Failed to update list permissions')
      }

      await fetchUserLists()
    } catch (err) {
      console.error("Failed to update list:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? Note: Lists with items cannot be deleted - you must move or delete all items first.')) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to delete list')
        return
      }

      await fetchUserLists()
    } catch (err) {
      console.error("Failed to delete list:", err)
      alert('Failed to delete list')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchListPermissions = async (listId: string) => {
    const response = await fetch(`/api/lists/${listId}/permissions`)
    return response.json()
  }

  // Helper functions
  const getCurrentMember = () => currentUser
  const getOtherMembers = () => users.filter((u: any) => u.id !== currentUser.id)
  const getActiveMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id && !item.archived)
  const getArchivedMyGifts = () => giftItems.filter((item: any) => item.owner_id === currentUser.id && item.archived)

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 w-full max-w-xl mx-auto">
        <Card className={'w-full bg-card text-card-foreground flex flex-col gap-6 rounded-none md:rounded-xl border-none md:border py-6 shadow-none md:shadow-sm'}>
          <CardContent className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <div className="space-y-3 mt-6">
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
      <div className="container mx-auto max-w-xl w-full">
        <Card className={'w-full bg-card text-card-foreground flex flex-col gap-6 rounded-none md:rounded-xl border-none md:border py-6 shadow-none md:shadow-sm'}>
          <CardContent className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl text-red-600 mb-2">Database Connection Error</h2>
            <p className="text-muted-foreground mb-4">Unable to connect to Neon database</p>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentMember = getCurrentMember()
  const activeMyGifts = getActiveMyGifts()
  const archivedMyGifts = getArchivedMyGifts()

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-xl w-full">
        {/* Header */}
        <div className="flex items-end justify-between mb-4 md:mb-6 px-4 md:px-0 min-h-[100px] md:min-h-auto">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-heading font-medium tracking-wide">Hi, {currentMember?.name}!</h1>
              <p>Welcome back 😊</p>
            </div>
          </div>
        </div>
        
        <Card className={'bg-card text-card-foreground flex flex-col gap-6 rounded-t-3xl h-full rounded-b-none md:rounded-b-xl md:rounded-xl border-none md:border py-6 md:py-4 shadow-none md:shadow-sm'}>
          <CardContent className="px-6 md:px-3">
            <Tabs defaultValue="my-list" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my-list">My Gift List</TabsTrigger>
                <TabsTrigger value="family-lists">Family Lists</TabsTrigger>
              </TabsList>

              {/* My Gift List Tab */}
              <TabsContent value="my-list" className="space-y-6 mb-0 md:mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    My Gift Ideas
                  </div>
                  <ListManagement
                    userLists={userLists}
                    otherMembers={getOtherMembers()}
                    onCreateList={handleCreateList}
                    onUpdateList={handleUpdateList}
                    onDeleteList={handleDeleteList}
                    fetchListPermissions={fetchListPermissions}
                    isSubmitting={isSubmitting}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Add items you'd like to receive. Family members can see this list and mark items as purchased.
                </p>

                <AddGiftForm
                  currentUser={currentUser}
                  userLists={userLists}
                  onAddGiftItem={handleAddGiftItem}
                  fetchOGData={fetchOGData}
                  isSubmitting={isSubmitting}
                />

                <MyGiftsList
                  currentUser={currentUser}
                  userLists={userLists}
                  activeMyGifts={activeMyGifts}
                  archivedMyGifts={archivedMyGifts}
                  onEdit={handleEditGiftItem}
                  onDelete={handleRemoveGiftItem}
                  onArchive={handleArchiveItem}
                />
              </TabsContent>

              {/* Family Lists Tab */}
              <TabsContent value="family-lists" className="space-y-6 mb-0 md:mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2 h-8">
                    <Gift className="w-5 h-5" />
                    Family Gift Lists
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Click on a family member to view and purchase their gift items.
                </p>

                <FamilyGiftsList
                  currentUser={currentUser}
                  users={users}
                  giftItems={giftItems}
                  onTogglePurchase={handleTogglePurchase}
                  onGiftCardPurchase={handleGiftCardPurchase}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Gift Dialog */}
        <EditGiftDialog
          editingItem={editingItem}
          userLists={userLists}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onUpdateGiftItem={handleUpdateGiftItem}
          fetchOGData={fetchOGData}
          isSubmitting={isSubmitting}
        />
      </div>
    </TooltipProvider>
  )
}

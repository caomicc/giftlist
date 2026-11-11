'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import AddGiftForm from './add-gift-form'
import { useTranslation, formatMessage } from './i18n-provider'

type List = { id: string; name: string; description?: string; is_public: boolean; created_at: string }

type QuickAddProps = {
  lang: string
  currentUser: { id: string; name: string; email: string }
  initialUrl: string
  pageTitle: string
}

async function fetchOGData(url: string) {
  try {
    const response = await fetch('/api/og-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!response.ok) return null
    const { ogData } = await response.json()
    return ogData
  } catch {
    return null
  }
}

/** The /add page: one form, then a "saved" state that closes itself when opened as a popup. */
export default function QuickAdd({ lang, currentUser, initialUrl, pageTitle }: QuickAddProps) {
  const { t } = useTranslation('gifts')
  const tQuick = t.quickAdd || {}
  const [lists, setLists] = useState<List[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedTo, setSavedTo] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [isPopup, setIsPopup] = useState(false)

  useEffect(() => {
    setIsPopup(!!window.opener)
    fetch('/api/lists', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLists(Array.isArray(data) ? data : []))
      .catch(() => setLists([]))
  }, [])

  // Opened from the bookmarklet: close shortly after saving
  useEffect(() => {
    if (!savedTo || !isPopup) return
    const timer = window.setTimeout(() => window.close(), 1800)
    return () => window.clearTimeout(timer)
  }, [savedTo, isPopup])

  const addGiftItem = async (itemData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/gift-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })
      if (!response.ok) throw new Error('Failed to add gift item')
    } catch (err) {
      toast.error(t.toasts?.saveFailed || "Couldn't save that. Try again.")
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const savedListName = lists?.find((l) => l.id === savedTo)?.name || ''

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-medium">{tQuick.title || 'Save to Meep'}</CardTitle>
      </CardHeader>
      <CardContent>
        {lists === null && (
          <div className="space-y-3" aria-busy="true">
            <span className="sr-only">{tQuick.loading || 'Loading your lists…'}</span>
            <Skeleton className="h-11 md:h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {lists !== null && lists.length === 0 && (
          <div className="space-y-3 text-sm">
            <p>{tQuick.noLists || "You don't have a list yet."}</p>
            <Button asChild>
              <Link href={`/${lang}`}>{tQuick.createList || 'Open Meep to create one'}</Link>
            </Button>
          </div>
        )}

        {lists !== null && lists.length > 0 && savedTo && (
          <div className="space-y-4" role="status">
            <p className="flex items-center gap-2 font-medium">
              <span className="flex size-7 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground">
                <Check className="size-4" aria-hidden="true" />
              </span>
              {formatMessage(tQuick.saved || 'Saved to {{list}}', { list: savedListName })}
            </p>
            <div className="flex flex-wrap gap-2">
              {isPopup ? (
                <Button onClick={() => window.close()}>{tQuick.close || 'Close'}</Button>
              ) : initialUrl ? (
                <Button asChild>
                  <a href={initialUrl}>{tQuick.backToShop || 'Back to the shop'}</a>
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => {
                  setSavedTo(null)
                  setFormKey((k) => k + 1)
                }}
              >
                {tQuick.addAnother || 'Add another'}
              </Button>
              <Button variant="ghost" asChild>
                <Link href={`/${lang}`}>{tQuick.openList || 'Open my lists'}</Link>
              </Button>
            </div>
          </div>
        )}

        {lists !== null && lists.length > 0 && !savedTo && (
          <AddGiftForm
            key={formKey}
            currentUser={currentUser}
            userLists={lists}
            onAddGiftItem={addGiftItem}
            fetchOGData={fetchOGData}
            isSubmitting={isSubmitting}
            initialQuery={formKey === 0 ? initialUrl : undefined}
            fallbackName={formKey === 0 ? pageTitle : undefined}
            onAdded={(listId) => setSavedTo(listId)}
            autoFocus={!initialUrl}
          />
        )}
      </CardContent>
    </Card>
  )
}

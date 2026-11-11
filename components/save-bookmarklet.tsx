'use client'

import { useEffect, useRef } from 'react'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from './i18n-provider'

/**
 * A draggable "Save to Meep" bookmarklet. Clicked on any page, it opens
 * /add?url=<page>&title=<title> in a small window (or the same tab if popups are blocked).
 * Only the page address and title are sent, and only when the user clicks it.
 */
export function SaveBookmarklet() {
  const { t, locale } = useTranslation('gifts')
  const tBm = t.quickAdd?.bookmarklet || {}
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // React refuses javascript: hrefs, so set it on the element directly
    const addUrl = `${window.location.origin}/${locale}/add`
    const code =
      `(function(){var u='${addUrl}?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title);` +
      `var w=window.open(u,'meep-add','width=480,height=760');if(!w){location.href=u;}})();`
    linkRef.current?.setAttribute('href', `javascript:${code}`)
  }, [locale])

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-lg font-medium">{tBm.title || 'Save gifts while you browse'}</CardTitle>
        <CardDescription>
          {tBm.body || 'Drag this button to your bookmarks bar. On any product page, click it to save the page to your list.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <a
          ref={linkRef}
          href="#"
          draggable
          onClick={(e) => {
            // Clicking here would save the profile page; it's meant to be dragged
            e.preventDefault()
            toast(tBm.body || 'Drag this button to your bookmarks bar.')
          }}
          className={cn(buttonVariants({ variant: 'default' }), 'cursor-grab active:cursor-grabbing')}
        >
          <Bookmark className="size-4" aria-hidden="true" />
          {tBm.button || 'Save to Meep'}
        </a>
        <p className="text-xs text-muted-foreground">
          {tBm.hint || "Can't drag? Show your bookmarks bar first (Ctrl+Shift+B, or ⌘⇧B on a Mac)."}
        </p>
      </CardContent>
    </Card>
  )
}

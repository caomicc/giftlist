import { requireAuth } from '@/lib/auth'
import QuickAdd from '@/components/quick-add'
import { type Locale } from '@/lib/i18n'

/**
 * /add?url=…&title=… : save the page you're looking at.
 * Opened by the "Save to Meep" bookmarklet (and later the share sheet).
 */
export default async function AddPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>
  searchParams: Promise<{ url?: string; title?: string; text?: string }>
}) {
  const user = await requireAuth()
  const { lang } = await params
  const { url, title, text } = await searchParams

  // Share sheets sometimes put the link in `text` instead of `url`
  const candidate = url || text?.match(/https?:\/\/\S+/)?.[0] || ''
  const safeUrl = /^https?:\/\//i.test(candidate) ? candidate : ''

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-20 pb-8">
      <QuickAdd
        lang={lang}
        currentUser={{ id: user.id, name: user.name ?? '', email: user.email }}
        initialUrl={safeUrl}
        pageTitle={title?.slice(0, 200) || ''}
      />
    </main>
  )
}

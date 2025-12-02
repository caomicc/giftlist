import { requireAuth } from '@/lib/auth'
import FamilyGiftApp from '@/components/family-gift-app'
import { type Locale } from '@/lib/i18n'

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const user = await requireAuth()
  const { lang } = await params

  return (
    <main className="max-w-7xl mx-auto min-h-[calc(100vh-80px)] p-0 sm:px-6 lg:px-8 md:pt-18 md:pb-8 lg:pt-16">
      <FamilyGiftApp currentUser={{ ...user, name: user.name ?? '' }} />
    </main>
  )
}

import { requireAuth } from '@/lib/auth'
import FamilyGiftApp from '@/components/family-gift-app'

export default async function HomePage() {
  const user = await requireAuth()

  return (
    <>
      {/* Phones: the list card is a bottom sheet; this fills the space below it with the card colour */}
      <div aria-hidden="true" className="fixed inset-x-0 bottom-0 h-[50vh] bg-card md:hidden" />
      <main className="relative max-w-7xl mx-auto min-h-[calc(100vh-80px)] p-0 sm:px-6 lg:px-8 md:pt-18 md:pb-8 lg:pt-16">
        <FamilyGiftApp currentUser={{ ...user, name: user.name ?? '' }} />
      </main>
    </>
  )
}

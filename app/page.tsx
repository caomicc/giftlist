import { requireAuth } from '@/lib/auth'
import FamilyGiftApp from '@/components/family-gift-app'

export default async function HomePage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FamilyGiftApp currentUser={{ ...user, name: user.name ?? '' }} />
      </main>
    </div>
  )
}

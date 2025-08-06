import { requireAuth } from '@/lib/auth'
import { UserMenu } from '@/components/user-menu'
import FamilyGiftApp from '@/components/family-gift-app'

export default async function HomePage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎁 Gift List</h1>
          <UserMenu user={user} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <FamilyGiftApp />
      </main>
    </div>
  )
}

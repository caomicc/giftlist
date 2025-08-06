import { requireAuth } from '@/lib/auth'
import { UserMenu } from '@/components/user-menu'
import FamilyGiftApp from '@/components/family-gift-app'

export default async function HomePage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Family Gift List</h1>
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FamilyGiftApp currentUser={user} />
      </main>
    </div>
  )
}

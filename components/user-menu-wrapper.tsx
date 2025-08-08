'use client'

import { useState, useEffect } from 'react'
import { UserMenu } from '@/components/user-menu'
import { usePathname } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  created_at: Date
}

export function UserMenuWrapper() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // const router = useRouter()
  const pathname = usePathname()

  // Check if we're on an auth page where we shouldn't show the user menu
  const isAuthPage = pathname.startsWith('/auth') || pathname.startsWith('/login')

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/user/profile')

        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else if (response.status === 401) {
          // User not authenticated - don't show menu
          setUser(null)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    // Only check for user if not on auth pages
    if (!isAuthPage) {
      checkUser()
    } else {
      setIsLoading(false)
    }
  }, [pathname, isAuthPage])

  // Don't render anything while loading or on auth pages
  if (isLoading || isAuthPage || !user) {
    return null
  }

  return (
    <div className="absolute md:fixed top-0 right-0 p-4 z-50">
      <UserMenu user={user} />
    </div>
  )
}

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
  const pathname = usePathname()

  // Check if we're on an auth page where we shouldn't show the user menu.
  // Paths carry a locale prefix (/en/auth/signin), so strip it before matching.
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  const isAuthPage = pathWithoutLocale.startsWith('/auth') || pathWithoutLocale.startsWith('/login')

  useEffect(() => {
    if (isAuthPage) return
    let ignore = false
    fetch('/api/user/profile')
      .then(response => (response.ok ? response.json() : null)) // 401: signed out, no menu
      .then(userData => { if (!ignore) setUser(userData) })
      .catch(error => {
        console.error('Failed to fetch user:', error)
        if (!ignore) setUser(null)
      })
    return () => { ignore = true }
  }, [pathname, isAuthPage])

  // Nothing until the user has loaded, and never on auth pages
  if (isAuthPage || !user) {
    return null
  }

  return <UserMenu user={user} />
}

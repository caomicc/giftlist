'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Lock, LogOut, Settings, ChevronDownIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useI18n } from './i18n-provider'

interface UserMenuProps {
  user: {
    email: string
    name?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const { locale, translations } = useI18n()
  const t = translations.common || {}
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has a password
    fetch('/api/auth/check-password')
      .then(res => res.json())
      .then(data => setHasPassword(data.hasPassword))
      .catch(() => setHasPassword(null))
  }, [])

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' })
      if (response.ok) {
        router.push(`/${locale}/auth/signin`)
        router.refresh()
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleSetPassword = () => {
    router.push(`/${locale}/auth/set-password`)
  }

  const handleProfile = () => {
    router.push(`/${locale}/profile`)
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-2">
          <span>{t.nav?.myProfile || 'My Profile'}</span>
          <ChevronDownIcon className="h-4 w-4" />
          <Avatar className="size-12 bg-violet-200 no-underline group-hover:no-underline!">
            <AvatarFallback className=''>{initials}</AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 ml-10" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfile}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t.userMenu?.profileSettings || 'Profile Settings'}</span>
        </DropdownMenuItem>
        {hasPassword === false && (
          <DropdownMenuItem onClick={handleSetPassword}>
            <Lock className="mr-2 h-4 w-4" />
            <span>{t.userMenu?.setPassword || 'Set Password'}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.userMenu?.signOut || 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

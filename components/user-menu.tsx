'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Lock, LogOut, Settings, ChevronDownIcon, Globe, Check } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { useI18n } from './i18n-provider'
import { locales } from '@/lib/i18n-config'

interface UserMenuProps {
  user: {
    email: string
    name?: string
  }
}

const localeNames: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
}

const localeFlags: Record<string, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { locale, translations } = useI18n()
  const t = translations.common || {}
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  const handleLocaleChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    const newPath = `/${newLocale}${pathWithoutLocale}`
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.push(newPath)
    router.refresh()
  }

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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='gap-2'>
            <Globe className="mr-2 h-4 w-4 color-muted-foreground" />
            <span>{t.userMenu?.language || 'Language'}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                >
                  <span className="mr-2">{localeFlags[loc]}</span>
                  <span>{localeNames[loc]}</span>
                  {locale === loc && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.userMenu?.signOut || 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

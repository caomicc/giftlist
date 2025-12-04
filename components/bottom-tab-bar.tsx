"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Users, CheckCircle, ClipboardList, Settings, LogOut, Lock, Globe, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation, useI18n } from "./i18n-provider"
import { locales } from "@/lib/i18n-config"
import { useState, useEffect } from "react"
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
} from "@/components/ui/dropdown-menu"

interface Tab {
  id: string
  href: string
  labelKey: "home" | "browse" | "claimed" | "myLists"
  icon: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  { id: "home", href: "", labelKey: "home", icon: Home },
  { id: "browse", href: "/browse", labelKey: "browse", icon: Users },
  { id: "claimed", href: "/claimed", labelKey: "claimed", icon: CheckCircle },
  { id: "my-lists", href: "/my-lists", labelKey: "myLists", icon: ClipboardList },
]

const localeNames: Record<string, string> = {
  en: 'English',
  ru: 'Русский',
}

const localeFlags: Record<string, string> = {
  en: '🇺🇸',
  ru: '🇷🇺',
}

export function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation("common")
  const { locale } = useI18n()
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/check-password')
      .then(res => res.json())
      .then(data => setHasPassword(data.hasPassword))
      .catch(() => setHasPassword(null))
  }, [])

  const handleLocaleChange = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    const newPath = `/${newLocale}${pathWithoutLocale}`
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.push(newPath)
    router.refresh()
  }

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

  const handleProfile = () => {
    router.push(`/${locale}/profile`)
  }

  const handleSetPassword = () => {
    router.push(`/${locale}/auth/set-password`)
  }

  const getLabel = (key: Tab["labelKey"]): string => {
    const labels = t.bottomNav as Record<string, string> | undefined
    return labels?.[key] || key
  }

  const isActive = (tab: Tab): boolean => {
    const tabPath = `/${locale}${tab.href}`
    
    if (tab.id === "home") {
      // Home is active when on root locale path
      return pathname === `/${locale}` || pathname === `/${locale}/`
    }
    
    // For other tabs, check if pathname starts with the tab path
    return pathname.startsWith(tabPath)
  }

  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/95 backdrop-blur-md border-t",
        "h-14 pb-safe", // 56px + safe area padding
        "md:hidden" // Only show on mobile
      )}
    >
      <div className="grid grid-cols-5 h-full">
        {tabs.map((tab) => {
          const active = isActive(tab)
          const Icon = tab.icon
          const href = `/${locale}${tab.href}`

          return (
            <Link
              key={tab.id}
              href={href}
              role="tab"
              aria-selected={active}
              aria-controls={`${tab.id}-panel`}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                "min-h-[44px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all",
                  active && "scale-105"
                )}
              />
              <span
                className={cn(
                  "text-[10px] leading-none",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {getLabel(tab.labelKey)}
              </span>
            </Link>
          )
        })}

        {/* Settings dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                "min-h-[44px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="h-6 w-6" />
              <span className="text-[10px] leading-none font-medium">
                {(t.bottomNav as Record<string, string> | undefined)?.settings || 'Settings'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-2">
            <DropdownMenuItem onClick={handleProfile}>
              <Settings className="mr-2 h-4 w-4" />
              <span>{(t.userMenu as Record<string, string> | undefined)?.profileSettings || 'Profile Settings'}</span>
            </DropdownMenuItem>
            {hasPassword === false && (
              <DropdownMenuItem onClick={handleSetPassword}>
                <Lock className="mr-2 h-4 w-4" />
                <span>{(t.userMenu as Record<string, string> | undefined)?.setPassword || 'Set Password'}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="mr-2 h-4 w-4" />
                <span>{(t.userMenu as Record<string, string> | undefined)?.language || 'Language'}</span>
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
              <span>{(t.userMenu as Record<string, string> | undefined)?.signOut || 'Sign out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

"use client"

import Link from "next/link"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { UserMenu } from "./user-menu"
import { LocaleSwitcher } from "./locale-switcher"
import { useI18n } from "./i18n-provider"

interface User {
  id: string
  email: string
  name?: string
  created_at: Date
}

export function NavigationBar({ user }: { user: User }) {
  const { locale } = useI18n()
  const { translations } = useI18n()
  const t = translations.common || {}

  return (
    <>
      {/* Mobile Header - fixed at top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between">
        <LocaleSwitcher />

        <UserMenu user={user} />
      </div>

      {/* Desktop Navigation - centered floating pill */}
      <NavigationMenu viewport={false} className="hidden md:flex border-b border-border px-4 py-1 rounded-md bg-background top-4 left-1/2 -translate-x-1/2 fixed z-50">
        <NavigationMenuList>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href={`/${locale}`}>{t.nav?.home || 'Home'}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link href={`/${locale}/browse`}>{t.nav?.familyGiftlists || 'Family Giftlists'}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <LocaleSwitcher />
          </NavigationMenuItem>

          <UserMenu user={user} />
        </NavigationMenuList>
      </NavigationMenu>
    </>
  )
}

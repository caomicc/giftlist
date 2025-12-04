"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, CheckCircle, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "./i18n-provider"

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

export function BottomTabBar() {
  const pathname = usePathname()
  const { t } = useTranslation("common")

  // Extract locale from pathname (e.g., /en/browse -> en)
  const locale = pathname.split("/")[1] || "en"

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
      <div className="grid grid-cols-4 h-full">
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
      </div>
    </nav>
  )
}

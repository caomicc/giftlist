"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

export function FloatingActionButton({
  onClick,
  label = "Add",
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        // Position above bottom nav on mobile (nav is h-14 = 56px, so bottom-20 = 80px gives 24px gap)
        "fixed bottom-24 right-4 z-50 h-14 w-14 rounded-full shadow-lg",
        // On desktop (md+), no bottom nav so position closer to bottom
        "md:bottom-6 md:right-6",
        className
      )}
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </Button>
  )
}

"use client"

import { useState, useRef, type ReactNode, type TouchEvent } from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: ReactNode
    label: string
    className?: string
  }
  rightAction?: {
    icon: ReactNode
    label: string
    className?: string
  }
  disabled?: boolean
  className?: string
}

const SWIPE_THRESHOLD = 80 // Minimum swipe distance to trigger action
const MAX_SWIPE = 100 // Maximum visual swipe distance

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <Check className="h-5 w-5" />,
    label: "Claim",
    className: "bg-green-500",
  },
  rightAction = {
    icon: <X className="h-5 w-5" />,
    label: "Unclaim",
    className: "bg-red-500",
  },
  disabled = false,
  className,
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (disabled) return
    startXRef.current = e.touches[0].clientX
    currentXRef.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return
    currentXRef.current = e.touches[0].clientX
    const diff = currentXRef.current - startXRef.current

    // Limit the swipe distance with elastic effect
    const clampedDiff = Math.sign(diff) * Math.min(Math.abs(diff), MAX_SWIPE)
    
    // Only allow swipe in directions that have actions
    if ((diff > 0 && !onSwipeRight) || (diff < 0 && !onSwipeLeft)) {
      return
    }

    setTranslateX(clampedDiff)
  }

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return
    setIsDragging(false)

    const diff = currentXRef.current - startXRef.current

    if (diff > SWIPE_THRESHOLD && onSwipeRight) {
      // Swiped right
      setTranslateX(MAX_SWIPE)
      setTimeout(() => {
        onSwipeRight()
        setTranslateX(0)
      }, 200)
    } else if (diff < -SWIPE_THRESHOLD && onSwipeLeft) {
      // Swiped left
      setTranslateX(-MAX_SWIPE)
      setTimeout(() => {
        onSwipeLeft()
        setTranslateX(0)
      }, 200)
    } else {
      // Reset position
      setTranslateX(0)
    }
  }

  const showLeftAction = translateX < -20
  const showRightAction = translateX > 20

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left action (revealed when swiping left) */}
      {onSwipeLeft && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4 text-white transition-opacity",
            leftAction.className,
            showLeftAction ? "opacity-100" : "opacity-0"
          )}
          style={{ width: MAX_SWIPE }}
        >
          <div className="flex flex-col items-center gap-1">
            {leftAction.icon}
            <span className="text-xs font-medium">{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action (revealed when swiping right) */}
      {onSwipeRight && (
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-4 text-white transition-opacity",
            rightAction.className,
            showRightAction ? "opacity-100" : "opacity-0"
          )}
          style={{ width: MAX_SWIPE }}
        >
          <div className="flex flex-col items-center gap-1">
            {rightAction.icon}
            <span className="text-xs font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}

      {/* Main card content */}
      <div
        className={cn(
          "relative bg-card transition-transform",
          !isDragging && "duration-200"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

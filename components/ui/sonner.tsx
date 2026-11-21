"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme?.endsWith("dark") ? "dark" : "light"}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          // An open drawer or dialog sets pointer-events: none on <body>; toasts (Undo) must stay clickable
          pointerEvents: "auto",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

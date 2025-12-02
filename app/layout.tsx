import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meep Family Wishlist',
  description: 'Welcome!',
}

// Root layout just renders children and sets base metadata.
// The lang-specific layout handles other concerns,
// since the language needs to be set at the `html` level,
// and all other JSX needs to be within that.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children;
}

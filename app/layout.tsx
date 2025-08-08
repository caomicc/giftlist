import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { UserMenuWrapper } from '@/components/user-menu-wrapper'

export const metadata: Metadata = {
  title: 'Meep Family Wishlist',
  description: 'Hi',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className={'bg-gradient-to-br from-red-100 to-violet-300 min-h-screen'}>
        <UserMenuWrapper />
        <div className="relative z-10">
        {children}
        </div>
        <div className={"absolute h-[50vh] bg-white block md:hidden bottom-0 left-0 right-0 z-1 w-full"}></div>
      </body>
    </html>
  )
}

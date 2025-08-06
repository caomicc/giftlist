import { Suspense } from 'react'
import { verifyMagicLink } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function VerifyTokenContent({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const params = await searchParams
  const { token, email } = params

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Link</CardTitle>
            <CardDescription>
              This magic link is invalid or malformed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth/signin">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  try {
    console.log('Verifying magic link:', { token: token?.substring(0, 10) + '...', email })
    const user = await verifyMagicLink(token, email)
    console.log('Verification result:', user ? 'SUCCESS' : 'FAILED')

    if (!user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-red-600">Link Expired</CardTitle>
              <CardDescription>
                This magic link has expired or has already been used.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/auth/signin">Get a new link</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Success! Redirect to main app
    redirect('/')
  } catch (error) {
    console.error('Verification error:', error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Error</CardTitle>
            <CardDescription>
              Something went wrong during sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/auth/signin">Try again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}

export default async function VerifyTokenPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  return (
    <Suspense fallback={<div className='absolute top-0 left-0 flex h-screen w-screen justify-center items-center'><p className='font-heading text-2xl text-center text-pink-950'>Verifying...</p></div>}>
      <VerifyTokenContent searchParams={searchParams} />
    </Suspense>
  )
}

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function VerifyRequestContent({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams
  const email = params.email
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We've sent a magic link to{' '}
            {email && <span className="font-medium">{email}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isDevelopment ? (
            <div className="bg-secondary/40 p-4 rounded-md text-sm">
              <p className="font-medium text-secondary-foreground mb-2">🧪 Development Mode</p>
              <p className="text-secondary-foreground">
                Check your terminal/console for the magic link!<br />
                The link is logged there since email isn't configured yet.
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Click the link in the email to sign in.</p>
              <p>The link will expire in 24 hours.</p>
            </div>
          )}

          <div className="pt-4">
            <Button variant="outline" asChild>
              <Link href="/auth/signin">Back to sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function VerifyRequestPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  return (
    <Suspense fallback={<div className='absolute top-0 left-0 flex h-screen w-screen justify-center items-center'><p className='text-2xl text-center text-foreground'>Loading...</p></div>}>
      <VerifyRequestContent searchParams={searchParams} />
    </Suspense>
  )
}

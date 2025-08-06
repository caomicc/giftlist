import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function VerifyRequestContent({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>
            We've sent a magic link to{' '}
            {email && <span className="font-medium">{email}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            <p>Click the link in the email to sign in.</p>
            <p>The link will expire in 24 hours.</p>
          </div>
          
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

export default function VerifyRequestPage({ searchParams }: { searchParams: { email?: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyRequestContent searchParams={searchParams} />
    </Suspense>
  )
}

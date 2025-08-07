'use client'

import { useState, useEffect, Suspense } from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

function LoginFormContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'invalid-link') {
      setErrorMessage('This magic link is invalid or malformed.')
    } else if (error === 'expired-link') {
      setErrorMessage('This magic link has expired or has already been used.')
    } else if (error === 'server-error') {
      setErrorMessage('Something went wrong during sign in.')
    }
  }, [searchParams])

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/verify-request?email=' + encodeURIComponent(email))
      } else {
        setMessage(data.error || 'Something went wrong')
      }
    } catch (error) {
      setMessage('Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/signin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        setMessage(data.error || 'Invalid email or password')
      }
    } catch (error) {
      setMessage('Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Hi 😊</h1>
                <p className="text-zinc-500 text-balance dark:text-zinc-400">
                  Login to your Meep Giftlist account
                </p>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
                </TabsList>

                <TabsContent value="password" className="pt-4">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="grid gap-3">
                      <Label htmlFor="email-password">Email</Label>
                      <Input
                        id="email-password"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="m@example.com"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                      />
                    </div>

                    {message && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !email || !password}
                    >
                      {isLoading ? 'Signing in...' : 'Login'}
                    </Button>

                    <div className="text-center text-sm">
                      Don&apos;t have an account?{" "}
                      <a href="/auth/register" className="underline underline-offset-4">
                        Sign up
                      </a>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="magic-link" className="pt-4">
                  <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                    <div className="grid gap-3">
                      <Label htmlFor="email-magic">Email</Label>
                      <Input
                        id="email-magic"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="m@example.com"
                      />
                    </div>

                    {message && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {message}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading || !email}
                      className="w-full"
                    >
                      {isLoading ? 'Sending...' : 'Send Magic Link'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      We'll send you a secure link to sign in instantly.<br/>
                      You can set a password later if you prefer.
                    </p>

                    <div className="text-center text-sm">
                      Don&apos;t have an account?{" "}
                      <a href="/auth/register" className="underline underline-offset-4">
                        Sign up
                      </a>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <div className="bg-zinc-100 aspect-4/3 md:aspect-[unset] relative block dark:bg-zinc-800">
            <Image
              src="/baby.webp"
              alt="Image"
              fill
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      {/* <div className="text-zinc-500 text-center text-xs text-balance dark:text-zinc-400">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50">
          Privacy Policy
        </a>
        .
      </div> */}
    </div>
  )
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    }>
      <LoginFormContent className={className} {...props} />
    </Suspense>
  )
}

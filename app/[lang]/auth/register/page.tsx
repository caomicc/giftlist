'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/i18n-provider'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { t, locale } = useTranslation('auth')
  const register = (t as Record<string, Record<string, string | Record<string, string>>>)?.register as Record<string, string | Record<string, string>> | undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage((register?.validation as Record<string, string>)?.passwordsDoNotMatch ?? 'Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage((register?.validation as Record<string, string>)?.passwordTooShort ?? 'Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/${locale}`)
        router.refresh()
      } else {
        setMessage(data.error || ((register?.errors as Record<string, string>)?.failed ?? 'Failed to create account'))
      }
    } catch (error) {
      setMessage((register?.errors as Record<string, string>)?.failed ?? 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="container w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{(register?.title as string) ?? 'Create Account'}</CardTitle>
          <CardDescription>
            {(register?.subtitle as string) ?? 'Sign up for Gift List'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{(register?.form as Record<string, string>)?.name ?? 'Name (optional)'}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={(register?.form as Record<string, string>)?.namePlaceholder ?? 'Your name'}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">{(register?.form as Record<string, string>)?.email ?? 'Email address'}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={(register?.form as Record<string, string>)?.emailPlaceholder ?? 'Enter your email'}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">{(register?.form as Record<string, string>)?.password ?? 'Password'}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={(register?.form as Record<string, string>)?.passwordPlaceholder ?? 'Create a password'}
                className="mt-1"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">{(register?.form as Record<string, string>)?.confirmPassword ?? 'Confirm Password'}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={(register?.form as Record<string, string>)?.confirmPasswordPlaceholder ?? 'Confirm your password'}
                className="mt-1"
                minLength={6}
              />
            </div>

            {message && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email || !password || !confirmPassword}
              className="w-full"
            >
              {isLoading ? ((register?.form as Record<string, string>)?.submittingButton ?? 'Creating Account...') : ((register?.form as Record<string, string>)?.submitButton ?? 'Create Account')}
            </Button>

            <div className="text-center">
              <Button variant="link" asChild>
                <Link href={`/${locale}/auth/signin`}>
                  {(register?.footer as Record<string, string>)?.hasAccount ?? 'Already have an account?'}{' '}
                  {(register?.footer as Record<string, string>)?.signIn ?? 'Sign in'}
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        setMessage(data.error || 'Failed to set password')
      }
    } catch (error) {
      setMessage('Failed to set password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="container w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Set Password</CardTitle>
          <CardDescription>
            Add a password to your account so you can sign in with either method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a password"
                className="mt-1"
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
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
              disabled={isLoading || !password || !confirmPassword}
              className="w-full"
            >
              {isLoading ? 'Setting Password...' : 'Set Password'}
            </Button>

            <div className="text-center">
              <Button variant="link" asChild>
                <Link href="/">Skip for now</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

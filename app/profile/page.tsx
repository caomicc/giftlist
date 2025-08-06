'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  email: string
  name: string | null
  created_at: string
  hasPassword: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const router = useRouter()

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')

        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to load profile')
        }

        const data = await response.json()
        setProfile(data)
        setName(data.name || '')
        setHasPassword(data.hasPassword)
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setProfile(data)
        setMessage('Profile updated successfully!')
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Password updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setHasPassword(true)
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="container w-full max-w-xl">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>Failed to load profile. Please try again.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
          <CardDescription>
            Manage your account information and security settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="pt-4">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="mt-1 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the name that will be displayed to other family members
                  </p>
                </div>

                <div>
                  <Label>Member since</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || name.trim() === (profile.name || '')}
                  className="w-full"
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="password" className="pt-4">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {hasPassword && (
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="new-password">
                    {hasPassword ? 'New Password' : 'Set Password'}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="mt-1"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters long.
                  {!hasPassword && ' Since you signed up with a magic link, setting a password will allow you to sign in faster in the future.'}
                </p>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !newPassword ||
                    !confirmPassword ||
                    (hasPassword && !currentPassword) ||
                    newPassword !== confirmPassword
                  }
                  className="w-full"
                >
                  {isLoading ? 'Updating...' : hasPassword ? 'Change Password' : 'Set Password'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              Back to Gift List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

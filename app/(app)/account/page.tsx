'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

interface Profile {
  handle: string
  avatar_url: string | null
  school_id: string | null
}

interface Subscription {
  status: string
  current_period_end: string
  price_id: string
}

function AccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [handle, setHandle] = useState('')

  useEffect(() => {
    // Check for checkout success/cancel
    const checkout = searchParams.get('checkout')
    if (checkout === 'success') {
      toast.success('Welcome to Pro! Your subscription is now active.')
    } else if (checkout === 'cancelled') {
      toast.info('Checkout cancelled.')
    }

    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      // Load profile
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProfile(data)
            setHandle(data.handle)
          }
        })

      // Load subscription
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSubscription(data)
          }
        })

      setLoading(false)
    })
  }, [router, searchParams])

  const handleUpdateHandle = async () => {
    if (!handle.trim() || handle.length < 3) {
      toast.error('Handle must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
      toast.error('Handle can only contain letters, numbers, and underscores')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ handle })
        .eq('user_id', user?.id)

      if (error) {
        if (error.code === '23505') {
          throw new Error('This handle is already taken')
        }
        throw error
      }

      setProfile({ ...profile!, handle })
      toast.success('Handle updated!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update handle')
    } finally {
      setSaving(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPro =
    subscription?.status === 'active' &&
    new Date(subscription.current_period_end) > new Date()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Account Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your public identity on Study-Fizz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div>
            <Label htmlFor="handle">Handle</Label>
            <div className="flex gap-2">
              <Input
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your_handle"
                className="max-w-xs"
              />
              <Button
                onClick={handleUpdateHandle}
                disabled={saving || handle === profile?.handle}
                variant="outline"
              >
                {saving ? 'Saving...' : 'Update'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This is how other users will see you
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Manage your Study-Fizz plan
              </CardDescription>
            </div>
            {isPro && (
              <Badge variant="default" className="bg-primary">
                Pro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium">Pro Study Plan</p>
                <p className="text-sm text-muted-foreground">
                  Renews on {new Date(subscription!.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleManageBilling}>
                  Manage Billing
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-medium">Free Plan</p>
                <p className="text-sm text-muted-foreground">
                  5 AI quiz generations per day
                </p>
              </div>
              <Link href="/pricing">
                <Button>Upgrade to Pro</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro Benefits */}
      {!isPro && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚡</span> Upgrade to Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Unlimited AI quiz generations</li>
              <li>✓ Export quizzes to PDF and CSV</li>
              <li>✓ Priority support</li>
              <li>✓ Early access to new features</li>
            </ul>
            <Link href="/pricing">
              <Button className="mt-4 w-full">View Pricing</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    }>
      <AccountContent />
    </Suspense>
  )
}

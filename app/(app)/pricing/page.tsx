'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [hasStripe, setHasStripe] = useState(false)
  const [isPro, setIsPro] = useState(false)

  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_STUDY_MONTHLY_PRICE_ID
  const annualPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_STUDY_ANNUAL_PRICE_ID

  useEffect(() => {
    // Check for checkout cancelled
    if (searchParams.get('checkout') === 'cancelled') {
      toast.info('Checkout cancelled.')
    }

    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)

      if (user) {
        // Check subscription
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.status === 'active' && new Date(data.current_period_end) > new Date()) {
              setIsPro(true)
            }
          })
      }

      setLoading(false)
    })

    // Check if Stripe is configured
    setHasStripe(Boolean(monthlyPriceId || annualPriceId))
  }, [searchParams, monthlyPriceId, annualPriceId])

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      router.push('/auth/signup')
      return
    }

    setCheckingOut(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout')
      setCheckingOut(false)
    }
  }

  if (isPro) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Badge variant="default" className="mb-4 bg-primary">Pro Member</Badge>
        <h1 className="text-3xl font-bold mb-4">You&apos;re already a Pro!</h1>
        <p className="text-muted-foreground mb-6">
          Enjoy unlimited AI quizzes, exports, and all Pro features.
        </p>
        <Link href="/account">
          <Button variant="outline">Manage Subscription</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          Start free, upgrade when you need more
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Browse all course hubs
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Ask and answer questions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                5 AI quiz generations/day
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Buy and sell on marketplace
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span>✗</span>
                Export quizzes
              </li>
            </ul>
            {user ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="border-primary relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary">Most Popular</Badge>
          </div>
          <CardHeader>
            <CardTitle>Pro Study</CardTitle>
            <CardDescription>For serious students</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            {annualPriceId && (
              <p className="text-sm text-muted-foreground">
                or $79.99/year (save 33%)
              </p>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <strong>Unlimited</strong> AI quiz generations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Export to PDF and CSV
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Priority support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Early access to features
              </li>
            </ul>

            {!hasStripe ? (
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            ) : monthlyPriceId ? (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleCheckout(monthlyPriceId)}
                  disabled={loading || checkingOut}
                >
                  {checkingOut ? 'Loading...' : user ? 'Upgrade to Pro' : 'Get Started'}
                </Button>
                {annualPriceId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCheckout(annualPriceId)}
                    disabled={loading || checkingOut}
                  >
                    Pay Annually (Save 33%)
                  </Button>
                )}
              </div>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All plans include a pseudonymous profile, direct messaging, and full marketplace access.</p>
        <p className="mt-2">Cancel anytime. No questions asked.</p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-12">
          <div className="h-10 bg-muted rounded w-1/2 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-muted rounded w-1/3 mx-auto animate-pulse" />
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}

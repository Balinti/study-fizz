'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { addDraftListing } from '@/lib/local/storage'
import { LISTING_CATEGORIES, LISTING_CONDITIONS, PICKUP_AREAS } from '@/lib/types'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

export default function NewListingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    condition: '',
    pickupArea: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  const handleSubmit = async () => {
    // Validate
    if (!form.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!form.description.trim()) {
      toast.error('Please enter a description')
      return
    }
    if (!form.category) {
      toast.error('Please select a category')
      return
    }
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (!form.condition) {
      toast.error('Please select a condition')
      return
    }
    if (!form.pickupArea) {
      toast.error('Please select a pickup area')
      return
    }

    setSubmitting(true)
    const priceCents = Math.round(parseFloat(form.price) * 100)

    if (!user) {
      // Save as draft locally
      addDraftListing({
        id: crypto.randomUUID(),
        title: form.title,
        description: form.description,
        category: form.category,
        priceCents,
        condition: form.condition,
        pickupArea: form.pickupArea,
        imageUrls: [],
        createdAt: new Date().toISOString(),
      })
      toast.success('Draft saved locally! Create an account to publish.')
      router.push('/marketplace')
      return
    }

    try {
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          priceCents,
          condition: form.condition,
          pickupArea: form.pickupArea,
          imagePaths: [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing')
      }

      toast.success('Listing created!')
      router.push('/marketplace')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create listing')
      setSubmitting(false)
    }
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
            <div className="h-32 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/marketplace" className="text-muted-foreground hover:text-foreground">
          Marketplace
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">New Listing</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a Listing</CardTitle>
          <CardDescription>
            {user
              ? 'Sell items to fellow students on campus.'
              : 'Your listing will be saved as a draft. Create an account to publish it.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What are you selling?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your item in detail..."
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={5000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={form.condition}
                onValueChange={(value) => setForm({ ...form, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_CONDITIONS.map((cond) => (
                    <SelectItem key={cond.value} value={cond.value}>
                      {cond.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickupArea">Pickup Location</Label>
              <Select
                value={form.pickupArea}
                onValueChange={(value) => setForm({ ...form, pickupArea: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Saving...' : user ? 'Create Listing' : 'Save Draft'}
            </Button>
            <Link href="/marketplace">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

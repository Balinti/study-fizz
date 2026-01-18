'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { getDraftListings } from '@/lib/local/storage'
import type { Listing } from '@/lib/types'
import { LISTING_CATEGORIES } from '@/lib/types'

// Demo listings for fallback
const DEMO_LISTINGS: Listing[] = [
  {
    id: 'demo-listing-1',
    seller_id: '',
    title: 'Calculus Textbook - Stewart 8th Edition',
    description: 'Lightly used calculus textbook. Some highlighting but no missing pages. Perfect for MATH101.',
    category: 'textbooks',
    price_cents: 4500,
    condition: 'good',
    pickup_area: 'Main Campus - Library',
    status: 'active',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    seller: { handle: 'bookworm_22', avatar_url: null },
  },
  {
    id: 'demo-listing-2',
    seller_id: '',
    title: 'TI-84 Plus Graphing Calculator',
    description: 'Works perfectly. Selling because I upgraded. Batteries included.',
    category: 'electronics',
    price_cents: 6000,
    condition: 'like_new',
    pickup_area: 'Main Campus - Student Center',
    status: 'active',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    seller: { handle: 'tech_seller', avatar_url: null },
  },
  {
    id: 'demo-listing-3',
    seller_id: '',
    title: 'Desk Lamp - LED Study Light',
    description: 'Adjustable brightness. USB powered. Great for late night study sessions.',
    category: 'electronics',
    price_cents: 1500,
    condition: 'good',
    pickup_area: 'North Campus',
    status: 'active',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    seller: { handle: 'dorm_deals', avatar_url: null },
  },
]

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>(DEMO_LISTINGS)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [localDrafts, setLocalDrafts] = useState<ReturnType<typeof getDraftListings>>([])

  useEffect(() => {
    const supabase = createClient()

    // Load listings from Supabase
    supabase
      .from('listings')
      .select(`
        *,
        seller:profiles!listings_seller_id_fkey(handle, avatar_url)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setListings(data as Listing[])
        }
        setLoading(false)
      })

    // Load local drafts
    setLocalDrafts(getDraftListings())
  }, [])

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'all' || listing.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Campus Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell with verified students</p>
        </div>
        <Link href="/marketplace/new">
          <Button>Create Listing</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {LISTING_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Local Drafts */}
      {localDrafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Badge variant="outline">Drafts</Badge>
            Your unpublished listings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localDrafts.map((draft) => (
              <Card key={draft.id} className="border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Draft</Badge>
                    <span className="font-bold text-lg">
                      {formatPrice(draft.priceCents)}
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{draft.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {draft.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Link href="/auth/signup" className="text-primary hover:underline">
                      Create an account
                    </Link>{' '}
                    to publish
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Listings */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {search || category !== 'all'
                ? 'No listings match your filters'
                : 'No listings yet. Be the first to sell something!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const categoryLabel = LISTING_CATEGORIES.find(c => c.value === listing.category)?.label || listing.category

  return (
    <Card className="hover:border-primary/50 transition-colors overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{categoryLabel}</Badge>
          <span className="font-bold text-lg text-primary">
            {formatPrice(listing.price_cents)}
          </span>
        </div>
        <CardTitle className="text-base line-clamp-1">{listing.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs">
          <span>{listing.seller?.handle || 'Unknown'}</span>
          <span>•</span>
          <span>{listing.pickup_area}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {listing.description}
        </p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">
            {listing.condition.replace('_', ' ')}
          </Badge>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

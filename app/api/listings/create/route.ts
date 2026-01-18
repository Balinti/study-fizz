import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { moderateContent } from '@/lib/ai/prompts'
import { LISTING_CATEGORIES, LISTING_CONDITIONS, PICKUP_AREAS } from '@/lib/types'

const requestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  category: z.enum(LISTING_CATEGORIES.map(c => c.value) as [string, ...string[]]),
  priceCents: z.number().int().min(0).max(1000000),
  condition: z.enum(LISTING_CONDITIONS.map(c => c.value) as [string, ...string[]]),
  pickupArea: z.string().refine(val => PICKUP_AREAS.includes(val), 'Invalid pickup area'),
  imagePaths: z.array(z.string()).max(5).default([]),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to create listings' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, description, category, priceCents, condition, pickupArea, imagePaths } = parsed.data

    // Content moderation
    const titleMod = await moderateContent(title)
    if (titleMod.flagged) {
      return NextResponse.json(
        { error: titleMod.reason || 'Title violates community guidelines' },
        { status: 400 }
      )
    }

    const descMod = await moderateContent(description)
    if (descMod.flagged) {
      return NextResponse.json(
        { error: descMod.reason || 'Description violates community guidelines' },
        { status: 400 }
      )
    }

    // Create listing
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title,
        description,
        category,
        price_cents: priceCents,
        condition,
        pickup_area: pickupArea,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Listing creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      )
    }

    // Add images if provided
    if (imagePaths.length > 0) {
      const images = imagePaths.map(path => ({
        listing_id: listing.id,
        storage_path: path,
      }))

      await supabase.from('listing_images').insert(images)
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Listing creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}

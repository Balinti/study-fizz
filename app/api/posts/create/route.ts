import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { moderateContent } from '@/lib/ai/prompts'
import { checkAnonPostQuota } from '@/lib/ai/quota'

const requestSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  body: z.string().min(10, 'Body must be at least 10 characters').max(10000),
  tags: z.array(z.string()).max(5).default([]),
  isAnon: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to create posts' },
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

    const { courseId, title, body: postBody, tags, isAnon } = parsed.data

    // Check if course exists
    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single()

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check anonymous post quota (1/day)
    if (isAnon) {
      const anonQuota = await checkAnonPostQuota(user.id)
      if (!anonQuota.allowed) {
        return NextResponse.json(
          { error: 'You can only post 1 anonymous question per day' },
          { status: 429 }
        )
      }
    }

    // Content moderation
    const titleMod = await moderateContent(title)
    if (titleMod.flagged) {
      return NextResponse.json(
        { error: titleMod.reason || 'Title violates community guidelines' },
        { status: 400 }
      )
    }

    const bodyMod = await moderateContent(postBody)
    if (bodyMod.flagged) {
      return NextResponse.json(
        { error: bodyMod.reason || 'Content violates community guidelines' },
        { status: 400 }
      )
    }

    // Auto-join course if not a member
    await supabase
      .from('course_memberships')
      .upsert(
        { course_id: courseId, user_id: user.id },
        { onConflict: 'course_id,user_id' }
      )

    // Create post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        course_id: courseId,
        author_id: user.id,
        title,
        body: postBody,
        tags,
        is_anon: isAnon,
      })
      .select()
      .single()

    if (error) {
      console.error('Post creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

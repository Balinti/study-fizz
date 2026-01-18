import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { moderateContent } from '@/lib/ai/prompts'

const requestSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().min(10, 'Answer must be at least 10 characters').max(10000),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to answer' },
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

    const { postId, body: answerBody } = parsed.data

    // Check if post exists
    const { data: post } = await supabase
      .from('posts')
      .select('id, course_id')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Content moderation
    const moderation = await moderateContent(answerBody)
    if (moderation.flagged) {
      return NextResponse.json(
        { error: moderation.reason || 'Content violates community guidelines' },
        { status: 400 }
      )
    }

    // Auto-join course if not a member
    await supabase
      .from('course_memberships')
      .upsert(
        { course_id: post.course_id, user_id: user.id },
        { onConflict: 'course_id,user_id' }
      )

    // Create answer
    const { data: answer, error } = await supabase
      .from('answers')
      .insert({
        post_id: postId,
        author_id: user.id,
        body: answerBody,
      })
      .select()
      .single()

    if (error) {
      console.error('Answer creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create answer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('Answer creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create answer' },
      { status: 500 }
    )
  }
}

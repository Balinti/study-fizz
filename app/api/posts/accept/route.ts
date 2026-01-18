import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  postId: z.string().uuid(),
  answerId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
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

    const { postId, answerId } = parsed.data

    // Check if user is the post author
    const { data: post } = await supabase
      .from('posts')
      .select('id, author_id')
      .eq('id', postId)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the post author can accept answers' },
        { status: 403 }
      )
    }

    // Check if answer exists and belongs to this post
    const { data: answer } = await supabase
      .from('answers')
      .select('id, post_id')
      .eq('id', answerId)
      .single()

    if (!answer || answer.post_id !== postId) {
      return NextResponse.json(
        { error: 'Answer not found' },
        { status: 404 }
      )
    }

    // Upsert the accepted answer
    const { error } = await supabase
      .from('post_accepts')
      .upsert(
        {
          post_id: postId,
          accepted_answer_id: answerId,
          accepted_by: user.id,
        },
        { onConflict: 'post_id' }
      )

    if (error) {
      console.error('Accept answer error:', error)
      return NextResponse.json(
        { error: 'Failed to accept answer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accept answer error:', error)
    return NextResponse.json(
      { error: 'Failed to accept answer' },
      { status: 500 }
    )
  }
}

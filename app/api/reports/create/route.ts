import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  targetType: z.enum(['post', 'answer', 'listing', 'user']),
  targetId: z.string().uuid(),
  reason: z.string().min(10, 'Please provide more detail about the issue').max(1000),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to report' },
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

    const { targetType, targetId, reason } = parsed.data

    // Check for duplicate report
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      )
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
      })
      .select()
      .single()

    if (error) {
      console.error('Report creation error:', error)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ report, message: 'Report submitted successfully' })
  } catch (error) {
    console.error('Report creation error:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}

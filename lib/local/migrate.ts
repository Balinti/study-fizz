import { createClient } from '@/lib/supabase/client'
import {
  getAllLocalData,
  clearAllLocalData,
  DraftPost,
  DraftAnswer,
  DraftListing,
  AIQuiz,
} from './storage'

export async function migrateLocalDataToSupabase(userId: string): Promise<{
  success: boolean
  migrated: {
    posts: number
    answers: number
    listings: number
    quizzes: number
    memberships: number
  }
  errors: string[]
}> {
  const supabase = createClient()
  const data = getAllLocalData()
  const errors: string[] = []
  const migrated = {
    posts: 0,
    answers: 0,
    listings: 0,
    quizzes: 0,
    memberships: 0,
  }

  // Migrate course memberships
  if (data.selectedCourseIds.length > 0) {
    const memberships = data.selectedCourseIds.map(courseId => ({
      course_id: courseId,
      user_id: userId,
    }))

    const { error } = await supabase
      .from('course_memberships')
      .upsert(memberships, { onConflict: 'course_id,user_id' })

    if (error) {
      errors.push(`Failed to migrate memberships: ${error.message}`)
    } else {
      migrated.memberships = memberships.length
    }
  }

  // Migrate draft posts
  for (const post of data.draftPosts) {
    const { error } = await supabase.from('posts').insert({
      course_id: post.courseId,
      author_id: userId,
      title: post.title,
      body: post.body,
      tags: post.tags,
      is_anon: post.isAnon,
    })

    if (error) {
      errors.push(`Failed to migrate post "${post.title}": ${error.message}`)
    } else {
      migrated.posts++
    }
  }

  // Migrate draft answers
  for (const answer of data.draftAnswers) {
    const { error } = await supabase.from('answers').insert({
      post_id: answer.postId,
      author_id: userId,
      body: answer.body,
    })

    if (error) {
      errors.push(`Failed to migrate answer: ${error.message}`)
    } else {
      migrated.answers++
    }
  }

  // Migrate draft listings
  for (const listing of data.draftListings) {
    const { error } = await supabase.from('listings').insert({
      seller_id: userId,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price_cents: listing.priceCents,
      condition: listing.condition,
      pickup_area: listing.pickupArea,
      status: 'active',
    })

    if (error) {
      errors.push(`Failed to migrate listing "${listing.title}": ${error.message}`)
    } else {
      migrated.listings++
    }
  }

  // Migrate AI quizzes
  for (const quiz of data.aiQuizzes) {
    const { error } = await supabase.from('ai_quizzes').insert({
      user_id: userId,
      course_id: quiz.courseId || null,
      source_text: quiz.sourceText,
      questions: quiz.questions,
    })

    if (error) {
      errors.push(`Failed to migrate quiz: ${error.message}`)
    } else {
      migrated.quizzes++
    }
  }

  // Clear local data if all migrations succeeded
  const totalMigrated = Object.values(migrated).reduce((a, b) => a + b, 0)
  if (errors.length === 0 && totalMigrated > 0) {
    clearAllLocalData()
  }

  return {
    success: errors.length === 0,
    migrated,
    errors,
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkAIQuota, incrementAIQuota } from '@/lib/ai/quota'
import { QUIZ_GENERATION_PROMPT } from '@/lib/ai/prompts'
import { getUserSubscription, isPro } from '@/lib/auth'

const requestSchema = z.object({
  notes: z.string().min(50, 'Notes must be at least 50 characters'),
  courseId: z.string().uuid().optional(),
})

// Fallback quiz generator when OpenAI is not available
function generateFallbackQuiz(notes: string) {
  const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const questions = []

  for (let i = 0; i < Math.min(5, sentences.length); i++) {
    const sentence = sentences[i].trim()
    const words = sentence.split(' ').filter(w => w.length > 3)

    if (words.length < 3) continue

    const keyWord = words[Math.floor(Math.random() * words.length)]
    const wrongAnswers = [
      'None of the above',
      'All of the above',
      'This is incorrect',
    ]

    questions.push({
      question: `Based on the notes, which concept relates to: "${sentence.substring(0, 60)}..."?`,
      choices: [
        keyWord,
        ...wrongAnswers.slice(0, 3),
      ].sort(() => Math.random() - 0.5),
      answer: 0, // Will be shuffled
      explanation: 'This is a placeholder question. Enable OpenAI for better quiz generation.',
    })
  }

  // Ensure we have at least 5 questions
  while (questions.length < 5) {
    questions.push({
      question: `Review question ${questions.length + 1}: What is an important concept from these notes?`,
      choices: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
      answer: 0,
      explanation: 'This is a placeholder question. Enable OpenAI for better quiz generation.',
    })
  }

  return { questions: questions.slice(0, 5) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { notes, courseId } = parsed.data

    // Check user authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check subscription status
    const subscription = user ? await getUserSubscription() : null
    const userIsPro = isPro(subscription)

    // Check quota
    const quota = await checkAIQuota(user?.id || null, userIsPro)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: 'Daily quiz generation limit reached',
          remaining: 0,
          limit: quota.limit,
          upgrade: !userIsPro,
        },
        { status: 429 }
      )
    }

    let quizData

    // Generate quiz using OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an educational quiz generator. Always respond with valid JSON only.',
              },
              {
                role: 'user',
                content: QUIZ_GENERATION_PROMPT + notes,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices[0]?.message?.content

          if (content) {
            try {
              // Clean the response in case there's markdown
              const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim()
              quizData = JSON.parse(cleanJson)
            } catch {
              console.error('Failed to parse OpenAI response:', content)
              quizData = generateFallbackQuiz(notes)
            }
          }
        } else {
          console.error('OpenAI API error:', response.status)
          quizData = generateFallbackQuiz(notes)
        }
      } catch (e) {
        console.error('OpenAI request failed:', e)
        quizData = generateFallbackQuiz(notes)
      }
    } else {
      // No OpenAI key - use fallback
      quizData = generateFallbackQuiz(notes)
    }

    // Track usage for authenticated users
    if (user?.id) {
      await incrementAIQuota(user.id)

      // Save quiz to database
      await supabase.from('ai_quizzes').insert({
        user_id: user.id,
        course_id: courseId || null,
        source_text: notes.substring(0, 5000), // Limit stored text
        questions: quizData.questions,
      })
    }

    return NextResponse.json({
      questions: quizData.questions,
      remaining: quota.remaining - 1,
      limit: quota.limit,
      isPro: userIsPro,
    })
  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}

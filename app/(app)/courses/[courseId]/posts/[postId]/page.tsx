'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { addDraftAnswer } from '@/lib/local/storage'
import { toast } from 'sonner'
import type { Post, Answer } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

// Demo post for fallback
const DEMO_POST: Post = {
  id: 'demo-1',
  course_id: '00000000-0000-0000-0001-000000000001',
  author_id: '',
  title: 'How do I understand recursion?',
  body: 'I keep getting confused when trying to trace through recursive functions. Any tips for understanding how recursion works? I understand the basic concept of a function calling itself, but when I try to trace through the execution, I get lost.\n\nFor example, with this factorial function:\n```\nfunction factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\n```\n\nHow do I mentally track what\'s happening?',
  tags: ['recursion', 'help'],
  is_anon: false,
  created_at: new Date(Date.now() - 3600000).toISOString(),
  author: { handle: 'student_demo', avatar_url: null },
  accepted_answer_id: 'demo-answer-1',
}

const DEMO_ANSWERS: Answer[] = [
  {
    id: 'demo-answer-1',
    post_id: 'demo-1',
    author_id: '',
    body: 'Great question! The key to understanding recursion is to think about it as a stack of function calls.\n\nFor factorial(3):\n1. factorial(3) waits for factorial(2)\n2. factorial(2) waits for factorial(1)\n3. factorial(1) returns 1\n4. factorial(2) returns 2 * 1 = 2\n5. factorial(3) returns 3 * 2 = 6\n\nTry drawing out the call stack on paper - it really helps visualize what\'s happening!',
    created_at: new Date(Date.now() - 3000000).toISOString(),
    author: { handle: 'tutor_helper', avatar_url: null },
  },
  {
    id: 'demo-answer-2',
    post_id: 'demo-1',
    author_id: '',
    body: 'I found it helpful to use Python Tutor (pythontutor.com) to visualize recursion. You can step through each function call and see the stack grow and shrink.',
    created_at: new Date(Date.now() - 2000000).toISOString(),
    author: { handle: 'cs_enthusiast', avatar_url: null },
  },
]

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; postId: string }>
}) {
  const { courseId, postId } = use(params)
  const [post, setPost] = useState<Post | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [newAnswer, setNewAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Load post
    supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(handle, avatar_url),
        post_accepts(accepted_answer_id)
      `)
      .eq('id', postId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setPost({
            ...data,
            accepted_answer_id: (data.post_accepts as { accepted_answer_id: string }[])?.[0]?.accepted_answer_id || null,
          } as Post)
        } else if (postId === 'demo-1') {
          setPost(DEMO_POST)
        }
      })

    // Load answers
    supabase
      .from('answers')
      .select(`
        *,
        author:profiles!answers_author_id_fkey(handle, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setAnswers(data as Answer[])
        } else if (postId === 'demo-1') {
          setAnswers(DEMO_ANSWERS)
        }
        setLoading(false)
      })
  }, [postId])

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) {
      toast.error('Please write an answer')
      return
    }

    setSubmitting(true)

    if (!user) {
      // Save as draft locally
      addDraftAnswer({
        id: crypto.randomUUID(),
        postId,
        body: newAnswer,
        createdAt: new Date().toISOString(),
      })
      toast.success('Draft saved locally! Create an account to publish.')
      setNewAnswer('')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/answers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          body: newAnswer,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer')
      }

      toast.success('Answer posted!')
      setNewAnswer('')

      // Refresh answers
      const supabase = createClient()
      const { data: newAnswers } = await supabase
        .from('answers')
        .select(`
          *,
          author:profiles!answers_author_id_fkey(handle, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (newAnswers) {
        setAnswers(newAnswers as Answer[])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user || !post || post.author_id !== user.id) {
      return
    }

    try {
      const response = await fetch('/api/posts/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          answerId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept answer')
      }

      toast.success('Answer accepted!')
      setPost({ ...post, accepted_answer_id: answerId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to accept answer')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-32 bg-muted rounded" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Post not found</p>
        <Link href={`/courses/${courseId}`}>
          <Button variant="link">Back to course</Button>
        </Link>
      </div>
    )
  }

  const isAuthor = user && post.author_id === user.id

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link href="/courses" className="text-muted-foreground hover:text-foreground">
          Courses
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/courses/${courseId}`} className="text-muted-foreground hover:text-foreground">
          Course
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium truncate">{post.title}</span>
      </div>

      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {post.accepted_answer_id && (
              <Badge variant="default" className="bg-green-600">Solved</Badge>
            )}
            {post.is_anon && <Badge variant="secondary">Anonymous</Badge>}
            {post.tags?.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
          <CardTitle className="text-xl">{post.title}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>{post.is_anon ? 'Anonymous' : post.author?.handle || 'Unknown'}</span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{post.body}</p>
          </div>
        </CardContent>
      </Card>

      {/* Answers */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        {answers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No answers yet. Be the first to help!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
              <Card
                key={answer.id}
                className={answer.id === post.accepted_answer_id ? 'border-green-500 border-2' : ''}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="flex items-center gap-2">
                      <span>{answer.author?.handle || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(answer.created_at).toLocaleString()}</span>
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      {answer.id === post.accepted_answer_id && (
                        <Badge variant="default" className="bg-green-600">Accepted</Badge>
                      )}
                      {isAuthor && answer.id !== post.accepted_answer_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcceptAnswer(answer.id)}
                        >
                          Accept Answer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{answer.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Answer Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Answer</CardTitle>
          {!user && (
            <CardDescription>
              Your answer will be saved as a draft.{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Create an account
              </Link>{' '}
              to publish it.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              placeholder="Share your knowledge..."
              rows={6}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSubmitAnswer}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : user ? 'Post Answer' : 'Save Draft'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

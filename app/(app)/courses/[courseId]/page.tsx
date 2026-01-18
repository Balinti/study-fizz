'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { addDraftPost, getDraftPosts } from '@/lib/local/storage'
import { toast } from 'sonner'
import type { Post, Course } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

// Demo courses for fallback
const DEMO_COURSES: Record<string, Course> = {
  '00000000-0000-0000-0001-000000000001': { id: '00000000-0000-0000-0001-000000000001', school_id: '00000000-0000-0000-0000-000000000001', code: 'CS101', title: 'Introduction to Computer Science', created_at: '' },
  '00000000-0000-0000-0001-000000000002': { id: '00000000-0000-0000-0001-000000000002', school_id: '00000000-0000-0000-0000-000000000001', code: 'CS201', title: 'Data Structures and Algorithms', created_at: '' },
  '00000000-0000-0000-0001-000000000003': { id: '00000000-0000-0000-0001-000000000003', school_id: '00000000-0000-0000-0000-000000000001', code: 'CS301', title: 'Database Systems', created_at: '' },
  '00000000-0000-0000-0001-000000000004': { id: '00000000-0000-0000-0001-000000000004', school_id: '00000000-0000-0000-0000-000000000001', code: 'MATH101', title: 'Calculus I', created_at: '' },
}

// Demo posts for the course
const DEMO_POSTS: Post[] = [
  {
    id: 'demo-1',
    course_id: '00000000-0000-0000-0001-000000000001',
    author_id: '',
    title: 'How do I understand recursion?',
    body: 'I keep getting confused when trying to trace through recursive functions. Any tips for understanding how recursion works?',
    tags: ['recursion', 'help'],
    is_anon: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    author: { handle: 'student_demo', avatar_url: null },
    answers_count: 3,
    accepted_answer_id: 'answer-1',
  },
  {
    id: 'demo-2',
    course_id: '00000000-0000-0000-0001-000000000001',
    author_id: '',
    title: 'Best resources for learning Big O notation?',
    body: 'Looking for good videos or articles that explain Big O notation in simple terms.',
    tags: ['big-o', 'resources'],
    is_anon: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    author: { handle: 'Anonymous', avatar_url: null },
    answers_count: 1,
  },
]

export default function CourseHubPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', body: '', isAnon: false })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Load course
    supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setCourse(data)
        } else {
          // Use demo course
          setCourse(DEMO_COURSES[courseId] || null)
        }
      })

    // Load posts
    supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(handle, avatar_url),
        answers(count),
        post_accepts(accepted_answer_id)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const formattedPosts = data.map((p: Record<string, unknown>) => ({
            ...p,
            answers_count: (p.answers as { count: number }[])?.[0]?.count || 0,
            accepted_answer_id: (p.post_accepts as { accepted_answer_id: string }[])?.[0]?.accepted_answer_id || null,
          }))
          setPosts(formattedPosts as Post[])
        } else {
          // Show demo posts for demo courses
          if (courseId.startsWith('00000000')) {
            setPosts(DEMO_POSTS.filter(p => p.course_id === courseId || courseId === '00000000-0000-0000-0001-000000000001'))
          }
        }
        setLoading(false)
      })
  }, [courseId])

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.body.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)

    if (!user) {
      // Save as draft locally
      addDraftPost({
        id: crypto.randomUUID(),
        courseId,
        title: newPost.title,
        body: newPost.body,
        tags: [],
        isAnon: newPost.isAnon,
        createdAt: new Date().toISOString(),
      })
      toast.success('Draft saved locally! Create an account to publish.')
      setDialogOpen(false)
      setNewPost({ title: '', body: '', isAnon: false })
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: newPost.title,
          body: newPost.body,
          tags: [],
          isAnon: newPost.isAnon,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post')
      }

      toast.success('Post created!')
      setDialogOpen(false)
      setNewPost({ title: '', body: '', isAnon: false })
      // Refresh posts
      const supabase = createClient()
      const { data: newPosts } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(handle, avatar_url),
          answers(count),
          post_accepts(accepted_answer_id)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
      if (newPosts) {
        const formattedPosts = newPosts.map((p: Record<string, unknown>) => ({
          ...p,
          answers_count: (p.answers as { count: number }[])?.[0]?.count || 0,
          accepted_answer_id: (p.post_accepts as { accepted_answer_id: string }[])?.[0]?.accepted_answer_id || null,
        }))
        setPosts(formattedPosts as Post[])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  // Get local draft posts for this course
  const localDrafts = getDraftPosts().filter(p => p.courseId === courseId)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/courses" className="text-muted-foreground hover:text-foreground">
              Courses
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{course.code}</span>
          </div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ask a Question</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
              <DialogDescription>
                {user
                  ? 'Share your question with the course community.'
                  : 'Your question will be saved as a draft. Create an account to publish it.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="What do you want to know?"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="body">Details</Label>
                <Textarea
                  id="body"
                  placeholder="Provide more context..."
                  rows={4}
                  value={newPost.body}
                  onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                />
              </div>
              {user && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAnon"
                    checked={newPost.isAnon}
                    onChange={(e) => setNewPost({ ...newPost, isAnon: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isAnon" className="text-sm">
                    Post anonymously (1 per day)
                  </Label>
                </div>
              )}
              <Button
                onClick={handleCreatePost}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Saving...' : user ? 'Post Question' : 'Save Draft'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Local Drafts */}
      {localDrafts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Badge variant="outline">Drafts</Badge>
            Your unpublished questions
          </h2>
          <div className="space-y-3">
            {localDrafts.map((draft) => (
              <Card key={draft.id} className="border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Draft</Badge>
                    <CardTitle className="text-base">{draft.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{draft.body}</p>
                  {!user && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <Link href="/auth/signup" className="text-primary hover:underline">
                        Create an account
                      </Link>{' '}
                      to publish this question
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Questions</h2>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Link key={post.id} href={`/courses/${courseId}/posts/${post.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.accepted_answer_id && (
                      <Badge variant="default" className="bg-green-600">Solved</Badge>
                    )}
                    {post.is_anon && <Badge variant="secondary">Anonymous</Badge>}
                    <CardTitle className="text-base">{post.title}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <span>{post.is_anon ? 'Anonymous' : post.author?.handle || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.answers_count || 0} answers</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

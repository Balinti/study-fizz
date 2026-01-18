'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { getAIQuizzes, addAIQuiz, getAIUsage, incrementAIUsage } from '@/lib/local/storage'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import type { QuizQuestion } from '@/lib/types'
import Link from 'next/link'

const FREE_DAILY_LIMIT = 5

export default function StudyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [remaining, setRemaining] = useState(FREE_DAILY_LIMIT)
  const [savedQuizzes, setSavedQuizzes] = useState<{ id: string; createdAt: string; questions: QuizQuestion[] }[]>([])
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        // Load saved quizzes from DB
        supabase
          .from('ai_quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (data) {
              setSavedQuizzes(data.map(q => ({
                id: q.id,
                createdAt: q.created_at,
                questions: q.questions as QuizQuestion[],
              })))
            }
          })

        // Check subscription
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.status === 'active' && new Date(data.current_period_end) > new Date()) {
              setIsPro(true)
              setRemaining(100)
            }
          })
      } else {
        // Load from localStorage
        const localQuizzes = getAIQuizzes()
        setSavedQuizzes(localQuizzes.map(q => ({
          id: q.id,
          createdAt: q.createdAt,
          questions: q.questions,
        })))
        const usage = getAIUsage()
        setRemaining(Math.max(0, FREE_DAILY_LIMIT - usage.count))
      }
    })
  }, [])

  const handleGenerate = async () => {
    if (notes.length < 50) {
      toast.error('Please provide at least 50 characters of notes')
      return
    }

    if (remaining <= 0 && !isPro) {
      toast.error('Daily limit reached. Upgrade to Pro for unlimited quizzes!')
      return
    }

    setGenerating(true)
    setQuiz(null)
    setAnswers({})
    setShowResults(false)

    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quiz')
      }

      setQuiz(data.questions)
      setRemaining(data.remaining)

      // Save to local storage if anonymous
      if (!user) {
        incrementAIUsage()
        addAIQuiz({
          id: crypto.randomUUID(),
          sourceText: notes.substring(0, 500),
          questions: data.questions,
          createdAt: new Date().toISOString(),
        })
      }

      toast.success('Quiz generated!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = (questionIndex: number, choiceIndex: number) => {
    if (showResults) return
    setAnswers({ ...answers, [questionIndex]: choiceIndex })
  }

  const handleSubmit = () => {
    if (!quiz) return
    if (Object.keys(answers).length < quiz.length) {
      toast.error('Please answer all questions')
      return
    }
    setShowResults(true)
  }

  const getScore = () => {
    if (!quiz) return 0
    return quiz.filter((q, i) => answers[i] === q.answer).length
  }

  const handleExport = (format: 'pdf' | 'csv') => {
    if (!quiz) return

    if (!isPro) {
      toast.error('Export is a Pro feature. Upgrade to export your quizzes!')
      return
    }

    if (format === 'csv') {
      const csv = [
        'Question,Choice A,Choice B,Choice C,Choice D,Correct Answer,Explanation',
        ...quiz.map(q => [
          `"${q.question.replace(/"/g, '""')}"`,
          ...q.choices.map(c => `"${c.replace(/"/g, '""')}"`),
          ['A', 'B', 'C', 'D'][q.answer],
          `"${(q.explanation || '').replace(/"/g, '""')}"`,
        ].join(',')),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'quiz.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Quiz exported as CSV')
    } else {
      // Simple print-friendly HTML for PDF
      const html = `
        <html>
          <head>
            <title>Quiz Export</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 20px; }
              .question { margin-bottom: 20px; }
              .choices { margin-left: 20px; }
              .correct { color: green; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Quiz</h1>
            ${quiz.map((q, i) => `
              <div class="question">
                <p><strong>${i + 1}. ${q.question}</strong></p>
                <div class="choices">
                  ${q.choices.map((c, j) => `
                    <p class="${j === q.answer ? 'correct' : ''}">${['A', 'B', 'C', 'D'][j]}. ${c}</p>
                  `).join('')}
                </div>
                ${q.explanation ? `<p><em>Explanation: ${q.explanation}</em></p>` : ''}
              </div>
            `).join('')}
          </body>
        </html>
      `
      const w = window.open()
      w?.document.write(html)
      w?.document.close()
      w?.print()
      toast.success('Print dialog opened for PDF export')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Study Tools</h1>
          <p className="text-muted-foreground">Generate quizzes from your notes</p>
        </div>
        <div className="text-right">
          <Badge variant={remaining > 0 ? 'secondary' : 'destructive'}>
            {remaining} quizzes remaining today
          </Badge>
          {!isPro && (
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/pricing" className="text-primary hover:underline">
                Upgrade to Pro
              </Link>{' '}
              for unlimited
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="generate">
        <TabsList className="mb-4">
          <TabsTrigger value="generate">Generate Quiz</TabsTrigger>
          <TabsTrigger value="saved">Saved Quizzes ({savedQuizzes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Paste Your Notes</CardTitle>
              <CardDescription>
                Enter your study notes and we&apos;ll generate a 5-question quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Study Notes (minimum 50 characters)</Label>
                <Textarea
                  id="notes"
                  placeholder="Paste your lecture notes, textbook excerpts, or any study material..."
                  rows={8}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {notes.length} characters
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating || notes.length < 50 || (remaining <= 0 && !isPro)}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate Quiz'}
              </Button>
            </CardContent>
          </Card>

          {quiz && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Quiz</CardTitle>
                    <CardDescription>
                      {showResults
                        ? `Score: ${getScore()}/${quiz.length}`
                        : 'Answer all questions and submit'}
                    </CardDescription>
                  </div>
                  {showResults && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv')}
                      >
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('pdf')}
                      >
                        Export PDF
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {quiz.map((question, qIndex) => (
                  <div key={qIndex} className="space-y-3">
                    <p className="font-medium">
                      {qIndex + 1}. {question.question}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {question.choices.map((choice, cIndex) => {
                        const isSelected = answers[qIndex] === cIndex
                        const isCorrect = question.answer === cIndex
                        let className = 'p-3 rounded-lg border text-left transition-all '

                        if (showResults) {
                          if (isCorrect) {
                            className += 'border-green-500 bg-green-50 dark:bg-green-950'
                          } else if (isSelected && !isCorrect) {
                            className += 'border-red-500 bg-red-50 dark:bg-red-950'
                          }
                        } else if (isSelected) {
                          className += 'border-primary bg-primary/5 ring-2 ring-primary'
                        } else {
                          className += 'hover:border-primary/50'
                        }

                        return (
                          <button
                            key={cIndex}
                            onClick={() => handleAnswer(qIndex, cIndex)}
                            className={className}
                            disabled={showResults}
                          >
                            <span className="font-medium mr-2">
                              {['A', 'B', 'C', 'D'][cIndex]}.
                            </span>
                            {choice}
                          </button>
                        )
                      })}
                    </div>
                    {showResults && question.explanation && (
                      <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    )}
                  </div>
                ))}

                {!showResults && (
                  <Button onClick={handleSubmit} className="w-full">
                    Submit Answers
                  </Button>
                )}

                {showResults && (
                  <Button
                    onClick={() => {
                      setQuiz(null)
                      setAnswers({})
                      setShowResults(false)
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Generate New Quiz
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {savedQuizzes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No saved quizzes yet. Generate your first quiz!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {savedQuizzes.map((savedQuiz) => (
                <Card key={savedQuiz.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          Quiz from {new Date(savedQuiz.createdAt).toLocaleDateString()}
                        </CardTitle>
                        <CardDescription>
                          {savedQuiz.questions.length} questions
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuiz(savedQuiz.questions)
                          setAnswers({})
                          setShowResults(false)
                        }}
                      >
                        Retake
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

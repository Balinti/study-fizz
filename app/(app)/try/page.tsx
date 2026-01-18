'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { setSelectedSchoolId, setSelectedCourseIds, getSelectedCourseIds } from '@/lib/local/storage'

// Demo school and courses (these would come from Supabase in production)
const DEMO_SCHOOL = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Demo University',
  email_domain: 'demo.edu',
}

const DEMO_COURSES = [
  { id: '00000000-0000-0000-0001-000000000001', code: 'CS101', title: 'Introduction to Computer Science' },
  { id: '00000000-0000-0000-0001-000000000002', code: 'CS201', title: 'Data Structures and Algorithms' },
  { id: '00000000-0000-0000-0001-000000000003', code: 'CS301', title: 'Database Systems' },
  { id: '00000000-0000-0000-0001-000000000004', code: 'MATH101', title: 'Calculus I' },
  { id: '00000000-0000-0000-0001-000000000005', code: 'MATH201', title: 'Linear Algebra' },
  { id: '00000000-0000-0000-0001-000000000006', code: 'PHYS101', title: 'Physics I: Mechanics' },
  { id: '00000000-0000-0000-0001-000000000007', code: 'CHEM101', title: 'General Chemistry' },
  { id: '00000000-0000-0000-0001-000000000008', code: 'BIO101', title: 'Introduction to Biology' },
  { id: '00000000-0000-0000-0001-000000000009', code: 'ECON101', title: 'Principles of Economics' },
  { id: '00000000-0000-0000-0001-000000000010', code: 'ECON201', title: 'Microeconomics' },
  { id: '00000000-0000-0000-0001-000000000011', code: 'PSYCH101', title: 'Introduction to Psychology' },
  { id: '00000000-0000-0000-0001-000000000012', code: 'ENG101', title: 'English Composition' },
]

export default function TryPage() {
  const router = useRouter()
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  useEffect(() => {
    // Load any previously selected courses
    const saved = getSelectedCourseIds()
    if (saved.length > 0) {
      setSelectedCourses(saved)
    }
  }, [])

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId)
      }
      if (prev.length >= 5) {
        return prev // Max 5 courses
      }
      return [...prev, courseId]
    })
  }

  const handleContinue = () => {
    setSelectedSchoolId(DEMO_SCHOOL.id)
    setSelectedCourseIds(selectedCourses)

    if (selectedCourses.length > 0) {
      router.push(`/courses/${selectedCourses[0]}`)
    } else {
      router.push('/courses')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">Guest Mode</Badge>
        <h1 className="text-3xl font-bold mb-2">Welcome to Study-Fizz!</h1>
        <p className="text-muted-foreground">
          Choose your courses to get started. You can browse, ask questions, and use AI study tools without signing up.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏫</span>
            {DEMO_SCHOOL.name}
          </CardTitle>
          <CardDescription>
            Select up to 5 courses to explore. You can change this anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_COURSES.map((course) => (
              <button
                key={course.id}
                onClick={() => toggleCourse(course.id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedCourses.includes(course.id)
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-semibold">{course.code}</div>
                <div className="text-sm text-muted-foreground">{course.title}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {selectedCourses.length}/5 courses selected
        </p>
        <Button
          size="lg"
          onClick={handleContinue}
          className="px-8"
        >
          {selectedCourses.length > 0 ? 'Start Exploring' : 'Browse All Courses'}
        </Button>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">What you can do in Guest Mode:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Browse course hubs and read Q&A posts</li>
          <li>• Generate AI quizzes from your notes (5/day)</li>
          <li>• Browse marketplace listings</li>
          <li>• Create drafts (saved locally)</li>
        </ul>
        <p className="text-sm mt-4">
          <strong>Create a free account</strong> to save your progress, publish posts, and message other students.
        </p>
      </div>
    </div>
  )
}

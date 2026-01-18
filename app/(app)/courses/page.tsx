'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { getSelectedCourseIds } from '@/lib/local/storage'
import type { Course } from '@/lib/types'

// Demo courses fallback
const DEMO_COURSES: Course[] = [
  { id: '00000000-0000-0000-0001-000000000001', school_id: '00000000-0000-0000-0000-000000000001', code: 'CS101', title: 'Introduction to Computer Science', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000002', school_id: '00000000-0000-0000-0000-000000000001', code: 'CS201', title: 'Data Structures and Algorithms', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000003', school_id: '00000000-0000-0000-0000-000000000001', code: 'CS301', title: 'Database Systems', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000004', school_id: '00000000-0000-0000-0000-000000000001', code: 'MATH101', title: 'Calculus I', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000005', school_id: '00000000-0000-0000-0000-000000000001', code: 'MATH201', title: 'Linear Algebra', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000006', school_id: '00000000-0000-0000-0000-000000000001', code: 'PHYS101', title: 'Physics I: Mechanics', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000007', school_id: '00000000-0000-0000-0000-000000000001', code: 'CHEM101', title: 'General Chemistry', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000008', school_id: '00000000-0000-0000-0000-000000000001', code: 'BIO101', title: 'Introduction to Biology', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000009', school_id: '00000000-0000-0000-0000-000000000001', code: 'ECON101', title: 'Principles of Economics', created_at: '' },
  { id: '00000000-0000-0000-0001-000000000010', school_id: '00000000-0000-0000-0000-000000000001', code: 'ECON201', title: 'Microeconomics', created_at: '' },
]

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Load selected courses from localStorage
    setSelectedIds(getSelectedCourseIds())

    // Try to load courses from Supabase
    supabase
      .from('courses')
      .select('*')
      .order('code')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCourses(data)
        }
        setLoading(false)
      })
  }, [])

  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.title.toLowerCase().includes(search.toLowerCase())
  )

  const myCourses = filteredCourses.filter((c) => selectedIds.includes(c.id))
  const otherCourses = filteredCourses.filter((c) => !selectedIds.includes(c.id))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Hubs</h1>
          <p className="text-muted-foreground">Browse courses, ask questions, and share resources</p>
        </div>
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {myCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map((course) => (
              <CourseCard key={course.id} course={course} isMember />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">
          {myCourses.length > 0 ? 'All Courses' : 'Browse Courses'}
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-48 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CourseCard({ course, isMember }: { course: Course; isMember?: boolean }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{course.code}</CardTitle>
            {isMember && <Badge variant="secondary">Joined</Badge>}
          </div>
          <CardDescription>{course.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full">
            View Hub
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

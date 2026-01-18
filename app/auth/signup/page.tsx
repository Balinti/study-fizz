'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { migrateLocalDataToSupabase } from '@/lib/local/migrate'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // Migrate local data
        const migration = await migrateLocalDataToSupabase(data.user.id)
        if (migration.migrated.posts + migration.migrated.answers + migration.migrated.listings + migration.migrated.quizzes > 0) {
          toast.success(`Account created! Migrated ${Object.values(migration.migrated).reduce((a, b) => a + b, 0)} items.`)
        } else {
          toast.success('Account created!')
        }

        router.push('/courses')
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account')
      setLoading(false)
    }
  }

  // Check if email is a school email (for UI hints)
  const isSchoolEmail = form.email.includes('.edu')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">SF</span>
            </div>
            <span className="font-bold text-2xl">Study-Fizz</span>
          </Link>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Join the campus study community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
              {form.email && (
                <p className={`text-xs mt-1 ${isSchoolEmail ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {isSchoolEmail
                    ? '✓ School email detected'
                    : 'Use your .edu email for verified student status'}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Privacy-first approach:</p>
            <ul className="space-y-1">
              <li>• Your posts appear under a pseudonymous handle</li>
              <li>• Optional anonymous posting within courses</li>
              <li>• Your email is never shown publicly</li>
            </ul>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account?</span>{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/try" className="text-sm text-muted-foreground hover:underline">
              Continue as guest
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

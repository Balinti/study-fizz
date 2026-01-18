'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { hasMeaningfulAction, hasDismissedSignupPrompt, dismissSignupPrompt } from '@/lib/local/storage'

const navItems = [
  { href: '/courses', label: 'Courses' },
  { href: '/study', label: 'AI Study' },
  { href: '/marketplace', label: 'Marketplace' },
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Check if we should show signup prompt
    if (!user && hasMeaningfulAction() && !hasDismissedSignupPrompt()) {
      const timer = setTimeout(() => {
        setShowSignupPrompt(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleDismissPrompt = () => {
    dismissSignupPrompt()
    setShowSignupPrompt(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SF</span>
              </div>
              <span className="font-bold text-xl hidden sm:inline">Study-Fizz</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'text-sm',
                      pathname.startsWith(item.href) && 'font-semibold'
                    )}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-2">
              {!user && !loading && (
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                  Guest Mode
                </Badge>
              )}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <Link href="/account">
                  <Button variant="ghost" size="sm">
                    Account
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="hidden sm:block">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Signup Prompt Banner */}
      {showSignupPrompt && (
        <div className="bg-primary text-primary-foreground py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm">
              Save your progress! Create a free account to keep your quizzes and posts.
            </p>
            <div className="flex items-center gap-2">
              <Link href="/auth/signup">
                <Button size="sm" variant="secondary">
                  Sign up free
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismissPrompt}
                className="text-primary-foreground hover:bg-primary/80"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}

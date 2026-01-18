import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SF</span>
          </div>
          <span className="font-bold text-xl">Study-Fizz</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/auth/login">
            <Button variant="outline">Log in</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Your Campus Study Hub
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            A verified, pseudonymous course hub + campus marketplace with AI study tools.
            Works immediately without signup.
          </p>
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/try">
              <Button size="lg" className="text-lg px-8">
                Try it now
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Create account
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                Course Hub
              </CardTitle>
              <CardDescription>
                Connect with classmates, ask questions, and share resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Q&A for every course</li>
                <li>• Anonymous posting option</li>
                <li>• Accept best answers</li>
                <li>• Resource sharing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Study Tools
              </CardTitle>
              <CardDescription>
                Generate quizzes from your notes instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Paste notes, get quizzes</li>
                <li>• 5 free quizzes per day</li>
                <li>• Export to PDF/CSV (Pro)</li>
                <li>• Save and review later</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                Campus Marketplace
              </CardTitle>
              <CardDescription>
                Buy and sell with verified students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Textbooks & electronics</li>
                <li>• Campus pickup locations</li>
                <li>• Direct messaging</li>
                <li>• Report & block users</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-12">How it works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Try instantly</h3>
              <p className="text-sm text-muted-foreground">
                No signup required. Start exploring courses and using AI tools right away.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Explore & engage</h3>
              <p className="text-sm text-muted-foreground">
                Browse course hubs, generate quizzes, or check out marketplace listings.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Save your progress</h3>
              <p className="text-sm text-muted-foreground">
                Create a free account to save your quizzes, posts, and connect with others.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Go Pro</h3>
              <p className="text-sm text-muted-foreground">
                Unlock unlimited AI quizzes, exports, and premium features.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center pb-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to boost your grades?</CardTitle>
              <CardDescription>
                Start using Study-Fizz now - no account required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/try">
                <Button size="lg" className="w-full max-w-xs">
                  Try it now - Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div>© 2024 Study-Fizz. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

# Study-Fizz

A verified, pseudonymous course hub + campus marketplace with AI study tools (quiz generation) that works immediately without signup, then offers "Save your progress" via Supabase Auth and Pro subscriptions via Stripe.

## Features

- **Anonymous-first experience**: Use the app for 3-5 minutes without signing up
- **Course Hubs**: Q&A, resource sharing, anonymous posting (1/day for logged-in users)
- **AI Study Tools**: Generate quizzes from notes (5 free/day, unlimited with Pro)
- **Campus Marketplace**: Buy/sell with verified students, messaging, reporting
- **Pseudonymous Profiles**: Privacy-first with customizable handles
- **Pro Subscriptions**: Stripe-powered billing for premium features

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe (Subscriptions, Billing Portal)
- **AI**: OpenAI API (quiz generation, content moderation)

## File Structure

```
study-fizz/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── (app)/                      # App routes (with nav shell)
│   │   ├── layout.tsx              # App shell with navigation
│   │   ├── try/page.tsx            # Anonymous-first entry point
│   │   ├── courses/page.tsx        # Browse courses
│   │   ├── courses/[courseId]/page.tsx          # Course hub
│   │   ├── courses/[courseId]/posts/[postId]/page.tsx  # Post detail
│   │   ├── marketplace/page.tsx    # Browse listings
│   │   ├── marketplace/new/page.tsx # Create listing
│   │   ├── study/page.tsx          # AI quiz generator
│   │   ├── account/page.tsx        # Profile & subscription
│   │   └── pricing/page.tsx        # Pricing plans
│   ├── auth/
│   │   ├── login/page.tsx          # Login
│   │   ├── signup/page.tsx         # Signup
│   │   └── callback/route.ts       # Auth callback
│   └── api/
│       ├── ai/generate-quiz/route.ts
│       ├── posts/create/route.ts
│       ├── posts/accept/route.ts
│       ├── answers/create/route.ts
│       ├── listings/create/route.ts
│       ├── reports/create/route.ts
│       └── stripe/
│           ├── checkout/route.ts
│           ├── portal/route.ts
│           └── webhook/route.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # Server-side Supabase client
│   │   ├── client.ts               # Browser Supabase client
│   │   └── middleware.ts           # Session refresh helper
│   ├── auth.ts                     # Auth utilities
│   ├── stripe.ts                   # Stripe client
│   ├── types.ts                    # TypeScript types
│   ├── local/
│   │   ├── storage.ts              # LocalStorage helpers
│   │   └── migrate.ts              # Local → Supabase migration
│   └── ai/
│       ├── prompts.ts              # AI prompts & moderation
│       └── quota.ts                # Usage quota management
├── supabase/
│   ├── schema.sql                  # Database schema
│   ├── rls.sql                     # Row Level Security policies
│   └── seed.sql                    # Demo data
├── components/ui/                  # shadcn/ui components
└── middleware.ts                   # Supabase session middleware
```

## Database Schema

### Tables

- **schools**: Campus/university info with email domains
- **profiles**: User profiles (handle, avatar, school)
- **courses**: Course catalog per school
- **course_memberships**: User-course relationships
- **posts**: Q&A posts in course hubs
- **answers**: Answers to posts
- **post_accepts**: Accepted answer tracking
- **listings**: Marketplace listings
- **listing_images**: Listing photos (Supabase Storage)
- **threads**: Messaging threads
- **thread_members**: Thread participants
- **messages**: Thread messages
- **reports**: Content/user reports
- **blocks**: User blocks
- **ai_quizzes**: Saved AI-generated quizzes
- **ai_usage_daily**: Daily AI usage tracking
- **subscriptions**: Stripe subscription status

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/ai/generate-quiz` | POST | Generate quiz from notes |
| `/api/posts/create` | POST | Create a course hub post |
| `/api/posts/accept` | POST | Accept an answer |
| `/api/answers/create` | POST | Submit an answer |
| `/api/listings/create` | POST | Create marketplace listing |
| `/api/reports/create` | POST | Report content/user |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/portal` | POST | Create Stripe billing portal session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |

## Environment Variables

### Required (Supabase)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Required (App)

```env
NEXT_PUBLIC_APP_URL=https://study-fizz.vercel.app
```

### Optional (Stripe - for Pro subscriptions)

```env
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_STUDY_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_STUDY_ANNUAL_PRICE_ID=price_...
```

### Optional (OpenAI - for AI features)

```env
OPENAI_API_KEY=sk-...
```

## Anonymous Mode

### How it works

1. Users can browse courses, generate quiz previews, and create drafts without signing up
2. Data is stored in localStorage under these keys:
   - `sf:selectedSchoolId` - Selected demo school
   - `sf:selectedCourseIds` - Joined courses
   - `sf:draftPosts` - Unpublished posts
   - `sf:draftAnswers` - Unpublished answers
   - `sf:draftListings` - Unpublished listings
   - `sf:aiQuizzes` - Generated quizzes
   - `sf:aiUsage` - Daily quota tracking
   - `sf:hasMeaningfulAction` - Triggers signup prompt
   - `sf:dismissedSignupPrompt` - Prompt dismissed

### Migration on signup

When a user creates an account, the `migrateLocalDataToSupabase()` function:
1. Creates course memberships for selected courses
2. Publishes draft posts and answers
3. Creates listings from drafts
4. Saves quizzes to the database
5. Clears localStorage after successful migration

## Stripe Webhook Behavior

The webhook endpoint at `/api/stripe/webhook` handles:

- `checkout.session.completed`: Creates/updates subscription record
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Marks subscription as canceled

**Important**: All checkout sessions include metadata:
```json
{
  "supabase_user_id": "user-uuid",
  "app_name": "study-fizz"
}
```

This metadata is used to link Stripe customers to Supabase users.

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

This app is designed for deployment on Vercel:

```bash
# Deploy
npx vercel --prod

# Link environment variables
# Add all required env vars in Vercel dashboard
```

## License

MIT

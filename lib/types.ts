export interface School {
  id: string
  name: string
  email_domain: string
  created_at: string
}

export interface Course {
  id: string
  school_id: string
  code: string
  title: string
  created_at: string
}

export interface Profile {
  user_id: string
  handle: string
  avatar_url: string | null
  school_id: string | null
  created_at: string
}

export interface Post {
  id: string
  course_id: string
  author_id: string
  title: string
  body: string
  tags: string[]
  is_anon: boolean
  created_at: string
  // Joined fields
  author?: {
    handle: string
    avatar_url: string | null
  }
  answers_count?: number
  accepted_answer_id?: string | null
}

export interface Answer {
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
  // Joined fields
  author?: {
    handle: string
    avatar_url: string | null
  }
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string
  category: string
  price_cents: number
  condition: string
  pickup_area: string
  status: string
  created_at: string
  // Joined fields
  seller?: {
    handle: string
    avatar_url: string | null
  }
  images?: ListingImage[]
}

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string
  created_at: string
}

export interface Thread {
  id: string
  listing_id: string | null
  course_id: string | null
  created_at: string
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  body: string
  created_at: string
  // Joined fields
  sender?: {
    handle: string
    avatar_url: string | null
  }
}

export interface AIQuiz {
  id: string
  user_id: string
  course_id: string | null
  source_text: string
  questions: QuizQuestion[]
  created_at: string
}

export interface QuizQuestion {
  question: string
  choices: string[]
  answer: number
  explanation?: string
}

export interface Subscription {
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  status: string
  price_id: string
  current_period_end: string
  updated_at: string
}

export type ListingCategory =
  | 'textbooks'
  | 'electronics'
  | 'furniture'
  | 'clothing'
  | 'tickets'
  | 'services'
  | 'other'

export type ListingCondition =
  | 'new'
  | 'like_new'
  | 'good'
  | 'fair'
  | 'poor'

export const LISTING_CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: 'textbooks', label: 'Textbooks' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'tickets', label: 'Tickets & Events' },
  { value: 'services', label: 'Services' },
  { value: 'other', label: 'Other' },
]

export const LISTING_CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export const PICKUP_AREAS = [
  'Main Campus - Student Center',
  'Main Campus - Library',
  'Main Campus - Dorms',
  'North Campus',
  'South Campus',
  'Off Campus - Coffee Shop',
  'Flexible / Meetup',
]

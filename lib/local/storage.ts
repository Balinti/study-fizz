// LocalStorage keys and types for anonymous mode

export const STORAGE_KEYS = {
  SELECTED_SCHOOL_ID: 'sf:selectedSchoolId',
  SELECTED_COURSE_IDS: 'sf:selectedCourseIds',
  DRAFT_POSTS: 'sf:draftPosts',
  DRAFT_ANSWERS: 'sf:draftAnswers',
  DRAFT_LISTINGS: 'sf:draftListings',
  AI_QUIZZES: 'sf:aiQuizzes',
  AI_USAGE: 'sf:aiUsage',
  HAS_MEANINGFUL_ACTION: 'sf:hasMeaningfulAction',
  DISMISSED_SIGNUP_PROMPT: 'sf:dismissedSignupPrompt',
} as const

export interface DraftPost {
  id: string
  courseId: string
  title: string
  body: string
  tags: string[]
  isAnon: boolean
  createdAt: string
}

export interface DraftAnswer {
  id: string
  postId: string
  body: string
  createdAt: string
}

export interface DraftListing {
  id: string
  title: string
  description: string
  category: string
  priceCents: number
  condition: string
  pickupArea: string
  imageUrls: string[]
  createdAt: string
}

export interface AIQuiz {
  id: string
  courseId?: string
  sourceText: string
  questions: QuizQuestion[]
  createdAt: string
}

export interface QuizQuestion {
  question: string
  choices: string[]
  answer: number
  explanation?: string
}

export interface AIUsage {
  day: string
  count: number
}

// Helper functions
export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

// Specific getters/setters
export function getSelectedSchoolId(): string | null {
  return getItem<string | null>(STORAGE_KEYS.SELECTED_SCHOOL_ID, null)
}

export function setSelectedSchoolId(id: string): void {
  setItem(STORAGE_KEYS.SELECTED_SCHOOL_ID, id)
}

export function getSelectedCourseIds(): string[] {
  return getItem<string[]>(STORAGE_KEYS.SELECTED_COURSE_IDS, [])
}

export function setSelectedCourseIds(ids: string[]): void {
  setItem(STORAGE_KEYS.SELECTED_COURSE_IDS, ids)
}

export function getDraftPosts(): DraftPost[] {
  return getItem<DraftPost[]>(STORAGE_KEYS.DRAFT_POSTS, [])
}

export function addDraftPost(post: DraftPost): void {
  const posts = getDraftPosts()
  posts.push(post)
  setItem(STORAGE_KEYS.DRAFT_POSTS, posts)
  markMeaningfulAction()
}

export function getDraftAnswers(): DraftAnswer[] {
  return getItem<DraftAnswer[]>(STORAGE_KEYS.DRAFT_ANSWERS, [])
}

export function addDraftAnswer(answer: DraftAnswer): void {
  const answers = getDraftAnswers()
  answers.push(answer)
  setItem(STORAGE_KEYS.DRAFT_ANSWERS, answers)
  markMeaningfulAction()
}

export function getDraftListings(): DraftListing[] {
  return getItem<DraftListing[]>(STORAGE_KEYS.DRAFT_LISTINGS, [])
}

export function addDraftListing(listing: DraftListing): void {
  const listings = getDraftListings()
  listings.push(listing)
  setItem(STORAGE_KEYS.DRAFT_LISTINGS, listings)
  markMeaningfulAction()
}

export function getAIQuizzes(): AIQuiz[] {
  return getItem<AIQuiz[]>(STORAGE_KEYS.AI_QUIZZES, [])
}

export function addAIQuiz(quiz: AIQuiz): void {
  const quizzes = getAIQuizzes()
  quizzes.push(quiz)
  setItem(STORAGE_KEYS.AI_QUIZZES, quizzes)
  markMeaningfulAction()
}

export function getAIUsage(): AIUsage {
  const today = new Date().toISOString().split('T')[0]
  const usage = getItem<AIUsage>(STORAGE_KEYS.AI_USAGE, { day: today, count: 0 })
  if (usage.day !== today) {
    return { day: today, count: 0 }
  }
  return usage
}

export function incrementAIUsage(): AIUsage {
  const usage = getAIUsage()
  usage.count++
  setItem(STORAGE_KEYS.AI_USAGE, usage)
  return usage
}

export function hasMeaningfulAction(): boolean {
  return getItem<boolean>(STORAGE_KEYS.HAS_MEANINGFUL_ACTION, false)
}

export function markMeaningfulAction(): void {
  setItem(STORAGE_KEYS.HAS_MEANINGFUL_ACTION, true)
}

export function hasDismissedSignupPrompt(): boolean {
  return getItem<boolean>(STORAGE_KEYS.DISMISSED_SIGNUP_PROMPT, false)
}

export function dismissSignupPrompt(): void {
  setItem(STORAGE_KEYS.DISMISSED_SIGNUP_PROMPT, true)
}

export function clearAllLocalData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeItem(key)
  })
}

export function getAllLocalData() {
  return {
    selectedSchoolId: getSelectedSchoolId(),
    selectedCourseIds: getSelectedCourseIds(),
    draftPosts: getDraftPosts(),
    draftAnswers: getDraftAnswers(),
    draftListings: getDraftListings(),
    aiQuizzes: getAIQuizzes(),
    aiUsage: getAIUsage(),
  }
}

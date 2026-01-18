export const QUIZ_GENERATION_PROMPT = `You are an educational quiz generator. Given the following study notes, create a quiz with exactly 5 multiple-choice questions.

Each question should:
1. Test understanding of key concepts from the notes
2. Have 4 answer choices labeled A, B, C, D
3. Have exactly one correct answer
4. Include a brief explanation of why the answer is correct

Respond in the following JSON format ONLY (no markdown, no extra text):
{
  "questions": [
    {
      "question": "The question text",
      "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
      "answer": 0,
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}

Notes to create quiz from:
`

export const MODERATION_KEYWORDS = [
  'hate',
  'violence',
  'harassment',
  'threat',
  'abuse',
  'spam',
  'scam',
  'phishing',
]

export function basicContentCheck(text: string): { flagged: boolean; reason?: string } {
  const lowerText = text.toLowerCase()

  for (const keyword of MODERATION_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        flagged: true,
        reason: `Content may violate community guidelines`,
      }
    }
  }

  return { flagged: false }
}

export async function moderateContent(text: string): Promise<{ flagged: boolean; reason?: string }> {
  // If OpenAI is available, use their moderation API
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: text }),
      })

      if (response.ok) {
        const data = await response.json()
        const result = data.results[0]
        if (result.flagged) {
          const categories = Object.entries(result.categories)
            .filter(([, value]) => value)
            .map(([key]) => key)
          return {
            flagged: true,
            reason: `Content flagged for: ${categories.join(', ')}`,
          }
        }
        return { flagged: false }
      }
    } catch (e) {
      console.error('Moderation API error:', e)
    }
  }

  // Fallback to basic check
  return basicContentCheck(text)
}

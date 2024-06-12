import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import 'server-only'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const configuration = {
  apiKey: process.env.OPENAI_API_KEY
}

const openai = new OpenAI(configuration)

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        }
      }
    }
  )
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth({ cookieStore }))?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    configuration.apiKey = previewToken
  }

  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: messages[messages.length - 1].content
  })

  const {
    data: [{ embedding }]
  } = await queryEmbedding

  const { data: reviews, error: matchError } = await supabase
    .rpc('match_reviews', {
      query_embedding: embedding,
      match_threshold: 0.8
    })
    .select(
      'review_title, review_likes, review_dislikes, review_problem, review_recommendations'
    )
    .limit(20)

  if (matchError) {
    return new Response('Failed to fetch reviews', { status: 500 })
  }

  const reviewMessages = reviews.map(review => ({
    content: `Review: ${review.review_title}. Likes: ${review.review_likes}, Dislikes: ${review.review_dislikes}. Problems: ${review.review_problem}. Recommendations: ${review.review_recommendations}`,
    role: 'system'
  }))

  const combinedMessages = [...reviewMessages, ...messages]

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: combinedMessages,
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...combinedMessages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }
      await supabase.from('chats').upsert({ id, payload }).throwOnError()
    }
  })

  return new StreamingTextResponse(stream)
}

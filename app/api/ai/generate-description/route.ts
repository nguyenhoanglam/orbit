import { streamText } from 'ai'
import { getOpenAI } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { getLimits } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { title, teamId } = await req.json() as { title: string; teamId: string }

  if (!title?.trim()) {
    return new Response('title is required', { status: 400 })
  }

  // Gate behind Pro plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('team_id', teamId)
    .single()

  const plan = (subscription?.plan ?? 'lite') as Plan
  if (!getLimits(plan).aiEnabled) {
    return new Response('AI features require a Pro plan.', { status: 403 })
  }

  const openai = getOpenAI()
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system:
      'You are a helpful project management assistant. Write clear, concise task descriptions in 2-4 sentences. Focus on what needs to be done, acceptance criteria, and any relevant context. Use plain text only.',
    prompt: `Write a task description for: "${title}"`,
    maxOutputTokens: 200,
  })

  return result.toTextStreamResponse()
}

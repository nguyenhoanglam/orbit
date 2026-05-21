import { streamObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/ai'
import { createClient } from '@/lib/supabase/server'
import { getLimits } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { title, description, teamId } = await req.json() as {
    title: string
    description?: string
    teamId: string
  }

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
  const result = streamObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      subtasks: z.array(
        z.object({
          title: z.string().describe('Short, actionable subtask title'),
          description: z.string().optional().describe('Brief description (1-2 sentences)'),
        })
      ).min(2).max(8),
    }),
    system:
      'You are a helpful project management assistant. Break down the given task into concrete, actionable subtasks. Each subtask should be completable in hours, not days. Return 2-8 subtasks.',
    prompt: `Break down this task into subtasks:\nTitle: "${title}"${description ? `\nDescription: "${description}"` : ''}`,
  })

  return result.toTextStreamResponse()
}
